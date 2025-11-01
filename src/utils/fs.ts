import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve, basename, extname } from "path";
import { fileURLToPath } from "url";

/**
 * 确保目录存在，不存在则创建
 */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 获取文件的绝对路径（基于当前文件位置）
 */
export function resolvePath(relativePath: string, from?: string): string {
  if (from) {
    return resolve(dirname(from), relativePath);
  }
  // 如果没有提供 from，使用调用者的目录
  const stack = new Error().stack;
  if (stack) {
    // 简单实现：假设调用在项目内
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return resolve(__dirname, "../..", relativePath);
  }
  return resolve(relativePath);
}

/**
 * 读取文件内容
 */
export function readFile(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

/**
 * 写入文件内容
 */
export function writeFile(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, "utf-8");
}

/**
 * 获取文件名（不含扩展名）
 */
export function getFilenameWithoutExt(filePath: string): string {
  return basename(filePath, extname(filePath));
}

/**
 * 获取文件扩展名（含点）
 */
export function getFileExt(filePath: string): string {
  return extname(filePath);
}

/**
 * 判断路径是否为绝对路径
 */
export function isAbsolutePath(path: string): boolean {
  return resolve(path) === resolve(process.cwd(), path);
}


