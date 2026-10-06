export function lightRGB(color) {
  if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) throw new Error('Invalid light color');
  return [1,3,5].map(index => parseInt(color.slice(index,index+2),16)).join(',');
}
export function followAmount(delta, constant) { return constant === 0 ? 1 : 1 - Math.exp(-Math.min(64,Math.max(1,delta)) / constant); }
export function createPointerLight({radius, opacity, color, follow_ms = 80}) {
  const node = document.createElement('div');node.className='pointer-light';node.setAttribute('aria-hidden','true');
  node.style.width=node.style.height=radius*2+'px';
  node.style.setProperty('--light-rgb',lightRGB(color));node.style.setProperty('--light-opacity',opacity);
  let position=null,target=null,frame=0,lastTime=0;
  const place=()=>node.style.transform='translate3d('+(position.x-radius)+'px,'+(position.y-radius)+'px,0)';
  const tick=now=>{
    frame=0;if(!position||!target)return;
    const amount=followAmount(now-lastTime,follow_ms);lastTime=now;
    position.x+=(target.x-position.x)*amount;position.y+=(target.y-position.y)*amount;place();
    if(Math.abs(position.x-target.x)+Math.abs(position.y-target.y)>.2)frame=requestAnimationFrame(tick);
    else{position={...target};place();}
  };
  const hide=()=>{cancelAnimationFrame(frame);frame=0;target=position=null;node.classList.remove('light-active');};
  return {node,hide,move(x,y){
    if(opacity===0)return;
    target={x,y};if(!position){position={...target};place();lastTime=performance.now();}
    node.classList.add('light-active');if(!frame)frame=requestAnimationFrame(tick);
  },dispose(){hide();node.remove();}};
}
