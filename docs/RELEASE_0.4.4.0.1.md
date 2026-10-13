# 0.4.4.0.1 上线验收

本补丁同步 `0.4.4.0.0` 的实际上线与机器人验收结果，更新文档、版本和源码包。效果实现、模型请求和投稿运行代码不变。

## 实际发布

- [功能 PR #11](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/pull/11) 经维护者明确授权后合并，提交 `4bfd6244cf8059c33653ba76353ee208074f0c79`。
- [主分支 68 项检查](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/actions/runs/38381219895)与 [Pages 部署](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/actions/runs/38381219894)成功。公开网站返回版本 `0.4.4.0.0`。
- 实际公开工作台验证了代码导入、隔离运行、4px → 9px 参数更新、源码 ZIP 下载与完整压缩投稿。墨点像素由 1606 增为 6824，模型请求数为 0。
- 公开页面的 AI 代码按钮另外通过一次明确的可控模型响应测试：实际发送原创代码请求、运行返回模块、调参和导出；没有改用词库候选或模板。

## 真实机器人投稿

1. 从公开工作台得到完整源码与参数的 `intentkit-gzip` 投稿内容，以维护者账号创建明确标记为测试的 [Issue #12](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/issues/12)。
2. [真实 Actions](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/actions/runs/38382217351)由 `github-actions[bot]` 创建 [待审 PR #13](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/pull/13)，只新增 `community/cases/case-12.json`。
3. 核对 schema_version 2、kind generated、真实 GitHub 作者、完整 HTML / CSS / JavaScript 与 dot_size 9，和公开下载的 ZIP 完全相同。
4. GitHub 初次将机器人 PR 检查设为 `action_required`。维护者只批准检查运行，未批准收录；[检查成功](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/actions/runs/38382245120)。
5. 编辑同一投稿，保持源码与参数不变，[重试工作流](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/actions/runs/38382874387)成功；仍为 PR #13，提交 SHA 未变化，无重复 PR 或提交。
6. 关闭 Issue 后，机器人自动关闭 PR #13。测试未合并，独立测试分支已移除；main SHA 与公开案例列表在测试前后保持不变。

测试不是用户作品，未收录官网。没有审核、合并或修改其他用户的投稿。main 继续要求必需检查、code owner 和人工审核；机器人没有审批或自动合并能力。

## 仍未验证

真实密钥的付费模型生成尚未实测。可控响应测试不等于模型质量验收；生成代码仍需核对语义、参数生效、可访问性和资源开销。隔离帧没有 CPU 配额。此发布不添加账号系统或密钥持久化。

[代码使用与边界](GENERATED_EFFECTS.md) · [初始功能检查](RELEASE_0.4.4.0.0.md) · [社区收录流程](COMMUNITY_PR.md)
