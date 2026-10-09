# Design Compiler 配方维护

适用于本项目的 `compiler/`、`public/compiler-core.js` 和工作台编译流程。不接入新模型服务，不自动提交、推送或部署；以用户本次授权为准。

先判断变更属于哪一层：词条别名放 `content/items/`；意图关键词放 `compiler/lexicon.json`；复用模板的参数方案放 `compiler/recipes/`；确实没有相应模板才修改注册表与受控渲染器。单独新增词条仍可被原有搜索找到，但不等于能够生成编译方案。

## 新增使用既有模板的配方

1. 对照现有配方确认稳定 ID、`item_id`、`target`、`trigger`、`feature`。`item_id` 是词条 ID：例如水波使用 `click-ripple`，对应模板 `ripple`；依次入场使用 `staggered-reveal`，对应 `slide-fade-list`。
2. 在 `compiler/recipes/` 增加 JSON。参数名、范围、颜色类型来自 `previews/registry.json`，不要自行增加字段。默认参数是本项目的设计选择，不是行业标准。
3. 填写五语 `locales` 的 `name`、`reason`、`review_status`。未人工审校的译文保持 `draft`。在 `compiler/implementations.json` 为该 ID 添加当前可用的 `native-web` 方法；不可声明未实现的库或平台。
4. 用真实的日常表达验证匹配。需要新关键词时修改 lexicon，同时验证否定表达、相似词误匹配、未指定字段和现有五个示例。新增触发类型或效果类别超出现有闭合枚举时，需要扩展 schema、匹配逻辑、参数冲突逻辑和界面文案；不要只改数据宣称能力已支持。
5. 运行 `npm test`、`npm run check:content`、`npm run build:pages`。构建检查重复 ID、实际词条绑定、参数合法性、实现能力与语言状态。内容检查器负责原有词条，compiler 测试负责意图到配方，两者不能相互替代。
6. 启动 `npm run dev`，实际比较预览、参数、设计描述、Agent 描述及方案 JSON；检查调参冲突、确认后导出、再次调参撤销确认、重置、五语切换和减少动态效果。调整词条不能破坏原有单效果 JSON 的 schema_version:1。

## 边界

当前支持一个配方绑定一个现有模板。暖光加抬升是 `cursor-spotlight` 模板已实现的能力；不同模板的叠加还没有实现。`mountPreview()` 会清空舞台，不得用连续调用伪装为效果组合。

Design IR 存放定性意图，不存 px/ms、CSS 类或实现库。Recipe 存放经过注册表校验的最终参数；渲染器、两类描述和导出都使用这组参数。模型只能解析 IR 与已知候选 ID，不能提供可执行 HTML/JS 或跳过校验的参数。没有真实时间测量的截图不能推断准确时长。

确切数字输入尚未自动映射时保留提示；无法支持的要求进入 `unresolved`，不默默删除。参数冲突阈值是项目约定，调整时同时更新测试和说明。

本地编辑、构建、示例、调参、导出不调用模型 API。把本技能和仓库交给其他 AI 即可维护；该 AI 的服务费用另计。新增中文字后，按 `docs/FONTS.md` 用已有授权字体原文件运行子集脚本，最后运行 `python scripts/package-source.py` 更新下载包，再重新构建。下载包包含 compiler 数据。
