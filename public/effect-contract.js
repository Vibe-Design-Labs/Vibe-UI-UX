import {effectiveParams,makeBrief} from './core.js';

// Only real, shared implementations can be exported. Never substitute a placeholder.
export const componentTemplates=Object.freeze(['cursor-spotlight','hover-lift','press-feedback','ripple','slide-fade-list']);
export const componentTargets=Object.freeze(['web','react','video']);
export const canExportComponent=item=>componentTemplates.includes(item?.preview?.template_id);

export function componentSpec(item,registry,overrides={},locale='en',labels={}){
 if(!canExportComponent(item))throw new Error('Component implementation unavailable');
 return {schema:'intentkit.component',schema_version:1,item_id:item.id,canonical_name:item.canonical_name,
  requested_locale:locale,content_locale:item.locales[locale]?locale:'en',template_id:item.preview.template_id,
  params:effectiveParams(item,registry,overrides),contract:structuredClone(registry.templates[item.preview.template_id]),
  brief:makeBrief(item,registry,locale,overrides),brief_template:(item.locales[locale]||item.locales.en).prompt_template,sources:item.sources.filter(s=>s.url).map(s=>s.url),labels:{...labels}};
}

export function validateComponentSpec(spec,overrides={}){
 if(!spec||spec.schema!=='intentkit.component'||spec.schema_version!==1||!componentTemplates.includes(spec.template_id))throw new Error('Invalid component specification');
 if(!spec.contract?.params||!spec.params||typeof spec.params!=='object'||Array.isArray(spec.params))throw new Error('Missing component contract');
 const registry={templates:{[spec.template_id]:spec.contract}};
 const params=effectiveParams({preview:{template_id:spec.template_id,params:{}}},registry,{...spec.params,...overrides});
 const brief=typeof spec.brief_template==='string'?spec.brief_template.replace(/\{([a-z_]+)\}/g,(_,key)=>{if(!(key in params))throw new Error('Unresolved description parameter');return String(params[key]);}):spec.brief;
 return {...spec,params,brief};
}
