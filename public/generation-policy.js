// Output budgets are owned by the selected provider; never impose a token cap.
export const generationLimits={initial_ms:150000,idle_ms:120000};
export function generationRequest(model){return {stream:true,...(model==='kimi-k3'?{reasoning_effort:'high',response_format:{type:'json_object'}}:{})};}
