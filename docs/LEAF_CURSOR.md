# 叶片指针与暖杏金聚光 · 0.4.0.1.0

叶片外观来自用户确认的内置 imagegen 概念稿。网页使用项目维护的轻量 SVG 矢量实现：墨绿 `#3E4535` 叶身，米色 `#F4ECD9` 叶脉，朱砂 `#B5452E` 墨点。不是生成时的大尺寸 PNG 在网页上反复缩放。

确认的概念原图见 [leaf-cursor-concept.png](design/leaf-cursor-concept.png)；矢量实现用于小尺寸指针与颜色调节。

`public/leaf-art.js` 是图形的唯一实现源，默认 SVG 与可调预览共用同一组路径。构建生成 `leaf-cursor.svg`，文档页提供下载。左上叶尖对应点击热区；缩放围绕热区进行，不改变点击位置。

## 官网与工作台

首页完整展示叶片与灯光，使用 custom-cursor 词条的默认参数。工作台其他演示只在预览区域显示品牌叶片；自定义光标演示接管自己的区域，保留八种形状，并使用用户当前调节值，避免同时出现两枚指针。聚光卡片按当前词条参数独立演示。

| 参数 | 默认值 | 行为 |
| --- | --- | --- |
| shape / size_px / color | leaf / 32 / #3E4535 | 光标形状、SVG 画布尺寸与叶身颜色 |
| follow_ms | 0 | 指针直接跟随；其他数值可演示平滑跟随 |
| hover_scale | 1.12 | 可点击目标悬停时围绕热区放大 |
| click_effect / duration_ms | pulse / 240 | 点击圆环与缩放反馈 |
| spotlight_radius_px | 160 | 聚光半径，40–400px |
| spotlight_opacity | 0.15 | 聚光透明度，0–0.35；0 关闭 |
| spotlight_color | #EBCB8B | 聚光过渡颜色；中心为暖白 #FFF3D6 |
| spotlight_follow_ms | 80 | 灯光跟随时间常数，0–300ms；0 直接跟随 |

时间常数表示平滑响应，不是完成移动所需的总时长。光标与灯光分别调节；动画采用实际帧间隔计算，静止后停止安排动画帧。预览、描述与 JSON 导出读相同的 effectiveParams。叶脉和墨点为固定品牌颜色，仅叶片形状使用。

## 退出与兼容

文字输入、下拉框、编辑区与连接弹窗恢复原生指针。Tab / Escape、窗口失焦、隐藏页面、滚动、指针离开、效果切换、暂停与减少动态效果会清理跟随和未完成反馈。触摸或粗指针使用静态形状示意，保留原生点击。

覆盖层 pointer-events:none，图形不会拦截真实目标事件；页面层裁剪到视口，演示层裁剪到区域，避免灯光产生页面溢出。本次实际检查范围见 VALIDATION.md，不宣称已完成所有浏览器或完整无障碍认证。

## 后续维护

1. 外观在 `public/leaf-art.js` 调整，SVG 下载自动随构建更新。
2. 参数范围 / 默认值更新 `previews/registry.json`；演示初始值更新 `content/items/custom-cursor.json`。卡片聚光另用 cursor-spotlight.json。
3. 改动参数时同步五语 prompt_template 和 i18n 控件标签；不要将草稿标成已审校。
4. 运行内容检查、npm test、浏览器预览；新增字形后重建字体子集。
5. 按 VERSIONING.md 更新五段编号、CHANGELOG.md、源码 ZIP 与静态构建。

维护流程复用 `skills/ui-ux-content-maintainer`，不需要调用付费模型 API。具体代码和视觉方案为本项目实现，未复制参考站的鼠标素材。
