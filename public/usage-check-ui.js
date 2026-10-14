import {requestUsageCheck} from './usage-check.js';
import {aiText} from './generated-strings.js';
import {diagnostic} from './model-response.js';
import {t} from './i18n.js';
export function setupUsageCheck({container,getKey,mode}){
 const section=document.createElement('section');section.className='usage-check';const note=document.createElement('p'),button=document.createElement('button'),status=document.createElement('p'),copy=document.createElement('button'),report=document.createElement('textarea');
 status.setAttribute('role','status');report.readOnly=true;report.spellcheck=false;report.hidden=true;copy.hidden=true;section.append(note,button,status,copy,report);container.append(section);
 let active=null,value=null,error=null,lastQuery=0,done=false;
 function refresh(){note.textContent=aiText('usageScope');button.textContent=aiText(active?'usageWorking':'usageCheck');button.disabled=!getKey()||!!active;copy.textContent=aiText('usageCopy');copy.hidden=!value;report.hidden=!value;if(value)report.value=JSON.stringify(value,null,2);status.textContent=error?aiText('usageFailure')+(error.status?' (HTTP '+error.status+')':''):done?aiText('usageDone'):'';}
 function cancel(){if(active){active.abort();active=null;}}
 function clear(){cancel();value=null;error=null;done=false;refresh();}
 button.addEventListener('click',async()=>{
  if(active||!getKey())return;if(Date.now()-lastQuery<1100){status.textContent=aiText('usageWait');return;}
  const controller=new AbortController();active=controller;lastQuery=Date.now();value=null;error=null;done=false;refresh();const timer=setTimeout(()=>controller.abort(new DOMException('Usage lookup timed out','TimeoutError')),20000);
  try{const result=await requestUsageCheck({key:getKey(),mode,signal:controller.signal});if(active===controller){value=result;done=true;}}
  catch(failure){if(active===controller){error=diagnostic(failure);value={schema:'intentkit.usage-check-diagnostic',generationRequested:false,diagnostic:error};}}
  finally{clearTimeout(timer);if(active===controller){active=null;refresh();}}
 });
 copy.addEventListener('click',async()=>{if(!value)return;try{await navigator.clipboard.writeText(JSON.stringify(value,null,2));status.textContent=t('copied');}catch{status.textContent=t('copyFail');report.focus();report.select();}});
 addEventListener('pagehide',clear);refresh();return {refresh,clear,cancel};
}
