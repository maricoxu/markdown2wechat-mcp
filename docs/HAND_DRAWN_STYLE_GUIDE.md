# Mermaid 手绘风格转换功能设计

## 📋 需求概述

将生成的 Mermaid 图片转换为 Excalidraw 风格的手绘效果，让图表更具手绘感和亲和力。

## 🎯 实现方案对比

### 方案 1: Rough.js / Rough-figure（推荐 ⭐）

**原理**: 将 SVG 路径转换为手绘风格的路径（抖动线条、不规则边缘）

**优点**:
- ✅ 纯 JavaScript 实现，易于集成
- ✅ 开源库，文档完善
- ✅ 效果接近 Excalidraw
- ✅ 可以处理 SVG 格式

**缺点**:
- ❌ 需要先从图片提取 SVG（或直接生成 SVG）
- ❌ 仅适用于矢量图，位图效果有限

**适用场景**: 
- 如果 mermaid-cli 可以输出 SVG，直接使用 rough.js 处理

**实现库**:
```bash
npm install roughjs
# 或
npm install rough-figure
```

---

### 方案 2: 图像风格转换（Sharp + 自定义滤镜）

**原理**: 使用图像处理库对 PNG 图片应用手绘风格滤镜

**优点**:
- ✅ 可以直接处理 PNG/JPG
- ✅ 不需要 SVG
- ✅ 集成简单

**缺点**:
- ❌ 效果可能不如 rough.js 自然
- ❌ 需要自己实现滤镜算法

**实现库**:
```bash
npm install sharp
npm install canvas  # 如果需要高级图像处理
```

**示例代码**:
```javascript
import sharp from 'sharp';

// 应用手绘风格滤镜
async function applyHandDrawnStyle(inputPath, outputPath) {
  await sharp(inputPath)
    .normalize()
    .threshold(128)  // 边缘检测
    .blur(0.5)       // 轻微模糊，模拟手绘
    .toFile(outputPath);
}
```

---

### 方案 3: 使用 AI 风格转换 API

**原理**: 调用第三方 API 进行风格转换

**优点**:
- ✅ 效果可能最好
- ✅ 不需要本地实现复杂算法

**缺点**:
- ❌ 需要 API 调用（可能收费）
- ❌ 依赖外部服务
- ❌ 网络延迟

**可选服务**:
- Replicate API (支持多种风格转换)
- Stability AI API
- DeepAI 风格转换

---

### 方案 4: Mermaid 直接输出 SVG + Rough.js

**最优方案** ⭐⭐⭐

**思路**: 
1. mermaid-cli 支持输出 SVG 格式
2. 使用 rough.js 将 SVG 转换为手绘风格
3. 再转回 PNG（如果需要）

**实现步骤**:
```javascript
// 1. mermaid-cli 输出 SVG
mmdc -i input.mmd -o output.svg

// 2. 使用 rough.js 处理 SVG
import rough from 'roughjs/bundled/rough.cjs.js';
import { parse } from 'svg-parser';
import { stringify } from 'svg-stringify';

// 3. 应用手绘效果
const rc = rough.svg(svgElement);
const handDrawnPath = rc.path(svgPath, { 
  roughness: 1.5,  // 手绘粗糙度
  fillStyle: 'hachure',  // 填充样式
  hachureAngle: 60,
  hachureGap: 4
});

// 4. 如需 PNG，使用 sharp 转换
sharp('output.svg').png().toFile('output.png');
```

---

## 💡 推荐实现方案

### 混合方案（最佳实践）

结合 **方案 1** 和 **方案 2**：

1. **首选**: 如果 mermaid-cli 支持 SVG，使用 rough.js 处理 SVG
2. **备选**: 如果只有 PNG，使用 sharp 应用手绘风格滤镜
3. **可配置**: 让用户选择是否启用手绘风格，以及使用哪种方法

---

## 📦 需要安装的依赖

```bash
# 方案 1: Rough.js（SVG 处理）
pnpm add roughjs svg-parser svg-stringify

# 方案 2: Sharp（图片处理）
pnpm add sharp

# 可选: Canvas（高级图像处理）
pnpm add canvas
```

---

## 🔧 实现接口设计

### 新增配置项

在 `src/config/schema.ts` 中添加：

```typescript
mermaid: z.object({
  engine: z.enum(["local", "kroki"]).default("local"),
  scale: z.number().positive().default(1),
  background: z.string().default("#ffffff"),
  format: z.enum(["png", "jpg"]).default("png"),
  handDrawnStyle: z.object({
    enabled: z.boolean().default(false),
    method: z.enum(["roughjs", "sharp-filter", "ai-api"]).default("roughjs"),
    roughness: z.number().min(0).max(3).default(1.5),  // rough.js 参数
  }).default({
    enabled: false,
    method: "roughjs",
    roughness: 1.5,
  }),
}).default({...})
```

### 新增函数

```typescript
// src/mermaid/hand-drawn.ts

/**
 * 应用手绘风格到图片
 */
export async function applyHandDrawnStyle(
  imagePath: string,
  outputPath: string,
  options: {
    method: "roughjs" | "sharp-filter" | "ai-api";
    roughness?: number;
  }
): Promise<void> {
  // 实现逻辑
}
```

### 更新 convert_mermaid 函数

在渲染完成后，如果启用手绘风格，调用 `applyHandDrawnStyle`。

---

## 🚀 快速实现（MVP）

### 步骤 1: 检查 mermaid-cli SVG 支持

```bash
# 测试 mermaid-cli 是否支持 SVG
npx mmdc -i test.mmd -o test.svg --width 1200
```

### 步骤 2: 如果支持 SVG，实现 rough.js 转换

```javascript
// src/mermaid/hand-drawn.ts
import rough from 'roughjs/bundled/rough.cjs.js';
import { readFile, writeFile } from '../utils/fs.js';
import sharp from 'sharp';

export async function convertSvgToHandDrawn(
  svgPath: string,
  outputPath: string,
  format: 'png' | 'jpg',
  roughness: number = 1.5
): Promise<void> {
  // 读取 SVG
  const svgContent = readFile(svgPath);
  
  // 解析 SVG，应用 rough.js 效果
  // （需要解析 SVG DOM，修改路径）
  
  // 转换为 PNG/JPG
  await sharp(svgPath)
    .png()
    .toFile(outputPath);
}
```

### 步骤 3: 如果只有 PNG，使用 sharp 滤镜

```javascript
export async function applyHandDrawnFilter(
  imagePath: string,
  outputPath: string
): Promise<void> {
  await sharp(imagePath)
    .greyscale()           // 转为灰度
    .normalize()           // 标准化
    .threshold(140)        // 二值化（模拟线条）
    .blur(0.3)             // 轻微模糊
    .sharpen()             // 锐化边缘
    .png()
    .toFile(outputPath);
}
```

---

## 📝 测试计划

1. **功能测试**
   - [ ] SVG 格式转换测试
   - [ ] PNG 滤镜效果测试
   - [ ] 不同 roughness 参数对比

2. **性能测试**
   - [ ] 转换速度
   - [ ] 内存占用
   - [ ] 文件大小对比

3. **效果对比**
   - [ ] 原图 vs 手绘风格
   - [ ] 不同参数下的效果

---

## 🔗 相关资源

- [Rough.js 官方文档](https://roughjs.com/)
- [Rough-figure GitHub](https://github.com/pshihn/rough-figure)
- [Sharp 图像处理](https://sharp.pixelplumbing.com/)
- [Excalidraw 风格指南](https://excalidraw.com/)

---

## 💬 建议

基于当前项目情况，建议：

1. **先验证**: 测试 mermaid-cli 是否可以直接输出 SVG
2. **如果支持 SVG**: 优先使用 rough.js 方案（效果最好）
3. **如果不支持**: 使用 sharp 滤镜方案（简单实用）
4. **渐进增强**: 作为可选功能，让用户选择是否启用

这样可以保持代码简洁，同时提供良好的用户体验。

