import {validateComponentSpec} from './effect-contract.js';
import {createSpotlightRenderer} from './effect-webgl.js';
import {clamp,ease,transition,follow,effectFrame} from './effect-timing.js';

export const effectCSS=`
.ik-demo-shell,.ik-demo-shell *{box-sizing:border-box}
.ik-demo-shell{width:100%;min-height:300px;display:grid;place-items:center;padding:24px;color:#243c31;font-family:var(--intentkit-font,'IntentKit Notes',system-ui,sans-serif);font-size:18px;font-weight:400;line-height:1.5;letter-spacing:normal}
.ik-effect-card{box-sizing:border-box;position:relative;isolation:isolate;overflow:hidden;width:min(100%,340px);padding:30px;text-align:left;border:1px solid #d4ccb5;border-radius:25px;background:#faf3e3;color:#243c31;box-shadow:0 12px 28px #20392c0e;font:inherit;cursor:pointer}
.ik-effect-card:focus-visible,.ik-effect-button:focus-visible{outline:3px solid #b5452e;outline-offset:5px}
.ik-card-icon{display:block;width:46px;height:46px;border:1px solid #c7cdb6;border-radius:16px;line-height:46px;text-align:center;font-size:30px;margin-bottom:18px}
.ik-card-title{display:block;font-size:28px;line-height:1.3;font-weight:600;margin-bottom:12px}
.ik-card-body{display:block;font-size:18px;line-height:1.65;color:#566358}
.ik-card-line{display:block;height:6px;border-radius:5px;width:85%;background:#b5bfa133;margin-top:22px}.ik-card-line.short{width:58%;margin-top:10px}
.ik-effect-button{box-sizing:border-box;position:relative;isolation:isolate;overflow:hidden;border:1px solid #9b3320;border-radius:22px;background:#b5452e;color:#fff8e8;min-height:62px;padding:15px 30px;font:inherit;font-size:25px;cursor:pointer}
.ik-effect-stack{width:min(100%,340px);display:grid;gap:14px}.ik-effect-row{box-sizing:border-box;display:flex;gap:14px;align-items:center;border:1px solid #d4ccb5;border-radius:16px;background:#faf3e3;color:#243c31;padding:17px 20px;font:inherit;font-size:22px}.ik-effect-row i{width:10px;height:10px;border-radius:50%;background:#b5452e;flex:none}
.ik-spotlight-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:inherit;z-index:-1}
.ik-ripple{position:absolute;pointer-events:none;border-radius:50%;background:#fff8;transform:translate(-50%,-50%);z-index:0}
.ik-effect-card,.ik-effect-button,.ik-effect-row{will-change:translate,scale,opacity}
`;
const node=(tag,cls,text)=>{const element=document.createElement(tag);element.className=cls;if(text!==undefined)element.textContent=text;return element;};

// Bind to existing Web / React content. The binding owns only translate/scale/opacity.
export function attachEffect(target,input,{mode='interactive',reducedMotion,onBackend=()=>{}}={}){
 let spec=validateComponentSpec(input),disposed=false,frame=0,lastTime=performance.now(),begin=lastTime,fixedTime=0;
 const type=spec.template_id,abort=new AbortController(),media=matchMedia('(prefers-reduced-motion: reduce)');
 const saved={translate:target.style.translate,scale:target.style.scale,opacity:target.style.opacity,position:target.style.position,isolation:target.style.isolation,overflow:target.style.overflow};
 const rows=type==='slide-fade-list'?Array.from(target.children):[];
 if(rows.length>100)throw new Error('List implementation supports at most 100 children');
 const rowStyles=rows.map(row=>({translate:row.style.translate,opacity:row.style.opacity}));
 let amount=0,tween={from:0,to:0,start:lastTime},pointer={x:.5,y:.5},destination={x:.5,y:.5},waves=[];
 let canvas=null,renderer=null,observer=null;
 const isReduced=()=>reducedMotion??media.matches;
 const size=()=>({width:target.clientWidth||1,height:target.clientHeight||1});
 const listen=(element,event,handler)=>element.addEventListener(event,handler,{signal:abort.signal});
 if(type==='cursor-spotlight'){
  if(getComputedStyle(target).position==='static')target.style.position='relative';target.style.isolation='isolate';
  canvas=node('canvas','ik-spotlight-layer');canvas.setAttribute('aria-hidden','true');target.prepend(canvas);
  renderer=createSpotlightRenderer(canvas,{onBackend});
 }
 if(type==='ripple'){if(getComputedStyle(target).position==='static')target.style.position='relative';target.style.overflow='hidden';}
 function paint(state){
  const p=spec.params,s=size();
  if(type==='cursor-spotlight'||type==='hover-lift')target.style.translate=`0 ${-p.lift_px*state.amount}px`;
  if(type==='press-feedback')target.style.scale=String(1+(p.scale_start-1)*state.amount);
  if(type==='slide-fade-list')rows.forEach((row,i)=>{const progress=state.rows[i]??1;row.style.opacity=String(progress);row.style.translate=`0 ${p.offset_y_px*(1-progress)}px`;});
  if(renderer)renderer.draw({width:s.width,height:s.height,x:state.pointer.x*s.width,y:state.pointer.y*s.height,radius:p.radius_px,color:p.color,opacity:p.opacity*state.amount});
 }
 function clearWaves(){for(const wave of waves)wave.node.remove();waves=[];}
 function rippleView(progress,x,y,wave){
  const s=size(),diameter=Math.hypot(s.width,s.height)*2*ease(progress,'ease-out');
  wave.style.left=x*s.width+'px';wave.style.top=y*s.height+'px';wave.style.width=wave.style.height=diameter+'px';wave.style.opacity=String(1-progress);
 }
 function tick(now){
  frame=0;if(disposed||mode!=='interactive')return;
  const p=spec.params,dt=Math.max(0,now-lastTime);lastTime=now;
  amount=isReduced()?0:transition(tween.from,tween.to,now-tween.start,p.duration_ms??0);
  pointer=isReduced()?{x:.5,y:.5}:{x:follow(pointer.x,destination.x,dt,p.follow_ms??0),y:follow(pointer.y,destination.y,dt,p.follow_ms??0)};
  const state={amount,pointer,rows:rows.map((_,i)=>isReduced()?1:now-begin<i*p.delay_ms?0:transition(0,1,now-begin-i*p.delay_ms,p.duration_ms,p.easing))};
  paint(state);
  const remaining=[];for(const wave of waves){const age=now-wave.start;if(isReduced()||age>=p.duration_ms)wave.node.remove();else{rippleView(clamp(age/p.duration_ms),wave.x,wave.y,wave.node);remaining.push(wave);}}waves=remaining;
  const moving=Math.abs(amount-tween.to)>.00001&&!isReduced();
  const following=type==='cursor-spotlight'&&amount>0&&(Math.abs(pointer.x-destination.x)+Math.abs(pointer.y-destination.y)>.0001);
  const entering=type==='slide-fade-list'&&rows.length>0&&!isReduced()&&now-begin<(rows.length-1)*p.delay_ms+p.duration_ms;
  if(moving||following||entering||waves.length)schedule();
 }
 function schedule(){if(!disposed&&mode==='interactive'&&!frame)frame=requestAnimationFrame(tick);}
 function change(to){if(mode!=='interactive'||disposed||isReduced()||to===tween.to)return;const now=performance.now();amount=transition(tween.from,tween.to,now-tween.start,spec.params.duration_ms??0);tween={from:amount,to,start:now};lastTime=now;schedule();}
 if(type==='hover-lift'||type==='cursor-spotlight'){
  listen(target,'pointerenter',event=>{if(event.pointerType!=='touch')change(1);});
  listen(target,'pointermove',event=>{if(event.pointerType==='touch'||mode!=='interactive'||isReduced())return;const rect=target.getBoundingClientRect();destination={x:clamp((event.clientX-rect.left)/rect.width),y:clamp((event.clientY-rect.top)/rect.height)};schedule();});
  listen(target,'pointerleave',()=>{if(!target.matches(':focus-visible')&&!target.querySelector(':focus-visible'))change(0);});
  listen(target,'focusin',event=>{if(event.target.matches(':focus-visible')){destination={x:.5,y:.5};change(1);}});listen(target,'focusout',event=>{if(!target.contains(event.relatedTarget))change(0);});
  listen(target,'pointercancel',()=>change(0));listen(window,'blur',()=>change(0));
 }else if(type==='press-feedback'){
  listen(target,'pointerdown',event=>{if(event.button===0){change(1);try{target.setPointerCapture(event.pointerId);}catch{}}});
  for(const event of ['pointerup','pointercancel','pointerleave','lostpointercapture','blur'])listen(target,event,()=>change(0));
  listen(target,'pointermove',event=>{const rect=target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)change(0);});
  listen(window,'blur',()=>change(0));
  listen(target,'keydown',event=>{if([' ','Enter'].includes(event.key))change(1);});listen(target,'keyup',()=>change(0));
 }else if(type==='ripple'){
  listen(target,'click',event=>{if(mode!=='interactive'||isReduced()||spec.params.duration_ms===0)return;const rect=target.getBoundingClientRect(),wave=node('i','ik-ripple');wave.setAttribute('aria-hidden','true');target.append(wave);
   const x=event.detail?clamp((event.clientX-rect.left)/rect.width):.5,y=event.detail?clamp((event.clientY-rect.top)/rect.height):.5;
   waves.push({node:wave,x,y,start:performance.now()});if(waves.length>12){waves.shift().node.remove();}schedule();});
 }
 function repaint(){if(frame)cancelAnimationFrame(frame);frame=0;if(mode==='frame')renderAt(fixedTime);else tick(performance.now());}
 function renderAt(timeMs){if(disposed)return;if(frame)cancelAnimationFrame(frame);frame=0;mode='frame';fixedTime=timeMs;clearWaves();const state=effectFrame(spec,timeMs,{reducedMotion:isReduced(),rowCount:rows.length||3});paint(state);
  if(state.ripple){const wave=node('i','ik-ripple');wave.setAttribute('aria-hidden','true');target.append(wave);waves.push({node:wave});rippleView(state.ripple.progress,state.ripple.x,state.ripple.y,wave);}
 }
 listen(media,'change',()=>{if(isReduced()){tween={from:0,to:0,start:performance.now()};clearWaves();}repaint();});
 listen(document,'visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else{lastTime=performance.now();schedule();}});
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(repaint);observer.observe(target);}
 if(mode==='frame')renderAt(0);else tick(lastTime);
 return {element:target,get spec(){return spec;},get backend(){return renderer?.backend||'dom';},
  update(params){spec=validateComponentSpec(spec,params);repaint();},renderAt,
  play(){if(frame)cancelAnimationFrame(frame);frame=0;mode='interactive';clearWaves();amount=0;tween={from:0,to:0,start:performance.now()};begin=lastTime=performance.now();pointer=destination={x:.5,y:.5};tick(lastTime);},
  dispose(){if(disposed)return;disposed=true;abort.abort();observer?.disconnect();if(frame)cancelAnimationFrame(frame);clearWaves();renderer?.dispose();canvas?.remove();for(const [key,value]of Object.entries(saved))target.style[key]=value;rows.forEach((row,i)=>Object.assign(row.style,rowStyles[i]));}
 };
}

export function mountEffect(host,spec,options={}){
 const labels={title:'A little warmth',body:'Move here, or use the keyboard. Your parameters shape the response.',button:'Try the effect',rows:['Understand','Adjust','Create'],...spec.labels,...options.labels};
 const shell=node('div','ik-demo-shell'),style=node('style','');style.textContent=effectCSS;shell.append(style);
 let target;
 if(spec.template_id==='slide-fade-list'){target=node('div','ik-effect-stack');for(const text of labels.rows){const row=node('div','ik-effect-row');row.append(node('i',''),node('span','',text));target.append(row);}}
 else if(['press-feedback','ripple'].includes(spec.template_id)){target=node('button','ik-effect-button',labels.button);target.type='button';}
 else{target=node('button','ik-effect-card');target.type='button';target.append(node('span','ik-card-icon','↗'),node('span','ik-card-title',labels.title),node('span','ik-card-body',labels.body),node('span','ik-card-line'),node('span','ik-card-line short'));}
 shell.append(target);host.append(shell);const controller=attachEffect(target,spec,options);
 const dispose=controller.dispose;controller.dispose=()=>{dispose();shell.remove();};return controller;
}
