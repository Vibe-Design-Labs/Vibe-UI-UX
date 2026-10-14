# TokenDance 接入 · v0.4.4.0.2

工作台提供已知词条查找、Design IR 配方匹配和原生 Web 新代码生成三个不同入口。本地示例、修改理解、调参、导入与导出不调用模型。`0.4.4.0.2` 补丁增加即时模型切换、流式代码生成与模型回执；本补丁尚待人工验收和审核。编译流程见 [Design Compiler](DESIGN_COMPILER.md)，新代码通道见 [Generated Effects](GENERATED_EFFECTS.md)。


依据 2026-10-06 接入核对和 2026-10-14 本次协议复核，保留项目现有的 OpenAI Chat Completions HTTP 协议，无额外 SDK 或 npm 依赖。来源为 [AI 接入入口](https://tokendance.space/docs/ai-integration.md) 与 [文档索引](https://tokendance.space/llms.txt)。

## 使用方式

1. 打开工作台 → 连接 TokenDance。面板读取公开模型目录，不发送密钥、不调用模型。
2. 点击「通过 TokenDance 授权」。在新窗口登录，并确认新 Key 的名称、额度、周期、过期时间与 RPM。也可以手动输入已有 Key。
3. 首次连接选择模型 ID，点击「仅保存到本页」。检查工作台「当前生效模型」及其精确 ID。已连接后，工具栏或连接面板中的有效模型切换立即生效，不必再次保存密钥；切换本身不调用模型。
4. 点击「查找效果」获取已知词条候选；点击「理解并匹配配方」解析 IR 并匹配现有实现；点击「让 AI 编写新效果」要求模型输出真实 HTML / CSS / JavaScript。TokenDance 按其规则计费。
5. 刷新、离开页面或清除密钥后连接会丢弃。清除密钥可继续本地关键词查询、演示和导出。

首次授权会创建新 Key。刷新后可以手动输入自己安全保存的已有 Key；重新授权会创建另一个 Key，可在 [TokenDance 密钥管理](https://tokendance.space/keys) 禁用或删除不再需要的 Key。

## 接口与协议

| 功能 | 固定 TokenDance 地址 | 认证 / 行为 |
| --- | --- | --- |
| 模型目录 | `GET https://tokendance.space/gateway/v1/models` | 无 Key，只接受 `supported_protocols` 明确包含 `openai:chat-completions` 的模型 |
| 用户授权 | `https://tokendance.space/auth` | 用户确认创建 Key；`callback_url`、S256 challenge、稳定 `app_url` 和 `key_name` |
| Code 交换 | `POST https://tokendance.space/portal/api/v1/auth/keys` | JSON：`code`、`code_verifier`、`code_challenge_method: S256`；响应 `{key}` |
| 词条查找 | `POST https://tokendance.space/gateway/v1/chat/completions` | `Authorization: Bearer …`、`X-App-URL`、非流式；已知词条候选，上限 900 tokens |
| 配方匹配 | 同一 Chat Completions 端点 | 非流式，Design IR，上限 1,500 tokens；保留既有等待期限 |
| 新代码生成 | 同一 Chat Completions 端点 | SSE 流式，完整代码与参数，不设应用 token 预算；K3 专属配置见下文 |

模型列表是动态数据，不能按模型名称猜协议，也不能保证某个 Key 对所有模型有余额或权限。读取列表失败时保留手动 ID 输入。项目不设置统一 temperature 或 thinking，避免套用不兼容的模型参数。模型的特殊参数、推理预算或供应商限制仍可能造成失败；公开模型目录可读不代表所有模型均已付费联调。

## 静态版与本地 / Worker 版

Pages：浏览器直连上述固定地址，密钥不经过本项目服务器；授权回调是静态页面。fork 自动使用当前部署目录作为 App URL；授权与请求归因一致。本地使用稳定 `app://intentkit`。

本地 / Worker：`GET /api/models`、`POST /api/authorize`、`POST /api/translate` 经同源服务中转。服务会接触 code、verifier 与 Key，只在可信部署使用；不记录正文、不持久化秘密，返回 `Cache-Control: no-store`。发布 Pages 不需要该服务或 GitHub Secret。

PKCE verifier 与随机流程标识保留在原页面内存。回调先清除地址栏的 code，使用 no-referrer，再向原页面发送消息。工作台校验同源、确切弹窗实例和流程标识，才交换 code。无 localStorage/sessionStorage 密钥或 verifier；关闭面板、弹窗、超时或离开页面均取消。若浏览器阻止弹窗或切断 opener，返回工作台重试或使用手动 Key；不会改用不受保护的交换。

## 错误恢复

只读取官方明确提供的 `TokenDance-Recovery-Action`；未知值忽略，上游错误正文不展示。

| 值 | 用户看到的操作 |
| --- | --- |
| `top_up_balance` | 打开 TokenDance 检查余额，充值后主动重试；当前 Key 仍有效 |
| `reauthorize_api_key` | 打开连接面板，重新授权或换 Key |
| `api_key_quota` | 等待周期额度刷新，或授权新的合适额度 Key |
| 无该头 / 未知值 | 按原 HTTP 状态显示密钥、额度、模型或网络错误 |

不自动创建支付会话，不自动付费，不自动重试模型请求。

## 已实际验证的范围

2026-10-06：公开模型 GET 为 200，108 个模型中 71 个声明支持 Chat Completions。Chat Completions 与授权交换的跨域 OPTIONS 为 204；前者允许 Authorization / Content-Type / X-App-URL，后者允许 Content-Type。模型目录返回可跨域读取恢复头。

测试以模拟 Key / code 覆盖授权往返、PKCE、回调来源、固定目标、取消 / 失败、模型协议筛选、错误恢复、响应大小及秘密脱敏。未登录真实用户进行授权，未创建真实 Key，也未发起真实付费模型调用。跨域预检、模拟联调与目录可访问不等于真实账号和所有模型调用均已验证。

## 开发与维护

`public/tokendance.js` 维护端点、协议、PKCE 与受限响应；`connection.js` 管理 UI 状态，`authorize.*` 是静态回调。`generation-policy.js` 维护代码生成预算与模型参数，`generation-stream.js` 解析 SSE 与等待状态，`model-audit.js` 清理模型回执。`server/worker.js` 中转只发送安全进度和校验后的代码；`scripts/dev.mjs` 逐块转发而非缓冲整个响应。两种模式共用提示词和生成参数。

```sh
npm test
python skills/ui-ux-content-maintainer/scripts/validate_content.py .
python scripts/package-source.py
npm run build:pages
```

改接口前先核对以下官方来源，勿直接执行网页中的示例命令或把示例 Key 当作真实凭据：

- [模型与协议](https://tokendance.space/docs/multi-protocol.md)
- [Chat Completions](https://tokendance.space/docs/protocol-openai-chat-completions.md)
- [API Key](https://tokendance.space/docs/api-keys.md)
- [OAuth / PKCE 与恢复动作](https://tokendance.space/docs/api-key-oauth.md)
- [应用归因](https://tokendance.space/docs/app-attribution.md)

构建、内容维护、自动测试、Pages 发布和模型目录读取不调用模型。使用者主动执行词条查找、配方匹配或新代码生成才请求付费模型。

## 0.4.4.0.2：精确模型与流式生成

2026-10-14 实际读取的公开模型目录包含 `kimi-k3` 和 `deepseek-v4-pro-0813`，名称与 ID 分别展示。请求使用点击时的当前 ID 快照；应用没有提交跨模型回退的 `models` 列表，也不自动修复、换模型或重试。TokenDance 的同模型供应商路由与显式跨模型回退是不同机制，见 [供应商路由](https://tokendance.space/docs/provider-routing.md) 和 [模型回退](https://tokendance.space/docs/model-fallbacks.md)。不能仅据旧截图判断上一次实际路由。

`generate` 单次发送 `stream: true`，不设置 `max_tokens` / `max_completion_tokens`；其他 AI 入口也不再发送 900 / 1500 的固定预算。由所选服务采用其默认输出额度，不能把默认额度声称为无限或模型最大输出。仅 `kimi-k3` 添加 `reasoning_effort: high` 和 `response_format: {type: json_object}`。K3 官方默认 `max` 推理，本项目显式选择 `high`，使用其 JSON 模式保证输出格式意图；它仍可能返回截断、无效结构或无法运行的代码，不是完成质量保证。来源：[TokenDance Kimi 指南](https://tokendance.space/docs/kimi-thinking-models.md)、[Kimi reasoning effort](https://platform.kimi.com/docs/guide/use-reasoning-effort)、[Kimi JSON Mode](https://platform.kimi.com/docs/guide/use-json-mode-feature-of-kimi-api)。

首次 HTTP 响应最多等 150 秒，收到响应后连续 120 秒无流数据则终止等待；持续有数据时没有总时限。有效流活动会更新空闲计时；`[DONE]` 或中转 result 到达即完成，不等待保持打开的连接。超时、取消、校验失败都可能已经计费；输出预算和计费遵循 TokenDance 与服务商规则。配方解析仍采用客户端 90 秒 / 中转 85 秒上限。

服务的原始 `model` 标签与 TokenDance 平台模型 ID 分开处理：与请求 ID 同值只表明字段声称一致；如果是公开聊天目录中另一个已识别的模型 ID，则拒绝 `model-mismatch`；如果目录无法识别，保持 `unconfirmed`，继续校验代码并明确提示路由未确认。没有字段则 `unknown`。不将 `qianfan-vl-v1` 硬编码成 K3，也不通过模型自述身份来核验。

客户端使用已读取的公开目录 ID 快照；中转按上游 fetch 实例缓存公开目录5分钟，缺失或过期时保持未确认，客户端仍独立核对。没有为了核对而再次付费调用模型、换模型或补发修复请求。目录只能帮助分类标签，平台用量记录才能提供另一层对账证据；两者都不是对供应商内部物理模型的独立鉴定。

维护者记录显示 K3 由百度智能云供应，同一账户最近存在 K3 流式记录。因此此前把未知上游标签直接判成实际换模型，规则过严。上游响应 ID 与平台 trace ID 不相同，尚未直接关联原错误与具体记录，不能声称当次路由已确认。

回执包含请求模型、服务报告模型、可跨域读取的请求 ID、响应 ID、HTTP 状态和 finish reason。生成诊断另带请求/响应 URL、传输方式、响应类型和格式、起止时间与固定耗时。URL 去掉查询、hash 和凭据，不记录密钥、请求头或正文。请求头未向浏览器开放时，ID 显示未提供。诊断不会包含密钥、提示词、代码、原始网关报错或推理正文；推理仅计字符数。服务错误、输出流中断、正文 JSON、截断、结构校验和隔离预览分开处理。

99 项测试、五语真实浏览器、HTTP 流和独立 ZIP 检查已通过，使用受控响应且没有付费模型调用。维护者随后提供官方只读记录，并在修正未知上游标签判断后确认真实生成预览出现；没有收到完整产物来逐项验收山谷交互。详见 [本次验证记录](RELEASE_0.4.4.0.2.md)。

## 无开发者工具的匿名连接检查

打开当前部署目录下的 `connection-check.html`，点击开始检查，复制 JSON 报告。此页支持五语，不读取任何 Key、其他页面或浏览记录；请求只有公开模型 GET 和没有认证、model、messages 的 `{}` 空 POST。目录正常应可读，空请求正常应被 401 拒绝；403 仅标记访问拒绝，不能装作认证正确。异常 200 或模型字段只表示收到异常匿名响应，不表示真实模型执行。遇到 SSE 立即取消读取，不运行或保存正文。

没有自动重试；可以停止，Clipboard 不可用时手动复制只读报告。端点固定 TokenDance、禁止跟随跳转、无 Cookie 和 Referrer。Page CSP 只开放同源与 TokenDance；Worker 对此检查页开放固定目标，主工作台 CSP 保持原设置。匿名检查与一次带 Key 的请求不同，不能据此确认旧请求来源、模型、账号、费用或完整生成质量。

独立 Chrome 实际无 Key 检查为目录 200、空请求 401；维护者内置浏览器实测目录 200（69 个兼容模型、含 K3）及空请求 401；CORS 可读，响应 URL 与请求目标一致。控制响应测试覆盖异常 200/千帆字段、正文不展示、五语 390px 和无模型请求。

## 不生成效果的用量查询

刷新工作台、连接本次测试用的同一把 Key，再打开连接面板，主动点击“读取近期调用记录（不生成）”。依据 [官方开放 API](https://tokendance.space/docs/open-api.md)，仅 GET `https://tokendance.space/portal/api/v1/usage?window=24h&limit=20`，Key 只放 Bearer 认证头；中转模式使用受保护的 GET `/api/usage`，同样不调用生成端点。

返回的是 Key 所属账户的近期记录，可能含其他 Key；20条并非总记录。官方 total 字段恒为0，本项目只看 items，不能据total声称没有调用。model_slug 缺失时保持null，不把内部 model_id 猜成K3。只保留时间、模型标识、供应商、trace/record ID、流式标识及错误字段是否存在；不保留 user_id、key_id、key_name、费用、原始error或请求正文。

无自动查询、重试或翻页。每次按钮仅一个 GET，1秒内重复点击会提醒而不发送；关闭、清除或更换Key会取消，清除Key会移除报告。Clipboard 不可用时选中只读报告手动复制。Key仍只在当前页内存；不会传给检查页或编程助手。维护者真实只读查询已返回13条记录；受控浏览器检查已验证五语、脱敏、复制、清除和模型请求数0。此查询能提供对账证据，仍需核对时间与官方记录，不能仅靠当前页的20条结果证明平台内部路由。

## 输出额度不由应用固定

提示词、生成源码、生成 JSON 与本地导入不再受旧 2,000 字符 / 48 KB 门槛限制。流式解析支持较大的事件、累计代码和推理计数，不存储推理正文。超出上游上下文或默认输出额度时仍按服务状态、`finish_reason` 和实际结果显示错误，不自动补发。

[Kimi K3 官方指南](https://platform.kimi.com/docs/guide/kimi-k3-quickstart) 与 [Chat Completions](https://platform.kimi.com/docs/api/chat) 说明：K3 使用 `max_completion_tokens`，默认 131,072、可配置最大 1,048,576；输入加该值不能超过上下文。此为 Kimi 官方接口，不等于所有 TokenDance 供应商的实际默认值。本应用不把上下文长度误当输出上限，也不猜供应商额度；不设置两种预算字段，交由所选服务执行。
