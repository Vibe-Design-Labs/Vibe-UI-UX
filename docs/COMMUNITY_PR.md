# 工作台直接提交待审 PR

参数案例入口 `0.4.3.0.0` 已上线并完成机器人实测。`0.4.4.0.0` 增加生成代码案例，需本轮 PR 审核合并与 Pages 部署后启用。

## 给今天的第一批参与者

1. 登录自己的 GitHub 账号，打开 IntentKit 工作台。
2. 选择聚光与抬升、悬停抬升、按压、波纹、错落入场之一，调出满意的参数。也可以先使用本地 Compiler，再调参；有意图冲突时先确认。
3. 点击「提交收录 PR」，填写名称、适用场景、可选昵称与来源，确认公开提交 / MIT 许可。
4. 点击「前往 GitHub 确认投稿」。GitHub 打开的是预填的投稿入口，点击 **Submit new issue** 即完成提交。无需手动 Fork、下载 ZIP、安装工具或填写 GitHub Token。
5. 等待仓库的 **Create community review PR** 工作流完成，刷新投稿页面，从机器人回复中打开待审 PR。若工作流失败，页面会回复通用错误，正式代码与官网保持原样。

这里的 Issue 只是 GitHub 自带的投稿接收入口，结果是携带实际案例文件的 PR；不是收到建议以后还要作者手工 Fork。程序没有绕过 GitHub 登录或确认。投稿入口、PR 与 GitHub 账号公开可见，署名隐藏只隐藏案例页显示，不会使 GitHub 身份匿名。

## 投稿内容与结果

- 读取打开面板时的效果参数快照，不读取密钥、账号缓存或模型配置。之后改动效果，需要关闭面板重新打开。
- 参数案例包含模板、参数与元数据。新代码案例包含受限 artifact（HTML / CSS / JavaScript）与参数；两类都不包含用户密钥。
- Actions 使用与客户端相同的校验器，重新验证参数案例的五种白名单模板，或生成代码的独立契约；核对参数、有限文本、来源与许可，不执行投稿代码。
- GitHub 身份来自投稿事件中的真实 `issue.user.login`，不相信投稿 JSON 中自行填写的身份。
- 只写 `community/cases/case-N.json`，只提交到 `community/case-N` 分支，PR 的目标是 main。既有渲染器与其他文件不被改写。
- 重试相同投稿不再创建新 PR；内容相同不增加提交。编辑原投稿 JSON 或替换完整压缩数据块，可更新同一个仍然打开的 PR。关闭或已合并的 PR 不自动重开，请提交新的案例。关闭原投稿会撤回仍然打开的 PR，不会撤销已经合并的案例。
- 自动化不批准 PR、不合并、不部署；通过校验不等于维护者接受。

首批是已有效果的参数案例。它们沿用真实共享 Web / React / 视频实现，合并后可从社区案例页再次调参和导出。新版可投稿 AI 实际编写的单个原生 Web 效果；不自动升级为词库模板或 React / 视频组件。详见 [AI 代码流程与审核边界](GENERATED_EFFECTS.md)。

## 维护者怎么审核与收录

1. 打开机器人创建的 PR。确认只有对应的 community/cases JSON 文件发生变化。
2. 参数案例点击预览链接；代码案例检查 artifact 源码，下载案例 JSON 并导入工作台，在隔离帧中实测。同参数核对说明、资源开销、输入方式、减少动态效果、清理、参考、署名与许可。
3. 查看 **IntentKit validation**。GitHub 对 GITHUB_TOKEN 创建的 PR 可能要求仓库成员先点击 **Approve workflows to run**；批准检查运行不等于批准代码收录。
4. 需要修改时，在 PR 讨论。参数修订可通过原投稿 JSON 更新；更新后旧审批失效。
5. 确认接受后，审核 PR 并手动合并。只有 main 合并并 Pages 部署成功后，社区案例页才展示该案例。

main 的 CODEOWNERS、必需检查、审批撤销、对话解决、禁止强推 / 删除保持现有规则。普通用户无需官方写权限。机器人不是 code owner，没有维护者的审核豁免。

不接受时关闭 PR，保留公开讨论即可。不要为了收录一个案例移除保护、自动合并或把整个投稿者仓库的源码搬进来。

## 仓库配置

官方仓库采用 GitHub Actions 自带的短期 GITHUB_TOKEN，不新增服务器，不把维护者 Token 放进静态页面，也不需要 TokenDance Key。

需要在 **Settings → Actions → General → Workflow permissions** 启用 **Allow GitHub Actions to create and approve pull requests**。这个 GitHub 设置同时开放创建 / 审核接口；本项目工作流只使用创建 / 更新 PR，代码不调用审批和合并接口。默认工作流权限继续是 read，只有 intake 工作流显式取得 contents / pull-requests / issues 的 write 权限。main 的 code owner 审核仍由维护者完成。

如果组织策略禁止该设置，管理员需要解除相应限制；客户端不会为绕过策略索取个人 Token。Fork 用户需要在自己仓库完成同样配置。Pages 的构建自动读取 GITHUB_REPOSITORY，投稿入口指向自己的仓库；本地构建默认官方仓库，可用 INTENTKIT_SUBMISSION_REPOSITORY 指定其他已配置仓库。

## 实际文件与维护

| 位置 | 作用 |
| --- | --- |
| public/community-submit.js | 快照、五语面板、GitHub 投稿确认入口 |
| public/community-core.js | 客户端、Actions、构建共享的闭合数据契约 |
| scripts/community-intake.mjs | 读取可信事件身份、生成独立数据提交与待审 PR |
| .github/workflows/community-intake.yml | 默认分支上的投稿接收自动化，不执行投稿者代码 |
| community/cases/ | 已审核合并的案例数据 |
| public/community.html / community.js | 实际交互预览、署名和案例链接；每页最多 6 个实例 |
| tests/community.test.mjs | 参数、许可、身份、幂等、隔离写入、拒绝越界与异常分支 |

构建重新验证案例、文件名、模板、描述与参数，然后生成 community-cases.json。社区案例不会冒充新的术语或修改词库审校状态。署名 JSON 与普通代码贡献的 docs/contributions 记录是两种入口，互相链接即可，不要求把同一案例重复提交。

## 问题排查

- **跳到 GitHub 却没出现 PR：** 先确认已点击 Submit new issue，再查看投稿对应的 Actions；只打开预填页面不会创建记录。
- **没收到机器人回复：** 确认工作流已经合并到默认分支、Actions 开启、创建 PR 权限允许；不要删除投稿标题前缀或 JSON 标记。
- **校验失败：** 不修改 schema 或模板 ID，不添加字段，保留所有参数并检查范围；确认公开许可。缩短长文字 / 来源可以避免链接过长。
- **机器人提示权限错误：** 检查仓库和组织的 Actions 设置。编辑原投稿可触发重试；不会写入 main。
- **PR 检查等待：** 维护者批准运行检查，再正常审核；不要把批准运行当成合并。
- **案例已合并但官网没出现：** 检查 Deploy GitHub Pages 是否成功，再强制刷新。
- **不想公开：** 不点击 GitHub 提交。数据发送前可以关闭面板；GitHub 提交后内容已经公开，不能承诺删除会消除所有历史记录。

[GitHub Issue 预填](https://docs.github.com/en/enterprise-cloud%40latest/issues/tracking-your-work-with-issues/using-issues/creating-an-issue) · [工作流触发规则](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow) · [Actions 权限设置](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
