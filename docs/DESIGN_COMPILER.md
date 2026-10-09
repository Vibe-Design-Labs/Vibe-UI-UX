# Design Compiler · 0.4.1.1.1

本功能由 0.4.1.0.0 本地迭代纳入 0.4.1.1.1 发布。使用流程见 [README](../README.md)，发布验证见 [检查记录](RELEASE_0.4.1.1.1.md)。

工作台增加「理解并生成方案」，流程为：日常表达 → Design IR → 受控配方 → 现有预览 → 最终设计描述 / Agent 描述 / 方案 JSON。原有查术语、查找效果、单效果调参和 JSON 导出继续使用原流程。

## 本地体验

运行 `npm run dev`，打开 `http://localhost:4173/studio.html`。点任意一个「本地试试」示例，查看可修改的意图理解、实际效果和编程助手描述。示例、修改理解、调参、复制、导出都不调用模型。

| 日常表达 | 词条 / 模板 | 默认参数 |
| --- | --- | --- |
| 卡片鼠标放上去轻轻浮起来，不要太夸张 | hover-lift / hover-lift | 3px，180ms |
| 鼠标经过卡片有一点暖光，还稍微浮起来 | cursor-spotlight / cursor-spotlight | 3px，180ms，暖色 #EBCB8B，透明度 0.12，半径 160px，跟随 80ms |
| 按钮按下去要有确认感，但是不要弹 | press-feedback / press-feedback | scale 0.97，120ms，ease-out |
| 内容出现的时候一个接一个进来 | staggered-reveal / slide-fade-list | 360ms，间隔 70ms，16px，ease-out |
| 点一下以后像水波一样扩散 | click-ripple / ripple | 500ms |

这些数值是本项目配方选择。IR 保留未指定字段；默认值与推断单独展示，不伪装成用户说出的精确参数。「确认感」没有唯一效果，本版使用已有按压模板作为可检查的方案。

## 结构和约束

- `compiler/schema.json`：Design IR、Recipe、Implementation、CompilationResult、ModelIntent 的闭合结构；禁止未定义字段。
- `compiler/lexicon.json`：五语常用表达的本地匹配与否定处理，覆盖五个配方家族及常见变体，并非通用自然语言理解。
- `compiler/recipes/*.json`、`implementations.json`：可维护配方及实际可用的原生 Web 实现。
- `public/compiler-core.js`：IR 解析、兼容配方筛选、注册表参数校验、冲突检查与描述生成。
- `public/compiler-ui.js`：理解编辑、真实预览联动和独立编译导出；`compiler-ui-strings.js` 与 `compiler/strings.json` 维护五语文案。
- 构建生成 `compiler.json` 与 Worker 数据，静态 Pages 路径保持相对引用。

当前是单配方、单模板。暖光加抬升由现有聚光模板承载，其他跨模板组合尚未实现。弹簧、可调阴影和原句里的精确数值不会被默默声明为已实现：页面和导出列出未覆盖项。完全无法匹配时明确保留之前的独立预览，并不声称它对应当前输入。

滑块更新同一组最终参数、单效果描述、Recipe、Agent 描述与 JSON。若调整违反「不要」等约束或明显偏离小幅/轻微/快速/缓慢的偏好，编译复制与导出暂时禁用，直到确认当前参数；再次修改撤销确认。重置恢复配方默认值。

项目冲突阈值：轻微/小幅时，抬升 >5px、入场距离绝对值 >20px、按压 scale <0.94 或聚光透明度 >0.2 会提示；大幅移动约束使用 >8px、>24px、scale <0.9；快速/缓慢使用 240ms/400ms 分界。这是本项目判断规则，不是 UX 标准或测量结果。

单效果导出仍为 `schema_version:1`。编译导出额外包含 `schema:"intentkit.compilation"`、原始表达、IR、Recipe、实现建议、默认与推断、未覆盖项、冲突和确认状态；两者是不同用途的文件。

## 可选 AI

连接 TokenDance 后，点击「理解并生成方案」调用模型解析 IR 和已知候选 ID。模型不给出 HTML/JS、不决定未经校验的最终参数。直接模式和本地 Worker 采用相同提示词与校验，检查证据片段是否存在于用户输入；失败后回退本地规则，不自动重试付费调用。密钥仍只留在页面内存。

「查找效果」保留原来的 AI 候选流程。五个本地示例即使已连接密钥也不会调用模型。未使用真实密钥验证授权后的付费生成，本轮使用模拟模型响应验证流程。

## 更新

可以把仓库和 [现有维护 skill](../skills/ui-ux-content-maintainer/SKILL.md) 交给其他 AI，更新操作见 [配方维护](../skills/ui-ux-content-maintainer/references/compiler-recipes.md)。检查、字体子集及打包脚本均为本地工作，无需 GPT API 额度；其他 AI 自身的收费另计。
