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

- `hugo.toml`：站点标题、介绍、导航、搜索、右侧大纲、giscus。
- `content/posts/`：文章（Markdown）。
- `content/about/index.md`：关于页面。
- `content/guestbook/index.md`：留言板。
- `.github/workflows/pages.yml`：GitHub Pages 自动部署。
- `themes/fixit-release/`：FixIt v0.4.5 发布包，保留上游 MIT 许可证。优先通过根目录 `layouts/`、`assets/` 覆盖模板或样式，避免直接修改主题文件。

giscus 使用当前仓库的 `Announcements` Discussion 分类。管理评论请前往仓库 Discussions。仓库需保持公开、启用 Discussions，并给 [giscus GitHub App](https://github.com/apps/giscus) 保留此仓库的访问权限。配置中的 repoId/categoryId 是公开标识，不是密钥。

当前保留 FixIt 原生搜索结果和交互动效；自定义搜索结果卡片、主页版式和 Paper 风格动效可在后续迭代中调整。
