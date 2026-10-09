import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileDesign,parseLocalIntent,editDesignIR,updateCompilation,canExportCompilation,validateModelIntent,compilerPrompt} from '../public/compiler-core.js';
import {assertCompilerType} from '../public/compiler-schema.js';
import {requestCompilerIntent} from '../public/client-byok.js';
import {compilerDictionaries} from '../public/compiler-ui-strings.js';
import {translate} from '../dist/server/index.js';
const catalog=JSON.parse(await readFile(new URL('../dist/client/catalog.json',import.meta.url)));
const data=JSON.parse(await readFile(new URL('../dist/client/compiler.json',import.meta.url)));
const key='mock-compiler-key-never-a-real-credential';
const cases=[
 ['卡片鼠标放上去轻轻浮起来，不要太夸张','hover-lift',{lift_px:3,duration_ms:180}],
 ['鼠标经过卡片有一点暖光，还稍微浮起来','cursor-spotlight',{lift_px:3,opacity:.12,color:'#EBCB8B'}],
 ['按钮按下去要有确认感，但是不要弹','press-feedback',{scale_start:.97,duration_ms:120}],
 ['内容出现的时候一个接一个进来，不要一起突然出现','staggered-reveal',{delay_ms:70}],
 ['点一下以后像水波一样扩散','click-ripple',{duration_ms:500}]
];
const compile=text=>compileDesign({text,catalog,data});
test('five required no-key intentions compile to real catalog templates with the same final brief and JSON values',()=>{
 for(const [text,id,params]of cases){const result=compile(text);assert.equal(result.status,'ready');assert.equal(result.recipe.item_id,id);assert.ok(canExportCompilation(result));assertCompilerType(JSON.parse(JSON.stringify(result)),'CompilationResult',data.schemas);
  for(const [name,value]of Object.entries(params)){assert.equal(result.recipe.params[name],value);assert.ok(result.design_brief.includes(String(value)));assert.ok(result.agent_brief.includes(String(value)));}
  assert.equal(result.implementation.provider,'native-web');assert.ok(result.ir.evidence.every(e=>text.includes(e.quote)));
 }
});
test('missing intention remains unspecified; recipe inference is separate from IR and arbitrary vague input asks for clarification',()=>{
 const result=compile(cases[4][0]);assert.equal(result.ir.target,'unspecified');assert.equal(result.ir.motion.speed,'unspecified');assert.ok(result.assumptions.includes('preview-target-default'));
 const ambiguous=compile('想要高级轻盈一点');assert.equal(ambiguous.status,'needs-clarification');assert.equal(ambiguous.recipe,null);assert.equal(ambiguous.agent_brief,'');assert.ok(!canExportCompilation(ambiguous));
});
test('negation preserves the preceding action in Chinese, English, Japanese, Korean and German',()=>{
 for(const text of ['按钮按下去，不要弹','press the button without bounce','ボタンを押した、バネなし','버튼을 누르기, 스프링 없이','Knopf drücken ohne Feder']){const result=compile(text);assert.equal(result.recipe?.item_id,'press-feedback',text);assert.equal(result.ir.motion.bounce,'none',text);assert.ok(result.ir.avoid.includes('bounce'));}
 const ir=parseLocalIntent('卡片悬停，不要强烈发光',data);assert.notEqual(ir.intent.feedback_strength,'strong');assert.ok(ir.avoid.includes('strong-glow'));
 assert.equal(compile('卡片悬停发光，不要发光').recipe,null);
 assert.equal(compile('按钮按下去，不要缩放').recipe,null);
});
test('unsupported numbers, shadow and composition are disclosed, never silently presented as fully implemented',()=>{
 for(const [text,code]of [['卡片悬停，100ms','numeric-request-not-mapped'],['卡片悬停阴影加深','shadow-not-configurable'],['卡片鼠标经过浮起来，点击出现水波','composition-not-supported'],['按钮按下缩放并点击水波','composition-not-supported']]){const result=compile(text);assert.ok(result.unresolved.includes(code));assert.notEqual(result.status,'ready');}
 assert.equal(compile('按钮按下去发光').recipe,null);
});
test('parameter edits sync final output; intent conflicts block compilation export until specifically acknowledged and reset on the next edit',()=>{
 const result=compile(cases[0][0]),changed=updateCompilation(result,{...result.recipe.params,lift_px:12},catalog,data);
 assert.equal(changed.recipe.params.lift_px,12);assert.equal(changed.recipe.parameter_sources.lift_px,'user-adjustment');assert.ok(changed.design_brief.includes('12'));assert.ok(changed.agent_brief.includes('12'));assert.ok(!canExportCompilation(changed));
 const accepted=updateCompilation(changed,changed.recipe.params,catalog,data,'zh-CN',true);assert.ok(canExportCompilation(accepted));
 assert.ok(!canExportCompilation(updateCompilation(accepted,{...accepted.recipe.params,lift_px:14},catalog,data)));
 for(const params of [{lift_px:999},{unknown:1},{lift_px:NaN},{lift_px:'3'}])assert.throws(()=>updateCompilation(result,params,catalog,data));
});
test('accepted constraint changes do not export contradictory hard instructions',()=>{
 let result=compile('卡片悬停轻轻浮起来，不要大幅移动');result=updateCompilation(result,{...result.recipe.params,lift_px:14},catalog,data,'zh-CN',true);
 assert.ok(canExportCompilation(result));assert.ok(!result.agent_brief.includes('保留的约束:'));assert.ok(result.agent_brief.includes('已确认'));
});
test('human refinement is checked, clears obsolete evidence and recompiles within registered capabilities',()=>{
 const result=compile(cases[1][0]),ir=editDesignIR(result.ir,'visual.glow','none',data);assert.equal(ir.source,'user-edited');assert.ok(ir.avoid.includes('glow'));assert.ok(!ir.evidence.some(e=>e.field==='visual.glow'));
 const changed=compileDesign({text:result.source_text,ir,catalog,data});assert.equal(changed.recipe.item_id,'hover-lift');
 assert.throws(()=>editDesignIR(ir,'duration_ms',400,data));assert.throws(()=>editDesignIR(ir,'target','modal',data));
});
test('IR/model schema rejects executable fields, exact implementation parameters, invented candidates and evidence outside the user input',()=>{
 const text=cases[0][0],ir={...parseLocalIntent(text,data),source:'model'},value={ir,candidate_ids:['hover-lift'],explanation:''};assert.deepEqual(validateModelIntent(value,catalog,data,text),value);
 for(const invalid of [{...value,js:'alert(1)'},{...value,ir:{...ir,duration_ms:100}},{...value,ir:{...ir,library:'GSAP'}},{...value,candidate_ids:['invented']},{...value,ir:{...ir,evidence:[{field:'target',quote:'not in source'}]}},JSON.parse('{"__proto__":{}}')])assert.throws(()=>validateModelIntent(invalid,catalog,data,text));
});
test('compiler direct/relay use identical prompts; relay discriminates the new task while preserving legacy search',async()=>{
 const intent=cases[1][0],model='mock-chat',locale='zh-CN',payload={ir:{...parseLocalIntent(intent,data),source:'model'},candidate_ids:['cursor-spotlight'],explanation:''};let directPrompt,relayPrompt;
 const expected=compilerPrompt(catalog.items,data,{intent,model,locale});
 const direct=await requestCompilerIntent({items:catalog.items,catalog,data,intent,model,locale,key,mode:'direct'},async(url,options)=>{assert.equal(url,'https://tokendance.space/gateway/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer '+key);directPrompt=JSON.parse(options.body);assert.ok(!options.body.includes(key));return Response.json({choices:[{message:{content:JSON.stringify(payload)}}]});});
 const request=new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key},body:JSON.stringify({intent,model,locale,task:'compile'})});
 const response=await translate(request,async(url,options)=>{relayPrompt=JSON.parse(options.body);return Response.json({choices:[{message:{content:JSON.stringify(payload)}}]});});assert.equal(response.status,200);assert.deepEqual(await response.json(),direct);assert.deepEqual(directPrompt,expected);assert.deepEqual(relayPrompt,expected);
 const relay=await requestCompilerIntent({items:catalog.items,catalog,data,intent,model,locale,key,mode:'relay'},async(url,options)=>{assert.equal(JSON.parse(options.body).task,'compile');assert.equal(options.headers['X-TokenDance-Key'],key);assert.equal(options.credentials,'omit');return Response.json(payload);});assert.deepEqual(relay,payload);
});
test('compiler transport rejects reflected credentials and invalid task/input before paid requests',async()=>{
 const intent=cases[0][0],base={items:catalog.items,catalog,data,intent,model:'mock-chat',locale:'zh-CN',key,mode:'direct'};
 await assert.rejects(()=>requestCompilerIntent({...base,mode:'unknown'},()=>{throw new Error('Must not call')}),/input/);
 await assert.rejects(()=>requestCompilerIntent(base,async()=>Response.json({choices:[{message:{content:key}}]})),/format/);
 let called=0;const response=await translate(new Request('https://intentkit.test/api/translate',{method:'POST',headers:{'Content-Type':'application/json','X-TokenDance-Key':key},body:JSON.stringify({intent,model:'mock-chat',locale:'en',task:'unknown'})}),()=>{called++;});assert.equal(response.status,400);assert.equal(called,0);
});
test('compiler UI labels and editable IR enum labels exist in all five languages; recipes retain review status',()=>{
 for(const locale of ['zh-CN','en','ja','ko','de']){for(const value of Object.values(compilerDictionaries[locale]))assert.ok(typeof value==='string'&&value.trim());for(const field of ['target','intent','interaction','motion','visual']){const rule=data.schemas.$defs.DesignIR.properties[field];for(const def of rule.enum?[rule]:Object.values(rule.properties))if(def.enum)for(const value of def.enum)assert.ok(data.strings[locale].values[value]);}for(const recipe of data.recipes)assert.equal(recipe.locales[locale].review_status,'draft');}
});
