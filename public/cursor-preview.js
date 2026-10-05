import {t} from './i18n.js';
import {motionAllowed} from './motion.js';

const ns='http://www.w3.org/2000/svg';
const shapes={
 arrow:{hotspot:[3,3],paths:['M3 3 20 11 12 13 9 21Z']},
 dot:{hotspot:[12,12],circle:[12,12,5]},
 ring:{hotspot:[12,12],circle:[12,12,8],outline:true},
 crosshair:{hotspot:[12,12],paths:['M12 3V8M12 16V21M3 12H8M16 12H21'],circle:[12,12,2],outline:true},
 star:{hotspot:[12,12],paths:['M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9Z']},
 hand:{hotspot:[10,3],paths:['M6 12V9.5Q6 8 7.5 8H8V4Q8 2 10 2T12 4V9L14 8.5 16 10 18 10Q20 10 20 12V16Q20 18 17 21H10L5 16Q3 13 4.5 12Q5.5 11.5 6 12Z','M12 9V13M15 10V14M18 12V15']},
 leaf:{hotspot:[4,20],paths:['M4 20Q2 5 21 3Q20 21 4 20Z','M4 20 16 8']},
 pencil:{hotspot:[4,20],paths:['M4 20 6 13 17 2 22 7 11 18Z','M6 13 11 18M15 4 20 9']}
};
const element=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
export function cursorSvg(shape,color){
 const spec=shapes[shape];
 if(!spec)throw new Error('Unknown cursor shape');
 const svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const add=(tag,attrs)=>{const node=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));svg.append(node);};
 const style={fill:spec.outline?'none':color,stroke:'#36402f','stroke-width':1.5,'stroke-linejoin':'round','stroke-linecap':'round'};
 for(const [index,d] of (spec.paths||[]).entries()){if(spec.outline)add('path',{...style,d,stroke:'#36402f','stroke-width':3});add('path',{...style,d,...(spec.outline?{stroke:color}:{}),...(index?{fill:'none'}:{})});}
 if(spec.circle){const [cx,cy,r]=spec.circle;if(spec.outline)add('circle',{...style,cx,cy,r,stroke:'#36402f','stroke-width':3});add('circle',{...style,cx,cy,r,...(spec.outline?{stroke:color}:{})});}
 return {svg,hotspot:spec.hotspot};
}
export function mountCursorPreview(stage,params){
 const {shape,size_px,color,follow_ms,hover_scale,click_effect,duration_ms}=params;
 const area=element('div','cursor-playground');
 area.dataset.shape=shape;area.style.setProperty('--cursor-color',color);
 const note=element('p','cursor-instruction',t('cursorMoveHint'));
 const samples=element('div','cursor-sample');
 const sample=cursorSvg(shape,color).svg;sample.style.width=size_px+'px';sample.style.height=size_px+'px';
 samples.append(sample,element('span','',t('cursorStaticHint')));
 const targets=element('div','cursor-targets');
 const button=element('button','cursor-demo-button',t('cursorTryClick'));button.type='button';
 const input=element('input','cursor-native');input.type='text';input.placeholder=t('cursorTextHint');input.setAttribute('aria-label',t('cursorTextHint'));
 const status=element('p','cursor-status');status.setAttribute('role','status');
 button.addEventListener('click',()=>status.textContent=t('cursorClicked'));
 targets.append(button,input);
 const overlay=element('div','cursor-overlay');overlay.setAttribute('aria-hidden','true');
 const glyph=element('div','cursor-glyph');
 const {svg,hotspot}=cursorSvg(shape,color);
 const anchor={x:hotspot[0]*size_px/24,y:hotspot[1]*size_px/24};
 glyph.append(svg);glyph.style.width=size_px+'px';glyph.style.height=size_px+'px';
 glyph.style.transformOrigin=anchor.x+'px '+anchor.y+'px';
 glyph.style.transition='transform '+duration_ms+'ms ease-out';
 overlay.append(glyph);
 area.append(note,samples,targets,status,overlay);stage.append(area);
 const fine=matchMedia('(pointer: fine)');
 const cleanups=[],effects=new Set();
 let frame=0,active=false,hovered=false,pressed=false,position=null,target=null,lastTime=0;
 const listen=(node,event,fn)=>{node.addEventListener(event,fn);cleanups.push(()=>node.removeEventListener(event,fn));};
 const canTrack=()=>fine.matches&&motionAllowed();
 const scale=()=>glyph.style.transform='scale('+(pressed ? .86 : hovered ? hover_scale : 1)+')';
 const localPoint=event=>{const rect=area.getBoundingClientRect();return {x:(event.clientX-rect.left)*area.offsetWidth/rect.width-area.clientLeft,y:(event.clientY-rect.top)*area.offsetHeight/rect.height-area.clientTop};};
 const place=()=>overlay.style.transform='translate3d('+(position.x-anchor.x)+'px,'+(position.y-anchor.y)+'px,0)';
 const tick=now=>{
  frame=0;if(!active||!position||!target)return;
  const delta=Math.min(64,Math.max(1,now-lastTime));lastTime=now;
  const amount=follow_ms===0?1:1-Math.exp(-delta/follow_ms);
  position.x+=(target.x-position.x)*amount;position.y+=(target.y-position.y)*amount;place();
  if(Math.abs(position.x-target.x)+Math.abs(position.y-target.y)>.2)frame=requestAnimationFrame(tick);
  else{position={...target};place();}
 };
 const reset=()=>{
  active=false;hovered=false;pressed=false;position=null;target=null;
  cancelAnimationFrame(frame);frame=0;area.classList.remove('cursor-tracking');scale();
  for(const effect of effects){effect.animation.cancel();effect.node.remove();}effects.clear();
 };
 const move=event=>{
  if(event.pointerType==='touch'||!canTrack()||event.target.closest('input,textarea,select,[contenteditable],.cursor-native')){reset();return;}
  target=localPoint(event);
  if(!active){position={...target};active=true;lastTime=performance.now();place();area.classList.add('cursor-tracking');}
  hovered=!!event.target.closest('button,a,[role="button"]');scale();
  if(!frame)frame=requestAnimationFrame(tick);
 };
 const feedback=event=>{
  move(event);
  if(!active||event.pointerType==='touch'||event.button!==0||!canTrack())return;
  pressed=true;scale();if(click_effect==='none'||duration_ms===0)return;
  const node=element('span','cursor-click-effect '+(click_effect==='pulse'?'cursor-pulse':'cursor-burst'));
  const {x,y}=localPoint(event);
  node.style.left=x+'px';node.style.top=y+'px';node.style.width=size_px+'px';node.style.height=size_px+'px';node.style.setProperty('--cursor-size',size_px+'px');
  if(click_effect==='burst'){for(let i=0;i<8;i++){const ray=element('i');ray.style.rotate=i*45+'deg';node.append(ray);}}
  area.append(node);
  const animation=node.animate([{opacity:1,transform:'translate(-50%,-50%) scale(.35)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.8)'}],{duration:duration_ms,easing:'ease-out'});
  const effect={node,animation};effects.add(effect);animation.finished.catch(()=>{}).finally(()=>{node.remove();effects.delete(effect);});
 };
 listen(area,'pointermove',move);listen(area,'pointerdown',feedback);
 listen(area,'pointerleave',reset);listen(area,'pointercancel',reset);
 listen(window,'pointerup',()=>{pressed=false;scale();});
 listen(window,'blur',reset);listen(window,'scroll',reset);listen(window,'resize',reset);
 listen(document,'keydown',event=>{if(event.key==='Tab'||event.key==='Escape')reset();});
 listen(fine,'change',reset);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');listen(reduced,'change',reset);
 return()=>{reset();cleanups.forEach(fn=>fn());area.remove();};
}

