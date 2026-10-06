import {readFile,writeFile,mkdir,cp,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {leafMarkup} from '../public/leaf-art.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await mkdir(path.join(root,'dist/client'),{recursive:true});await mkdir(path.join(root,'dist/server'),{recursive:true});
await cp(path.join(root,'public'),path.join(root,'dist/client'),{recursive:true});
const metadata=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
if(!/^(?:0|[1-9]\d*)(?:\.(?:0|[1-9]\d*)){4}$/.test(metadata.intentkitVersion))throw new Error('intentkitVersion must have five integer segments');
await writeFile(path.join(root,'dist/client/version.json'),JSON.stringify({version:metadata.intentkitVersion,package_version:metadata.version})+'\n');
await writeFile(path.join(root,'dist/client/leaf-cursor.svg'),leafMarkup()+'\n');
for(const name of ['index.html','studio.html','docs.html','authorize.html']){
 const file=path.join(root,'dist/client',name);const html=await readFile(file,'utf8');await writeFile(file,html.replaceAll('__PROJECT_VERSION__',metadata.intentkitVersion));
}
const filenames=(await readdir(path.join(root,'content/items'))).filter(n=>n.endsWith('.json')).sort();
const items=await Promise.all(filenames.map(n=>readFile(path.join(root,'content/items',n),'utf8').then(JSON.parse)));
const registry=JSON.parse(await readFile(path.join(root,'previews/registry.json'),'utf8'));
await writeFile(path.join(root,'dist/client/catalog.json'),JSON.stringify({items,registry}));
const files={};async function walk(dir,prefix=''){for(const name of await readdir(dir)){const filename=path.join(dir,name),key=prefix+'/'+name;if((await stat(filename)).isDirectory())await walk(filename,key);else files[key]=(await readFile(filename)).toString('base64');}}
await walk(path.join(root,'dist/client'));await writeFile(path.join(root,'dist/server/assets.js'),'export default '+JSON.stringify(files)+';\n');
await cp(path.join(root,'server/worker.js'),path.join(root,'dist/server/index.js'));await cp(path.join(root,'public/core.js'),path.join(root,'dist/server/core.js'));
await cp(path.join(root,'public/tokendance.js'),path.join(root,'dist/server/tokendance.js'));
await writeFile(path.join(root,'dist/server/catalog.js'),'export default '+JSON.stringify({items,registry})+';\n');
console.log(`Built static pages + BYOK Worker; ${items.length} entries, ${Object.keys(files).length} assets.`);
