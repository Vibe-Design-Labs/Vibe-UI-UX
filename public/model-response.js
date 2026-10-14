import {envelopeReceipt,headerReceipt,modelReceipt} from './model-audit.js';
import {boundedJSON,gatewayError,recoveryAction} from './tokendance.js';
export const diagnosticCodes=['network','timeout','cancelled','auth','limit','model','input','response-json','empty','truncated','json','schema','unsafe','runtime','model-mismatch','stream-interrupted'];
export function modelError(code,{received=false,status=null,recovery=null}={}){
 const error=new Error(['response-json','empty','truncated','json','schema','unsafe','runtime'].includes(code)?'format':code);
 error.code=diagnosticCodes.includes(code)?code:'network';error.received=received===true;
 error.httpStatus=Number.isInteger(status)&&status>=100&&status<=599?status:null;error.recovery=recoveryAction(recovery);return error;
}
export function diagnostic(error){return {code:diagnosticCodes.includes(error?.code)?error.code:'network',received:error?.received===true,status:Number.isInteger(error?.httpStatus)?error.httpStatus:null};}
export function abortError(signal){return modelError(signal?.reason?.name==='TimeoutError'?'timeout':'cancelled');}
export async function parseModelResponse(response,key,validate,{relay=false,limit=180000,expectedModel,onAudit=()=>{}}={}){
 const receipt={received:true,status:response.status};let audit=headerReceipt(expectedModel,response,key);
 const rejectMismatch=()=>{onAudit(audit);if(audit.modelStatus==='mismatch'){const e=modelError('model-mismatch',receipt);e.receipt=audit;throw e;}};
 if(!response.ok){
  if(!relay){const error=gatewayError(response);throw modelError(error.message,{...receipt,recovery:error.recovery});}
  let value;try{value=await boundedJSON(response,8000);}catch{throw modelError('response-json',receipt);}
  const d=value?.diagnostic;const e=modelError(diagnosticCodes.includes(d?.code)?d.code:diagnosticCodes.includes(value?.error)?value.error:'network',{received:d?.received===true,status:d?.status??response.status,recovery:value?.recovery});e.receipt=modelReceipt(expectedModel,value?.receipt||{},key);onAudit(e.receipt);throw e;
 }
 let value;try{value=await boundedJSON(response,limit);}catch{throw modelError('response-json',receipt);}
 if(!relay){
  audit=envelopeReceipt(expectedModel,value,response,key);rejectMismatch();
  const choice=value?.choices?.[0];
  if(choice?.finish_reason==='length'||choice?.finish_reason==='max_tokens')throw modelError('truncated',receipt);
  const content=choice?.message?.content;
  if(typeof content!=='string'||!content.trim())throw modelError('empty',receipt);
  if(content.includes(key))throw modelError('unsafe',receipt);
  try{value=JSON.parse(content.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{throw modelError('json',receipt);}
 }
 if(relay)rejectMismatch();
 if(JSON.stringify(value).includes(key))throw modelError('unsafe',receipt);
 try{return validate(value);}catch{throw modelError('schema',receipt);}
}
