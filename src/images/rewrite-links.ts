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
 * 包括正文中的图片和 Frontmatter 中的封面图片
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

  // 1. 替换 Markdown 正文中的图片链接
  let updatedContent = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imagePath) => {
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
      logger.info(`[链接替换] ✅ 替换正文图片: ${basename(imagePath)} -> ${cosUrl}`);
      return `![${alt}](${cosUrl})`;
    }

    // 如果没有找到，记录警告
    logger.warn(`[链接替换] ⚠️ 未找到匹配: ${basename(imagePath)} (绝对路径: ${absolutePath})`);
    return match;
  });

  // 2. 替换 Frontmatter 中的封面图片
  const frontmatterMatch = updatedContent.match(/^(---\s*\n)([\s\S]*?)(\n---)/);
  if (frontmatterMatch) {
    let frontmatter = frontmatterMatch[2];
    const frontmatterPrefix = frontmatterMatch[1];
    const frontmatterSuffix = frontmatterMatch[3];
    
    // 查找 cover: path 格式
    const coverMatch = frontmatter.match(/^(cover:\s*)(.+)$/m);
    if (coverMatch) {
      let coverPath = coverMatch[2].trim();
      // 移除可能的引号
      const hasQuotes = (coverPath.startsWith('"') && coverPath.endsWith('"')) || 
                        (coverPath.startsWith("'") && coverPath.endsWith("'"));
      if (hasQuotes) {
        coverPath = coverPath.slice(1, -1);
      }
      
      // 跳过已经是网络链接的封面
      if (!coverPath.startsWith("http://") && !coverPath.startsWith("https://")) {
        let absolutePath: string;
        if (isAbsolute(coverPath)) {
          absolutePath = coverPath;
        } else {
          absolutePath = resolve(markdownDir, coverPath);
        }
        
        // 规范化路径用于匹配
        const normalizedPath = normalizePath(absolutePath);
        const cosUrl = pathToUrl.get(normalizedPath) || pathToUrl.get(absolutePath);
        
        if (cosUrl) {
          // 替换封面路径
          const quoteChar = hasQuotes ? (coverPath.includes('"') ? "'" : '"') : '';
          const newCoverValue = quoteChar ? `${quoteChar}${cosUrl}${quoteChar}` : cosUrl;
          frontmatter = frontmatter.replace(
            /^(cover:\s*)(.+)$/m,
            `$1${newCoverValue}`
          );
          logger.info(`[链接替换] ✅ 替换封面图片: ${basename(coverPath)} -> ${cosUrl}`);
        } else {
          logger.warn(`[链接替换] ⚠️ 未找到封面图片匹配: ${basename(coverPath)} (绝对路径: ${absolutePath})`);
        }
      }
    }
    
    // 重新组装内容
    updatedContent = updatedContent.replace(
      /^(---\s*\n)([\s\S]*?)(\n---)/,
      `${frontmatterPrefix}${frontmatter}${frontmatterSuffix}`
    );
  }

  return updatedContent;
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


