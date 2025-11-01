import { convertMermaid, type ConvertMermaidOptions } from "../mermaid/renderer.js";
import { collectLocalImagesFromFile, type ImageInfo } from "../images/collect.js";
import { uploadImagesToCos, type CosUploadResult } from "../images/cos-uploader.js";
import { rewriteImageLinksInFile } from "../images/rewrite-links.js";
import { logger } from "../utils/log.js";

/**
 * Pipeline 执行上下文
 */
export interface PipelineContext {
  filePath: string;
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
    errors: [],
  };

  logger.info(`开始执行 Pipeline: ${filePath}`);

  // 步骤 1: Mermaid 转图
  if (shouldConvertMermaid) {
    try {
      logger.info("步骤 1: 转换 Mermaid 代码块...");
      const mermaidResult = await convertMermaid({
        filePath,
        ...mermaidOptions,
      });
      context.mermaidImages = mermaidResult.images;
      logger.info(`已转换 ${mermaidResult.images.length} 个 Mermaid 图表`);
    } catch (error: any) {
      logger.error(`Mermaid 转换失败: ${error.message}`);
      context.errors.push({ step: "convertMermaid", error });
    }
  }

  // 步骤 2: 收集所有本地图片（包括 mermaid 生成的图片）
  if (shouldUploadImages) {
    try {
      logger.info("步骤 2: 收集本地图片...");
      const images = collectLocalImagesFromFile(filePath);
      context.collectedImages = images;
      logger.info(`找到 ${images.length} 个本地图片`);
    } catch (error: any) {
      logger.error(`图片收集失败: ${error.message}`);
      context.errors.push({ step: "collectImages", error });
    }

    // 步骤 3: 上传图片到 COS
    if (context.collectedImages && context.collectedImages.length > 0) {
      try {
        logger.info("步骤 3: 上传图片到 COS...");
        const localPaths = context.collectedImages.map((img) => img.localPath);
        const uploadResults = await uploadImagesToCos(localPaths, cosOptions);
        context.uploadResults = uploadResults;
        logger.info(`成功上传 ${uploadResults.length} 个图片`);

        // 步骤 4: 回写链接
        try {
          logger.info("步骤 4: 回写图片链接...");
          rewriteImageLinksInFile(filePath, uploadResults);
          logger.info("图片链接回写完成");
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

  if (context.errors.length > 0) {
    logger.warn(`Pipeline 执行完成，但有 ${context.errors.length} 个错误`);
  } else {
    logger.info("Pipeline 执行成功");
  }

  return context;
}


