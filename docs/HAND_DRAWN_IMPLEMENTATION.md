# 手绘风格实现方案

## ✅ 确认的技术方案

**好消息**: mermaid-cli 支持 SVG 输出！

```bash
mmdc -i input.mmd -o output.svg
# 或指定格式
mmdc -i input.mmd -o output.svg --outputFormat svg
```

因此我们采用 **方案 4: SVG + Rough.js**，这是最优方案。

---

## 📦 需要安装的依赖

```bash
# Rough.js - 核心手绘风格库
pnpm add roughjs

# Sharp - SVG 转 PNG/JPG
pnpm add sharp

# SVG 解析和处理（可选，如果需要更细粒度控制）
pnpm add jsdom @types/jsdom  # 用于 SVG DOM 操作
```

---

## 🏗️ 实现架构

```
Mermaid 代码
  ↓
mermaid-cli 渲染为 SVG
  ↓
Rough.js 应用手绘风格
  ↓
Sharp 转换为 PNG/JPG（如果需要）
  ↓
输出最终图片
```

---

## 💻 代码实现示例

### 1. 手绘风格处理模块

```typescript
// src/mermaid/hand-drawn.ts

import { readFile, writeFile } from "../utils/fs.js";
import sharp from "sharp";
import { JSDOM } from "jsdom";
import rough from "roughjs/bundled/rough.cjs.js";

/**
 * 将 SVG 转换为手绘风格
 */
export async function convertSvgToHandDrawn(
  svgPath: string,
  outputPath: string,
  options: {
    roughness?: number;  // 0-3，默认 1.5
    fillStyle?: "hachure" | "cross-hatch" | "dots";
    finalFormat?: "svg" | "png" | "jpg";
  } = {}
): Promise<void> {
  const {
    roughness = 1.5,
    fillStyle = "hachure",
    finalFormat = "png",
  } = options;

  // 读取 SVG
  const svgContent = readFile(svgPath);
  
  // 使用 JSDOM 解析 SVG
  const dom = new JSDOM(svgContent, { contentType: "image/svg+xml" });
  const document = dom.window.document;
  const svgElement = document.querySelector("svg");
  
  if (!svgElement) {
    throw new Error("Invalid SVG file");
  }

  // 创建 Rough.js 生成器
  const rc = rough.svg(svgElement);
  
  // 处理所有路径元素
  const paths = svgElement.querySelectorAll("path");
  paths.forEach((path) => {
    const pathData = path.getAttribute("d");
    if (pathData) {
      // 使用 rough.js 生成手绘风格的路径
      const handDrawnPath = rc.path(pathData, {
        roughness,
        fillStyle,
        stroke: path.getAttribute("stroke") || "currentColor",
        strokeWidth: parseFloat(path.getAttribute("stroke-width") || "2"),
        fill: path.getAttribute("fill") || "none",
      });
      
      // 替换原路径
      path.setAttribute("d", handDrawnPath.getAttribute("d"));
      // 复制 rough.js 生成的属性
      handDrawnPath.getAttributeNames().forEach((attr) => {
        if (attr !== "d") {
          path.setAttribute(attr, handDrawnPath.getAttribute(attr) || "");
        }
      });
    }
  });

  // 处理其他图形元素（rect, circle, ellipse 等）
  // ... 类似处理

  // 输出 SVG
  const handDrawnSvg = svgElement.outerHTML;
  
  if (finalFormat === "svg") {
    writeFile(outputPath, handDrawnSvg);
  } else {
    // 使用 sharp 转换为 PNG/JPG
    await sharp(Buffer.from(handDrawnSvg))
      .png()
      .toFile(outputPath);
  }
}
```

### 2. 简化版本（使用 sharp 滤镜作为备选）

```typescript
// src/mermaid/hand-drawn-simple.ts

import sharp from "sharp";

/**
 * 对 PNG 图片应用手绘风格滤镜（备选方案）
 */
export async function applyHandDrawnFilter(
  imagePath: string,
  outputPath: string,
  roughness: number = 1.5
): Promise<void> {
  await sharp(imagePath)
    .greyscale()           // 转为灰度，模拟手绘线条
    .normalize()           // 标准化亮度
    .threshold(140)        // 二值化，提取线条
    .blur(0.2 + roughness * 0.1)  // 根据 roughness 调整模糊
    .sharpen({ sigma: 0.5 }) // 锐化边缘
    .png()
    .toFile(outputPath);
}
```

---

## 🔧 集成到现有代码

### 修改 renderer.ts

```typescript
// 在 renderWithLocal 函数中添加手绘风格支持

async function renderWithLocal(
  mermaidCode: string,
  outputPath: string,
  options: { 
    format: "png" | "jpg"; 
    scale: number; 
    background: string;
    handDrawn?: {
      enabled: boolean;
      roughness?: number;
    };
  }
): Promise<void> {
  const tempMermaidPath = outputPath.replace(/\.(png|jpg)$/, ".mmd");
  writeFile(tempMermaidPath, mermaidCode);

  try {
    const mmdcAvailable = await isCommandAvailable("mmdc");
    const commandPrefix = mmdcAvailable ? "mmdc" : "npx @mermaid-js/mermaid-cli";
    
    // 如果启用手绘风格，先输出 SVG
    if (options.handDrawn?.enabled) {
      const svgPath = outputPath.replace(/\.(png|jpg)$/, ".svg");
      
      // 渲染为 SVG
      const svgCommand = `${commandPrefix} -i ${tempMermaidPath} -o ${svgPath} --outputFormat svg --scale ${options.scale} --backgroundColor "${options.background}"`;
      await executeCommand(svgCommand);
      
      // 应用手绘风格
      await convertSvgToHandDrawn(svgPath, outputPath, {
        roughness: options.handDrawn.roughness || 1.5,
        finalFormat: options.format,
      });
    } else {
      // 直接渲染为 PNG/JPG
      const formatFlag = options.format === "jpg" ? "-t jpg" : "";
      const command = `${commandPrefix} -i ${tempMermaidPath} -o ${outputPath} --scale ${options.scale} --backgroundColor "${options.background}" ${formatFlag}`.trim();
      await executeCommand(command);
    }
  } finally {
    // 清理临时文件
  }
}
```

---

## ⚙️ 配置项扩展

### 更新 config/schema.ts

```typescript
mermaid: z.object({
  engine: z.enum(["local", "kroki"]).default("local"),
  scale: z.number().positive().default(1),
  background: z.string().default("#ffffff"),
  format: z.enum(["png", "jpg"]).default("png"),
  handDrawn: z.object({
    enabled: z.boolean().default(false),
    roughness: z.number().min(0).max(3).default(1.5),
    fillStyle: z.enum(["hachure", "cross-hatch", "dots"]).default("hachure"),
  }).optional(),
}).default({...})
```

### 环境变量示例

```env
MERMAID_HAND_DRAWN_ENABLED=true
MERMAID_HAND_DRAWN_ROUGHNESS=1.5
```

---

## 📊 使用示例

### MCP 工具调用

```json
{
  "tool": "convert_mermaid",
  "arguments": {
    "filePath": "/path/to/file.md",
    "handDrawn": {
      "enabled": true,
      "roughness": 1.8
    }
  }
}
```

### 编程调用

```typescript
await convertMermaid({
  filePath: "/path/to/file.md",
  handDrawn: {
    enabled: true,
    roughness: 1.5,
  },
});
```

---

## 🎨 效果对比参数

| roughness | 效果描述 | 适用场景 |
|-----------|---------|---------|
| 0.5 | 轻微手绘感 | 正式文档，需要保留专业感 |
| 1.0 | 中等手绘感 | 平衡美观和手绘感 |
| 1.5 | 明显手绘感（推荐） | 一般用途，Excalidraw 风格 |
| 2.0+ | 强烈手绘感 | 创意文档，强调手绘风格 |

---

## ⚠️ 注意事项

1. **性能影响**: 手绘风格处理会增加渲染时间（约 200-500ms/图表）
2. **文件大小**: SVG 转 PNG 可能增加文件大小
3. **兼容性**: 需要 Node.js 环境支持 Canvas/JSDOM
4. **可选功能**: 建议作为可选功能，默认关闭

---

## 🚀 实现优先级

1. **Phase 1 (MVP)**: 实现 Sharp 滤镜方案（简单快速）
2. **Phase 2**: 实现 Rough.js SVG 方案（效果更好）
3. **Phase 3**: 参数调优和性能优化

这样可以快速验证效果，再逐步优化。

