import {generationPrompt} from './generated-core.js';
import {readGenerationResponse,generationWatchdog} from './generation-stream.js';
import {modelError,abortError} from './model-response.js';
import {modelReceipt} from './model-audit.js';
import {tokenDanceEndpoint,officialAppURL,validKey,validModel,boundedJSON} from './tokendance.js';
export async function requestGeneratedEffect({intent,model,locale,key,mode,signal,appURL=officialAppURL,onProgress=()=>{},onReceipt=()=>{},limits},upstream=fetch){
 if(!['direct','relay'].includes(mode)||!['zh-CN','en','ja','ko','de'].includes(locale)||typeof intent!=='string'||!intent.trim()||intent.length>2000||!validKey(key)||!validModel(model))throw modelError('input');
 const direct=mode==='direct',endpoint=direct?tokenDanceEndpoint:new URL('./api/translate',import.meta.url).href;
 const headers={'Content-Type':'application/json',...(direct?{Authorization:'Bearer '+key,'X-App-URL':appURL}:{'X-TokenDance-Key':key})};
 const body=direct?generationPrompt({intent,model,locale}):{intent,model,locale,task:'generate'};
 const watchdog=generationWatchdog(signal,limits);let response,receipt=modelReceipt(model);
 try{
  if(watchdog.signal.aborted)throw abortError(watchdog.signal);
  try{response=await upstream(endpoint,{method:'POST',headers,body:JSON.stringify(body),signal:watchdog.signal,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});}catch{throw watchdog.signal.aborted?abortError(watchdog.signal):modelError('network');}
  watchdog.activity();
  if(!direct&&!response.ok){let value;try{value=await boundedJSON(response,8000);}catch{throw modelError('response-json',{received:true,status:response.status});}const e=modelError(value.diagnostic?.code||value.error||'network',{received:value.diagnostic?.received===true,status:value.diagnostic?.status??response.status,recovery:value.recovery});e.receipt=modelReceipt(model,value.receipt||{},key);throw e;}
  const value=await readGenerationResponse(response,{key,model,signal:watchdog.signal,normalized:!direct,onActivity:watchdog.activity,onProgress(progress){receipt=progress.receipt;onReceipt(receipt);onProgress(progress);}});
  receipt=value.receipt;onReceipt(receipt);return value.artifact;
 }catch(error){if(error.receipt)receipt=error.receipt;error.receipt=receipt;onReceipt(receipt);if(watchdog.signal.aborted){const e=abortError(watchdog.signal);e.received=!!response;e.httpStatus=response?.status||null;e.receipt=receipt;throw e;}throw error;}
 finally{watchdog.dispose();}
}
