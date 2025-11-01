# Mermaid 渲染功能使用指南

## 📋 目录

1. [功能概述](#功能概述)
2. [前置要求](#前置要求)
3. [使用方式](#使用方式)
4. [测试步骤](#测试步骤)
5. [参数说明](#参数说明)
6. [常见问题](#常见问题)
7. [示例](#示例)

---

## 功能概述

`convert_mermaid` 工具可以自动将 Markdown 文件中的 mermaid 代码块转换为图片（PNG/JPG），并替换为图片引用。

**支持的 Mermaid 图表类型：**
- 流程图 (Flowchart)
- 时序图 (Sequence Diagram)
- 类图 (Class Diagram)
- 状态图 (State Diagram)
- 甘特图 (Gantt Chart)
- 饼图 (Pie Chart)
- ER 图 (Entity Relationship)
- 用户旅程图 (User Journey)
- Git 图 (Git Graph)

---

## 前置要求

### 1. 安装依赖

```bash
# 已安装（作为 devDependencies）
pnpm add -D @mermaid-js/mermaid-cli
```

### 2. 验证安装

```bash
# 检查 mmdc 命令是否可用
npx mmdc --version

# 或者使用全局命令（如果已全局安装）
mmdc --version
```

### 3. 配置环境变量（可选）

在 `.env` 文件中设置 Mermaid 相关配置：

```env
MERMAID_ENGINE=local          # 渲染引擎：local 或 kroki
MERMAID_SCALE=1               # 缩放比例，建议 1-3
MERMAID_BACKGROUND=#ffffff    # 背景颜色
MERMAID_FORMAT=png            # 输出格式：png 或 jpg
OUTPUT_DIR=.assets            # 图片输出目录
```

---

## 使用方式

### 方式一：通过 MCP 工具调用

在 Cursor 或其他 MCP 客户端中调用 `convert_mermaid` 工具：

```json
{
  "tool": "convert_mermaid",
  "arguments": {
    "filePath": "/absolute/path/to/your/file.md",
    "format": "png",
    "scale": 1.5,
    "background": "#ffffff",
    "engine": "local"
  }
}
```

### 方式二：编程方式调用

```typescript
import { convertMermaid } from "./src/mermaid/renderer.js";

const result = await convertMermaid({
  filePath: "/path/to/test-mermaid.md",
  format: "png",
  scale: 1.5,
  background: "#ffffff",
  engine: "local"
});

console.log(`转换了 ${result.images.length} 个图表`);
```

### 方式三：作为 Pipeline 的一部分

```json
{
  "tool": "publish_wechat",
  "arguments": {
    "filePath": "/path/to/article.md",
    "runPipeline": {
      "convertMermaid": true,
      "uploadImages": true
    }
  }
}
```

---

## 测试步骤

### 步骤 1：准备测试文件

使用提供的测试文件：

```bash
cd /Users/xuyehua/Code/markdown2wechat-mcp
cat test/test-mermaid.md
```

### 步骤 2：手动测试 mermaid-cli

```bash
# 创建临时 mermaid 文件
cat > /tmp/test.mmd << 'EOF'
graph TD
    A[开始] --> B[结束]
EOF

# 渲染为图片
npx mmdc -i /tmp/test.mmd -o /tmp/test.png --scale 1.5 --backgroundColor "#ffffff"

# 检查生成的图片
open /tmp/test.png
```

### 步骤 3：测试 convert_mermaid 工具

在 Cursor 中向 AI 发送：

```
请使用 convert_mermaid 工具转换这个文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md
```

### 步骤 4：验证结果

1. **检查生成的图片**
   ```bash
   ls -la test/.assets/
   # 应该看到 test-mermaid__mmd_0.png, test-mermaid__mmd_1.png 等文件
   ```

2. **查看更新后的 Markdown**
   ```bash
   cat test/test-mermaid.md
   # 代码块应该被替换为：![mermaid-1](.assets/test-mermaid__mmd_0.png)
   ```

3. **预览图片**
   ```bash
   open test/.assets/test-mermaid__mmd_0.png
   ```

---

## 参数说明

### 必需参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `filePath` | string | Markdown 文件的绝对路径 |

### 可选参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `outDir` | string | `.assets` | 图片输出目录（相对于 Markdown 文件） |
| `format` | "png" \| "jpg" | "png" | 输出图片格式 |
| `scale` | number | 1 | 缩放比例（1-3 推荐） |
| `background` | string | "#ffffff" | 背景颜色（支持 hex、rgb） |
| `engine` | "local" \| "kroki" | "local" | 渲染引擎 |

### 返回结果

```typescript
{
  images: [
    {
      index: 0,
      alt: "流程图",
      localPath: "/path/to/.assets/test-mermaid__mmd_0.png"
    },
    // ... 更多图片
  ],
  updatedMarkdownPath: "/path/to/test-mermaid.md"
}
```

---

## 常见问题

### Q1: 渲染失败，提示 "mmdc command not found"

**解决方案：**

```bash
# 使用 npx 自动下载并运行
npx @mermaid-js/mermaid-cli -i input.mmd -o output.png

# 或者全局安装
npm install -g @mermaid-js/mermaid-cli
```

代码已自动处理，会优先尝试 `mmdc`，失败后使用 `npx`。

### Q2: 图片模糊或太小

**解决方案：**

增加 `scale` 参数：

```json
{
  "filePath": "...",
  "scale": 2  // 或 2.5, 3
}
```

### Q3: 想使用深色背景

**解决方案：**

```json
{
  "filePath": "...",
  "background": "#1e1e1e"  // 深色背景
}
```

### Q4: 某个 mermaid 图表语法错误

**不影响其他图表！**

工具会跳过失败的图表，继续处理其他图表。错误信息会在日志中显示。

### Q5: 如何使用 Kroki 云服务？

**适用场景：**
- 本地安装 mermaid-cli 有问题
- 不想安装额外依赖
- 对隐私要求不高的图表

```json
{
  "filePath": "...",
  "engine": "kroki"  // 使用 Kroki 云服务
}
```

---

## 示例

### 示例 1：基本使用（使用默认配置）

```json
{
  "tool": "convert_mermaid",
  "arguments": {
    "filePath": "/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md"
  }
}
```

### 示例 2：高清图片（推荐用于公众号）

```json
{
  "tool": "convert_mermaid",
  "arguments": {
    "filePath": "/path/to/article.md",
    "scale": 2,
    "format": "png"
  }
}
```

### 示例 3：自定义输出目录

```json
{
  "tool": "convert_mermaid",
  "arguments": {
    "filePath": "/path/to/article.md",
    "outDir": "images/mermaid"
  }
}
```

### 示例 4：使用 Kroki 云服务

```json
{
  "tool": "convert_mermaid",
  "arguments": {
    "filePath": "/path/to/article.md",
    "engine": "kroki"
  }
}
```

---

## 实战测试清单

- [ ] 安装并验证 mermaid-cli
- [ ] 手动测试 mmdc 命令
- [ ] 使用 MCP 工具转换测试文件
- [ ] 检查生成的图片质量
- [ ] 验证 Markdown 文件更新正确
- [ ] 测试不同的 scale 参数
- [ ] 测试 Kroki 引擎（可选）
- [ ] 测试错误处理（故意写错语法）

---

## 下一步

完成 Mermaid 渲染测试后，可以继续测试：
1. **图片上传到 COS** - 使用 `image_upload_cos` 工具
2. **完整 Pipeline** - 使用 `publish_wechat` 工具的 `runPipeline` 参数

---

## 技术支持

如遇到问题，请检查：
1. `/Users/xuyehua/Code/markdown2wechat-mcp/src/mermaid/renderer.ts` - 渲染逻辑
2. `/Users/xuyehua/Code/markdown2wechat-mcp/src/utils/exec.ts` - 命令执行逻辑
3. 日志输出（使用 `logger` 模块）

祝测试顺利！🎉

