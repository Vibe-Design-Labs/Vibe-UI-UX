import {compileDesign,editDesignIR,compatibleRecipes,updateCompilation,canExportCompilation,compilerFields} from './compiler-core.js';
import {requestCompilerIntent} from './client-byok.js';
import {locale,t} from './i18n.js';
import {notify} from './motion.js';
import {languages,compilerDictionaries} from './compiler-ui-strings.js';
export const compilerText=key=>compilerDictionaries[locale][key]||key;
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const fieldValue=(ir,path)=>path.split('.').reduce((v,k)=>v[k],ir);
function fieldRule(schema,path){return path.split('.').reduce((v,k)=>v.properties[k],schema);}
const samples=[
 ['gentle-card-lift',['卡片鼠标放上去轻轻浮起来，不要太夸张','Gently lift the card on hover, keep it subtle','ホバーでカードを少し浮かせて、控えめに','카드에 호버하면 살짝 올라오게','Die Karte beim Hover sanft anheben']],
 ['warm-card-spotlight',['鼠标经过卡片有一点暖光，还稍微浮起来','A subtle warm glow and a little lift on card hover','ホバーでカードに少し暖かい光、少し浮かせる','카드 호버에 따뜻한 빛과 살짝 올라오는 효과','Die Karte beim Hover mit dezentem warmem Licht sanft anheben']],
 ['gentle-button-press',['按钮按下去要有确认感，但是不要弹','Clear confirmation when pressing the button, without bounce','ボタンを押したときに明確な反応、バネなし','버튼을 누르면 확인 느낌, 스프링 없이','Beim Drücken des Knopfs klares Feedback, ohne Feder']],
 ['sequential-content-entry',['内容出现的时候一个接一个进来，不要一起突然出现','Reveal content one by one','コンテンツを一つずつ表示','콘텐츠를 하나씩 나타내기','Inhalte nacheinander einblenden']],
 ['water-ripple',['点一下以后像水波一样扩散','A ripple wave after a click','クリック後に波紋','클릭 후 물결 효과','Eine Welle nach dem Klick']]
];
export function setupCompilerPanel({catalog,data,getCredentials,onApplyRecipe,onBeforeCompile,appURL,mode}){
 const panel=document.querySelector('#compiler-panel'),output=document.querySelector('#compiler-output'),button=document.querySelector('#compile'),input=document.querySelector('#intent'),examples=document.querySelector('#compiler-examples');
 let result=null,controller=null,notice=false,refreshing=false;
 const strings=()=>data.strings[locale];
 const sourceLabel=()=>compilerText(result.ir.source==='model'?'model':result.ir.source==='user-edited'?'edited':'rule');
 function cancel(){controller?.abort();controller=null;button.disabled=false;button.textContent=compilerText('compile');}
 function clear(){cancel();result=null;notice=false;panel.hidden=true;output.hidden=true;panel.replaceChildren();output.replaceChildren();}
 function apply(){if(!result.recipe)return;refreshing=true;try{onApplyRecipe(result.recipe);}finally{refreshing=false;}}
 function render(){
  if(!result)return;const s=strings();panel.hidden=false;panel.replaceChildren();output.hidden=!result.recipe;output.replaceChildren();
  panel.dataset.status=result.status;
  const top=node('div','compiler-top');top.append(node('h2','',compilerText('understanding')),node('span','compiler-badge',compilerText(result.status==='ready'?'ready':result.status==='partial'?'partial':'clarify')));panel.append(top,node('p','compiler-source',sourceLabel()));
  if(notice)panel.append(node('p','compiler-warning',compilerText('fallback')));
  const summary=node('p','compiler-summary');summary.append(node('span','',s.values[result.ir.target]),node('span','',s.values[result.ir.interaction.trigger]),node('span','',s.values[result.ir.intent.feedback_strength]));panel.append(summary);
  const refinement=node('details','compiler-refinement');refinement.append(node('summary','',compilerText('refine')));const grid=node('div','compiler-fields');
  for(const field of compilerFields){const label=node('label'),select=node('select');label.append(node('span','',compilerText(field)));select.dataset.ir=field;
   for(const value of fieldRule(data.schemas.$defs.DesignIR,field).enum){const option=node('option','',s.values[value]||value);option.value=value;select.append(option);}select.value=fieldValue(result.ir,field);
   select.addEventListener('change',()=>{cancel();const ir=editDesignIR(result.ir,field,select.value,data);result=compileDesign({text:result.source_text,ir,catalog,data,locale});apply();render();refinementState(true);panel.querySelector('[data-ir="'+field+'"]').focus({preventScroll:true});});label.append(select);grid.append(label);
  }refinement.append(grid);
  refinement.append(node('p','',compilerText('character')+': '+(result.ir.intent.character.map(v=>s.values[v]).join(' / ')||s.values.unspecified)),node('p','',compilerText('avoids')+': '+(result.ir.avoid.map(v=>s.values[v]).join(' / ')||s.values.unspecified)));
  if(result.ir.evidence.length){refinement.append(node('h3','',compilerText('evidence')));const list=node('ul','compiler-evidence');for(const e of result.ir.evidence)list.append(node('li','',(compilerDictionaries[locale][e.field]?compilerText(e.field):e.field)+' · '+e.quote));refinement.append(list);}panel.append(refinement);
  if(result.recipe){const definition=data.recipes.find(r=>r.id===result.recipe.id);panel.append(node('h3','compiler-recipe-name',definition.locales[locale].name),node('p','',definition.locales[locale].reason));
   const available=compatibleRecipes(result.ir,data);if(available.length>1){const choices=node('details','compiler-choices');choices.append(node('summary','',compilerText('alternatives')));for(const recipe of available){const b=node('button','compiler-choice',recipe.locales[locale].name);b.type='button';b.setAttribute('aria-pressed',String(recipe.id===result.recipe.id));b.addEventListener('click',()=>{cancel();result=compileDesign({text:result.source_text,ir:result.ir,catalog,data,locale,recipeId:recipe.id});apply();render();});choices.append(b);}panel.append(choices);}
   const defaults=node('details','compiler-defaults');defaults.append(node('summary','',compilerText('defaults')));const list=node('ul');for(const code of result.assumptions)list.append(node('li','',s.assumptions[code]));defaults.append(list);panel.append(defaults);
  }else panel.append(node('p','compiler-warning',compilerText('independent')));
  if(result.unresolved.length){const block=node('div','compiler-limitations');block.append(node('h3','',compilerText('limits')));for(const code of result.unresolved)block.append(node('p','',s.unresolved[code]));panel.append(block);}
  if(!result.recipe)return;
  output.append(node('h2','',compilerText('output')),node('p','compiler-implementation',compilerText('implementation')+' · '+result.implementation.methods.join(' / ')));
  if(result.conflicts.length){const conflict=node('div','compiler-warning');conflict.setAttribute('role','status');conflict.append(node('h3','',compilerText('conflict')));for(const c of result.conflicts)conflict.append(node('p','',s.conflicts[c.code]));if(result.adjustments_accepted)conflict.append(node('p','',s.accepted));else {const accept=node('button','compiler-accept',compilerText('accept'));accept.id='compiler-accept';accept.addEventListener('click',()=>{result=updateCompilation(result,result.recipe.params,catalog,data,locale,true);render();});conflict.append(accept);}output.append(conflict);}
  const brief=node('textarea','compiler-agent');brief.id='compiler-agent';brief.readOnly=true;brief.value=result.agent_brief;brief.setAttribute('aria-label',compilerText('output'));output.append(brief);
  const actions=node('div','compiler-actions'),copy=node('button','',compilerText('copy')),exportButton=node('button','',compilerText('export'));copy.id='compiler-copy';exportButton.id='compiler-export';copy.disabled=exportButton.disabled=!canExportCompilation(result);
  copy.addEventListener('click',async()=>{if(!canExportCompilation(result))return;try{await navigator.clipboard.writeText(result.agent_brief);notify(t('copied'));}catch{notify(t('copyFail'));}});
  exportButton.addEventListener('click',()=>{if(!canExportCompilation(result))return;const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=node('a');a.href=url;a.download=result.recipe.id+'-compilation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});actions.append(copy,exportButton);output.append(actions);
  const structure=node('details','compiler-structure');structure.append(node('summary','',compilerText('structure')),node('pre','',JSON.stringify(result,null,2)));output.append(structure);
 }
 function refinementState(open){const details=panel.querySelector('.compiler-refinement');if(details)details.open=open;}
 async function run(localOnly=false){
  const text=input.value.trim();if(!text)return notify(t('enterIntent'));cancel();onBeforeCompile?.();notice=false;
  let ir;const credentials=getCredentials();
  if(credentials.key&&!localOnly){controller=new AbortController();const active=controller,timeout=setTimeout(()=>active.abort(),40000);button.disabled=true;button.textContent=t('loading');
   try{const parsed=await requestCompilerIntent({items:catalog.items,catalog,data,intent:text,locale,model:credentials.model,key:credentials.key,mode,appURL,signal:active.signal});if(controller!==active||active.signal.aborted)return;ir=parsed.ir;}
   catch{if(controller!==active)return;notice=true;}
   finally{clearTimeout(timeout);if(controller===active){controller=null;button.disabled=false;button.textContent=compilerText('compile');}}
  }
  try{result=compileDesign({text,ir,catalog,data,locale});apply();render();}catch{notify(t('apiFormat'));}
 }
 function refreshLocale(){cancel();button.textContent=compilerText('compile');document.querySelector('#compiler-helper').textContent=compilerText('helper');examples.replaceChildren(node('span','',compilerText('examples')));
  for(const [id,texts]of samples){const b=node('button','',data.recipes.find(r=>r.id===id).locales[locale].name);b.dataset.example=id;b.title=texts[languages.indexOf(locale)];b.addEventListener('click',()=>{input.value=texts[languages.indexOf(locale)];run(true);});examples.append(b);}
  if(result){result=compileDesign({text:result.source_text,ir:result.ir,catalog,data,locale,recipeId:result.recipe?.id,overrides:result.recipe?.params||{},accepted:result.adjustments_accepted});render();}
 }
 button.addEventListener('click',()=>run());input.addEventListener('input',clear);refreshLocale();
 return {clear,cancel,refreshLocale,getResult:()=>result,syncParams(id,params){if(refreshing||!result?.recipe||result.recipe.item_id!==id)return;if(JSON.stringify(params)===JSON.stringify(result.recipe.params))return;cancel();result=updateCompilation(result,params,catalog,data,locale);render();},reset(){cancel();if(!result?.recipe)return false;result=compileDesign({text:result.source_text,ir:result.ir,catalog,data,locale,recipeId:result.recipe.id});apply();render();return true;}};
}
