import {modelReceipt} from './model-audit.js';
import {parseModelResponse,modelError,abortError} from './model-response.js';
import {validateSuggestions} from './core.js';
import {compilerPrompt,validateModelIntent} from './compiler-core.js';
import {tokenDanceEndpoint, officialAppURL, validKey, validModel, boundedJSON, gatewayError, recoveryAction, suggestionBody} from './tokendance.js';
export {tokenDanceEndpoint};
export async function requestCompilerIntent({items,catalog,data,intent,model,locale,key,mode,signal,appURL=officialAppURL,onAudit=()=>{}},upstream=fetch){
 if(!['direct','relay'].includes(mode)||!['zh-CN','en','ja','ko','de'].includes(locale)||typeof intent!=='string'||!intent.trim()||intent.length>2000||!validModel(model)||!validKey(key))throw modelError('input');
 const headers={'Content-Type':'application/json'};let endpoint,body;
 if(mode==='direct'){endpoint=tokenDanceEndpoint;headers.Authorization='Bearer '+key;headers['X-App-URL']=appURL;body=compilerPrompt(items,data,{intent,model,locale});}
 else {endpoint=new URL('./api/translate',import.meta.url).href;headers['X-TokenDance-Key']=key;body={intent,model,locale,task:'compile'};}
 let response;try{response=await upstream(endpoint,{method:'POST',headers,body:JSON.stringify(body),signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store'});}catch{throw signal?.aborted?abortError(signal):modelError('network');}
 try{return await parseModelResponse(response,key,value=>validateModelIntent(value,catalog,data,intent),{relay:mode==='relay',expectedModel:model,onAudit});}catch(error){if(signal?.aborted){const e=abortError(signal);e.received=true;e.httpStatus=response.status;throw e;}throw error;}
}
const locales = ['zh-CN', 'en', 'ja', 'ko', 'de'];

export async function requestSuggestions({items, intent, model, locale, key, mode, signal, appURL = officialAppURL,onAudit=()=>{}}, upstream = fetch) {
  if (!['direct', 'relay'].includes(mode) || !locales.includes(locale) ||
      typeof intent !== 'string' || !intent.trim() || intent.length > 2000 ||
      !validModel(model) || !validKey(key)) throw new Error('input');
  const headers = {'Content-Type': 'application/json'};
  let body, endpoint;
  if (mode === 'direct') {
    endpoint = tokenDanceEndpoint;
    headers.Authorization = 'Bearer ' + key;
    headers['X-App-URL'] = appURL;
    body = suggestionBody(items, {intent, model, locale});
  } else {
    endpoint = new URL('./api/translate', import.meta.url).href;
    headers['X-TokenDance-Key'] = key;
    body = {intent, model, locale};
  }
  let response;
  try {
    response = await upstream(endpoint, {method: 'POST', headers, body: JSON.stringify(body), signal,
      credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store'});
  } catch { throw new Error('network'); }
  // Never expose gateway error bodies; they can echo headers or credentials.
  if (!response.ok) {
    if (mode === 'direct') throw gatewayError(response);
    let error;
    try { error = await boundedJSON(response, 8000); } catch { throw new Error('network'); }
    const sanitized = new Error(['auth', 'limit', 'model', 'format', 'input', 'network','model-mismatch'].includes(error?.error) ? error.error : 'network');
    sanitized.recovery = recoveryAction(error?.recovery);if(error?.error==='model-mismatch'){sanitized.code='model-mismatch';sanitized.receipt=modelReceipt(model,error.receipt,key);onAudit(sanitized.receipt);}
    throw sanitized;
  }
  return parseModelResponse(response,key,result=>validateSuggestions(result,items),{relay:mode==='relay',expectedModel:model,onAudit});
}
