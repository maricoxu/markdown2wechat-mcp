#!/usr/bin/env node

/**
 * 测试上传单个图片到 COS
 */

import { uploadImageToCos } from "../dist/images/cos-uploader.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testImagePath = join(__dirname, ".assets", "test-mermaid__mmd_0.png");

console.log("🚀 开始测试 COS 上传...");
console.log(`📄 文件: ${testImagePath}`);
console.log("");

try {
  const result = await uploadImageToCos({
    localPath: testImagePath,
    keyPrefix: "test/mermaid/",
    overwrite: false,
  });

  console.log("✅ 上传成功！");
  console.log("");
  console.log("📊 上传结果：");
  console.log(`  本地路径: ${result.localPath}`);
  console.log(`  COS Key: ${result.cosKey}`);
  console.log(`  访问 URL: ${result.url}`);
  console.log("");
  console.log("🔍 验证：可以在浏览器中打开 URL 查看图片");
} catch (error) {
  console.error("❌ 上传失败：");
  console.error(error.message);
  
  if (error.message.includes("COS 配置缺失")) {
    console.error("");
    console.error("💡 提示：请检查 .env 文件中的配置：");
    console.error("  - COS_SECRET_ID");
    console.error("  - COS_SECRET_KEY");
    console.error("  - COS_REGION（如：ap-guangzhou）");
    console.error("  - COS_BUCKET（你的存储桶名称）");
    console.error("  - COS_BASE_URL（如：https://your-bucket-1234567890.cos.ap-guangzhou.myqcloud.com）");
  }
  
  process.exit(1);
}

