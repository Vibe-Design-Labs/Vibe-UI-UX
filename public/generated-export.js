import {validateArtifact,generatedParams,generatedBrief} from './generated-core.js';
import {zipFiles} from './zip.js';
export function generatedProject(artifact,params){const a=validateArtifact(artifact),p=generatedParams(a,params);return {schema:'intentkit.generated-project',schema_version:1,artifact:a,params:p,brief:generatedBrief(a,p)};}
export function importGeneratedProject(value){
 if(value?.schema==='intentkit.generated-effect'){const artifact=validateArtifact(value);return generatedProject(artifact,{});}
 if(!['intentkit.generated-project','intentkit.community-case'].includes(value?.schema)||!value.artifact)throw new Error('format');
 return generatedProject(value.artifact,value.params);
}
export async function generatedZip(artifact,params,fetchFile=async name=>{const response=await fetch(new URL('./'+name,import.meta.url));if(!response.ok)throw new Error('network');return response.text();}){
 const project=generatedProject(artifact,params),files={};
 for(const name of ['generated-core.js','generated-preview.js','generated-frame.html','generated-frame.js','generated-frame-boot.js'])files[name]=(await fetchFile(name)).replace(/(\.\/[^'"?]+\.(?:js|css))\?v=[^'"]+/g,'$1');
 files['effect.json']=JSON.stringify(project,null,2);files['effect.html']=project.artifact.html;files['effect.css']=project.artifact.css;files['effect.js']=project.artifact.js;
 files['README.md']='# '+project.artifact.title+'\n\nAI-authored Web effect, submitted under MIT if the author consents. Review the source before reuse.\n\nRun `python -m http.server 4180` and open http://localhost:4180/ . The preview uses the same opaque-origin sandbox and exact effect.json parameters as IntentKit. This package needs no key and makes no model calls. HTML, CSS and JS source are provided for integration.\n\n'+project.brief+'\n';
 files['index.html']='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Generated effect</title><link rel="stylesheet" href="./example.css"><script type="module" src="./example.js"></script></head><body><h1 id="title"></h1><p id="summary"></p><main id="preview"></main><aside id="params"></aside><p id="status" role="status"></p></body></html>';
 files['example.css']='body{margin:24px;background:#f4ecd9;color:#233d32;font:18px Georgia,serif}main{max-width:900px}iframe{width:100%;height:440px;border:0;border-radius:24px}label{display:inline-grid;gap:8px;margin:16px}input{max-width:180px}';
 files['example.js']=`import {mountGeneratedPreview} from './generated-preview.js';
import {generatedParams} from './generated-core.js';
const p=await(await fetch('./effect.json')).json(),params=generatedParams(p.artifact,p.params);
document.querySelector('#title').textContent=p.artifact.title;document.querySelector('#summary').textContent=p.artifact.summary;
const controller=mountGeneratedPreview(document.querySelector('#preview'),p.artifact,params,{onStatus(status){document.querySelector('#status').textContent=status;}});
for(const rule of p.artifact.parameters){const label=document.createElement('label'),name=document.createElement('span'),input=document.createElement('input');name.textContent=rule.label;input.type=rule.type==='number'?'range':rule.type==='boolean'?'checkbox':'color';if(rule.type==='number'){input.min=rule.min;input.max=rule.max;input.step=rule.step;}input.value=params[rule.id];input.checked=params[rule.id]===true;const out=document.createElement('output');out.textContent=params[rule.id]+(rule.unit||'');input.addEventListener('input',()=>{params[rule.id]=rule.type==='number'?Number(input.value):rule.type==='boolean'?input.checked:input.value;out.textContent=params[rule.id]+(rule.unit||'');controller.update(params);});label.append(name,input,out);document.querySelector('#params').append(label);}addEventListener('pagehide',()=>controller.dispose());`;
 return zipFiles(files);
}
