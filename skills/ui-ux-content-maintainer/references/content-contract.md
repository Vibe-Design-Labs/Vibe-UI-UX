# 内容契约 v1

本项目已按此契约接入内容、参数控件、预览与描述生成器。`assets/example-pack` 仍是独立维护样例；实际路径以项目的 `docs/CONTENT_MAINTENANCE.md` 为准。

## 建议结构

```text
project/
  content/items/              每个概念一个 JSON；稳定 ID 与文件名一致
  previews/registry.json      模板的参数契约、默认值、范围和版本
  previews/renderers/         项目实际实现的受控演示组件
  locales/                   五种界面语言；与内容译文分别维护
  scripts/                   项目自身的构建和检查
```

每个词条只登记模板 ID 和参数覆盖值。预览、参数控件和描述生成器使用同一份合并结果：模板默认值加词条参数，再加用户调整。本项目公开体验版会展示草稿并说明审校状态；严格内容发布检查仍要求 `published` 与 `reviewed`，不要把体验版构建成功当作内容已审校。

## 词条字段

| 字段 | 约定 |
|---|---|
| schema_version | 当前固定为 1 |
| id | 小写 ASCII 字母、数字、单连字符；稳定且全库唯一 |
| kind | `term`、`effect`、`ux-pattern` |
| domain | `ui` 或 `ux` |
| category | 项目维护的分类 ID |
| status | `draft` 或 `published` |
| canonical_name | 英文规范名称；同一概念不要因界面语言改变 |
| tags | 检索标签列表 |
| related_ids | 已存在词条的 ID 列表 |
| locales | `zh-CN`、`en`、`ja`、`ko`、`de` 中已有的内容译文 |
| preview | `null`，或 `{template_id, params}`；效果与 UX 案例必须关联模板 |
| sources | 非空来源记录列表 |

每个已有内容译文包含 `review_status`（draft/reviewed）、`name`、`aliases`、`description`、`use_when`、`avoid_when`、`prompt_template`。缺失译文不填该语言，由应用显式回退英文。

`prompt_template` 的变量使用 `{duration_ms}` 等参数名。变量只允许注册表定义的参数名，无属性访问、索引、格式表达式或代码。演示模板中的所有参数都需在输出模板中显式体现，以便检查一致性。单纯词条且无预览时可用空字符串。

注册表参数支持 `number`、`enum` 和 `color`。数值规定 `min`、`max`、`default`；枚举规定 `values` 和 `default`；颜色规定 `default`，仅接受 `#RRGGBB` 六位十六进制字符串（例如 `#B5452E`），不接受 CSS 函数、外部 URL 或任意样式。需要坐标、手势等其他新参数类型时，先扩展契约和检查器，再增加实际模板。

## 来源字段

- `type`：`original`、`reference` 或 `adapted`。
- `note`：说明原创、概念引用或实际复用的内容范围。
- `url`：外部来源必须为 HTTP/HTTPS 页面地址；原创允许空值。
- `license`：填写已核实许可名，或 `unknown`。
- `reuse_permission`：`not-applicable`、`verified` 或 `pending`。

`reference` 只表示查阅后原创解释，不代表允许复制。`adapted` 发布前要求许可明确且复用状态为 verified；脚本只能检查元数据声明，不能判定实际权利范围。

## 五语规则

界面语言代码：简体中文 `zh-CN`、英文 `en`、日文 `ja`、韩文 `ko`、德语 `de`。本包检查词条译文，不检查尚未实现的网站界面。

缺失译文与未校对译文分别记录。保留规范名称和单位；CSS、API、函数标识不翻译。机器翻译只能先标 draft。发布检查要求的语言由项目决定；本包默认要求中英内容齐备且已校对，五语界面仍需独立验收。

## 检查边界

本包脚本只读本地 JSON，不联网、不调用模型、不保存密钥、不修改内容。检查：格式版本、ID 和文件名、重复 ID、引用、模板引用、参数类型和范围、变量绑定、所要求语言的状态、来源元数据。

它不检查动效视觉质量、渲染器是否正确使用参数、译文自然程度、无障碍实际表现、网站构建或第三方许可的适用范围。相关结果必须通过实际预览与人工审阅确认。
