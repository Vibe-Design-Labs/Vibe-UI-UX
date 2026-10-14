import {modelReceipt} from './model-audit.js';
import {requestGeneratedEffect} from './generation-client.js';
import {mountGeneratedPreview} from './generated-preview.js';
import {generatedParams,generatedBrief} from './generated-core.js';
import {generatedZip,generatedProject,importGeneratedProject} from './generated-export.js';
import {encodedSubmission} from './submission-codec.js';
import {diagnostic} from './model-response.js';
import {aiText as text,errorText} from './generated-strings.js';
import {locale,t} from './i18n.js';
import {notify} from './motion.js';
const node=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e;};
const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
export function setupGeneratedStudio({getCredentials,appURL,mode,onStart,catalog}){
 const button=document.querySelector('#generate'),panel=document.querySelector('#generated-panel'),input=document.querySelector('#intent');
 let request=null,preview=null,artifact=null,params=null,ready=false,failure=null,generating=false,generationLocale=locale,config=null,imported=false,audit=null,progress=null,startedAt=0,auditSignature=null,lastProgress=0;
 const importLabel=document.querySelector('#generated-import-label');
 function stop(){preview?.dispose();preview=null;ready=false;}
 function modeView(active){document.body.dataset.studioMode=active?'generated':'library';}
 function cancel(){if(request){request.abort();request=null;generating=false;failure={code:'cancelled'};render();}}
 function status(value){ready=value==='ready';failure=value==='runtime'?{code:'runtime',received:true}:null;const status=panel.querySelector('[data-generated-status]');if(status)status.textContent=value==='ready'?text(imported?'importedReady':'ready'):errorText(failure);panel.querySelectorAll('[data-ready]').forEach(e=>e.disabled=!ready);}
 function startPreview(){stop();const stage=panel.querySelector('.generated-stage');if(!stage||!artifact)return;preview=mountGeneratedPreview(stage,artifact,params,{onStatus:status,title:artifact.title});}
 function showDiagnostics(){
  const box=panel.querySelector('[data-model-audit]');if(!box||!audit)return;const signature=JSON.stringify(audit);if(signature===auditSignature)return;auditSignature=signature;box.replaceChildren();box.append(node('summary','',text('modelAudit')));
  for(const [label,value]of [['requestModel',audit.requestedModel],['reportedModel',audit.reportedModel],['requestId',audit.requestId],['responseId',audit.responseId]])box.append(node('p','',text(label)+': '+(value||text('unreported'))));
  box.append(node('p','generated-note',text('auditNote')));
  const copy=node('button','',text('copyDiagnostic'));copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify({schema:'intentkit.call-diagnostic',...audit,status:failure?.code||(generating?'running':ready?'preview-ready':'code-received'),elapsed_ms:Math.max(0,Date.now()-startedAt),reasoning_chars:progress?.reasoningChars||0,code_chars:progress?.codeChars||0},null,2));notify(t('copied'));}catch{notify(t('copyFail'));}});box.append(copy);
 }
 function showProgress(){
  if(!generating)return;const now=Date.now();if(now-lastProgress<100)return;lastProgress=now;const message=panel.querySelector('[data-generated-status]');if(!message)return;
  const phase=progress?.phase;message.textContent=(phase==='thinking'?text('thinking')+' '+progress.reasoningChars:phase==='code'?text('writing')+' '+progress.codeChars:phase==='validating'?text('validating'):text('awaiting'))+' · '+Math.floor((Date.now()-startedAt)/1000)+' '+text('seconds');showDiagnostics();
 }
 function render(){
  button.disabled=generating;button.textContent=generating?text('working'):text('generate');document.querySelector('#generated-helper').textContent=text('intro');
  document.querySelector('#generated-budget')?.replaceChildren(node('span','',text('budget')));
  document.querySelector('#generated-import-caption').textContent=locale==='zh-CN'?'导入效果 JSON · 本地预览':({en:'Import effect JSON · local preview',ja:'エフェクトJSONを読み込む',ko:'효과 JSON 가져오기',de:'Effekt-JSON lokal importieren'}[locale]);
  if(!artifact&&!failure&&!generating){panel.hidden=true;return;}panel.hidden=false;panel.replaceChildren();panel.append(node('h2','',text('title')));
  const message=node('p','generated-status',generating?text('working'):failure?errorText(failure):text('waiting'));message.dataset.generatedStatus='';message.setAttribute('role','status');panel.append(message);
  if(generating){const b=node('button','',text('cancel'));b.addEventListener('click',cancel);panel.append(b);}
  if(generating||failure)panel.append(node('p','generated-note',text('paid')));
  if(audit){auditSignature=null;const box=node('details','generated-audit');box.dataset.modelAudit='';box.open=true;panel.append(box);showDiagnostics();}
  const back=node('button','generated-back',text('backLibrary'));back.addEventListener('click',()=>clear());panel.append(back);
  if(artifact&&!imported&&audit?.modelStatus==='unknown')panel.append(node('p','compiler-warning',text('unknownModel')));
  if(artifact&&!imported&&audit?.modelStatus==='matching')panel.append(node('p','generated-note',text('matching')));
  if(!artifact)return;
  panel.append(node('h3','',artifact.title),node('p','',artifact.summary));const stage=node('div','generated-stage');panel.append(stage,node('p','generated-note',text('isolation')));
  const controls=node('div','generated-controls');
  for(const rule of artifact.parameters){const label=node('label'),name=node('span','',rule.label),control=node('input');control.dataset.generatedParam=rule.id;control.type=rule.type==='number'?'range':rule.type==='boolean'?'checkbox':'color';
   if(rule.type==='number'){control.min=rule.min;control.max=rule.max;control.step=rule.step;}control.value=params[rule.id];control.checked=params[rule.id]===true;const output=node('output','',params[rule.id]+(rule.unit||''));
   control.addEventListener('input',()=>{params[rule.id]=rule.type==='number'?Number(control.value):rule.type==='boolean'?control.checked:control.value;output.textContent=params[rule.id]+(rule.unit||'');ready=false;panel.querySelectorAll('[data-ready]').forEach(e=>e.disabled=true);preview?.update(params);panel.querySelector('[data-generated-brief]').textContent=generatedBrief(artifact,params);});label.append(name,control,output);controls.append(label);
  }panel.append(controls);
  const actions=node('div','generated-actions');
  for(const [key,handler]of [['restart',()=>{failure=null;startPreview();}],['stop',()=>{stop();message.textContent=text('paused');panel.querySelectorAll('[data-ready]').forEach(e=>e.disabled=true);}],['download',async()=>{try{download(await generatedZip(artifact,params),'intentkit-generated-web.zip');}catch{notify(t('apiNetwork'));}}],['submit',submission]]){
   const b=node('button','',text(key));b.dataset.action=key;if(['download','submit'].includes(key)){b.dataset.ready='';b.disabled=true;}b.addEventListener('click',handler);actions.append(b);
  }
  const json=node('button','',locale==='zh-CN'?'导出效果 JSON':'Export effect JSON');json.addEventListener('click',()=>download(new Blob([JSON.stringify(generatedProject(artifact,params),null,2)],{type:'application/json'}),'intentkit-generated-effect.json'));actions.append(json);panel.append(actions);
  const brief=node('pre','generated-brief',generatedBrief(artifact,params));brief.dataset.generatedBrief='';panel.append(brief);
  const source=node('details','generated-source');source.append(node('summary','',text('code')));for(const [name,value]of Object.entries({HTML:artifact.html,CSS:artifact.css,JavaScript:artifact.js})){source.append(node('h3','',name),node('pre','',value));}panel.append(source);
  startPreview();
 }
 async function run(){
  const intent=input.value.trim();if(!intent)return notify(t('enterIntent'));const credentials=getCredentials();if(!credentials.key){notify(text('noKey'));document.querySelector('#connect').click();return;}
  cancel();stop();artifact=null;params=null;failure=null;generating=true;imported=false;generationLocale=locale;audit=modelReceipt(credentials.model);progress=null;startedAt=Date.now();onStart?.();modeView(true);const active=new AbortController();request=active;render();const timer=setInterval(showProgress,1000);
  try{const result=await requestGeneratedEffect({intent,model:credentials.model,key:credentials.key,locale:generationLocale,mode,signal:active.signal,appURL,onReceipt(value){if(request===active){audit=value;showDiagnostics();}},onProgress(value){if(request===active){progress=value;showProgress();}}});if(request!==active||active.signal.aborted)return;artifact=result;params=generatedParams(artifact);}
  catch(error){if(request!==active)return;failure=diagnostic(error);}
  finally{clearInterval(timer);if(request===active){request=null;generating=false;render();}}
 }
 async function submission(){
  if(!artifact||!ready)return;
  const snapshot=generatedProject(artifact,params),dialog=node('dialog','community-dialog generated-dialog');
  const title=node('h2','',text('submit')),author=node('input');author.maxLength=48;author.autocomplete='off';const label=node('label','',text('author'));label.append(author);
  const consent=node('input');consent.type='checkbox';const publicLabel=node('label','community-consent');publicLabel.append(consent,node('span','',text('consent')));
  const hint=node('p'),actions=node('div','generated-actions'),prepare=node('button','',text('open')),close=node('button','',t('close'));prepare.disabled=true;consent.addEventListener('change',()=>{prepare.disabled=!consent.checked;});
  close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();panel.querySelector('[data-action="submit"]')?.focus();});actions.append(prepare,close);dialog.append(title,label,publicLabel,hint,actions);document.body.append(dialog);dialog.showModal();
  prepare.addEventListener('click',async()=>{
   prepare.disabled=true;consent.disabled=true;author.disabled=true;try{
    if(!config){const response=await fetch(new URL('./community-config.json',import.meta.url));if(!response.ok)throw new Error();config=await response.json();}
    const payload={schema:'intentkit.community-submission',schema_version:2,kind:'generated',artifact:snapshot.artifact,params:snapshot.params,locale:generationLocale,title:snapshot.artifact.title,summary:snapshot.artifact.summary.slice(0,300),author_name:author.value.trim(),attribution:!!author.value.trim(),consent:true,version:config.version,source_url:''};
    const encoded=await encodedSubmission(payload,catalog,config.repository);const link=node('a','community-submit-link',text('open'));link.href=encoded.url;link.target='_blank';link.rel='noopener noreferrer';actions.prepend(link);prepare.remove();
    if(encoded.needsPaste){hint.textContent=text('paste');const copy=node('button','',text('copyBody'));copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(encoded.body);notify(t('copied'));}catch{notify(t('copyFail'));}});actions.prepend(copy);const fallback=node('textarea');fallback.readOnly=true;fallback.value=encoded.body;dialog.append(fallback);}
    else {hint.textContent=locale==='zh-CN'?'点击打开后，在 GitHub 确认提交。机器人创建待审 PR；审核合并前官网不变。':'Confirm the issue on GitHub. The bot creates a review PR; the site remains unchanged until review and merge.';link.click();}
   }catch{consent.disabled=false;author.disabled=false;prepare.disabled=!consent.checked;hint.textContent=t('apiFormat');}
  });
 }
 function clear(){cancel();stop();artifact=null;params=null;failure=null;audit=null;progress=null;modeView(false);render();}
 button.addEventListener('click',run);input.addEventListener('input',cancel);
 importLabel.querySelector('input').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>65000)throw new Error();const project=importGeneratedProject(JSON.parse(await file.text()));cancel();stop();onStart?.();modeView(true);audit=null;progress=null;artifact=project.artifact;params=project.params;imported=true;failure=null;generationLocale=locale;render();}catch{notify(t('apiFormat'));}finally{event.target.value='';}});
 addEventListener('pagehide',()=>{cancel();stop();});addEventListener('pageshow',event=>{if(event.persisted&&artifact)render();});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{if(artifact)render();});render();
 return {cancel,refreshLocale(){cancel();stop();render();},clear};
}
