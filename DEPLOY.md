# GitHub 部署与持续迭代

目标仓库：https://github.com/yichu-zql/tuomaoba-content-gpt-studio

## 网页
将源码文件放在 main 分支根目录，在仓库 Settings → Pages 选择 Deploy from a branch → main → /(root)。预期发布地址是 https://yichu-zql.github.io/tuomaoba-content-gpt-studio/ ，只有 Pages 实际发布完成后才能作为可用链接交付。

首次可以只发布静态网页：本地快速生成、模板、拆对标、图片、备份功能不需要GPT服务。GPT按钮会提示先填写连接。所有素材数据为公开网页可下载内容，勿提交私人客户信息。

## GPT 接口（独立部署）
GitHub Pages 不执行服务端代码。server/ 提供可部署到 Cloudflare Workers 的接口。也可由后续维护者按相同协议部署到已有服务器。该部分目前为待配置模板，未自动创建云账号、产生模型调用或付费资源。

1. 在 server/wrangler.toml 填写 `ALLOWED_ORIGIN = "https://yichu-zql.github.io"`。来源不带仓库路径。填写 `OPENAI_MODEL` 为自己账号可用且支持 Responses JSON 模式的模型名称。
2. 使用自己的 Cloudflare 账号部署 server/worker.mjs；Wrangler CLI 的官方入口是 https://developers.cloudflare.com/workers/wrangler/ 。
3. 通过部署平台密钥设置添加 `OPENAI_API_KEY` 和随机长口令 `ACCESS_TOKEN`，不要填在网页、源码、提交记录或聊天里。
4. 部署完成后，在网页“GPT 设置”填入 `https://你的服务域名/api/gpt` 和团队访问口令。
5. 用一条不含私人信息的素材验证生成与深度拆解，并检查模型用量。接口口令仅在页面内存中保存，刷新后重填。

接口固定调用 OpenAI Responses API，`store:false`，使用 JSON 模式并在前端检查关键字段。接口限制来源、鉴权、请求大小与超时。共享口令方案适用于受控首版试用；对外推广前，应增加用户身份、服务端配额和用量限制。不要将共享口令公开发布。

浏览器请求：`POST /api/gpt`，Authorization Bearer 口令，JSON `{task:"generate"|"breakdown",prompt:"..."}`。成功返回 `{data:{...}}`，错误返回 `{error:"面向用户的说明"}`。

## 技能与更新
项目技能位于 `.agents/skills/tuomaoba-breakdown/` 和 `.agents/skills/tuomaoba-create/`。它们是随仓库维护的技能，不是声称已经安装了某个外部插件。修改后在项目根目录运行 `node scripts/sync-skills.mjs`，再重新部署接口，确保网页服务使用新提示词。

运行 `node --test tests/*.test.mjs` 检查接口边界与生成结构；所有前端脚本可用 `node --check 文件名` 检查语法。提交新版本时同步更新 base.js 版本与日志、index.html 脚本版本参数、CHANGELOG.md。不要改变旧创意和门店ID。

现有门店照片与对标截图仍不包含在文字备份中。旧版数据不会自动同步，可在新版“备份/导入”手动导入旧版文字备份。导入会替换部分现有文字配置，首次迁移应先备份新版现有内容。

参考：[OpenAI结构化输出](https://developers.openai.com/api/docs/guides/structured-outputs)、[生产实践](https://developers.openai.com/api/docs/guides/production-best-practices)、[GitHub Pages建站](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)。
