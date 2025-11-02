# 提示词使用示例

本文档提供了各种场景下的标准提示词模板，帮助你准确地向 AI 表达需求。

---

## 📋 目录

1. [只转换 Mermaid 为 PNG](#场景1-只转换-mermaid-为-png)
2. [只上传图片并替换链接](#场景2-只上传图片并替换链接)
3. [只发布到微信公众号](#场景3-只发布到微信公众号)
4. [组合操作](#场景4-组合操作)

---

## 场景1: 只转换 Mermaid 为 PNG

**目标**：将 Markdown 文件中的 Mermaid 代码块转换为 PNG 图片，但不做其他处理（不上传、不发布）。

### ✅ 标准提示词

```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
```

### ✅ 启用手绘风格

#### 方式 1：通过环境变量配置（推荐）

先在 `.env` 文件中设置：
```env
MERMAID_HAND_DRAWN_ENABLED=true
MERMAID_HAND_DRAWN_ROUGHNESS=1.5
MERMAID_HAND_DRAWN_FILL_STYLE=hachure
```

然后使用标准提示词：
```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
启用手绘风格
```

#### 方式 2：启用手绘风格 + 颜色随机化（推荐）

```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
启用手绘风格，启用颜色随机化和填充样式随机化
```

**或完整参数版本：**
```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
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

#### 方式 3：只启用手绘风格（使用默认参数）

```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
启用手绘风格（使用默认参数）
```

**注意**：现在 `convert_mermaid` 工具已支持 `handDrawn` 参数，可以直接在工具调用中传递，不再依赖环境变量配置。

### ✅ 自定义格式和尺寸

```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
格式：jpg，缩放比例：2，背景色：#f0f0f0
```

### 📝 说明

- 使用工具：`convert_mermaid`
- 文件路径：必须是**绝对路径**
- 结果：Mermaid 代码块会被替换为本地图片链接（如 `![alt](.assets/file__mmd_0.png)`）
- 原始代码：会备份到 `.assets/.mermaid-backup/` 目录

### ❌ 错误示例

```
转换一下 Mermaid（缺少工具名称和路径）
处理 test.md（使用相对路径）
```

---

## 场景2: 只上传图片并替换链接

**目标**：将 Markdown 文件中的所有本地图片上传到 COS，并替换原文中的链接，但不转换 Mermaid，不发布到微信。

### ✅ 标准提示词

```
请使用 image_upload_cos 工具上传文件中的所有图片：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
```

### ✅ 指定 COS 路径前缀

```
请使用 image_upload_cos 工具上传文件中的所有图片：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
COS 路径前缀：articles/2025/11/
```

### ✅ 允许覆盖已存在的文件

```
请使用 image_upload_cos 工具上传文件中的所有图片：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
允许覆盖已存在的文件
```

### 📝 说明

- 使用工具：`image_upload_cos`
- 文件路径：必须是**绝对路径**
- 结果：所有本地图片链接会被替换为 COS URL
- 上传范围：包括 `.assets/` 下的所有图片、文章中引用的本地图片

### ⚠️ 前置条件

- 必须先配置 COS（在 `.env` 文件中）
- 图片路径必须是本地路径（不是 `http://` 或 `https://`）

### ❌ 错误示例

```
上传图片（缺少工具名称和路径）
上传到 COS（没有指定文件）
```

---

## 场景3: 只发布到微信公众号

**目标**：直接将 Markdown 文件发布到微信公众号，不做任何转换和上传。

### ✅ 标准提示词

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-article.md
```

### ✅ 指定主题

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-article.md
主题：phycat
```

### ✅ 明确说明不使用 Pipeline

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-article.md
直接发布，不使用 Pipeline（不转换 Mermaid，不上传图片）
```

### 📝 说明

- 使用工具：`publish_wechat`
- 文件路径：必须是**绝对路径**
- 默认行为：**不启用 Pipeline**（`convertMermaid: false`, `uploadImages: false`）
- 结果：文件内容直接应用主题并发布到微信公众号草稿箱

### ⚠️ 适用场景

- 文件中没有 Mermaid 代码块
- 图片已经使用外部 URL（如 CDN、GitHub、其他云存储）
- 只需要快速发布，不需要额外处理

### ❌ 错误示例

```
发布到微信公众号（缺少工具名称和路径）
发布 test.md（使用相对路径）
```

---

## 场景4: 组合操作

### 4.1 转换 Mermaid + 上传图片（不发布）

**目标**：先转换 Mermaid，然后上传所有图片，但不发布到微信。

#### ✅ 标准提示词

```
请先使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md

然后使用 image_upload_cos 工具上传该文件中的所有图片（包括刚生成的 Mermaid 图片）。
```

#### ✅ 启用手绘风格版本

```
请先使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用手绘风格（粗糙度 1.5，填充样式 hachure）

然后使用 image_upload_cos 工具上传该文件中的所有图片。
```

**或通过环境变量配置后使用：**
```
请在 .env 文件中设置 MERMAID_HAND_DRAWN_ENABLED=true，
然后使用 convert_mermaid 工具处理文件：[路径]
启用手绘风格
```

### 4.2 完整 Pipeline（转换 + 上传 + 发布）

**目标**：转换 Mermaid、上传图片、发布到微信公众号，一键完成。

#### ✅ 标准提示词（推荐）

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用完整自动化流程（自动转换 Mermaid 代码块为图片，并上传所有图片到 COS）
```

#### ✅ 明确参数版本

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
runPipeline: { convertMermaid: true, uploadImages: true }
```

#### ✅ 指定主题版本

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用完整自动化流程，主题：lapis
```

### ✅ 启用手绘风格的完整 Pipeline

#### 方式 1：通过环境变量（推荐）

先在 `.env` 文件中设置：
```env
MERMAID_HAND_DRAWN_ENABLED=true
MERMAID_HAND_DRAWN_ROUGHNESS=1.5
MERMAID_HAND_DRAWN_FILL_STYLE=hachure
```

然后使用标准提示词：
```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用完整自动化流程，Mermaid 图表使用手绘风格
```

#### 方式 2：明确说明手绘参数

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用完整自动化流程，Mermaid 转换为手绘风格（粗糙度 1.5，填充样式 hachure）
```

### 4.3 只转换 Mermaid + 发布（不上传图片）

**目标**：转换 Mermaid 为本地图片，然后发布，但不上传到 COS。

#### ✅ 标准提示词

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
runPipeline: { convertMermaid: true, uploadImages: false }
```

### 4.4 只上传图片 + 发布（不转换 Mermaid）

**目标**：上传图片到 COS，然后发布，但不转换 Mermaid。

#### ✅ 标准提示词

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
runPipeline: { convertMermaid: false, uploadImages: true }
```

---

## 📊 快速参考表

| 场景 | 工具 | Pipeline 参数 | 提示词关键词 |
|------|------|---------------|--------------|
| **只转换 Mermaid** | `convert_mermaid` | 不适用 | "使用 convert_mermaid 工具" |
| **只上传图片** | `image_upload_cos` | 不适用 | "使用 image_upload_cos 工具" |
| **只发布** | `publish_wechat` | `runPipeline: {}` 或不设置 | "使用 publish_wechat 工具" |
| **转换 + 上传** | 两个工具顺序调用 | 不适用 | "先使用 convert_mermaid，然后使用 image_upload_cos" |
| **完整 Pipeline** | `publish_wechat` | `{ convertMermaid: true, uploadImages: true }` | "启用完整自动化流程" |

---

## ✅ 提示词编写检查清单

在发送提示词前，确认：

- [ ] 是否明确指定了工具名称？
- [ ] 是否提供了完整的**绝对路径**？
- [ ] 对于组合操作，是否说明了所有步骤？
- [ ] 对于 `publish_wechat`，是否明确说明了 Pipeline 选项？
- [ ] 提示词是否足够清晰，不会产生歧义？

---

## 🎯 关键提示词词汇速查

### 启用功能的关键词

- ✅ **"启用完整 Pipeline"** → `{ convertMermaid: true, uploadImages: true }`
- ✅ **"启用完整自动化流程"** → `{ convertMermaid: true, uploadImages: true }`
- ✅ **"自动转换 Mermaid 并上传图片"** → `{ convertMermaid: true, uploadImages: true }`
- ✅ **"启用手绘风格"** → 在 `convert_mermaid` 中启用手绘样式

### 禁用功能的关键词

- ✅ **"直接发布"** → 不启用 Pipeline
- ✅ **"不转换，直接发布"** → `{ convertMermaid: false, uploadImages: false }`
- ✅ **"不使用 Pipeline"** → 默认行为（不启用 Pipeline）

---

## 💡 最佳实践

### 推荐写法

```
请使用 [工具名称] 工具处理文件：
[完整绝对路径]
[明确的功能选项说明]
```

### 示例模板

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用完整自动化流程（自动转换 Mermaid 代码块为图片，并上传所有图片到 COS）
```

---

## 🎨 手绘风格配置

### 什么是手绘风格？

手绘风格可以将 Mermaid 图表转换为类似 Excalidraw 的手绘效果，线条带有抖动感，更适合创意文档。

### 如何启用手绘风格？

#### 方法 1：环境变量配置（推荐，全局生效）

在项目根目录的 `.env` 文件中添加：

```env
MERMAID_HAND_DRAWN_ENABLED=true
MERMAID_HAND_DRAWN_ROUGHNESS=1.5
MERMAID_HAND_DRAWN_FILL_STYLE=hachure
MERMAID_HAND_DRAWN_RANDOMIZE_COLORS=true
MERMAID_HAND_DRAWN_RANDOMIZE_FILL_STYLE=true
MERMAID_HAND_DRAWN_GROUP_COLORS_BY_BLOCK=true
```

配置后，在提示词中只需要说"启用手绘风格"即可：

```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
启用手绘风格
```

#### 方法 2：在提示词中说明（AI 会从配置读取）

```
请使用 convert_mermaid 工具处理文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
启用手绘风格，粗糙度：1.5，填充样式：hachure，随机化颜色：是，按内容块分组颜色：是
```

### 手绘风格参数说明

| 参数 | 说明 | 可选值 | 默认值 |
|------|------|--------|--------|
| `enabled` | 是否启用 | `true` / `false` | `false` |
| `roughness` | 手绘粗糙度 | `0-3` | `1.5` |
| `fillStyle` | 填充样式 | `hachure` / `cross-hatch` / `zigzag` / `solid` | `hachure` |
| `randomizeColors` | 随机化颜色 | `true` / `false` | `true` |
| `randomizeFillStyle` | 随机化填充样式 | `true` / `false` | `true` |
| `groupColorsByBlock` | 按内容块分组颜色 | `true` / `false` | `true` |

### 不同粗糙度的效果

- `0.5`: 轻微手绘感（适合正式文档）
- `1.0`: 中等手绘感（平衡美观）
- `1.5`: 明显手绘感（**推荐**，Excalidraw 风格）
- `2.0+`: 强烈手绘感（创意风格）

### 完整示例：启用手绘风格的 Pipeline

```
请使用 publish_wechat 工具发布文件到微信公众号：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-full-pipeline.md
启用完整自动化流程，Mermaid 图表使用手绘风格（粗糙度 1.5）
```

**前提条件**：在 `.env` 文件中已配置 `MERMAID_HAND_DRAWN_ENABLED=true`

### ⚠️ 注意事项

1. **手绘风格只对支持的图表类型生效**：
   - ✅ 支持：流程图、时序图、状态图、类图等
   - ❌ 不支持：甘特图（Gantt）、饼图（Pie）

2. **性能影响**：手绘风格处理会增加渲染时间（约 200-500ms/图表）

3. **配置优先级**：环境变量 > 默认值

---

## 📚 相关文档

- [提示词最佳实践](./PROMPT_BEST_PRACTICES.md)
- [Pipeline 使用指南](./PIPELINE_USAGE.md)
- [快速开始](./QUICK_START.md)
- [手绘风格详细说明](./HAND_DRAWN_USAGE.md)

