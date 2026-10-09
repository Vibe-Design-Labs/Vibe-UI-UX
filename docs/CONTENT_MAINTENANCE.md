# 本项目实际维护路径

维护 skill 为 skills/ui-ux-content-maintainer/SKILL.md。本项目已连接其内容契约：content/items、previews/registry.json、public/previews.js、public/core.js。skill 的 assets/example-pack 仅作为旧的独立样例，不是本项目真实数据。

维护步骤：

1. 查看已有 JSON，确认是否只是既有术语的新别名；保留稳定 ID。
2. 官网每个可见词条都需要与概念对应的专属预览。查看注册表和实际渲染器；共享基础组件可以，不能用通用占位卡替代独立材料、编排或交互。参数只能用已声明键。
3. 添加中英文原文、别名、适用与避免条件、来源。日/韩/德缺失时保留英文回退，不伪造审校状态。
4. 描述模板包含所有已注册参数占位符；预览和描述生成共用 public/core.js 的有效参数。
5. 新增字符时按 docs/FONTS.md 重新生成 Web 字体子集（无需 GPT）；运行内容校验、npm run build、npm test。在浏览器检查字体加载、极值、重播、键盘、触摸、减少动态效果与移动布局。
6. 事实与译文审校后才将词条 published、语言 reviewed，并运行严格发布检查。代码提交与部署遵循当前任务授权。

新增内容不需要新增页面。新增演示通常需要开发工作：注册参数、实现 renderer、加入 rendererIds、处理取消与清理、补齐五语新增界面文案、验证预览与输出一致。

GitHub Pages 更新：本地核验后运行 `python scripts/package-source.py`、`npm run build:pages`、`npm run preview:pages`。先在仓库子路径检查导航、字体、词库和参数，再提交 main；已开启 Pages 的仓库会自动验证并发布。首次 / fork 部署见 [Pages 指南](GITHUB_PAGES.md)。源码打包、构建与部署均不调用模型；不需要 GPT 额度或把 TokenDance Key 放到仓库。

不要重新运行一次性 scripts/seed-content.py 覆盖日后维护的内容。结构检查不会帮你联网核验来源，也不会证明知识与翻译正确。

## 新增自定义光标（2026-10-05）

示例：content/items/custom-cursor.json、previews/registry.json 的 custom-cursor，以及 public/cursor-preview.js。形状使用受控枚举；颜色采用严格的 color 类型（#RRGGBB），由核心参数校验和内容检查器共同约束。页面使用颜色选择器，导出使用同一份有效参数，不接受任意 SVG、HTML 或 CSS 输入。

首页“自定义光标”入口读取词库与参数契约，形状和颜色可切换；进入工作台时会携带并重新校验当前参数。当前首页使用品牌叶片与聚光，工作台将品牌指针限制在预览区域；定制光标演示接管自身区域，文字输入、弹窗、触摸、键盘、减少动态效果与暂停动效保留原生行为。新增其他光标形状时同步修改受控枚举、原创 SVG 形状、五语选项标签和浏览器验证用例。

## 叶片与聚光（0.4.0.1.0）

叶片几何路径在 public/leaf-art.js，构建自动导出 leaf-cursor.svg。custom-cursor 新增 spotlight_radius_px、spotlight_opacity、spotlight_color、spotlight_follow_ms；模板版本为 2。颜色继续只接受 #RRGGBB。叶脉与墨点为固定品牌色；指针和灯光分别调节，并将全部参数写入五语描述。

本次参数调整复用原有词条 ID，不新增近义词条。对源码与内容进行下一次更新时，按 [五段版本规则](VERSIONING.md) 更新 package.json.intentkitVersion 和 CHANGELOG.md，再重新打包与部署。

## 专属预览门槛（0.4.1.2.0）

`public/preview-capabilities.js` 声明实际能力；`preview-scenes.js` 实现 59 个新场景；`preview-scenes.css` 只控制演示区域；`scene-strings.js` 维护五语演示界面。原有 16 个渲染器继续使用 `previews.js`。

新内容先完成场景、注册参数、描述变量和五语控件，再加入可见词库。运行 `npm run check:content`（含 `--require-previews`）、`npm test`、`npm run check:docs`。构建会拒绝缺失或未实现的预览；场景还要通过实际浏览器验证。整数数量参数可声明 `integer:true`，不允许用偷偷四舍五入的演示与导出不一致。

完整对应关系、局部数据与 Web 材质近似的边界见 [专属场景说明](PREVIEW_SCENES.md)。这些脚本和演示不调用模型；用其他 AI 更新时也需遵守同一门槛。
