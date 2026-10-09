# UI/UX 内容扩充 · 2026-10-07

本记录描述 2026-10-07 完成的本地版本 `0.4.1.1.0`（兼容 `0.5.1`）。该批内容现纳入 `0.4.1.1.1` 发布；历史来源范围与草稿状态保持不变。0.4.1.2.0 已为这批词条补齐专属预览，见 [场景说明](PREVIEW_SCENES.md)；下文的 preview:null 是当时的历史交付记录。当前使用说明见 [README](../README.md)，发布检查见 [记录](RELEASE_0.4.1.1.1.md)。

## 交付范围

依用户开工包清单增量新增 50 个 JSON，总数 75。全部 `kind:term`、`status:draft`、`preview:null`，中英语言均 `review_status:draft`。日文、韩文、德文正文继续采用既有的显式英文回退；界面五语控件保持原状。

原有 25 个词条、16 个模板、5 个编译配方与现有 public JavaScript 保留。本次没有新增特定风格预览、命令面板、code_symbols 字段或编译能力。下载源码包与字体子集使用现有脚本更新。

## 与开工包的差异

- 基于当前本地版本向前迭代，保留尚未提交的 Design Compiler；没有使用包中旧的 0.4.0.2.0 编号覆盖它。
- `micro-interactions` 关联去除模板名 ripple，只引用 click-ripple、press-feedback、hover-lift。
- `motion-driven` 关联去除模板名 slide-fade-list，只引用 staggered-reveal、scale-fade。
- 同批关联 soft-ui-evolution、glassmorphism、accessible-ethical、minimalism-swiss 均指向真实的新词条。
- 标签中包含审美、布局、任务组织、数据分析与设计原则，不把所有条目冒充统一规范的“50种视觉风格”。Soft UI Evolution、Swiss Modernism 2.0 等描述性名称明确为工作标签。

## 来源和审校边界

微信文章 `https://mp.weixin.qq.com/s/tZ6oXI5xOsinbTV4vWMVQw` 的正文未能读取；读取工具仅返回“无法提取文章内容”。词条名单来自用户附件，释义、适用/避免条件与操作描述由本项目原创编写，不声称引述或完整阅读该文章。

每条内容保留原创来源和开工包给出的待核实外部链接；能核实的概念补充以下一手参考。实际查阅范围为公开检索摘要，没有声称完整阅读所有参考正文；引用只支持记录中注明的概念范围，不代表复制许可或整条内容已经审校。外部 license:unknown、reuse_permission:pending，中英正文保持 draft。

- [栅格对齐与响应式组织的概念参考，不作为组合风格标签的定义依据。](https://designsystem.digital.gov/utilities/layout-grid/)
- [玻璃拟态与可读性限制的概念参考。](https://www.nngroup.com/articles/glassmorphism/)
- [新粗野主义的视觉特征与可读性限制参考。](https://www.nngroup.com/articles/neobrutalism/)
- [扁平界面的交互可识别性参考。](https://www.nngroup.com/articles/flat-design-best-practices/)
- [深浅主题与可读性原则参考；不是 OLED 功耗保证依据。](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [首屏层级与理解产品价值的设计参考；不构成转化效果保证。](https://www.nngroup.com/articles/first-impressions-human-automaticity/)
- [网站可信度与信息透明性参考。](https://www.nngroup.com/articles/trustworthy-design/)
- [社会证明与真实使用证据的概念参考。](https://www.nngroup.com/articles/social-proof-ux/)
- [看板布局与联动原则参考；并非该业务功能已经实现的证明。](https://www.carbondesignsystem.com/building-blocks/data-visualization/dashboards)
- [热力图色阶编码的概念参考。](https://charts.carbondesignsystem.com/heatmap)
- [孟菲斯设计与几何图形背景参考；UI 应用建议为本项目原创。](https://www.vam.ac.uk/info/collection-selection-boxes-postmodern-design)
- [网页粗野主义与反设计的区别参考。](https://www.nngroup.com/articles/brutalism-antidesign/)
- [Apple Liquid Glass 原生材质定义参考，区分网页视觉近似。](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)
- [人机理解、校验与信任边界参考，不将工作标签当作统一视觉体系。](https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/)
- [触发与针对性反馈组成微交互的概念参考。](https://www.nngroup.com/articles/microinteractions/)
- [减少动态效果处理的技术参考；不将其作为各审美标签的命名依据。](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [可访问性原则参考；伦理与透明选择的操作建议为本项目原创。](https://www.w3.org/WAI/fundamentals/accessibility-principles/)
- [包容性设计与减少排斥的概念参考。](https://inclusive.microsoft.design/)

## 新增 50 个文件

| # | 文件 | 中文名 | 英文名 | 范围 |
| --- | --- | --- | --- | --- |
| 1 | [bento-box-grid.json](../content/items/bento-box-grid.json) | 便当盒网格 | Bento Box Grid | ui / layout |
| 2 | [minimalism-swiss.json](../content/items/minimalism-swiss.json) | 极简与瑞士风格 | Minimalism & Swiss Style | ui / style |
| 3 | [glassmorphism.json](../content/items/glassmorphism.json) | 玻璃拟态 | Glassmorphism | ui / style |
| 4 | [neubrutalism.json](../content/items/neubrutalism.json) | 新粗野主义 | Neubrutalism | ui / style |
| 5 | [exaggerated-minimalism.json](../content/items/exaggerated-minimalism.json) | 夸张极简主义 | Exaggerated Minimalism | ui / style |
| 6 | [flat-design.json](../content/items/flat-design.json) | 扁平化设计 | Flat Design | ui / style |
| 7 | [dimensional-layering.json](../content/items/dimensional-layering.json) | 维度分层 | Dimensional Layering | ui / layout |
| 8 | [soft-ui-evolution.json](../content/items/soft-ui-evolution.json) | 柔和 UI 进化版 | Soft UI Evolution | ui / style |
| 9 | [dark-mode-oled.json](../content/items/dark-mode-oled.json) | OLED 深色模式 | Dark Mode OLED | ui / style |
| 10 | [hero-centric.json](../content/items/hero-centric.json) | Hero 核心型 | Hero-Centric Design | ui / landing |
| 11 | [minimal-direct.json](../content/items/minimal-direct.json) | 极简直给型 | Minimal & Direct | ui / landing |
| 12 | [conversion-optimized.json](../content/items/conversion-optimized.json) | 转化优化型 | Conversion-Optimized | ux / landing |
| 13 | [social-proof.json](../content/items/social-proof.json) | 社会证明型 | Social Proof-Focused | ux / landing |
| 14 | [interactive-demo.json](../content/items/interactive-demo.json) | 交互演示型 | Interactive Product Demo | ux / landing |
| 15 | [feature-showcase.json](../content/items/feature-showcase.json) | 功能展示型 | Feature-Rich Showcase | ux / landing |
| 16 | [trust-authority.json](../content/items/trust-authority.json) | 信任权威型 | Trust & Authority | ux / landing |
| 17 | [storytelling-driven.json](../content/items/storytelling-driven.json) | 故事叙事型 | Storytelling-Driven | ux / landing |
| 18 | [executive-dashboard.json](../content/items/executive-dashboard.json) | 高管驾驶舱 | Executive Dashboard | ux / dashboard |
| 19 | [data-dense-dashboard.json](../content/items/data-dense-dashboard.json) | 高密度数据看板 | Data-Dense Dashboard | ux / dashboard |
| 20 | [real-time-monitoring.json](../content/items/real-time-monitoring.json) | 实时监控 | Real-Time Monitoring | ux / dashboard |
| 21 | [comparative-dashboard.json](../content/items/comparative-dashboard.json) | 对比分析看板 | Comparative Analysis Dashboard | ux / dashboard |
| 22 | [predictive-analytics.json](../content/items/predictive-analytics.json) | 预测分析 | Predictive Analytics | ux / dashboard |
| 23 | [drill-down-analytics.json](../content/items/drill-down-analytics.json) | 下钻分析 | Drill-Down Analytics | ux / dashboard |
| 24 | [user-behavior-analytics.json](../content/items/user-behavior-analytics.json) | 用户行为分析 | User Behavior Analytics | ux / dashboard |
| 25 | [financial-dashboard.json](../content/items/financial-dashboard.json) | 财务看板 | Financial Dashboard | ux / dashboard |
| 26 | [sales-intelligence.json](../content/items/sales-intelligence.json) | 销售智能看板 | Sales Intelligence Dashboard | ux / dashboard |
| 27 | [heatmap-style.json](../content/items/heatmap-style.json) | 热力图风格 | Heat Map & Heatmap Style | ui / visualization |
| 28 | [organic-biophilic.json](../content/items/organic-biophilic.json) | 有机亲自然 | Organic Biophilic | ui / style |
| 29 | [memphis-design.json](../content/items/memphis-design.json) | 孟菲斯设计 | Memphis Design | ui / style |
| 30 | [y2k-aesthetic.json](../content/items/y2k-aesthetic.json) | Y2K 美学 | Y2K Aesthetic | ui / style |
| 31 | [vaporwave.json](../content/items/vaporwave.json) | 蒸汽波 | Vaporwave | ui / style |
| 32 | [aurora-ui.json](../content/items/aurora-ui.json) | 极光 UI | Aurora UI | ui / style |
| 33 | [retro-futurism.json](../content/items/retro-futurism.json) | 复古未来主义 | Retro-Futurism | ui / style |
| 34 | [cyberpunk-ui.json](../content/items/cyberpunk-ui.json) | 赛博朋克 UI | Cyberpunk UI | ui / style |
| 35 | [vibrant-block.json](../content/items/vibrant-block.json) | 高饱和色块 | Vibrant & Block-based | ui / style |
| 36 | [brutalism.json](../content/items/brutalism.json) | 粗野主义 | Brutalism | ui / style |
| 37 | [skeuomorphism.json](../content/items/skeuomorphism.json) | 拟物化 | Skeuomorphism | ui / style |
| 38 | [claymorphism.json](../content/items/claymorphism.json) | 黏土拟态 | Claymorphism | ui / style |
| 39 | [neumorphism.json](../content/items/neumorphism.json) | 新拟态 | Neumorphism | ui / style |
| 40 | [liquid-glass.json](../content/items/liquid-glass.json) | 液态玻璃 | Liquid Glass | ui / style |
| 41 | [ai-native-ui.json](../content/items/ai-native-ui.json) | AI 原生 UI | AI-Native UI | ui / pattern |
| 42 | [zero-interface.json](../content/items/zero-interface.json) | 零界面 | Zero Interface | ui / pattern |
| 43 | [micro-interactions.json](../content/items/micro-interactions.json) | 微交互 | Micro-interactions | ui / motion |
| 44 | [motion-driven.json](../content/items/motion-driven.json) | 动效驱动 | Motion-Driven | ui / motion |
| 45 | [kinetic-typography.json](../content/items/kinetic-typography.json) | 动态字体 | Kinetic Typography | ui / motion |
| 46 | [parallax-storytelling.json](../content/items/parallax-storytelling.json) | 视差叙事 | Parallax Storytelling | ui / motion |
| 47 | [hyperrealism-3d.json](../content/items/hyperrealism-3d.json) | 3D 与超写实 | 3D & Hyperrealism | ui / style |
| 48 | [accessible-ethical.json](../content/items/accessible-ethical.json) | 无障碍与伦理设计 | Accessible & Ethical | ux / principle |
| 49 | [inclusive-design.json](../content/items/inclusive-design.json) | 包容性设计 | Inclusive Design | ux / principle |
| 50 | [swiss-modernism-2.json](../content/items/swiss-modernism-2.json) | 瑞士现代主义 2.0 | Swiss Modernism 2.0 | ui / style |

## 预览后续项

开工包标为 D 档的六项：glassmorphism、heatmap-style、aurora-ui、liquid-glass、kinetic-typography、parallax-storytelling。本轮均只增加术语与实现描述，没有新增对应专属效果。要扩展演示，需另按维护契约增加实际模板；网页玻璃近似不自动等同于 Apple 原生 Liquid Glass。

## 本地检查

内容结构检查已通过：75 个词条、0 错误、375 项草稿待审校/缺失语言回退提示。提示是当前真实状态，不通过修改 reviewed 来清除。42 项原有测试、静态构建与浏览器验证全部通过，详见 [验证报告](CONTENT_EXPANSION_VALIDATION_2026-10-07.md)。

本地编辑、验证、字体子集、示例、描述复制和导出不调用 TokenDance。未使用付费密钥或执行真实模型请求。
