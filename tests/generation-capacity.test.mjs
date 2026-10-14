import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generationPrompt,validateArtifact,generatedParams} from '../public/generated-core.js';
import {generationLimits} from '../public/generation-policy.js';
import {requestGeneratedEffect} from '../public/generation-client.js';
import {requestCompilerIntent,requestSuggestions} from '../public/client-byok.js';
import {parseLocalIntent,compilerPrompt} from '../public/compiler-core.js';
import {suggestionBody} from '../public/tokendance.js';
import {readGenerationResponse,generationWatchdog} from '../public/generation-stream.js';
import {importGeneratedProject,generatedProject,generatedZip} from '../public/generated-export.js';
import {encodedSubmission,decodeSubmission,submissionInflateLimit} from '../public/submission-codec.js';
import {translate} from '../dist/server/index.js';

const artifact=JSON.parse(await readFile(new URL('./fixtures/generated-effect.json',import.meta.url))),catalog=JSON.parse(await readFile(new URL('../dist/client/catalog.json',import.meta.url))),data=JSON.parse(await readFile(new URL('../dist/client/compiler.json',import.meta.url)));
const key='mock-capacity-key-not-real',input={intent:'card hover '+ 'Detailed design requirement. '.repeat(4000),model:'kimi-k3',locale:'en',key,mode:'direct'};
const large={...artifact,html:artifact.html+'<!--'+'a'.repeat(100000)+'-->',css:artifact.css+'/*'+'b'.repeat(100000)+'*/',js:artifact.js+'\n/*'+'c'.repeat(1200000)+'*/'};
const completion=value=>Response.json({model:'kimi-k3',choices:[{message:{content:JSON.stringify(value)},finish_reason:'stop'}]});
const frame=value=>'data: '+JSON.stringify(value)+'\n\n';

test('all AI request modes omit imposed output budgets and preserve long design input without truncation',async()=>{
 for(const model of ['kimi-k3','deepseek-v4-pro-0813','future-model'])for(const prompt of [generationPrompt({...input,model}),compilerPrompt(catalog.items,data,{...input,model}),suggestionBody(catalog.items,{...input,model})]){
  assert.equal(prompt.model,model);for(const field of ['max_tokens','max_completion_tokens','min_tokens'])assert.equal(Object.hasOwn(prompt,field),false);
  assert.equal(JSON.parse(prompt.messages.at(-1).content).intent,input.intent);
 }
 assert.equal(generationLimits.total_ms,undefined);assert.equal(generationLimits.max_tokens,undefined);
 const inspect=value=>async(_,options)=>{assert.equal(JSON.parse(JSON.parse(options.body).messages.at(-1).content).intent,input.intent);return completion(value);};
 assert.deepEqual(await requestGeneratedEffect(input,inspect(artifact)),artifact);
 const ir={...parseLocalIntent(input.intent,data),source:'model'},compiled={ir,candidate_ids:['hover-lift'],explanation:''};
 assert.deepEqual(await requestCompilerIntent({...input,items:catalog.items,catalog,data},inspect(compiled)),compiled);
 const suggestions={candidates:[{id:'hover-lift',reason:'Lift the card'}]};assert.deepEqual(await requestSuggestions({...input,items:catalog.items},inspect(suggestions)),suggestions.candidates);
});

test('an active generation can exceed the old ten-minute deadline while idle streams still time out',t=>{
 t.mock.timers.enable({apis:['setTimeout']});const watch=generationWatchdog();
 try{for(let i=0;i<12;i++){watch.activity();t.mock.timers.tick(60000);assert.equal(watch.signal.aborted,false);}t.mock.timers.tick(60001);assert.equal(watch.signal.aborted,true);assert.equal(watch.signal.reason.name,'TimeoutError');}finally{watch.dispose();t.mock.timers.reset();}
});

test('large source survives non-streaming envelopes, validation, project import and Web export unchanged',async()=>{
 assert.deepEqual(validateArtifact(large),large);assert.deepEqual(await requestGeneratedEffect(input,async()=>completion(large)),large);
 const project=generatedProject(large,generatedParams(large));assert.deepEqual(importGeneratedProject(JSON.parse(JSON.stringify(project))),project);
 const zip=await generatedZip(large,project.params,name=>readFile(new URL((name==='generated-frame-boot.js'?'../dist/client/':'../public/')+name,import.meta.url),'utf8'));const bytes=Buffer.from(await zip.arrayBuffer());assert.ok(bytes.includes(Buffer.from(large.js)));assert.ok(bytes.includes(Buffer.from(large.css)));
});

test('streams beyond legacy wire, event and code caps complete with accurate progress and no reasoning retention',async()=>{
 const progress=[],content=JSON.stringify(large),wire=[frame({model:'kimi-k3',choices:[{delta:{reasoning_content:'r'.repeat(3000000)}}]}),frame({model:'kimi-k3',choices:[{delta:{content:content.slice(0,700000)}}]}),frame({model:'kimi-k3',choices:[{delta:{content:content.slice(700000)},finish_reason:'stop'}]}),'data: [DONE]\n\n'].join('');
 assert.ok(new TextEncoder().encode(wire).length>4000000);
 const result=await requestGeneratedEffect({...input,onProgress:p=>progress.push(p)},async()=>new Response(wire,{headers:{'Content-Type':'text/event-stream'}}));assert.deepEqual(result,large);assert.equal(progress.at(-1).codeChars,content.length);assert.equal(progress.at(-1).reasoningChars,3000000);assert.ok(!JSON.stringify(progress).includes('r'.repeat(100)));
 const normalized=frame({type:'progress',phase:'code',reasoningChars:5000000,codeChars:1400000})+frame({type:'result',artifact:large});let last;
 assert.deepEqual((await readGenerationResponse(new Response(normalized,{headers:{'Content-Type':'text/event-stream'}}),{key,model:'kimi-k3',normalized:true,onProgress:p=>last=p})).artifact,large);assert.equal(last.codeChars,1400000);assert.equal(last.reasoningChars,5000000);
});

test('relay preserves long input and large code while public intake permits compressed large artifacts',async()=>{
 const response=await translate(new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key},body:JSON.stringify({...input,task:'generate',key:undefined})}),async(_,options)=>{assert.equal(JSON.parse(JSON.parse(options.body).messages.at(-1).content).intent,input.intent);return completion(large);});assert.equal(response.status,200);assert.deepEqual(await response.json(),large);
 const submission={schema:'intentkit.community-submission',schema_version:2,kind:'generated',artifact:large,params:generatedParams(large),locale:'en',title:large.title,summary:large.summary,author_name:'Author',attribution:true,consent:true,version:'0.4.4.0.2',source_url:''};
 const encoded=await encodedSubmission(submission,catalog,'Vibe-Design-Labs/Vibe-UI-UX');assert.equal((await decodeSubmission(encoded.body,catalog)).artifact.js,large.js);assert.equal(submissionInflateLimit,32*1024*1024);
});

test('large artifact sizes do not weaken external-resource and credential rejection',async()=>{
 assert.throws(()=>validateArtifact({...large,js:large.js+'\nfetch("https://example.invalid");'}));
 await assert.rejects(requestGeneratedEffect(input,async()=>completion({...large,js:large.js+'\n/*'+key+'*/'})),e=>e.code==='unsafe');
 const frames=frame({model:'kimi-k3',choices:[{delta:{content:JSON.stringify(artifact).slice(0,100)+key.slice(0,10)}}]})+frame({model:'kimi-k3',choices:[{delta:{content:key.slice(10)},finish_reason:'stop'}]})+'data: [DONE]\n\n';await assert.rejects(requestGeneratedEffect(input,async()=>new Response(frames,{headers:{'Content-Type':'text/event-stream'}})),e=>e.code==='unsafe');
});
