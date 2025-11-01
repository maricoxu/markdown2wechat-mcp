import { readFile } from "../utils/fs.js";
import { resolve, dirname, isAbsolute } from "path";
import { existsSync } from "fs";

/**
 * 图片信息
 */
export interface ImageInfo {
  alt?: string;
  localPath: string; // 绝对路径
  originalUrl: string; // Markdown 中的原始引用
}

/**
 * 从 Markdown 内容中收集所有本地图片
 */
export function collectLocalImages(content: string, markdownFilePath: string): ImageInfo[] {
  const markdownDir = dirname(markdownFilePath);
  const images: ImageInfo[] = [];
  
  // 匹配所有图片引用：![alt](path) 或 ![](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const alt = match[1] || "";
    const imagePath = match[2].trim();

    // 跳过网络图片
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      continue;
    }

    // 解析图片路径
    let absolutePath: string;
    if (isAbsolute(imagePath)) {
      absolutePath = imagePath;
    } else {
      // 相对路径，相对于 Markdown 文件所在目录
      absolutePath = resolve(markdownDir, imagePath);
    }

    // 检查文件是否存在
    if (existsSync(absolutePath)) {
      images.push({
        alt,
        localPath: absolutePath,
        originalUrl: imagePath,
      });
    }
  }

  return images;
}

/**
 * 从 Markdown 文件收集本地图片
 */
export function collectLocalImagesFromFile(filePath: string): ImageInfo[] {
  const content = readFile(filePath);
  return collectLocalImages(content, filePath);
}


