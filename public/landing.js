import {setupLanguage,t} from './i18n.js';
import {setupAmbientMotion,setPaused} from './motion.js';
import {mountPreview} from './previews.js';
import {attachLeafPointer} from './brand-pointer.js';
import {effectiveParams} from './core.js';
let current='spotlight',cleanup=()=>{},paused=false,cursorCatalog=null;
const stage=document.querySelector('#hero-demo'),range=document.querySelector('#hero-power');
const shapeSelect=document.querySelector('#hero-cursor-shape'),colorInput=document.querySelector('#hero-cursor-color');
const shapeLabel=id=>'cursor'+id[0].toUpperCase()+id.slice(1);
function render(){
 cleanup();
 const value=Number(range.value);document.querySelector('#hero-value').textContent=value+'%';
 document.querySelector('.hero-console').classList.toggle('cursor-demo-active',current==='cursor');
 document.querySelector('#hero-cursor-options').hidden=current!=='cursor';
 const intent=document.querySelector('#intent-label');intent.dataset.i18n=current==='cursor'?'cursorDemoIntent':'demoIntent';intent.textContent=t(intent.dataset.i18n);intent.style.whiteSpace='pre-line';
 for(const option of shapeSelect.options)option.textContent=t(shapeLabel(option.value));
 const defs={spotlight:{id:'cursor-spotlight',name:'Cursor Spotlight + Hover Lift',template:'cursor-spotlight',params:{radius_px:70+value*2,opacity:value*.0035,lift_px:value/8,duration_ms:240,color:'#EBCB8B',follow_ms:80}},stagger:{id:'staggered-reveal',name:'Staggered Reveal',template:'slide-fade-list',params:{duration_ms:180+value*4,delay_ms:value*2,offset_y_px:value/3,easing:'ease-out'}},feedback:{id:'save-feedback',name:'Save Feedback',template:'ux-state-comparison',params:{feedback_delay_ms:value*10}}};
 let d=defs[current];
 if(current==='cursor'){
  const item=cursorCatalog.items.find(i=>i.id==='custom-cursor');
  const sizeRule=cursorCatalog.registry.templates['custom-cursor'].params.size_px;
  const size=Math.round(sizeRule.min+(sizeRule.max-sizeRule.min)*value/100);
  const params=effectiveParams(item,cursorCatalog.registry,{shape:shapeSelect.value,color:colorInput.value,size_px:size});
  d={id:item.id,name:item.canonical_name,template:item.preview.template_id,params};
 }
 cleanup=mountPreview(stage,{id:d.id,preview:{template_id:d.template}},d.params);
 document.querySelector('#demo-term').textContent=d.name;
 document.querySelector('#demo-description').textContent=current==='cursor'?t('cursorDemoDescription'):current==='spotlight'?t('demoDescription'):current==='stagger'?t('step2Body'):t('demoOnly');
 const studioUrl=new URL('./studio.html?item='+d.id,import.meta.url);if(current==='cursor')studioUrl.searchParams.set('params',JSON.stringify(d.params));
 document.querySelector('.console-footer a').href=studioUrl.href;
}
const cursorTab=document.querySelector('[data-effect="cursor"]');cursorTab.disabled=true;
fetch(new URL('./catalog.json',import.meta.url),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Catalog unavailable');return r.json();}).then(catalog=>{
 const rules=catalog.registry.templates['custom-cursor'].params,item=catalog.items.find(i=>i.id==='custom-cursor');if(!item)throw new Error('Cursor unavailable');
 cursorCatalog=catalog;
 for(const id of rules.shape.values){const option=document.createElement('option');option.value=id;option.textContent=t(shapeLabel(id));shapeSelect.append(option);}
 shapeSelect.value=item.preview.params.shape;colorInput.value=item.preview.params.color;cursorTab.disabled=false;
 const dispose=attachLeafPointer(document.body,effectiveParams(item,catalog.registry));addEventListener('pagehide',event=>{if(!event.persisted)dispose();});
}).catch(()=>{cursorTab.hidden=true;});
setupLanguage(render);render();setupAmbientMotion();
range.addEventListener('input',render);shapeSelect.addEventListener('change',render);colorInput.addEventListener('input',render);
document.querySelector('#hero-replay').addEventListener('click',render);
document.querySelectorAll('.effect-tab').forEach(b=>{
 b.setAttribute('aria-pressed',String(b.dataset.effect===current));
 b.addEventListener('click',()=>{current=b.dataset.effect;document.querySelectorAll('.effect-tab').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();});
});
const pause=document.createElement('button');pause.className='ambient-pause';pause.textContent=t('pauseMotion');
pause.addEventListener('click',()=>{paused=!paused;setPaused(paused);pause.textContent=t(paused?'resumeMotion':'pauseMotion');render();});
document.querySelector('.site-footer').append(pause);
document.querySelector('#language').addEventListener('change',()=>pause.textContent=t(paused?'resumeMotion':'pauseMotion'));
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',render);
