import {readFile,writeFile,mkdir,cp,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {leafMarkup} from '../public/leaf-art.js';
import {effectiveParams} from '../public/core.js';
import {assertCompilerType} from '../public/compiler-schema.js';
import {assertPreviewCoverage} from '../public/preview-capabilities.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await mkdir(path.join(root,'dist/client'),{recursive:true});await mkdir(path.join(root,'dist/server'),{recursive:true});
await cp(path.join(root,'public'),path.join(root,'dist/client'),{recursive:true});
const metadata=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
if(!/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){4}$/.test(metadata.intentkitVersion))throw new Error('intentkitVersion must have five integer segments');
await writeFile(path.join(root,'dist/client/version.json'),JSON.stringify({version:metadata.intentkitVersion,package_version:metadata.version})+'\n');
await writeFile(path.join(root,'dist/client/leaf-cursor.svg'),leafMarkup()+'\n');
for(const name of ['index.html','studio.html','docs.html','authorize.html']){
 const file=path.join(root,'dist/client',name);const html=await readFile(file,'utf8');
 await writeFile(file,html.replaceAll('__PROJECT_VERSION__',metadata.intentkitVersion).replace(/((?:src|href)="\.\/[^"?]+\.(?:js|css|woff2|zip))"/g,'$1?v='+metadata.intentkitVersion+'"'));
}
// All modules and font URLs share a release namespace, including nested imports.
for(const name of await readdir(path.join(root,'dist/client'))){
 const file=path.join(root,'dist/client',name);
 if(name.endsWith('.js')){const source=await readFile(file,'utf8');await writeFile(file,source.replace(/(from\s*['"]\.\/[^'"?]+\.js)(['"])/g,'$1?v='+metadata.intentkitVersion+'$2'));}
 if(name.endsWith('.css')){const source=await readFile(file,'utf8');await writeFile(file,source.replace(/(url\(['"]?\.\/[^)'"?]+\.(?:woff2?|svg))(['"]?\))/g,'$1?v='+metadata.intentkitVersion+'$2'));}
}
const filenames=(await readdir(path.join(root,'content/items'))).filter(n=>n.endsWith('.json')).sort();
const items=await Promise.all(filenames.map(n=>readFile(path.join(root,'content/items',n),'utf8').then(JSON.parse)));
const registry=JSON.parse(await readFile(path.join(root,'previews/registry.json'),'utf8'));
assertPreviewCoverage(items,registry);
for(const item of items)effectiveParams(item,registry);
await writeFile(path.join(root,'dist/client/catalog.json'),JSON.stringify({items,registry}));
const compiler={version:metadata.intentkitVersion};
for(const [key,name] of Object.entries({schemas:'schema',lexicon:'lexicon',strings:'strings',implementations:'implementations'}))compiler[key]=JSON.parse(await readFile(path.join(root,'compiler',name+'.json'),'utf8'));
function checkSchemaRefs(value){if(!value||typeof value!=='object')return;if(value.$ref&&(!value.$ref.startsWith('#/$defs/')||!compiler.schemas.$defs[value.$ref.slice(8)]))throw new Error('Unknown compiler schema reference: '+value.$ref);for(const child of Object.values(value))checkSchemaRefs(child);}
checkSchemaRefs(compiler.schemas);
compiler.recipes=await Promise.all((await readdir(path.join(root,'compiler/recipes'))).filter(name=>name.endsWith('.json')).sort().map(async name=>JSON.parse(await readFile(path.join(root,'compiler/recipes',name),'utf8'))));
const recipeIds=new Set();
for(const recipe of compiler.recipes){
 if(recipeIds.has(recipe.id))throw new Error('Duplicate recipe: '+recipe.id);recipeIds.add(recipe.id);
 if(!/^[a-z][a-z0-9-]{1,79}$/.test(recipe.id)||!compiler.schemas.$defs.DesignIR.properties.target.enum.includes(recipe.target)||!compiler.schemas.$defs.DesignIR.properties.interaction.properties.trigger.enum.includes(recipe.trigger)||!['lift','glow','press','stagger','ripple'].includes(recipe.feature))throw new Error('Invalid recipe definition: '+recipe.id);
 const item=items.find(item=>item.id===recipe.item_id);if(!item?.preview)throw new Error('Unknown recipe item: '+recipe.item_id);
 effectiveParams(item,registry,recipe.params);assertCompilerType(compiler.implementations[recipe.id],'Implementation',compiler.schemas);
 for(const locale of ['zh-CN','en','ja','ko','de'])if(!recipe.locales[locale]?.name||!recipe.locales[locale]?.reason||!['draft','reviewed'].includes(recipe.locales[locale]?.review_status)||!compiler.strings[locale])throw new Error('Missing compiler locale or review status: '+locale);
}
await writeFile(path.join(root,'dist/client/compiler.json'),JSON.stringify(compiler));
await writeFile(path.join(root,'dist/server/compiler-data.js'),'export default '+JSON.stringify(compiler)+';\n');
for(const name of ['compiler-core.js','compiler-schema.js'])await cp(path.join(root,'public',name),path.join(root,'dist/server',name));
const files={};async function walk(dir,prefix=''){for(const name of await readdir(dir)){const filename=path.join(dir,name),key=prefix+'/'+name;if((await stat(filename)).isDirectory())await walk(filename,key);else files[key]=(await readFile(filename)).toString('base64');}}
await walk(path.join(root,'dist/client'));await writeFile(path.join(root,'dist/server/assets.js'),'export default '+JSON.stringify(files)+';\n');
await cp(path.join(root,'server/worker.js'),path.join(root,'dist/server/index.js'));await cp(path.join(root,'public/core.js'),path.join(root,'dist/server/core.js'));
await cp(path.join(root,'public/tokendance.js'),path.join(root,'dist/server/tokendance.js'));
await writeFile(path.join(root,'dist/server/catalog.js'),'export default '+JSON.stringify({items,registry})+';\n');
console.log(`Built static pages + BYOK Worker; ${items.length} entries, ${Object.keys(files).length} assets.`);
