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
  type?: 'markdown' | 'cover'; // 图片类型：Markdown 正文中的图片或 Frontmatter 中的封面
}

/**
 * 从 Markdown 内容中收集所有本地图片
 * 包括正文中的图片和 Frontmatter 中的封面图片
 */
export function collectLocalImages(content: string, markdownFilePath: string): ImageInfo[] {
  const markdownDir = dirname(markdownFilePath);
  const images: ImageInfo[] = [];
  
  // 1. 收集 Markdown 正文中的图片：![alt](path) 或 ![](path)
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
        type: 'markdown',
      });
    }
  }

  // 2. 收集 Frontmatter 中的封面图片
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    // 匹配 cover: path 格式（支持引号或不带引号）
    const coverMatch = frontmatter.match(/^cover:\s*(.+)$/m);
    if (coverMatch) {
      let coverPath = coverMatch[1].trim();
      // 移除可能的引号
      if ((coverPath.startsWith('"') && coverPath.endsWith('"')) || 
          (coverPath.startsWith("'") && coverPath.endsWith("'"))) {
        coverPath = coverPath.slice(1, -1);
      }
      
      // 跳过网络图片
      if (!coverPath.startsWith("http://") && !coverPath.startsWith("https://")) {
        let absolutePath: string;
        if (isAbsolute(coverPath)) {
          absolutePath = coverPath;
        } else {
          absolutePath = resolve(markdownDir, coverPath);
        }
        
        if (existsSync(absolutePath)) {
          images.push({
            alt: "cover",
            localPath: absolutePath,
            originalUrl: coverPath,
            type: 'cover',
          });
        }
      }
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


