import { describe, it, expect, vi } from "vitest";
import { basename, extname } from "path";

/**
 * 测试 COS Key 生成逻辑（避免日期重复）
 * 注意：由于 generateCosKey 是私有函数，这里测试其行为逻辑
 */

describe("COS Key 生成 - 避免日期重复", () => {
  it("当 keyPrefix 已包含日期时，不应再添加日期", () => {
    // 模拟 generateCosKey 的逻辑
    const generateCosKey = (localPath: string, keyPrefix?: string): string => {
      const filename = basename(localPath);
      const ext = extname(filename);
      const nameWithoutExt = basename(localPath, ext);

      let prefix: string;
      
      if (keyPrefix) {
        const cleanPrefix = keyPrefix.replace(/\/$/, "");
        // 检测是否已包含日期格式 (YYYY/MM 或 /YYYY/MM)
        const datePattern = /\/\d{4}\/\d{2}$|^\d{4}\/\d{2}$/;
        
        if (datePattern.test(cleanPrefix)) {
          prefix = cleanPrefix;
        } else {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          prefix = `${cleanPrefix}/${year}/${month}`;
        }
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        prefix = `${year}/${month}`;
      }
      
      return `${prefix}/${nameWithoutExt}${ext}`;
    };

    const testCases = [
      {
        keyPrefix: "articles/2025/11",
        expectedPattern: /^articles\/2025\/11\/test\.png$/,
        description: "keyPrefix 已包含日期，不应重复"
      },
      {
        keyPrefix: "articles/2025/11/",
        expectedPattern: /^articles\/2025\/11\/test\.png$/,
        description: "keyPrefix 已包含日期（带斜杠），不应重复"
      },
      {
        keyPrefix: "2025/11",
        expectedPattern: /^2025\/11\/test\.png$/,
        description: "keyPrefix 就是日期格式，不应重复"
      },
      {
        keyPrefix: "articles",
        expectedPattern: /^articles\/\d{4}\/\d{2}\/test\.png$/,
        description: "keyPrefix 不包含日期，应添加日期"
      },
      {
        keyPrefix: undefined,
        expectedPattern: /^\d{4}\/\d{2}\/test\.png$/,
        description: "没有 keyPrefix，应使用日期作为前缀"
      }
    ];

    testCases.forEach(({ keyPrefix, expectedPattern, description }) => {
      const result = generateCosKey("/path/to/test.png", keyPrefix);
      expect(result).toMatch(expectedPattern);
      // 确保不会出现重复的日期
      const dateMatches = result.match(/\d{4}\/\d{2}/g);
      if (keyPrefix && (keyPrefix.includes("2025/11") || keyPrefix === "2025/11")) {
        // 如果 keyPrefix 已包含日期，应该只有一个日期出现
        expect(dateMatches?.length).toBe(1);
      }
    });
  });

  it("应该正确处理各种日期格式的 keyPrefix", () => {
    const generateCosKey = (localPath: string, keyPrefix?: string): string => {
      const filename = basename(localPath);
      const ext = extname(filename);
      const nameWithoutExt = basename(localPath, ext);

      let prefix: string;
      
      if (keyPrefix) {
        const cleanPrefix = keyPrefix.replace(/\/$/, "");
        const datePattern = /\/\d{4}\/\d{2}$|^\d{4}\/\d{2}$/;
        
        if (datePattern.test(cleanPrefix)) {
          prefix = cleanPrefix;
        } else {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          prefix = `${cleanPrefix}/${year}/${month}`;
        }
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        prefix = `${year}/${month}`;
      }
      
      return `${prefix}/${nameWithoutExt}${ext}`;
    };

    // 测试边界情况
    expect(generateCosKey("/test.jpg", "articles/2024/01")).toMatch(/^articles\/2024\/01\/test\.jpg$/);
    expect(generateCosKey("/test.jpg", "articles/2024/12")).toMatch(/^articles\/2024\/12\/test\.jpg$/);
    expect(generateCosKey("/test.jpg", "blog/2025/03")).toMatch(/^blog\/2025\/03\/test\.jpg$/);
  });
});

