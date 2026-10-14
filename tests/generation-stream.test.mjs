import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {requestGeneratedEffect} from '../public/generation-client.js';
import {requestSuggestions} from '../public/client-byok.js';
import {generationPrompt} from '../public/generated-core.js';
import {modelReceipt,transportReceipt} from '../public/model-audit.js';
import {translate,models} from '../dist/server/index.js';
const artifact=JSON.parse(await readFile(new URL('./fixtures/generated-effect.json',import.meta.url))),key='mock-stream-secret-only',input={key,intent:'Build six paper layers with pointer parallax.',model:'kimi-k3',locale:'en',mode:'direct',platformModels:['kimi-k3','deepseek-v4-pro-0813']};
const encode=value=>'data: '+JSON.stringify(value)+'\r\n\r\n',wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function completionFrames(model=input.model,payload=artifact){const s=JSON.stringify(payload);return [encode({id:'chatcmpl-test',model,choices:[{delta:{reasoning_content:'Plan the six layers'},finish_reason:null}]}),...Array.from({length:Math.ceil(s.length/150)},(_,i)=>encode({id:'chatcmpl-test',model,choices:[{delta:{content:s.slice(i*150,i*150+150)},finish_reason:null}]})),encode({model,choices:[{delta:{},finish_reason:'stop'}]}),'data: [DONE]\r\n\r\n'];}
function sse(frames,delay=0,fragment=Infinity){let cancelled=false;const body=new ReadableStream({async start(controller){try{for(const frame of frames){if(delay)await wait(delay);const bytes=new TextEncoder().encode(frame);for(let i=0;i<bytes.length;i+=fragment){if(cancelled)return;controller.enqueue(bytes.slice(i,i+fragment));}}if(!cancelled)controller.close();}catch{if(!cancelled)controller.error(new Error('test stream interrupted'));}},cancel(){cancelled=true;}});return new Response(body,{headers:{'Content-Type':'text/event-stream','X-Request-Id':'gateway-test-id'}});}
test('Kimi K3 code request uses exact model, streamed JSON and documented reasoning; no alternate models',()=>{
 const prompt=generationPrompt(input);assert.equal(prompt.model,'kimi-k3');assert.equal(prompt.stream,true);assert.equal(prompt.max_tokens,undefined);assert.equal(prompt.max_completion_tokens,undefined);assert.equal(prompt.reasoning_effort,'high');assert.deepEqual(prompt.response_format,{type:'json_object'});assert.equal(prompt.models,undefined);assert.equal(prompt.temperature,undefined);assert.equal(prompt.thinking,undefined);
 const other=generationPrompt({...input,model:'deepseek-v4-pro-0813'});assert.equal(other.reasoning_effort,undefined);assert.equal(other.response_format,undefined);assert.equal(other.model,'deepseek-v4-pro-0813');
});
test('SSE survives split UTF-8, CRLF, fragmented events and separate reasoning; actual code and receipt stay exact',async()=>{
 const phases=[],receipts=[];let calls=0;const unicode={...artifact,title:'风有了形状 🏞'};
 const result=await requestGeneratedEffect({...input,onProgress:p=>phases.push(p),onReceipt:r=>receipts.push(r)},async(_,options)=>{calls++;assert.equal(JSON.parse(options.body).model,input.model);return sse(completionFrames(input.model,unicode),0,7);});
 assert.deepEqual(result,unicode);assert.equal(calls,1);assert(phases.some(p=>p.phase==='thinking'));assert(phases.some(p=>p.phase==='code'));assert(!JSON.stringify(phases).includes('Plan the six layers'));assert.equal(receipts.at(-1).reportedModel,'kimi-k3');assert.equal(receipts.at(-1).modelStatus,'matching');assert.equal(receipts.at(-1).requestId,'gateway-test-id');
});
test('SSE completion resolves at the terminal marker even if the upstream connection stays open',async()=>{
 let cancelled=false;
 const body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(completionFrames().join('')));},cancel(){cancelled=true;}});
 const response=new Response(body,{headers:{'Content-Type':'text/event-stream'}});
 const result=await requestGeneratedEffect({...input,limits:{initial_ms:100,idle_ms:100,total_ms:200}},async()=>response);
 assert.deepEqual(result,artifact);assert.equal(cancelled,true);
});
test('reported DeepSeek model for a Kimi request is rejected before rendering, with one request and no retry',async()=>{
 for(const response of [sse(completionFrames('deepseek-v4-pro-0813')),Response.json({model:'deepseek-v4-pro-0813',id:'chatcmpl-other',choices:[{message:{content:JSON.stringify(artifact)},finish_reason:'stop'}]})]){let calls=0;await assert.rejects(requestGeneratedEffect(input,async()=>{calls++;return response;}),e=>e.code==='model-mismatch'&&e.receipt.requestedModel==='kimi-k3'&&e.receipt.reportedModel==='deepseek-v4-pro-0813');assert.equal(calls,1);}
});
test('an unreported model remains explicitly unconfirmed, never fabricated as the requested model',async()=>{
 let receipt;assert.deepEqual(await requestGeneratedEffect({...input,onReceipt:r=>receipt=r},async()=>Response.json({choices:[{message:{content:JSON.stringify(artifact)}}]})),artifact);assert.equal(receipt.reportedModel,null);assert.equal(receipt.modelStatus,'unknown');
 const sanitized=modelReceipt(input.model,{reportedModel:key,responseId:key,requestId:'sk-'+'x'.repeat(24)},key);assert.equal(sanitized.reportedModel,null);assert.equal(sanitized.requestId,null);assert(!JSON.stringify(sanitized).includes(key));
});
test('an unrecognized upstream label can return valid code but stays unconfirmed, never aliased to K3',async()=>{
 for(const response of [sse(completionFrames('qianfan-vl-v1')),Response.json({model:'qianfan-vl-v1',choices:[{message:{content:JSON.stringify(artifact)},finish_reason:'stop'}]})]){
  let receipt,calls=0;const result=await requestGeneratedEffect({...input,onReceipt:value=>receipt=value},async(_,options)=>{calls++;assert.equal(JSON.parse(options.body).model,'kimi-k3');return response;});assert.deepEqual(result,artifact);assert.equal(calls,1);assert.equal(receipt.reportedModel,'qianfan-vl-v1');assert.equal(receipt.platformModelRecognized,false);assert.equal(receipt.modelStatus,'unconfirmed');
 }
 assert.equal(modelReceipt(input.model,{reportedModel:'qianfan-vl-v1'},key,['kimi-k3','qianfan-vl-v1']).modelStatus,'mismatch');
});
test('unconfirmed labels do not bypass code validation, truncation or secret rejection',async()=>{
 await assert.rejects(requestGeneratedEffect(input,async()=>sse(completionFrames('qianfan-vl-v1',{...artifact,js:'export default function mount(){fetch("/private");}'}))),e=>e.code==='schema'&&e.receipt.modelStatus==='unconfirmed');await assert.rejects(requestGeneratedEffect(input,async()=>sse([encode({model:'qianfan-vl-v1',choices:[{delta:{content:'{}'},finish_reason:'length'}]})])),e=>e.code==='truncated');
});
test('relay uses its independently discovered public catalog to distinguish known mismatches from opaque upstream labels',async()=>{
 let reported='qianfan-vl-v1',paidCalls=0;const upstream=async(url)=>{if(url.endsWith('/models'))return Response.json({data:input.platformModels.map(id=>({id,supported_protocols:['openai:chat-completions']}))});paidCalls++;return sse(completionFrames(reported));};
 assert.equal((await models(new Request('https://intentkit.test/api/models'),upstream)).status,200);
 const request=()=>new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key},body:JSON.stringify({intent:input.intent,model:input.model,locale:'en',task:'generate'})});let receipt;const relay=await translate(request(),upstream);assert.deepEqual(await requestGeneratedEffect({...input,mode:'relay',onReceipt:value=>receipt=value},async()=>relay),artifact);assert.equal(receipt.modelStatus,'unconfirmed');reported='deepseek-v4-pro-0813';const mismatch=await translate(request(),upstream);await assert.rejects(requestGeneratedEffect({...input,mode:'relay'},async()=>mismatch),e=>e.code==='model-mismatch');assert.equal(paidCalls,2);
});
test('transport diagnostics retain sanitized request/response provenance without credentials, query or source text',async()=>{
 const response={url:'https://tokendance.space/gateway/v1/chat/completions?private=hidden#fragment',type:'cors',headers:new Headers({'Content-Type':'text/event-stream; charset=utf-8'})};
 const trace=transportReceipt('direct','https://tokendance.space/gateway/v1/chat/completions?key=hidden',response,key);
 assert.equal(trace.requestURL,'https://tokendance.space/gateway/v1/chat/completions');assert.equal(trace.responseURL,trace.requestURL);assert.equal(trace.responseType,'cors');assert.equal(trace.responseFormat,'text/event-stream');assert(!JSON.stringify(trace).includes('hidden'));
 assert.equal(transportReceipt('relay','https://user:password@example.test/api',null,key).requestURL,null);
 assert.equal(transportReceipt('direct','https://example.test/'+encodeURIComponent(key),null,key).requestURL,null);
 const traces=[];await assert.rejects(requestGeneratedEffect({...input,onTrace:t=>traces.push(t)},async()=>sse(completionFrames('deepseek-v4-pro-0813'))),e=>e.code==='model-mismatch');
 assert.equal(traces.length,2);assert.equal(traces[0].responseFormat,null);assert.equal(traces[1].responseFormat,'text/event-stream');assert.equal(traces[1].requestURL,trace.requestURL);assert(!JSON.stringify(traces).includes(key));
});
test('flowing output may exceed initial timeout, but inactivity, hard deadline and cancellation terminate without retries',async()=>{
 const frames=completionFrames();let calls=0;const result=await requestGeneratedEffect({...input,limits:{initial_ms:20,idle_ms:45,total_ms:2000}},async()=>{calls++;return sse(frames,8);});assert.deepEqual(result,artifact);assert.equal(calls,1);
 for(const limits of [{initial_ms:30,idle_ms:20,total_ms:500},{initial_ms:30,idle_ms:100,total_ms:35}]){let attempts=0;await assert.rejects(requestGeneratedEffect({...input,limits},async()=>{attempts++;return sse(frames,55);}),e=>e.code==='timeout');assert.equal(attempts,1);}
 const controller=new AbortController();setTimeout(()=>controller.abort(),15);await assert.rejects(requestGeneratedEffect({...input,signal:controller.signal},async()=>sse(frames,30)),e=>e.code==='cancelled');
});
test('truncated, cut, error and secret-bearing streams fail accurately without exposing bodies or thought text',async()=>{
 const cases=[['truncated',[encode({model:input.model,choices:[{delta:{content:'{}'},finish_reason:'length'}]})]],['stream-interrupted',[encode({model:input.model,choices:[{delta:{content:JSON.stringify(artifact)},finish_reason:null}]})]],['model',[encode({error:{message:'private gateway text'}})]],['unsafe',[encode({model:input.model,choices:[{delta:{reasoning_content:key.slice(0,10)},finish_reason:null}]}),encode({model:input.model,choices:[{delta:{reasoning_content:key.slice(10)},finish_reason:null}]})]]];
 for(const [code,frames]of cases)await assert.rejects(requestGeneratedEffect(input,async()=>sse(frames)),e=>e.code===code&&!e.message.includes(key)&&!e.message.includes('private'));
});
test('relay streams only safe progress and validated code; browser gets exact receipt and original source',async()=>{
 let requestBody;
 const request=new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key},body:JSON.stringify({...input,key:undefined,mode:undefined,task:'generate'})});
 const relay=await translate(request,async(_,options)=>{requestBody=JSON.parse(options.body);return sse(completionFrames(),1);});assert.equal(relay.headers.get('X-IntentKit-Stream'),'1');
 const text=await relay.clone().text();assert(!text.includes(key));assert(!text.includes('Plan the six layers'));assert(text.includes('"type":"progress"'));assert(text.includes('"type":"result"'));assert.deepEqual(requestBody,generationPrompt(input));
 let receipt;const result=await requestGeneratedEffect({...input,mode:'relay',onReceipt:r=>receipt=r},async()=>relay);assert.deepEqual(result,artifact);assert.equal(receipt.modelStatus,'matching');assert.equal(receipt.requestId,'gateway-test-id');
});
test('relay mismatch is rejected and legacy library matching also checks actual response model',async()=>{
 const request=new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key},body:JSON.stringify({intent:input.intent,model:input.model,locale:'en',task:'generate'})});const relay=await translate(request,async()=>sse(completionFrames('deepseek-v4-pro-0813')));
 await assert.rejects(requestGeneratedEffect({...input,mode:'relay'},async()=>relay),e=>e.code==='model-mismatch');
 const items=JSON.parse(await readFile(new URL('../dist/client/catalog.json',import.meta.url))).items;await assert.rejects(requestSuggestions({...input,items},async()=>Response.json({model:'deepseek-v4-pro-0813',choices:[{message:{content:'{"candidates":[{"id":"hover-lift","reason":"x"}]}'}}]})),e=>e.code==='model-mismatch');
});
