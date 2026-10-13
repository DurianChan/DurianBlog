# DurianBlog

基于 Hugo + [FixIt v0.4.5](https://github.com/hugo-fixit/FixIt/tree/v0.4.5) 的中文博客，使用 GitHub Pages 自动部署，评论和留言板由 giscus + GitHub Discussions 提供。

- 博客：https://durianchan.github.io/DurianBlog/
- 留言板：https://durianchan.github.io/DurianBlog/guestbook/
- 讨论：https://github.com/DurianChan/DurianBlog/discussions

## 直接在 GitHub 上写文章

1. 在仓库中打开 `content/posts`，点击 **Add file → Create new file**，文件名可用 `my-first-post/index.md`。也可以在电脑上写好后用 **Upload files** 上传，保持目录结构。
2. 使用以下文章头信息，然后写 Markdown 正文：

```markdown
---
title: "我的文章标题"
date: 2026-10-13T08:00:00+08:00
draft: false
categories: ["技术"]
tags: ["Hugo", "笔记"]
description: "一句话介绍文章"
---

这里是摘要。

<!--more-->

## 第一个小节

这里是正文。
```

3. 提交到 `main` 后，GitHub Actions 会构建并发布。可在 **Actions → Deploy Hugo blog** 查看进度。

日期请改为实际发布时间；未来日期和 `draft: true` 的文章不会正式发布。二级、三级标题会自动生成文章侧边大纲。分类和标签也会自动生成列表页，点击即可查看对应文章。

图片建议和文章放在同一目录，例如 `content/posts/my-first-post/photo.jpg`，在正文写 `![图片说明](photo.jpg)`。发布后尽量保留文章目录名称：giscus 使用页面路径关联讨论，更改路径会影响旧评论的显示。

## 本地预览（Windows PowerShell）

### 使用文章管理后台（推荐）

在当前电脑双击根目录 `preview.bat`，会启动 Decap CMS、本地文件服务和 Hugo，并打开管理页面。`.bat` 已被 Git 忽略，不上传到 GitHub。

- 管理后台：http://localhost:1314/admin/
- 博客预览：http://localhost:1315/DurianBlog/

首次进入点击“登录”即可，这是本地入口，不需要输入 GitHub 账号。三个服务仅监听本机地址。使用期间保持启动窗口开启，结束时在窗口按 `Ctrl+C`，会一起停止服务。若提示端口被占用，请先关闭上一次管理窗口。

1. 进入“文章”，点击“＋ 文章”新建，或点击现有文章编辑。
2. 填写标题、正文、分类、标签。发布时间可以点击“现在”填入。
3. 新文章默认开启“草稿”。准备上线时关闭它，并确保发布时间不晚于当前时间。
4. 点击“发布 → 立即发布”将修改保存到本地。**Decap 在本地模式也使用“发布”字样，它不会提交 Git 或更新线上博客。**
5. 点击“查看发布”或打开博客预览检查效果。预览包含草稿和未来日期文章；CMS 内的预览仅展示正文排版，完整 FixIt 大纲和短代码效果以博客预览为准。
6. 满意后点击后台右下角 **“发布到 GitHub”**，检查文件清单（包含新增、修改、删除），点击 **“确认并推送”**。成功后点击“查看网站部署进度”，等待 GitHub Actions 更新线上博客。删除文章也遵循这一流程。

“发布到 GitHub”会提交所有已保存的 `content/` 和 `static/images/uploads/` 改动，包括固定页面和文章目录内的图片；配置、主题代码和 `.bat` 不在发布范围内。未保存的编辑不会进入本次发布。草稿会同步到仓库，但不会显示在线上博客。

发布入口复用电脑现有 Git 凭据和系统 HTTP 代理，不需要在网页里填写令牌。若认证失效，请通过 GitHub CLI 或 GitHub Desktop 重新登录。存在已暂存的改动、分支不为 `main`、或本地与远程提交不同步时，会提示先处理，不会强制覆盖远程内容。GitHub Desktop 仍可作为手动同步入口。

若提交成功但推送失败，修改和提交都会保留。重新打开发布窗口，点击“重试推送”即可；重试只推送上一次提交，此后新保存的内容需要另行发布。推送成功表示代码已到 GitHub，不代表部署已经完成。

编辑页有“删除内容”，操作前会确认。文章内上传的图片保存在该文章目录，可使用相对路径；顶栏“媒体”管理的是共享图片目录 `static/images/uploads/`。删除文章后如有未使用的图片，请确认后再清理。固定页面可编辑“关于”和“留言板介绍”，不包含删除入口。

后台代码在 `local-admin/`，只由本地启动程序提供，不会生成到 GitHub Pages。编辑器依赖已下载到 `node_modules/`，后续启动不需要从 CDN 加载编辑器。

在新电脑安装 Node.js 22 或更新版本、Hugo Extended 0.167.0 后，可使用：

```powershell
npm ci
npm run editor
```

### 只启动博客预览

本次搭建下载的 Hugo Extended 0.167.0 在 `.tools/hugo/hugo.exe`，该目录不提交到 GitHub。

```powershell
.\scripts\preview.ps1
```

浏览器打开命令输出的本地地址。预览包含草稿；评论默认在生产环境启用，需要检查评论时可运行 `.tools/hugo/hugo.exe server --environment production`。

若在新电脑克隆仓库，请安装 **Hugo Extended 0.167.0** 并加入 PATH。主题源码已包含在仓库中，不需要额外克隆子模块。

生成新草稿：

```powershell
.\.tools\hugo\hugo.exe new content posts/my-new-post/index.md
```

正式构建：

```powershell
.\scripts\build.ps1
```

## 网站配置

全站左下角显示本地音乐播放器，默认收起歌单，点击播放，按配置顺序播放并循环。MP3 放在 `static/music/`，在 `hugo.toml` 中通过 `[[params.music.tracks]]` 配置每首歌的 `name`、`artist`、`url`（例如 `music/example.mp3`），可选 `cover`。`[params.music]` 的 `enable = false` 可关闭播放器。播放器复用 FixIt 的 APlayer 和暗色样式，音乐随站点部署，无需音乐平台接口。普通页面跳转会重新加载播放器。

- `hugo.toml`：站点标题、介绍、导航、搜索、右侧大纲、giscus。
- `content/posts/`：文章（Markdown）。
- `content/about/index.md`：关于页面。
- `content/guestbook/index.md`：留言板。
- `.github/workflows/pages.yml`：GitHub Pages 自动部署。
- `themes/fixit-release/`：FixIt v0.4.5 发布包，保留上游 MIT 许可证。优先通过根目录 `layouts/`、`assets/` 覆盖模板或样式，避免直接修改主题文件。

giscus 使用当前仓库的 `Announcements` Discussion 分类。管理评论请前往仓库 Discussions。仓库需保持公开、启用 Discussions，并给 [giscus GitHub App](https://github.com/apps/giscus) 保留此仓库的访问权限。配置中的 repoId/categoryId 是公开标识，不是密钥。

当前保留 FixIt 原生搜索结果和交互动效；自定义搜索结果卡片、主页版式和 Paper 风格动效可在后续迭代中调整。

## 配色与字体

背景和黑白文字参考 [Paper 演示站](https://hugo-paper.vercel.app/)（2026-10-13）：浅色背景 `#faf8f1`，深色背景为其叠加 85% 黑色后的 `#262524`，正文分别使用黑色和白色。使用 Paper 的系统无衬线字体栈，具体字形由设备已有字体决定，中文由浏览器自动回退；正文为 18px、1.8 倍行高。

`assets/css/_override.scss` 定义配色及字体，`assets/css/_custom.scss` 定义排版细节，`static/css/giscus-paper-*.css` 为评论区提供对应配色。通过 FixIt 扩展点加载，未修改主题源码。若更换域名或部署路径，请同步更新 `hugo.toml` 中的 giscus 样式地址。

## 网易云评论与 Live2D

已安装 `shortcode-mmt-netease` 和 `hugo-shortcode-plugins-live2d`，源码版本记录在 `themes/COMPONENTS.md`。

留言板已展示随机网易云评论，点击评论卡片可换一条，每 60 秒自动刷新；默认使用上游示例歌单。编辑 `content/guestbook/index.md` 中的 `mid` 可更换歌单 ID。也可以在任意 Markdown 页面插入（同一页面只使用一次）：

```text
{{< mmt-netease mid="2280569152" autoplay="false" >}}
```

默认只显示评论，音乐播放器需额外设置 `player="true"`，且依赖第三方 Meting 服务；其可用性及歌曲能否播放由外部服务决定。评论接口暂时不可用时，会显示重试提示。

原 Live2D 已替换为同款蓝发女仆的逐帧动画宠物。它位于桌面左下角，窄屏（小于 1024px）隐藏以避免遮挡文章。包含待机眨眼、挥手、开心、休息四组动作：点击角色可互动，按住可拖动；悬停或键盘聚焦后可通过按钮打招呼、休息或隐藏。隐藏后用左下角“显示宠物”按钮恢复。

新角色使用透明 PNG 图集和 Canvas 播放，属于逐帧动画，不是 Live2D 骨骼模型。遵循系统减少动态效果的设置，页面切到后台时暂停动画。素材完全从本博客加载。

- `static/images/mascot/deepseek-atlas.png`：新绘制的 4×4、16 帧动画图集。
- `static/images/mascot/frames.json`：每帧的裁切范围，播放时统一角色大小和脚底位置。
- `static/images/mascot/GENERATION.md`：参考来源与绘图提示词。
- `layouts/_partials/custom/mascot.html`：角色入口。
- `static/js/blog-mascot.js`：动作、点击、拖动与隐藏逻辑。
- `static/css/blog-mascot.css`：显示位置和尺寸（默认 180px）。

原 Live2D 动画文件仍位于 `themes/plugins-live2d/static/live2d-widget/model/`，原入口保留在 `layouts/_partials/custom/live2d.html`。如需恢复，将 `hugo.toml` 中的 `customPartials.assets` 改回 `['custom/live2d.html']`。
