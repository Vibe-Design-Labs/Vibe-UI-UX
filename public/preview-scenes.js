import {locale} from './i18n.js';
import {motionAllowed} from './motion.js';
import {createLeafSvg} from './leaf-art.js';
import {sceneFamilies} from './preview-capabilities.js';
import {sceneText} from './scene-strings.js';

const ns='http://www.w3.org/2000/svg';
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svgNode=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,String(value));return n;};
const palette=['#526047','#B5452E','#AE8549','#A7B79B','#D8BA90','#8EADAA'];
const luminance=color=>{const values=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const readable=color=>{
 const dark='#253025',light='#FFFAF0',preferred=contrast(color,dark)>contrast(color,light)?dark:light;
 return contrast(color,preferred)>=4.5?preferred:contrast(color,'#000000')>=4.5?'#000000':'#FFFFFF';
};
const blend=(color,amount)=>'#'+[1,3,5].map((index,i)=>Math.round(parseInt(color.slice(index,index+2),16)*amount+[255,250,240][i]*(1-amount)).toString(16).padStart(2,'0')).join('');

function chart(values,{compare,forecast,label}={}){
 const s=svgNode('svg',{viewBox:'0 0 360 170',role:'img','aria-label':label||values.join(', ')});
 for(let y=30;y<160;y+=40)s.append(svgNode('path',{d:`M12 ${y}H348`,stroke:'#C8B99A','stroke-width':1,opacity:.45}));
 const points=values.map((v,i)=>[12+i*336/(values.length-1),150-v*1.2]);
 if(forecast){const start=points[Math.max(1,points.length-forecast-1)],last=points.at(-1);s.append(svgNode('path',{d:`M${start[0]} ${start[1]-12}L${last[0]} ${last[1]-22}L${last[0]} ${last[1]+22}L${start[0]} ${start[1]+12}Z`,fill:'#AE8549',opacity:.17}));}
 const path=(pts,color,dashed=false)=>svgNode('polyline',{points:pts.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':3,'stroke-linejoin':'round',...(dashed?{'stroke-dasharray':'7 5'}:{})});
 if(compare)s.append(path(compare.map((v,i)=>[12+i*336/(compare.length-1),150-v*1.2]),'#AE8549'));
 if(forecast){const split=points.length-forecast-1;s.append(path(points.slice(0,split+1),'#526047'),path(points.slice(split),'#B5452E',true));}else s.append(path(points,'#526047'));
 for(const [i,[x,y]]of points.entries())s.append(svgNode('circle',{cx:x,cy:y,r:3,fill:forecast&&i>points.length-forecast-1?'#B5452E':'#526047'}));
 return s;
}

function context(stage,item,p){
 const controller=new AbortController(),animations=new Set(),timers=new Set(),intervals=new Set(),afters=[],cleaners=[];
 const id=item.preview.template_id,root=node('div',`scene scene-${id}`),canvas=node('div','scene-canvas');root.dataset.sceneId=id;root.dataset.family=sceneFamilies[id];
 const s=key=>sceneText(key,locale),heading=node('div','scene-heading');heading.append(node('span','scene-caption',s('demo')),node('span','scene-index',item.canonical_name));
 root.append(heading,canvas,node('p','scene-note',(sceneFamilies[id]==='dashboard'?s('sample')+' · ':'')+s('local')));stage.append(root);
 const mapping={gap_px:'gap',corner_px:'corner',shadow_px:'shadow',blur_px:'blur',border_px:'border',space_px:'space',heading_px:'heading',font_size_px:'font',depth_px:'depth',row_px:'row',distance_px:'distance',lift_px:'lift'};
 for(const [key,css]of Object.entries(mapping))if(key in p)root.style.setProperty('--scene-'+css,p[key]+'px');
 for(const key of ['accent','text_color','shine','intensity','glass_strength'])if(key in p)root.style.setProperty('--scene-'+key,p[key]);
 if(p.accent)root.style.setProperty('--scene-on-accent',readable(p.accent));
 const on=(n,event,fn,options={})=>n.addEventListener(event,fn,{...options,signal:controller.signal});
 const button=(key,fn,cls='')=>{const b=node('button','scene-button '+cls,s(key));b.type='button';if(fn)on(b,'click',fn);return b;};
 const status=node('p','scene-status');status.setAttribute('role','status');
 const animate=(n,frames,options={})=>{if(!motionAllowed())return;const a=n.animate(frames,{duration:p.duration_ms??400,easing:'ease-out',fill:'both',...options});animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));};
 const later=(fn,ms)=>{const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);timers.add(timer);return timer;};
 const after=fn=>afters.push(fn);
 const interrupt=()=>{for(const a of animations)a.cancel();animations.clear();for(const i of intervals)clearInterval(i);intervals.clear();for(const c of cleaners)c();};
 on(document,'visibilitychange',()=>{if(document.hidden)interrupt();});on(window,'blur',interrupt);on(window,'intentkit-motion-change',interrupt);
 const media=matchMedia('(prefers-reduced-motion: reduce)');on(media,'change',interrupt);
 const title=(key='grow')=>node('h3','scene-title',s(key));
 const text=(key='small',cls='')=>node('p','scene-text '+cls,s(key));
 const badge=(value,key)=>{const box=node('div','scene-metric');box.append(node('span','scene-label',s(key)),node('strong','',String(value)));return box;};
 const leaf=override=>{const shape=createLeafSvg(override||p.accent||'#526047');shape.classList.add('scene-leaf');return shape;};
 const tabs=(keys,callback)=>{const group=node('div','scene-tabs'),buttons=keys.map((key,i)=>{const b=button(key,()=>{buttons.forEach((x,j)=>x.setAttribute('aria-pressed',String(i===j)));callback(i);});b.setAttribute('aria-pressed',String(i===0));return b;});group.append(...buttons);return group;};
 const c={root,canvas,item,p,id,s,on,button,status,animate,later,after,title,text,badge,leaf,tabs,intervals,cleaners};
 c.finish=()=>{for(const fn of afters)fn();};
 c.cleanup=()=>{controller.abort();interrupt();for(const t of timers)clearTimeout(t);timers.clear();root.remove();};return c;
}

function style(c){
 const {canvas:b,p,id,s,title,text,button,leaf,status,animate,after,tabs,on}=c;
 if(id==='organic-biophilic'){
  const picture=node('div','scene-organic-art');picture.append(node('div','scene-sun'),leaf('#C8D4AF'),node('div','scene-organic-caption',s('daylight')));
  const info=node('div','scene-organic-info');info.append(node('span','scene-overline','FIELD NOTE / 01'),title(),text('breathe'));
  const progress=node('div','scene-growth'),meter=node('i');progress.append(meter);meter.style.width='38%';const action=button('care',()=>{meter.style.width='72%';action.textContent=s('cared');action.disabled=true;status.textContent=s('done');});
  info.append(progress,action,status);b.append(picture,info);return;
 }
 if(id==='glassmorphism'||id==='liquid-glass'){
  const backdrop=node('div','scene-glass-backdrop');for(let i=0;i<3;i++)backdrop.append(node('i','scene-color-orb orb-'+i));
  const surface=node('div','scene-glass-surface');surface.append(node('span','scene-overline',id==='liquid-glass'?'LIQUID / WEB':'FROST / CSS'),title('surface'),text('small'));
  const action=button(id==='liquid-glass'?'switch':'frost',()=>{surface.classList.toggle('unfrosted');action.setAttribute('aria-pressed',String(surface.classList.contains('unfrosted')));});action.setAttribute('aria-pressed','false');surface.append(action);
  backdrop.append(surface);b.append(backdrop);
  if(id==='liquid-glass'){
   const lens=node('div','scene-glass-lens');lens.setAttribute('aria-hidden','true');backdrop.append(lens);b.append(text('webGlass','scene-footnote'));
   on(backdrop,'pointermove',e=>{if(e.pointerType!=='mouse'||!motionAllowed())return;const r=backdrop.getBoundingClientRect();lens.style.left=Math.max(8,Math.min(r.width-110,e.clientX-r.left-50))+'px';lens.style.top=Math.max(8,Math.min(r.height-110,e.clientY-r.top-50))+'px';});
   on(backdrop,'pointerleave',()=>{lens.style.left='55%';lens.style.top='42%';});
  }return;
 }
 if(['neumorphism','claymorphism','soft-ui-evolution'].includes(id)){
  const object=node('div','scene-soft-object');object.append(leaf());const copy=node('div','scene-soft-copy');copy.append(node('span','scene-overline','TACTILE / STUDY'),title('surface'),text());
  const action=button('switch',()=>{const selected=action.getAttribute('aria-pressed')!=='true';action.setAttribute('aria-pressed',String(selected));object.classList.toggle('pressed',selected);status.textContent=s(selected?'chosen':'ready');});action.setAttribute('aria-pressed','false');copy.append(action,status);b.append(object,copy);return;
 }
 if(id==='dark-mode-oled'){
  const panel=node('div','scene-theme-panel');panel.dataset.theme=p.theme;
  const heading=title('notes'),row=node('div','scene-stats');row.append(c.badge('08','notes'),c.badge('76%','target'));
  const action=button('switch',()=>{panel.dataset.theme=panel.dataset.theme==='dark'?'light':'dark';status.textContent=s(panel.dataset.theme);});panel.append(node('span','scene-overline',s(p.theme)),heading,row,text(),action,status);b.append(panel);return;
 }
 if(id==='minimalism-swiss'||id==='swiss-modernism-2'){
  const mast=node('div','scene-swiss-mast');mast.append(node('strong','','Aa'),node('span','scene-swiss-dot'));const body=node('div','scene-swiss-copy');body.append(node('span','scene-overline','01 — FORM / FUNCTION'),title('layout'),text('breathe'));
  if(id==='swiss-modernism-2'){const reading=node('p','scene-swiss-reading',s('colors'));body.append(tabs(['colors','type'],i=>reading.textContent=s(i?'type':'colors')),reading);b.append(mast,body,node('div','scene-swiss-modules'));}
  else{body.append(button('read',()=>{status.textContent=s('done');}),status);b.append(mast,body,node('p','scene-swiss-footer','GRID / ALIGNMENT / SPACE'));}return;
 }
 if(id==='neubrutalism'){
  const hero=node('div','scene-brutal-card');hero.append(node('span','scene-sticker','HELLO!'),title('field'),text('small'));const action=button('try',()=>{action.setAttribute('aria-pressed',action.getAttribute('aria-pressed')==='true'?'false':'true');status.textContent=s('done');});action.setAttribute('aria-pressed','false');hero.append(action,status);b.append(hero);return;
 }
 if(id==='brutalism'){
  b.append(node('span','scene-overline','DOCUMENT / 001'),title('notes'));const article=node('p','scene-document',s('first'));const nav=node('nav','scene-document-nav');nav.setAttribute('aria-label',s('chapter'));for(const key of ['first','second','third'])nav.append(button(key,()=>article.textContent=s(key)));b.append(nav,article,node('hr'),text('local'));return;
 }
 if(id==='flat-design'){
  const tiles=node('div','scene-flat-blocks');for(const key of ['colors','type']){const t=node('div');t.append(node('strong','',s(key)),node('span','','↗'));tiles.append(t);}b.append(tiles,title('small'));const action=button('switch',()=>{action.classList.toggle('chosen');status.textContent=s('chosen');});b.append(action,status);return;
 }
 if(id==='exaggerated-minimalism'){b.append(node('span','scene-overline','LESS / BUT CLEAR'),title('breathe'),text('small'),button('try',()=>status.textContent=s('done')),status);return;}
 if(id==='memphis-design'){
  const art=node('div','scene-memphis-art');for(const cls of ['disc','triangle','squiggle','dots','arc'])art.append(node('i',cls));b.append(art,title('colors'),button('switch',()=>art.classList.toggle('alternative')));return;
 }
 if(id==='y2k-aesthetic'){
  b.append(node('span','scene-y2k-star','✦'),node('span','scene-overline','NEXT / 2000'),title('field'));const capsule=button('switch',()=>{capsule.setAttribute('aria-pressed',capsule.getAttribute('aria-pressed')==='true'?'false':'true');status.textContent=s('chosen');},'scene-chrome-pill');capsule.setAttribute('aria-pressed','false');b.append(capsule,status);return;
 }
 if(id==='vaporwave'||id==='aurora-ui'){
  const art=node('div','scene-atmosphere');for(let i=0;i<3;i++)art.append(node('i',id==='aurora-ui'?'aurora-blob blob-'+i:'vapor-part vapor-'+i));art.append(node('div',id==='aurora-ui'?'aurora-glass':'vapor-grid'));const copy=node('div','scene-atmosphere-copy');copy.append(title('field'),text('breathe'));art.append(copy);b.append(art);
  const play=()=>{art.querySelectorAll('i').forEach((orb,i)=>animate(orb,[{transform:'translate(0,0) scale(1)'},{transform:`translate(${(i-1)*20}px,${i%2?-14:12}px) scale(1.08)`}],{duration:p.duration_ms}));};after(play);b.append(button('play',play));return;
 }
 if(id==='retro-futurism'){
  const dial=node('div','scene-retro-dial');dial.append(node('i'),node('i'),node('i'));const frequency=node('strong','scene-frequency','88.6');dial.append(frequency);let band=0;b.append(dial,node('span','scene-overline','ANALOG / FUTURE'),title('field'),button('tune',()=>{band=(band+1)%3;frequency.textContent=['88.6','101.2','106.8'][band];dial.style.setProperty('--dial-angle',band*80+'deg');}));return;
 }
 if(id==='cyberpunk-ui'){
  const hud=node('div','scene-hud');hud.append(node('span','scene-overline','SYSTEM / LOCAL'),title('ready'));const trace=node('div','scene-scanline');hud.append(trace);const action=button('scan',()=>{action.disabled=true;status.textContent=s('scanning');animate(trace,[{transform:'translateX(-100%)'},{transform:'translateX(100%)'}]);c.later(()=>{action.disabled=false;status.textContent=s('scanDone');},motionAllowed()?p.duration_ms:0);});hud.append(action,status);b.append(hud);return;
 }
 if(id==='vibrant-block'){
  const grid=node('div','scene-vibrant-grid');for(const [i,key]of ['first','second','third'].entries()){const tile=button(key,()=>{grid.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===tile)));});tile.append(node('span','',String(i+1).padStart(2,'0')));tile.setAttribute('aria-pressed',String(i===0));grid.append(tile);}b.append(title('colors'),grid);return;
 }
 if(id==='skeuomorphism'){
  const notebook=node('div','scene-notebook');notebook.append(node('div','scene-binding'));const page=node('div','scene-notebook-page');page.append(title('notes'),text('first'));notebook.append(page);b.append(notebook,tabs(['first','second','third'],i=>page.querySelector('p').textContent=s(['first','second','third'][i])));return;
 }
 if(id==='hyperrealism-3d'){
  const space=node('div','scene-3d-space'),cube=node('div','scene-cube');for(const face of ['front','back','left','right','top','bottom']){const surface=node('div','cube-face face-'+face);surface.append(node('span','','i↗'));cube.append(surface);}cube.style.transform=`rotateX(${-p.tilt_deg}deg) rotateY(${p.tilt_deg+22}deg)`;space.append(cube,node('div','scene-object-shadow'));b.append(space,title('surface'),text('material','scene-footnote'));return;
 }
 throw new Error('Unimplemented style: '+id);
}

function layout(c){
 const {canvas:b,p,id,s,title,text,button,status}=c;
 if(id==='bento-box-grid'){
  const grid=node('div','scene-bento');const featured=node('article','bento-featured');featured.append(node('span','scene-overline','01 / FIELD'),c.leaf('#C8D4AF'),title('grow'));grid.append(featured);for(const [i,key]of ['notes','colors','type'].entries()){const tile=node('article','bento-small');tile.append(node('span','scene-overline','0'+(i+2)),node('h4','',s(key)));if(i===2)tile.append(button('try',()=>status.textContent=s('done')));grid.append(tile);}b.append(grid,status);return;
 }
 if(id==='grid-layout'){
  b.append(title('layout'));const grid=node('div','scene-grid-cells');grid.style.gridTemplateColumns=`repeat(${p.columns},minmax(0,1fr))`;for(let i=0;i<6;i++){const cell=node('div');cell.append(node('strong','',String(i+1).padStart(2,'0')),node('span','',s(['colors','type','notes'][i%3])));grid.append(cell);}b.append(grid);return;
 }
 if(id==='dimensional-layering'){
  const layers=node('div','scene-layers'),rear=node('div','scene-layer-back'),front=node('div','scene-layer-front');rear.append(title('notes'),text('first'));front.append(node('span','scene-overline','FOREGROUND'),title('detail'),text('second'));const open=button('detail',()=>{front.hidden=false;close.focus({preventScroll:true});});const close=button('close',()=>{front.hidden=true;open.focus({preventScroll:true});});front.append(close);front.hidden=true;front.setAttribute('role','region');front.setAttribute('aria-label',s('detail'));rear.append(open);layers.append(rear,front);c.on(layers,'keydown',e=>{if(e.key==='Escape'&&!front.hidden){e.preventDefault();close.click();}});b.append(layers);return;
 }
 if(id==='visual-hierarchy'){
  b.append(node('span','scene-overline','FIELD NOTES / 06'),title('first'),text('small'),node('div','scene-hierarchy-meta','IntentKit · UI / UX · 2026'));b.append(button('switch',()=>{const h=b.querySelector('h3');h.textContent=h.textContent===s('first')?s('third'):s('first');}));return;
 }
 if(id==='whitespace'){
  const compare=node('div','scene-space-compare');for(const spacious of [false,true]){const panel=node('article',spacious?'spacious':'compact');panel.append(node('span','scene-overline',s(spacious?'spacious':'compact')),node('h4','',s('grow')),text('breathe'),node('div','scene-space-rule'),text('notes'));compare.append(panel);}b.append(compare);return;
 }
 throw new Error('Unimplemented layout: '+id);
}

function landing(c){
 const {canvas:b,p,id,s,title,text,button,status,tabs,on,animate}=c;
 if(id==='hero-centric'){
  const copy=node('div','scene-landing-copy');copy.append(node('span','scene-overline','IDEA → DESIGN'),title('grow'),text('small'),button('start',()=>status.textContent=s('done')),status);const picture=node('div','scene-hero-picture');picture.append(node('div','scene-hero-window'),c.leaf(),node('span','',s('daylight')));b.append(copy,picture);return;
 }
 if(id==='minimal-direct'||id==='conversion-optimized'){
  b.append(title('small'),text('cost'));const form=node('form','scene-form'),field=node('input'),label=node('label','',s('idea'));field.type='text';field.required=true;field.placeholder=s('input');field.setAttribute('aria-label',s('idea'));label.append(field);form.append(label);let step=0;const confirmation=node('div','scene-confirmation');confirmation.hidden=true;confirmation.append(text('confirm'));const output=node('output');confirmation.append(output);form.append(confirmation);
  const action=button(id==='minimal-direct'?'start':'next');action.type='submit';const back=button('back',()=>{step=0;label.hidden=false;confirmation.hidden=true;action.textContent=s('next');back.hidden=true;});back.hidden=true;form.append(back,action,status);
  on(form,'submit',e=>{e.preventDefault();if(!field.value.trim()){status.textContent=s('valid');field.setAttribute('aria-invalid','true');field.focus();return;}field.removeAttribute('aria-invalid');if(id==='conversion-optimized'&&step===0){step=1;label.hidden=true;confirmation.hidden=false;output.textContent=field.value;action.textContent=s('confirm');back.hidden=false;}else{status.textContent=s('done');}});b.append(form);return;
 }
 if(id==='social-proof'){
  b.append(title('grow'));const quote=node('blockquote','scene-testimonial'),role=node('span','scene-testimonial-role');const render=i=>{quote.replaceChildren(node('span','scene-quote-mark','“'),node('p','',s(['quote1','quote2','quote3'][i])),role);role.textContent=s(['designer','developer','beginner'][i]);};render(0);b.append(tabs(['designer','developer','beginner'],render),quote,text('fictional','scene-footnote'));return;
 }
 if(id==='interactive-demo'){
  const copy=node('div','scene-landing-copy');copy.append(node('span','scene-overline','TRY / THEN UNDERSTAND'),title('small'),text('try'));const demo=node('button','scene-inline-demo');demo.type='button';demo.append(c.leaf(),node('strong','',s('grow')));demo.style.setProperty('--demo-lift',p.lift_px+'px');demo.style.setProperty('--demo-duration',p.duration_ms+'ms');on(demo,'click',()=>status.textContent=s('done'));b.append(copy,demo,status);return;
 }
 if(id==='feature-showcase'){
  b.append(title('small'));const board=node('div','scene-feature-board');const render=i=>{board.replaceChildren(node('span','scene-feature-number','0'+(i+1)),node('h4','',s(['first','second','third'][i])),text(['colors','type','notes'][i]));for(let n=0;n<i+1;n++)board.append(node('div','scene-feature-line'));};render(0);b.append(tabs(['first','second','third'],render),board);return;
 }
 if(id==='trust-authority'){
  b.append(node('span','scene-overline','SOURCE / SCOPE / STATUS'),title('notes'),text('evidence'));const details=node('details','scene-evidence');details.append(node('summary','',s('sources')),node('p','',s('sample')),node('p','',s('local')));const link=node('a','','W3C · Accessibility principles ↗');link.href='https://www.w3.org/WAI/fundamentals/accessibility-principles/';link.target='_blank';link.rel='noopener noreferrer';details.append(link);b.append(details,node('p','scene-evidence-date','2026-10-09 · IntentKit / original demo'));return;
 }
 if(id==='storytelling-driven'){
  let page=0;const story=node('div','scene-story'),dots=node('div','scene-story-dots');const previous=button('back',()=>{page--;render(-1);}),next=button('next',()=>{page++;render(1);});const render=direction=>{story.replaceChildren(node('span','scene-overline',`${s('chapter')} / 0${page+1}`),title(['first','second','third'][page]),text(['small','breathe','grow'][page]));dots.replaceChildren(...[0,1,2].map(i=>{const dot=node('i');dot.classList.toggle('active',page===i);return dot;}));previous.disabled=page===0;next.disabled=page===2;animate(story,[{opacity:.4,transform:`translateX(${direction*12}px)`},{opacity:1,transform:'translateX(0)'}]);};const controls=node('div','scene-controls');controls.append(previous,dots,next);render(0);b.append(story,controls);return;
 }
 throw new Error('Unimplemented landing: '+id);
}

function dashboard(c){
 const {canvas:b,p,id,s,title,text,button,status,on,tabs}=c;
 const metrics=node('div','scene-dashboard-metrics'),content=node('div','scene-dashboard-content');b.append(node('div','scene-dashboard-top',s('sample')));
 if(id==='executive-dashboard'){
  metrics.append(c.badge('42.8k','revenue'),c.badge('76%','target'),c.badge('02','attention'));const progress=node('div','scene-growth');progress.append(node('i'));progress.firstChild.style.width='76%';const detail=node('p','scene-text',s('region')+' A / 24.6k · B / 18.2k');detail.hidden=true;b.append(metrics,progress,chart([38,48,41,60,56,73,76]),button('detail',()=>detail.hidden=!detail.hidden),detail);return;
 }
 if(id==='data-dense-dashboard'){
  const filter=node('input');filter.type='search';filter.setAttribute('aria-label',s('filter'));filter.placeholder=s('filter');const scroll=node('div','scene-table-scroll'),table=node('table'),head=node('thead'),header=node('tr');for(const key of ['name','amount','change'])header.append(node('th','',s(key)));head.append(header);const body=node('tbody');table.append(head,body);const rows=[['Studio A',428,'+12%'],['Studio B',362,'+8%'],['Studio C',290,'−3%'],['Studio D',186,'+5%'],['Studio E',144,'+7%']];const render=()=>{body.replaceChildren();for(const row of rows.filter(r=>r[0].toLowerCase().includes(filter.value.toLowerCase()))){const tr=node('tr');for(const value of row)tr.append(node('td','',value));body.append(tr);}status.textContent=body.childElementCount+' / 5';};on(filter,'input',render);render();scroll.append(table);b.append(filter,scroll,status);return;
 }
 if(id==='real-time-monitoring'){
  let values=[40,48,43,58,51,65,61,74],ticks=0,clock=null;metrics.append(c.badge('74','current'),c.badge('150','visits'));const area=node('div');const render=()=>{area.replaceChildren(chart(values));metrics.querySelector('strong').textContent=String(values.at(-1));status.textContent=s('sample')+' / '+String(ticks).padStart(2,'0');};
  const tick=()=>{ticks++;values=values.slice(1).concat(45+((ticks*13+29)%42));render();};const stop=()=>{if(clock){clearInterval(clock);c.intervals.delete(clock);clock=null;}action.textContent=s('play');action.setAttribute('aria-pressed','false');};const action=button('play',()=>{if(clock){stop();return;}if(!motionAllowed()){tick();return;}clock=setInterval(tick,p.interval_ms);c.intervals.add(clock);action.textContent=s('stop');action.setAttribute('aria-pressed','true');});action.setAttribute('aria-pressed','false');c.cleaners.push(stop);render();const controls=node('div','scene-controls');controls.append(button('step',tick),action);b.append(metrics,area,controls,status);return;
 }
 if(id==='comparative-dashboard'){
  const period=node('p','scene-text',s('period')+' / '+s(p.period));const bars=node('div','scene-comparison');const render=group=>{bars.replaceChildren();for(let i=0;i<3;i++){const row=node('div','scene-compare-row'),label=node('strong','',s('group')+' '+String.fromCharCode(65+i));row.append(label);const a=(p.period==='week'?48:58)+i*7+group*4,old=a-12;for(const [value,key]of [[a,'current'],[old,'previous']]){const bar=node('div','compare-bar '+key);bar.style.width=value+'%';bar.textContent=s(key)+' '+value;row.append(bar);}bars.append(row);}};render(0);b.append(period,tabs(['region','group'],render),bars,node('p','scene-text',s('change')+' / +12'));return;
 }
 if(id==='predictive-analytics'){
  const horizon=Math.round(p.horizon_days),historical=[35,41,38,53,49,62],forecast=Array.from({length:horizon},(_,i)=>Math.min(92,65+i*2));b.append(c.badge(horizon,'future'),chart(historical.concat(forecast),{forecast:horizon,label:s('forecast')}),node('div','scene-chart-legend',s('history')+' — · '+s('future')+' - -'),text('forecast','scene-footnote'));return;
 }
 if(id==='drill-down-analytics'){
  let depth=0,region=0;const path=node('div','scene-breadcrumb'),list=node('div','scene-drill-list');const render=()=>{path.textContent=[s('all'),s('region')+' '+String.fromCharCode(65+region),s('group')+' / 01'].slice(0,depth+1).join(' / ');list.replaceChildren();if(depth<2){for(let i=0;i<3;i++){const row=button('detail',()=>{region=i;depth++;render();},'scene-drill-row');row.replaceChildren(node('strong','',s(depth?'group':'region')+' '+String.fromCharCode(65+i)),node('span','',String((depth?62:128)-i*17)+' ↗'));list.append(row);}}else list.append(c.badge('62','complete'),text('sample'));back.disabled=depth===0;};const back=button('back',()=>{depth=Math.max(0,depth-1);render();});render();b.append(path,list,back);return;
 }
 if(id==='user-behavior-analytics'){
  const view=node('div','scene-behavior');const render=index=>{view.replaceChildren();for(const [i,key]of ['visits','explore','complete'].entries()){const row=node('div',index?'scene-path-node':'scene-funnel-row');row.style.width=index?'100%':[100,68,42][i]+'%';row.append(node('strong','',s(key)),node('span','',[1000,680,420][i]));view.append(row);if(index&&i<2)view.append(node('i','scene-path-arrow','↓'));}};render(0);b.append(tabs(['funnel','path'],render),view,text('sample'));return;
 }
 if(id==='financial-dashboard'){
  const fmt=value=>new Intl.NumberFormat(locale,{style:'currency',currency:p.currency,maximumFractionDigits:0}).format(value);metrics.append(c.badge(fmt(42800),'revenue'),c.badge(fmt(18600),'costMetric'),c.badge(fmt(24200),'balance'));const flow=node('div','scene-cashflow');for(const [i,key]of ['revenue','costMetric','balance'].entries()){const column=node('div','cash-column');const bar=node('i');bar.style.height=[130,56,74][i]+'px';column.append(bar,node('span','',s(key)));flow.append(column);}b.append(metrics,flow,node('p','scene-text',p.currency+' · '+s('sample')));return;
 }
 if(id==='sales-intelligence'){
  let stage=0;const pipeline=node('div','scene-pipeline');const render=()=>{pipeline.replaceChildren();for(const [i,key]of ['leads','proposal','won'].entries()){const col=node('div','scene-sales-column');col.append(node('strong','',s(key)),node('span','scene-label',String(i===stage?1:0)));if(i===stage)col.append(node('div','scene-sales-card','Studio / 01'));pipeline.append(col);}action.disabled=stage===2;};const action=button('move',()=>{stage=Math.min(2,stage+1);render();});render();b.append(pipeline,action);return;
 }
 if(id==='heatmap-style'){
  const grid=node('div','scene-heatmap');for(let i=0;i<35;i++){const value=(i*17+13)%100,cell=node('button');cell.type='button';cell.textContent=String(value);const background=blend(p.accent,.12+value/100*.88*p.intensity);cell.style.background=background;cell.style.color=readable(background);cell.setAttribute('aria-label',s('sample')+' '+(i+1)+' / '+value);const inspect=()=>status.textContent=s('chosen')+' #'+(i+1)+' / '+value;c.on(cell,'focus',inspect);c.on(cell,'click',inspect);grid.append(cell);}const legend=node('div','scene-heatmap-legend');legend.style.background=`linear-gradient(to right,#F4ECD9,${p.accent})`;b.append(title('period'),grid,legend,status);return;
 }
 throw new Error('Unimplemented dashboard: '+id);
}

function principle(c){
 const {canvas:b,p,id,s,title,text,button,status,on,tabs,animate}=c;
 if(id==='affordance'){
  const compare=node('div','scene-affordance-compare');const vague=node('div');vague.append(node('span','scene-label',s('idea')),node('span','scene-ambiguous',s('add')));const clear=node('div');let added=false;const action=button('add',()=>{added=!added;action.textContent=s(added?'undo':'add');status.textContent=s(added?'chosen':'ready');});clear.append(node('span','scene-label',s('clear')),action);compare.append(vague,clear);b.append(title('small'),compare,status);return;
 }
 if(id==='contrast'){
  const color=p.text_color,ratio=(Math.max(luminance(color),luminance('#FFFAF0'))+.05)/(Math.min(luminance(color),luminance('#FFFAF0'))+.05);const weak=node('div','scene-low-contrast');weak.append(node('span','scene-label',s('weak')),text('breathe'));const measured=node('div','scene-measured-contrast');measured.style.color=color;measured.append(node('span','scene-label',s('measure')),title('breathe'));b.append(weak,measured,node('output','scene-contrast-ratio',ratio.toFixed(2)+':1'),node('p','scene-text',color+' / '+s('measure')));return;
 }
 if(id==='recognition-over-recall'){
  b.append(title('explore'));const input=node('input');input.type='text';input.setAttribute('aria-label',s('filter'));input.placeholder=s('filter');const suggestions=node('div','scene-suggestions');for(const key of ['colors','type','notes','surface','motion','path'].slice(0,Number(p.suggestions)))suggestions.append(button(key,()=>{input.value=s(key);status.textContent=s('chosen')+' / '+s(key);}));b.append(input,suggestions,status);return;
 }
 if(id==='information-architecture'){
  const tree=node('div','scene-ia-tree'),breadcrumb=node('p','scene-breadcrumb'),article=node('div','scene-ia-article');let path=[];const render=()=>{breadcrumb.textContent=[s('all'),...path.map(k=>s(k))].join(' / ');tree.replaceChildren();const keys=path.length?['surface','motion','path']:['colors','type','notes'];for(const key of keys)tree.append(button(key,()=>{path=path.length?[path[0],key]:[key];article.replaceChildren(title(key),text('small'));render();}));back.disabled=!path.length;};const back=button('back',()=>{path=path.slice(0,-1);render();if(!path.length)article.replaceChildren(title('grow'));});article.append(title('grow'));render();b.append(breadcrumb,tree,article,back);return;
 }
 if(id==='reduced-motion'){
  let reduce=true;const row=node('div','scene-reduce-track'),token=node('span','scene-reduce-token','↗');row.append(token);const play=()=>{token.textContent='✓';if(!reduce&&motionAllowed())animate(token,[{transform:'translateX(0)'},{transform:'translateX(160px)'}]);status.textContent=s(reduce?'static':'motion');};const toggle=button('switch',()=>{reduce=!reduce;toggle.setAttribute('aria-pressed',String(reduce));token.getAnimations().forEach(a=>a.cancel());token.textContent='↗';status.textContent=s(reduce?'static':'motion');});toggle.setAttribute('aria-pressed','true');b.append(title('systemFirst'),row,toggle,button('play',play),status,text('systemFirst','scene-footnote'));return;
 }
 if(id==='accessible-ethical'){
  b.append(title('readable'));const preferences=node('fieldset'),legend=node('legend','',s('readable'));preferences.append(legend);for(const [i,key]of ['required','optional'].entries()){const label=node('label','scene-check'),check=node('input');check.type='checkbox';check.checked=i===0;check.disabled=i===0;label.append(check,node('span','',s(key)));preferences.append(label);}b.append(preferences,button('save',()=>status.textContent=s('done')),status,text('local'));return;
 }
 if(id==='inclusive-design'){
  b.append(title('readable'));const choice=node('div','scene-inclusive-choice');let selected=0;const render=i=>{selected=i;choice.replaceChildren(node('span','scene-inclusive-symbol',i?'Aa':'⌨'),node('strong','',s(i?'readable':'textAlternative')));status.textContent=s('chosen')+' / '+s(i?'readable':'textAlternative');};render(0);b.append(tabs(['textAlternative','readable'],render),choice);const field=node('input');field.type='text';field.setAttribute('aria-label',s('textAlternative'));field.placeholder=s('input');b.append(field,button('confirm',()=>status.textContent=s('done')+' / '+(field.value||s(selected?'readable':'textAlternative'))),status);return;
 }
 if(id==='ai-native-ui'){
  b.append(title('idea'),text('simulated'));const input=node('textarea');input.setAttribute('aria-label',s('idea'));input.value=s('small');const suggestion=node('textarea');suggestion.setAttribute('aria-label',s('review'));suggestion.hidden=true;const confirm=button('confirm',()=>status.textContent=s('done')+' / '+s('local'));confirm.hidden=true;const generate=button('generate',()=>{generate.disabled=true;status.textContent=s('scanning');c.later(()=>{suggestion.hidden=false;suggestion.value=s('grow')+' — '+input.value;confirm.hidden=false;generate.disabled=false;status.textContent=s('review');},motionAllowed()?p.duration_ms:0);});b.append(input,generate,suggestion,confirm,status);return;
 }
 if(id==='zero-interface'){
  b.append(title('idea'),text('noMic'));const orb=node('div','scene-voice-orb');orb.append(node('i'),node('i'),node('i'));const hold=button('hold'),release=()=>{orb.classList.remove('listening');status.textContent=s('simulated');};const listen=()=>{orb.classList.add('listening');status.textContent=s('listening');if(motionAllowed())orb.querySelectorAll('i').forEach((wave,i)=>animate(wave,[{transform:'scaleY(.6)'},{transform:'scaleY(1)'},{transform:'scaleY(.6)'}],{duration:p.duration_ms,delay:i*30}));};on(hold,'pointerdown',listen);for(const event of ['pointerup','pointercancel','pointerleave','blur'])on(hold,event,release);on(hold,'keydown',e=>{if(['Enter',' '].includes(e.key))listen();});on(hold,'keyup',release);const field=node('input');field.setAttribute('aria-label',s('textAlternative'));field.placeholder=s('textAlternative');b.append(orb,hold,field,button('confirm',()=>status.textContent=s('done')+' / '+field.value),status);return;
 }
 throw new Error('Unimplemented principle: '+id);
}

function motion(c){
 const {canvas:b,p,id,s,title,text,button,status,on,animate,after}=c;
 if(id==='easing'){
  const tracks=[];for(const label of ['linear','selectedCurve']){const row=node('div','scene-runner-row'),track=node('div','scene-runner-track'),dot=node('i');track.append(dot);row.append(node('span','',s(label)),track);tracks.push({track,dot});b.append(row);}const play=()=>{for(const {dot}of tracks)dot.getAnimations().forEach(a=>a.cancel());tracks.forEach(({track,dot},i)=>animate(dot,[{transform:'translateX(0)'},{transform:`translateX(${Math.max(0,track.clientWidth-30)}px)`}],{duration:p.duration_ms,easing:i?p.easing:'linear'}));};after(play);b.append(button('play',play),node('p','scene-text',p.easing+' / '+p.duration_ms+'ms'));return;
 }
 if(id==='micro-interactions'){
  b.append(title('notes'));let saved=false;const action=button('favorite',()=>{saved=!saved;action.setAttribute('aria-pressed',String(saved));action.textContent=(saved?'♥ ':'♡ ')+s(saved?'saved':'favorite');status.textContent=s(saved?'saved':'unsaved');animate(action,[{transform:'scale(.94)'},{transform:'scale(1)'}]);},'scene-favorite');action.setAttribute('aria-pressed','false');action.textContent='♡ '+s('favorite');b.append(action,status);return;
 }
 if(id==='motion-driven'){
  let step=0;const story=node('div','scene-motion-step'),progress=node('div','scene-growth');progress.append(node('i'));const render=()=>{story.replaceChildren(node('span','scene-step-number','0'+(step+1)),title(['first','second','third'][step]),text('small'));progress.firstChild.style.width=(step+1)/3*100+'%';};render();const next=button('next',()=>{step=(step+1)%3;render();animate(story,[{opacity:0,transform:`translateX(${p.distance_px}px)`},{opacity:1,transform:'translateX(0)'}]);});b.append(story,progress,next);return;
 }
 if(id==='kinetic-typography'){
  const words=node('h3','scene-kinetic');words.setAttribute('aria-label',s('gentle'));for(const character of [...s('gentle')]){const letter=node('span','',character===' '?'\u00a0':character);letter.setAttribute('aria-hidden','true');words.append(letter);}const play=()=>{words.querySelectorAll('span').forEach((letter,i)=>{letter.getAnimations().forEach(a=>a.cancel());animate(letter,[{opacity:0,transform:'translateY(22px) rotate(-5deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}],{duration:p.duration_ms,delay:i*p.delay_ms});});};b.append(node('span','scene-overline','WORDS / IN MOTION'),words,text('small'),button('play',play));after(play);return;
 }
 if(id==='parallax-storytelling'){
  b.append(text('scroll'));const scroller=node('div','scene-parallax-scroller');scroller.tabIndex=0;scroller.setAttribute('role','region');scroller.setAttribute('aria-label',s('scroll'));const landscape=node('div','scene-parallax-landscape'),layers=[];
  for(let i=0;i<3;i++){const svg=svgNode('svg',{viewBox:'0 0 480 240','aria-hidden':'true'});svg.append(svgNode('path',{d:i===0?'M0 170L85 66L160 145L250 40L330 133L400 85L480 160V240H0Z':i===1?'M0 180L70 126L130 180L220 90L290 177L380 117L480 187V240H0Z':'M0 213L80 171L180 206L260 146L350 205L420 165L480 204V240H0Z',fill:['#A7B79B','#738365','#3E4535'][i]}));landscape.append(svg);layers.push(svg);}
  scroller.append(landscape);for(const [i,key]of ['valley','horizon','breathe'].entries()){const chapter=node('section','scene-parallax-chapter');chapter.append(node('span','scene-overline','0'+(i+1)),title(key),text('small'));scroller.append(chapter);}on(scroller,'scroll',()=>{const amount=scroller.scrollTop/Math.max(1,scroller.scrollHeight-scroller.clientHeight);layers.forEach((layer,i)=>layer.style.transform=motionAllowed()?`translateY(${amount*p.depth_px*[.25,.55,.9][i]}px)`:'none');},{passive:true});b.append(scroller);return;
 }
 throw new Error('Unimplemented motion: '+id);
}

const builders={style,layout,landing,dashboard,principle,motion};
export function mountDedicatedScene(stage,item,params){
 const family=sceneFamilies[item.preview?.template_id];if(!family||!builders[family])throw new Error('Missing dedicated scene');
 const c=context(stage,item,params);try{builders[family](c);c.finish();return c.cleanup;}catch(error){c.cleanup();throw error;}
}
