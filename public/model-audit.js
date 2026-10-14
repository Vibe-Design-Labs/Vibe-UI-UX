const modelPattern=/^[A-Za-z0-9._:/-]{1,120}$/;
const idPattern=/^[A-Za-z0-9._:/-]{1,180}$/;
const secretPattern=/(?:github_pat_|gh[pousr]_|sk-)[A-Za-z0-9_-]{16,}/;
const safe=(value,pattern,key)=>typeof value==='string'&&pattern.test(value)&&!secretPattern.test(value)&&!(key&&value.includes(key))?value:null;
export function modelReceipt(requestedModel,value={},key=''){
 const requested=safe(requestedModel,modelPattern,key),reported=safe(value.reportedModel,modelPattern,key);
 return {requestedModel:requested,reportedModel:reported,modelStatus:reported&&requested?(reported===requested?'matching':'mismatch'):'unknown',requestId:safe(value.requestId,idPattern,key),responseId:safe(value.responseId,idPattern,key),httpStatus:Number.isInteger(value.httpStatus)&&value.httpStatus>=100&&value.httpStatus<=599?value.httpStatus:null,finishReason:['stop','length','max_tokens','tool_calls','content_filter'].includes(value.finishReason)?value.finishReason:null};
}
export function envelopeReceipt(requestedModel,envelope,response,key,previous={}){
 return modelReceipt(requestedModel,{...previous,reportedModel:envelope?.model??previous.reportedModel,requestId:response.headers.get('X-TokenDance-Request-Id')||response.headers.get('X-Request-Id')||previous.requestId,responseId:envelope?.id??previous.responseId,httpStatus:response.status,finishReason:envelope?.choices?.[0]?.finish_reason??previous.finishReason},key);
}
export function receiptHeaders(receipt){const headers={};for(const [field,header]of Object.entries({requestedModel:'X-IntentKit-Requested-Model',reportedModel:'X-IntentKit-Reported-Model',requestId:'X-IntentKit-Request-Id',responseId:'X-IntentKit-Response-Id'}))if(receipt?.[field])headers[header]=receipt[field];return headers;}
export function headerReceipt(requestedModel,response,key){return modelReceipt(requestedModel,{reportedModel:response.headers.get('X-IntentKit-Reported-Model'),requestId:response.headers.get('X-IntentKit-Request-Id'),responseId:response.headers.get('X-IntentKit-Response-Id'),httpStatus:response.status},key);}
