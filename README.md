![logo](data/wenyan-mcp.png)

# Markdown2WeChat MCP Server

[![npm](https://img.shields.io/npm/v/@wenyan-md/mcp)](https://www.npmjs.com/package/@wenyan-md/mcp)
[![License](https://img.shields.io/github/license/caol64/wenyan-mcp)](LICENSE)
![NPM Downloads](https://img.shields.io/npm/dm/%40wenyan-md%2Fmcp)
[![Stars](https://img.shields.io/github/stars/caol64/wenyan-mcp?style=social)](https://github.com/caol64/wenyan-mcp)

**Markdown2WeChat** 是一个基于模型上下文协议（Model Context Protocol, MCP）的服务器组件，让 AI 助手自动帮你将 Markdown 格式的文章发布至微信公众号草稿箱。

通过简单的提示词，AI 可以帮你：
- 🎨 自动转换 Mermaid 图表为图片
- ✏️ 支持手绘风格图表
- 📤 自动上传本地图片到腾讯云 COS
- 🎭 应用多种主题样式
- 🚀 一键发布到微信公众号

**重要特性**：**原文不会被修改**！所有转换操作都会创建新文件（`.converted.md`、`.cos.md`），便于预览和确认效果。

https://github.com/user-attachments/assets/2c355f76-f313-48a7-9c31-f0f69e5ec207

使用场景：

- [让AI帮你管理公众号的排版和发布](https://babyno.top/posts/2025/06/let-ai-help-you-manage-your-gzh-layout-and-publishing/)

## 功能

- ✅ 列出并选择支持的文章主题
- ✅ 使用内置主题对 Markdown 内容排版
- ✅ 发布文章到微信公众号草稿箱
- ✅ **Mermaid 图表渲染**: 自动将 Markdown 中的 Mermaid 代码块转换为图片
- ✅ **手绘风格转换**: 支持将图表转换为手绘风格效果（类似 Excalidraw）
- ✅ **图片自动上传**: 支持将本地图片上传到腾讯云 COS
- ✅ **完整 Pipeline**: 一键完成 mermaid 转换 → 图片上传 → 主题渲染 → 发布
- ✅ **文件保护机制**: 所有转换操作创建新文件，原文保持不变

## 主题效果

👉 [内置主题预览](https://yuzhi.tech/docs/wenyan/theme)

本项目采用了多个开源的 Typora 主题，在此向各位作者表示感谢：

- [Orange Heart](https://github.com/evgo2017/typora-theme-orange-heart)
- [Rainbow](https://github.com/thezbm/typora-theme-rainbow)
- [Lapis](https://github.com/YiNNx/typora-theme-lapis)
- [Pie](https://github.com/kevinzhao2233/typora-theme-pie)
- [Maize](https://github.com/BEATREE/typora-maize-theme)
- [Purple](https://github.com/hliu202/typora-purple-theme)
- [物理猫-薄荷](https://github.com/sumruler/typora-theme-phycat)

---

## 📝 提示词使用指南（重点）

这是最常用的功能！通过自然语言提示词，让 AI 帮你完成各种任务。

### 核心概念

**文件保护机制**：所有转换操作都会创建新文件，原文永远不会被修改！

- `文章.md`（原文）→ `文章.converted.md`（Mermaid 转换为图片）→ `文章.cos.md`（图片链接替换为 COS URL）

### 场景 1: 完整发布流程（最常用）

**一键发布，自动处理所有内容**：

```
请使用 publish_wechat 工具发布以下文件到微信公众号：
文件路径：/Users/xuyehua/Code/markdown2wechat-mcp/test/article.md
启用完整 Pipeline 流程（自动转换 Mermaid 代码块为图片并上传所有图片到 COS）
```

**或者更简洁**：

```
使用 publish_wechat 工具发布文件到微信公众号，启用完整自动化流程：
- 文件路径：[你的 Markdown 文件绝对路径]
- 启用 Pipeline：convertMermaid: true, uploadImages: true
```

**工作流程**：
1. 自动检测 Mermaid 代码块 → 转换为 PNG 图片 → 创建 `文章.converted.md`
2. 收集所有本地图片 → 上传到 COS → 创建 `文章.cos.md`
3. 应用主题样式 → 发布到微信公众号

### 场景 2: 只转换 Mermaid 为图片

**提示词**：

```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/article.md
```

**结果**：创建 `文章.converted.md`，Mermaid 代码块替换为图片链接，原文保持不变。

### 场景 3: 启用手绘风格

**简单启用**：

```
请使用 convert_mermaid 工具处理文件：[文件路径]
启用手绘风格，启用颜色随机化和填充样式随机化
```

**完整参数**：

```
请使用 convert_mermaid 工具处理文件：[文件路径]
启用手绘风格，参数：
handDrawn: {
  enabled: true,
  randomizeColors: true,
  randomizeFillStyle: true,
  groupColorsByBlock: true,
  roughness: 1.5,
  fillStyle: "hachure"
}
```

**参数说明**：
- `randomizeColors: true` - 随机化颜色（每个元素使用不同的随机颜色）
- `randomizeFillStyle: true` - 随机化填充样式（每个元素使用不同的填充模式）
- `groupColorsByBlock: true` - 按内容块分组颜色（同一逻辑块使用相同颜色）

### 场景 4: 只上传图片到 COS

**提示词**：

```
请使用 image_upload_cos 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/article.md
```

**结果**：创建 `文章.cos.md`，本地图片链接替换为 COS URL，原文保持不变。

### 场景 5: 只发布（不做任何转换）

**提示词**：

```
使用 publish_wechat 工具发布文件到微信公众号：
文件路径：/path/to/your/article.md
（不启用 Pipeline，直接发布）
```

**适用场景**：
- 文件中没有 Mermaid 代码块
- 图片已经使用外部 URL
- 只需要快速发布，不需要额外处理

### 场景 6: 自定义格式和尺寸

**提示词**：

```
请使用 convert_mermaid 工具处理文件：[文件路径]
格式：jpg，缩放比例：2，背景色：#f0f0f0
```

### 提示词最佳实践

1. **明确指定文件路径**：使用绝对路径
2. **明确说明需求**：
   - "启用完整 Pipeline" = 转换 Mermaid + 上传图片
   - "只转换 Mermaid" = 仅转换图表
   - "只上传图片" = 仅上传到 COS
   - "直接发布" = 不转换，直接发布
3. **启用手绘风格**：明确说明 "启用手绘风格" 和是否启用颜色随机化

### 更多提示词示例

📖 详细文档：[提示词使用示例](docs/PROMPT_EXAMPLES.md)

---

## 使用方式

### 方式一：本地安装（推荐）

```bash
npm install -g @wenyan-md/mcp
```

#### 与 MCP Client 集成

在你的 MCP 配置文件中加入以下内容：

```json
{
  "mcpServers": {
    "markdown2wechat": {
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
- `@wenyan-md/core`: 核心库
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
    "markdown2wechat": {
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

### 方式三：使用 Docker 运行

适合部署到服务器环境，或与本地 AI 工具链集成。

#### 构建镜像

```bash
docker build -t markdown2wechat-mcp .
```

或者指定`npm`镜像源。

```bash
docker build --build-arg NPM_REGISTRY=https://mirrors.cloud.tencent.com/npm/ -t markdown2wechat-mcp .
```

#### 与 MCP Client 集成

在你的 MCP 配置文件中加入以下内容：

```json
{
  "mcpServers": {
    "markdown2wechat": {
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
        "markdown2wechat-mcp"
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

---

## 配置说明

### 环境变量配置

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
COS_BASE_URL=https://your-bucket.cos.region.myqcloud.com

# Mermaid 配置（可选）
MERMAID_ENGINE=local
MERMAID_SCALE=1.5
MERMAID_BACKGROUND=#ffffff
MERMAID_FORMAT=png

# 手绘风格配置（可选）
MERMAID_HAND_DRAWN_ENABLED=false
MERMAID_HAND_DRAWN_ROUGHNESS=1.5
MERMAID_HAND_DRAWN_FILL_STYLE=hachure
```

### Frontmatter 配置

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

### 微信公众号 IP 白名单

请务必将服务器 IP 加入公众号平台的 IP 白名单，以确保上传接口调用成功。
详细配置说明请参考：[https://yuzhi.tech/docs/wenyan/upload](https://yuzhi.tech/docs/wenyan/upload)

### 腾讯云 COS 配置

**详细配置指南**: 📖 [腾讯云 COS 申请与配置指南](docs/COS_SETUP_GUIDE.md)

## 完整 Pipeline 流程

### 工作流程

当使用 `publish_wechat` 工具并启用 Pipeline 时：

1. **Mermaid 转换**：自动检测并转换所有 Mermaid 代码块为 PNG 图片
2. **代码备份**：保存原始 Mermaid 代码到 `.mermaid-backup` 目录
3. **创建转换文档**：创建 `.converted.md` 文件（Mermaid 代码块已替换为图片链接，**原文保持不变**）
4. **图片收集**：收集所有本地图片（包括 Mermaid 生成的图片）
5. **COS 上传**：上传所有图片到腾讯云 COS
6. **创建 COS 文档**：创建 `.cos.md` 文件（本地图片链接已替换为 COS URL，**上一步文档保持不变**）
7. **主题渲染**：应用主题样式
8. **发布到微信**：使用最终文档（`.cos.md`）提交到微信公众号草稿箱

### 文件保护机制

**原文不会被修改**！所有转换操作都会创建新文件：
- `文章.md`（原文）→ `文章.converted.md`（Mermaid 转换为图片）→ `文章.cos.md`（图片链接替换为 COS URL）
- 每个步骤都会创建新文件，便于预览和确认效果
- 最终发布到微信公众号使用的是最后一个文档（`.cos.md`）

### 默认行为

**如果不启用 Pipeline**（或设置但两个选项都为 `false`）：

- ✅ 直接读取 Markdown 文件内容（不进行任何转换）
- ✅ 应用主题样式
- ✅ 发布到微信公众号草稿箱

**不会执行的操作：**
- ❌ 不会转换 Mermaid 代码块（如果文件中有 Mermaid 代码，会保持原样）
- ❌ 不会上传图片到 COS（本地图片路径保持原样）
- ❌ 不会替换图片链接

### 详细文档

📖 [完整 Pipeline 流程使用指南](docs/PIPELINE_USAGE.md)

## 功能详细说明

### 1. Mermaid 图表渲染 (`convert_mermaid`)

自动识别 Markdown 中的 mermaid 代码块，渲染为 PNG/JPG 图片并替换为图片引用。

**前置要求**:
- 已安装 `@mermaid-js/mermaid-cli`（开发依赖中已包含）
- 验证安装: `npx mmdc --version`

**支持的功能**:
- 自动检测 Mermaid 代码块
- 支持多种图表类型（流程图、序列图、甘特图、饼图等）
- 手绘风格转换（可选）
- 代码备份到 `.mermaid-backup` 目录

**详细文档**: [Mermaid 使用指南](docs/MERMAID_GUIDE.md)

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
- 颜色随机化（可选）
- 填充样式随机化（可选）
- 按内容块分组颜色（可选）
- 保留箭头和标记
- 支持自定义粗糙度和填充样式

**详细文档**: [手绘风格实现文档](docs/HAND_DRAWN_IMPLEMENTATION.md)

### 3. 图片上传到 COS (`image_upload_cos`)

自动收集 Markdown 中的本地图片，上传到腾讯云 COS，并替换为 COS URL。

**前置要求**:
- 配置腾讯云 COS 环境变量（见上方配置说明）

**特性**:
- 自动收集所有本地图片引用
- 支持包含中文和特殊字符的文件名
- **URL 编码处理**：自动对包含中文的 COS Key 进行正确的 URL 编码，确保访问链接正常工作
  - COS SDK 的 `Key` 参数使用原始字符串（保留中文）
  - 访问 URL 自动进行路径段编码，保留路径分隔符
- 创建 `.cos.md` 文件（原文和 `.converted.md` 保持不变）

**详细配置指南**: 📖 [腾讯云 COS 申请与配置指南](docs/COS_SETUP_GUIDE.md)

### 4. 完整发布 Pipeline (`publish_wechat`)

一键完成所有处理步骤。

**详细文档**: [完整 Pipeline 流程使用指南](docs/PIPELINE_USAGE.md)

## 如何调试

使用 Inspector 进行简单调试：

```bash
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

**检查环境变量配置**：
- `COS_SECRET_ID`
- `COS_SECRET_KEY`
- `COS_REGION`
- `COS_BUCKET`
- `COS_BASE_URL`

**检查上传日志**：
上传工具会输出详细的调试日志，包括：
- `[上传] COS Key (原始)`: 显示上传到 COS 的实际 key（包含中文）
- `[上传] COS Key (编码后用于 URL)`: 显示用于构建访问 URL 的编码后 key
- `[上传] 最终 URL`: 可以直接在浏览器中访问验证

**常见问题**：
- **`NoSuchKey` 错误**：检查 URL 是否正确编码，确认文件名中的中文字符已正确编码
- **权限错误**：确认 COS 存储桶的访问权限设置为"公有读"（如果需要公开访问）
- **路径不匹配**：检查上传的 key 和访问 URL 中的路径是否一致

### Q: 为什么创建了 `.converted.md` 和 `.cos.md` 文件？

这是**文件保护机制**！所有转换操作都会创建新文件，原文永远不会被修改。

- `文章.converted.md` - Mermaid 代码块已转换为图片链接
- `文章.cos.md` - 所有图片链接已替换为 COS URL
- `文章.md` - 原文保持不变

你可以在发布前查看这些文件，确认效果是否符合预期。

## 相关文档

- 📖 [提示词使用示例](docs/PROMPT_EXAMPLES.md) - 详细的提示词模板
- 📖 [完整 Pipeline 流程使用指南](docs/PIPELINE_USAGE.md) - Pipeline 详细说明
- 📖 [腾讯云 COS 申请与配置指南](docs/COS_SETUP_GUIDE.md) - COS 配置指南
- 📖 [Mermaid 使用指南](docs/MERMAID_GUIDE.md) - Mermaid 功能说明
- 📖 [手绘风格实现文档](docs/HAND_DRAWN_IMPLEMENTATION.md) - 手绘风格技术细节

## 赞助

如果您觉得这个项目不错，可以给我家猫咪买点罐头吃。[喂猫❤️](https://yuzhi.tech/sponsor)

## License

Apache License Version 2.0
