import { readFile, writeFile } from "../utils/fs.js";
import { dirname, resolve, isAbsolute } from "path";
import { CosUploadResult } from "./cos-uploader.js";
import { ImageInfo } from "./collect.js";

/**
 * 将 Markdown 中的本地图片链接替换为 COS 外链
 */
export function rewriteImageLinks(
  content: string,
  markdownFilePath: string,
  uploadResults: CosUploadResult[]
): string {
  const markdownDir = dirname(markdownFilePath);
  
  // 创建映射：本地路径 -> COS URL
  const pathToUrl = new Map<string, string>();
  for (const result of uploadResults) {
    pathToUrl.set(result.localPath, result.url);
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

    // 查找对应的 COS URL
    const cosUrl = pathToUrl.get(absolutePath);
    if (cosUrl) {
      return `![${alt}](${cosUrl})`;
    }

    // 如果没有找到，保持原样
    return match;
  });
}

/**
 * 更新 Markdown 文件中的图片链接
 */
export function rewriteImageLinksInFile(
  filePath: string,
  uploadResults: CosUploadResult[]
): string {
  const content = readFile(filePath);
  const updatedContent = rewriteImageLinks(content, filePath, uploadResults);
  
  // 写回文件
  writeFile(filePath, updatedContent);
  
  return updatedContent;
}


