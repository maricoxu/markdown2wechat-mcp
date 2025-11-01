#!/usr/bin/env node

/**
 * 对比测试：生成原图和手绘风格图进行对比
 */

import { convertMermaid } from "../dist/mermaid/renderer.js";

async function main() {
  const filePath = "/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md";
  
  console.log("📊 对比测试：原图 vs 手绘风格");
  console.log("");

  try {
    // 测试1: 生成原图（不启用手绘风格）
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("测试 1: 生成原图（标准风格）");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const result1 = await convertMermaid({
      filePath,
      format: "png",
      scale: 1.5,
      background: "#ffffff",
      engine: "local",
      handDrawn: {
        enabled: false, // 不启用手绘风格
      },
    });

    console.log(`✅ 原图已生成: ${result1.images[0]?.localPath}`);
    const originalPath = result1.images[0]?.localPath;

    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试2: 生成手绘风格图
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("测试 2: 生成手绘风格图");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const result2 = await convertMermaid({
      filePath,
      format: "png",
      scale: 1.5,
      background: "#ffffff",
      engine: "local",
      handDrawn: {
        enabled: true,
        roughness: 1.5,
        fillStyle: "hachure",
      },
    });

    console.log(`✅ 手绘风格图已生成: ${result2.images[0]?.localPath}`);
    const handDrawnPath = result2.images[0]?.localPath;

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 对比结果");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`原图: ${originalPath}`);
    console.log(`手绘风格: ${handDrawnPath}`);
    console.log("");
    console.log("💡 查看对比:");
    console.log(`  open "${originalPath}"`);
    console.log(`  open "${handDrawnPath}"`);
    
  } catch (error) {
    console.error("❌ 测试失败:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

