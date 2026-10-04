import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{translate} from '../dist/server/index.js';
const key='test-secret-not-a-real-api-key';
const request=(body={},headers={})=>new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key,...headers},body:JSON.stringify({intent:'A glow following the cursor',model:'glm-5.2',locale:'en',...body})});
test('BYOK relay uses a fixed origin and never sends credentials inside prompt or output',async()=>{
 let called=0;
 const response=await translate(request({baseUrl:'https://malicious.test'}),async(url,options)=>{
  called++;assert.equal(url,'https://tokendance.space/gateway/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer '+key);
  assert.ok(!options.body.includes(key));assert.equal(options.redirect,'error');
  return Response.json({choices:[{message:{content:'{"candidates":[{"id":"cursor-spotlight","reason":"Pointer glow"}]}'}}]});
 });
 assert.equal(called,1);assert.equal(response.status,200);assert.ok(!(await response.text()).includes(key));
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('no upstream call for cross-origin, invalid model, missing key or oversized intent',async()=>{
 let called=0;const upstream=()=>{called++;throw new Error('Unexpected');};
 for(const req of [request({}, {Origin:'https://malicious.test'}),request({model:'../ bad model'}),request({intent:'a'.repeat(2001)}),request({}, {'X-TokenDance-Key':''})]){
  const response=await translate(req,upstream);assert.ok(response.status>=400&&response.status<500);
 }
 assert.equal(called,0);
});
test('upstream errors expose actionable categories, not gateway bodies or credentials',async()=>{
 for(const [status,error] of [[401,'auth'],[403,'auth'],[402,'limit'],[429,'limit'],[404,'model'],[500,'network']]){
  const response=await translate(request(),async()=>new Response(key,{status}));
  assert.deepEqual(await response.json(),{error});
 }
});
test('invalid or unknown model suggestions are rejected',async()=>{
 for(const text of ['not JSON','{"candidates":[{"id":"new-arbitrary-code","reason":"x"}]}','{"candidates":[]}']){
  const response=await translate(request(),async()=>Response.json({choices:[{message:{content:text}}]}));
  assert.equal(response.status,502);assert.deepEqual(await response.json(),{error:'format'});
 }
});
test('network failures preserve the key-free experience and do not reveal secrets',async()=>{
 const response=await translate(request(),async()=>{throw new TypeError(key);});assert.deepEqual(await response.json(),{error:'network'});
 const home=await worker.fetch(new Request('https://intentkit.test/'));assert.equal(home.status,200);assert.ok((await home.text()).includes('hero-console'));
 const missing=await worker.fetch(new Request('https://intentkit.test/missing'));assert.equal(missing.status,404);
 const head=await worker.fetch(new Request('https://intentkit.test/studio.html',{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');
});
test('an upstream response that echoes the secret is dropped',async()=>{
 const response=await translate(request(),async()=>Response.json({choices:[{message:{content:JSON.stringify({candidates:[{id:'cursor-spotlight',reason:key}]})}}]}));
 assert.deepEqual(await response.json(),{error:'format'});
});
