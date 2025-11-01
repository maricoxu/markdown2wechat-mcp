#!/usr/bin/env node

/**
 * 测试所有 Mermaid 图表（0-5）
 */

import { convertMermaid } from "../dist/mermaid/renderer.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建测试文件，包含多个 mermaid 代码块
const testContent = `---
title: "Mermaid 完整测试文档"
summary: "测试所有类型的 mermaid 图表"
tags: ["test", "mermaid"]
---

# Mermaid 完整测试

## 1. 流程图 - 决策节点测试

\`\`\`mermaid
graph TD
    A[开始] --> B{是否需要转换?}
    B -->|是| C[检测 mermaid 代码块]
    B -->|否| D[跳过]
    C --> E[调用 mermaid-cli]
    E --> F[生成 PNG 图片]
    F --> G[替换为图片引用]
    G --> H[完成]
    D --> H
\`\`\`

## 2. 时序图

\`\`\`mermaid
sequenceDiagram
    participant A as 用户
    participant B as AI助手
    participant C as 系统
    
    A->>B: 请求转换Mermaid
    B->>C: 调用mermaid-cli
    C-->>B: 返回图片
    B-->>A: 返回结果
\`\`\`

## 3. 类图

\`\`\`mermaid
classDiagram
    class MermaidRenderer {
        +convertMermaid()
        +renderWithLocal()
        +renderWithKroki()
    }
    class HandDrawnConverter {
        +convertSvgToHandDrawn()
    }
    MermaidRenderer --> HandDrawnConverter
\`\`\`

## 4. 状态图

\`\`\`mermaid
stateDiagram-v2
    [*] --> 开始
    开始 --> 转换: 需要转换
    开始 --> 跳过: 不需要转换
    转换 --> 完成
    跳过 --> 完成
    完成 --> [*]
\`\`\`

## 5. 甘特图

\`\`\`mermaid
gantt
    title 项目进度
    dateFormat YYYY-MM-DD
    section 开发
    需求分析 :a1, 2024-01-01, 3d
    功能开发 :a2, after a1, 5d
    section 测试
    功能测试 :b1, after a2, 2d
\`\`\`

## 6. 饼图

\`\`\`mermaid
pie title 功能使用统计
    "Mermaid转换" : 40
    "手绘风格" : 30
    "图片上传" : 20
    "其他" : 10
\`\`\`
`;

const testFilePath = join(__dirname, "test-all-mermaid.md");
const fs = await import("fs/promises");

async function main() {
  console.log("🧪 开始测试所有 Mermaid 图表（0-5）...\n");

  // 写入测试文件
  await fs.writeFile(testFilePath, testContent, "utf-8");
  console.log(`📄 测试文件已创建: ${testFilePath}\n`);

  try {
    // 测试转换（启用手绘风格）
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("测试: 启用所有功能（手绘风格）");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const result = await convertMermaid({
      filePath: testFilePath,
      format: "png",
      scale: 1.5,
      background: "#ffffff",
      handDrawn: {
        enabled: true,
        roughness: 1.5,
        fillStyle: "hachure",
      },
    });

    console.log(`\n✅ 转换完成！`);
    console.log(`📊 成功转换 ${result.images.length} 个图表：\n`);

    result.images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.localPath}`);
    });

    console.log(`\n💡 查看效果:`);
    result.images.forEach((img, i) => {
      console.log(`  open ${img.localPath}`);
    });
  } catch (error) {
    console.error(`❌ 测试失败:`, error.message);
    process.exit(1);
  }
}

main().catch(console.error);

