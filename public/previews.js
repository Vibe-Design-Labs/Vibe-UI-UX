import {t} from './i18n.js';
import {mountCursorPreview} from './cursor-preview.js';
import {motionAllowed} from './motion.js';
import {rendererIds,sceneFamilies} from './preview-capabilities.js';
import {mountDedicatedScene} from './preview-scenes.js';
import {componentTemplates,validateComponentSpec} from './effect-contract.js';
import {mountEffect} from './effect-kit.js';
import effectRegistry from './effect-registry.js';
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
export {rendererIds};
export function mountPreview(stage,item,params={}){stage.replaceChildren();const type=item.preview?.template_id;const cleaners=[];const animations=[];const timers=[];const time=fn=>{const timer=setTimeout(fn,params.feedback_delay_ms??0);timers.push(timer);};const animate=(node,frames,options)=>{if(motionAllowed())animations.push(node.animate(frames,{fill:'both',...options}));};
 const card=()=>{const c=el('div','preview-card');c.append(el('div','demo-icon','↗'),el('h4','',t('cardTitle')),el('p','',t('cardBody')),el('div','demo-line'),el('div','demo-line short'));c.style.setProperty('--duration',(params.duration_ms??240)+'ms');c.style.setProperty('--lift',motionAllowed()?(params.lift_px??6)+'px':'0px');return c;};
 if(sceneFamilies[type])return mountDedicatedScene(stage,item,params);
 if(componentTemplates.includes(type)){
  const spec=validateComponentSpec({schema:'intentkit.component',schema_version:1,template_id:type,params,contract:effectRegistry[type],labels:{title:t('cardTitle'),body:t('cardBody'),button:t('start'),rows:[t('tab1'),t('tab2'),t('tab3')]}});
  const controller=mountEffect(stage,spec,{reducedMotion:!motionAllowed()});return()=>controller.dispose();
 }
 if(type==='custom-cursor'){cleaners.push(mountCursorPreview(stage,params));}
 else if(type==='scale-fade'){const c=card();stage.append(c);animate(c,[{opacity:0,transform:`scale(${params.scale_start})`},{opacity:1,transform:'scale(1)'}],{duration:params.duration_ms,easing:params.easing});}
 else if(type==='skeleton-shimmer'){const c=el('div','demo-ui demo-skeleton');c.setAttribute('aria-label',t('loading'));c.style.setProperty('--duration',params.duration_ms+'ms');for(let i=0;i<4;i++)c.append(el('i'));stage.append(c);}
 else if(type==='progress-fill'){const c=el('div','demo-ui');c.append(el('h4','',t('progress')));const bar=el('div','demo-progress');bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',t('progress'));bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',String(params.progress));const fill=el('i');fill.style.width=params.progress+'%';bar.append(fill);c.append(bar,el('span','',params.progress+'%'));stage.append(c);animate(fill,[{width:'0%'},{width:params.progress+'%'}],{duration:params.duration_ms,easing:params.easing});}
 else if(type==='tab-state'){const group=el('div','demo-tabs');group.setAttribute('role','group');group.setAttribute('aria-label',t('tab1'));let selected=0;const buttons=[0,1,2].map(i=>{const b=el('button',i===0?'active':'',t(['tab1','tab2','tab3'][i]));b.type='button';b.setAttribute('aria-pressed',String(i===0));b.style.setProperty('--duration',params.duration_ms+'ms');b.addEventListener('click',()=>{selected=i;buttons.forEach((x,j)=>{x.classList.toggle('active',j===selected);x.setAttribute('aria-pressed',String(j===selected));});});return b;});group.append(...buttons);stage.append(group);}
 else if(type==='ux-state-comparison'){const c=el('div','preview-save'),b=el('button','',t('saveDemo')),status=el('p','',t('demoOnly'));b.type='button';status.setAttribute('role','status');b.addEventListener('click',()=>{b.disabled=true;b.textContent=t('saving');status.textContent=t('saving');time(()=>{b.disabled=false;b.textContent=t('saveDemo');status.textContent=t('saved')+' · '+t('demoOnly');});});c.append(b,status);stage.append(c);}
 else if(type==='focus-ring'){const c=el('div','demo-ui');const input=el('input','focus-target');input.type='text';input.placeholder=t('cardTitle');input.setAttribute('aria-label',t('cardTitle'));input.style.setProperty('--offset',params.offset_px+'px');c.append(input,el('p','',t('demoOnly')));stage.append(c);}
 else if(type==='ux-disclosure'){const c=el('div','demo-ui'),details=el('details'),summary=el('summary','',t('designLanguage'));c.append(el('h4','',t('cardTitle')),el('p','',t('cardBody')));details.append(summary,el('p','',t('sameParams')));c.append(details);stage.append(c);}
 else if(type==='ux-error'){const c=el('div','demo-ui'),p=el('p','',t('apiNetwork')),b=el('button','',t('replay'));p.setAttribute('role','status');b.addEventListener('click',()=>{p.textContent=t('saved')+' · '+t('demoOnly');b.disabled=true;});c.append(el('h4','',t('effectFeedback')),p,b);stage.append(c);}
 else if(type==='ux-empty'){const c=el('div','demo-ui'),p=el('p','',t('noResults')),b=el('button','',t('cardTitle'));b.addEventListener('click',()=>{p.textContent=t('cardBody');b.disabled=true;});c.append(el('h4','',t('tab2')),p,b);stage.append(c);}
 else if(type==='ux-validation'){const c=el('div','demo-ui'),label=el('label','',t('email')),input=el('input','focus-target'),p=el('p');input.type='email';input.id='preview-email';label.htmlFor=input.id;input.placeholder='you@example.com';p.id='preview-email-error';p.setAttribute('role','status');input.setAttribute('aria-describedby',p.id);const validate=()=>{const invalid=!!input.value&&!input.validity.valid;input.setAttribute('aria-invalid',String(invalid));p.textContent=invalid?t('invalidEmail'):'';};input.addEventListener('blur',validate);input.addEventListener('input',()=>{if(input.validity.valid)validate();});c.append(label,input,p);stage.append(c);}
 else throw new Error('No implemented preview: '+String(type));
 return()=>{cleaners.forEach(f=>f());animations.forEach(a=>a.cancel());timers.forEach(clearTimeout);stage.replaceChildren();};
}
