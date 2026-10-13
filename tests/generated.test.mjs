import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateArtifact,generatedParams,generationPrompt,generatedBrief} from '../public/generated-core.js';
import {requestGeneratedEffect} from '../public/generation-client.js';
import {requestCompilerIntent} from '../public/client-byok.js';
import {parseLocalIntent} from '../public/compiler-core.js';
import {validateSubmission,caseFromSubmission,validateCommunityCase} from '../public/community-core.js';
import {encodedSubmission,decodeSubmission} from '../public/submission-codec.js';
import {importGeneratedProject,generatedProject,generatedZip} from '../public/generated-export.js';
import {processCommunityIssue} from '../scripts/community-intake.mjs';
import {translate} from '../dist/server/index.js';
import {generatedDictionaries,errorText} from '../public/generated-strings.js';
const artifact=JSON.parse(await readFile(new URL('./fixtures/generated-effect.json',import.meta.url))),catalog=JSON.parse(await readFile(new URL('../dist/client/catalog.json',import.meta.url))),data=JSON.parse(await readFile(new URL('../dist/client/compiler.json',import.meta.url)));
const key='mock-secret-no-paid-request',input={key,model:'mock-code-model',locale:'en',mode:'direct',intent:'Create a pointer-responsive ink constellation, not an existing card preset.'};
const completion=(value=artifact,finish_reason='stop')=>Response.json({choices:[{finish_reason,message:{content:JSON.stringify(value)}}]});
const submission=()=>({schema:'intentkit.community-submission',schema_version:2,kind:'generated',artifact,params:generatedParams(artifact,{dot_size:9}),locale:'en',title:artifact.title,summary:artifact.summary,author_name:'Author',attribution:true,consent:true,version:'0.4.4.0.0',source_url:''});
test('new generation asks for original code without catalog candidates and returns actual code unchanged',async()=>{
 let calls=0;const result=await requestGeneratedEffect(input,async(url,options)=>{calls++;assert.equal(url,'https://tokendance.space/gateway/v1/chat/completions');const body=JSON.parse(options.body);assert.deepEqual(body,generationPrompt(input));assert.ok(!options.body.includes(key));assert.ok(!options.body.includes('candidate_ids'));assert.equal(options.headers.Authorization,'Bearer '+key);assert.equal(options.redirect,'error');return completion();});
 assert.equal(calls,1);assert.deepEqual(result,artifact);assert.equal(result.js,artifact.js);assert.equal(result.template_id,undefined);
});
test('receipt diagnostics distinguish network, cancellation, truncation, JSON, schema and auth without retries or secret echoes',async()=>{
 const cases=[['network',false,async()=>{throw new TypeError('private '+key);} ],['truncated',true,async()=>completion(artifact,'length')],['json',true,async()=>Response.json({choices:[{message:{content:'not JSON'}}]})],['schema',true,async()=>completion({candidate_ids:['hover-lift']})],['empty',true,async()=>Response.json({choices:[{message:{content:null}}]})],['auth',true,async()=>new Response(key,{status:401})],['response-json',true,async()=>new Response('not gateway JSON')],['unsafe',true,async()=>completion({...artifact,summary:key})]];
 for(const [code,received,upstream]of cases){let calls=0;await assert.rejects(requestGeneratedEffect(input,async(...args)=>{calls++;return upstream(...args);}),e=>e.code===code&&e.received===received&&!e.message.includes(key));assert.equal(calls,1);}
 for(const [reason,code]of [[new DOMException('timeout','TimeoutError'),'timeout'],[new DOMException('abort','AbortError'),'cancelled']]){const controller=new AbortController();controller.abort(reason);await assert.rejects(requestGeneratedEffect({...input,signal:controller.signal},async()=>{throw reason;}),e=>e.code===code);}
});
test('old compiler response validation failures are correctly reported as model response rather than connection failure',async()=>{
 const args={...input,items:catalog.items,catalog,data};
 for(const [response,code]of [[completion({}),'schema'],[completion({},'length'),'truncated']])await assert.rejects(requestCompilerIntent(args,async()=>response),e=>e.code===code&&e.received===true);
 const ir={...parseLocalIntent('card hover',data),source:'model'};const payload={ir,candidate_ids:['hover-lift'],explanation:''};assert.deepEqual(await requestCompilerIntent({...args,intent:'card hover'},async()=>completion(payload)),payload);
});
test('code artifact contract rejects external content, credentials, escapes, unsafe parameters and old recipes',()=>{
 for(const change of [{extra:1},{html:'<script>alert(1)</script>'},{html:'<img src="https://x.test">'},{html:'<button onclick="evil()">x</button>'},{css:'@import "https://x.test"'},{css:'body{background:url(https://x.test)}'},{js:artifact.js+';fetch("https://x.test")'},{js:artifact.js+';parent.document'},{js:artifact.js+';localStorage.x'},{parameters:[{id:'constructor',label:'x',type:'color',default:'#ffffff'}]},{summary:'sk-'+ 'x'.repeat(24)}])assert.throws(()=>validateArtifact({...artifact,...change}));
 assert.throws(()=>generatedParams(artifact,{dot_size:500}));assert.throws(()=>generatedParams(artifact,{dot_size:4.5}));assert.throws(()=>validateArtifact({...artifact,parameters:[{...artifact.parameters[0],default:4.5}]}));assert.throws(()=>generatedParams(artifact,{unknown:1}));assert.throws(()=>generatedParams(artifact,{color:'javascript:evil'}));assert.ok(generatedBrief(artifact,{dot_size:9}).includes('9px'));
});
test('direct and relay generation use identical prompt and preserve response-stage diagnostics',async()=>{
 const request=()=>new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key},body:JSON.stringify({intent:input.intent,model:input.model,locale:'en',task:'generate'})});
 const response=await translate(request(),async(_,options)=>{assert.deepEqual(JSON.parse(options.body),generationPrompt(input));assert.ok(!options.body.includes(key));return completion();});assert.deepEqual(await response.json(),artifact);
 const failure=await translate(request(),async()=>completion({},'length'));const body=await failure.json();assert.equal(body.diagnostic.code,'truncated');assert.equal(body.diagnostic.received,true);
 await assert.rejects(requestGeneratedEffect({...input,mode:'relay'},async()=>Response.json(body,{status:502})),e=>e.code==='truncated'&&e.received);
});
test('code submission compresses losslessly; trusted identity and exact code/params survive case validation and round-trip import',async()=>{
 const value=validateSubmission(submission(),catalog),encoded=await encodedSubmission(value,catalog,'Vibe-Design-Labs/Vibe-UI-UX');assert.ok(!encoded.body.includes(key));assert.equal(encoded.needsPaste,false);assert.ok(encoded.url.length<7800);
 assert.deepEqual(await decodeSubmission(encoded.body,catalog),value);const entry=caseFromSubmission(value,catalog,{number:42,user:{login:'trusted-author'}});assert.equal(entry.author.github_login,'trusted-author');assert.equal(entry.kind,'generated');assert.equal(entry.artifact.js,artifact.js);assert.equal(entry.params.dot_size,9);assert.deepEqual(validateCommunityCase(entry,catalog),entry);assert.deepEqual(importGeneratedProject(entry),generatedProject(artifact,value.params));
 assert.throws(()=>validateCommunityCase({...entry,brief:'invented'},catalog));assert.throws(()=>validateSubmission({...value,consent:false},catalog));await assert.rejects(decodeSubmission(encoded.body+'\n```json\n{}\n```',catalog));
});
test('compressed intake is bounded and rejects decompression bombs and malformed payloads',async()=>{
 const body='<!-- intentkit-community-submission:v1 -->\n```intentkit-gzip\nxxx\n```';await assert.rejects(decodeSubmission(body,catalog));
 const bytes=new Uint8Array(await new Response(new Blob(['x'.repeat(100000)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);await assert.rejects(decodeSubmission(body.replace('xxx',btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')),catalog),/too large/);
});
test('intake writes only a data artifact PR and never executes or merges model-authored JavaScript',async()=>{
 const encoded=await encodedSubmission(submission(),catalog,'Vibe-Design-Labs/Vibe-UI-UX'),calls=[];
 const api=async(method,path,body)=>{calls.push({method,path,body});if(path.includes('/pulls?'))return [];if(path.endsWith('/git/ref/heads/main'))return {object:{sha:'main-sha'}};if(path.includes('/git/ref/heads/community')||path.includes('/contents/community/cases/')&&method==='GET'){const e=new Error();e.status=404;throw e;}if(path.endsWith('/pulls'))return {number:50,html_url:'https://github.com/Vibe-Design-Labs/Vibe-UI-UX/pull/50'};if(path.includes('/comments?'))return [];return {};};
 const result=await processCommunityIssue({issue:{number:42,state:'open',title:'[IntentKit case] Ink',body:encoded.body,user:{login:'trusted-author'}},catalog,repository:'Vibe-Design-Labs/Vibe-UI-UX',api});assert.equal(result.filename,'community/cases/case-42.json');const puts=calls.filter(c=>c.method==='PUT');assert.equal(puts.length,1);const saved=JSON.parse(Buffer.from(puts[0].body.content,'base64').toString());assert.equal(saved.artifact.js,artifact.js);assert.equal(puts[0].body.branch,'community/case-42');assert.ok(!calls.some(c=>/\/merge|\/reviews|\/actions\//.test(c.path)));assert.ok(calls.find(c=>c.path.endsWith('/pulls')).body.body.includes('NEVER executes'));
});
test('ZIP export includes identical source and current params plus isolated runtime; five languages cover all diagnostics',async()=>{
 const zip=await generatedZip(artifact,{dot_size:9},name=>readFile(new URL((name==='generated-frame-boot.js'?'../dist/client/':'../public/')+name,import.meta.url),'utf8')),bytes=Buffer.from(await zip.arrayBuffer());for(const name of ['effect.js','effect.css','effect.json','generated-frame.js','index.html'])assert.ok(bytes.includes(Buffer.from(name)));assert.ok(bytes.includes(Buffer.from(artifact.js)));assert.ok(bytes.includes(Buffer.from('"dot_size": 9')));assert.ok(!bytes.includes(Buffer.from(key)));
 const keys=Object.keys(generatedDictionaries.en);for(const dictionary of Object.values(generatedDictionaries)){assert.deepEqual(Object.keys(dictionary),keys);for(const value of Object.values(dictionary))assert.ok(value.trim());}
});
test('HTTP 500 is explicitly a received service error and invalid compiler input never masquerades as network failure',async()=>{
 await assert.rejects(requestGeneratedEffect(input,async()=>new Response('private',{status:500})),e=>e.received&&e.httpStatus===500&&errorText({code:e.code,received:e.received,status:e.httpStatus}).includes('HTTP 500')&&!errorText({code:e.code,received:e.received}).includes('未收到'));
 await assert.rejects(requestCompilerIntent({...input,model:'bad model',catalog,data,items:catalog.items},()=>{throw new Error('Must not reach upstream');}),e=>e.code==='input'&&!e.received);
});
test('a timeout after HTTP headers is retained as timeout, not JSON or connection failure',async()=>{
 const controller=new AbortController();
 await assert.rejects(requestGeneratedEffect({...input,signal:controller.signal},async()=>new Response(new ReadableStream({start(stream){controller.abort(new DOMException('timeout','TimeoutError'));stream.error(new DOMException('aborted','AbortError'));}}),{status:200})),e=>e.code==='timeout'&&e.received&&e.httpStatus===200);
});
