import {effectiveParams,makeBrief} from './core.js';
import {canExportComponent} from './effect-contract.js';

export const submissionMarker='<!-- intentkit-community-submission:v1 -->';
export const submissionPrefix='[IntentKit case] ';
export const submissionLocales=['zh-CN','en','ja','ko','de'];
const fields=['schema','schema_version','item_id','locale','params','title','summary','author_name','attribution','consent','version','source_url'];
const secretPattern=/(?:github_pat_|gh[pousr]_|sk-)[A-Za-z0-9_\-]{16,}/;
function object(value){return value&&typeof value==='object'&&!Array.isArray(value);}
function text(value,max,required=true){
 if(typeof value!=='string'||value.length>max||(required&&!value.trim())||/[\u0000-\u0008\u000b-\u001f\u007f]/.test(value)||secretPattern.test(value))throw new Error('Invalid public text');
 return value.trim();
}
export function validateSubmission(input,catalog){
 if(!object(input)||Object.keys(input).some(key=>!fields.includes(key))||fields.some(key=>!Object.hasOwn(input,key)))throw new Error('Invalid submission fields');
 if(input.schema!=='intentkit.community-submission'||input.schema_version!==1||input.consent!==true||typeof input.attribution!=='boolean')throw new Error('Public contribution consent required');
 if(!submissionLocales.includes(input.locale)||!/^\d+(?:\.\d+){4}$/.test(input.version))throw new Error('Invalid submission version or locale');
 const item=catalog.items.find(item=>item.id===input.item_id);if(!canExportComponent(item))throw new Error('Unsupported community template');
 if(!object(input.params))throw new Error('Invalid parameters');
 const params=effectiveParams(item,catalog.registry,input.params);
 if(Object.keys(input.params).length!==Object.keys(params).length)throw new Error('All registered parameters required');
 const source=text(input.source_url,500,false);
 if(source){let url;try{url=new URL(source);}catch{throw new Error('Invalid source URL');}if(url.protocol!=='https:'||url.username||url.password||/[?&](?:token|key|secret|code)=/i.test(source))throw new Error('Invalid source URL');}
 return {schema:input.schema,schema_version:1,item_id:item.id,locale:input.locale,params,title:text(input.title,60),summary:text(input.summary,300),author_name:text(input.author_name,48,false),attribution:input.attribution,consent:true,version:input.version,source_url:source};
}
export function submissionBody(input,catalog){
 const value=validateSubmission(input,catalog);
 return submissionMarker+'\n\n```json\n'+JSON.stringify(value,null,2)+'\n```\n\nPlease keep the JSON block intact. This public submission is converted into a review PR; it does not publish or merge automatically.';
}
export function parseSubmissionBody(body,catalog){
 if(typeof body!=='string'||new TextEncoder().encode(body).length>12000||!body.startsWith(submissionMarker))throw new Error('Invalid submission body');
 const matches=Array.from(body.matchAll(/```json\s*\n([\s\S]*?)\n```/g));if(matches.length!==1)throw new Error('Exactly one JSON block required');
 let value;try{value=JSON.parse(matches[0][1]);}catch{throw new Error('Invalid submission JSON');}
 return validateSubmission(value,catalog);
}
export function issueURL(input,catalog,repository){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))throw new Error('Invalid repository');
 const value=validateSubmission(input,catalog),url=new URL('https://github.com/'+repository+'/issues/new');
 url.searchParams.set('title',submissionPrefix+value.title);url.searchParams.set('body',submissionBody(value,catalog));
 if(url.href.length>7800)throw new Error('Submission link is too long');return url.href;
}
export function caseFromSubmission(input,catalog,issue){
 const value=validateSubmission(input,catalog),number=issue.number,login=issue.user?.login;
 if(!Number.isSafeInteger(number)||number<1||!/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(login||''))throw new Error('Invalid GitHub identity');
 const item=catalog.items.find(item=>item.id===value.item_id);
 return {schema:'intentkit.community-case',schema_version:1,id:'case-'+number,item_id:item.id,template_id:item.preview.template_id,params:value.params,title:value.title,summary:value.summary,
  author:{github_login:login,display_name:value.author_name||login,attribution:value.attribution},locale:value.locale,content_locale:item.locales[value.locale]?value.locale:'en',brief:makeBrief(item,catalog.registry,value.locale,value.params),
  source_url:value.source_url,submitted_version:value.version,issue_number:number,license:'MIT',consent:true};
}
export function validateCommunityCase(value,catalog){
 const allowed=['schema','schema_version','id','item_id','template_id','params','title','summary','author','locale','content_locale','brief','source_url','submitted_version','issue_number','license','consent'];
 if(!object(value)||Object.keys(value).some(key=>!allowed.includes(key))||allowed.some(key=>!Object.hasOwn(value,key))||value.schema!=='intentkit.community-case'||value.schema_version!==1||value.license!=='MIT')throw new Error('Invalid case schema');
 if(!object(value.author)||Object.keys(value.author).some(key=>!['github_login','display_name','attribution'].includes(key)))throw new Error('Invalid case author');
 const input={schema:'intentkit.community-submission',schema_version:1,item_id:value.item_id,locale:value.locale,params:value.params,title:value.title,summary:value.summary,author_name:value.author.display_name,attribution:value.author.attribution,consent:value.consent,version:value.submitted_version,source_url:value.source_url};
 const expected=caseFromSubmission(input,catalog,{number:value.issue_number,user:{login:value.author.github_login}});
 if(value.id!==expected.id||value.template_id!==expected.template_id||value.content_locale!==expected.content_locale||value.brief!==expected.brief)throw new Error('Case differs from its registered implementation');
 return expected;
}
