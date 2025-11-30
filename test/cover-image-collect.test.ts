import { describe, it, expect } from "vitest";
import { collectLocalImages } from "../src/images/collect.js";
import { writeFile, ensureDir } from "../src/utils/fs.js";
import { join } from "path";
import { tmpdir } from "os";
import { existsSync } from "fs";

describe("封面图片收集", () => {
  const testDir = join(tmpdir(), "cover-image-test");
  
  it("应该收集 Frontmatter 中的封面图片（绝对路径）", () => {
    const coverImagePath = join(testDir, "cover.jpg");
    ensureDir(testDir);
    writeFile(coverImagePath, "fake cover image");

    const markdown = `---
title: 测试文章
cover: ${coverImagePath}
---

# 正文

![正文图片](./image1.png)`;

    const markdownPath = join(testDir, "test.md");
    writeFile(markdownPath, markdown);

    const images = collectLocalImages(markdown, markdownPath);

    // 应该找到封面图片
    const coverImage = images.find(img => img.type === 'cover');
    expect(coverImage).toBeDefined();
    expect(coverImage?.localPath).toBe(coverImagePath);
    expect(coverImage?.type).toBe('cover');
  });

  it("应该收集 Frontmatter 中的封面图片（相对路径）", () => {
    const coverImagePath = join(testDir, "cover.jpg");
    ensureDir(testDir);
    writeFile(coverImagePath, "fake cover image");

    const markdown = `---
title: 测试文章
cover: ./cover.jpg
---

# 正文`;

    const markdownPath = join(testDir, "test.md");
    writeFile(markdownPath, markdown);

    const images = collectLocalImages(markdown, markdownPath);

    // 应该找到封面图片
    const coverImage = images.find(img => img.type === 'cover');
    expect(coverImage).toBeDefined();
    expect(coverImage?.type).toBe('cover');
  });

  it("应该跳过网络图片作为封面", () => {
    const markdown = `---
title: 测试文章
cover: https://example.com/cover.jpg
---

# 正文`;

    const markdownPath = join(testDir, "test.md");
    writeFile(markdownPath, markdown);

    const images = collectLocalImages(markdown, markdownPath);

    // 不应该收集网络图片
    const coverImage = images.find(img => img.type === 'cover');
    expect(coverImage).toBeUndefined();
  });

  it("应该同时收集封面图片和正文图片", () => {
    const coverImagePath = join(testDir, "cover.jpg");
    const bodyImagePath = join(testDir, "body.png");
    ensureDir(testDir);
    writeFile(coverImagePath, "fake cover image");
    writeFile(bodyImagePath, "fake body image");

    const markdown = `---
title: 测试文章
cover: ${coverImagePath}
---

# 正文

![正文图片](./body.png)`;

    const markdownPath = join(testDir, "test.md");
    writeFile(markdownPath, markdown);

    const images = collectLocalImages(markdown, markdownPath);

    // 应该找到封面和正文图片
    expect(images.length).toBe(2);
    const coverImage = images.find(img => img.type === 'cover');
    const bodyImage = images.find(img => img.type === 'markdown');
    expect(coverImage).toBeDefined();
    expect(bodyImage).toBeDefined();
  });

  it("应该处理带引号的封面路径", () => {
    const coverImagePath = join(testDir, "cover.jpg");
    ensureDir(testDir);
    writeFile(coverImagePath, "fake cover image");

    const testCases = [
      { cover: `"${coverImagePath}"`, description: "双引号" },
      { cover: `'${coverImagePath}'`, description: "单引号" },
      { cover: coverImagePath, description: "无引号" }
    ];

    testCases.forEach(({ cover, description }) => {
      const markdown = `---
title: 测试文章
cover: ${cover}
---

# 正文`;

      const markdownPath = join(testDir, `test-${description}.md`);
      writeFile(markdownPath, markdown);

      const images = collectLocalImages(markdown, markdownPath);
      const coverImage = images.find(img => img.type === 'cover');
      expect(coverImage).toBeDefined();
      expect(coverImage?.localPath).toBe(coverImagePath);
    });
  });
});

