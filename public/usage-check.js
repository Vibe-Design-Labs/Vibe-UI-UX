import {validKey,boundedJSON,gatewayError} from './tokendance.js';
import {modelReceipt,transportReceipt} from './model-audit.js';
import {modelError,abortError} from './model-response.js';
const usageEndpoint='https://tokendance.space/portal/api/v1/usage?window=24h&limit=20';
const safeLabel=(value,key)=>typeof value==='string'&&value.length<=80&&/^[\p{L}\p{N} .:()/_-]+$/u.test(value)&&!(key&&value.includes(key))&&!/(?:github_pat_|gh[pousr]_|sk-)[A-Za-z0-9_-]{16,}/.test(value)?value:null;
export function usageSummary(value,key){
 if(!Array.isArray(value?.items)||value.items.length>20)throw modelError('schema',{received:true,status:200});
 return {window:'24h',limit:20,returned:value.items.length,pageMayBeIncomplete:value.items.length===20,records:value.items.map(item=>{
  if(!item||typeof item!=='object'||Array.isArray(item))throw modelError('schema',{received:true,status:200});
  const ids=modelReceipt(item.model_id,{reportedModel:item.model_slug,requestId:item.trace_id,responseId:item.id},key),date=typeof item.created_at==='string'&&/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(item.created_at)?Date.parse(item.created_at):NaN;
  return {createdAt:Number.isFinite(date)?new Date(date).toISOString():null,modelSlug:ids.reportedModel,modelId:ids.requestedModel,providerName:safeLabel(item.provider_name,key),traceId:ids.requestId,recordId:ids.responseId,streaming:typeof item.streaming==='boolean'?item.streaming:null,errorFieldPresent:Object.hasOwn(item,'error')};
 })};
}
export async function requestUsageCheck({key,mode,signal},upstream=fetch){
 if(!validKey(key)||!['direct','relay'].includes(mode))throw modelError('input');
 if(signal?.aborted)throw abortError(signal);
 const direct=mode==='direct',endpoint=direct?usageEndpoint:new URL('./api/usage',import.meta.url).href;
 let response;try{response=await upstream(endpoint,{method:'GET',headers:direct?{Authorization:'Bearer '+key}:{'X-TokenDance-Key':key},signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store'});}catch{throw signal?.aborted?abortError(signal):modelError('network');}
 if(!response.ok){await response.body?.cancel().catch(()=>{});const error=gatewayError(response);throw modelError(error.message,{received:true,status:response.status});}
 let value;try{value=await boundedJSON(response,64000);}catch{throw signal?.aborted?abortError(signal):modelError('response-json',{received:true,status:response.status});}
 if(JSON.stringify(value).includes(key))throw modelError('unsafe',{received:true,status:response.status});
 const summary=direct?usageSummary(value,key):value;
 if(!direct){if(summary?.schema!=='intentkit.usage-check'||summary.window!=='24h'||summary.limit!==20||!Array.isArray(summary.records)||summary.records.length>20)throw modelError('schema',{received:true,status:response.status});
  if(summary.records.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw modelError('schema',{received:true,status:response.status});
  const sanitized=usageSummary({items:summary.records.map(row=>({created_at:row.createdAt,model_slug:row.modelSlug,model_id:row.modelId,provider_name:row.providerName,trace_id:row.traceId,id:row.recordId,streaming:row.streaming,...(row.errorFieldPresent?{error:true}:{})}))},key);return {schema:'intentkit.usage-check',generationRequested:false,...sanitized,transport:transportReceipt(mode,endpoint,response,key)};
 }
 return {schema:'intentkit.usage-check',generationRequested:false,...summary,transport:transportReceipt(mode,endpoint,response,key)};
}
