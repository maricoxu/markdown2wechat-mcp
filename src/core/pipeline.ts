import { convertMermaid, type ConvertMermaidOptions } from "../mermaid/renderer.js";
import { collectLocalImagesFromFile, type ImageInfo } from "../images/collect.js";
import { uploadImagesToCos, type CosUploadResult } from "../images/cos-uploader.js";
import { rewriteImageLinksInFile } from "../images/rewrite-links.js";
import { logger } from "../utils/log.js";
import { basename } from "path";

/**
 * Pipeline 执行上下文
 */
export interface PipelineContext {
  filePath: string; // 最终文件的路径（可能是 .converted.md 或 .cos.md）
  originalFilePath?: string; // 原文路径
  mermaidImages?: Array<{ index: number; alt?: string; localPath: string }>;
  collectedImages?: ImageInfo[];
  uploadResults?: CosUploadResult[];
  errors: Array<{ step: string; error: Error }>;
}

/**
 * Pipeline 选项
 */
export interface PipelineOptions {
  filePath: string;
  convertMermaid?: boolean;
  uploadImages?: boolean;
  mermaidOptions?: Omit<ConvertMermaidOptions, "filePath">;
  cosOptions?: { keyPrefix?: string; overwrite?: boolean };
}

/**
 * 执行完整的发布流水线
 * 流程：mermaid 转图 → 图片收集 → COS 上传 → 链接回写
 */
export async function executePipeline(options: PipelineOptions): Promise<PipelineContext> {
  const { filePath, convertMermaid: shouldConvertMermaid = false, uploadImages: shouldUploadImages = false, mermaidOptions, cosOptions } = options;

  const context: PipelineContext = {
    filePath,
    originalFilePath: filePath, // 保存原文路径
    errors: [],
  };

  logger.info(`开始执行 Pipeline: ${filePath}`);

  // 当前处理的文件路径（会随着步骤更新）
  let currentFilePath = filePath;

  // 步骤 1: Mermaid 转图（创建 .converted.md 文件）
  if (shouldConvertMermaid) {
    try {
      logger.info("转换 Mermaid 代码块...");
      const mermaidResult = await convertMermaid({
        filePath: currentFilePath,
        ...mermaidOptions,
      });
      context.mermaidImages = mermaidResult.images;
      // 更新当前文件路径为转换后的文件
      currentFilePath = mermaidResult.updatedMarkdownPath;
      logger.info(`已转换 ${mermaidResult.images.length} 个 Mermaid 图表`);
    } catch (error: any) {
      logger.error(`Mermaid 转换失败: ${error.message}`);
      logger.error(`错误堆栈: ${error.stack}`);
      context.errors.push({ step: "convertMermaid", error });
    }
  } else {
  }

  // 步骤 2: 收集所有本地图片（包括 mermaid 生成的图片）
  if (shouldUploadImages) {
    try {
      logger.info("收集本地图片...");
      // 从当前文件路径收集图片（可能是原文或转换后的文件）
      const images = collectLocalImagesFromFile(currentFilePath);
      context.collectedImages = images;
      logger.info(`找到 ${images.length} 个图片`);
    } catch (error: any) {
      logger.error(`图片收集失败: ${error.message}`);
      context.errors.push({ step: "collectImages", error });
    }

    // 步骤 3: 上传图片到 COS
    if (context.collectedImages && context.collectedImages.length > 0) {
      try {
        logger.info("上传图片到 COS...");
        const localPaths = context.collectedImages.map((img) => img.localPath);
        const uploadResults = await uploadImagesToCos(localPaths, cosOptions);
        context.uploadResults = uploadResults;

        // 步骤 4: 回写链接（创建 .cos.md 文件）
        try {
          logger.info("回写图片链接...");
          const previousFilePath = currentFilePath; // 保存转换前的路径
          const rewriteResult = rewriteImageLinksInFile(currentFilePath, uploadResults, true);
          // 更新当前文件路径为最终文件
          currentFilePath = rewriteResult.outputPath;
          logger.info(`已创建 COS 链接文档: ${basename(rewriteResult.outputPath)}`);
        } catch (error: any) {
          logger.error(`链接回写失败: ${error.message}`);
          context.errors.push({ step: "rewriteLinks", error });
        }
      } catch (error: any) {
        logger.error(`COS 上传失败: ${error.message}`);
        context.errors.push({ step: "uploadImages", error });
      }
    }
  }

  // 更新 context 中的文件路径为最终路径
  context.filePath = currentFilePath;

  if (context.errors.length > 0) {
    logger.warn(`Pipeline 完成，但有 ${context.errors.length} 个错误`);
  }

  return context;
}


