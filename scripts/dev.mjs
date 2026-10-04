import {createServer} from 'node:http';
import './build.mjs';
const {default:worker}=await import('../dist/server/index.js');
const server=createServer(async(req,res)=>{try{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>20000){res.writeHead(413);res.end();return;}chunks.push(chunk);}const body=Buffer.concat(chunks);const request=new Request('http://localhost:4173'+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});const response=await worker.fetch(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Request failed');}});
server.listen(4173,'127.0.0.1',()=>console.log('IntentKit preview: http://localhost:4173'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
