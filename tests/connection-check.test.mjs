import test from 'node:test';
import assert from 'node:assert/strict';
import {runConnectionCheck} from '../public/connection-check-core.js';
import worker from '../dist/server/index.js';
const catalog={data:[{id:'kimi-k3',name:'Kimi K3',supported_protocols:['openai:chat-completions']}]};
test('the standalone probe has fixed TokenDance access in Worker mode without broadening the studio CSP',async()=>{
 const probe=await worker.fetch(new Request('https://intentkit.test/connection-check.html'));assert.equal(probe.status,200);assert(probe.headers.get('Content-Security-Policy').includes("connect-src 'self' https://tokendance.space;"));const studio=await worker.fetch(new Request('https://intentkit.test/studio.html'));assert(studio.headers.get('Content-Security-Policy').includes("connect-src 'self';"));
});
test('anonymous diagnostics use exactly two fixed requests with no credentials, model or messages',async()=>{
 const calls=[];const report=await runConnectionCheck({pageURL:'http://localhost:4174/Vibe-UI-UX/connection-check.html?private=hidden',version:'0.4.4.0.2'},async(url,options)=>{calls.push({url,options});return calls.length===1?Response.json(catalog):Response.json({error:{message:'DO_NOT_PUBLISH_RAW_ERROR'}},{status:401});});
 assert.equal(calls.length,2);assert.equal(calls[0].url,'https://tokendance.space/gateway/v1/models');assert.equal(calls[1].url,'https://tokendance.space/gateway/v1/chat/completions');assert.deepEqual(JSON.parse(calls[1].options.body),{});assert.deepEqual(calls[1].options.headers,{'Content-Type':'application/json'});for(const call of calls){assert.equal(call.options.credentials,'omit');assert.equal(call.options.redirect,'error');assert.equal(call.options.referrerPolicy,'no-referrer');}assert.equal(report.requiresKey,false);assert.equal(report.generationRequested,false);assert.equal(report.checks[0].kimiK3Available,true);assert.equal(report.checks[1].outcome,'authentication-required');assert(!JSON.stringify(report).includes('hidden'));assert(!JSON.stringify(report).includes('DO_NOT_PUBLISH'));
});
test('an unexpected unauthenticated model response is recorded as anomalous, not successful generation',async()=>{
 let calls=0;const report=await runConnectionCheck({},async()=>++calls===1?Response.json(catalog):Response.json({model:'qianfan-vl-v1',id:'as-test',choices:[{message:{content:'PRIVATE_BODY'}}]}));assert.equal(report.checks[1].outcome,'unexpected-success');assert.equal(report.checks[1].reportedModel,'qianfan-vl-v1');assert.equal(report.generationRequested,false);assert(!JSON.stringify(report).includes('PRIVATE_BODY'));
});
test('unreadable and denied catalog responses stay unconfirmed and raw errors or credential-like IDs never leak',async()=>{
 let calls=0;const report=await runConnectionCheck({version:'arbitrary'},async()=>++calls===1?Response.json({private:'raw'}):Response.json({model:'sk-'+'x'.repeat(24),id:'github_pat_'+'x'.repeat(24)},{status:403}));assert.equal(report.version,null);assert.equal(report.checks[0].outcome,'catalog-unreadable');assert.equal(report.checks[1].outcome,'access-denied');assert.equal(report.checks[1].reportedModel,null);assert.equal(report.checks[1].responseId,null);assert(!JSON.stringify(report).includes('private'));
});
test('network failures and cancellation do not retry or issue further requests',async()=>{
 const controller=new AbortController();let calls=0;const report=await runConnectionCheck({signal:controller.signal},async()=>{calls++;controller.abort();throw new Error('private failure');});assert.equal(calls,1);assert.equal(report.cancelled,true);assert.equal(report.checks[0].outcome,'cancelled');assert(!JSON.stringify(report).includes('private failure'));
 const already=new AbortController();already.abort();const result=await runConnectionCheck({signal:already.signal},async()=>{throw new Error('must not run');});assert.equal(result.checks.length,0);assert.equal(result.cancelled,true);
});
test('unexpected SSE bodies are cancelled rather than running or saving generated content',async()=>{
 let calls=0,cancelled=false;const body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('data: PRIVATE_BODY\n\n'));},cancel(){cancelled=true;}});const report=await runConnectionCheck({},async()=>++calls===1?Response.json(catalog):new Response(body,{headers:{'Content-Type':'text/event-stream'}}));assert.equal(report.checks[1].outcome,'unexpected-success');assert.equal(cancelled,true);assert(!JSON.stringify(report).includes('PRIVATE_BODY'));
});
