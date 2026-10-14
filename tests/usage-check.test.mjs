import test from 'node:test';
import assert from 'node:assert/strict';
import {requestUsageCheck,usageSummary} from '../public/usage-check.js';
import {usage} from '../dist/server/index.js';
const key='mock-usage-secret-only',row={id:'record-test',model_id:'internal-model-id',model_slug:'kimi-k3',provider_name:'Moonshot',created_at:'2026-10-14T06:00:00Z',trace_id:'trace-test',streaming:true,user_id:'PRIVATE_USER',key_id:'PRIVATE_KEY_ID',key_name:'PRIVATE_KEY_NAME',cost:123456,error:'PRIVATE_ERROR'};
test('usage lookup is a single read-only fixed GET with the key only in Authorization; no model or payment request',async()=>{
 let calls=0;const result=await requestUsageCheck({key,mode:'direct'},async(url,options)=>{calls++;assert.equal(url,'https://tokendance.space/portal/api/v1/usage?window=24h&limit=20');assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer '+key);assert.equal(options.body,undefined);assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');return Response.json({items:[row],total:0});});assert.equal(calls,1);assert.equal(result.returned,1);assert.equal(result.records[0].modelSlug,'kimi-k3');assert.equal(result.generationRequested,false);assert.equal(result.records[0].errorFieldPresent,true);for(const word of [key,'PRIVATE_USER','PRIVATE_KEY_ID','PRIVATE_KEY_NAME','PRIVATE_ERROR','123456'])assert(!JSON.stringify(result).includes(word));
});
test('usage does not equate the documented constant total=0 with no records, infer a missing slug or claim a full 20-row window',()=>{
 const result=usageSummary({items:Array.from({length:20},()=>({...row,model_slug:undefined})),total:0},key);assert.equal(result.returned,20);assert.equal(result.pageMayBeIncomplete,true);assert.equal(result.records[0].modelSlug,null);assert.equal(result.records[0].modelId,'internal-model-id');assert.throws(()=>usageSummary({items:Array(21).fill(row)},key));assert.throws(()=>usageSummary({items:[null]},key));
});
test('invalid input, raw service errors and reflected keys never become usage reports or retries',async()=>{
 let calls=0;await assert.rejects(requestUsageCheck({key:'',mode:'direct'},async()=>{calls++;}),e=>e.code==='input');assert.equal(calls,0);
 for(const status of [401,429]){let attempts=0;await assert.rejects(requestUsageCheck({key,mode:'direct'},async()=>{attempts++;return Response.json({error:'PRIVATE_ERROR '+key},{status});}),e=>e.code===(status===401?'auth':'limit')&&!e.message.includes(key));assert.equal(attempts,1);}
 await assert.rejects(requestUsageCheck({key,mode:'direct'},async()=>Response.json({items:[{...row,key_name:key}]})),e=>e.code==='unsafe');
});
test('relay checks origin and method before reading data and returns only the same sanitized whitelist',async()=>{
 let calls=0;for(const request of [new Request('https://intentkit.test/api/usage',{method:'POST',headers:{'X-TokenDance-Key':key}}),new Request('https://intentkit.test/api/usage',{headers:{Origin:'https://other.test','X-TokenDance-Key':key}}),new Request('https://intentkit.test/api/usage')]){const response=await usage(request,async()=>{calls++;});assert([401,403,405].includes(response.status));}assert.equal(calls,0);
 const relay=await usage(new Request('https://intentkit.test/api/usage',{headers:{'X-TokenDance-Key':key,Cookie:'PRIVATE_COOKIE'}}),async(url,options)=>{assert.equal(options.headers.Cookie,undefined);assert(url.startsWith('https://tokendance.space/portal/api/v1/usage?'));return Response.json({items:[row]});});assert.equal(relay.status,200);const report=await requestUsageCheck({key,mode:'relay'},async()=>relay);assert.equal(report.records[0].modelSlug,'kimi-k3');assert(!JSON.stringify(report).includes('PRIVATE_'));
});
test('untrusted relay rows, oversized replies and unsafe field strings are rejected or reduced without executable output',async()=>{
 await assert.rejects(requestUsageCheck({key,mode:'relay'},async()=>Response.json({schema:'intentkit.usage-check',window:'24h',limit:20,records:[null]})),e=>e.code==='schema');await assert.rejects(requestUsageCheck({key,mode:'direct'},async()=>Response.json({items:[row],extra:'x'.repeat(64001)})),e=>e.code==='response-json');const result=usageSummary({items:[{...row,provider_name:'<script>unsafe</script>',trace_id:'sk-'+'x'.repeat(24),model_slug:'unknown readable name'}]},key);assert.equal(result.records[0].providerName,null);assert.equal(result.records[0].traceId,null);assert.equal(result.records[0].modelSlug,null);
});
test('caller cancellation makes no retry, and an already cancelled lookup sends nothing',async()=>{
 const before=new AbortController();before.abort();let calls=0;await assert.rejects(requestUsageCheck({key,mode:'direct',signal:before.signal},async()=>{calls++;}),e=>e.code==='cancelled');assert.equal(calls,0);const controller=new AbortController();await assert.rejects(requestUsageCheck({key,mode:'direct',signal:controller.signal},async()=>{calls++;controller.abort();throw new Error('private details');}),e=>e.code==='cancelled');assert.equal(calls,1);
});
