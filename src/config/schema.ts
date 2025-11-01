import { z } from "zod";

/**
 * 配置项 Schema 定义
 * 使用 zod 进行类型安全的配置校验
 */
export const ConfigSchema = z.object({
  // 微信配置
  wechat: z.object({
    appId: z.string().min(1, "WECHAT_APP_ID 不能为空"),
    appSecret: z.string().min(1, "WECHAT_APP_SECRET 不能为空"),
  }).optional(),

  // 腾讯云 COS 配置
  cos: z.object({
    secretId: z.string().min(1, "COS_SECRET_ID 不能为空"),
    secretKey: z.string().min(1, "COS_SECRET_KEY 不能为空"),
    bucket: z.string().min(1, "COS_BUCKET 不能为空"),
    region: z.string().min(1, "COS_REGION 不能为空"),
    baseUrl: z.string().url("COS_BASE_URL 必须是有效的 URL"),
  }).optional(),

  // Mermaid 配置
  mermaid: z.object({
    engine: z.enum(["local", "kroki"]).default("local"),
    scale: z.number().positive().default(1),
    background: z.string().default("#ffffff"),
    format: z.enum(["png", "jpg"]).default("png"),
    handDrawn: z.object({
      enabled: z.boolean().default(false),
      roughness: z.number().min(0).max(3).default(1.5),
      fillStyle: z.enum(["hachure", "cross-hatch", "dots", "zigzag", "solid"]).default("hachure"),
    }).optional(),
  }).default({
    engine: "local",
    scale: 1,
    background: "#ffffff",
    format: "png",
  }),

  // 主题配置
  theme: z.object({
    default: z.string().default("orangeheart"),
  }).default({
    default: "orangeheart",
  }),

  // 输出配置
  output: z.object({
    dir: z.string().default(".assets"),
  }).default({
    dir: ".assets",
  }),
});

export type Config = z.infer<typeof ConfigSchema>;


