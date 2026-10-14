import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import './build.mjs';
const {default:worker}=await import('../dist/server/index.js');
const port=Number(process.env.INTENTKIT_PREVIEW_PORT||4173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid preview port');
const server=createServer(async(req,res)=>{
 const abort=new AbortController();req.on('aborted',()=>abort.abort());res.on('close',()=>{if(!res.writableEnded)abort.abort();});
 try{
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>20000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const body=Buffer.concat(chunks),request=new Request('http://localhost:'+port+req.url,{method:req.method,headers:req.headers,signal:abort.signal,...(['GET','HEAD'].includes(req.method)?{}:{body})});
  const response=await worker.fetch(request);res.writeHead(response.status,Object.fromEntries(response.headers));
  if(response.body)await pipeline(Readable.fromWeb(response.body),res);else res.end();
 }catch{if(!res.headersSent){res.writeHead(500);res.end('Request failed');}else res.destroy();}
});
server.listen(port,'127.0.0.1',()=>console.log('IntentKit preview: http://localhost:'+port));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
