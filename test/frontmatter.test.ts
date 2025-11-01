import { describe, it, expect } from "vitest";
import { parseFrontMatter, mergeFrontMatter } from "../src/parser/frontmatter.js";

describe("Frontmatter 解析", () => {
  it("应该正确解析 frontmatter 和正文", () => {
    const content = `---
title: 测试标题
summary: 这是摘要
tags: [tag1, tag2]
cover: https://example.com/image.jpg
---
# 正文内容

这是正文的第一段。`;

    const result = parseFrontMatter(content);

    expect(result.frontmatter.title).toBe("测试标题");
    expect(result.frontmatter.summary).toBe("这是摘要");
    expect(result.frontmatter.tags).toEqual(["tag1", "tag2"]);
    expect(result.frontmatter.cover).toBe("https://example.com/image.jpg");
    expect(result.body).toContain("# 正文内容");
  });

  it("应该处理没有 frontmatter 的情况", () => {
    const content = `# 正文内容

这是正文的第一段。`;

    const result = parseFrontMatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it("应该正确合并 frontmatter 和正文", () => {
    const frontmatter = {
      title: "测试标题",
      tags: ["tag1", "tag2"],
    };

    const body = `# 正文内容

这是正文。`;

    const merged = mergeFrontMatter(frontmatter, body);

    expect(merged).toContain("---");
    expect(merged).toContain('title: "测试标题"');
    expect(merged).toContain('tags: ["tag1", "tag2"]');
    expect(merged).toContain("# 正文内容");
  });
});


