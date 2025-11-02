import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ConfigSchema, type Config } from "./schema.js";

/**
 * 加载环境变量
 * 优先查找项目根目录的 .env 文件
 * 注意：MCP 服务器需要静默加载，避免 dotenv 输出到 stdout
 */
function loadEnv(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, "../..");
  const envPath = resolve(projectRoot, ".env");
  
  // 静默加载环境变量，避免输出到 stdout（会干扰 MCP 协议通信）
  // dotenv 17.x 默认会输出提示信息，使用 DOTENV_CONFIG_QUIET 环境变量静默输出
  // 临时设置环境变量，然后恢复
  const originalQuiet = process.env.DOTENV_CONFIG_QUIET;
  process.env.DOTENV_CONFIG_QUIET = 'true';
  
  try {
    if (existsSync(envPath)) {
      config({ 
        path: envPath,
        debug: false,  // 禁用调试输出
        override: false,  // 不覆盖已存在的环境变量
      });
    } else {
      // 也尝试从当前工作目录加载（静默）
      config({
        debug: false,
        override: false,
      });
    }
  } finally {
    // 恢复原始 DOTENV_CONFIG_QUIET 设置
    if (originalQuiet === undefined) {
      delete process.env.DOTENV_CONFIG_QUIET;
    } else {
      process.env.DOTENV_CONFIG_QUIET = originalQuiet;
    }
  }
}

/**
 * 加载 config.json（如果存在）
 */
function loadConfigJson(): Partial<Config> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = resolve(__dirname, "../..");
  const configPath = resolve(projectRoot, "config.json");
  
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      // 使用 stderr 输出警告，避免干扰 MCP 协议
      console.error(`[WARN] Failed to parse config.json: ${error}`);
      return {};
    }
  }
  return {};
}

/**
 * 从环境变量构建配置对象
 */
function buildConfigFromEnv(): Partial<Config> {
  const env = process.env;
  
  const config: Partial<Config> = {};

  // 微信配置
  if (env.WECHAT_APP_ID || env.WECHAT_APP_SECRET) {
    config.wechat = {
      appId: env.WECHAT_APP_ID || "",
      appSecret: env.WECHAT_APP_SECRET || "",
    };
  }

  // COS 配置（只有当所有必需字段都存在时才设置）
  if (
    env.COS_SECRET_ID &&
    env.COS_SECRET_KEY &&
    env.COS_BUCKET &&
    env.COS_REGION &&
    env.COS_BASE_URL
  ) {
    config.cos = {
      secretId: env.COS_SECRET_ID,
      secretKey: env.COS_SECRET_KEY,
      bucket: env.COS_BUCKET,
      region: env.COS_REGION,
      baseUrl: env.COS_BASE_URL,
    };
  }

  // Mermaid 配置
  if (
    env.MERMAID_ENGINE ||
    env.MERMAID_SCALE ||
    env.MERMAID_BACKGROUND ||
    env.MERMAID_FORMAT ||
    env.MERMAID_HAND_DRAWN_ENABLED
  ) {
    config.mermaid = {
      engine: (env.MERMAID_ENGINE as "local" | "kroki") || "local",
      scale: env.MERMAID_SCALE ? parseFloat(env.MERMAID_SCALE) : 1,
      background: env.MERMAID_BACKGROUND || "#ffffff",
      format: (env.MERMAID_FORMAT as "png" | "jpg") || "png",
    };

    // 手绘风格配置
    if (env.MERMAID_HAND_DRAWN_ENABLED === "true") {
      const fillStyleValue = env.MERMAID_HAND_DRAWN_FILL_STYLE;
      const validFillStyles = ["hachure", "cross-hatch", "dots", "zigzag", "solid"] as const;
      config.mermaid.handDrawn = {
        enabled: true,
        roughness: env.MERMAID_HAND_DRAWN_ROUGHNESS
          ? parseFloat(env.MERMAID_HAND_DRAWN_ROUGHNESS)
          : 1.5,
        fillStyle: (validFillStyles.includes(fillStyleValue as any) ? fillStyleValue : "hachure") as typeof validFillStyles[number],
      };
    }
  }

  // 主题配置
  if (env.DEFAULT_THEME) {
    config.theme = {
      default: env.DEFAULT_THEME,
    };
  }

  // 输出配置
  if (env.OUTPUT_DIR) {
    config.output = {
      dir: env.OUTPUT_DIR,
    };
  }

  return config;
}

// 环境变量加载标志，确保只加载一次
let envLoaded = false;

/**
 * 加载并验证配置
 * 合并优先级：环境变量 > config.json > 默认值
 */
export function loadConfig(): Config {
  // 1. 加载 .env 文件（只加载一次）
  if (!envLoaded) {
    loadEnv();
    envLoaded = true;
  }

  // 2. 加载 config.json
  const jsonConfig = loadConfigJson();

  // 3. 从环境变量构建配置
  const envConfig = buildConfigFromEnv();

  // 4. 合并配置（envConfig 优先级最高）
  const defaultMermaid = {
    engine: "local" as const,
    scale: 1,
    background: "#ffffff",
    format: "png" as const,
    handDrawn: undefined as { enabled: boolean; roughness: number; fillStyle: string } | undefined,
  };
  
  const defaultTheme = {
    default: "orangeheart",
  };
  
  const defaultOutput = {
    dir: ".assets",
  };

  const merged: Partial<Config> = {
    ...jsonConfig,
    ...envConfig,
    // 深层合并嵌套对象
    wechat: envConfig.wechat || jsonConfig.wechat,
    cos: envConfig.cos || jsonConfig.cos,
    mermaid: {
      ...defaultMermaid,
      ...jsonConfig.mermaid,
      ...envConfig.mermaid,
      // 深层合并 handDrawn（envConfig 优先级最高）
      handDrawn: envConfig.mermaid?.handDrawn || jsonConfig.mermaid?.handDrawn || defaultMermaid.handDrawn,
    } as typeof defaultMermaid & { handDrawn?: { enabled: boolean; roughness: number; fillStyle: "hachure" | "cross-hatch" | "dots" | "zigzag" | "solid" } },
    theme: {
      ...defaultTheme,
      ...jsonConfig.theme,
      ...envConfig.theme,
    },
    output: {
      ...defaultOutput,
      ...jsonConfig.output,
      ...envConfig.output,
    },
  };

  // 5. 验证配置
  const result = ConfigSchema.safeParse(merged);

  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("\n");
    throw new Error(`配置验证失败:\n${errors}`);
  }

  return result.data;
}

/**
 * 获取配置实例（单例模式）
 */
let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

/**
 * 重置配置实例（用于测试）
 */
export function resetConfig(): void {
  configInstance = null;
}

