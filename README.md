![logo](data/wenyan-mcp.png)

# 文颜 MCP Server

[![npm](https://img.shields.io/npm/v/@wenyan-md/mcp)](https://www.npmjs.com/package/@wenyan-md/mcp)
[![License](https://img.shields.io/github/license/caol64/wenyan-mcp)](LICENSE)
![NPM Downloads](https://img.shields.io/npm/dm/%40wenyan-md%2Fmcp)
[![Stars](https://img.shields.io/github/stars/caol64/wenyan-mcp?style=social)](https://github.com/caol64/wenyan-mcp)

「文颜」是一款多平台排版美化工具，让你将 Markdown 一键发布至微信公众号、知乎、今日头条等主流写作平台。

**文颜**现已推出多个版本：

* [macOS App Store 版](https://github.com/caol64/wenyan) - MAC 桌面应用
* [跨平台版本](https://github.com/caol64/wenyan-pc) - Windows/Linux 跨平台桌面应用
* [CLI 版本](https://github.com/caol64/wenyan-cli) - CI/CD 或脚本自动化发布公众号文章
* [MCP 版本](https://github.com/caol64/wenyan-mcp) - 让 AI 自动发布公众号文章
* [嵌入版本](https://github.com/caol64/wenyan-core) - 将文颜的核心功能嵌入 Node 或者 Web 项目

文颜 MCP Server 是一个基于模型上下文协议（Model Context Protocol, MCP）的服务器组件，支持将 Markdown 格式的文章发布至微信公众号草稿箱，并使用与 [文颜](https://yuzhi.tech/wenyan) 相同的主题系统进行排版。

https://github.com/user-attachments/assets/2c355f76-f313-48a7-9c31-f0f69e5ec207

使用场景：

- [让AI帮你管理公众号的排版和发布](https://babyno.top/posts/2025/06/let-ai-help-you-manage-your-gzh-layout-and-publishing/)

## 功能

- 列出并选择支持的文章主题
- 使用内置主题对 Markdown 内容排版
- 发布文章到微信公众号草稿箱
- 自动上传本地或网络图片
- **✨ 新增功能**：
  - **Mermaid 图表渲染**: 自动将 Markdown 中的 Mermaid 代码块转换为图片
  - **手绘风格转换**: 支持将图表转换为 Excalidraw 风格的手绘效果
  - **图片自动上传**: 支持将本地图片上传到腾讯云 COS
  - **完整 Pipeline**: 一键完成 mermaid 转换 → 图片上传 → 主题渲染 → 发布

## 主题效果

👉 [内置主题预览](https://yuzhi.tech/docs/wenyan/theme)

文颜采用了多个开源的 Typora 主题，在此向各位作者表示感谢：

- [Orange Heart](https://github.com/evgo2017/typora-theme-orange-heart)
- [Rainbow](https://github.com/thezbm/typora-theme-rainbow)
- [Lapis](https://github.com/YiNNx/typora-theme-lapis)
- [Pie](https://github.com/kevinzhao2233/typora-theme-pie)
- [Maize](https://github.com/BEATREE/typora-maize-theme)
- [Purple](https://github.com/hliu202/typora-purple-theme)
- [物理猫-薄荷](https://github.com/sumruler/typora-theme-phycat)

## 使用方式

### 方式一：本地安装（推荐）

```
npm install -g @wenyan-md/mcp
```

#### 与 MCP Client 集成

在你的 MCP 配置文件中加入以下内容：

```json
{
  "mcpServers": {
    "wenyan-mcp": {
      "name": "公众号助手",
      "command": "wenyan-mcp",
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret"
      }
    }
  }
}
```

> 说明：
>
> * `WECHAT_APP_ID` 微信公众号平台的 App ID
> * `WECHAT_APP_SECRET` 微信平台的 App Secret

---

### 方式二：编译运行

#### 环境要求

- **Node.js**: >= 18.0.0
- **包管理器**: pnpm >= 10.7.1 (推荐) 或 npm/yarn
- **系统依赖**: 
  - macOS/Linux: 支持命令行环境
  - Windows: 需要 WSL 或 Git Bash

#### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/caol64/wenyan-mcp.git
cd wenyan-mcp
```

2. **安装基础依赖**
```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

3. **安装开发依赖（包含 Mermaid CLI）**
```bash
# 开发依赖已包含在 package.json 中，安装时会自动安装
# 包括：
# - @mermaid-js/mermaid-cli: Mermaid 图表渲染
# - puppeteer: SVG 转 PNG（用于手绘风格文字渲染）
# - jsdom: SVG DOM 操作
# - sharp: 图片处理
# - roughjs: 手绘风格转换
```

4. **安装 Puppeteer 的 Chrome 浏览器（可选，推荐）**
   
   如果你需要使用手绘风格功能并且希望文字正确显示，需要安装 Chrome：

```bash
# 安装 Puppeteer 的 Chrome 浏览器
npx puppeteer browsers install chrome
```

   > **注意**：如果不安装 Chrome，手绘风格的图片仍可以生成，但文字可能会丢失（会回退到 Sharp 渲染）。

5. **验证安装**
```bash
# 检查 mermaid-cli
npx mmdc --version

# 检查 Puppeteer (如果已安装)
node -e "require('puppeteer').launch().then(b => {b.close(); console.log('Puppeteer OK')}).catch(e => console.log('Puppeteer:', e.message))"
```

6. **编译 TypeScript**
```bash
pnpm build
# 或
npm run build
```

#### 项目依赖说明

**生产依赖 (dependencies)**:
- `@modelcontextprotocol/sdk`: MCP 协议支持
- `@wenyan-md/core`: 文颜核心库
- `cos-nodejs-sdk-v5`: 腾讯云 COS SDK（图片上传）
- `dotenv`: 环境变量管理
- `remark`, `remark-gfm`: Markdown 解析
- `roughjs`: 手绘风格生成库
- `sharp`: 高性能图片处理（SVG/PNG/JPG 转换）
- `unified`: Markdown 处理框架
- `zod`: 配置验证

**开发依赖 (devDependencies)**:
- `@mermaid-js/mermaid-cli`: Mermaid 图表渲染 CLI 工具
- `@types/jsdom`, `@types/node`: TypeScript 类型定义
- `jsdom`: SVG DOM 操作和解析
- `puppeteer`: 浏览器自动化（用于手绘风格文字渲染）
- `typescript`: TypeScript 编译器
- `vitest`: 单元测试框架

#### 依赖安装说明

**关键依赖的作用**:

1. **@mermaid-js/mermaid-cli**: 
   - 将 Mermaid 代码渲染为 SVG/PNG
   - 必须安装，用于 `convert_mermaid` 功能

2. **puppeteer**: 
   - 用于手绘风格功能中的文字渲染
   - 可选，但不安装时文字可能丢失
   - 安装 Chrome: `npx puppeteer browsers install chrome`

3. **sharp**: 
   - SVG 转 PNG/JPG
   - 高性能图片处理
   - 自动安装

4. **roughjs**: 
   - 生成手绘风格效果
   - 自动安装

5. **jsdom**: 
   - 解析和操作 SVG DOM
   - 用于手绘风格转换
   - 自动安装

#### 与 MCP Client 集成

在你的 MCP 配置文件中加入以下内容：

```json
{
  "mcpServers": {
    "wenyan-mcp": {
      "name": "公众号助手",
      "command": "node",
      "args": [
        "Your/path/to/wenyan-mcp/dist/index.js"
      ],
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret"
      }
    }
  }
}
```

> 说明：
>
> * `WECHAT_APP_ID` 微信公众号平台的 App ID
> * `WECHAT_APP_SECRET` 微信平台的 App Secret

---

### 方式三：使用 Docker 运行（推荐）

适合部署到服务器环境，或与本地 AI 工具链集成。

#### 构建镜像

```bash
docker build -t wenyan-mcp .
```

或者指定`npm`镜像源。

```bash
docker build --build-arg NPM_REGISTRY=https://mirrors.cloud.tencent.com/npm/ -t wenyan-mcp .
```

#### 与 MCP Client 集成

在你的 MCP 配置文件中加入以下内容：

```json
{
  "mcpServers": {
    "wenyan-mcp": {
      "name": "公众号助手",
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-v", "/your/host/image/path:/mnt/host-downloads",
        "-e", "WECHAT_APP_ID=your_app_id",
        "-e", "WECHAT_APP_SECRET=your_app_secret",
        "-e", "HOST_IMAGE_PATH=/your/host/image/path",
        "wenyan-mcp"
      ]
    }
  }
}
```

> 说明：
>
> * `-v` 挂载宿主机目录，使容器内部可以访问本地图片。与环境变量`HOST_IMAGE_PATH`保持一致。你的 `Markdown` 文章内的本地图片应该都放置在该目录中，docker会自动将它们映射到容器内。容器无法读取在该目录以外的图片。
> * `-e` 注入docker容器的环境变量：
> * `WECHAT_APP_ID` 微信公众号平台的 App ID
> * `WECHAT_APP_SECRET` 微信平台的 App Secret
> * `HOST_IMAGE_PATH` 宿主机图片目录

## 微信公众号 IP 白名单

请务必将服务器 IP 加入公众号平台的 IP 白名单，以确保上传接口调用成功。
详细配置说明请参考：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

## 配置说明（Frontmatter）

为了可以正确上传文章，需要在每一篇 Markdown 文章的开头添加一段`frontmatter`，提供`title`、`cover`两个字段：

```md
---
title: 在本地跑一个大语言模型(2) - 给模型提供外部知识库
cover: /Users/lei/Downloads/result_image.jpg
---
```

* `title` 是文章标题，必填。
* `cover` 是文章封面，支持本地路径和网络图片：

  * 如果正文有至少一张图片，可省略，此时将使用其中一张作为封面；
  * 如果正文无图片，则必须提供 cover。

## 关于图片自动上传

* 支持图片路径：

  * 本地路径（如：`/Users/lei/Downloads/result_image.jpg`）
  * 网络路径（如：`https://example.com/image.jpg`）

## 示例文章格式

```md
---
title: 在本地跑一个大语言模型(2) - 给模型提供外部知识库
cover: /Users/lei/Downloads/result_image.jpg
---

在[上一篇文章](https://babyno.top/posts/2024/02/running-a-large-language-model-locally/)中，我们展示了如何在本地运行大型语言模型。本篇将介绍如何让模型从外部知识库中检索定制数据，提升答题准确率，让它看起来更“智能”。

## 准备模型

访问 `Ollama` 的模型页面，搜索 `qwen`，我们使用支持中文语义的“[通义千问](https://ollama.com/library/qwen:7b)”模型进行实验。

![](https://mmbiz.qpic.cn/mmbiz_jpg/Jsq9IicjScDVUjkPc6O22ZMvmaZUzof5bLDjMyLg2HeAXd0icTvlqtL7oiarSlOicTtiaiacIxpVOV1EeMKl96PhRPPw/640?wx_fmt=jpeg)
```

## 如何调试

使用 Inspector 进行简单调试：

```
npx @modelcontextprotocol/inspector
```

启动成功出现类似提示：

```
🔗 Open inspector with token pre-filled:
   http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=761c05058aa4f84ad02280e62d7a7e52ec0430d00c4c7a61492cca59f9eac299
   (Auto-open is disabled when authentication is enabled)
```

访问以上链接即可打开调试页面。

![debug](data/1.jpg)

1. 正确填写启动命令
2. 添加环境变量
3. 点击 Connect
4. 选择 Tools -> List Tools
5. 选择要调试的接口
6. 填入参数并点击 Run Tool
7. 查看完整参数

## 赞助

如果您觉得这个项目不错，可以给我家猫咪买点罐头吃。[喂猫❤️](https://yuzhi.tech/sponsor)

## 新增功能详细说明

### 1. Mermaid 图表渲染 (`convert_mermaid`)

自动识别 Markdown 中的 mermaid 代码块，渲染为 PNG/JPG 图片并替换为图片引用。

**前置要求**:
- 已安装 `@mermaid-js/mermaid-cli`（开发依赖中已包含）
- 验证安装: `npx mmdc --version`

**使用示例**:
```json
{
  "tool": "convert_mermaid",
  "arguments": {
    "filePath": "/absolute/path/to/file.md",
    "format": "png",
    "scale": 1.5,
    "background": "#ffffff"
  }
}
```

详细文档: [docs/MERMAID_GUIDE.md](docs/MERMAID_GUIDE.md)

### 2. 手绘风格转换

将 Mermaid 图表转换为手绘风格（类似 Excalidraw 效果）。

**前置要求**:
- 已安装 `roughjs`, `sharp`, `jsdom`（已包含在依赖中）
- **推荐**: 安装 Puppeteer 的 Chrome 浏览器以正确显示文字
  ```bash
  npx puppeteer browsers install chrome
  ```

**特性**:
- 自动应用手绘风格到所有图形元素
- 保留原有颜色和样式
- 支持自定义粗糙度和填充样式

详细文档: [docs/HAND_DRAWN_IMPLEMENTATION.md](docs/HAND_DRAWN_IMPLEMENTATION.md)

### 3. 图片上传到 COS (`image_upload_cos`)

自动收集 Markdown 中的本地图片，上传到腾讯云 COS，并替换为 COS URL。

**前置要求**:
- 配置腾讯云 COS 环境变量：
  ```env
  COS_SECRET_ID=your_secret_id
  COS_SECRET_KEY=your_secret_key
  COS_REGION=ap-guangzhou
  COS_BUCKET=your_bucket_name
  ```

**详细配置指南**: 📖 [腾讯云 COS 申请与配置指南](docs/COS_SETUP_GUIDE.md)

### 4. 完整发布 Pipeline (`publish_wechat`)

一键完成所有处理步骤：
1. Mermaid 转换（可选）
2. 图片上传到 COS（可选）
3. 主题渲染
4. 发布到微信公众号

**使用示例**:
```json
{
  "tool": "publish_wechat",
  "arguments": {
    "filePath": "/path/to/article.md",
    "theme": "orangeheart",
    "runPipeline": {
      "convertMermaid": true,
      "uploadImages": true
    }
  }
}
```

## 快速开始 - 完整安装指南

### 步骤 1: 克隆项目
```bash
git clone https://github.com/caol64/wenyan-mcp.git
cd wenyan-mcp
```

### 步骤 2: 安装 Node.js 依赖
```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 步骤 3: 安装 Mermaid CLI（验证）
```bash
# 验证是否已安装（开发依赖中已包含）
npx mmdc --version

# 如果未安装，会通过 npx 自动下载使用
```

### 步骤 4: 安装 Puppeteer Chrome（推荐，用于手绘风格文字渲染）
```bash
# 安装 Chrome 浏览器（约 200MB）
npx puppeteer browsers install chrome
```

> **注意**: 如果不安装，手绘风格功能仍可使用，但文字可能无法显示（会使用 Sharp 作为回退方案）。

### 步骤 5: 编译项目
```bash
pnpm build
```

### 步骤 6: 配置环境变量

创建 `.env` 文件：

```env
# 微信公众号配置（必需）
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret

# 腾讯云 COS 配置（图片上传功能需要，可选）
COS_SECRET_ID=your_cos_secret_id
COS_SECRET_KEY=your_cos_secret_key
COS_REGION=ap-guangzhou
COS_BUCKET=your_bucket_name

# Mermaid 配置（可选）
MERMAID_ENGINE=local
MERMAID_SCALE=1.5
MERMAID_BACKGROUND=#ffffff
MERMAID_FORMAT=png
```

### 步骤 7: 验证安装

```bash
# 运行测试
pnpm test

# 或手动测试 Mermaid 转换
node test/run-convert-mermaid.js
```

## 常见问题

### Q: Puppeteer 安装 Chrome 失败怎么办？

**解决方案**:
1. 检查网络连接（需要下载约 200MB）
2. 使用代理或镜像：
   ```bash
   export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors
   npx puppeteer browsers install chrome
   ```
3. 如果不安装，代码会自动回退到 Sharp（图形可见，文字可能丢失）

### Q: mermaid-cli 命令找不到？

**已自动处理**：代码会优先尝试 `mmdc`，失败后自动使用 `npx @mermaid-js/mermaid-cli`。

### Q: 手绘风格图片没有文字？

**原因**: Puppeteer 的 Chrome 未安装或渲染失败，回退到了 Sharp。

**解决方案**:
```bash
# 安装 Chrome
npx puppeteer browsers install chrome

# 验证
node -e "require('puppeteer').launch().then(b => {b.close(); console.log('OK')})"
```

### Q: 图片上传到 COS 失败？

检查环境变量配置：
- `COS_SECRET_ID`
- `COS_SECRET_KEY`
- `COS_REGION`
- `COS_BUCKET`

## License

Apache License Version 2.0
