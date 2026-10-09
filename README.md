# IntentKit / 意译

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md)

**把「我想要这种感觉」，变成看得见、调得动、交给编程助手就能说明白的设计方案。**

[打开官网](https://vibe-design-labs.github.io/Vibe-UI-UX/) · [直接试用工作台](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html) · [更新记录](CHANGELOG.md)

**v0.4.1.2.1 · 75 设计词条 · 75 专属预览模板 · 5 本地配方家族 · MIT + OFL**

[![工作台实录：叶片光标、暖金聚光、点击水波与错落入场](docs/media/effects.gif)](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html?item=custom-cursor)

上图录制自项目现有渲染器，没有使用模型生成画面。GIF 只是演示录像；[在线工作台](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html)可以实际交互、调整参数，也会尊重系统的减少动态效果偏好。

## 这是做什么的？

Vibe coding 最难的一步常常是把感觉讲清楚：轻盈到底是抬升、缩放，还是更大的留白？IntentKit 把日常表达与中英文术语、别名、效果示例和具体参数连接起来，帮助设计师、开发者与刚开始使用 AI 编程的人对齐意思。

新版 Design Compiler 的流程是 **日常表达 → 可编辑的意图理解（Design IR）→ 受控配方 → 真实预览 → 设计描述 / Agent 描述 / JSON**。它是可以检查的设计方案工具，目前不生成完整页面或执行模型输出的任意代码。

| 功能 | 当前可以做什么 |
| --- | --- |
| 设计词库 | 搜索 75 个词条的术语、别名与已整理的日常表达，查看释义、适用场景和来源 |
| 效果工作台 | 使用 75 个对应模板，调整注册参数，复制描述、导出 JSON、分享单效果参数链接 |
| Design Compiler | 5 类本地配方：轻微抬升、暖光与抬升、按压反馈、错落入场、点击水波 |
| 自定义鼠标 | 8 种指针形状，可调颜色、大小、跟随与点击反馈；聚光颜色、半径和透明度独立可调 |
| 多语言 | 中、英、日、韩、德界面；本文顶部的链接切换 README 文档语言 |
| 可选 AI | 使用自己的 TokenDance 连接解析设计意图或推荐已知候选效果 |

## 第一次使用：先不用密钥

1. 打开[工作台](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html)，在右上角选择界面语言。
2. 点击「本地试试」中的「轻轻浮起的卡片」，或输入 `卡片鼠标放上去轻轻浮起来，不要太夸张`，点击「理解并生成方案」。没有配置密钥时走本地规则。
3. 查看「意图理解」，展开编辑项修正目标、触发方式与强弱偏好。默认值与推断会单独列出；需要补充的信息不会被装作已确认。
4. 鼠标移入卡片查看效果，再调右侧参数。预览、设计描述和方案使用同一组最终参数。若调整偏离原意，先查看冲突，再明确确认要采用当前参数。
5. 在编译结果区复制 **Agent 描述**，交给你使用的编程助手；或导出**方案 JSON**。右侧原有「导出 JSON」仍用于**单效果 JSON**，两者用途不同。

只想查词？使用左侧搜索框输入 `玻璃卡片`、`frosted glass` 或 `backdrop-filter`。从词条中查看释义、来源和描述。**每个官网词条都配有对应预览**：视觉风格展示独立材质与编排，动效展示真实运动，看板用明确标注的模拟数据，UX 原则用任务和状态演示。不再使用通用概念占位。详见[专属预览与维护要求](docs/PREVIEW_SCENES.md)。

![Design Compiler 工作台：意图理解、效果预览、参数与 Agent 描述](docs/media/studio.png)

## 想用 AI 时再连接 TokenDance

1. 点击右上角「连接 TokenDance」。连接面板会读取公开模型目录，这一步不调用模型。
2. 通过 TokenDance 授权弹窗创建密钥，或从 [TokenDance 密钥管理](https://tokendance.space/keys)取得自己的 Key 后手动填写。授权会在你确认后创建 Key。
3. 选择支持对话协议的模型，点击「仅保存到本页」。如果目录读取失败，可以手动填写官方模型 ID。
4. 只有配置密钥后主动点击「查找效果」或「理解并生成方案」才请求模型，费用由 TokenDance 收取。五个「本地试试」示例即使已经连接，也保持本地运行。
5. 用「清除密钥」断开连接。**密钥只在本页内存，刷新后清除**；没有账号系统，也不写 localStorage、sessionStorage、仓库或 GitHub Secrets。语言偏好可以保存。

GitHub Pages 版由浏览器直连 TokenDance，本地服务版经当前实例转发。只在可信部署中输入密钥。解析失败会回退本地规则，不自动重试付费请求；真实密钥的付费端到端联调尚未完成。详见[接入方式与验证边界](docs/TOKENDANCE.md)。

## Fork 后在自己电脑运行

需要 **Node.js 20+**；内容检查与源码打包另需 **Python 3**。项目没有 npm 依赖，无需先运行 npm install，也无需密钥启动。

```sh
git clone https://github.com/Vibe-Design-Labs/Vibe-UI-UX.git
cd Vibe-UI-UX
npm run dev
```

打开 [http://localhost:4173/studio.html](http://localhost:4173/studio.html)。使用 Fork 时，将 clone 地址换成自己的仓库地址。修改源码后停止并重新启动服务，让构建重新载入。

检查并复现纯静态部署：

```sh
npm test
npm run check:content
npm run check:docs
python scripts/package-source.py
npm run build:pages
npm run preview:pages
```

静态预览位于 [http://localhost:4174/Vibe-UI-UX/](http://localhost:4174/Vibe-UI-UX/)，输出目录是 `dist/pages/`。macOS/Linux 上如果没有 python 命令，使用 python3。本地构建、检查和打包不联网调用模型。

## 发布你自己的 GitHub Pages

1. Fork 本仓库，在自己的仓库启用 Actions。
2. 打开 **Settings → Pages → Source → GitHub Actions**。
3. 在 **Actions → Deploy GitHub Pages → Run workflow** 触发首次发布。
4. 工作流成功后从 Pages 设置或部署输出打开你的实际网址；此后推送 main 自动部署。

相对路径支持仓库子目录与 Fork，无需改原作者用户名。**不用设置模型密钥或 GitHub Secret**，访客自行连接自己的 TokenDance。完整[部署指南](docs/GITHUB_PAGES.md)。

## 更新词条、配方和效果

把 [维护 skill](skills/ui-ux-content-maintainer/SKILL.md)交给你选择的、能读写文件的 AI，也可以直接手动编辑。选择已有模板时，在 `content/items/` 增加一个 JSON；新增模板需要同时更新注册表和受控渲染器。扩充编译配方使用[配方维护说明](skills/ui-ux-content-maintainer/references/compiler-recipes.md)。

运行 `npm run check:content`、`npm test` 与 `npm run check:docs` 后，按需要重建[字体子集](docs/FONTS.md)、源码包和 Pages。维护脚本不需要 GPT Key，不消耗模型额度；你选用的其他 AI 可能有自己的服务费用。[完整维护流程](docs/CONTENT_MAINTENANCE.md)。

| 位置 | 作用 |
| --- | --- |
| `content/items/` | 词条、别名、语言正文、来源、审校状态 |
| `previews/registry.json` + `public/previews.js` | 受控参数契约与渲染器 |
| `compiler/` + `public/compiler-*.js` | IR、五语表达、配方、校验、编译界面 |
| `public/` | 静态官网、工作台、五语文案、TokenDance 连接 |
| `server/worker.js` | 可选本地/Worker 中转；GitHub Pages 不依赖它 |
| `.github/workflows/pages.yml` | 检查、源码打包、构建和部署 |

## 当前边界

- 词条正文主要是中英文草稿；日、韩、德正文明确回退英文。五语界面不等于五语知识内容已经审校完成。
- 本地规则覆盖 5 个配方家族，不是通用设计理解。模糊、冲突或不支持的输入会列出待确认项；当前不支持跨模板组合、弹簧或从句子自动映射精确数值。
- 内容结构检查通过不等于来源、事实与翻译已经人工核准。严格发布审校检查目前应失败，草稿状态保留；未能读到的微信正文没有被编造为已读来源。
- 预览是交互概念示例，不会真实保存数据；导出需由你与开发者审阅后实现。系统减少动态效果、触摸与键盘保留适合的交互。

[编译器结构与约束](docs/DESIGN_COMPILER.md) · [50 个新词条与来源状态](docs/CONTENT_EXPANSION_2026-10-07.md) · [本次发布检查](docs/RELEASE_0.4.1.2.0.md) · [五段版本规则](docs/VERSIONING.md)

## 许可与致谢

应用代码为 [MIT](LICENSE)。字体 Ma Shan Zheng、LXGW WenKai 与 Caveat 使用 **SIL OFL 1.1**，完整许可与子集重建步骤见[字体说明](docs/FONTS.md)。README 的截图和 GIF 来自本项目实际界面。

早期交互方向参考 Hyperknow；米纸、水墨、朱砂与手写气质来自用户给出的视觉参考。编排和代码为原创，未使用参考网站的图片、商标或组件源码。欢迎通过 [Issues](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/issues)提供准确的来源、译文、可验证效果或问题反馈。
