import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rewriteImageLinksInFile } from "../src/images/rewrite-links.js";
import { writeFile, readFile } from "../src/utils/fs.js";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync, unlinkSync, rmdirSync, mkdirSync } from "fs";
import type { CosUploadResult } from "../src/images/cos-uploader.js";

describe("rewriteImageLinksInFile 文件保护机制", () => {
  let testDir: string;
  let originalFilePath: string;
  let cosFilePath: string;

  beforeEach(() => {
    // 创建临时测试目录
    testDir = join(tmpdir(), `rewrite-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "images"), { recursive: true });
    
    originalFilePath = join(testDir, "test-article.md");
    cosFilePath = join(testDir, "test-article.cos.md");
    
    // 创建测试 Markdown 文件，包含本地图片
    const markdownContent = `# 测试文章

![图片1](./images/image1.png)
![图片2](./images/image2.jpg)`;
    
    writeFile(originalFilePath, markdownContent);
  });

  afterEach(() => {
    // 清理测试文件
    try {
      if (existsSync(originalFilePath)) {
        unlinkSync(originalFilePath);
      }
      if (existsSync(cosFilePath)) {
        unlinkSync(cosFilePath);
      }
      const mixedFilePath = join(testDir, "mixed.md");
      if (existsSync(mixedFilePath)) {
        unlinkSync(mixedFilePath);
      }
      if (existsSync(join(testDir, "images"))) {
        rmdirSync(join(testDir, "images"));
      }
      if (existsSync(testDir)) {
        rmdirSync(testDir);
      }
    } catch (e) {
      // 忽略清理错误
    }
  });

  it("应该创建新文件而不是修改原文（默认 createNewFile=true）", () => {
    const originalContent = readFile(originalFilePath);
    
    // 创建模拟的 COS 上传结果
    const uploadResults: CosUploadResult[] = [
      {
        localPath: join(testDir, "images", "image1.png"),
        cosKey: "articles/2025/11/image1.png",
        url: "https://example.com/articles/2025/11/image1.png",
      },
      {
        localPath: join(testDir, "images", "image2.jpg"),
        cosKey: "articles/2025/11/image2.jpg",
        url: "https://example.com/articles/2025/11/image2.jpg",
      },
    ];

    const result = rewriteImageLinksInFile(originalFilePath, uploadResults, true);

    // 验证原文内容没有改变
    const originalContentAfter = readFile(originalFilePath);
    expect(originalContentAfter).toBe(originalContent);
    expect(originalContentAfter).toContain("./images/image1.png");
    expect(originalContentAfter).toContain("./images/image2.jpg");

    // 验证创建了新文件
    expect(result.outputPath).toBe(cosFilePath);
    expect(existsSync(cosFilePath)).toBe(true);

    // 验证新文件内容（本地链接应被替换为 COS URL）
    const cosContent = readFile(cosFilePath);
    expect(cosContent).toContain("https://example.com/articles/2025/11/image1.png");
    expect(cosContent).toContain("https://example.com/articles/2025/11/image2.jpg");
    expect(cosContent).not.toContain("./images/image1.png");
  });

  it("应该生成正确的文件名（.cos.md）", () => {
    const uploadResults: CosUploadResult[] = [];
    const result = rewriteImageLinksInFile(originalFilePath, uploadResults, true);

    expect(result.outputPath).toBe(cosFilePath);
    expect(result.outputPath).toContain(".cos.md");
    expect(result.outputPath).not.toBe(originalFilePath);
  });

  it("原文和 COS 文件应该同时存在", () => {
    const uploadResults: CosUploadResult[] = [];
    rewriteImageLinksInFile(originalFilePath, uploadResults, true);

    // 验证两个文件都存在
    expect(existsSync(originalFilePath)).toBe(true);
    expect(existsSync(cosFilePath)).toBe(true);
  });

  it("当 createNewFile=false 时应该修改原文件（向后兼容）", () => {
    const uploadResults: CosUploadResult[] = [
      {
        localPath: join(testDir, "images", "image1.png"),
        cosKey: "articles/2025/11/image1.png",
        url: "https://example.com/image1.png",
      },
    ];

    const result = rewriteImageLinksInFile(originalFilePath, uploadResults, false);

    // 应该直接修改原文件
    expect(result.outputPath).toBe(originalFilePath);
    
    // 验证原文件内容已更新
    const updatedContent = readFile(originalFilePath);
    expect(updatedContent).toContain("https://example.com/image1.png");
  });

  it("应该正确替换多个图片链接", () => {
    const uploadResults: CosUploadResult[] = [
      {
        localPath: join(testDir, "images", "image1.png"),
        cosKey: "articles/2025/11/image1.png",
        url: "https://example.com/image1.png",
      },
      {
        localPath: join(testDir, "images", "image2.jpg"),
        cosKey: "articles/2025/11/image2.jpg",
        url: "https://example.com/image2.jpg",
      },
    ];

    const result = rewriteImageLinksInFile(originalFilePath, uploadResults, true);
    const cosContent = readFile(result.outputPath);

    // 验证所有链接都被替换
    expect(cosContent).toContain("https://example.com/image1.png");
    expect(cosContent).toContain("https://example.com/image2.jpg");
    expect(cosContent.match(/https:\/\/example\.com/g)?.length).toBe(2);
  });

  it("应该跳过已经是网络链接的图片", () => {
    const markdownWithHttp = `# 测试文章

![图片1](https://example.com/image1.png)
![图片2](./local.png)`;
    
    const filePath = join(testDir, "mixed.md");
    writeFile(filePath, markdownWithHttp);

    const uploadResults: CosUploadResult[] = [
      {
        localPath: join(testDir, "local.png"),
        cosKey: "articles/2025/11/local.png",
        url: "https://example.com/local.png",
      },
    ];

    const result = rewriteImageLinksInFile(filePath, uploadResults, true);
    const cosContent = readFile(result.outputPath);

    // 网络链接应该保持不变
    expect(cosContent).toContain("https://example.com/image1.png");
    // 本地链接应该被替换
    expect(cosContent).toContain("https://example.com/local.png");
    expect(cosContent).not.toContain("./local.png");
  });
});
