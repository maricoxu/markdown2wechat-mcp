#!/usr/bin/env node

/**
 * 测试手绘风格转换功能
 */

import { convertMermaid } from "../src/mermaid/renderer.js";

async function main() {
  const filePath = "/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md";
  
  console.log("🎨 开始测试手绘风格转换...");
  console.log(`📄 文件: ${filePath}`);
  console.log("");

  try {
    // 测试 1: 启用手绘风格（默认 roughness 1.5）
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("测试 1: 启用手绘风格（roughness=1.5）");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const result1 = await convertMermaid({
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

    console.log("");
    console.log(`✅ 手绘风格转换完成！`);
    console.log(`📊 转换了 ${result1.images.length} 个图表：`);
    result1.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.localPath}`);
    });
    console.log("");
    console.log("💡 提示: 使用 'open test/.assets/test-mermaid__mmd_*.png' 查看效果");
    console.log("");

    // 测试 2: 不同 roughness 参数对比（可选）
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("可选: 测试不同 roughness 参数");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("如需测试不同参数，可以：");
    console.log("  1. roughness=0.5 (轻微手绘感)");
    console.log("  2. roughness=2.0 (强烈手绘感)");
    console.log("  3. 对比原图与手绘风格图");
    
  } catch (error: any) {
    console.error("❌ 转换失败:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

