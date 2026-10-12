import {validateComponentSpec,componentTargets} from './effect-contract.js';
import {zipFiles} from './zip.js';

export const kitFiles=['core.js','effect-contract.js','effect-timing.js','effect-webgl.js','effect-kit.js'];
const safeJSON=value=>JSON.stringify(value,null,2).replaceAll('<','\\u003c');
export function projectFiles(input,target,{version='development',compilation=null}={}){
 const spec=validateComponentSpec(input);
 if(!componentTargets.includes(target))throw new Error('Unknown component target');
 const files={
  'effect.json':safeJSON(spec)+'\n',
  'font.css':"@font-face{font-family:'IntentKit Notes';src:url('./fonts/intentkit-notes.woff2') format('woff2');font-display:swap}body{font-family:'IntentKit Notes',system-ui,sans-serif;color:#243c31;background:#f4ecd9;margin:0}button{font:inherit}\n",
  'export-manifest.json':safeJSON({schema:'intentkit.code-export',schema_version:1,version,target,item_id:spec.item_id,template_id:spec.template_id,params:spec.params,renderer:spec.template_id==='cursor-spotlight'?'webgl-with-css-fallback':'dom',timeline:'4-second scripted demonstration',duration_ms:4000,code_source:'Shared with the studio preview; exported without model-generated code.',support:'Five declared effect templates only; no arbitrary combinations or full-page generation.'})+'\n',
  'brief.txt':spec.brief+'\n',
  'intent.json':safeJSON({schema_version:1,item_id:spec.item_id,canonical_name:spec.canonical_name,requested_locale:spec.requested_locale,content_locale:spec.content_locale,template_id:spec.template_id,params:spec.params,brief:spec.brief,sources:spec.sources})+'\n',
 };
 if(compilation)files['compilation.json']=safeJSON(compilation)+'\n';
 const react=`import React, {useLayoutEffect,useRef} from 'react';
import {mountEffect,attachEffect,effectCSS} from './render-kit/effect-kit.js';
import {validateComponentSpec} from './render-kit/effect-contract.js';
import defaultSpec from './effect.json';
export function IntentEffect({params={},spec=defaultSpec,timeMs=null,reducedMotion,onBackend,children,...props}) {
 const host=useRef(null),controller=useRef(null);
 const input=validateComponentSpec(spec,params);
 const signature=JSON.stringify(input),hasChildren=children!==undefined;
 useLayoutEffect(()=>{
  const content=host.current.querySelector('[data-intent-content]');
  const target=input.template_id==='slide-fade-list'?content?.firstElementChild:content;
  controller.current=hasChildren?attachEffect(target,input,{reducedMotion,onBackend,mode:timeMs===null?'interactive':'frame'}):mountEffect(host.current,input,{reducedMotion,onBackend,mode:timeMs===null?'interactive':'frame'});
  return ()=>{controller.current?.dispose();controller.current=null;};
 },[signature,reducedMotion,hasChildren,children]);
 useLayoutEffect(()=>{if(timeMs!==null)controller.current?.renderAt(timeMs);else controller.current?.play();},[timeMs,signature,reducedMotion,hasChildren,children]);
 return <div {...props} ref={host}>{hasChildren&&<><style>{effectCSS}</style><div data-intent-content>{children}</div></>}</div>;
}
export function useIntentEffect(targetRef,{params={},spec=defaultSpec,timeMs=null,reducedMotion,onBackend}={}) {
 const controller=useRef(null),input=validateComponentSpec(spec,params),signature=JSON.stringify(input);
 useLayoutEffect(()=>{
  if(!targetRef.current)return;
  const style=document.createElement('style');style.textContent=effectCSS;document.head.append(style);
  try{controller.current=attachEffect(targetRef.current,input,{reducedMotion,onBackend,mode:timeMs===null?'interactive':'frame'});}catch(error){style.remove();throw error;}
  return ()=>{controller.current?.dispose();controller.current=null;style.remove();};
 },[targetRef,signature,reducedMotion]);
 useLayoutEffect(()=>{if(timeMs!==null)controller.current?.renderAt(timeMs);else controller.current?.play();},[timeMs,signature,reducedMotion]);
 return controller;
}
`;
 if(target==='web'){
  files['index.html']='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IntentKit standalone effect</title><link rel="stylesheet" href="./font.css"><script type="module" src="./example.js"></script></head><body><main style="max-width:760px;margin:40px auto;padding:24px"><h1>IntentKit / standalone effect</h1><div id="effect"></div><p id="renderer"></p><p id="brief"></p><label>Scripted frame (milliseconds) <input id="frame" type="range" min="0" max="4000" value="0"></label> <button id="interactive">Return to interaction</button></main></body></html>\n';
  files['example.js']="import {mountEffect} from './render-kit/effect-kit.js';\nconst response=await fetch('./effect.json');if(!response.ok)throw new Error('Effect data unavailable');const spec=await response.json();\nconst effect=mountEffect(document.querySelector('#effect'),spec,{onBackend(backend){document.querySelector('#renderer').textContent=backend==='css-fallback'?'Approximate CSS fallback':backend;}});\ndocument.querySelector('#brief').textContent=effect.spec.brief;\ndocument.querySelector('#frame').addEventListener('input',event=>effect.renderAt(Number(event.target.value)));\ndocument.querySelector('#interactive').addEventListener('click',()=>effect.play());\nwindow.addEventListener('pagehide',()=>effect.dispose());\n";
  files['serve.mjs']=`import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2'};
createServer(async(req,res)=>{try{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(relative==='/'?'/index.html':relative));if(!file.startsWith(root+path.sep))throw new Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(4180,'127.0.0.1',()=>console.log('http://localhost:4180'));
`;
 }else{
  files['IntentEffect.jsx']=react;
  files['package.json']=safeJSON({name:'intentkit-exported-effect',version:'1.0.0',private:true,type:'module',...(target==='video'?{scripts:{studio:'remotion studio src/index.jsx',render:'remotion render src/index.jsx IntentEffect out/effect.mp4 --gl=angle'},dependencies:{react:'19.3.0','react-dom':'19.3.0',remotion:'4.0.534','@remotion/cli':'4.0.534'}}:{peerDependencies:{react:'>=18 <20','react-dom':'>=18 <20'}})})+'\n';
 }
 if(target==='video'){
  files['src/index.jsx']="import {registerRoot} from 'remotion';\nimport {Root} from './Root.jsx';\nregisterRoot(Root);\n";
  files['src/Root.jsx']=`import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Composition,continueRender,delayRender,cancelRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {IntentEffect} from '../IntentEffect.jsx';
import spec from '../effect.json';
function Scene(){
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const [backend,setBackend]=useState('');
 const [handle]=useState(()=>delayRender('Load the bundled font'));
 useEffect(()=>{let active=true;const font=new FontFace('IntentKit Notes','url('+staticFile('fonts/intentkit-notes.woff2')+')');font.load().then(loaded=>{if(active){document.fonts.add(loaded);continueRender(handle);}}).catch(cancelRender);return()=>{active=false;};},[handle]);
 return <AbsoluteFill style={{background:'#f4ecd9',color:'#243c31',justifyContent:'center',fontFamily:'IntentKit Notes,system-ui'}}><IntentEffect spec={spec} timeMs={frame/fps*1000} reducedMotion={false} onBackend={setBackend}/>{backend==='css-fallback'&&<p style={{textAlign:'center'}}>Approximate CSS fallback</p>}</AbsoluteFill>;
}
export function Root(){return <Composition id="IntentEffect" component={Scene} durationInFrames={120} fps={30} width={720} height={720}/>;}
`;
 }
 files['README.md']=`# IntentKit exported ${target} effect\n\nVersion: ${version}. Template: ${spec.template_id}.\n\n${spec.brief}\n\n## Run\n\n${target==='web'?'Node.js 20+: run `node serve.mjs`, then open http://localhost:4180. No npm dependencies or API key. Opening file:// directly is unsupported because browsers restrict ES module loading.':target==='react'?'Copy IntentEffect.jsx, effect.json and render-kit/ together into a React 18/19 project. Use `<IntentEffect />` or pass validated `params`. No effect-specific npm runtime dependency. The host controls the font; load font.css with its bundled font when reproducing the studio typography.':'Run `npm install`, then `npm run studio` or `npm run render`. Rendering uses pinned React and Remotion packages and may download a browser; it does not call an AI model. See Remotion licensing: https://www.remotion.dev/license .'}\n\n## Reuse and verify\n\n- effect.json and export-manifest.json record the exact parameters and contract. brief.txt contains the same design description.\n- The studio and this package share the same source modules. Change only registered parameters; unknown or out-of-range values fail validation.\n- React: custom children are wrapped in a binding target. For list entry, supply an appropriate list target to attachEffect yourself; the wrapper is not an automatic adapter for arbitrary DOM trees.\n- Native integration: import attachEffect(target,spec) to bind an existing element. Call dispose() before removing it. The binding owns translate/scale (or child translate/opacity for a list), not your original transform. Include effectCSS for ripple/layer styles.\n- The interactive mode respects reduced motion and provides keyboard/press support. Touch does not activate pointer-hover glow. Video is a deterministic four-second scripted demonstration, not an interaction recording; renderAt(ms) is the same frame evaluator used by the Web example.\n- WebGL renders only the spotlight layer. Lift, press, ripple and list motion use DOM; there is no reason to force those effects through a GPU. A missing/lost WebGL context uses a visibly labelled CSS approximation, not a claim of identical shader pixels.\n- Code: MIT (LICENSE). Bundled font: SIL OFL 1.1 (fonts/WenKai-OFL.txt). React/Remotion retain their own licenses. Reviewed content status and platform verification are separate from code export.\n- No secrets, API keys, account state or model calls are included. Unsupported templates cannot be exported as placeholders.\n`;
 files['README.md']=files['README.md']+'\n## Reuse your own React surface\n\nUse `useIntentEffect(ref, {params})` on your existing card/button/list element instead of nesting an opaque component inside the demo wrapper. The hook includes the required layer styles and cleans up on unmount. A list target may have up to 100 direct element children. The native `attachEffect` API supports the same binding.\n\n## Change the saved parameters\n\nEdit effect.json, then run `node sync-export.mjs`. The renderer reads this JSON as its source of truth. This command validates values and refreshes effect.json, intent.json, brief.txt and manifest parameters without any model call. React runtime prop overrides do not rewrite downloaded snapshot files. If compilation.json is included, incompatible parameter edits are rejected: recompile the intended design in the studio first.\n';
 files['sync-export.mjs']=`import {readFile,writeFile} from 'node:fs/promises';
import {validateComponentSpec} from './render-kit/effect-contract.js';
const spec=validateComponentSpec(JSON.parse(await readFile(new URL('./effect.json',import.meta.url),'utf8')));
try{const compilation=JSON.parse(await readFile(new URL('./compilation.json',import.meta.url),'utf8'));if(Object.keys(compilation.recipe.params).length!==Object.keys(spec.params).length||Object.entries(compilation.recipe.params).some(([key,value])=>spec.params[key]!==value))throw new Error('Compiled intention would diverge. Recompile in the studio before exporting.');}catch(error){if(error.code!=='ENOENT')throw error;}
const write=(name,value)=>writeFile(new URL('./'+name,import.meta.url),JSON.stringify(value,null,2)+'\\n');
await write('effect.json',spec);
await write('intent.json',{schema_version:1,item_id:spec.item_id,canonical_name:spec.canonical_name,requested_locale:spec.requested_locale,content_locale:spec.content_locale,template_id:spec.template_id,params:spec.params,brief:spec.brief,sources:spec.sources});
await writeFile(new URL('./brief.txt',import.meta.url),spec.brief+'\\n');
const manifest=JSON.parse(await readFile(new URL('./export-manifest.json',import.meta.url),'utf8'));manifest.params=spec.params;await write('export-manifest.json',manifest);
console.log('Validated parameters and refreshed descriptions / JSON.');
`;
 return files;
}

export async function componentArchive(spec,target,options={}){
 const files=projectFiles(spec,target,options),version=new URL(import.meta.url).searchParams.get('v');
 const resource=async name=>{const url=new URL('./'+name,import.meta.url);if(version)url.searchParams.set('v',version);const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('Export resource unavailable: '+name);return response;};
 for(const name of kitFiles)files['render-kit/'+name]=(await (await resource(name)).text()).replace(/\?v=\d+(?:\.\d+){4}/g,'');
 files['LICENSE']=await (await resource('application-license.txt')).text();
 const font=new Uint8Array(await (await resource('fonts/intentkit-notes.woff2')).arrayBuffer());
 files['fonts/intentkit-notes.woff2']=font;files['fonts/WenKai-OFL.txt']=await (await resource('fonts/WenKai-OFL.txt')).text();
 if(target==='video'){files['public/fonts/intentkit-notes.woff2']=font;files['public/fonts/WenKai-OFL.txt']=files['fonts/WenKai-OFL.txt'];}
 return zipFiles(files);
}
