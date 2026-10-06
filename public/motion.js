import {followAmount,lightRGB} from './pointer-light.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(pointer: fine)');
let paused=false;
export const motionAllowed=()=>!reduced.matches&&!paused;
export function setPaused(value){paused=value;document.documentElement.classList.toggle('motion-paused',value);window.dispatchEvent(new Event('intentkit-motion-change'));}
export function attachSpotlight(el,{radius=160,opacity=.15,color='#EBCB8B',follow_ms=80}={}){
 let frame=0,target=null,position=null,lastTime=0;
 const place=()=>{el.style.setProperty('--mx',position.x+'px');el.style.setProperty('--my',position.y+'px');el.style.setProperty('--spot-opacity','1');};
 const tick=now=>{
  frame=0;if(!target||!position)return;
  const amount=followAmount(now-lastTime,follow_ms);lastTime=now;
  position.x+=(target.x-position.x)*amount;position.y+=(target.y-position.y)*amount;place();
  if(Math.abs(position.x-target.x)+Math.abs(position.y-target.y)>.2)frame=requestAnimationFrame(tick);
  else{position={...target};place();}
 };
 const move=event=>{
  if(event.pointerType!=='mouse'||!fine.matches||!motionAllowed())return;
  const rect=el.getBoundingClientRect();target={x:(event.clientX-rect.left)*el.offsetWidth/rect.width,y:(event.clientY-rect.top)*el.offsetHeight/rect.height};
  if(!position){position={...target};place();lastTime=performance.now();}if(!frame)frame=requestAnimationFrame(tick);
 };
 const leave=()=>{target=position=null;cancelAnimationFrame(frame);frame=0;el.style.setProperty('--spot-opacity','0');};
 const media=()=>{if(!motionAllowed()||!fine.matches)leave();};
 el.style.setProperty('--spot-radius',radius+'px');el.style.setProperty('--spot-color','rgba('+lightRGB(color)+','+opacity+')');
 const listeners=[[el,'pointermove',move],[el,'pointerleave',leave],[el,'pointercancel',leave],[window,'blur',leave],[window,'scroll',leave],[window,'intentkit-motion-change',leave],[reduced,'change',media],[fine,'change',media],[document,'visibilitychange',leave]];
 for(const [node,event,fn]of listeners)node.addEventListener(event,fn);
 return()=>{leave();for(const [node,event,fn]of listeners)node.removeEventListener(event,fn);};
}
export function setupAmbientMotion(){if(motionAllowed())document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.12});document.querySelectorAll('.reveal').forEach((e,i)=>{e.style.transitionDelay=(i%3)*70+'ms';observer.observe(e);});document.querySelectorAll('.spotlight').forEach(e=>attachSpotlight(e));document.querySelectorAll('.magnetic').forEach(el=>{let frame=0;const reset=()=>{cancelAnimationFrame(frame);el.style.transform='';};el.addEventListener('pointermove',e=>{if(!fine.matches||!motionAllowed())return;const r=el.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*.08,y=(e.clientY-r.top-r.height/2)*.12;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{el.style.transform=`translate(${x}px,${y}px)`;});});el.addEventListener('pointerleave',reset);reduced.addEventListener('change',reset);window.addEventListener('intentkit-motion-change',reset);});}
export function notify(message){const el=document.querySelector('#toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),3500);}
