#!/usr/bin/env node

/**
 * 测试手绘风格转换功能
 */

import { convertMermaid } from "../dist/mermaid/renderer.js";

async function main() {
  const filePath = "/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md";
  
  console.log("🎨 开始测试手绘风格转换...");
  console.log(`📄 文件: ${filePath}`);
  console.log("");

  try {
    // 测试：启用手绘风格（roughness 1.5）
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("测试: 启用手绘风格（roughness=1.5）");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const result = await convertMermaid({
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
    console.log(`📊 转换了 ${result.images.length} 个图表：`);
    result.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.localPath}`);
    });
    console.log("");
    console.log("💡 查看效果:");
    result.images.forEach((img) => {
      const filename = img.localPath.split('/').pop();
      console.log(`  open test/.assets/${filename}`);
    });
    console.log("");
    
  } catch (error) {
    console.error("❌ 转换失败:");
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

