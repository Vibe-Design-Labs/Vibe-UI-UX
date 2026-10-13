export const clamp=value=>Math.max(0,Math.min(1,value));
const curves={'ease-out':[0,0,.58,1],ease:[.25,.1,.25,1],'ease-in':[.42,0,1,1],'ease-in-out':[.42,0,.58,1]};
export function ease(value,name='ease-out'){
 const x=clamp(value);if(name==='linear'||x===0||x===1)return x;
 const [a,b,c,d]=curves[name]||curves['ease-out'];
 const bezier=(u,p,q)=>3*(1-u)*(1-u)*u*p+3*(1-u)*u*u*q+u*u*u;
 let low=0,high=1;for(let i=0;i<22;i++){const mid=(low+high)/2;if(bezier(mid,a,c)<x)low=mid;else high=mid;}
 return bezier((low+high)/2,b,d);
}
export function transition(from,to,elapsed,duration,easing='ease-out'){
 return from+(to-from)*ease(duration===0?1:elapsed/duration,easing);
}
export function follow(current,target,elapsed,timeConstant){
 return timeConstant===0?target:target+(current-target)*Math.exp(-Math.max(0,elapsed)/timeConstant);
}

// A documented 4-second demonstration, not a recording of user activity.
export const videoDurationMs=4000;
export function effectFrame(spec,timeMs,{reducedMotion=false,rowCount=3}={}){
 if(!Number.isFinite(timeMs)||timeMs<0)throw new Error('Invalid frame time');
 if(!Number.isInteger(rowCount)||rowCount<0||rowCount>100)throw new Error('Invalid row count');
 const p=spec.params,type=spec.template_id;
 const state={amount:0,pointer:{x:.5,y:.5},ripple:null,rows:Array(rowCount).fill(1)};
 if(reducedMotion)return state;
 if(type==='hover-lift'||type==='cursor-spotlight'){
  const peak=transition(0,1,Math.max(0,1800-400),p.duration_ms);
  state.amount=timeMs<400?0:timeMs<1800?transition(0,1,timeMs-400,p.duration_ms):transition(peak,0,timeMs-1800,p.duration_ms);
  if(type==='cursor-spotlight'){
   let current={x:.5,y:.5},target=current,last=0;
   for(const point of [{at:400,x:.15,y:.4},{at:900,x:.75,y:.55},{at:1500,x:.45,y:.3}]){
    if(timeMs<point.at)break;
    current={x:follow(current.x,target.x,point.at-last,p.follow_ms),y:follow(current.y,target.y,point.at-last,p.follow_ms)};
    target={x:point.x,y:point.y};last=point.at;
   }
   state.pointer={x:follow(current.x,target.x,timeMs-last,p.follow_ms),y:follow(current.y,target.y,timeMs-last,p.follow_ms)};
  }
 }else if(type==='press-feedback'){
  const peak=transition(0,1,450,p.duration_ms);
  state.amount=timeMs<650?0:timeMs<1100?transition(0,1,timeMs-650,p.duration_ms):transition(peak,0,timeMs-1100,p.duration_ms);
 }else if(type==='ripple'){
  const age=timeMs-650;
  if(age>=0&&age<p.duration_ms)state.ripple={progress:clamp(age/p.duration_ms),x:.5,y:.5};
 }else if(type==='slide-fade-list'){
  state.rows=Array.from({length:rowCount},(_,i)=>timeMs<200+i*p.delay_ms?0:transition(0,1,timeMs-200-i*p.delay_ms,p.duration_ms,p.easing));
 }
 return state;
}
