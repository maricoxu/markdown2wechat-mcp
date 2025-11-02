import COS from "cos-nodejs-sdk-v5";
import { getConfig } from "../config/load.js";
import { readFileSync } from "fs";
import { basename, extname } from "path";
import { logger } from "../utils/log.js";

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
 * 格式：keyPrefix/yyyy/mm/slug/filename.ext
 */
function generateCosKey(localPath: string, keyPrefix?: string): string {
  const filename = basename(localPath);
  const ext = extname(filename);
  const nameWithoutExt = basename(localPath, ext);

  // 获取当前日期
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // 构建路径
  const datePrefix = `${year}/${month}`;
  const prefix = keyPrefix ? `${keyPrefix.replace(/\/$/, "")}/${datePrefix}` : datePrefix;
  
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
  
  logger.info(`[上传] 开始上传: ${basename(localPath)}`);
  logger.info(`[上传] 本地路径: ${localPath}`);
  
  // 读取文件
  const fileContent = readFileSync(localPath);
  logger.info(`[上传] 文件大小: ${(fileContent.length / 1024).toFixed(2)} KB`);
  
  const cosKey = generateCosKey(localPath, keyPrefix);
  const cosConfig = config.cos!;
  
  logger.info(`[上传] COS Key: ${cosKey}`);
  logger.info(`[上传] COS Bucket: ${cosConfig.bucket}`);
  logger.info(`[上传] COS Region: ${cosConfig.region}`);
  logger.info(`[上传] Base URL: ${cosConfig.baseUrl}`);

  // 创建 COS 客户端
  const cos = new COS({
    SecretId: cosConfig.secretId,
    SecretKey: cosConfig.secretKey,
  });

  // 检查文件是否已存在（如果不覆盖）
  if (!overwrite) {
    try {
      await new Promise<void>((resolve, reject) => {
        cos.headObject(
          {
            Bucket: cosConfig.bucket,
            Region: cosConfig.region,
            Key: cosKey,
          },
          (err) => {
            if (!err) {
              // 文件已存在
              logger.info(`[上传] 检查文件存在: ${cosKey}`);
              resolve();
            } else if (err.statusCode === 404) {
              // 文件不存在，继续上传
              resolve();
            } else {
              reject(err);
            }
          }
        );
      });
      
      // 如果文件已存在，直接返回 URL
      const baseUrl = cosConfig.baseUrl.replace(/\/$/, "");
      const key = cosKey.replace(/^\//, "");
      // 生成访问 URL：对路径的每一段进行 URL 编码，但保留路径分隔符
      const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
      const existingUrl = `${baseUrl}/${encodedKey}`;
      logger.info(`[上传] 文件已存在，跳过上传: ${basename(localPath)}`);
      logger.info(`[上传] COS Key (原始): ${cosKey}`);
      logger.info(`[上传] COS Key (编码后): ${encodedKey}`);
      logger.info(`[上传] 使用现有 URL: ${existingUrl}`);
      return {
        localPath,
        cosKey,
        url: existingUrl,
      };
    } catch (error) {
      // 忽略检查错误，继续上传
    }
  }

  // 上传文件
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: cosConfig.bucket,
        Region: cosConfig.region,
        Key: cosKey,
        Body: fileContent,
        ContentType: getContentType(localPath),
        CacheControl: "public, max-age=31536000", // 1 年缓存
      },
      (err, data) => {
        if (err) {
          reject(new Error(`COS 上传失败: ${err.message}`));
          return;
        }

        // 确保 baseUrl 末尾没有斜杠，cosKey 前面没有斜杠
        const baseUrl = cosConfig.baseUrl.replace(/\/$/, "");
        const key = cosKey.replace(/^\//, ""); // 确保 key 前面没有斜杠
        
        // 生成访问 URL：对路径的每一段进行 URL 编码，但保留路径分隔符
        // COS SDK 的 Key 参数使用原始字符串，但浏览器访问 URL 需要编码
        const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const url = `${baseUrl}/${encodedKey}`;
        
        logger.info(`[上传] ✅ 上传成功！`);
        logger.info(`[上传] COS Key (上传时，原始): ${cosKey}`);
        logger.info(`[上传] COS Key (访问URL，编码后): ${encodedKey}`);
        logger.info(`[上传] 最终 URL: ${url}`);
        logger.info(`[上传] 验证: 请在浏览器中访问此 URL 确认文件存在`);

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

  logger.info(`[批量上传] 📊 统计: 成功 ${results.length}/${localPaths.length}, 失败 ${errors.length}/${localPaths.length}`);
  
  // 列出所有成功上传的 URL
  if (results.length > 0) {
    logger.info(`[批量上传] 成功上传的 URL:`);
    results.forEach((result, idx) => {
      logger.info(`[批量上传]   ${idx + 1}. ${result.url}`);
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

