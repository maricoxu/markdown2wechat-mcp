---
title: markdown2wechat-mcp 改造方案（mermaid 转图、COS 图床、发布串联）
summary: 以 Cursor+MCP 为核心，完善 mermaid 自动转图、COS 图床上传与发布到公众号草稿箱的一体化流水线，替代对 MWeb 的依赖。
tags: [MCP, 微信公众号, Markdown, COS, mermaid]
cover: 
---

## 背景
- 目标：不用 MWeb，仅依赖 Cursor + MCP 工具完成“写作 → 转图 → 图床上传 → 主题排版 → 发布草稿”。
- 现状：`markdown2wechat-mcp` 已具备主题排版与发布能力，缺少“mermaid 批量转图”和“国内稳定图床（腾讯云 COS）上传与回写外链”的自动化拼装。
- 参考实现：
  - 文颜 MCP（主题排版与发布能力）`https://github.com/maricoxu/markdown2wechat-mcp`

## 范围与目标
- 新增三项能力并打通端到端流程：
  1) convert_mermaid：识别 Markdown 中的 ```mermaid 代码块，渲染为 PNG/JPG 并替换为图片引用
  2) image_upload_cos：收集并上传本地图片到腾讯云 COS，替换为外链（含上一步生成的图片）
  3) publish_wechat：在发布前串联“转图 → 上传 → 主题排版 → 发布草稿”，支持开关
- 成果：一键处理整篇文章并发布到公众号草稿箱；可独立调用每个环节。

## 架构与数据流
```
Markdown(.md)
  └─ Parse (frontmatter + AST)
       └─ MermaidRenderer (生成 PNG/JPG，插入本地 ![](path))
            └─ ImageCollector (扫描所有本地图片)
                 └─ CosUploader (上传至 COS，得外链 URL)
                      └─ LinkRewriter (将文内图片链接改为外链)
                           └─ Theming (选主题渲染 HTML)
                                └─ WechatPublisher (发草稿)
输出：draftId / 预览地址 / 渲染 HTML（可落本地）
```

## 目录与模块拆分（建议）
```
src/
  core/pipeline/              # 统一调度器与上下文
  parser/                     # frontmatter 校验 & Markdown AST
  mermaid/renderer.ts         # 调 mermaid-cli 或 Kroki
  images/collect.ts           # 扫描本地图片
  images/cos-uploader.ts      # 腾讯云 COS 上传
  images/rewrite-links.ts     # 把本地链接替换为外链
  theming/render.ts           # 主题排版（沿用现有）
  publish/wechat.ts           # 发布草稿（沿用/增强）
  mcp/tools.ts                # 对外暴露工具
  config/{schema,load}.ts     # 配置加载与校验
  utils/{fs,exec,log}.ts
```

## MCP 工具接口（统一规范）
- convert_mermaid
  - 入参：
    - filePath: string（Markdown 绝对路径）
    - outDir?: string（默认同目录 `.assets`）
    - format?: "png"|"jpg"（默认 png）
    - scale?: number（默认 1）
    - background?: string（默认 `#ffffff`）
    - engine?: "local"|"kroki"（默认 local）
  - 出参：`{ images: [{index, alt, localPath}], updatedMarkdownPath }`
- image_upload_cos
  - 入参：
    - filePath: string
    - bucket: string, region: string, baseUrl: string
    - keyPrefix?: string（如 `articles/2025/10/`）
    - overwrite?: boolean（默认 false）
  - 出参：`{ uploaded: [{ localPath, cosKey, url }], updatedMarkdownPath }`
- publish_wechat
  - 入参：
    - filePath: string
    - theme?: string
    - runPipeline?: { convertMermaid?: boolean; uploadImages?: boolean }
    - wechat?: { appId, appSecret }（或走环境变量）
  - 出参：`{ draftId, previewUrl?, htmlPath? }`

## 配置与密钥管理
- 支持 `.env` 与 `config.json`，统一用 zod 校验。
- 关键项：
  - WECHAT_APP_ID / WECHAT_APP_SECRET
  - COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION / COS_BASE_URL
  - DEFAULT_THEME / MERMAID_ENGINE / MERMAID_SCALE / OUTPUT_DIR

示例 `.env`：
```
WECHAT_APP_ID=wx_xxx
WECHAT_APP_SECRET=yyy
COS_SECRET_ID=AKID_xxx
COS_SECRET_KEY=zzz
COS_BUCKET=your-bucket-12345
COS_REGION=ap-guangzhou
COS_BASE_URL=https://img.yourdomain.com
DEFAULT_THEME=orangeheart
MERMAID_ENGINE=local
MERMAID_SCALE=1.2
```

## 关键实现说明
- Mermaid 渲染
  - 本地：`@mermaid-js/mermaid-cli (mmdc)`，通过 exec 调用；`--scale`、`--backgroundColor` 控制清晰度与背景
  - 备选：Kroki 云渲（需评估隐私与网络）
  - 临时命名：`<slug>__mmd_<index>.mmd` → `<slug>__mmd_<index>.png`
- COS 上传
  - SDK：`cos-nodejs-sdk-v5`
  - Key：`keyPrefix/yyyy/mm/slug/filename.ext`
  - Header：`Cache-Control: public, max-age=31536000`
  - 返回：`COS_BASE_URL + key`
- 链接回写
  - 仅替换图片链接（保留 alt/title）
  - 相对/绝对本地路径均支持
- 主题排版与发布
  - 排版前确保图片全部替换为外链
  - Frontmatter：`title` 必填；`cover` 若缺则回退为正文第一张图片

## 标准工作流（一键）
1. `convert_mermaid`：批量转图并插入本地引用
2. `image_upload_cos`：上传所有本地图到 COS，回写为外链
3. `publish_wechat`：按主题渲染 → 发布草稿

## 验收标准
- 用含 2 个 mermaid + 3 张本地图片的样例文档：
  - 转图成功、生成 2 张 PNG 并替换
  - 5 张图片均变为 `https://img.yourdomain.com/...` 外链
  - 草稿箱生成新稿；封面逻辑正确
- 错误注入：
  - COS 配置缺失 → 明确报错
  - 单个 mermaid 语法错误 → 不影响其它图片，返回错误位置
  - 网络错误 → 返回可诊断信息并保留中间产物

## 排期（T-shirt）
- D1：Pipeline/配置/接口骨架
- D2：Mermaid 渲染（local/kroki）与替换
- D3：COS 上传与链接回写
- D4：串联发布，打通端到端
- D5：测试、文档与示例完善

## 后续可选增强
- 图片压缩与 webp/avif 转码策略
- 断点续传/秒传（MD5 指纹）
- 多平台同步（知乎/头条）
- 草稿差异对比与重复保护

## 参考
- 文颜 MCP（仓库说明与用法）：`https://github.com/maricoxu/markdown2wechat-mcp`
