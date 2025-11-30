import COS from "cos-nodejs-sdk-v5";
import { getConfig } from "../config/load.js";
import { readFileSync } from "fs";
import { basename, extname } from "path";
import { logger } from "../utils/log.js";
import { validateUrl } from "../utils/url-validator.js";

/**
 * COS 上传结果
 */
export interface CosUploadResult {
  localPath: string;
  cosKey: string; // COS 中的 key
  url: string; // 完整的访问 URL
}

/**
 * COS 上传选项
 */
export interface CosUploadOptions {
  localPath: string; // 本地图片路径
  keyPrefix?: string; // Key 前缀，如 `articles/2025/10/`
  overwrite?: boolean; // 是否覆盖已存在的文件
}

/**
 * 生成 COS Key
 * 格式：keyPrefix/yyyy/mm/filename.ext
 * 如果 keyPrefix 已包含日期格式，则不再添加日期前缀
 */
function generateCosKey(localPath: string, keyPrefix?: string): string {
  const filename = basename(localPath);
  const ext = extname(filename);
  const nameWithoutExt = basename(localPath, ext);

  let prefix: string;
  
  if (keyPrefix) {
    const cleanPrefix = keyPrefix.replace(/\/$/, "");
    // 检测是否已包含日期格式 (YYYY/MM 或 /YYYY/MM)
    // 匹配模式：以 /YYYY/MM 结尾，或整个字符串是 YYYY/MM 格式
    const datePattern = /\/\d{4}\/\d{2}$|^\d{4}\/\d{2}$/;
    
    if (datePattern.test(cleanPrefix)) {
      // keyPrefix 已包含日期，不再添加
      prefix = cleanPrefix;
      logger.info(`[上传] Key前缀已包含日期，使用: ${prefix}`);
    } else {
      // keyPrefix 不包含日期，添加日期前缀
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      prefix = `${cleanPrefix}/${year}/${month}`;
      logger.info(`[上传] Key前缀不包含日期，添加日期前缀: ${prefix}`);
    }
  } else {
    // 没有 keyPrefix，使用日期作为前缀
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    prefix = `${year}/${month}`;
  }
  
  return `${prefix}/${nameWithoutExt}${ext}`;
}

/**
 * 上传单个图片到 COS
 */
export async function uploadImageToCos(options: CosUploadOptions): Promise<CosUploadResult> {
  const config = getConfig();

  if (!config.cos) {
    throw new Error("COS 配置缺失，请设置 COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION, COS_BASE_URL");
  }

  const { localPath, keyPrefix, overwrite = false } = options;
  
  // 检查文件是否存在
  const { existsSync } = await import("fs");
  if (!existsSync(localPath)) {
    throw new Error(`文件不存在: ${localPath}`);
  }
  
  logger.info(`[上传] ========================================`);
  logger.info(`[上传] 📁 文件信息:`);
  logger.info(`[上传]   文件名: ${basename(localPath)}`);
  logger.info(`[上传]   本地路径: ${localPath}`);
  
  // 读取文件
  const fileContent = readFileSync(localPath);
  const fileSizeKB = (fileContent.length / 1024).toFixed(2);
  logger.info(`[上传]   文件大小: ${fileSizeKB} KB (${fileContent.length} bytes)`);
  
  const cosKey = generateCosKey(localPath, keyPrefix);
  const cosConfig = config.cos!;
  
  logger.info(`[上传] ⚙️ COS 配置:`);
  logger.info(`[上传]   - Bucket: ${cosConfig.bucket}`);
  logger.info(`[上传]   - Region: ${cosConfig.region}`);
  logger.info(`[上传]   - Base URL: ${cosConfig.baseUrl}`);
  logger.info(`[上传]   - SecretId: ${cosConfig.secretId.substring(0, 8)}...${cosConfig.secretId.substring(cosConfig.secretId.length - 4)}`);
  logger.info(`[上传]   - SecretKey: ${cosConfig.secretKey.substring(0, 8)}...${cosConfig.secretKey.substring(cosConfig.secretKey.length - 4)}`);
  logger.info(`[上传] 📝 生成的 COS Key: ${cosKey}`);

  // 创建 COS 客户端
  const cos = new COS({
    SecretId: cosConfig.secretId,
    SecretKey: cosConfig.secretKey,
  });

  // 检查文件是否已存在（如果不覆盖）
  if (!overwrite) {
    try {
      const exists = await new Promise<boolean>((resolve) => {
        cos.headObject(
          {
            Bucket: cosConfig.bucket,
            Region: cosConfig.region,
            Key: cosKey,
          },
          (err) => {
            if (!err) {
              // 文件确实存在
              logger.info(`[上传] ✅ 检查文件存在: ${cosKey}`);
              resolve(true);
            } else if (err.statusCode === 404) {
              // 文件不存在，需要上传
              logger.info(`[上传] ℹ️ 文件不存在 (404)，将进行上传: ${cosKey}`);
              resolve(false);
            } else {
              // 其他错误（如权限问题），记录警告但继续尝试上传
              logger.warn(`[上传] ⚠️ 检查文件存在时出错: ${err.message} (状态码: ${err.statusCode})，将尝试上传`);
              resolve(false);
            }
          }
        );
      });

      if (exists) {
        // 文件已存在，直接返回 URL
        logger.info(`[上传] ℹ️ 文件已存在于 COS，跳过上传`);
        const baseUrl = cosConfig.baseUrl.replace(/\/$/, "");
        const key = cosKey.replace(/^\//, "");
        // 生成访问 URL：对路径的每一段进行 URL 编码，但保留路径分隔符
        const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const existingUrl = `${baseUrl}/${encodedKey}`;
        logger.info(`[上传] 📋 使用现有文件 URL:`);
        logger.info(`[上传]   - COS Key (原始): ${cosKey}`);
        logger.info(`[上传]   - COS Key (编码后): ${encodedKey}`);
        logger.info(`[上传]   - URL: ${existingUrl}`);
        
        // 验证现有 URL 是否可以访问
        logger.info(`[上传] 🔍 验证现有 URL 可访问性...`);
        try {
          const isValid = await validateUrl(existingUrl, 10000);
          if (isValid) {
            logger.info(`[上传] ✅ 现有 URL 验证通过！`);
          } else {
            logger.warn(`[上传] ⚠️ 现有 URL 验证失败！文件可能无法访问`);
            logger.warn(`[上传] 💡 建议检查存储桶访问权限或手动访问 URL 确认`);
          }
        } catch (validationError: any) {
          logger.warn(`[上传] ⚠️ URL 验证过程出错: ${validationError.message}`);
        }
        
        return {
          localPath,
          cosKey,
          url: existingUrl,
        };
      }
      // 文件不存在，继续执行上传逻辑
    } catch (error: any) {
      // 检查过程中出现异常，记录警告但继续尝试上传
      logger.warn(`[上传] ⚠️ 检查文件存在时出现异常: ${error.message}，将尝试上传`);
    }
  }

  // 上传文件
  return new Promise(async (resolve, reject) => {
    logger.info(`[上传] 📤 开始上传到 COS...`);
    logger.info(`[上传] 上传参数:`);
    logger.info(`[上传]   - Bucket: ${cosConfig.bucket}`);
    logger.info(`[上传]   - Region: ${cosConfig.region}`);
    logger.info(`[上传]   - Key: ${cosKey}`);
    logger.info(`[上传]   - ContentType: ${getContentType(localPath)}`);
    logger.info(`[上传]   - Body Size: ${fileContent.length} bytes`);
    
    cos.putObject(
      {
        Bucket: cosConfig.bucket,
        Region: cosConfig.region,
        Key: cosKey,
        Body: fileContent,
        ContentType: getContentType(localPath),
        CacheControl: "public, max-age=31536000", // 1 年缓存
      },
      async (err, data) => {
        if (err) {
          logger.error(`[上传] ❌ COS 上传失败！`);
          logger.error(`[上传] 错误代码: ${err.statusCode || 'N/A'}`);
          logger.error(`[上传] 错误消息: ${err.message}`);
          logger.error(`[上传] 错误详情: ${JSON.stringify(err, null, 2)}`);
          
          // 提供诊断信息
          if (err.statusCode === 403) {
            logger.error(`[上传] 💡 诊断: 可能是权限问题，请检查：`);
            logger.error(`[上传]   1. SecretId 和 SecretKey 是否正确`);
            logger.error(`[上传]   2. 存储桶的访问权限是否允许写入`);
            logger.error(`[上传]   3. 是否配置了 IP 白名单（如果配置了，需要添加当前 IP）`);
          } else if (err.statusCode === 404) {
            logger.error(`[上传] 💡 诊断: 存储桶不存在或区域不正确`);
            logger.error(`[上传]   1. 检查 Bucket 名称是否正确: ${cosConfig.bucket}`);
            logger.error(`[上传]   2. 检查 Region 是否正确: ${cosConfig.region}`);
          } else if (err.statusCode === 400) {
            logger.error(`[上传] 💡 诊断: 请求参数错误`);
            logger.error(`[上传]   1. 检查 COS Key 格式是否正确: ${cosKey}`);
            logger.error(`[上传]   2. 检查文件大小是否超过限制`);
          }
          
          reject(new Error(`COS 上传失败: ${err.message} (状态码: ${err.statusCode || 'N/A'})`));
          return;
        }

        logger.info(`[上传] ✅ COS SDK 返回成功`);
        logger.info(`[上传] SDK 返回数据: ${JSON.stringify(data, null, 2)}`);

        // 确保 baseUrl 末尾没有斜杠，cosKey 前面没有斜杠
        const baseUrl = cosConfig.baseUrl.replace(/\/$/, "");
        const key = cosKey.replace(/^\//, ""); // 确保 key 前面没有斜杠
        
        // 生成访问 URL：对路径的每一段进行 URL 编码，但保留路径分隔符
        // COS SDK 的 Key 参数使用原始字符串，但浏览器访问 URL 需要编码
        const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const url = `${baseUrl}/${encodedKey}`;
        
        logger.info(`[上传] 📋 URL 生成信息:`);
        logger.info(`[上传]   - Base URL: ${baseUrl}`);
        logger.info(`[上传]   - COS Key (原始): ${cosKey}`);
        logger.info(`[上传]   - COS Key (编码后): ${encodedKey}`);
        logger.info(`[上传]   - 最终 URL: ${url}`);
        
        // 验证 URL 是否可以访问
        logger.info(`[上传] 🔍 验证 URL 可访问性...`);
        try {
          const isValid = await validateUrl(url, 10000); // 10秒超时
          if (isValid) {
            logger.info(`[上传] ✅ URL 验证通过！文件可以正常访问`);
          } else {
            logger.warn(`[上传] ⚠️ URL 验证失败！文件可能无法访问`);
            logger.warn(`[上传] 💡 可能的原因：`);
            logger.warn(`[上传]   1. 存储桶访问权限未设置为"公有读私有写"`);
            logger.warn(`[上传]   2. URL 编码问题（虽然已编码，但可能仍有问题）`);
            logger.warn(`[上传]   3. 网络问题或 COS 服务问题`);
            logger.warn(`[上传]   4. 文件上传成功但需要等待几秒钟才能访问（CDN 缓存）`);
            logger.warn(`[上传] 建议：请在浏览器中手动访问 URL 确认: ${url}`);
          }
        } catch (validationError: any) {
          logger.warn(`[上传] ⚠️ URL 验证过程出错: ${validationError.message}`);
          logger.warn(`[上传] 但这不影响上传结果，文件可能已成功上传`);
        }

        resolve({
          localPath,
          cosKey,
          url,
        });
      }
    );
  });
}

/**
 * 批量上传图片到 COS
 */
export async function uploadImagesToCos(
  localPaths: string[],
  options?: { keyPrefix?: string; overwrite?: boolean }
): Promise<CosUploadResult[]> {
  const results: CosUploadResult[] = [];
  const errors: Array<{ path: string; error: Error }> = [];

  logger.info(`[批量上传] 开始上传 ${localPaths.length} 个图片...`);
  
  // 串行上传（避免并发过多）
  for (let i = 0; i < localPaths.length; i++) {
    const localPath = localPaths[i];
    logger.info(`[批量上传] [${i + 1}/${localPaths.length}] 处理: ${basename(localPath)}`);
    
    try {
      const result = await uploadImageToCos({
        localPath,
        keyPrefix: options?.keyPrefix,
        overwrite: options?.overwrite,
      });
      results.push(result);
      logger.info(`[批量上传] [${i + 1}/${localPaths.length}] ✅ 完成`);
    } catch (error: any) {
      errors.push({ path: localPath, error });
      logger.error(`[批量上传] [${i + 1}/${localPaths.length}] ❌ 失败: ${error.message}`);
      logger.error(`[批量上传] 错误详情: ${error.stack || error}`);
      // 继续处理其他图片，但不将其加入结果中
    }
  }

  if (errors.length > 0) {
    logger.warn(`[批量上传] ⚠️ 共有 ${errors.length} 个图片上传失败`);
    logger.warn(`[批量上传] 失败的图片: ${errors.map(e => basename(e.path)).join(", ")}`);
    logger.warn(`[批量上传] 这些图片的链接不会被替换`);
  }

  logger.info(`[批量上传] ========================================`);
  logger.info(`[批量上传] 📊 最终统计:`);
  logger.info(`[批量上传]   - 总数: ${localPaths.length}`);
  logger.info(`[批量上传]   - 成功: ${results.length}`);
  logger.info(`[批量上传]   - 失败: ${errors.length}`);
  
  // 列出所有成功上传的 URL
  if (results.length > 0) {
    logger.info(`[批量上传] ✅ 成功上传的文件 URL:`);
    results.forEach((result, idx) => {
      logger.info(`[批量上传]   ${idx + 1}. ${basename(result.localPath)}`);
      logger.info(`[批量上传]      URL: ${result.url}`);
      logger.info(`[批量上传]      Key: ${result.cosKey}`);
    });
  }

  // 列出所有失败的文件
  if (errors.length > 0) {
    logger.error(`[批量上传] ❌ 上传失败的文件:`);
    errors.forEach((error, idx) => {
      logger.error(`[批量上传]   ${idx + 1}. ${basename(error.path)}`);
      logger.error(`[批量上传]      错误: ${error.error.message}`);
      if (error.error.stack) {
        logger.error(`[批量上传]      堆栈: ${error.error.stack.split('\n').slice(0, 3).join('\n')}`);
      }
    });
  }

  // 只返回成功上传的结果
  return results;
}

/**
 * 根据文件扩展名获取 Content-Type
 */
function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };

  return contentTypes[ext] || "application/octet-stream";
}

