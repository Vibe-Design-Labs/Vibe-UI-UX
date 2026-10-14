import {submissionMarker,submissionPrefix,validateSubmission,parseSubmissionBody} from './community-core.js';
// Separate from model budgets: bound automation memory when inflating public input.
export const submissionInflateLimit=32*1024*1024;
async function boundedBytes(stream,limit){const reader=stream.getReader(),parts=[];let size=0;try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new Error('submission-size');}parts.push(value);}}finally{reader.releaseLock();}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes;}
export async function encodedSubmission(input,catalog,repository){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository))throw new Error('Invalid repository');
 const value=validateSubmission(input,catalog),source=new Blob([JSON.stringify(value)]);if(source.size>submissionInflateLimit)throw new Error('submission-size');
 const bytes=await boundedBytes(source.stream().pipeThrough(new CompressionStream('gzip')),48000);
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 const encoded=btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 const body=submissionMarker+'\n\n```intentkit-gzip\n'+encoded+'\n```\n\nPublic code submission under MIT. The bot validates structure and creates a review PR; it does not run this code or merge it. Maintainer review is required.';
 if(new TextEncoder().encode(body).length>65000)throw new Error('submission-size');
 const url=new URL('https://github.com/'+repository+'/issues/new');url.searchParams.set('title',submissionPrefix+value.title);
 const bare=url.href;url.searchParams.set('body',body);
 return {body,url:url.href.length<=7800?url.href:bare,needsPaste:url.href.length>7800};
}
export async function decodeSubmission(body,catalog){
 if(typeof body!=='string'||!body.startsWith(submissionMarker)||new TextEncoder().encode(body).length>65000)throw new Error('Invalid submission body');
 if(!body.includes('```intentkit-gzip'))return parseSubmissionBody(body,catalog);
 const blocks=Array.from(body.matchAll(/```intentkit-gzip\s*\n([A-Za-z0-9_-]+)\n```/g));
 if(blocks.length!==1||body.includes('```json'))throw new Error('Exactly one compressed block required');
 const binary=atob(blocks[0][1].replaceAll('-','+').replaceAll('_','/'));
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const inflated=await boundedBytes(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),submissionInflateLimit);
 return validateSubmission(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(inflated)),catalog);
}
