#!/usr/bin/env node

/**
 * 直接调用 convertMermaid 函数进行测试
 */

import { convertMermaid } from "../src/mermaid/renderer.js";
import { logger } from "../src/utils/log.js";

async function main() {
  const filePath = "/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md";
  
  console.log("🚀 开始转换 Mermaid 图表...");
  console.log(`📄 文件: ${filePath}`);
  console.log("");

  try {
    const result = await convertMermaid({
      filePath,
      format: "png",
      scale: 1.5,
      background: "#ffffff",
      engine: "local",
    });

    console.log("");
    console.log("✅ 转换完成！");
    console.log("");
    console.log(`📊 转换了 ${result.images.length} 个图表：`);
    result.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img.localPath}`);
      if (img.alt) {
        console.log(`     Alt: ${img.alt}`);
      }
    });
    console.log("");
    console.log(`📝 更新后的文件: ${result.updatedMarkdownPath}`);
    
    return result;
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

