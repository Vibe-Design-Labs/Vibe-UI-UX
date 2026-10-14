import {modelsEndpoint,tokenDanceEndpoint,boundedJSON,compatibleModels} from './tokendance.js';
import {transportReceipt,modelReceipt} from './model-audit.js';

// No key, model, messages, cookies or authorization flow is accepted by this probe.
export async function runConnectionCheck({signal,pageURL,version=null}={},upstream=fetch){
 const report={schema:'intentkit.connection-check',started_at:new Date().toISOString(),pageURL:transportReceipt('direct',pageURL).requestURL,version:typeof version==='string'&&/^\d+(?:\.\d+){4}$/.test(version)?version:null,requiresKey:false,generationRequested:false,checks:[]};
 for(const [test,url,options]of [['public-model-catalog',modelsEndpoint,{method:'GET'}],['unauthenticated-empty-request',tokenDanceEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}]]){
  if(signal?.aborted)break;
  const started=Date.now();let response;
  try{
   response=await upstream(url,{...options,signal,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer'});
   const item={test,...transportReceipt('direct',url,response),httpStatus:response.status,elapsed_ms:Date.now()-started};report.checks.push(item);
   if(test==='public-model-catalog'){
    if(!response.ok){item.outcome='catalog-rejected';await response.body?.cancel();continue;}
    try{const models=compatibleModels(await boundedJSON(response,600000));item.kimiK3Available=models.some(model=>model.id==='kimi-k3');item.compatibleModelCount=models.length;item.outcome='catalog-readable';}catch{item.outcome=signal?.aborted?'cancelled':'catalog-unreadable';}
   }else{
    item.outcome=response.status===401?'authentication-required':response.status===403?'access-denied':response.ok?'unexpected-success':'unexpected-status';
    if(item.responseFormat==='application/json'){
     try{const value=await boundedJSON(response,8000),receipt=modelReceipt(null,{reportedModel:value?.model,responseId:value?.id});item.reportedModel=receipt.reportedModel;item.responseId=receipt.responseId;}catch{item.bodyUnreadable=true;}
    }else await response.body?.cancel();
   }
   item.elapsed_ms=Date.now()-started;
  }catch{report.checks.push({test,...transportReceipt('direct',url,response),httpStatus:response?.status||null,elapsed_ms:Date.now()-started,outcome:signal?.aborted?'cancelled':'network-or-cors'});}
 }
 report.ended_at=new Date().toISOString();report.cancelled=signal?.aborted===true;
 return report;
}
