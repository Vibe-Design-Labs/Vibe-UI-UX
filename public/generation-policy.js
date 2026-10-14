export const generationLimits={initial_ms:150000,idle_ms:120000,total_ms:600000,max_tokens:16000};
export function generationRequest(model){return {stream:true,max_tokens:generationLimits.max_tokens,...(model==='kimi-k3'?{reasoning_effort:'high',response_format:{type:'json_object'}}:{})};}
