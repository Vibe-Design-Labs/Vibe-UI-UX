import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {leafArt,leafMarkup} from '../public/leaf-art.js';
import {lightRGB,followAmount} from '../public/pointer-light.js';
import {effectiveParams,makeBrief} from '../public/core.js';
const root=new URL('../',import.meta.url);
const registry=JSON.parse(await readFile(new URL('previews/registry.json',root)));
const item=JSON.parse(await readFile(new URL('content/items/custom-cursor.json',root)));

test('light color accepts only six-digit colors, never CSS code or network resources',()=>{
 assert.equal(lightRGB('#EBCB8B'),'235,203,139');
 for(const value of ['#fff','#12345678','red','url(https://untrusted.test)','var(--color)',null,'#EBCB8B\n'])assert.throws(()=>lightRGB(value));
});
test('following is time-based: two 8ms updates equal one 16ms update and zero follows immediately',()=>{
 const one=followAmount(16,80),half=followAmount(8,80);
 assert.ok(Math.abs(one-(1-(1-half)**2))<1e-12);
 assert.equal(followAmount(16,0),1);assert.ok(followAmount(16,80)>0&&followAmount(16,80)<1);
});
test('leaf SVG is self-contained, safe and generated from the same source as the live cursor',async()=>{
 const markup=leafMarkup();assert.ok(markup.includes(leafArt.body)&&markup.includes(leafArt.vein)&&markup.includes(leafArt.accent));
 assert.ok(!markup.includes('script')&&!markup.includes('href=')&&!markup.includes('image'));
 const exported=await readFile(new URL('dist/client/leaf-cursor.svg',root),'utf8');assert.equal(exported.trim(),markup);
 for(const color of ['red','#abc','#ffffff\n','"><script>','url(https://untrusted.test)'])assert.throws(()=>leafMarkup(color));
});
test('cursor and spotlight parameters are independent and preserve exact export values in five locales',()=>{
 const values={follow_ms:0,spotlight_follow_ms:120,spotlight_radius_px:220,spotlight_opacity:.23,spotlight_color:'#123ABC'};
 const params=effectiveParams(item,registry,values);
 assert.equal(params.shape,'leaf');assert.equal(params.color,leafArt.body);assert.equal(params.size_px,32);
 for(const locale of ['zh-CN','en','ja','ko','de']){
  const brief=makeBrief(item,registry,locale,values);for(const value of Object.values(values))assert.ok(brief.includes(String(value)));
 }
 for(const bad of [{spotlight_opacity:.36},{spotlight_radius_px:401},{spotlight_follow_ms:-1},{spotlight_color:'var(--ink)'}])assert.throws(()=>effectiveParams(item,registry,bad));
});
test('public version uses five segments and rendered pages never expose a shortened or unresolved version',async()=>{
 const pkg=JSON.parse(await readFile(new URL('package.json',root))),version=JSON.parse(await readFile(new URL('dist/client/version.json',root)));
 assert.match(pkg.intentkitVersion,/^\d+(?:\.\d+){4}$/);assert.equal(version.version,pkg.intentkitVersion);
 assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 for(const name of ['index.html','studio.html']){const html=await readFile(new URL('dist/client/'+name,root),'utf8');assert.ok(html.includes('v'+pkg.intentkitVersion));assert.ok(!html.includes('__PROJECT_VERSION__'));}
});
