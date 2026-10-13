import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {componentSpec,validateComponentSpec,canExportComponent,componentTemplates} from '../public/effect-contract.js';
import {effectFrame,follow,ease} from '../public/effect-timing.js';
import {projectFiles} from '../public/effect-export.js';
import {zipFiles,crc32} from '../public/zip.js';
import {componentWords} from '../public/component-strings.js';
// i18n checks use a guarded localStorage; no browser globals are needed at import.
const {items,registry}=JSON.parse(await readFile(new URL('../dist/client/catalog.json',import.meta.url)));
const item=id=>items.find(value=>value.id===id);
const ids=['cursor-spotlight','hover-lift','press-feedback','click-ripple','staggered-reveal'];

test('supported code exports retain the exact preview contract, JSON and description parameters',()=>{
 for(const id of ids){const source=item(id),spec=componentSpec(source,registry,{},'zh-CN');
  assert.deepEqual(validateComponentSpec(spec).params,spec.params);assert.equal(spec.contract.version,registry.templates[spec.template_id].version);
  for(const target of ['web','react','video']){const files=projectFiles(spec,target,{version:'0.4.2.0.0'}),data=JSON.parse(files['effect.json']),intent=JSON.parse(files['intent.json']);assert.deepEqual(data.params,spec.params);assert.deepEqual(intent.params,spec.params);assert.equal(intent.brief,spec.brief);assert.equal(files['brief.txt'].trim(),spec.brief);assert.deepEqual(JSON.parse(files['export-manifest.json']).params,spec.params);}
 }
 const spec=componentSpec(item('cursor-spotlight'),registry,{color:'#B5452E',opacity:.27,lift_px:9,duration_ms:333},'en');
 assert.equal(spec.params.color,'#B5452E');assert.ok(spec.brief.includes('333'));assert.ok(spec.brief.includes('#B5452E'));
 const changed=validateComponentSpec(spec,{duration_ms:444});assert.ok(changed.brief.includes('444'));assert.ok(!changed.brief.includes('333'));
});
test('missing implementations, unsafe parameters and invented formats fail rather than producing placeholders',()=>{
 assert.equal(componentTemplates.length,5);assert.equal(canExportComponent(item('organic-biophilic')),false);
 assert.throws(()=>componentSpec(item('organic-biophilic'),registry),/unavailable/);
 const spec=componentSpec(item('hover-lift'),registry);
 for(const params of [{lift_px:999},{duration_ms:-1},{lift_px:'3'},{lift_px:NaN},{unknown:3}])assert.throws(()=>validateComponentSpec(spec,params));
 assert.throws(()=>projectFiles(spec,'flutter'),/Unknown/);
 assert.throws(()=>zipFiles({'../secret':'no'}),/Unsafe/);
});
test('frames are deterministic when requested out of order, and reduced motion stays static',()=>{
 for(const id of ids){const spec=componentSpec(item(id),registry),times=[900,0,1500,900,2500,600];const first=effectFrame(spec,900);
  for(const time of times){const frame=effectFrame(spec,time);assert.ok(Number.isFinite(frame.amount));assert.ok(frame.rows.every(Number.isFinite));}
  assert.deepEqual(effectFrame(spec,900),first);const reduced=effectFrame(spec,900,{reducedMotion:true});assert.equal(reduced.amount,0);assert.equal(reduced.ripple,null);assert.deepEqual(reduced.rows,[1,1,1]);
 }
 const spec=componentSpec(item('hover-lift'),registry,{duration_ms:0});assert.equal(effectFrame(spec,400).amount,1);assert.equal(effectFrame(spec,1800).amount,0);
 assert.equal(follow(0,1,80,80),1-Math.exp(-1));assert.equal(follow(0,1,0,0),1);
 assert.equal(ease(0),0);assert.equal(ease(1),1);assert.ok(ease(.5)>.5);
});
test('generated archives have independently readable ZIP headers, lengths and CRCs',async()=>{
 const blob=zipFiles({'example.txt':'中文 / example','assets/bytes.bin':new Uint8Array([0,1,2,255])}),bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer);
 let offset=0;const output={};while(view.getUint32(offset,true)===0x04034b50){const nameSize=view.getUint16(offset+26,true),size=view.getUint32(offset+18,true),name=new TextDecoder().decode(bytes.slice(offset+30,offset+30+nameSize)),body=bytes.slice(offset+30+nameSize,offset+30+nameSize+size);assert.equal(crc32(body),view.getUint32(offset+14,true));output[name]=body;offset+=30+nameSize+size;}
 assert.equal(new TextDecoder().decode(output['example.txt']),'中文 / example');assert.deepEqual(output['assets/bytes.bin'],new Uint8Array([0,1,2,255]));assert.equal(view.getUint32(offset,true),0x02014b50);assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);
});
test('component controls are localized in five languages and the pilot uses the shared frame renderer',()=>{
 for(const [name,values]of Object.entries(componentWords)){assert.equal(values.length,5,name);assert.ok(values.every(value=>value.trim().length));}
 const spec=componentSpec(item('cursor-spotlight'),registry);const files=projectFiles(spec,'video');assert.ok(files['src/Root.jsx'].includes('frame/fps*1000'));assert.ok(files['IntentEffect.jsx'].includes('renderAt(timeMs)'));assert.ok(files['README.md'].includes('four-second scripted'));
});
