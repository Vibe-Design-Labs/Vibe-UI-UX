import {generationPrompt,validateArtifact} from './generated-core.js';
import {parseModelResponse,modelError,abortError} from './model-response.js';
import {tokenDanceEndpoint,officialAppURL,validKey,validModel} from './tokendance.js';
export async function requestGeneratedEffect({intent,model,locale,key,mode,signal,appURL=officialAppURL},upstream=fetch){
 if(!['direct','relay'].includes(mode)||!['zh-CN','en','ja','ko','de'].includes(locale)||typeof intent!=='string'||!intent.trim()||intent.length>2000||!validKey(key)||!validModel(model))throw modelError('input');
 const direct=mode==='direct',endpoint=direct?tokenDanceEndpoint:new URL('./api/translate',import.meta.url).href;
 const headers={'Content-Type':'application/json',...(direct?{Authorization:'Bearer '+key,'X-App-URL':appURL}:{'X-TokenDance-Key':key})};
 const body=direct?generationPrompt({intent,model,locale}):{intent,model,locale,task:'generate'};
 let response;try{response=await upstream(endpoint,{method:'POST',headers,body:JSON.stringify(body),signal,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});}catch{throw signal?.aborted?abortError(signal):modelError('network');}
 try{return await parseModelResponse(response,key,validateArtifact,{relay:!direct});}catch(error){if(signal?.aborted){const e=abortError(signal);e.received=true;e.httpStatus=response.status;throw e;}throw error;}
}
