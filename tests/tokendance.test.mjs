import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, webcrypto} from 'node:crypto';
import {applicationURL, officialAppURL, modelsEndpoint, exchangeEndpoint, loadModels, beginAuthorization, authorizationCode, exchangeAuthorization} from '../public/tokendance.js';
import {requestSuggestions} from '../public/client-byok.js';
import {models, authorize, translate} from '../dist/server/index.js';
import {readFile} from 'node:fs/promises';
const key = 'dummy-key-used-only-in-mocks';
const verifier = 'a'.repeat(64);
const catalog = {data: [
  {id:'text-chat',name:'Chat',supported_protocols:['openai:chat-completions']},
  {id:'video-only',supported_protocols:['minimax:video_generation_v2']},
  {id:'responses-only',supported_protocols:['openai:responses']},
  {id:'no-capabilities'}, {id:'../bad model',supported_protocols:['openai:chat-completions']},
  {id:'text-chat',supported_protocols:['openai:chat-completions']}
]};
const items = JSON.parse(await readFile(new URL('../dist/client/catalog.json', import.meta.url))).items;
const input = {items,key,intent:'A subtle pointer glow',model:'text-chat',locale:'en',mode:'direct'};
const apiRequest = (path, body, extraHeaders={}) => new Request('https://intentkit.test/api/'+path, {
  method:'POST',headers:{'Content-Type':'application/json',...extraHeaders},body:JSON.stringify(body)
});

test('model discovery is public, bounded and filters by explicit protocol instead of model name', async () => {
  const result = await loadModels({mode:'direct'}, async (url,options) => {
    assert.equal(url,modelsEndpoint); assert.equal(options.headers,undefined); assert.equal(options.body,undefined);
    assert.equal(options.credentials,'omit'); assert.equal(options.redirect,'error');
    return Response.json(catalog);
  });
  assert.deepEqual(result,[{id:'text-chat',name:'Chat'}]);
  for (const value of [{data:[]},{data:[{id:'chat-in-name',supported_protocols:['anthropic:messages']}]},{}]) {
    await assert.rejects(loadModels({mode:'direct'},async()=>Response.json(value)), /format/);
  }
  await assert.rejects(loadModels({mode:'direct'},async()=>new Response('x'.repeat(600001))), /format/);
});

test('PKCE uses independent random state and verifier; callback and attribution survive fork subpaths', async () => {
  const callbackURL='https://someone.github.io/Forked-App/authorize.html';
  const appURL=applicationURL('https://someone.github.io/Forked-App/studio.html?item=custom-cursor');
  assert.equal(appURL,'https://someone.github.io/Forked-App/');
  assert.equal(applicationURL('http://127.0.0.1:51731/studio.html'),'app://intentkit');
  const flow=await beginAuthorization({callbackURL,appURL},webcrypto), url=new URL(flow.url);
  assert.equal(url.origin,'https://tokendance.space'); assert.equal(url.pathname,'/auth');
  assert.match(flow.verifier,/^[a-zA-Z0-9_-]{64}$/); assert.match(flow.state,/^[a-zA-Z0-9_-]{32}$/);
  assert.equal(url.searchParams.get('code_challenge'),createHash('sha256').update(flow.verifier).digest('base64url'));
  assert.equal(url.searchParams.get('code_challenge_method'),'S256'); assert.equal(url.searchParams.get('app_url'),appURL);
  const callback=new URL(url.searchParams.get('callback_url'));
  assert.equal(callback.origin,'https://someone.github.io');assert.equal(callback.pathname,'/Forked-App/authorize.html');
  assert.equal(callback.searchParams.get('flow'),flow.state); assert.ok(!url.href.includes(flow.verifier));
  const second=await beginAuthorization({callbackURL},webcrypto); assert.notEqual(second.state,flow.state); assert.notEqual(second.verifier,flow.verifier);
  await assert.rejects(beginAuthorization({callbackURL:'https://other.test/authorize.html?code=bad'},webcrypto),/input/);
  await assert.rejects(beginAuthorization({callbackURL:'ftp://localhost/authorize.html'},webcrypto),/input/);
});

test('authorization callback must match exact origin, popup identity and flow state', () => {
  const popup={}, state='state', origin='https://intentkit.test';
  const valid={origin,source:popup,data:{type:'intentkit-tokendance-code',flow:state,code:'one-time-code'}};
  const expected={origin,popup,state};
  assert.equal(authorizationCode(valid,expected),'one-time-code');
  for (const change of [{origin:'https://malicious.test'},{source:{}},{data:{...valid.data,flow:'other-flow'}},{data:{...valid.data,type:'other'}},{data:{...valid.data,code:'x'.repeat(2049)}}]) {
    assert.equal(authorizationCode({...valid,...change},expected),null);
  }
});

test('code exchange goes only to TokenDance, sends verifier in JSON and never sends credentials or attribution', async () => {
  const value=await exchangeAuthorization({code:'one-time-code',verifier,mode:'direct'},async(url,options)=>{
    assert.equal(url,exchangeEndpoint);assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');
    assert.deepEqual(options.headers,{'Content-Type':'application/json'});
    assert.deepEqual(JSON.parse(options.body),{code:'one-time-code',code_verifier:verifier,code_challenge_method:'S256'});
    return Response.json({key});
  });
  assert.equal(value,key);
  let calls=0;
  for(const change of [{code:''},{code:'x'.repeat(2049)},{verifier:'too-short'},{mode:'https://untrusted.test'}]){
    await assert.rejects(exchangeAuthorization({code:'code',verifier,mode:'direct',...change},async()=>{calls++;return Response.json({key});}),/input/);
  }
  assert.equal(calls,0);
  for(const [status,message] of [[403,'auth'],[500,'network']]){
    await assert.rejects(exchangeAuthorization({code:'code',verifier,mode:'direct'},async()=>new Response(key,{status})),error=>error.message===message&&!error.message.includes(key));
  }
  await assert.rejects(exchangeAuthorization({code:'code',verifier,mode:'direct'},async()=>Response.json({key:'bad\nkey'})),/format/);
  await assert.rejects(exchangeAuthorization({code:'code',verifier,mode:'direct'},async()=>new Response('x'.repeat(8001))),/format/);
});

test('server model discovery forwards no incoming cookies or key and returns only compatible public fields', async () => {
  const response=await models(new Request('https://intentkit.test/api/models',{headers:{Cookie:'private','Authorization':'Bearer '+key}}),async(url,options)=>{
    assert.equal(url,modelsEndpoint);assert.equal(options.headers,undefined);return Response.json(catalog);
  });
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{data:[{id:'text-chat',name:'Chat',supported_protocols:['openai:chat-completions']}]});
});

test('server code exchange rejects cross-origin and invalid PKCE before reaching the upstream', async () => {
  const body={code:'code',code_verifier:verifier,code_challenge_method:'S256'};
  let calls=0;
  for(const request of [apiRequest('authorize',body,{Origin:'https://malicious.test'}),apiRequest('authorize',{...body,code_verifier:'short'}),apiRequest('authorize',{...body,code_challenge_method:'plain'}),apiRequest('authorize',{...body,code:'x'.repeat(2049)})]){
    const response=await authorize(request,async()=>{calls++;return Response.json({key});});assert.ok(response.status>=400&&response.status<500);
  }
  assert.equal(calls,0);
  const response=await authorize(apiRequest('authorize',body),async(url,options)=>{
    calls++;assert.equal(url,exchangeEndpoint);assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,undefined);
    assert.deepEqual(JSON.parse(options.body),body);return Response.json({key});
  });
  assert.equal(calls,1);assert.equal(response.headers.get('cache-control'),'no-store');assert.deepEqual(await response.json(),{key});
  const failure=await authorize(apiRequest('authorize',body),async()=>new Response(key,{status:403}));
  assert.deepEqual(await failure.json(),{error:'auth'});
});

test('known recovery actions survive direct and relay errors; unknown headers and raw bodies stay hidden', async () => {
  for(const recovery of ['top_up_balance','reauthorize_api_key','api_key_quota','untrusted-action']){
    const expected=recovery==='untrusted-action'?null:recovery;
    await assert.rejects(requestSuggestions(input,async()=>new Response(key,{status:402,headers:{'TokenDance-Recovery-Action':recovery}})),error=>error.message==='limit'&&error.recovery===expected&&!error.message.includes(key));
    const req=apiRequest('translate',{intent:input.intent,model:input.model,locale:input.locale},{'X-TokenDance-Key':key});
    const response=await translate(req,async()=>new Response(key,{status:402,headers:{'TokenDance-Recovery-Action':recovery}}));
    const value=await response.json();assert.deepEqual(value,{error:'limit',...(expected?{recovery:expected}:{})});
    await assert.rejects(requestSuggestions({...input,mode:'relay'},async()=>Response.json(value,{status:429})),error=>error.message==='limit'&&error.recovery===expected);
  }
  await assert.rejects(requestSuggestions({...input,mode:'relay'},async()=>Response.json({error:key,recovery:key},{status:502})),error=>error.message==='network'&&error.recovery===null);
});

test('manual keys receive explicit app attribution without placing it or a secret in the model prompt', async () => {
  await requestSuggestions(input,async(_,options)=>{
    assert.equal(options.headers['X-App-URL'],officialAppURL);assert.ok(!options.body.includes(officialAppURL));assert.ok(!options.body.includes(key));
    assert.equal(JSON.parse(options.body).temperature,undefined);
    return Response.json({choices:[{message:{content:'{"candidates":[{"id":"cursor-spotlight","reason":"Glow"}]}'}}]});
  });
});
