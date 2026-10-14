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
| 新代码生成 | 同一 Chat Completions 端点 | SSE 流式，完整代码与参数，上限 16,000 tokens；K3 专属配置见下文 |

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

`generate` 单次发送 `stream: true` 与 `max_tokens: 16000`。仅 `kimi-k3` 添加 `reasoning_effort: high` 和 `response_format: {type: json_object}`。K3 官方默认 `max` 推理，本项目显式选择 `high`，使用其 JSON 模式保证输出格式意图；它仍可能返回截断、无效结构或无法运行的代码，不是完成质量保证。来源：[TokenDance Kimi 指南](https://tokendance.space/docs/kimi-thinking-models.md)、[Kimi reasoning effort](https://platform.kimi.com/docs/guide/use-reasoning-effort)、[Kimi JSON Mode](https://platform.kimi.com/docs/guide/use-json-mode-feature-of-kimi-api)。

首次 HTTP 响应最多等 150 秒，收到响应后若连续 120 秒无流数据，或请求总计到达 10 分钟，则终止等待。有效流活动会更新空闲计时；`[DONE]` 或中转 result 到达即完成，不等待保持打开的连接。超时、取消、校验失败都可能已经计费；输出预算和计费遵循 TokenDance 与服务商规则。配方解析仍采用客户端 90 秒 / 中转 85 秒上限。

服务 `model` 字段与本次请求 ID 严格比较：不同则 `model-mismatch`，拒绝运行且不自动重试；缺失则 `unknown`，标记无法确认。未私自把名称、供应商前缀或版本别名当作同一 ID；若出现官方等价别名，需基于确切文档另行适配。报告字段一致仅表明响应声称一致，不能独立验证服务商内部路由。

回执包含请求模型、服务报告模型、可跨域读取的请求 ID、响应 ID、HTTP 状态和 finish reason。请求头未向浏览器开放时，ID 显示未提供。诊断不会包含密钥、提示词、代码、原始网关报错或推理正文；推理仅计字符数。服务错误、输出流中断、正文 JSON、截断、结构校验和隔离预览分开处理。

77 项测试、五语真实浏览器、HTTP 流和独立 ZIP 检查已通过，使用受控响应且没有付费模型调用。维护者选择在本地用自己的 Key 生成再回传诊断；这一步尚待结果。详见 [本次验证记录](RELEASE_0.4.4.0.2.md)。
