import { describe, it, expect, beforeEach } from "vitest";
import { loadConfig, resetConfig, getConfig } from "../src/config/load.js";

describe("配置加载", () => {
  beforeEach(() => {
    resetConfig();
    // 清理环境变量
    delete process.env.WECHAT_APP_ID;
    delete process.env.WECHAT_APP_SECRET;
    delete process.env.COS_SECRET_ID;
    delete process.env.COS_SECRET_KEY;
    delete process.env.COS_BUCKET;
    delete process.env.COS_REGION;
    delete process.env.COS_BASE_URL;
    delete process.env.MERMAID_ENGINE;
    delete process.env.MERMAID_SCALE;
    delete process.env.DEFAULT_THEME;
    delete process.env.OUTPUT_DIR;
  });

  it("应该加载默认配置", () => {
    const config = loadConfig();
    
    expect(config.mermaid.engine).toBe("local");
    expect(config.mermaid.scale).toBe(1);
    expect(config.mermaid.background).toBe("#ffffff");
    expect(config.mermaid.format).toBe("png");
    expect(config.theme.default).toBe("orangeheart");
    expect(config.output.dir).toBe(".assets");
  });

  it("应该从环境变量加载配置", () => {
    process.env.WECHAT_APP_ID = "test_app_id";
    process.env.WECHAT_APP_SECRET = "test_secret";
    process.env.COS_SECRET_ID = "test_cos_id";
    process.env.COS_SECRET_KEY = "test_cos_key";
    process.env.COS_BUCKET = "test_bucket";
    process.env.COS_REGION = "ap-guangzhou";
    process.env.COS_BASE_URL = "https://img.example.com";
    process.env.MERMAID_ENGINE = "kroki";
    process.env.MERMAID_SCALE = "1.5";
    process.env.MERMAID_BACKGROUND = "#000000";
    process.env.MERMAID_FORMAT = "jpg";
    process.env.DEFAULT_THEME = "phycat";
    process.env.OUTPUT_DIR = ".output";

    const config = loadConfig();

    expect(config.wechat?.appId).toBe("test_app_id");
    expect(config.wechat?.appSecret).toBe("test_secret");
    expect(config.cos?.secretId).toBe("test_cos_id");
    expect(config.cos?.secretKey).toBe("test_cos_key");
    expect(config.cos?.bucket).toBe("test_bucket");
    expect(config.cos?.region).toBe("ap-guangzhou");
    expect(config.cos?.baseUrl).toBe("https://img.example.com");
    expect(config.mermaid.engine).toBe("kroki");
    expect(config.mermaid.scale).toBe(1.5);
    expect(config.mermaid.background).toBe("#000000");
    expect(config.mermaid.format).toBe("jpg");
    expect(config.theme.default).toBe("phycat");
    expect(config.output.dir).toBe(".output");
  });

  it("应该在配置缺失时使用默认值", () => {
    process.env.COS_SECRET_ID = "test_id";
    // 缺少其他必需字段，但 COS 配置是可选的

    const config = loadConfig();
    
    // COS 配置可能不完整（如果 .env 文件存在可能已经有完整配置）
    // 但不应抛出错误
    // 至少验证 mermaid 引擎使用默认值
    expect(config.mermaid.engine).toBe("local"); // 应该使用默认值
    expect(config.mermaid.scale).toBe(1); // 应该使用默认值
  });

  it("应该支持单例模式", () => {
    const config1 = getConfig();
    const config2 = getConfig();
    
    expect(config1).toBe(config2);
  });

  it("应该支持重置配置", () => {
    const config1 = getConfig();
    resetConfig();
    const config2 = getConfig();
    
    // 两次获取的配置应该不同（因为重新加载）
    expect(config1).not.toBe(config2);
  });
});

