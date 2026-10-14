import {boundedJSON,gatewayError} from './tokendance.js';
import {modelError,abortError} from './model-response.js';
import {modelReceipt,envelopeReceipt,headerReceipt} from './model-audit.js';
import {validateArtifact} from './generated-core.js';
import {generationLimits} from './generation-policy.js';
export {generationLimits} from './generation-policy.js';
export function generationWatchdog(signal,limits=generationLimits){
 const controller=new AbortController();let first=true,idle;
 const expire=()=>controller.abort(new DOMException('Generation timed out','TimeoutError'));
 const total=Number.isFinite(limits.total_ms)&&limits.total_ms>0?setTimeout(expire,limits.total_ms):null;
 const external=()=>controller.abort(signal.reason||new DOMException('Cancelled','AbortError'));
 function activity(){first=false;clearTimeout(idle);idle=setTimeout(expire,limits.idle_ms);}
 idle=setTimeout(expire,limits.initial_ms);signal?.addEventListener('abort',external,{once:true});if(signal?.aborted)external();
 return {signal:controller.signal,activity,abort(){controller.abort(new DOMException('Cancelled','AbortError'));},dispose(){clearTimeout(total);clearTimeout(idle);signal?.removeEventListener('abort',external);},get waitingForResponse(){return first;}};
}
export async function readGenerationResponse(response,{key,model,signal,onProgress=()=>{},onActivity=()=>{},normalized=false,platformModels=[]}={}){
 let receipt=normalized?headerReceipt(model,response,key,platformModels):modelReceipt(model,{httpStatus:response.status},key),codeParts=[],reasoningChars=0,codeChars=0,tail='',codeTail='',finished=false,result=null;
 const update=(phase)=>onProgress({phase,reasoningChars,codeChars,receipt});
 function fail(code){const error=modelError(code,{received:true,status:response.status});error.receipt=receipt;return error;}
 function audit(value){receipt=normalized?modelReceipt(model,value.receipt,key,platformModels):envelopeReceipt(model,value,response,key,receipt,platformModels);if(receipt.modelStatus==='mismatch')throw fail('model-mismatch');}
 function parseCode(content){if(typeof content!=='string'||!content.trim())throw fail('empty');if(content.includes(key))throw fail('unsafe');let value;try{value=JSON.parse(content.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{throw fail('json');}try{return validateArtifact(value);}catch{throw fail('schema');}}
 if(!response.ok){const error=gatewayError(response);throw Object.assign(modelError(error.message,{received:true,status:response.status,recovery:error.recovery}),{receipt});}
 onActivity();update('waiting');
 if(!response.headers.get('Content-Type')?.includes('text/event-stream')){
  let value;try{value=await boundedJSON(response,Infinity);}catch{if(signal?.aborted)throw Object.assign(abortError(signal),{received:true,httpStatus:response.status,receipt});throw fail('response-json');}
  if(JSON.stringify(value).includes(key))throw fail('unsafe');
  if(normalized){receipt=modelReceipt(model,{...receipt,...value.receipt},key,platformModels);if(receipt.modelStatus==='mismatch')throw fail('model-mismatch');try{return {artifact:validateArtifact(value.artifact||value),receipt};}catch{throw fail('schema');}}
  audit(value);update('code');if(['length','max_tokens'].includes(receipt.finishReason))throw fail('truncated');return {artifact:parseCode(value.choices?.[0]?.message?.content),receipt};
 }
 if(!response.body)throw fail('response-json');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
 const abort=()=>reader.cancel().catch(()=>{});signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 function event(block){
  const lines=block.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).replace(/^ /,''));if(!lines.length)return;
  const data=lines.join('\n');if(data==='[DONE]'){finished=true;return;}let value;try{value=JSON.parse(data);}catch{throw fail('response-json');}
  if(JSON.stringify(value).includes(key))throw fail('unsafe');
  if(normalized){
   receipt=modelReceipt(model,value.receipt||receipt,key,platformModels);if(receipt.modelStatus==='mismatch')throw fail('model-mismatch');
   if(value.type==='progress'){reasoningChars=Number.isSafeInteger(value.reasoningChars)?Math.max(0,value.reasoningChars):reasoningChars;codeChars=Number.isSafeInteger(value.codeChars)?Math.max(0,value.codeChars):codeChars;update(['thinking','code','validating'].includes(value.phase)?value.phase:'waiting');}
   else if(value.type==='result'){try{result=validateArtifact(value.artifact);}catch{throw fail('schema');}finished=true;}
   else if(value.type==='error'){const error=fail(['model-mismatch','timeout','cancelled','stream-interrupted','truncated','empty','json','schema','unsafe','network','auth','limit','model','response-json'].includes(value.diagnostic?.code)?value.diagnostic.code:'response-json');error.recovery=value.recovery;throw error;}
   return;
  }
  if(value.error)throw fail('model');audit(value);
  const choice=value.choices?.[0],delta=choice?.delta;
  if(typeof delta?.reasoning_content==='string'){reasoningChars+=delta.reasoning_content.length;tail=(tail+delta.reasoning_content);if(tail.includes(key))throw fail('unsafe');tail=tail.slice(-Math.max(1,key.length-1));}
  if(typeof delta?.content==='string'){codeParts.push(delta.content);codeChars+=delta.content.length;codeTail+=delta.content;if(codeTail.includes(key))throw fail('unsafe');codeTail=codeTail.slice(-Math.max(1,key.length-1));}
  update(codeChars?'code':reasoningChars?'thinking':'waiting');
  if(['length','max_tokens'].includes(receipt.finishReason))throw fail('truncated');
 }
 try{
  for(;;){if(signal?.aborted)throw Object.assign(abortError(signal),{received:true,httpStatus:response.status,receipt});const {done,value}=await reader.read();if(signal?.aborted)throw Object.assign(abortError(signal),{received:true,httpStatus:response.status,receipt});if(done)break;onActivity();buffer=(buffer+decoder.decode(value,{stream:true})).replace(/\r\n/g,'\n');let boundary;while((boundary=buffer.indexOf('\n\n'))!==-1){event(buffer.slice(0,boundary));buffer=buffer.slice(boundary+2);if(finished)break;}if(finished)break;}
  if(!finished){buffer+=decoder.decode();if(buffer.trim())event(buffer);}
  if(!finished&&receipt.finishReason!=='stop')throw fail('stream-interrupted');
  if(normalized){if(!result)throw fail('stream-interrupted');return {artifact:result,receipt};}
  update('validating');return {artifact:parseCode(codeParts.join('')),receipt};
 }catch(error){if(signal?.aborted)throw Object.assign(abortError(signal),{received:true,httpStatus:response.status,receipt});if(error.code)throw error;throw fail('stream-interrupted');}
 finally{signal?.removeEventListener('abort',abort);await reader.cancel().catch(()=>{});reader.releaseLock();}
}
