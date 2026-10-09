export const legacyRendererIds=["cursor-spotlight", "custom-cursor", "slide-fade-list", "hover-lift", "scale-fade", "skeleton-shimmer", "progress-fill", "tab-state", "press-feedback", "ripple", "ux-state-comparison", "focus-ring", "ux-disclosure", "ux-error", "ux-empty", "ux-validation"];
export const sceneFamilies={
  "organic-biophilic": "style",
  "glassmorphism": "style",
  "liquid-glass": "style",
  "neumorphism": "style",
  "claymorphism": "style",
  "soft-ui-evolution": "style",
  "dark-mode-oled": "style",
  "minimalism-swiss": "style",
  "swiss-modernism-2": "style",
  "neubrutalism": "style",
  "brutalism": "style",
  "flat-design": "style",
  "exaggerated-minimalism": "style",
  "memphis-design": "style",
  "y2k-aesthetic": "style",
  "vaporwave": "style",
  "aurora-ui": "style",
  "retro-futurism": "style",
  "cyberpunk-ui": "style",
  "vibrant-block": "style",
  "skeuomorphism": "style",
  "hyperrealism-3d": "style",
  "bento-box-grid": "layout",
  "grid-layout": "layout",
  "dimensional-layering": "layout",
  "visual-hierarchy": "layout",
  "whitespace": "layout",
  "hero-centric": "landing",
  "minimal-direct": "landing",
  "conversion-optimized": "landing",
  "social-proof": "landing",
  "interactive-demo": "landing",
  "feature-showcase": "landing",
  "trust-authority": "landing",
  "storytelling-driven": "landing",
  "executive-dashboard": "dashboard",
  "data-dense-dashboard": "dashboard",
  "real-time-monitoring": "dashboard",
  "comparative-dashboard": "dashboard",
  "predictive-analytics": "dashboard",
  "drill-down-analytics": "dashboard",
  "user-behavior-analytics": "dashboard",
  "financial-dashboard": "dashboard",
  "sales-intelligence": "dashboard",
  "heatmap-style": "dashboard",
  "affordance": "principle",
  "contrast": "principle",
  "recognition-over-recall": "principle",
  "information-architecture": "principle",
  "reduced-motion": "principle",
  "accessible-ethical": "principle",
  "inclusive-design": "principle",
  "ai-native-ui": "principle",
  "zero-interface": "principle",
  "easing": "motion",
  "micro-interactions": "motion",
  "motion-driven": "motion",
  "kinetic-typography": "motion",
  "parallax-storytelling": "motion"
};
export const rendererIds=[...legacyRendererIds,...Object.keys(sceneFamilies)];
export function assertPreviewCoverage(items,registry){
 const known=new Set(rendererIds);
 for(const item of items){
  const id=item.preview?.template_id;
  if(!id||!known.has(id)||!registry.templates[id])throw new Error('Public entry requires an implemented preview: '+item.id);
  if(sceneFamilies[id]&&id!==item.id)throw new Error('Dedicated scene must match its entry: '+item.id);
 }
 for(const id of rendererIds)if(!registry.templates[id])throw new Error('Renderer has no parameter contract: '+id);
}
