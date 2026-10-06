import {createLeafSvg,leafArt} from './leaf-art.js';
import {createPointerLight} from './pointer-light.js';
import {motionAllowed} from './motion.js';

export function attachLeafPointer(scope, params, {spotlight = true} = {}) {
  const fine=matchMedia('(pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const layer=document.createElement('div');layer.className='brand-pointer-layer';layer.setAttribute('aria-hidden','true');
  const light=createPointerLight({radius:params.spotlight_radius_px,opacity:params.spotlight_opacity,color:params.spotlight_color,follow_ms:params.spotlight_follow_ms});
  const glyph=document.createElement('div');glyph.className='brand-pointer-glyph';const art=createLeafSvg();glyph.append(art);
  const size=params.size_px,anchor=leafArt.hotspot.map(value=>value*size/leafArt.viewBox);
  glyph.style.width=glyph.style.height=size+'px';art.style.transformOrigin=anchor.join('px ')+'px';
  art.style.transition='transform '+params.duration_ms+'ms ease-out';
  if(spotlight)layer.append(light.node);layer.append(glyph);document.body.append(layer);
  const cleanups=[],effects=new Set();let active=false,pressed=false,hovered=false;
  const listen=(node,name,fn)=>{node.addEventListener(name,fn);cleanups.push(()=>node.removeEventListener(name,fn));};
  const reset=()=>{
    active=pressed=hovered=false;art.style.transform='scale(1)';layer.classList.remove('pointer-active');
    document.body.classList.remove('brand-pointer-active');light.hide();
    for(const effect of effects){effect.animation.cancel();effect.node.remove();}effects.clear();
  };
  const move=event=>{
    const target=event.target;
    if(!fine.matches||!motionAllowed()||event.pointerType!=='mouse'||!(target instanceof Element)||!scope.contains(target)||
       target.closest('input,textarea,select,option,dialog,button:disabled,[aria-busy="true"],[contenteditable]:not([contenteditable="false"]),[data-native-cursor],.cursor-playground')||getComputedStyle(target).cursor==='wait')return reset();
    active=true;hovered=!!target.closest('a,button,summary,[role="button"]');
    glyph.style.transform='translate3d('+(event.clientX-anchor[0])+'px,'+(event.clientY-anchor[1])+'px,0)';
    art.style.transform='scale('+(pressed?.9:hovered?params.hover_scale:1)+')';
    layer.classList.add('pointer-active');document.body.classList.add('brand-pointer-active');
    if(spotlight)light.move(event.clientX,event.clientY);
  };
  listen(document,'pointermove',move);
  listen(document,'pointerdown',event=>{
    move(event);if(!active||event.button!==0)return;pressed=true;art.style.transform='scale(.9)';
    if(params.duration_ms===0)return;
    const node=document.createElement('span');node.className='brand-click-pulse';node.style.left=event.clientX+'px';node.style.top=event.clientY+'px';layer.append(node);
    const animation=node.animate([{opacity:.6,transform:'translate(-50%,-50%) scale(.5)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.8)'}],{duration:params.duration_ms,easing:'ease-out'});
    const effect={node,animation};effects.add(effect);animation.finished.catch(()=>{}).finally(()=>{node.remove();effects.delete(effect);});
  });
  listen(window,'pointerup',()=>{pressed=false;art.style.transform='scale('+(hovered?params.hover_scale:1)+')';});
  listen(document,'pointerleave',reset);listen(document,'pointercancel',reset);listen(window,'blur',reset);
  listen(window,'scroll',reset);listen(window,'resize',reset);listen(window,'pagehide',reset);
  listen(document,'visibilitychange',()=>{if(document.hidden)reset();});
  listen(document,'keydown',event=>{if(event.key==='Tab'||event.key==='Escape')reset();});
  listen(window,'intentkit-motion-change',reset);listen(fine,'change',reset);listen(reduced,'change',reset);
  return()=>{reset();cleanups.forEach(fn=>fn());light.dispose();layer.remove();};
}
