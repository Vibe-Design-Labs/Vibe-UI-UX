# 从预览到可复用的 Web 效果

本轮开发版本：`0.4.2.0.0`。先通过待审 PR 交付；合并并完成 Pages 部署后，公开官网才会更新。

## 1. 可以导出什么

75 个词条继续拥有各自预览。其中以下 5 个模板提供实际代码导出，不把其余词条伪装成可运行组件。

| 工作台词条 ID | 模板 | 实现 | 可调参数 |
| --- | --- | --- | --- |
| `cursor-spotlight` | `cursor-spotlight` | WebGL 聚光层 + DOM 抬升 | 半径、透明度、颜色、跟随时间常数、抬升距离、过渡时间 |
| `hover-lift` | `hover-lift` | DOM translate | 抬升距离、过渡时间 |
| `press-feedback` | `press-feedback` | DOM scale | 按压缩放、过渡时间 |
| `click-ripple` | `ripple` | DOM 波纹 | 波纹时间 |
| `staggered-reveal` | `slide-fade-list` | DOM translate / opacity | 时间、逐项延迟、位移、缓动 |

首个完整试点是暖金聚光与轻微抬升：`radius_px=160`、`opacity=0.12`、`color=#EBCB8B`、`follow_ms=80`、`lift_px=3`、`duration_ms=180`。保持米纸、墨绿、朱砂的现有品牌风格。

WebGL 只负责灯光；不把按压、列表等 DOM 效果强行改成 GPU 渲染。没有 WebGL 或上下文丢失时，会显示近似 CSS 渐变并标注回退。不同 GPU、浏览器、字体与宿主样式仍可能影响像素；共享参数和算法不等于跨所有平台逐像素保证。

## 2. 工作台使用流程

1. 选择上表中的词条；或者先用本地 Compiler 生成对应配方。
2. 调整参数，查看预览和设计描述。如果 Compiler 提示偏离原意，先确认冲突；未确认时禁止组件导出。
3. 在「组件代码」选择 **独立 Web 示例 / React 组件 / 视频工程**，下载 ZIP。没有密钥也能用，不调用模型。
4. 点击「打开独立示例」，核对同一参数组。独立页可以继续调参、切换五语和拖动 0–4000 ms 时间轴。
5. 根据下一节运行下载的工程。阅读参数、描述、来源、契约与许可，再接入自己的页面。

独立页相对地址：`effect-example.html?item=cursor-spotlight`。工作台、独立页和导出包共享 `effect-kit.js`、`effect-webgl.js`、`effect-timing.js`、`effect-contract.js` 与 `core.js`。每次导出捕获点击时的参数快照，下载期间继续调参不会改变这个快照。

## 3. ZIP 中的关键文件

| 文件 | 用途 |
| --- | --- |
| `effect.json` | 运行时参数唯一来源，包含模板、注册契约、描述模板、语言、来源与演示标签 |
| `intent.json` | 与工作台「单效果 JSON」一致的 schema_version:1 快照 |
| `brief.txt` | 与该快照一致的设计描述 |
| `export-manifest.json` | 项目版本、导出目标、参数、实际渲染方式与支持范围 |
| `compilation.json` | 从已确认的 Compiler 结果导出时附带的 IR / 配方快照；直接选词条时没有此文件 |
| `render-kit/` | 同一套框架无关渲染与校验代码，没有复制另一套近似效果 |
| `font.css`、`fonts/` | 演示字体与 OFL 许可；React 宿主决定是否加载 |
| `sync-export.mjs` | 修改保存参数后，重新校验并同步 JSON、描述与清单 |
| `LICENSE` | 本项目代码 MIT 许可；不替代字体或第三方依赖许可 |

下载包不包含模型密钥、浏览器账号状态或自动付费调用。源码与公开词条的人工审校是不同事项：导出功能没有把草稿变成审校完成内容。

## 4. 独立 Web 示例

解压后在目录里运行：

```sh
node serve.mjs
```

需要 Node.js 20+。打开 `http://localhost:4180`。没有 npm 依赖，不需要 API Key。不要直接双击 `index.html`：模块与 JSON 读取需要 HTTP 服务。

接入自己的卡片或按钮时，保留整个 `render-kit/` 目录：

```js
import {attachEffect, effectCSS} from './render-kit/effect-kit.js';

const spec = await (await fetch('./effect.json')).json();
const style = document.createElement('style');
style.textContent = effectCSS;
document.head.append(style);
const effect = attachEffect(document.querySelector('#my-card'), spec);

// 仅传这个模板已注册的参数；未知键与越界值会报错。
effect.update({lift_px: 4});

// 页面/组件卸载时调用，取消监听、帧循环和 GPU 资源。
// effect.dispose(); style.remove();
```

卡片应使用适当的可访问元素，例如原生 button。绑定器管理该元素的 translate / scale，以及列表直接子元素的 translate / opacity；不要同时用另一动画库操作这些属性。原有 transform 会保留，卸载时恢复绑定前的行内样式。列表最多 100 个直接元素子节点，改动子节点结构后需要重新绑定。

`mountEffect(host, spec)` 用于挂载品牌演示；`attachEffect(target, spec)` 用于绑定真实业务内容。控制器还提供 `renderAt(timeMs)`、`play()`、`spec` 和 `backend`。`renderAt()` 进入确定帧模式，`play()` 回到实际交互。

## 5. React 组件与 hook

将 `IntentEffect.jsx`、`effect.json`、`render-kit/` 放进现有 React 18/19 工程；打包器需要支持 JSX、ES modules 与 JSON 导入。效果库没有其他 React 运行依赖。宿主若要复现演示字体，需要加载导出包的 `font.css` 与字体文件。

```jsx
import {useRef} from 'react';
import {IntentEffect, useIntentEffect} from './IntentEffect.jsx';

export function Demo() {
  return <IntentEffect params={{lift_px: 4}} />;
}

export function MyCard() {
  const ref = useRef(null);
  useIntentEffect(ref, {params: {lift_px: 4}});
  return <button ref={ref}>我的业务卡片</button>;
}
```

这里的示例参数适用于聚光或抬升导出包。其他模板必须使用各自参数。`spec` 可覆盖默认 JSON；`timeMs={1000}` 用于确定帧渲染，省略时是真实交互。`reducedMotion` 可显式指定，未指定时使用系统偏好；`onBackend` 可观察 WebGL / CSS 回退。

`IntentEffect` 支持 children，但会增加绑定容器。列表 children 必须提供一个根列表元素，根列表的直接子项才会被逐项处理。需要保持业务 DOM 结构时优先使用 `useIntentEffect(ref, options)`，让 ref 指向原有卡片、按钮或列表。hook 在卸载和参数更新时清理旧控制器，支持 React StrictMode。

参数 prop 只改变运行中的组件，不重写下载的快照文件。服务端渲染不会运行效果，客户端挂载后才生效；这次验证不包含所有 SSR 框架适配。

## 6. 视频工程

导出的是 Remotion 工程，不是网站录像。运行：

```sh
npm install
npm run studio
npm run render
```

固定 React / Remotion 依赖在导出的 package.json。视频为 720 × 720、30 fps、120 帧、4 秒，输出 `out/effect.mp4`。构建与渲染可能下载依赖和浏览器，不会调用 AI。若使用已有 Chrome，可以在命令后附加 Remotion 的 `--browser-executable` 参数。

Remotion 4 的 WebGL 渲染使用 ANGLE；导出命令已经包含 `--gl=angle`。React 和 Remotion 保留各自许可，使用者需要阅读 [Remotion 许可](https://www.remotion.dev/license)，本项目 MIT 不会将第三方视频工具重新授权。[官方 WebGL 说明](https://www.remotion.dev/docs/webgl)

视频通过 `useCurrentFrame() / fps` 调用相同的 `effectFrame()`，任意帧可独立计算，不依赖上一帧。默认演示脚本：

| 效果 | 脚本行为 |
| --- | --- |
| 抬升 / 聚光 | 400 ms 悬停开始、1800 ms 离开；聚光目标在 400 / 900 / 1500 ms 移动 |
| 按压 | 650 ms 按下、1100 ms 松开 |
| 波纹 | 650 ms 中心点击 |
| 列表 | 200 ms 开始，按当前 delay_ms 逐项入场 |

这不是用户操作录像。真实交互由鼠标、焦点和键盘触发；脚本帧只是可重复的比较方式。视频明确使用 `reducedMotion=false` 呈现动画；网站交互遵循系统减少动态效果，触摸不会启用悬停聚光。

## 7. 参数改动后仍保持一致

需要永久修改导出包时，只编辑 `effect.json` 的已注册 params，然后运行：

```sh
node sync-export.mjs
```

命令先校验，再同步 effect.json、intent.json、brief.txt、manifest 的参数。描述由保留的模板重新生成；不要分别手改几份数字。若包含 compilation.json 且参数与原配方不一致，命令会拒绝更新；回到工作台重新理解、确认并导出，以免 IR 与实现矛盾。

复制包里的某段 CSS 不是完整效果导出。源代码、参数契约、字体、宿主布局和输入行为共同构成结果。默认品牌演示在相同浏览器和字体下比较；自定义业务内容仅共享行为与参数，不保证继承不同宿主样式后视觉完全一样。

## 8. 后续增加可导出效果的门槛

1. 先具备对应词条、来源和独立预览，保持受控参数与五语界面。
2. 为真实复用场景实现清理、键盘、触摸、减少动态效果及参数极值。
3. 在框架无关层实现，再提供 React 与确定帧适配，不分别抄三套参数算法。
4. 验证独立 Web、工作台、intent.json、brief.txt 与代码同参；检查任意顺序视频帧。
5. 通过上述验证后，才加入 `componentTemplates` 白名单。未实现的词条继续明确禁用代码导出。
6. 提供实际证据和作者署名，按[贡献指南](CONTRIBUTING.md)交给维护者审核，不自动合并。

本阶段先完善 Web。浏览器插件、原生移动端、REA 调查或联动保留为后续方向，本次不实现。
