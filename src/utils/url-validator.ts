import { logger } from "./log.js";

/**
 * 验证 URL 是否可以访问
 * @param url 要验证的 URL
 * @param timeout 超时时间（毫秒），默认 5000
 * @returns 如果可以访问返回 true，否则返回 false
 */
export async function validateUrl(url: string, timeout: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; markdown2wechat-mcp/1.0)",
      },
    });

    clearTimeout(timeoutId);
    const isValid = response.ok || response.status === 200 || response.status === 304;
    
    if (!isValid) {
      logger.warn(`[URL验证] URL 返回状态码 ${response.status}: ${url}`);
    }
    
    return isValid;
  } catch (error: any) {
    if (error.name === "AbortError") {
      logger.warn(`[URL验证] URL 访问超时: ${url}`);
    } else {
      logger.warn(`[URL验证] URL 访问失败: ${url}, 错误: ${error.message}`);
    }
    return false;
  }
}

/**
 * 批量验证 URL 列表
 * @param urls URL 列表
 * @param timeout 超时时间（毫秒），默认 5000
 * @returns 返回一个 Map，key 是 URL，value 是是否可访问
 */
export async function validateUrls(
  urls: string[],
  timeout: number = 5000
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  logger.info(`[URL验证] 开始验证 ${urls.length} 个 URL...`);
  
  // 并发验证，但限制并发数
  const concurrency = 5;
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const promises = batch.map(async (url) => {
      const isValid = await validateUrl(url, timeout);
      results.set(url, isValid);
      return { url, isValid };
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ url, isValid }) => {
      if (isValid) {
        logger.info(`[URL验证] ✅ ${url}`);
      } else {
        logger.warn(`[URL验证] ❌ ${url}`);
      }
    });
  }
  
  const validCount = Array.from(results.values()).filter(Boolean).length;
  logger.info(`[URL验证] 验证完成: ${validCount}/${urls.length} 个 URL 可访问`);
  
  return results;
}

