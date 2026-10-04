# GitHub Pages / fork 部署

GitHub Pages 静态版保留官网、五语界面、术语查询、动效预览、参数调节、复制与 JSON 导出。浏览、学习和更新内容不需要模型密钥。

BYOK 由访客浏览器直连固定 TokenDance 服务。密钥在当前页面内存中，不写 localStorage/sessionStorage，不放进仓库或 GitHub Secrets，刷新页面会清除。只有访客保存密钥并主动点击“查找效果”才调用模型。

2026-10-04 实际 OPTIONS 检查：TokenDance 返回 204、Access-Control-Allow-Origin: *、允许 POST 及 Authorization/Content-Type。此检查证明当时允许跨域请求，不代表真实模型或付费账号已完成联调；未来服务策略可能变化。跨域或网络失败会显示说明，仍可清除密钥使用本地匹配。

## 首次发布 / fork 后发布

1. 原仓库维护者将完整源码提交到 main；使用者 fork 原仓库。
2. 在自己的仓库打开 Settings → Pages → Build and deployment → Source，选择 **GitHub Actions**。
3. fork 后如果 Actions 默认未启用，在 Actions 页面启用工作流。
4. 在 Actions → Deploy GitHub Pages → Run workflow 手动触发首次部署。
5. 工作流成功后，从部署任务输出或 Settings → Pages 打开实际生成的站点地址。后续推送 main 自动更新。

原仓库已于 2026-10-04 通过 GitHub Actions 部署：[打开 IntentKit](https://virtue192.github.io/Vibe-UI-UX/)。fork 后网址通常是 https://你的用户名.github.io/你的仓库名/，实际网址以自己的部署输出为准。文件、字体、词库和导航都使用相对路径，不需要手动改仓库名前缀。

整个 Pages 工作流只构建、验证、打包和部署，不调用 GPT 或 TokenDance，不需要作者提供付费 Key。GitHub 自带部署令牌只用于 Actions 发布，和访客的 TokenDance Key 是独立的。

## 本地复现静态版

```sh
python scripts/package-source.py
npm run build:pages
npm run preview:pages
# http://localhost:4174/Vibe-UI-UX/
```

此预览只提供静态文件，无 AI 中转服务；构建产物的 transportMode=direct。npm run dev 提供本地 Worker 兼容服务，使用 relay 模式。页面使用同一份词库、参数契约和候选校验。

## 不使用 Actions 的手动发布

将 dist/pages/ 中的所有文件（包括 .nojekyll）上传到专用 gh-pages 分支根目录。在 Settings → Pages 选择 Deploy from a branch、gh-pages、/(root)。此方式适合已经构建好的静态文件；维护源码仍建议使用 main + 已提供的 Actions 工作流。

GitHub Pages 只部署 dist/pages/。不要上传 dist/server/、环境文件或托管身份配置。第三方字体在 public/fonts/ 保留完整 OFL 许可；应用代码为 MIT。

官方说明：[发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
