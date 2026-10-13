import {decodeSubmission} from '../public/submission-codec.js';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {parseSubmissionBody,caseFromSubmission,submissionPrefix,submissionMarker} from '../public/community-core.js';

export function githubClient(token,request=fetch){
 if(!token)throw new Error('Missing automation credential');
 return async(method,endpoint,body)=>{
  let decoded;try{decoded=decodeURIComponent(endpoint.split('?')[0]);}catch{throw new Error('Invalid API endpoint');}
  if(!endpoint.startsWith('/repos/')||/(?:^|\/)\.{1,2}(?:\/|$)|[\\\r\n\u0000]/.test(decoded))throw new Error('Invalid API endpoint');
  const response=await request('https://api.github.com'+endpoint,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'Content-Type':'application/json','User-Agent':'IntentKit-community-intake','X-GitHub-Api-Version':'2022-11-28'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(!response.ok){const error=new Error('GitHub request failed ('+response.status+')');error.status=response.status;throw error;}
  if(response.status===204)return null;return response.json();
 };
}
const markdown=value=>String(value).replace(/[\\`*_{}\[\]<>#|!@]/g,'\\$&');
export async function processCommunityIssue({issue,catalog,repository,api}){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))throw new Error('Invalid repository');
 if(issue?.pull_request||!['open','closed'].includes(issue?.state)||!issue?.title?.startsWith(submissionPrefix)||!issue.body?.startsWith(submissionMarker))return {ignored:true};
 if(issue.state==='closed'){
  if(!Number.isSafeInteger(issue.number)||issue.number<1)throw new Error('Invalid submission number');
  const root='/repos/'+repository,branch='community/case-'+issue.number,owner=repository.split('/')[0];
  const pulls=await api('GET',root+'/pulls?state=open&head='+encodeURIComponent(owner+':'+branch)+'&base=main&per_page=100');
  if(pulls.length>1)throw new Error('Ambiguous submission PR');
  if(pulls[0])await api('PATCH',root+'/pulls/'+pulls[0].number,{state:'closed'});
  return {withdrawn:true,number:pulls[0]?.number};
 }
 const input=await decodeSubmission(issue.body,catalog),entry=caseFromSubmission(input,catalog,issue);
 const root='/repos/'+repository,branch='community/'+entry.id,filename='community/cases/'+entry.id+'.json';
 const branchRef=encodeURIComponent(branch),owner=repository.split('/')[0];
 const pulls=await api('GET',root+'/pulls?state=all&head='+encodeURIComponent(owner+':'+branch)+'&base=main&per_page=100');
 if(pulls.length>1)throw new Error('Ambiguous submission PR');
 if(pulls[0]&&pulls[0].state!=='open')throw new Error('This submission has already been closed; start a new submission');
 const main=await api('GET',root+'/git/ref/heads/main');
 let exists=true;
 try{await api('GET',root+'/git/ref/heads/'+branchRef);}catch(error){if(error.status!==404)throw error;exists=false;}
 if(!exists)await api('POST',root+'/git/refs',{ref:'refs/heads/'+branch,sha:main.object.sha});
 else{
  // Never reuse a branch with scripts, workflow edits or unrelated files.
  const comparison=await api('GET',root+'/compare/main...'+branchRef);
  if(comparison.files.some(file=>file.filename!==filename||!['added','modified'].includes(file.status)))throw new Error('Submission branch contains unrelated changes');
 }
 const content=JSON.stringify(entry,null,2)+'\n';let previous=null;
 try{previous=await api('GET',root+'/contents/'+filename+'?ref='+branchRef);}catch(error){if(error.status!==404)throw error;}
 if(!previous||Buffer.from(previous.content,'base64').toString('utf8')!==content){
  await api('PUT',root+'/contents/'+filename,{message:'community: propose '+entry.id,content:Buffer.from(content).toString('base64'),branch,...(previous?{sha:previous.sha}:{})});
 }
 const generated=entry.kind==='generated';
 const preview=new URL('https://'+owner.toLowerCase()+'.github.io/'+repository.split('/')[1]+'/'+(generated?'studio.html':'effect-example.html'));
 if(!generated){preview.searchParams.set('item',entry.item_id);preview.searchParams.set('params',JSON.stringify(entry.params));}
 const body=(generated?'Original code case':'Community parameter case')+' from @'+entry.author.github_login+'.\n\n'+markdown(entry.summary)+'\n\n'
  +(generated?'The HTML, CSS and JavaScript are embedded in `artifact` in the JSON diff. Download that JSON and import it into the [workbench]('+preview.href+') to reproduce the isolated preview. Automation NEVER executes submitted code.\n\n':'[Preview the exact submitted parameters]('+preview.href+')\n\nTemplate: `'+entry.template_id+'`.\n\n')
  +'File: `'+filename+'`.\n\n'
  +'Display attribution: '+(entry.author.attribution?markdown(entry.author.display_name):'hidden in the gallery; GitHub identity remains public')+'. Consent: public contribution under MIT.\n\n'
  +'Only one validated data file is proposed. Maintainer must review behavior, accessibility, code, licensing and resource use; static validation is not a code-quality or security certification. Manual merge is required. This PR does not publish the website.\n\nCloses #'+issue.number+'\n';
 const pull=pulls[0]?await api('PATCH',root+'/pulls/'+pulls[0].number,{title:'Community case: '+entry.title,body}):await api('POST',root+'/pulls',{title:'Community case: '+entry.title,head:branch,base:'main',body,maintainer_can_modify:true,draft:false});
 const note='<!-- intentkit-community-result -->\nYour review PR: '+pull.html_url+'\n\nThe official website stays unchanged until the maintainer reviews and merges this PR. Editing the JSON in this submission updates the same open PR. Code checks may require the maintainer to approve the workflow run. / 待审 PR 已创建；维护者审核并手动合并前不会改变官网。';
 const comments=await api('GET',root+'/issues/'+issue.number+'/comments?per_page=100');
 const prior=comments.find(comment=>comment.user?.login==='github-actions[bot]'&&comment.body?.startsWith('<!-- intentkit-community-result -->'));
 if(prior){if(prior.body!==note)await api('PATCH',root+'/issues/comments/'+prior.id,{body:note});}else await api('POST',root+'/issues/'+issue.number+'/comments',{body:note});
 return {number:pull.number,url:pull.html_url,branch,filename,entry};
}

async function main(){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
 const issue=event.issue;if(!issue)throw new Error('Issue event required');
 const catalog={items:await Promise.all((await readdir(path.join(root,'content/items'))).filter(name=>name.endsWith('.json')).map(async name=>JSON.parse(await readFile(path.join(root,'content/items',name),'utf8')))),registry:JSON.parse(await readFile(path.join(root,'previews/registry.json'),'utf8'))};
 const api=githubClient(process.env.GITHUB_TOKEN);
 try{
  const result=await processCommunityIssue({issue,catalog,repository:process.env.GITHUB_REPOSITORY,api});
  console.log(result.ignored?'Unrelated issue ignored.':result.withdrawn?'Submission closed; any open review PR withdrawn.':'Created/updated review PR #'+result.number);
 }catch(error){
  console.error(error.status?'GitHub request failed ('+error.status+').':'Submission validation failed.');
  const note='<!-- intentkit-community-error -->\nCould not create/update the review PR. Check the generated-code contract or supported template, parameter ranges and public-contribution consent; keep exactly one JSON or compressed block. Repository permission or service failures can be retried by editing the submission. / 投稿未转成 PR，请核对参数与公开许可；不会写入 main 或发布官网。';
  try{await api('POST','/repos/'+process.env.GITHUB_REPOSITORY+'/issues/'+issue.number+'/comments',{body:note});}catch{}
  process.exitCode=1;
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
