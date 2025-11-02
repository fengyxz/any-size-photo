import imageCompression from "browser-image-compression";
import type {
  WorkerMessage,
  CompressionConfig,
  CompressionResult,
} from "../types";

// 监听主线程消息
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  try {
    switch (type) {
      case "compress": {
        const { id, file, config } = data;

        // 发送进度更新
        const progressCallback = (progress: number) => {
          self.postMessage({
            type: "progress",
            data: {
              id,
              progress: Math.round(progress * 100),
            },
          });
        };

        // 如果是像素尺寸模式，只调整尺寸，不压缩
        if (config.compressionMode === "pixel" && !config.alwaysKeepResolution) {
          const img = await createImageBitmap(file);
          
          let targetWidth: number;
          let targetHeight: number;
          
          // 计算目标尺寸
          if (config.keepAspectRatio) {
            // 保持比例模式
            const originalWidth = img.width;
            const originalHeight = img.height;
            const originalAspectRatio = originalWidth / originalHeight;
            
            if (config.maxWidth && config.maxHeight) {
              const targetAspectRatio = config.maxWidth / config.maxHeight;
              if (originalAspectRatio > targetAspectRatio) {
                // 图片更宽，以宽度为准
                targetWidth = config.maxWidth;
                targetHeight = Math.round(config.maxWidth / originalAspectRatio);
              } else {
                // 图片更高，以高度为准
                targetHeight = config.maxHeight;
                targetWidth = Math.round(config.maxHeight * originalAspectRatio);
              }
            } else {
              // 使用 maxWidthOrHeight
              if (originalWidth > originalHeight) {
                targetWidth = config.maxWidthOrHeight;
                targetHeight = Math.round(config.maxWidthOrHeight / originalAspectRatio);
              } else {
                targetHeight = config.maxWidthOrHeight;
                targetWidth = Math.round(config.maxWidthOrHeight * originalAspectRatio);
              }
            }
          } else {
            // 自由比例模式：直接使用设置的宽高
            targetWidth = config.maxWidth || config.maxWidthOrHeight;
            targetHeight = config.maxHeight || config.maxWidthOrHeight;
          }
          
          // 使用 Canvas 调整图片尺寸，质量设为 1（不压缩）
          const canvas = new OffscreenCanvas(targetWidth, targetHeight);
          const ctx = canvas.getContext("2d");
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const blob = await canvas.convertToBlob({ 
              type: config.fileType, 
              quality: 1 // 不压缩，保持最高质量
            });
            const compressedFile = new File([blob], file.name, { type: config.fileType });
            
            // 直接返回结果，不进行进一步压缩
            const result: CompressionResult = {
              id,
              success: true,
              compressedBlob: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: Math.round(
                (1 - compressedFile.size / file.size) * 100
              ),
            };

            self.postMessage({
              type: "complete",
              data: {
                id,
                result,
              },
            });
            break;
          }
        }

        // 其他模式：正常压缩处理
        let imageFile = file;
        
        // 如果不是保持比例模式，且有明确的宽高设置，需要先调整尺寸
        if (!config.keepAspectRatio && config.maxWidth && config.maxHeight && !config.alwaysKeepResolution) {
          // 使用 Canvas 调整图片尺寸到指定宽高（可能扭曲）
          const img = await createImageBitmap(file);
          const canvas = new OffscreenCanvas(config.maxWidth, config.maxHeight);
          const ctx = canvas.getContext("2d");
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, config.maxWidth, config.maxHeight);
            const blob = await canvas.convertToBlob({ type: config.fileType, quality: 1 });
            imageFile = new File([blob], file.name, { type: config.fileType });
          }
        }

        // 准备压缩选项
        const compressionOptions: any = {
          maxSizeMB: config.maxSizeMB,
          useWebWorker: false, // 避免嵌套 worker
          initialQuality: config.initialQuality,
          alwaysKeepResolution: config.alwaysKeepResolution,
          fileType: config.fileType,
          onProgress: progressCallback,
        };

        // 根据模式设置尺寸选项
        if (config.keepAspectRatio) {
          // 保持比例模式：使用 maxWidthOrHeight 或 maxWidth/maxHeight
          if (config.maxWidth && config.maxHeight) {
            compressionOptions.maxWidth = config.maxWidth;
            compressionOptions.maxHeight = config.maxHeight;
          } else {
            compressionOptions.maxWidthOrHeight = config.maxWidthOrHeight;
          }
        } else {
          // 自由比例模式：如果已经通过 Canvas 调整了尺寸，就不需要再设置尺寸限制
          if (!(config.maxWidth && config.maxHeight)) {
            compressionOptions.maxWidthOrHeight = config.maxWidthOrHeight;
          }
        }

        // 执行压缩
        const compressedFile = await imageCompression(imageFile, compressionOptions);

        // 计算压缩结果
        const result: CompressionResult = {
          id,
          success: true,
          compressedBlob: compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          compressionRatio: Math.round(
            (1 - compressedFile.size / file.size) * 100
          ),
        };

        // 发送完成消息
        self.postMessage({
          type: "complete",
          data: {
            id,
            result,
          },
        });
        break;
      }

      default:
        throw new Error(`未知的消息类型: ${type}`);
    }
  } catch (error) {
    // 发送错误消息
    self.postMessage({
      type: "error",
      data: {
        id: data.id,
        error:
          error instanceof Error ? error.message : "压缩过程中发生未知错误",
      },
    });
  }
};

// 导出类型以便 TypeScript 识别
export type { WorkerMessage, CompressionConfig, CompressionResult };
