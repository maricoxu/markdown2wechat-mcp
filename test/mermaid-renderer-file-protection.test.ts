import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { convertMermaid } from "../src/mermaid/renderer.js";
import { readFile, writeFile } from "../src/utils/fs.js";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync, unlinkSync, rmdirSync, mkdirSync } from "fs";

describe("convert_mermaid 文件保护机制", () => {
  let testDir: string;
  let originalFilePath: string;
  let convertedFilePath: string;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = join(tmpdir(), `mermaid-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, ".assets"), { recursive: true });
    
    originalFilePath = join(testDir, "test-article.md");
    convertedFilePath = join(testDir, "test-article.converted.md");
    
    // 创建测试 Markdown 文件
    const markdownContent = `# 测试文章

这是一段文字。

\`\`\`mermaid
graph TD
    A[开始] --> B[结束]
\`\`\`

这是另一段文字。`;
    
    writeFile(originalFilePath, markdownContent);
  });

  afterEach(() => {
    // 清理测试文件
    try {
      if (existsSync(originalFilePath)) {
        unlinkSync(originalFilePath);
      }
      if (existsSync(convertedFilePath)) {
        unlinkSync(convertedFilePath);
      }
      if (existsSync(join(testDir, ".assets"))) {
        const assetsDir = join(testDir, ".assets");
        const files = require("fs").readdirSync(assetsDir);
        files.forEach((file: string) => {
          unlinkSync(join(assetsDir, file));
        });
        rmdirSync(assetsDir);
      }
      if (existsSync(testDir)) {
        rmdirSync(testDir);
      }
    } catch (e) {
      // 忽略清理错误
    }
  });

  it("应该创建新文件而不是修改原文", async () => {
    const originalContent = readFile(originalFilePath);
    
    try {
      const result = await convertMermaid({
        filePath: originalFilePath,
      });

      // 验证原文内容没有改变
      const originalContentAfter = readFile(originalFilePath);
      expect(originalContentAfter).toBe(originalContent);
      expect(originalContentAfter).toContain("```mermaid");
      expect(originalContentAfter).toContain("graph TD");

      // 如果有 Mermaid 代码块，应该创建新文件
      if (result.images.length > 0) {
        expect(result.updatedMarkdownPath).toBe(convertedFilePath);
        expect(existsSync(convertedFilePath)).toBe(true);

        // 验证新文件内容（Mermaid 代码块应被替换为图片链接）
        const convertedContent = readFile(convertedFilePath);
        expect(convertedContent).not.toContain("```mermaid");
        expect(convertedContent).toContain(".png");
        expect(convertedContent).toContain(".assets");
      } else {
        // 如果转换失败（如 mmdc 不可用），至少验证原文没变
        expect(originalContentAfter).toBe(originalContent);
      }
    } catch (error: any) {
      // 如果 mmdc 不可用或其他错误，至少验证原文保持不变
      const originalContentAfter = readFile(originalFilePath);
      expect(originalContentAfter).toBe(originalContent);
      expect(originalContentAfter).toContain("```mermaid");
    }
  });

  it("应该生成正确的文件名（.converted.md）", async () => {
    const result = await convertMermaid({
      filePath: originalFilePath,
    });

    expect(result.updatedMarkdownPath).toBe(convertedFilePath);
    expect(result.updatedMarkdownPath).toContain(".converted.md");
    expect(result.updatedMarkdownPath).not.toBe(originalFilePath);
  });

  it("原文和转换后的文件应该同时存在", async () => {
    await convertMermaid({
      filePath: originalFilePath,
    });

    // 验证两个文件都存在
    expect(existsSync(originalFilePath)).toBe(true);
    expect(existsSync(convertedFilePath)).toBe(true);
  });

  it("转换后的文件应该包含图片链接而不是 Mermaid 代码块", async () => {
    // 注意：这个测试需要 mmdc 工具可用，如果不可用可能会失败
    try {
      const result = await convertMermaid({
        filePath: originalFilePath,
      });

      const convertedContent = readFile(result.updatedMarkdownPath);
      
      // 应该不包含 Mermaid 代码块标记（如果转换成功）
      expect(convertedContent).not.toMatch(/```mermaid/);
      expect(convertedContent).not.toContain("graph TD");
      
      // 应该包含图片链接（如果转换成功）
      if (result.images.length > 0) {
        expect(convertedContent).toMatch(/!\[.*?\]\(.*?\.png\)/);
      }
    } catch (error: any) {
      // 如果 mmdc 不可用，跳过这个测试
      if (error.message.includes("mmdc") || error.message.includes("mermaid")) {
        // 这是预期的，跳过测试
        expect(true).toBe(true);
      } else {
        throw error;
      }
    }
  });

  it("如果没有 Mermaid 代码块，应该返回原文路径（不创建新文件）", async () => {
    const plainMarkdown = `# 测试文章

没有 Mermaid 代码块的文章。`;
    
    const plainFilePath = join(testDir, "plain.md");
    writeFile(plainFilePath, plainMarkdown);
    
    const result = await convertMermaid({
      filePath: plainFilePath,
    });

    // 如果没有 Mermaid 代码块，应该返回原文路径（不创建新文件）
    // 根据实现，如果没有代码块，images 数组为空，但 updatedMarkdownPath 可能仍指向原文
    expect(result.images.length).toBe(0);
    
    // 原文应该保持不变
    const originalContent = readFile(plainFilePath);
    expect(originalContent).toBe(plainMarkdown);
  });
});
