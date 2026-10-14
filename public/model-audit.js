const modelPattern=/^[A-Za-z0-9._:/-]{1,120}$/;
const idPattern=/^[A-Za-z0-9._:/-]{1,180}$/;
const secretPattern=/(?:github_pat_|gh[pousr]_|sk-)[A-Za-z0-9_-]{16,}/;
const safe=(value,pattern,key)=>typeof value==='string'&&pattern.test(value)&&!secretPattern.test(value)&&!(key&&value.includes(key))?value:null;
export function modelReceipt(requestedModel,value={},key='',platformModels=[]){
 const requested=safe(requestedModel,modelPattern,key),reported=safe(value.reportedModel,modelPattern,key);
 const recognized=!!reported&&(reported===requested||Array.isArray(platformModels)&&platformModels.includes(reported));
 return {requestedModel:requested,reportedModel:reported,platformModelRecognized:recognized,modelStatus:reported&&requested?(reported===requested?'matching':recognized?'mismatch':'unconfirmed'):'unknown',requestId:safe(value.requestId,idPattern,key),responseId:safe(value.responseId,idPattern,key),httpStatus:Number.isInteger(value.httpStatus)&&value.httpStatus>=100&&value.httpStatus<=599?value.httpStatus:null,finishReason:['stop','length','max_tokens','tool_calls','content_filter'].includes(value.finishReason)?value.finishReason:null};
}
export function envelopeReceipt(requestedModel,envelope,response,key,previous={},platformModels=[]){
 return modelReceipt(requestedModel,{...previous,reportedModel:envelope?.model??previous.reportedModel,requestId:response.headers.get('X-TokenDance-Request-Id')||response.headers.get('X-Request-Id')||previous.requestId,responseId:envelope?.id??previous.responseId,httpStatus:response.status,finishReason:envelope?.choices?.[0]?.finish_reason??previous.finishReason},key,platformModels);
}
export function receiptHeaders(receipt){const headers={};for(const [field,header]of Object.entries({requestedModel:'X-IntentKit-Requested-Model',reportedModel:'X-IntentKit-Reported-Model',requestId:'X-IntentKit-Request-Id',responseId:'X-IntentKit-Response-Id'}))if(receipt?.[field])headers[header]=receipt[field];return headers;}
export function headerReceipt(requestedModel,response,key,platformModels=[]){return modelReceipt(requestedModel,{reportedModel:response.headers.get('X-IntentKit-Reported-Model'),requestId:response.headers.get('X-IntentKit-Request-Id'),responseId:response.headers.get('X-IntentKit-Response-Id'),httpStatus:response.status},key,platformModels);}
function safeURL(value,key){
 if(typeof value!=='string'||value.length>2048)return null;
 try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return null;const clean=url.origin+url.pathname,decoded=decodeURIComponent(clean);return secretPattern.test(decoded)||key&&decoded.includes(key)?null:clean;}catch{return null;}
}
export function transportReceipt(mode,endpoint,response,key=''){
 const format=response?.headers?.get('Content-Type')?.split(';')[0].trim().toLowerCase();
 return {mode:['direct','relay'].includes(mode)?mode:null,requestURL:safeURL(endpoint,key),responseURL:safeURL(response?.url,key),responseType:['basic','cors','default','error','opaque','opaqueredirect'].includes(response?.type)?response.type:null,responseFormat:response?['text/event-stream','application/json','text/html'].includes(format)?format:'other':null};
}
