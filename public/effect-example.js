import {componentSpec,canExportComponent} from './effect-contract.js';
import {mountEffect} from './effect-kit.js';
import {componentText,effectLabels} from './component-strings.js';
import {setupComponentExport} from './effect-code-ui.js';
import {effectiveParams,makeBrief} from './core.js';
import {setupLanguage,locale,t} from './i18n.js';
const $=selector=>document.querySelector(selector);
let catalog,item,params,controller,codeUI,frameTime=null;
const labels={lift_px:'lift',duration_ms:'duration',radius_px:'radius',opacity:'opacity',color:'spotlightColor',follow_ms:'spotlightFollow',scale_start:'scale',delay_ms:'delay',offset_y_px:'distance',easing:'easing'};
function render(){
 if(!item)return;controller?.dispose();
 $('#example-title').textContent=componentText('exampleTitle');$('#example-body').textContent=componentText('exampleBody');$('#timeline-label').textContent=componentText('timeline');$('#return-interactive').textContent=componentText('play');$('#back-studio').textContent=t('backHome')+' / Studio';
 const url=new URL('./studio.html',location.href);url.searchParams.set('item',item.id);url.searchParams.set('params',JSON.stringify(params));$('#back-studio').href=url.href;
 const spec=componentSpec(item,catalog.registry,params,locale,effectLabels());
 controller=mountEffect($('#effect-host'),spec,{onBackend(backend){$('#renderer-status').textContent=componentText('backend')+': '+(backend==='webgl'?'WebGL':componentText('fallback'));}});
 if(item.preview.template_id!=='cursor-spotlight')$('#renderer-status').textContent='DOM';
 if(frameTime!==null)controller.renderAt(frameTime);
 $('#example-brief').textContent=makeBrief(item,catalog.registry,locale,params);$('#example-params').replaceChildren();
 for(const [key,rule]of Object.entries(spec.contract.params)){
  const label=document.createElement('label');label.className='param-control';const line=document.createElement('span'),name=document.createElement('span'),output=document.createElement('output');name.textContent=t(labels[key]||key);output.textContent=params[key];line.append(name,output);let input;
  if(rule.type==='enum'){input=document.createElement('select');for(const value of rule.values){const option=document.createElement('option');option.value=option.textContent=value;input.append(option);}}
  else{input=document.createElement('input');input.type=rule.type==='color'?'color':'range';if(rule.type==='number'){input.min=rule.min;input.max=rule.max;input.step=rule.step??(['opacity','scale_start'].includes(key)?.01:1);}}
  input.value=params[key];input.dataset.param=key;input.addEventListener('input',()=>{params=effectiveParams(item,catalog.registry,{...params,[key]:rule.type==='number'?Number(input.value):input.value});output.textContent=params[key];controller.update(params);$('#example-brief').textContent=makeBrief(item,catalog.registry,locale,params);const address=new URL(location.href);address.searchParams.set('params',JSON.stringify(params));history.replaceState(null,'',address);updateStudioLink();codeUI.refresh();});label.append(line,input);$('#example-params').append(label);
 }codeUI?.refresh();
}
function updateStudioLink(){const address=new URL('./studio.html',location.href);address.searchParams.set('item',item.id);address.searchParams.set('params',JSON.stringify(params));$('#back-studio').href=address.href;}
setupLanguage(render);
try{const response=await fetch(new URL('./catalog.json',import.meta.url),{cache:'no-store'});if(!response.ok)throw new Error();catalog=await response.json();const query=new URL(location.href).searchParams;item=catalog.items.find(entry=>entry.id===(query.get('item')||'cursor-spotlight'));if(!canExportComponent(item))throw new Error('Component implementation unavailable');
 const text=query.get('params');if(text?.length>1000)throw new Error('Invalid parameters');params=effectiveParams(item,catalog.registry,text?JSON.parse(text):{});
 codeUI=setupComponentExport({getState:()=>({item,params,registry:catalog.registry})});render();
 $('#frame-time').addEventListener('input',event=>{frameTime=Number(event.target.value);$('#frame-output').textContent=frameTime+' ms';controller.renderAt(frameTime);});
 $('#return-interactive').addEventListener('click',()=>{frameTime=null;controller.play();});window.addEventListener('pagehide',()=>controller?.dispose());
}catch{$('#example-body').textContent=componentText('unsupported');}
