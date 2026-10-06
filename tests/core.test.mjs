import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {effectiveParams,makeBrief,localCandidates,validateSuggestions,searchItems} from '../public/core.js';
const root=new URL('../',import.meta.url);
const registry=JSON.parse(await readFile(new URL('previews/registry.json',root),'utf8'));
const names=(await readdir(new URL('content/items/',root))).filter(n=>n.endsWith('.json'));
const items=await Promise.all(names.map(n=>readFile(new URL('content/items/'+n,root),'utf8').then(JSON.parse)));
test('all registered parameter bounds export without unresolved placeholders',()=>{
 for(const item of items){
  const rules=registry.templates[item.preview?.template_id]?.params||{};
  for(const edge of ['min','max']){
   const params=Object.fromEntries(Object.entries(rules).map(([k,r])=>[k,r.type==='number'?r[edge]:r.type==='enum'?r.values[0]:'#123ABC']));
   for(const locale of ['zh-CN','en','ja','ko','de']){
    const brief=makeBrief(item,registry,locale,params);
    assert.ok(brief&&!/\{[a-z_]+\}/.test(brief),item.id);
    for(const v of Object.values(params))assert.ok(brief.includes(String(v)),item.id);
   }
  }
 }
});
test('parameter input rejects out-of-range, boolean, non-finite and unknown values',()=>{
 const item=items.find(i=>i.id==='cursor-spotlight');
 for(const bad of [{radius_px:-1},{radius_px:401},{radius_px:true},{radius_px:NaN},{radius_px:Infinity},{code:'alert(1)'}])assert.throws(()=>effectiveParams(item,registry,bad));
 assert.equal(effectiveParams(item,registry,{radius_px:280}).radius_px,280);
});
test('vague design intent yields choices rather than a fabricated unique effect',()=>{
 const matches=localCandidates(items,'希望高级又轻盈');
 assert.ok(matches.length>1);assert.ok(matches.some(i=>i.id==='visual-hierarchy'||i.id==='whitespace'));
 assert.ok(searchItems(items,'鼠标跟随').some(i=>i.id==='cursor-spotlight'));
 assert.ok(searchItems(items,'feedback','ux').every(i=>i.domain==='ux'));
});
test('model output cannot introduce arbitrary template IDs or code',()=>{
 assert.throws(()=>validateSuggestions({candidates:[{id:'run-shell',reason:'execute'}]},items));
 assert.throws(()=>validateSuggestions({candidates:[]},items));
 assert.throws(()=>validateSuggestions({candidates:[{id:'cursor-spotlight',reason:{html:'<script>'}}]},items));
 assert.deepEqual(validateSuggestions({candidates:[{id:'cursor-spotlight',reason:'Glow'}]},items),[{id:'cursor-spotlight',reason:'Glow'}]);
});
test('five interface dictionaries have a nonempty string for every declared key',async()=>{
 const src=await readFile(new URL('public/i18n.js',root),'utf8');
 const stub=src.slice(0,src.indexOf('export let locale='));
 const module=await import('data:text/javascript;base64,'+Buffer.from(stub).toString('base64'));
 const all=module.dictionaries,keys=Object.keys(all['zh-CN']);assert.ok(keys.length>90);
 for(const locale of ['zh-CN','en','ja','ko','de'])for(const key of keys)assert.equal(typeof all[locale][key],'string',locale+':'+key);
});
test('every registry template has an implemented renderer and every HTML translation exists',async()=>{
 const src=await readFile(new URL('public/previews.js',root),'utf8');
 const ids=JSON.parse(src.match(/export const rendererIds=(\[[^\n]+\]);/)[1].replaceAll("'",'"'));
 assert.deepEqual([...ids].sort(),Object.keys(registry.templates).sort());
 const i18n=await readFile(new URL('public/i18n.js',root),'utf8');
 const module=await import('data:text/javascript;base64,'+Buffer.from(i18n.slice(0,i18n.indexOf('export let locale='))).toString('base64'));
 for(const filename of ['index.html','studio.html','docs.html','authorize.html']){
  const html=await readFile(new URL('public/'+filename,root),'utf8');
  for(const match of html.matchAll(/data-i18n(?:-label|-placeholder)?="([^"]+)"/g))assert.ok(module.dictionaries.en[match[1]],match[1]);
 }
});

test('custom cursor briefs preserve safe colors and all supported shape choices',()=>{
 const item=items.find(i=>i.id==='custom-cursor');
 for(const shape of registry.templates['custom-cursor'].params.shape.values){
  const params=effectiveParams(item,registry,{shape,color:'#123abc',size_px:64,follow_ms:0});
  const brief=makeBrief(item,registry,'zh-CN',params);
  assert.ok(brief.includes(shape)&&brief.includes('#123abc')&&brief.includes('64px')&&brief.includes('0ms'));
 }
 for(const color of ['red','#fff','#12345678','#B5452E\n','var(--ink)','url(https://example.com/x)',false]){
  assert.throws(()=>effectiveParams(item,registry,{color}));
 }
 assert.throws(()=>effectiveParams(item,registry,{shape:'<svg onload=alert(1)>'}));
 assert.throws(()=>effectiveParams(item,registry,{hover_scale:3}));
 assert.ok(localCandidates(items,'想要鼠标换形状').some(i=>i.id==='custom-cursor'));
});
