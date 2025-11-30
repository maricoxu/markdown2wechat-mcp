import { describe, it, expect } from "vitest";
import { rewriteImageLinks } from "../src/images/rewrite-links.js";
import { CosUploadResult } from "../src/images/cos-uploader.js";
import { join } from "path";
import { tmpdir } from "os";

describe("封面图片链接替换", () => {
  const testDir = join(tmpdir(), "cover-rewrite-test");
  
  it("应该替换 Frontmatter 中的封面图片链接", () => {
    const coverImagePath = join(testDir, "cover.jpg");
    const cosUrl = "https://example.com/cos/cover.jpg";

    const markdown = `---
title: 测试文章
cover: ${coverImagePath}
---

# 正文`;

    const uploadResults: CosUploadResult[] = [
      {
        localPath: coverImagePath,
        cosKey: "cover.jpg",
        url: cosUrl
      }
    ];

    const markdownPath = join(testDir, "test.md");
    const result = rewriteImageLinks(markdown, markdownPath, uploadResults);

    // 应该替换封面路径为 COS URL
    expect(result).toContain(`cover: ${cosUrl}`);
    expect(result).not.toContain(coverImagePath);
  });

  it("应该同时替换封面和正文图片", () => {
    const coverImagePath = join(testDir, "cover.jpg");
    const bodyImagePath = join(testDir, "body.png");
    const coverCosUrl = "https://example.com/cos/cover.jpg";
    const bodyCosUrl = "https://example.com/cos/body.png";

    const markdown = `---
title: 测试文章
cover: ${coverImagePath}
---

# 正文

![正文图片](./body.png)`;

    const uploadResults: CosUploadResult[] = [
      {
        localPath: coverImagePath,
        cosKey: "cover.jpg",
        url: coverCosUrl
      },
      {
        localPath: bodyImagePath,
        cosKey: "body.png",
        url: bodyCosUrl
      }
    ];

    const markdownPath = join(testDir, "test.md");
    const result = rewriteImageLinks(markdown, markdownPath, uploadResults);

    // 应该替换封面和正文图片
    expect(result).toContain(`cover: ${coverCosUrl}`);
    expect(result).toContain(`![正文图片](${bodyCosUrl})`);
  });

  it("应该跳过已经是网络链接的封面", () => {
    const coverCosUrl = "https://example.com/cover.jpg";
    const bodyImagePath = join(testDir, "body.png");
    const bodyCosUrl = "https://example.com/cos/body.png";

    const markdown = `---
title: 测试文章
cover: ${coverCosUrl}
---

# 正文

![正文图片](./body.png)`;

    const uploadResults: CosUploadResult[] = [
      {
        localPath: bodyImagePath,
        cosKey: "body.png",
        url: bodyCosUrl
      }
    ];

    const markdownPath = join(testDir, "test.md");
    const result = rewriteImageLinks(markdown, markdownPath, uploadResults);

    // 封面应该保持不变（已经是网络链接）
    expect(result).toContain(`cover: ${coverCosUrl}`);
    // 正文图片应该被替换
    expect(result).toContain(`![正文图片](${bodyCosUrl})`);
  });

  it("应该处理带引号的封面路径", () => {
    const coverImagePath = join(testDir, "cover.jpg");
    const cosUrl = "https://example.com/cos/cover.jpg";

    const testCases = [
      { cover: `"${coverImagePath}"`, expected: `cover: "${cosUrl}"` },
      { cover: `'${coverImagePath}'`, expected: `cover: '${cosUrl}'` },
      { cover: coverImagePath, expected: `cover: ${cosUrl}` }
    ];

    testCases.forEach(({ cover, expected }) => {
      const markdown = `---
title: 测试文章
cover: ${cover}
---

# 正文`;

      const uploadResults: CosUploadResult[] = [
        {
          localPath: coverImagePath,
          cosKey: "cover.jpg",
          url: cosUrl
        }
      ];

      const markdownPath = join(testDir, "test.md");
      const result = rewriteImageLinks(markdown, markdownPath, uploadResults);

      expect(result).toContain(expected);
    });
  });
});

