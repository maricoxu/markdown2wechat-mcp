/**
 * 日志工具
 * 提供简单的日志输出功能
 */

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private level: LogLevel = "info";

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      // MCP 服务器应该将日志输出到 stderr，而不是 stdout
      // stdout 用于协议通信，stderr 用于日志
      console.error(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      // MCP 服务器应该将日志输出到 stderr，而不是 stdout
      console.error(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      // MCP 服务器应该将日志输出到 stderr，而不是 stdout
      console.error(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      // MCP 服务器应该将日志输出到 stderr，而不是 stdout
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();


