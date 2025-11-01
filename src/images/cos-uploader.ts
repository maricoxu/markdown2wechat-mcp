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
  
  // 读取文件
  const fileContent = readFileSync(localPath);
  const cosKey = generateCosKey(localPath, keyPrefix);
  const cosConfig = config.cos!;

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
              logger.info(`文件已存在，跳过上传: ${cosKey}`);
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
      const existingUrl = `${cosConfig.baseUrl}/${cosKey}`;
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

        const url = `${cosConfig.baseUrl}/${cosKey}`;
        logger.info(`成功上传到 COS: ${localPath} -> ${url}`);

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

  // 串行上传（避免并发过多）
  for (const localPath of localPaths) {
    try {
      const result = await uploadImageToCos({
        localPath,
        keyPrefix: options?.keyPrefix,
        overwrite: options?.overwrite,
      });
      results.push(result);
    } catch (error: any) {
      errors.push({ path: localPath, error });
      logger.error(`上传失败 ${localPath}: ${error.message}`);
      // 继续处理其他图片
    }
  }

  if (errors.length > 0) {
    logger.warn(`${errors.length} 个图片上传失败`);
  }

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

