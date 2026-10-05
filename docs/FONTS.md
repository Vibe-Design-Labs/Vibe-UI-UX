# 字体与第三方许可

参考图片未标明字体名称。此版本使用接近其自然手写气质的开源字体，不宣称已识别或使用图片中的同款字体，也不分发参考图片。

| 用途 | 原始字体 | Web 子集名称 | 原始来源与许可 |
| --- | --- | --- | --- |
| 中文大标题 | Ma Shan Zheng / 马善政毛笔楷体 | IntentKit Brush | [Google Fonts 源码](https://github.com/google/fonts/tree/main/ofl/mashanzheng) · public/fonts/MaShanZheng-OFL.txt |
| 正文、控件、日语与韩语 | LXGW WenKai / 霞鹜文楷 | IntentKit Notes | [作者仓库](https://github.com/lxgw/LxgwWenKai) · public/fonts/WenKai-OFL.txt |
| 英文、德文标题与手写注记 | Caveat | IntentKit Script | [Google Fonts 源码](https://github.com/google/fonts/tree/main/ofl/caveat) · public/fonts/Caveat-OFL.txt |

这些字体使用 SIL Open Font License 1.1。项目应用代码的 MIT 许可不覆盖字体；再分发时保留三个完整 OFL 文件及作者版权声明。Web 文件经过子集化与改名，遵守保留字体名称要求，未修改字形设计。字体不是项目原创字形。

字体自托管，没有 Google Fonts 运行时依赖。三份 WOFF2 共约 651 KiB，内含当前页面和词条所需字符，以及拉丁、德文附加字符、假名和常用符号。新增未收录字符会由系统字体回退；新增词条或翻译后应重新生成子集。

## 重新生成，无需 GPT 或模型 API

平时运行网站不需要字体制作依赖。维护字体时单独安装：

```sh
python -m pip install fonttools brotli
python scripts/subset-fonts.py /path/to/original-fonts
npm run build
```

将上游 TTF 保存到该目录（不要提交大型原始字体）：

- MaShanZheng-Regular.ttf：[下载](https://raw.githubusercontent.com/google/fonts/main/ofl/mashanzheng/MaShanZheng-Regular.ttf)
- LXGWWenKai-Regular.ttf：[下载](https://raw.githubusercontent.com/lxgw/LxgwWenKai/main/fonts/TTF/LXGWWenKai-Regular.ttf)，本轮使用 v1.522。
- Caveat.ttf：[下载](https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf)，保留变量字体。

上游 main 链接可能更新。public/fonts/manifest.json 记录本轮原始文件 SHA-256、子集字形数与输出大小，便于确认文件来源。若改用其他版本，应同时更新许可、清单并检查全部五语界面。

子集脚本只读取 public/ 下 HTML/JS/JSON 和 content/ 内容，不调用 AI。中文标题使用毛笔字；信息密集的控件使用较易读的文楷。字号和布局参数在 public/polish.css，业务演示参数仍由 previews/registry.json 管理。
