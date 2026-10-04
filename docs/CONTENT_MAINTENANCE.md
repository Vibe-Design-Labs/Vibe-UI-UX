# 本项目实际维护路径

维护 skill 为 skills/ui-ux-content-maintainer/SKILL.md。本项目已连接其内容契约：content/items、previews/registry.json、public/previews.js、public/core.js。skill 的 assets/example-pack 仅作为旧的独立样例，不是本项目真实数据。

维护步骤：

1. 查看已有 JSON，确认是否只是既有术语的新别名；保留稳定 ID。
2. 查看注册表和实际渲染器，复用已有模板，参数只能用已声明键。
3. 添加中英文原文、别名、适用与避免条件、来源。日/韩/德缺失时保留英文回退，不伪造审校状态。
4. 描述模板包含所有已注册参数占位符；预览和描述生成共用 public/core.js 的有效参数。
5. 新增字符时按 docs/FONTS.md 重新生成 Web 字体子集（无需 GPT）；运行内容校验、npm run build、npm test。在浏览器检查字体加载、极值、重播、键盘、触摸、减少动态效果与移动布局。
6. 事实与译文审校后才将词条 published、语言 reviewed，并运行严格发布检查。代码提交与部署遵循当前任务授权。

新增内容不需要新增页面。新增演示通常需要开发工作：注册参数、实现 renderer、加入 rendererIds、处理取消与清理、补齐五语新增界面文案、验证预览与输出一致。

GitHub Pages 更新：本地核验后运行 `python scripts/package-source.py`、`npm run build:pages`、`npm run preview:pages`。先在仓库子路径检查导航、字体、词库和参数，再提交 main；已开启 Pages 的仓库会自动验证并发布。首次 / fork 部署见 [Pages 指南](GITHUB_PAGES.md)。源码打包、构建与部署均不调用模型；不需要 GPT 额度或把 TokenDance Key 放到仓库。

不要重新运行一次性 scripts/seed-content.py 覆盖日后维护的内容。结构检查不会帮你联网核验来源，也不会证明知识与翻译正确。
