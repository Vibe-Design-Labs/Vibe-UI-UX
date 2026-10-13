import {setupLanguage} from './i18n.js';
import {communityText as text} from './community-strings.js';
import {componentSpec} from './effect-contract.js';
import {validateCommunityCase} from './community-core.js';
import {effectLabels} from './component-strings.js';
import {mountEffect} from './effect-kit.js';
const $=id=>document.getElementById(id),node=(tag,value)=>{const element=document.createElement(tag);if(value)element.textContent=value;return element;};
let data=null,catalog=null,config=null,page=0,controllers=[],failed=false;
function cleanup(){for(const controller of controllers)controller.dispose();controllers=[];}
function render(){
 cleanup();$('community-title').textContent=text('galleryTitle');$('community-intro').textContent=text('galleryIntro');$('community-create').textContent=text('openStudio');$('community-pending').textContent=text('pending');$('community-guide').textContent=text('guide');$('community-scope').textContent=text('scope');
 $('community-cases').replaceChildren();$('community-pagination').replaceChildren();
 if(!data){$('community-status').textContent=text(failed?'error':'loading');return;}
 $('community-status').textContent=data.length?'':text('empty');
 $('community-pending').href='https://github.com/'+config.repository+'/pulls';$('community-guide').href='https://github.com/'+config.repository+'/blob/main/docs/COMMUNITY_PR.md';
 const visible=data.slice(page*6,page*6+6);
 for(const entry of visible){
  const item=catalog.items.find(item=>item.id===entry.item_id),card=node('article');card.className='community-case';
  const heading=node('h2',entry.title),summary=node('p',entry.summary),stage=node('div');stage.className='community-case-stage';card.append(heading,summary,stage);
  const labels=effectLabels(),spec=componentSpec(item,catalog.registry,entry.params,entry.locale,labels);controllers.push(mountEffect(stage,spec));
  const author=entry.author.attribution?node('a',entry.author.display_name+' / @'+entry.author.github_login):node('p',text('anonymous'));
  if(entry.author.attribution){author.href='https://github.com/'+entry.author.github_login;author.target='_blank';author.rel='noopener noreferrer';}author.className='community-author';card.append(author);
  const url=new URL('./effect-example.html',location.href);url.searchParams.set('item',entry.item_id);url.searchParams.set('params',JSON.stringify(entry.params));
  const preview=node('a',text('preview'));preview.href=url.href;preview.className='community-preview-link';card.append(preview);$('community-cases').append(card);
 }
 const pages=Math.ceil(data.length/6);if(pages>1)for(let i=0;i<pages;i++){const button=node('button',String(i+1));button.type='button';button.setAttribute('aria-label',String(i+1));button.setAttribute('aria-current',i===page?'page':'false');button.addEventListener('click',()=>{page=i;render();$('community-title').scrollIntoView({behavior:'instant'});});$('community-pagination').append(button);}
}
setupLanguage(render);
try{
 const read=async file=>{const response=await fetch(new URL('./'+file,import.meta.url),{cache:'no-store'});if(!response.ok)throw new Error();return response.json();};
 [data,catalog,config]=await Promise.all([read('community-cases.json'),read('catalog.json'),read('community-config.json')]);data=data.map(entry=>validateCommunityCase(entry,catalog));render();
}catch{data=null;failed=true;render();}
window.addEventListener('pagehide',cleanup);
window.addEventListener('pageshow',event=>{if(event.persisted)render();});
