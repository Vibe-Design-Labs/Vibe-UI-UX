# IntentKit / 意译

把日常设计表达转成专业 UI/UX 术语、可操作演示和准确描述。v0.2 提供纸张与手写字风格的官网、工作台、24 个词条、15 个可控演示模板、五语界面和 TokenDance BYOK。

[GitHub 开源仓库](https://github.com/virtue192/Vibe-UI-UX) · [维护新内容](docs/CONTENT_MAINTENANCE.md) · [字体与许可](docs/FONTS.md)

![IntentKit 米纸与手写字风格界面](docs/preview.png)

IntentKit translates everyday design intentions into professional UI/UX vocabulary, live previews and reusable design briefs. Bring your own TokenDance key for optional AI suggestions. The interface supports Chinese, English, Japanese, Korean and German. Basic search, previews, parameter tuning and export work without an API key. Application code is MIT; bundled fonts remain under SIL OFL 1.1.

## 运行

Node.js 20+，无需 npm 依赖。Python 3 用于内容验证与源码打包。

    npm run dev
    # http://localhost:4173
    npm run build
    npm test
    npm run check:content

修改源码后重新启动本地服务以加载新构建。本地启动、浏览、预览、复制、导出与内容更新不调用模型。只有配置密钥并点击工作台“查找效果”才会产生 TokenDance 请求与可能的费用。

## 架构

- public/index.html：静态官网，米纸色、墨灰、苔绿与朱砂红；错落纸页、交互演示、滚动入场与按钮吸附。
- public/studio.html：搜索、筛选、候选比较、参数、描述与 JSON 导出。
- content/items/*.json：一词条一文件，稳定 ID、双语正文、别名、来源与审校状态。
- previews/registry.json：参数默认值、合法范围、枚举。
- public/previews.js：受控渲染器，不运行模型生成代码。
- public/core.js：最终参数校验、描述生成与候选校验；预览与导出共用。
- public/i18n.js：中文、英文、日文、韩文、德文界面；content 翻译独立维护。
- public/polish.css：纸张配色、字体、字号与响应式布局；public/fonts/ 自托管 OFL 字体。
- server/worker.js：固定 TokenDance Chat Completions 地址，单次请求中转。
- scripts/build.mjs：生成 dist/client 静态文件与 dist/server/index.js Worker。
- skills/ui-ux-content-maintainer：可交给其他 AI 使用的维护 skill 与本地检查脚本。

## 维护新内容

把维护 skill 和本 README 交给任意支持读写文件的 AI。选择已注册模板时，只需新增或编辑 content/items/*.json。新模板才需要同时更新注册表、渲染器、界面语言文案与验证。

    python skills/ui-ux-content-maintainer/scripts/validate_content.py .

内容发布审校后运行：

    python skills/ui-ux-content-maintainer/scripts/validate_content.py . --publish-check --require-locales zh-CN en

检查器不联网、不使用 API Key、不消耗 GPT 模型额度。使用其他 AI 本身可能有其服务费用。

当前词条是中英文草稿，日/韩/德正文明确英文回退。五语“界面完整”与五语“内容完整”是不同状态。严格发布检查目前应失败，避免把草稿当作已审校知识库。seed-content.py 是一次性初始作者脚本，后续维护不要重新运行，以免覆盖已编辑词条。

## 动效与可访问性

鼠标聚光通过 pointermove、requestAnimationFrame 和径向渐变实现；模板使用同一份半径、透明度、抬升距离和过渡时长。鼠标吸附仅用于官网主要操作。粗指针触摸不启动指针跟随；保留原生光标和原生控件。

尊重 prefers-reduced-motion，关闭非必要位移、扫光、装饰循环与鼠标跟随。官网提供暂停装饰动效按钮。键盘焦点可见、模态支持 Escape、候选和状态消息可操作。WebMCP 仅在 document.modelContext 存在时注册两个无模型调用的工具：search_design_terms 与 set_design_preview。

## BYOK 隐私和限制

仅支持 https://tokendance.space/gateway/v1/chat/completions。模型 ID 以 TokenDance 公开模型目录为准。使用 X-TokenDance-Key 从浏览器传到本实例，再用 Authorization 转发到 TokenDance。密钥仅留在当前页面内存，刷新/清除会丢弃；不写 localStorage/sessionStorage、数据库或日志。语言偏好可保存至 localStorage。

请求经部署方服务器转发，所以使用者应信任部署方。应用代码不记录请求体；部署平台、网络代理与 TokenDance 的独立日志政策不受本项目控制。服务器强制固定目标地址、限制输入及返回大小、35 秒超时、禁止上游重定向、只接受已知候选 ID。模型文本作为普通文本显示，不运行任意代码。

尚未用真实 TokenDance 密钥进行付费联调；自动检查使用模拟响应。模型费用、可用性与响应格式需要实际接入时验证。

## 部署与开源

dist/client/ 可部署到任意静态主机，基础功能完整，AI 中转不可用。完整版本可将 dist/server/index.js 作为 Cloudflare Worker ESM 入口（同目录 assets.js/catalog.js/core.js 随包部署），或运行 Node 本地服务。Worker 不依赖数据库或运行时环境密钥。静态官网本身无需后台。

    python scripts/package-source.py
    npm run build
    # public/source.zip 由打包脚本生成，官网提供下载

源码包排除 .git、托管身份、环境文件、node_modules 与构建输出。公开仓库与部署身份分开，克隆后不需要原作者的托管账户。无需提交任何 TokenDance Key 或 GitHub Token。

早期交互方向参考 https://www.hyperknow.io/；v0.2 根据用户提供的米纸、水墨、朱砂与手写字体参考重新设计。原创编排与代码，不使用参考站或参考图片的图片、商标、正文或组件源码。知识来源链接在各词条数据中；解释与演示为本项目原创。

## Typography & licenses

标题采用 Ma Shan Zheng 的改名 Web 子集，正文采用 LXGW WenKai 的改名 Web 子集，英文手写采用 Caveat。参考图未写明实际字体名称，不宣称与参考图为同款。字形来源、作者版权、三个完整 OFL 许可与无 AI 调用的子集重建步骤见 [字体说明](docs/FONTS.md)。新增未收录字符时，重新运行子集脚本；平时运行网站不需要安装字体制作依赖。
