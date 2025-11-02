import { readFile, writeFile, getFilenameWithoutExt } from "../utils/fs.js";
import { dirname, resolve, isAbsolute, join, normalize, basename } from "path";
import { CosUploadResult } from "./cos-uploader.js";
import { ImageInfo } from "./collect.js";
import { logger } from "../utils/log.js";
import { realpathSync, existsSync } from "fs";

/**
 * 规范化路径用于比较（解决符号链接、相对路径等问题）
 */
function normalizePath(filePath: string): string {
  try {
    // 尝试解析真实路径（处理符号链接）
    if (existsSync(filePath)) {
      return normalize(realpathSync(filePath));
    }
    return normalize(resolve(filePath));
  } catch (error) {
    // 如果解析失败，返回规范化后的路径
    return normalize(resolve(filePath));
  }
}

/**
 * 将 Markdown 中的本地图片链接替换为 COS 外链
 */
export function rewriteImageLinks(
  content: string,
  markdownFilePath: string,
  uploadResults: CosUploadResult[]
): string {
  const markdownDir = dirname(markdownFilePath);
  
  // 创建映射：规范化后的本地路径 -> COS URL
  // 使用规范化路径以确保路径匹配的准确性
  const pathToUrl = new Map<string, string>();
  logger.info(`[链接替换] 准备替换图片链接，共有 ${uploadResults.length} 个上传结果`);
  
  for (const result of uploadResults) {
    const normalizedPath = normalizePath(result.localPath);
    pathToUrl.set(normalizedPath, result.url);
    // 同时保留原始路径映射（以防万一）
    pathToUrl.set(result.localPath, result.url);
    logger.info(`[链接替换] 映射: ${basename(result.localPath)} -> ${result.url}`);
  }

  // 匹配所有图片引用
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imagePath) => {
    // 跳过已经是网络链接的图片
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return match;
    }

    // 解析图片路径
    let absolutePath: string;
    if (isAbsolute(imagePath)) {
      absolutePath = imagePath;
    } else {
      absolutePath = resolve(markdownDir, imagePath);
    }
    
    // 规范化路径用于匹配
    const normalizedPath = normalizePath(absolutePath);

    // 查找对应的 COS URL（先尝试规范化路径，再尝试原始路径）
    const cosUrl = pathToUrl.get(normalizedPath) || pathToUrl.get(absolutePath);
    if (cosUrl) {
      logger.info(`[链接替换] ✅ 替换: ${basename(imagePath)} -> ${cosUrl}`);
      return `![${alt}](${cosUrl})`;
    }

    // 如果没有找到，记录警告
    logger.warn(`[链接替换] ⚠️ 未找到匹配: ${basename(imagePath)} (绝对路径: ${absolutePath})`);
    logger.warn(`[链接替换] 可用的映射路径: ${Array.from(pathToUrl.keys()).map(p => basename(p)).join(", ")}`);
    return match;
  });
}

/**
 * 更新 Markdown 文件中的图片链接
 * @param filePath 源文件路径
 * @param uploadResults COS 上传结果
 * @param createNewFile 是否创建新文件（默认 true，不修改原文）
 * @returns 更新后的内容和新文件路径（如果创建了新文件）
 */
export function rewriteImageLinksInFile(
  filePath: string,
  uploadResults: CosUploadResult[],
  createNewFile: boolean = true
): { content: string; outputPath: string } {
  const content = readFile(filePath);
  const updatedContent = rewriteImageLinks(content, filePath, uploadResults);
  
  if (createNewFile) {
    // 创建新文件而不是修改原文
    const fileDir = dirname(filePath);
    const filenameBase = getFilenameWithoutExt(filePath);
    const outputFilePath = join(fileDir, `${filenameBase}.cos.md`);
    
    writeFile(outputFilePath, updatedContent);
    
    return {
      content: updatedContent,
      outputPath: outputFilePath,
    };
  } else {
    // 直接修改原文件（向后兼容）
    writeFile(filePath, updatedContent);
    return {
      content: updatedContent,
      outputPath: filePath,
    };
  }
}


