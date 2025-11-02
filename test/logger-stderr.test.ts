import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../src/utils/log.js";

describe("Logger 输出到 stderr", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("应该将 info 日志输出到 stderr（console.error）", () => {
    logger.info("测试消息");
    
    // 验证调用了 console.error（而不是 console.info）
    expect(consoleErrorSpy).toHaveBeenCalled();
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toContain("[INFO]");
    expect(callArgs[0]).toContain("测试消息");
    
    // 验证没有调用 console.info
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    
    // 验证没有调用 console.log
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("应该将 debug 日志输出到 stderr（console.error）", () => {
    logger.setLevel("debug");
    logger.debug("调试消息");
    
    // 验证调用了 console.error
    expect(consoleErrorSpy).toHaveBeenCalled();
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toContain("[DEBUG]");
    expect(callArgs[0]).toContain("调试消息");
    
    // 验证没有调用 console.info 或 console.log
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("应该将 warn 日志输出到 stderr（console.error）", () => {
    logger.warn("警告消息");
    
    // 验证调用了 console.error
    expect(consoleErrorSpy).toHaveBeenCalled();
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toContain("[WARN]");
    expect(callArgs[0]).toContain("警告消息");
    
    // 验证没有调用 console.info 或 console.log
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("应该将 error 日志输出到 stderr（console.error）", () => {
    logger.error("错误消息");
    
    // 验证调用了 console.error
    expect(consoleErrorSpy).toHaveBeenCalled();
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toContain("[ERROR]");
    expect(callArgs[0]).toContain("错误消息");
    
    // 验证没有调用 console.info 或 console.log
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("应该根据日志级别过滤输出", () => {
    logger.setLevel("warn");
    
    logger.debug("不应该显示的调试消息");
    logger.info("不应该显示的信息消息");
    logger.warn("应该显示的警告消息");
    logger.error("应该显示的错误消息");
    
    // 只有 warn 和 error 级别应该输出
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    const warnCall = consoleErrorSpy.mock.calls.find(call => call[0].includes("[WARN]"));
    const errorCall = consoleErrorSpy.mock.calls.find(call => call[0].includes("[ERROR]"));
    expect(warnCall).toBeTruthy();
    expect(errorCall).toBeTruthy();
  });

  it("应该支持多个参数", () => {
    // 确保日志级别允许 info
    logger.setLevel("info");
    
    logger.info("消息", { key: "value" }, 123);
    
    // 验证调用了 console.error
    expect(consoleErrorSpy).toHaveBeenCalled();
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toContain("[INFO]");
    expect(callArgs[0]).toContain("消息");
    expect(callArgs[1]).toEqual({ key: "value" });
    expect(callArgs[2]).toBe(123);
  });
});
