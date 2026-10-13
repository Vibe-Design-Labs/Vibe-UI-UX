import {validateArtifact,generatedParams} from './generated-core.js';
// This trusted bootstrap runs only inside an opaque-origin sandbox. No key is sent here.
let port,controller,url,started=false,closed=false;
const root=document.querySelector('#effect-root'),style=document.createElement('style');document.head.append(style);
const report=(type,revision)=>port?.postMessage({type,revision});
function stop(){closed=true;try{controller?.dispose();}catch{}controller=null;if(url)URL.revokeObjectURL(url);url=null;root.replaceChildren();style.textContent='';}
async function mount(value){
 try{
  const a=validateArtifact(value.artifact),p=generatedParams(a,value.params);style.textContent=a.css;
  const parsed=new DOMParser().parseFromString(a.html,'text/html');root.replaceChildren(...Array.from(parsed.body.childNodes));
  url=URL.createObjectURL(new Blob([a.js],{type:'text/javascript'}));
  const module=await import(url);if(closed)return;
  controller=module.default(root,p,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
  if(!controller||typeof controller.update!=='function'||typeof controller.dispose!=='function')throw new Error();
  if(!closed)report('ready',value.revision);
 }catch{report('runtime');stop();}
}
addEventListener('error',()=>{report('runtime');stop();});
addEventListener('unhandledrejection',()=>{report('runtime');stop();});
addEventListener('message',event=>{
 if(started||event.source!==parent||event.data?.type!=='intentkit-frame-connect'||event.ports.length!==1)return;
 started=true;port=event.ports[0];port.onmessage=message=>{
  const data=message.data;if(!data||closed)return;
  if(data.type==='mount')mount(data);
  else if(data.type==='update'){try{controller?.update(generatedParams(data.artifact,data.params));report('updated',data.revision);}catch{report('runtime');stop();}}
  else if(data.type==='stop'){stop();port.close();}
 };port.start();report('connected');
},{once:false});
addEventListener('pagehide',stop);
