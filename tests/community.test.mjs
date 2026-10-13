import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateSubmission,submissionBody,parseSubmissionBody,issueURL,caseFromSubmission,validateCommunityCase,submissionPrefix} from '../public/community-core.js';
import {processCommunityIssue,githubClient} from '../scripts/community-intake.mjs';
import {communityWords} from '../public/community-strings.js';
import {componentSpec} from '../public/effect-contract.js';
const catalog=JSON.parse(await readFile(new URL('../dist/client/catalog.json',import.meta.url)));
function input(id='cursor-spotlight'){
 const item=catalog.items.find(item=>item.id===id);
 return {schema:'intentkit.community-submission',schema_version:1,item_id:id,locale:'zh-CN',params:componentSpec(item,catalog.registry).params,title:'轻一点的暖光',summary:'用于作品集中的项目卡片，不抢内容。',author_name:'Test designer',attribution:true,consent:true,version:'0.4.3.0.0',source_url:''};
}
const issueFor=value=>({number:42,state:'open',title:submissionPrefix+value.title,body:submissionBody(value,catalog),user:{login:'example-user'}});
function mockAPI({branchExists=false,priorCase=null,priorPR=null,files=[]}={}){
 const calls=[];let saved=priorCase,exists=branchExists,pr=priorPR,comment=null;
 const api=async(method,endpoint,body)=>{
  calls.push({method,endpoint,body});
  if(method==='GET'&&endpoint.includes('/pulls?'))return pr?[pr]:[];
  if(method==='GET'&&endpoint.endsWith('/git/ref/heads/main'))return {object:{sha:'a'.repeat(40)}};
  if(method==='GET'&&endpoint.includes('/git/ref/heads/community')){if(!exists){const error=new Error();error.status=404;throw error;}return {object:{sha:'b'.repeat(40)}};}
  if(method==='POST'&&endpoint.endsWith('/git/refs')){exists=true;return {};}
  if(method==='GET'&&endpoint.includes('/compare/'))return {files};
  if(method==='GET'&&endpoint.includes('/contents/')){if(saved)return {content:Buffer.from(saved).toString('base64'),sha:'c'.repeat(40)};const error=new Error();error.status=404;throw error;}
  if(method==='PUT'&&endpoint.includes('/contents/')){saved=Buffer.from(body.content,'base64').toString();return {};}
  if(method==='POST'&&endpoint.endsWith('/pulls')){pr={number:9,state:'open',html_url:'https://github.com/example/project/pull/9'};return pr;}
  if(method==='PATCH'&&/\/pulls\/9$/.test(endpoint))return pr;
  if(method==='GET'&&endpoint.includes('/comments?'))return comment?[comment]:[];
  if(method==='POST'&&endpoint.endsWith('/comments')){comment={id:7,user:{login:'github-actions[bot]'},body:body.body};return comment;}
  throw new Error('Unexpected mocked API: '+method+' '+endpoint);
 };
 return {api,calls,get saved(){return saved;},get pr(){return pr;}};
}
test('five supported cases round-trip through the GitHub intake and preserve exact parameters and attribution',()=>{
 for(const id of ['cursor-spotlight','hover-lift','press-feedback','click-ripple','staggered-reveal']){
  const value=input(id);assert.deepEqual(parseSubmissionBody(submissionBody(value,catalog),catalog),value);
  const issue=issueFor(value),entry=caseFromSubmission(value,catalog,issue);assert.equal(entry.author.github_login,'example-user');assert.equal(entry.author.display_name,'Test designer');assert.deepEqual(validateCommunityCase(entry,catalog),entry);assert.deepEqual(entry.params,value.params);
  const url=new URL(issueURL(value,catalog,'Vibe-Design-Labs/Vibe-UI-UX'));assert.equal(url.hostname,'github.com');assert.equal(url.pathname,'/Vibe-Design-Labs/Vibe-UI-UX/issues/new');assert.deepEqual(parseSubmissionBody(url.searchParams.get('body'),catalog),value);
 }
});
test('intake rejects unsupported templates, absent consent, secret-like text, executable fields and malformed contracts',()=>{
 const value=input();for(const change of [{item_id:'organic-biophilic'},{consent:false},{params:{...value.params,unknown:2}},{params:{...value.params,lift_px:999}},{params:{}},{html:'<script>'},{summary:'github_pat_'+ 'a'.repeat(32)},{source_url:'javascript:alert(1)'},{source_url:'https://example.com/?token=secret'}])assert.throws(()=>validateSubmission({...value,...change},catalog));
 assert.throws(()=>parseSubmissionBody(submissionBody(value,catalog)+'\n```json\n{}\n```',catalog));
 const entry=caseFromSubmission(value,catalog,issueFor(value));assert.throws(()=>validateCommunityCase({...entry,brief:'fake description'},catalog));assert.throws(()=>validateCommunityCase({...entry,id:'../../main'},catalog));
});
test('automation creates one isolated data commit and review PR; never writes main, merges or deploys',async()=>{
 const mock=mockAPI(),value=input(),result=await processCommunityIssue({issue:issueFor(value),catalog,repository:'example/project',api:mock.api});
 assert.equal(result.branch,'community/case-42');assert.equal(result.filename,'community/cases/case-42.json');
 const write=mock.calls.find(call=>call.method==='PUT');assert.equal(write.body.branch,'community/case-42');assert.equal(JSON.parse(mock.saved).author.github_login,'example-user');
 const pull=mock.calls.find(call=>call.method==='POST'&&call.endpoint.endsWith('/pulls'));assert.equal(pull.body.base,'main');assert.equal(pull.body.draft,false);assert.equal(pull.body.head,'community/case-42');
 assert.ok(mock.calls.every(call=>!call.endpoint.includes('/merge')&&!call.endpoint.includes('/deploy')&&!call.endpoint.includes('/workflows')));
});
test('retries update the same PR, keep identical snapshots free of new commits, and reject closed PRs',async()=>{
 const value=input(),mock=mockAPI();const args={issue:issueFor(value),catalog,repository:'example/project',api:mock.api};
 await processCommunityIssue(args);await processCommunityIssue(args);
 assert.equal(mock.calls.filter(c=>c.method==='POST'&&c.endpoint.endsWith('/pulls')).length,1);assert.equal(mock.calls.filter(c=>c.method==='PUT').length,1);
 const changed={...value,params:{...value.params,lift_px:3}};await processCommunityIssue({...args,issue:issueFor(changed)});assert.equal(mock.calls.filter(c=>c.method==='PUT').length,2);
 const closed=mockAPI({priorPR:{number:9,state:'closed'}});await assert.rejects(processCommunityIssue({...args,api:closed.api}),/already been closed/);assert.equal(closed.calls.filter(c=>c.method!=='GET').length,0);
});
test('unrelated issues and invalid data cannot create branches; unrelated branch changes are refused',async()=>{
 const mock=mockAPI(),args={issue:issueFor(input()),catalog,repository:'example/project',api:mock.api};
 assert.deepEqual(await processCommunityIssue({...args,issue:{...args.issue,title:'ordinary bug'}}),{ignored:true});assert.equal(mock.calls.length,0);
 await assert.rejects(processCommunityIssue({...args,issue:{...args.issue,body:args.issue.body.replace('"consent": true','"consent": false')}}));assert.equal(mock.calls.length,0);
 const unsafe=mockAPI({branchExists:true,files:[{filename:'.github/workflows/pages.yml',status:'modified'}]});await assert.rejects(processCommunityIssue({...args,api:unsafe.api}),/unrelated changes/);assert.equal(unsafe.calls.filter(c=>c.method!=='GET').length,0);
});
test('GitHub transport sends automation credentials only to the fixed API and never exposes error bodies',async()=>{
 let seen;const api=githubClient('test-credential',async(url,options)=>{seen={url,options};return {ok:false,status:403,json:async()=>({message:'test-credential'})};});
 await assert.rejects(api('GET','/repos/example/project/pulls'),error=>error.message==='GitHub request failed (403)');assert.equal(seen.url,'https://api.github.com/repos/example/project/pulls');assert.equal(seen.options.headers.Authorization,'Bearer test-credential');
 await assert.rejects(api('POST','https://evil.example'),/Invalid API/);
 await assert.rejects(api('GET','/repos/example/project/compare/main...community%2Fcase-42'),/GitHub request failed \(403\)/);
 await assert.rejects(api('GET','/repos/example/project/%2e%2e/private'),/Invalid API/);
 for(const [key,values]of Object.entries(communityWords)){assert.equal(values.length,5,key);assert.ok(values.every(v=>typeof v==='string'&&v.trim()));}
});
test('closing a submission withdraws the open review PR without touching data or reopening a merged case',async()=>{
 const issue={...issueFor(input()),state:'closed'},mock=mockAPI({priorPR:{number:9,state:'open'}});
 const result=await processCommunityIssue({issue,catalog,repository:'example/project',api:mock.api});assert(result.withdrawn);
 assert.deepEqual(mock.calls.filter(c=>c.method!=='GET').map(c=>({method:c.method,body:c.body})),[{method:'PATCH',body:{state:'closed'}}]);
});
