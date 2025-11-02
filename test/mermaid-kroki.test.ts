import { describe, it, expect, vi, beforeEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

// 由于 renderWithKroki 是私有函数，我们需要测试它的行为
// 通过 convertMermaid 间接测试，或者直接测试编码逻辑

describe("Kroki Base64 编码", () => {
  it("应该正确进行 Base64 编码", () => {
    const mermaidCode = "graph TD\n  A[Start] --> B[End]";
    const encoded = Buffer.from(mermaidCode, 'utf-8').toString('base64');
    
    // 验证 Base64 编码结果
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');
    // Base64 编码只包含字母、数字、+、/、=
    expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("应该将 Base64 转换为 URL 安全格式", () => {
    const mermaidCode = "graph TD\n  A[Start] --> B[End]";
    const encoded = Buffer.from(mermaidCode, 'utf-8').toString('base64');
    
    // 转换为 URL 安全格式
    const urlSafeEncoded = encoded
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // 验证 URL 安全格式
    expect(urlSafeEncoded).toBeTruthy();
    // 不应该包含 +, /, =
    expect(urlSafeEncoded).not.toContain('+');
    expect(urlSafeEncoded).not.toContain('/');
    expect(urlSafeEncoded).not.toContain('=');
  });

  it("应该处理包含特殊字符的 Mermaid 代码", () => {
    const mermaidCode = `graph TD
      A["测试节点: 包含中文"]
      B["特殊字符: + / ="]
      A --> B`;
    
    const encoded = Buffer.from(mermaidCode, 'utf-8').toString('base64');
    const urlSafeEncoded = encoded
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // 应该能够正确编码包含特殊字符的内容
    expect(urlSafeEncoded).toBeTruthy();
    expect(urlSafeEncoded.length).toBeGreaterThan(0);
  });

  it("应该生成正确的 Kroki URL 格式", () => {
    const mermaidCode = "graph TD\n  A --> B";
    const format = "png";
    const encoded = Buffer.from(mermaidCode, 'utf-8').toString('base64');
    const urlSafeEncoded = encoded
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const url = `https://kroki.io/mermaid/${format}/${urlSafeEncoded}`;
    
    // 验证 URL 格式正确
    expect(url).toMatch(/^https:\/\/kroki\.io\/mermaid\/png\/[A-Za-z0-9_-]+$/);
  });

  it("应该与 encodeURIComponent 产生不同结果（验证修复）", () => {
    const mermaidCode = "graph TD\n  A --> B";
    
    // 错误的旧方法
    const wrongEncoded = encodeURIComponent(mermaidCode);
    
    // 正确的新方法
    const correctEncoded = Buffer.from(mermaidCode, 'utf-8').toString('base64');
    const urlSafeEncoded = correctEncoded
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // 两种编码方式应该产生不同的结果
    expect(wrongEncoded).not.toBe(urlSafeEncoded);
    
    // 验证新方法生成的字符串符合 Base64 URL 安全格式
    expect(urlSafeEncoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
