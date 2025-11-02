# 快速开始提示词

## 一键发布（自动转换 Mermaid + 上传图片）

**关键提示词：**

```
使用 publish_wechat 工具发布文件到微信公众号，启用完整自动化流程：
- 文件路径：[你的 Markdown 文件绝对路径]
- 启用 Pipeline：convertMermaid: true, uploadImages: true
```

**完整示例：**

```
请使用 publish_wechat 工具发布以下文件到微信公众号：
文件路径：/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用完整 Pipeline 流程（自动转换 Mermaid 代码块为图片并上传所有图片到 COS）
```

或者更详细的：

```
请帮我发布这篇文章到微信公众号：
- 文件：/path/to/your/article.md
- 需要自动处理：转换所有 Mermaid 代码块为图片，上传所有本地图片到 COS，并替换链接
- 主题：orangeheart（或使用默认主题）
```

## 仅发布（不做任何转换）

**提示词：**

```
使用 publish_wechat 工具发布文件到微信公众号：
文件路径：/path/to/your/article.md
（不启用 Pipeline，直接发布）
```

## 配置检查清单

在第一次使用前，确保已配置：

- ✅ COS 配置（`.env` 文件）：
  ```
  COS_SECRET_ID=你的SecretId
  COS_SECRET_KEY=你的SecretKey
  COS_REGION=ap-shanghai
  COS_BUCKET=你的Bucket名称
  COS_BASE_URL=https://你的Bucket.cos.区域.myqcloud.com
  ```

- ✅ Mermaid CLI 已安装：
  ```bash
  npm install -g @mermaid-js/mermaid-cli
  ```

- ✅ Puppeteer（用于手绘风格，可选）：
  ```bash
  npx puppeteer browsers install chrome
  ```

## AI 助手理解的关键词

当你说以下任一表达时，AI 应该理解你想要启用完整 Pipeline：

- "启用完整 Pipeline"
- "自动转换 Mermaid 并上传图片"
- "转换 Mermaid + 上传到 COS"
- "自动处理图片和 Mermaid"
- "一键发布（带转换）"

当你说以下表达时，应该直接发布，不做转换：

- "直接发布"
- "不转换，直接发布"
- "发布（不使用 Pipeline）"

