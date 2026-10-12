const encoder=new TextEncoder();
const table=Uint32Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
export function crc32(bytes){let value=0xffffffff;for(const byte of bytes)value=table[(value^byte)&255]^(value>>>8);return (value^0xffffffff)>>>0;}
export function zipFiles(files){
 const chunks=[],directory=[];let offset=0,count=0;
 for(const [name,content]of Object.entries(files)){
  if(!/^[a-zA-Z0-9_./-]+$/.test(name)||name.startsWith('/')||name.split('/').includes('..'))throw new Error('Unsafe archive path');
  const filename=encoder.encode(name),bytes=typeof content==='string'?encoder.encode(content):content;
  if(!(bytes instanceof Uint8Array))throw new Error('Invalid archive data');
  const crc=crc32(bytes),header=new Uint8Array(30+filename.length),view=new DataView(header.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);view.setUint16(12,33,true);view.setUint32(14,crc,true);view.setUint32(18,bytes.length,true);view.setUint32(22,bytes.length,true);view.setUint16(26,filename.length,true);header.set(filename,30);
  const entry=new Uint8Array(46+filename.length),central=new DataView(entry.buffer);
  central.setUint32(0,0x02014b50,true);central.setUint16(4,20,true);central.setUint16(6,20,true);central.setUint16(8,0x800,true);central.setUint16(14,33,true);central.setUint32(16,crc,true);central.setUint32(20,bytes.length,true);central.setUint32(24,bytes.length,true);central.setUint16(28,filename.length,true);central.setUint32(42,offset,true);entry.set(filename,46);
  chunks.push(header,bytes);directory.push(entry);offset+=header.length+bytes.length;count++;
 }
 const size=directory.reduce((sum,entry)=>sum+entry.length,0),end=new Uint8Array(22),view=new DataView(end.buffer);
 view.setUint32(0,0x06054b50,true);view.setUint16(8,count,true);view.setUint16(10,count,true);view.setUint32(12,size,true);view.setUint32(16,offset,true);
 return new Blob([...chunks,...directory,end],{type:'application/zip'});
}
