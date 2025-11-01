#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getGzhContent } from "@wenyan-md/core/wrapper";
import { publishToDraft } from "@wenyan-md/core/publish";
import { themes, Theme } from "@wenyan-md/core/theme";
import { convertMermaid, type ConvertMermaidOptions } from "./mermaid/renderer.js";
import { collectLocalImagesFromFile } from "./images/collect.js";
import { uploadImagesToCos } from "./images/cos-uploader.js";
import { rewriteImageLinksInFile } from "./images/rewrite-links.js";
import { executePipeline } from "./core/pipeline.js";
import { readFile } from "./utils/fs.js";
import { parseFrontMatterFromFile } from "./parser/frontmatter.js";
import { getConfig } from "./config/load.js";

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
    {
        name: "wenyan-mcp",
        version: "0.1.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {},
            prompts: {},
            // logging: {},
        },
    }
);

/**
 * Handler that lists available tools.
 * Exposes a single "publish_article" tool that lets clients publish new article.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "publish_article",
                description:
                    "Format a Markdown article using a selected theme and publish it to '微信公众号'. (Legacy: accepts content string)",
                inputSchema: {
                    type: "object",
                    properties: {
                        content: {
                            type: "string",
                            description: "The original Markdown content to publish, preserving its frontmatter (if present).",
                        },
                        theme_id: {
                            type: "string",
                            description:
                                "ID of the theme to use (e.g., default, orangeheart, rainbow, lapis, pie, maize, purple, phycat).",
                        },
                    },
                    required: ["content"],
                },
            },
            {
                name: "convert_mermaid",
                description:
                    "Convert mermaid code blocks in a Markdown file to PNG/JPG images and replace them with image references.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the Markdown file",
                        },
                        outDir: {
                            type: "string",
                            description: "Output directory for generated images (default: .assets in same directory)",
                        },
                        format: {
                            type: "string",
                            enum: ["png", "jpg"],
                            description: "Image format (default: png)",
                        },
                        scale: {
                            type: "number",
                            description: "Scale factor (default: 1)",
                        },
                        background: {
                            type: "string",
                            description: "Background color (default: #ffffff)",
                        },
                        engine: {
                            type: "string",
                            enum: ["local", "kroki"],
                            description: "Rendering engine (default: local)",
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "image_upload_cos",
                description:
                    "Collect local images from a Markdown file and upload them to Tencent Cloud COS, then replace local paths with COS URLs.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the Markdown file",
                        },
                        keyPrefix: {
                            type: "string",
                            description: "COS key prefix (e.g., articles/2025/10/)",
                        },
                        overwrite: {
                            type: "boolean",
                            description: "Whether to overwrite existing files (default: false)",
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "publish_wechat",
                description:
                    "Publish a Markdown file to WeChat public account draft box. Supports pipeline: convert mermaid → upload images → theme rendering → publish.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the Markdown file",
                        },
                        theme: {
                            type: "string",
                            description: "Theme ID (default: from config or orangeheart)",
                        },
                        runPipeline: {
                            type: "object",
                            properties: {
                                convertMermaid: {
                                    type: "boolean",
                                    description: "Whether to convert mermaid blocks to images (default: false)",
                                },
                                uploadImages: {
                                    type: "boolean",
                                    description: "Whether to upload local images to COS (default: false)",
                                },
                            },
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "list_themes",
                description:
                    "List the themes compatible with the 'publish_article' tool to publish an article to '微信公众号'.",
                inputSchema: {
                    type: "object",
                    properties: {}
                },
            },
        ],
    };
});

/**
 * Handler for the publish_article tool.
 * Publish a new article with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "publish_article") {
        // server.sendLoggingMessage({
        //     level: "debug",
        //     data: JSON.stringify(request.params.arguments),
        // });
        let content = String(request.params.arguments?.content || "");
        // 预处理：解码图片路径中的URL编码
        content = content.replace(/!\[([^\]]*)\]\((.*?)\)/g, (match, alt, path) => {
            try {
                const decodedPath = decodeURIComponent(path);
                return `![${alt}](${decodedPath})`;
            } catch (e) {
                return match; // 如果解码失败，保持原样
            }
        });
        const themeId = String(request.params.arguments?.theme_id || "");
        const gzhContent = await getGzhContent(content, themeId, "solarized-light", true, true);
        const title = gzhContent.title ?? "this is title";
        const cover = gzhContent.cover ?? "";
        const response = await publishToDraft(title, gzhContent.content, cover);

        return {
            content: [
                {
                    type: "text",
                    text: `Your article was successfully published to '公众号草稿箱'. The media ID is ${response.media_id}.`,
                },
            ],
        };
    } else if (request.params.name === "convert_mermaid") {
        const filePath = String(request.params.arguments?.filePath || "");
        if (!filePath) {
            throw new Error("filePath is required");
        }

        const options: ConvertMermaidOptions = {
            filePath,
            outDir: request.params.arguments?.outDir as string | undefined,
            format: request.params.arguments?.format as "png" | "jpg" | undefined,
            scale: request.params.arguments?.scale as number | undefined,
            background: request.params.arguments?.background as string | undefined,
            engine: request.params.arguments?.engine as "local" | "kroki" | undefined,
        };

        const result = await convertMermaid(options);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        images: result.images,
                        updatedMarkdownPath: result.updatedMarkdownPath,
                    }),
                },
            ],
        };
    } else if (request.params.name === "image_upload_cos") {
        const filePath = String(request.params.arguments?.filePath || "");
        if (!filePath) {
            throw new Error("filePath is required");
        }

        // 收集图片
        const images = collectLocalImagesFromFile(filePath);
        
        if (images.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            uploaded: [],
                            updatedMarkdownPath: filePath,
                        }),
                    },
                ],
            };
        }

        // 上传图片
        const localPaths = images.map((img) => img.localPath);
        const uploadResults = await uploadImagesToCos(localPaths, {
            keyPrefix: request.params.arguments?.keyPrefix as string | undefined,
            overwrite: request.params.arguments?.overwrite as boolean | undefined,
        });

        // 回写链接
        rewriteImageLinksInFile(filePath, uploadResults);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        uploaded: uploadResults,
                        updatedMarkdownPath: filePath,
                    }),
                },
            ],
        };
    } else if (request.params.name === "publish_wechat") {
        const filePath = String(request.params.arguments?.filePath || "");
        if (!filePath) {
            throw new Error("filePath is required");
        }

        const config = getConfig();
        const themeId = (request.params.arguments?.theme as string) || config.theme.default;
        const runPipeline = request.params.arguments?.runPipeline as {
            convertMermaid?: boolean;
            uploadImages?: boolean;
        } | undefined;

        // 执行 Pipeline（如果启用）
        if (runPipeline?.convertMermaid || runPipeline?.uploadImages) {
            await executePipeline({
                filePath,
                convertMermaid: runPipeline?.convertMermaid || false,
                uploadImages: runPipeline?.uploadImages || false,
            });
        }

        // 读取更新后的内容
        const content = readFile(filePath);
        
        // 预处理：解码图片路径中的URL编码
        let processedContent = content.replace(/!\[([^\]]*)\]\((.*?)\)/g, (match, alt, path) => {
            try {
                const decodedPath = decodeURIComponent(path);
                return `![${alt}](${decodedPath})`;
            } catch (e) {
                return match;
            }
        });

        // 使用原有逻辑发布
        const gzhContent = await getGzhContent(processedContent, themeId, "solarized-light", true, true);
        const { frontmatter } = parseFrontMatterFromFile(filePath);
        const title = gzhContent.title || frontmatter.title || "Untitled";
        const cover = gzhContent.cover || frontmatter.cover || "";
        
        const response = await publishToDraft(title, gzhContent.content, cover);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        draftId: response.media_id,
                        title,
                        cover,
                    }),
                },
            ],
        };
    } else if (request.params.name === "list_themes") {
        const themeResources = Object.entries(themes).map(([id, theme]: [string, Theme]) => ({
            type: "text",
            text: JSON.stringify({
                id: theme.id,
                name: theme.name,
                description: theme.description
            }),
        }));
        return {
            content: themeResources,
        };
    }

    throw new Error("Unknown tool");
});


/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
