#!/usr/bin/env node

/**
 * 检查 COS 配置是否完整
 */

import { getConfig } from "../dist/config/load.js";

console.log("🔍 检查 COS 配置...");
console.log("");

const config = getConfig();

if (!config.cos) {
  console.log("❌ COS 配置缺失");
  console.log("");
  console.log("📝 请在 .env 文件中设置以下环境变量：");
  console.log("");
  console.log("  COS_SECRET_ID=你的SecretId");
  console.log("  COS_SECRET_KEY=你的SecretKey");
  console.log("  COS_REGION=你的地域（如：ap-guangzhou）");
  console.log("  COS_BUCKET=你的存储桶名称");
  console.log("  COS_BASE_URL=你的访问地址（如：https://bucket-name-APPID.cos.region.myqcloud.com）");
  console.log("");
  console.log("💡 如何获取这些信息：");
  console.log("  1. 登录腾讯云 COS 控制台");
  console.log("  2. 选择你的存储桶");
  console.log("  3. 在「概览」页面可以找到：");
  console.log("     - 地域（Region）");
  console.log("     - 存储桶名称（Bucket）");
  console.log("     - 访问域名（Base URL）");
  process.exit(1);
}

console.log("✅ COS 配置完整");
console.log("");
console.log("📊 配置信息：");
console.log(`  SecretId: ${config.cos.secretId.substring(0, 10)}...`);
console.log(`  SecretKey: ${config.cos.secretKey.substring(0, 10)}...`);
console.log(`  Region: ${config.cos.region}`);
console.log(`  Bucket: ${config.cos.bucket}`);
console.log(`  Base URL: ${config.cos.baseUrl}`);
console.log("");

