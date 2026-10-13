import {componentSpec,canExportComponent} from './effect-contract.js';
import {componentArchive} from './effect-export.js';
import {componentText,effectLabels} from './component-strings.js';
import {locale} from './i18n.js';
import {canExportCompilation} from './compiler-core.js';

export function setupComponentExport({getState}){
 const panel=document.querySelector('#component-export');if(!panel)return {refresh(){}};
 const target=panel.querySelector('select'),button=panel.querySelector('button'),link=panel.querySelector('a'),status=panel.querySelector('[role="status"]');
 let pending=false;
 const blocked=state=>!!state.compilation?.recipe&&state.compilation.recipe.item_id===state.item?.id&&!canExportCompilation(state.compilation);
 function refresh(){
  const state=getState(),supported=canExportComponent(state.item);
  panel.querySelector('h3').textContent=componentText('title');panel.querySelector('label > span').textContent=componentText('target');
  for(const option of target.options)option.textContent=componentText(option.value);
  button.textContent=componentText(pending?'busy':'download');button.disabled=pending||!supported||blocked(state);target.disabled=pending||!supported;
  link.textContent=componentText('open');link.hidden=!supported||blocked(state);
  status.textContent=componentText(!supported?'unsupported':blocked(state)?'conflict':'supported');
  if(supported){const url=new URL('./effect-example.html',location.href);url.searchParams.set('item',state.item.id);url.searchParams.set('params',JSON.stringify(state.params));link.href=url.href;}
 }
 button.addEventListener('click',async()=>{
  const state=getState();if(pending||!canExportComponent(state.item)||blocked(state))return;
  const snapshot=componentSpec(state.item,state.registry,state.params,locale,effectLabels()),selectedTarget=target.value;
  const compilation=state.compilation?.recipe?.item_id===state.item.id?structuredClone(state.compilation):null;
  pending=true;refresh();
  try{const version=new URL(import.meta.url).searchParams.get('v')||'development';const blob=await componentArchive(snapshot,selectedTarget,{version,compilation});
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=snapshot.item_id+'-'+selectedTarget+'.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{status.textContent=componentText('failed');}finally{pending=false;const failed=status.textContent===componentText('failed');refresh();if(failed)status.textContent=componentText('failed');}
 });
 refresh();return {refresh};
}
