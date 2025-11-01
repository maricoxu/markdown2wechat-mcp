import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * 执行 shell 命令
 * @param command 要执行的命令
 * @param options 执行选项
 * @returns 命令输出
 */
export async function executeCommand(
  command: string,
  options: { cwd?: string; timeout?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execAsync(command, {
      cwd: options.cwd,
      timeout: options.timeout || 30000, // 默认 30 秒超时
      maxBuffer: 10 * 1024 * 1024, // 10MB 缓冲区
    });
    return {
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
    };
  } catch (error: any) {
    // exec 的错误通常包含 stdout 和 stderr
    throw new Error(
      `命令执行失败: ${command}\n错误: ${error.message}\n输出: ${error.stdout}\n错误输出: ${error.stderr}`
    );
  }
}

/**
 * 检查命令是否可用
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    await executeCommand(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}


