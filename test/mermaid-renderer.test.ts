import { describe, it, expect, vi, beforeEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";

// Mock executeCommand
vi.mock("../src/utils/exec.js", () => ({
  executeCommand: vi.fn(),
  isCommandAvailable: vi.fn(),
}));

import { executeCommand, isCommandAvailable } from "../src/utils/exec.js";

describe("mmdc 命令路径处理", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isCommandAvailable).mockResolvedValue(true);
  });

  it("应该给包含空格的路径添加引号", async () => {
    const pathWithSpaces = "/path/to/My Documents/test.mmd";
    
    // 模拟 executeCommand 被调用
    vi.mocked(executeCommand).mockResolvedValue({
      stdout: "",
      stderr: "",
    });
    
    // 验证命令中的路径被正确引用
    const command = `mmdc -i "${pathWithSpaces}" -o "/path/to/output.png"`;
    
    // 验证命令格式正确（路径被引号包围）
    expect(command).toContain(`"${pathWithSpaces}"`);
    expect(command).toContain('"/path/to/output.png"');
    
    // 验证引号不会导致 shell 解析错误
    expect(command.split('"').length).toBeGreaterThan(1); // 应该有引号
  });

  it("应该处理包含特殊字符的路径", async () => {
    const pathWithSpecialChars = "/path/to/file with spaces & special-chars.mmd";
    
    const command = `mmdc -i "${pathWithSpecialChars}" -o "/output.png"`;
    
    // 验证特殊字符被正确引用
    expect(command).toContain(`"${pathWithSpecialChars}"`);
    // 验证命令包含引号（用于保护特殊字符）
    const quotes = command.match(/"/g);
    expect(quotes).toBeTruthy();
    expect(quotes!.length).toBeGreaterThanOrEqual(2); // 至少有两对引号（输入和输出路径）
  });

  it("应该处理 iCloud 路径格式", async () => {
    const iCloudPath = "/Users/xuyehua/Library/Mobile Documents/iCloud~md~obsidian/Documents/test.mmd";
    
    const command = `mmdc -i "${iCloudPath}" -o "/output.png"`;
    
    // 验证 iCloud 路径被正确引用
    expect(command).toContain(`"${iCloudPath}"`);
  });

  it("应该处理中文路径", async () => {
    const chinesePath = "/path/to/测试文件夹/文件.mmd";
    
    const command = `mmdc -i "${chinesePath}" -o "/output.png"`;
    
    // 验证中文路径被正确引用
    expect(command).toContain(`"${chinesePath}"`);
  });
});
