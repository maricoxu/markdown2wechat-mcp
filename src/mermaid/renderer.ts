import { parseFrontMatter, mergeFrontMatter } from "../parser/frontmatter.js";
import { readFile, writeFile, ensureDir, getFilenameWithoutExt } from "../utils/fs.js";
import { executeCommand, isCommandAvailable } from "../utils/exec.js";
import { resolve, dirname, join } from "path";
import { getConfig } from "../config/load.js";
import { logger } from "../utils/log.js";
import { convertSvgToHandDrawn, type HandDrawnOptions } from "./hand-drawn.js";

/**
 * Mermaid 图片信息
 */
export interface MermaidImage {
  index: number; // 在文档中的顺序（从 0 开始）
  alt?: string; // 原代码块中的 alt 文本（如果有）
  localPath: string; // 生成的图片本地路径
}

/**
 * Mermaid 转换结果
 */
export interface ConvertMermaidResult {
  images: MermaidImage[];
  updatedMarkdownPath: string; // 更新后的 Markdown 文件路径
}

/**
 * Mermaid 转换选项
 */
export interface ConvertMermaidOptions {
  filePath: string; // Markdown 文件路径
  outDir?: string; // 输出目录，默认同目录下的 .assets
  format?: "png" | "jpg"; // 图片格式
  scale?: number; // 缩放比例
  background?: string; // 背景颜色
  engine?: "local" | "kroki"; // 渲染引擎
  handDrawn?: HandDrawnOptions; // 手绘风格选项
}

/**
 * 检测 Markdown 中的 mermaid 代码块
 */
function extractMermaidBlocks(content: string): Array<{ index: number; code: string; alt?: string; fullMatch: string; startIndex: number; endIndex: number }> {
  const mermaidRegex = /```mermaid(?::(.+?))?\n([\s\S]*?)```/g;
  const blocks: Array<{ index: number; code: string; alt?: string; fullMatch: string; startIndex: number; endIndex: number }> = [];
  let match;
  let index = 0;

  while ((match = mermaidRegex.exec(content)) !== null) {
    const alt = match[1]?.trim();
    const code = match[2].trim();
    blocks.push({
      index: index++,
      code,
      alt,
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return blocks;
}

/**
 * 检测 Mermaid 图表类型
 */
function detectMermaidType(mermaidCode: string): string {
  const trimmed = mermaidCode.trim().toLowerCase();
  const firstLine = trimmed.split('\n')[0];
  
  if (firstLine.startsWith('gantt')) return 'gantt';
  if (firstLine.startsWith('pie')) return 'pie';
  if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) return 'flowchart';
  if (firstLine.startsWith('sequencediagram')) return 'sequencediagram';
  if (firstLine.startsWith('classdiagram')) return 'classdiagram';
  if (firstLine.startsWith('statediagram')) return 'statediagram';
  
  return 'unknown';
}

/**
 * 判断图表类型是否适合手绘风格
 * 甘特图和饼图需要精确的视觉表示，不适合手绘风格
 */
function isHandDrawnSuitable(chartType: string): boolean {
  // 不适合手绘风格的图表类型
  const unsuitableTypes = ['gantt', 'pie'];
  return !unsuitableTypes.includes(chartType);
}

/**
 * 使用本地 mermaid-cli 渲染
 */
async function renderWithLocal(
  mermaidCode: string,
  outputPath: string,
  options: {
    format: "png" | "jpg";
    scale: number;
    background: string;
    handDrawn?: HandDrawnOptions;
  }
): Promise<void> {
  // 创建临时 mermaid 文件
  const tempMermaidPath = outputPath.replace(/\.(png|jpg)$/, ".mmd");
  writeFile(tempMermaidPath, mermaidCode);

  try {
    // 检查 mmdc 是否可用
    const mmdcAvailable = await isCommandAvailable("mmdc");
    const commandPrefix = mmdcAvailable ? "mmdc" : "npx @mermaid-js/mermaid-cli";

    // 检测图表类型并决定是否应用手绘风格
    const chartType = detectMermaidType(mermaidCode);
    const shouldApplyHandDrawn = options.handDrawn?.enabled && isHandDrawnSuitable(chartType);
    
    if (shouldApplyHandDrawn) {
      logger.debug(`图表类型: ${chartType}，应用手绘风格`);
    } else if (options.handDrawn?.enabled && !isHandDrawnSuitable(chartType)) {
      logger.info(`图表类型: ${chartType}，跳过手绘风格（该类型需要精确的视觉表示）`);
    }

    // 如果启用手绘风格且图表类型适合，先渲染为 SVG，然后转换
    if (shouldApplyHandDrawn) {
      const svgPath = outputPath.replace(/\.(png|jpg)$/, ".svg");

      // 渲染为 SVG
      const svgCommand = `${commandPrefix} -i ${tempMermaidPath} -o ${svgPath} --outputFormat svg --scale ${options.scale} --backgroundColor "${options.background}"`;
      await executeCommand(svgCommand);

      logger.info(`SVG 已生成，开始应用手绘风格...`);

      // 应用手绘风格并转换为目标格式
      await convertSvgToHandDrawn(svgPath, outputPath, {
        enabled: true, // 明确设置为true，因为已经在shouldApplyHandDrawn中判断
        roughness: options.handDrawn?.roughness,
        fillStyle: options.handDrawn?.fillStyle,
        finalFormat: options.format,
      });
    } else {
      // 直接渲染为 PNG/JPG
      const formatFlag = options.format === "jpg" ? "-t jpg" : "";
      const command = `${commandPrefix} -i ${tempMermaidPath} -o ${outputPath} --scale ${options.scale} --backgroundColor "${options.background}" ${formatFlag}`.trim();

      await executeCommand(command);
    }
  } finally {
    // 保留 .mmd 文件以便调试（可选清理）
  }
}

/**
 * 使用 Kroki 云服务渲染（备选方案）
 */
async function renderWithKroki(
  mermaidCode: string,
  outputPath: string,
  options: { format: "png" | "jpg" }
): Promise<void> {
  const format = options.format === "jpg" ? "png" : "png"; // Kroki 只支持 PNG
  const encoded = encodeURIComponent(mermaidCode);
  const url = `https://kroki.io/mermaid/${format}/${encoded}`;

  // 使用 curl 或 fetch 下载
  const command = `curl -s "${url}" -o "${outputPath}"`;
  await executeCommand(command);
}

/**
 * 转换 Mermaid 代码块为图片
 */
export async function convertMermaid(options: ConvertMermaidOptions): Promise<ConvertMermaidResult> {
  const config = getConfig();
  
  const {
    filePath,
    outDir,
    format = config.mermaid.format,
    scale = config.mermaid.scale,
    background = config.mermaid.background,
    engine = config.mermaid.engine,
    handDrawn = config.mermaid.handDrawn,
  } = options;

  // 读取 Markdown 文件
  const content = readFile(filePath);
  const { frontmatter, body } = parseFrontMatter(content);

  // 提取所有 mermaid 代码块
  const mermaidBlocks = extractMermaidBlocks(body);
  
  if (mermaidBlocks.length === 0) {
    logger.info("未找到 mermaid 代码块");
    return {
      images: [],
      updatedMarkdownPath: filePath,
    };
  }

  logger.info(`找到 ${mermaidBlocks.length} 个 mermaid 代码块`);

  // 确定输出目录
  const fileDir = dirname(filePath);
  const filenameBase = getFilenameWithoutExt(filePath);
  const outputDirectory = outDir || join(fileDir, config.output.dir);
  ensureDir(outputDirectory);

  // 处理每个 mermaid 代码块
  const images: MermaidImage[] = [];
  const replacements: Array<{ startIndex: number; endIndex: number; replacement: string }> = [];
  let updatedBody = body;

  // 第一步：渲染所有图片并记录替换信息
  for (let i = 0; i < mermaidBlocks.length; i++) {
    const block = mermaidBlocks[i];
    const outputFilename = `${filenameBase}__mmd_${i}.${format}`;
    const outputPath = join(outputDirectory, outputFilename);

    try {
      // 渲染图片
      if (engine === "local") {
        await renderWithLocal(block.code, outputPath, {
          format,
          scale,
          background,
          handDrawn,
        });
      } else {
        await renderWithKroki(block.code, outputPath, { format });
        // 注意：Kroki 不支持手绘风格（因为输出是 PNG）
      }

      logger.info(`已渲染 mermaid 图表 ${i + 1}/${mermaidBlocks.length}: ${outputPath}`);

      // 构建图片引用路径（相对于 Markdown 文件）
      const relativePath = join(config.output.dir, outputFilename);
      const imageMarkdown = `![${block.alt || `mermaid-${i + 1}`}](${relativePath})\n\n`;

      // 记录替换信息（使用原始位置）
      replacements.push({
        startIndex: block.startIndex,
        endIndex: block.endIndex,
        replacement: imageMarkdown,
      });

      images.push({
        index: i,
        alt: block.alt,
        localPath: outputPath,
      });
    } catch (error: any) {
      logger.error(`渲染 mermaid 图表 ${i + 1} 失败: ${error.message}`);
      // 继续处理其他图表，不中断整个流程
    }
  }

  // 第二步：从后往前替换（避免索引偏移问题）
  replacements.sort((a, b) => b.startIndex - a.startIndex);
  for (const { startIndex, endIndex, replacement } of replacements) {
    updatedBody = updatedBody.substring(0, startIndex) + replacement + updatedBody.substring(endIndex);
  }

  // 合并 frontmatter 和更新后的正文
  const updatedContent = mergeFrontMatter(frontmatter, updatedBody);

  // 写回文件（可选：可以生成新文件）
  writeFile(filePath, updatedContent);

  return {
    images,
    updatedMarkdownPath: filePath,
  };
}

