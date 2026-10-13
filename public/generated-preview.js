import {validateArtifact,generatedParams} from './generated-core.js';
export function mountGeneratedPreview(container,artifact,params,{onStatus=()=>{},title='Isolated effect preview'}={}){
 const a=validateArtifact(artifact);let p=generatedParams(a,params),disposed=false,ready=false,initialized=false,revision=0;
 const frame=document.createElement('iframe');frame.title=title;frame.className='generated-frame';frame.setAttribute('sandbox','allow-scripts');frame.referrerPolicy='no-referrer';frame.setAttribute('allow',"camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'");
 const frameURL=new URL('./generated-frame.html',import.meta.url);frameURL.search=new URL(import.meta.url).search;frame.src=frameURL.href;const channel=new MessageChannel();
 const timer=setTimeout(()=>{if(!disposed&&!ready){onStatus('runtime');dispose();}},15000);
 channel.port1.onmessage=event=>{
  if(disposed)return;
  if(event.data?.type==='connected')channel.port1.postMessage({type:'mount',artifact:a,params:p,revision});
  else if(event.data?.type==='ready'){
   initialized=true;
   if(event.data.revision!==revision){channel.port1.postMessage({type:'update',artifact:a,params:p,revision});return;}
   ready=true;clearTimeout(timer);onStatus('ready');
  }
  else if(event.data?.type==='updated'&&event.data.revision===revision){ready=true;clearTimeout(timer);onStatus('ready');}
  else if(event.data?.type==='runtime'){onStatus('runtime');dispose();}
 };
 frame.addEventListener('load',()=>{if(!disposed)frame.contentWindow.postMessage({type:'intentkit-frame-connect'},'*',[channel.port2]);},{once:true});
 container.replaceChildren(frame);
 function dispose(){if(disposed)return;disposed=true;clearTimeout(timer);channel.port1.postMessage({type:'stop'});channel.port1.close();frame.remove();}
 return {dispose,update(next){p=generatedParams(a,next);revision++;ready=false;if(!disposed&&initialized)channel.port1.postMessage({type:'update',artifact:a,params:p,revision});},get frame(){return frame;}};
}
