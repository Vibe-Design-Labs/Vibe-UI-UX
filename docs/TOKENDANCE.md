# TokenDance 接入 · v0.4

本地 0.4.1.0.0 预览另外增加「理解并生成方案」按钮：连接密钥后会调用模型解析闭合 IR；本地示例、修改理解和调参不调用模型。此预览尚未发布，编译流程见 [Design Compiler](DESIGN_COMPILER.md)。下方原有授权与「查找效果」流程仍保留。


依据 2026-10-06 实际读取的 [AI 接入入口](https://tokendance.space/docs/ai-integration.md) 与 [文档索引](https://tokendance.space/llms.txt)，保留项目现有的 OpenAI Chat Completions HTTP 协议，无额外 SDK 或 npm 依赖。

## 使用方式

1. 打开工作台 → 连接 TokenDance。面板读取公开模型目录，不发送密钥、不调用模型。
2. 点击「通过 TokenDance 授权」。在新窗口登录，并确认新 Key 的名称、额度、周期、过期时间与 RPM。也可以手动输入已有 Key。
3. 授权回到原页面后，选择列表中的模型 ID，点击「仅保存到本页」。仍未发起模型调用。
4. 输入设计意图并点击「查找效果」，使用该模型获得受控词条候选。TokenDance 按其规则计费。
5. 刷新、离开页面或清除密钥后连接会丢弃。清除密钥可继续本地关键词查询、演示和导出。

首次授权会创建新 Key。刷新后可以手动输入自己安全保存的已有 Key；重新授权会创建另一个 Key，可在 [TokenDance 密钥管理](https://tokendance.space/keys) 禁用或删除不再需要的 Key。

## 接口与协议

| 功能 | 固定 TokenDance 地址 | 认证 / 行为 |
| --- | --- | --- |
| 模型目录 | `GET https://tokendance.space/gateway/v1/models` | 无 Key，只接受 `supported_protocols` 明确包含 `openai:chat-completions` 的模型 |
| 用户授权 | `https://tokendance.space/auth` | 用户确认创建 Key；`callback_url`、S256 challenge、稳定 `app_url` 和 `key_name` |
| Code 交换 | `POST https://tokendance.space/portal/api/v1/auth/keys` | JSON：`code`、`code_verifier`、`code_challenge_method: S256`；响应 `{key}` |
| 意图解析 | `POST https://tokendance.space/gateway/v1/chat/completions` | `Authorization: Bearer …`、`X-App-URL`、非流式；模型只返回已知词条 ID 与文字解释 |

模型列表是动态数据，不能按模型名称猜协议，也不能保证某个 Key 对所有模型有余额或权限。读取列表失败时保留手动 ID 输入。调用使用供应商默认采样参数，不固定 temperature；输出上限为 900 tokens。模型的特殊参数、推理预算或供应商限制可能仍造成失败，不代表所有目录模型均已付费联调。

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

`public/tokendance.js` 集中维护官方端点、协议、PKCE、受限响应与共享提示词；`public/connection.js` 管理 UI 状态；`public/authorize.*` 是静态回调；`server/worker.js` 维护中转。两种模式共用提示词和生成参数。

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

构建、内容维护、自动测试、Pages 发布和模型目录读取不调用模型。只有使用者主动执行意图解析才可能产生 TokenDance 模型费用。
