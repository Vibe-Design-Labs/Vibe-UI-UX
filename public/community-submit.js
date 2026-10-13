import {locale} from './i18n.js';
import {communityText as text} from './community-strings.js';
import {issueURL,validateSubmission} from './community-core.js';
import {canExportComponent} from './effect-contract.js';
import {canExportCompilation} from './compiler-core.js';
let configPromise;
function configuration(){return configPromise??=fetch(new URL('./community-config.json',import.meta.url),{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error();return response.json();}).catch(error=>{configPromise=null;throw error;});}
const node=(tag,content)=>{const element=document.createElement(tag);if(content)element.textContent=content;return element;};
export function setupCommunitySubmit({panel,getState}){
 const button=node('button');button.type='button';button.className='community-submit';button.dataset.communitySubmit='';
 const gallery=node('a');gallery.href='./community.html';gallery.className='community-gallery-link';panel.append(button,gallery);
 const dialog=node('dialog');dialog.className='community-dialog';dialog.setAttribute('aria-labelledby','community-submit-title');document.body.append(dialog);
 const title=node('h2');title.id='community-submit-title';const close=node('button','×');close.type='button';close.className='community-dialog-close';const intro=node('p'),snapshot=node('p'),steps=node('p'),form=node('form');
 const fields={};const labels={};
 for(const [key,type,max,required] of [['caseTitle','input',60,true],['summary','textarea',300,true],['author','input',48,false],['source','input',500,false]]){
  const label=node('label'),caption=node('span'),input=node(type);input.name=key;input.maxLength=max;input.required=required;if(key==='source')input.type='url';label.append(caption,input);form.append(label);fields[key]=input;labels[key]=caption;
 }
 const attribution=node('label'),attributionInput=node('input'),attributionCaption=node('span');attributionInput.type='checkbox';attributionInput.checked=true;attribution.className='community-checkbox';attribution.append(attributionInput,attributionCaption);
 const consent=node('label'),consentInput=node('input'),consentCaption=node('span');consentInput.type='checkbox';consentInput.required=true;consent.className='community-checkbox';consent.append(consentInput,consentCaption);
 const status=node('p');status.setAttribute('role','status');const submit=node('button');submit.type='submit';submit.className='community-confirm';form.append(attribution,consent,status,submit);
 dialog.append(close,title,intro,snapshot,form,steps);let captured=null,catalog=null,version=null,returnFocus=null;
 function available(state){return canExportComponent(state.item)&&!(state.compilation?.recipe?.item_id===state.item?.id&&!canExportCompilation(state.compilation));}
 function refresh(){button.textContent=text('submit');button.disabled=!available(getState());gallery.textContent=text('gallery')+' ↗';title.textContent=text('title');close.setAttribute('aria-label',text('close'));intro.textContent=text('intro');snapshot.textContent=text('snapshot');steps.textContent=text('steps');attributionCaption.textContent=text('attribution');consentCaption.textContent=text('consent');submit.textContent=text('continue');for(const key of Object.keys(labels))labels[key].textContent=text(key);}
 button.addEventListener('click',async()=>{
  const state=getState();if(!available(state))return;captured={item_id:state.item.id,params:structuredClone(state.params),locale};catalog={items:[state.item],registry:state.registry};
  form.reset();attributionInput.checked=true;status.textContent='';submit.disabled=true;fields.caseTitle.value=state.item.locales[locale]?.name||state.item.locales.en.name;
  returnFocus=document.activeElement;dialog.showModal();fields.caseTitle.focus();
  try{version=await configuration();submit.disabled=false;}catch{status.textContent=text('error');}
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!captured||!version||!form.reportValidity())return;
  try{
   const data=validateSubmission({schema:'intentkit.community-submission',schema_version:1,...captured,title:fields.caseTitle.value,summary:fields.summary.value,author_name:fields.author.value,source_url:fields.source.value,attribution:attributionInput.checked,consent:consentInput.checked,version:version.version},catalog);
   const address=issueURL(data,catalog,version.repository);window.open(address,'_blank','noopener,noreferrer');
   // noopener browsers may return null even when a tab was opened; retain a usable link.
   status.replaceChildren(node('span',text('opened')));const retry=node('a',text('continue'));retry.href=address;retry.target='_blank';retry.rel='noopener noreferrer';status.append(retry);
   submit.disabled=true;
  }catch{status.textContent=text('invalid');}
 });
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>returnFocus?.focus({preventScroll:true}));refresh();return {refresh};
}
