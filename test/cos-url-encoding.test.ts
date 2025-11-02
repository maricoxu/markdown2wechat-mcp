import { describe, it, expect } from "vitest";

/**
 * 测试 COS URL 编码功能
 * 
 * 关键点：
 * - COS SDK 的 Key 参数使用原始字符串（包含中文）
 * - 访问 URL 需要对路径部分进行 URL 编码
 * - 编码时保留斜杠作为路径分隔符
 */

describe("COS URL 编码", () => {
  it("应该正确编码包含中文的 COS Key", () => {
    // 模拟 generateCosKey 生成的 key
    const cosKey = "2025/11/强化学习算法演进_科普文章_大纲__mmd_2.png";
    
    // 正确的编码方式：对每个路径段编码，保留斜杠
    const encodedKey = cosKey.split('/').map(segment => encodeURIComponent(segment)).join('/');
    
    // 验证编码后的 key 包含 URL 编码的中文字符
    expect(encodedKey).toContain("%");
    expect(encodedKey).not.toContain("强化"); // 中文字符应该被编码
    expect(encodedKey).toContain("/"); // 斜杠应该保留
    
    // 验证可以正确解码
    const decodedKey = encodedKey.split('/').map(segment => decodeURIComponent(segment)).join('/');
    expect(decodedKey).toBe(cosKey);
  });

  it("应该正确处理包含特殊字符的 Key", () => {
    const cosKey = "2025/11/test_file-name (1).png";
    
    const encodedKey = cosKey.split('/').map(segment => encodeURIComponent(segment)).join('/');
    
    // 空格应该被编码（括号在 URL 编码中通常是编码的，但某些字符可能因浏览器而异）
    expect(encodedKey).toContain("%20"); // 空格
    
    // 验证可以正确解码
    const decodedKey = encodedKey.split('/').map(segment => decodeURIComponent(segment)).join('/');
    expect(decodedKey).toBe(cosKey);
    
    // 验证编码后的 key 与原始 key 不同（至少空格被编码了）
    expect(encodedKey).not.toBe(cosKey);
  });

  it("应该保留路径分隔符（斜杠）", () => {
    const cosKey = "2025/11/sub/folder/image.png";
    
    const encodedKey = cosKey.split('/').map(segment => encodeURIComponent(segment)).join('/');
    
    // 斜杠应该保留，不应该被编码
    expect(encodedKey).toContain("/");
    expect(encodedKey.split("/").length).toBe(cosKey.split("/").length);
  });

  it("应该正确处理 URL 构建", () => {
    const baseUrl = "https://yexiaoli-1342931294.cos.ap-shanghai.myqcloud.com";
    const cosKey = "2025/11/强化学习算法演进_科普文章_大纲__mmd_2.png";
    
    // 模拟 URL 构建逻辑
    const key = cosKey.replace(/^\//, "");
    const encodedKey = key.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const url = `${baseUrl}/${encodedKey}`;
    
    // 验证 URL 格式正确
    expect(url).toMatch(/^https:\/\/.+\/[^\/]+/);
    expect(url).toContain(baseUrl);
    expect(url).toContain("%"); // 应该包含编码字符
    
    // 验证 URL 可以正确访问（通过解析）
    const urlObj = new URL(url);
    expect(urlObj.origin).toBe(baseUrl);
    expect(urlObj.pathname).toContain("2025");
    expect(urlObj.pathname).toContain("11");
  });

  it("不应该对整个 key 进行 encodeURIComponent（错误方式）", () => {
    const cosKey = "2025/11/test.png";
    
    // 错误的编码方式：对整个 key 编码会编码斜杠
    const wrongEncoded = encodeURIComponent(cosKey);
    
    // 验证斜杠被编码了（这是错误的）
    expect(wrongEncoded).toContain("%2F"); // / 被编码为 %2F
    
    // 正确的方式：只对每个路径段编码
    const correctEncoded = cosKey.split('/').map(segment => encodeURIComponent(segment)).join('/');
    
    // 验证正确方式保留斜杠
    expect(correctEncoded).toContain("/");
    expect(correctEncoded).not.toContain("%2F");
    
    expect(correctEncoded).not.toBe(wrongEncoded);
  });
});

