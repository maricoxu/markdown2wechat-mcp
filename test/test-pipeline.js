#!/usr/bin/env node

/**
 * 测试完整的 Pipeline 流程
 * 包括：Mermaid 转图片 → 上传到 COS → 替换链接 → 保存原始 Mermaid 代码
 */

import { executePipeline } from "../dist/core/pipeline.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync, existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFilePath = join(__dirname, "test-full-pipeline.md");

console.log("🚀 开始测试完整 Pipeline 流程...");
console.log(`📄 文件: ${testFilePath}`);
console.log("");

// 备份原文件
const backupPath = testFilePath + ".backup";
if (existsSync(testFilePath)) {
  const originalContent = readFileSync(testFilePath, "utf-8");
  writeFileSync(backupPath, originalContent);
  console.log("✅ 已创建备份文件");
}

try {
  const result = await executePipeline({
    filePath: testFilePath,
    convertMermaid: true,  // 启用 Mermaid 转换
    uploadImages: true,    // 启用图片上传
    mermaidOptions: {
      handDrawn: { enabled: true }, // 使用手绘风格
    },
    cosOptions: {
      keyPrefix: "articles/", // COS 路径前缀
      overwrite: false,
    },
  });

  console.log("");
  console.log("✅ Pipeline 执行完成！");
  console.log("");
  console.log("📊 执行结果：");
  console.log(`  Mermaid 图表: ${result.mermaidImages?.length || 0} 个`);
  console.log(`  收集的图片: ${result.collectedImages?.length || 0} 个`);
  console.log(`  上传成功: ${result.uploadResults?.length || 0} 个`);
  console.log(`  错误数量: ${result.errors.length} 个`);
  
  if (result.errors.length > 0) {
    console.log("");
    console.log("⚠️ 错误信息：");
    result.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.step}: ${err.error.message}`);
    });
  }

  if (result.mermaidImages && result.mermaidImages.length > 0) {
    console.log("");
    console.log("📝 Mermaid 图表详情：");
    result.mermaidImages.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.localPath}`);
    });
    
    // 检查备份文件
    const backupDir = join(__dirname, ".assets", ".mermaid-backup");
    if (existsSync(backupDir)) {
      console.log("");
      console.log("💾 原始 Mermaid 代码已保存到:");
      console.log(`  ${backupDir}`);
    }
  }

  if (result.uploadResults && result.uploadResults.length > 0) {
    console.log("");
    console.log("🌐 上传的图片 URL：");
    result.uploadResults.forEach((upload, i) => {
      console.log(`  ${i + 1}. ${upload.url}`);
    });
  }

  console.log("");
  console.log("📄 文件已更新，查看: " + testFilePath);
  console.log("💾 备份文件: " + backupPath);

} catch (error) {
  console.error("❌ Pipeline 执行失败：");
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}

