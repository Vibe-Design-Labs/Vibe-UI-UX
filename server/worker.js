import {readGenerationResponse,generationWatchdog} from './generation-stream.js';
import {modelReceipt,receiptHeaders} from './model-audit.js';
import {generationPrompt,validateArtifact} from './generated-core.js';
import {parseModelResponse,diagnostic} from './model-response.js';
import assets from './assets.js';
import catalog from './catalog.js';
import compilerData from './compiler-data.js';
import {compilerPrompt,validateModelIntent} from './compiler-core.js';
import {validateSuggestions} from './core.js';
import {tokenDanceEndpoint as endpoint, modelsEndpoint, exchangeEndpoint, validKey, validVerifier, gatewayError, compatibleModels, applicationURL, suggestionBody} from './tokendance.js';
const security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"};
const json=(value,status=200,extraHeaders={})=>new Response(JSON.stringify(value),{status,headers:{...security,...extraHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function translate(request,upstream=fetch){if(request.method!=='POST')return json({error:'method'},405);const url=new URL(request.url),origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'origin'},403);if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'input'},415);
 const key=request.headers.get('X-TokenDance-Key');if(!key||key.length>512||/[\r\n]/.test(key))return json({error:'auth'},401);
 let value;try{const text=await boundedText(request,16000);value=JSON.parse(text);}catch{return json({error:'input'},400);}
 if(typeof value.intent!=='string'||!value.intent.trim()||value.intent.length>2000||typeof value.model!=='string'||!/^[a-zA-Z0-9._:/-]{1,120}$/.test(value.model)||!['zh-CN','en','ja','ko','de'].includes(value.locale))return json({error:'input'},400);
 if(value.task!==undefined&&!['compile','generate'].includes(value.task))return json({error:'input'},400);
 const streamControl=value.task==='generate'?generationWatchdog(request.signal):null;
 const upstreamSignal=streamControl?.signal||AbortSignal.timeout(value.task==='compile'?85000:35000);
 try{const response=await upstream(endpoint,{method:'POST',redirect:'error',signal:upstreamSignal,headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json','X-App-URL':applicationURL(new URL('/',request.url))},body:JSON.stringify(value.task==='generate'?generationPrompt(value):value.task==='compile'?compilerPrompt(catalog.items,compilerData,value):suggestionBody(catalog.items,value))});
 if(value.task==='generate'){
  if(response.ok&&response.headers.get('Content-Type')?.includes('text/event-stream'))return generatedRelay(response,value.model,key,streamControl);
  let receipt=modelReceipt(value.model,{httpStatus:response.status},key);
  try{const generated=await readGenerationResponse(response,{key,model:value.model,signal:upstreamSignal,onActivity:streamControl.activity,onProgress(progress){receipt=progress.receipt;}});return json(generated.artifact,200,receiptHeaders(generated.receipt));}
  catch(error){return json({error:error.message,diagnostic:diagnostic(error),receipt:error.receipt||receipt,...(error.recovery?{recovery:error.recovery}:{})},error.message==='auth'?401:error.message==='limit'?429:502);}
  finally{streamControl.dispose();}
 }
 if(value.task){try{return json(await parseModelResponse(response,key,v=>validateModelIntent(v,catalog,compilerData,value.intent),{expectedModel:value.model}));}catch(error){if(upstreamSignal.aborted){error.code='timeout';error.received=true;error.httpStatus=response.status;}return json({error:error.message,diagnostic:diagnostic(error),...(error.receipt?{receipt:error.receipt}:{}),...(error.recovery?{recovery:error.recovery}:{})},error.message==='auth'?401:error.message==='limit'?429:502);}}
 if(!response.ok){const error=gatewayError(response);return json({error:error.message,...(error.recovery?{recovery:error.recovery}:{})},error.message==='auth'?401:error.message==='limit'?429:502);}
 let receipt;const candidates=await parseModelResponse(response,key,result=>validateSuggestions(result,catalog.items),{expectedModel:value.model,onAudit:value=>receipt=value});return json({candidates},200,receiptHeaders(receipt));
 }catch(error){streamControl?.dispose();if(error.code==='model-mismatch')return json({error:'model-mismatch',diagnostic:diagnostic(error),receipt:error.receipt},502);return json({... (value.task?{diagnostic:{code:error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'network',received:false,status:null}}:{}),error:error?.name==='TimeoutError'||error?.name==='AbortError'||error instanceof TypeError?'network':'format'},502);}
}
function generatedRelay(response,model,key,control){
 const encoder=new TextEncoder();let closed=false,receipt=modelReceipt(model,{httpStatus:response.status},key),last=0,lastActivity=0;
 const body=new ReadableStream({async start(controller){
  const emit=value=>{if(!closed)controller.enqueue(encoder.encode('data: '+JSON.stringify(value)+'\n\n'));};
  try{
   const result=await readGenerationResponse(response,{key,model,signal:control.signal,onActivity(){control.activity();if(Date.now()-lastActivity>10000&&!closed){lastActivity=Date.now();controller.enqueue(encoder.encode(': activity\n\n'));}},onProgress(progress){receipt=progress.receipt;if(Date.now()-last>250||progress.phase==='validating'){last=Date.now();emit({type:'progress',...progress});}}});
   emit({type:'result',artifact:result.artifact,receipt:result.receipt});
  }catch(error){emit({type:'error',diagnostic:diagnostic(error),receipt:error.receipt||receipt});}
  finally{control.dispose();if(!closed){closed=true;controller.close();}}
 },cancel(){closed=true;control.abort();control.dispose();}});
 return new Response(body,{headers:{...security,'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','X-IntentKit-Stream':'1'}});
}

async function boundedText(message,limit){if(!message.body)return '';const reader=message.body.getReader();const decoder=new TextDecoder();let size=0,text='';try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('Response too large');}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{reader.releaseLock();}}
export async function models(request,upstream=fetch){
 if(request.method!=='GET')return json({error:'method'},405);
 try{const response=await upstream(modelsEndpoint,{redirect:'error',credentials:'omit',signal:AbortSignal.timeout(15000)});if(!response.ok)return json({error:'network'},502);const data=compatibleModels(JSON.parse(await boundedText(response,600000)));if(!data.length)return json({error:'format'},502);return json({data:data.map(model=>({...model,supported_protocols:['openai:chat-completions']}))});}catch{return json({error:'network'},502);}
}
export async function authorize(request,upstream=fetch){
 if(request.method!=='POST')return json({error:'method'},405);
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'origin'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'input'},415);
 let value;try{value=JSON.parse(await boundedText(request,8000));}catch{return json({error:'input'},400);}
 if(typeof value.code!=='string'||!value.code.trim()||value.code.length>2048||!validVerifier(value.code_verifier)||value.code_challenge_method!=='S256')return json({error:'input'},400);
 try{const response=await upstream(exchangeEndpoint,{method:'POST',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(20000),headers:{'Content-Type':'application/json'},body:JSON.stringify({code:value.code,code_verifier:value.code_verifier,code_challenge_method:'S256'})});if(!response.ok)return json({error:response.status===400||response.status===403?'auth':'network'},response.status===400||response.status===403?403:502);const result=JSON.parse(await boundedText(response,8000));if(!validKey(result?.key))return json({error:'format'},502);return json({key:result.key});}catch{return json({error:'network'},502);}
}
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',svg:'image/svg+xml',zip:'application/zip',woff2:'font/woff2',png:'image/png',webp:'image/webp',jpg:'image/jpeg'};
export default {async fetch(request){const url=new URL(request.url);if(url.pathname==='/api/translate')return translate(request);if(url.pathname==='/api/models')return models(request);if(url.pathname==='/api/authorize')return authorize(request);if(request.method!=='GET'&&request.method!=='HEAD')return json({error:'method'},405);const path=url.pathname==='/'?'/index.html':url.pathname;const source=assets[path];if(!source)return new Response('Not found',{status:404,headers:security});const ext=path.split('.').pop();const assetSecurity={...security};if(path==='/generated-frame.html')delete assetSecurity['Content-Security-Policy'];const bytes=Uint8Array.from(atob(source),c=>c.charCodeAt(0));return new Response(request.method==='HEAD'?null:bytes,{headers:{...assetSecurity,'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache',...(ext==='zip'?{'Content-Disposition':'attachment; filename="intentkit-source.zip"'}:{})}});}};
