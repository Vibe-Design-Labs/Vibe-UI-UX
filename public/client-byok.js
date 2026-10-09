import {validateSuggestions} from './core.js';
import {compilerPrompt,validateModelIntent} from './compiler-core.js';
import {tokenDanceEndpoint, officialAppURL, validKey, validModel, boundedJSON, gatewayError, recoveryAction, suggestionBody} from './tokendance.js';
export {tokenDanceEndpoint};
export async function requestCompilerIntent({items,catalog,data,intent,model,locale,key,mode,signal,appURL=officialAppURL},upstream=fetch){
 if(!['direct','relay'].includes(mode)||!['zh-CN','en','ja','ko','de'].includes(locale)||typeof intent!=='string'||!intent.trim()||intent.length>2000||!validModel(model)||!validKey(key))throw new Error('input');
 const headers={'Content-Type':'application/json'};let endpoint,body;
 if(mode==='direct'){endpoint=tokenDanceEndpoint;headers.Authorization='Bearer '+key;headers['X-App-URL']=appURL;body=compilerPrompt(items,data,{intent,model,locale});}
 else {endpoint=new URL('./api/translate',import.meta.url).href;headers['X-TokenDance-Key']=key;body={intent,model,locale,task:'compile'};}
 let response;try{response=await upstream(endpoint,{method:'POST',headers,body:JSON.stringify(body),signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store'});}catch{throw new Error('network');}
 if(!response.ok){if(mode==='direct')throw gatewayError(response);let value;try{value=await boundedJSON(response,8000);}catch{throw new Error('network');}const error=new Error(['auth','limit','model','format','input','network'].includes(value?.error)?value.error:'network');error.recovery=recoveryAction(value?.recovery);throw error;}
 let result=await boundedJSON(response);
 if(mode==='direct'){let content=result.choices?.[0]?.message?.content;if(typeof content!=='string'||content.length>10000||content.includes(key))throw new Error('format');try{result=JSON.parse(content.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{throw new Error('format');}}
 if(JSON.stringify(result).includes(key))throw new Error('format');
 try{return validateModelIntent(result,catalog,data,intent);}catch{throw new Error('format');}
}
const locales = ['zh-CN', 'en', 'ja', 'ko', 'de'];

export async function requestSuggestions({items, intent, model, locale, key, mode, signal, appURL = officialAppURL}, upstream = fetch) {
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
    const sanitized = new Error(['auth', 'limit', 'model', 'format', 'input', 'network'].includes(error?.error) ? error.error : 'network');
    sanitized.recovery = recoveryAction(error?.recovery);
    throw sanitized;
  }
  const value = await boundedJSON(response);
  let result = value;
  if (mode === 'direct') {
    let text = value.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.length > 10000 || text.includes(key)) throw new Error('format');
    text = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    try { result = JSON.parse(text); } catch { throw new Error('format'); }
  }
  if (JSON.stringify(result).includes(key)) throw new Error('format');
  try { return validateSuggestions(result, items); } catch { throw new Error('format'); }
}
