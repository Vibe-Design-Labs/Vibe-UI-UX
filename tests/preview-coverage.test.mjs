import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rendererIds,sceneFamilies,assertPreviewCoverage} from '../public/preview-capabilities.js';
import {sceneWords} from '../public/scene-strings.js';
import {effectiveParams} from '../public/core.js';
const {items,registry}=JSON.parse(await readFile(new URL('../dist/client/catalog.json',import.meta.url),'utf8'));

test('every public entry has an implemented preview, and missing or invented previews fail the publication gate',()=>{
 assert.doesNotThrow(()=>assertPreviewCoverage(items,registry));
 const absent=structuredClone(items);absent.find(i=>i.id==='organic-biophilic').preview=null;
 assert.throws(()=>assertPreviewCoverage(absent,registry),/organic-biophilic/);
 const invented=structuredClone(items);invented[0].preview.template_id='invented-material';
 assert.throws(()=>assertPreviewCoverage(invented,registry),/requires an implemented preview/);
 assert.equal(new Set(rendererIds).size,rendererIds.length);
 for(const item of items)if(sceneFamilies[item.preview.template_id])assert.equal(item.preview.template_id,item.id);
});
test('scene interfaces have five complete language columns, independently from draft entry translations',()=>{
 for(const [key,values]of Object.entries(sceneWords)){
  assert.equal(values.length,5,key);
  assert.ok(values.every(v=>typeof v==='string'&&v.trim().length),key);
 }
});
test('count parameters cannot silently round a fractional shared value away from the exported value',()=>{
 const item=items.find(i=>i.id==='predictive-analytics');
 assert.throws(()=>effectiveParams(item,registry,{horizon_days:7.5}),/Invalid parameter/);
 assert.equal(effectiveParams(item,registry,{horizon_days:7}).horizon_days,7);
});
