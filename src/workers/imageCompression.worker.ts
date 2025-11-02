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
          // 确保进度值在 0-100 之间
          const clampedProgress = Math.min(
            100,
            Math.max(0, Math.round(progress * 100))
          );
          self.postMessage({
            type: "progress",
            data: {
              id,
              progress: clampedProgress,
            },
          });
        };

        // 如果是像素尺寸模式，只调整尺寸，不压缩
        if (
          config.compressionMode === "pixel" &&
          !config.alwaysKeepResolution
        ) {
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
                targetHeight = Math.round(
                  config.maxWidth / originalAspectRatio
                );
              } else {
                // 图片更高，以高度为准
                targetHeight = config.maxHeight;
                targetWidth = Math.round(
                  config.maxHeight * originalAspectRatio
                );
              }
            } else {
              // 使用 maxWidthOrHeight
              if (originalWidth > originalHeight) {
                targetWidth = config.maxWidthOrHeight;
                targetHeight = Math.round(
                  config.maxWidthOrHeight / originalAspectRatio
                );
              } else {
                targetHeight = config.maxWidthOrHeight;
                targetWidth = Math.round(
                  config.maxWidthOrHeight * originalAspectRatio
                );
              }
            }
          } else {
            // 自由比例模式：直接使用设置的宽高
            targetWidth = config.maxWidth || config.maxWidthOrHeight;
            targetHeight = config.maxHeight || config.maxWidthOrHeight;
          }

          // 检查是否需要调整尺寸（如果目标尺寸大于或等于原图尺寸，且保持比例，则不需要处理）
          const needsResize =
            targetWidth < img.width || targetHeight < img.height;

          if (!needsResize && config.keepAspectRatio) {
            // 不需要缩小，直接返回原图
            const result: CompressionResult = {
              id,
              success: true,
              compressedBlob: file,
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0,
            };
            self.postMessage({
              type: "complete",
              data: { id, result },
            });
            break;
          }

          // 使用 Canvas 调整图片尺寸
          // 智能选择质量：如果目标尺寸明显小于原图，使用较低质量；否则使用中等质量避免文件变大
          const sizeReduction =
            (targetWidth * targetHeight) / (img.width * img.height);
          let quality = 1; // 默认高质量

          // 如果尺寸缩小超过 50%，可以使用更低的质量
          if (sizeReduction < 0.5) {
            quality = 0.85;
          } else if (sizeReduction < 0.75) {
            quality = 0.9;
          } else {
            // 尺寸变化不大时，使用较低质量避免文件变大（特别是对于已经压缩过的图片）
            quality = 0.8;
          }

          const canvas = new OffscreenCanvas(targetWidth, targetHeight);
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const blob = await canvas.convertToBlob({
              type: config.fileType,
              quality,
            });
            const compressedFile = new File([blob], file.name, {
              type: config.fileType,
            });

            // 如果压缩后文件反而变大，返回原图
            const finalFile =
              compressedFile.size > file.size ? file : compressedFile;
            const finalSize = finalFile.size;

            const result: CompressionResult = {
              id,
              success: true,
              compressedBlob: finalFile,
              originalSize: file.size,
              compressedSize: finalSize,
              compressionRatio: Math.round((1 - finalSize / file.size) * 100),
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

        // 检查原图是否已经小于目标大小（仅文件大小模式）
        if (config.compressionMode === "size") {
          const fileSizeMB = file.size / (1024 * 1024);
          if (fileSizeMB <= config.maxSizeMB) {
            // 原图已经小于等于目标大小，直接返回原图
            const result: CompressionResult = {
              id,
              success: true,
              compressedBlob: file,
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0,
            };
            self.postMessage({
              type: "complete",
              data: { id, result },
            });
            break;
          }
        }

        // 如果不是保持比例模式，且有明确的宽高设置，需要先调整尺寸
        if (
          !config.keepAspectRatio &&
          config.maxWidth &&
          config.maxHeight &&
          !config.alwaysKeepResolution
        ) {
          // 使用 Canvas 调整图片尺寸到指定宽高（可能扭曲）
          const img = await createImageBitmap(file);
          const canvas = new OffscreenCanvas(config.maxWidth, config.maxHeight);
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, config.maxWidth, config.maxHeight);
            // 使用中等质量避免文件变大
            const blob = await canvas.convertToBlob({
              type: config.fileType,
              quality: 0.85,
            });
            const resizedFile = new File([blob], file.name, {
              type: config.fileType,
            });
            // 如果调整尺寸后文件反而变大，使用原图继续处理
            imageFile = resizedFile.size > file.size ? file : resizedFile;
          }
        }

        // 准备压缩选项
        const compressionOptions: {
          maxSizeMB: number;
          useWebWorker: boolean;
          onProgress?: (progress: number) => void;
          initialQuality?: number;
          fileType?: string;
          maxWidthOrHeight?: number;
          maxWidth?: number;
          maxHeight?: number;
          alwaysKeepResolution?: boolean;
        } = {
          maxSizeMB: config.maxSizeMB,
          useWebWorker: false, // 避免嵌套 worker
          alwaysKeepResolution: config.alwaysKeepResolution,
          fileType: config.fileType,
          onProgress: progressCallback,
        };

        // 质量参数说明：
        // - 对于 JPEG/WebP：quality 直接控制有损压缩质量
        // - 对于 PNG：虽然 PNG 本身是无损的，但 browser-image-compression 会：
        //   1. 根据 quality 参数决定是否/如何缩小尺寸
        //   2. quality 越低，库会更激进地缩小尺寸以达到目标文件大小
        //   3. 这就是为什么降低 initialQuality 可以压缩 PNG

        // 始终设置质量参数，让 browser-image-compression 智能处理
        compressionOptions.initialQuality = config.initialQuality;

        // 根据压缩模式和配置设置选项
        if (config.compressionMode === "size") {
          // 文件大小模式：优先考虑 maxSizeMB
          compressionOptions.alwaysKeepResolution = false;

          // 对于 PNG，设置尺寸限制作为辅助
          if (config.fileType === "image/png") {
            // PNG 压缩策略：
            // 1. browser-image-compression 会根据 initialQuality 和 maxSizeMB 自动调整尺寸
            // 2. 我们提供 maxWidthOrHeight 作为上限，防止图片过大
            // 3. quality 越低，库会更激进地缩小尺寸
            if (config.keepAspectRatio) {
              if (config.maxWidth && config.maxHeight) {
                compressionOptions.maxWidth = config.maxWidth;
                compressionOptions.maxHeight = config.maxHeight;
              } else {
                compressionOptions.maxWidthOrHeight = config.maxWidthOrHeight;
              }
            } else {
              compressionOptions.maxWidthOrHeight = config.maxWidthOrHeight;
            }
          } else {
            // 非 PNG 格式：如果设置了 maxWidthOrHeight，可以作为上限参考
            if (config.maxWidthOrHeight && config.maxWidthOrHeight < 10000) {
              compressionOptions.maxWidthOrHeight = config.maxWidthOrHeight;
            }
          }
        } else if (config.compressionMode === "pixel") {
          // 像素模式已经在上面处理了，不会到这里
        } else {
          // 质量模式或其他模式：根据设置添加尺寸限制
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
        }

        // 执行压缩
        const compressedFile = await imageCompression(
          imageFile,
          compressionOptions
        );

        // 直接检查压缩结果
        const finalFile = compressedFile;
        const finalSize = compressedFile.size;
        const targetSizeBytes = config.maxSizeMB * 1024 * 1024;

        // 文件大小模式：检查是否达到目标
        if (config.compressionMode === "size") {
          // 检查压缩结果
          if (finalSize >= file.size) {
            // 文件没有变小，失败
            self.postMessage({
              type: "error",
              data: {
                id,
                error: `压缩失败：无法将文件压缩到更小。原始大小 ${(
                  file.size / 1024
                ).toFixed(2)}KB`,
              },
            });
            break;
          } else if (finalSize > targetSizeBytes) {
            // 没有达到目标大小，失败
            self.postMessage({
              type: "error",
              data: {
                id,
                error: `压缩失败：无法达到目标大小 ${(
                  targetSizeBytes / 1024
                ).toFixed(2)}KB。原始 ${(file.size / 1024).toFixed(
                  2
                )}KB → 压缩后 ${(finalSize / 1024).toFixed(2)}KB`,
              },
            });
            break;
          }
          // 达到目标且比原图小，继续往下执行（显示成功）
        } else if (finalSize >= file.size) {
          // 非 size 模式，如果压缩失败
          self.postMessage({
            type: "error",
            data: {
              id,
              error: `压缩失败：压缩后大小 ${(finalSize / 1024).toFixed(
                2
              )}KB ≥ 原始大小 ${(file.size / 1024).toFixed(2)}KB`,
            },
          });
          break;
        }

        // 计算压缩结果
        const result: CompressionResult = {
          id,
          success: true,
          compressedBlob: finalFile,
          originalSize: file.size,
          compressedSize: finalSize,
          compressionRatio: Math.round((1 - finalSize / file.size) * 100),
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
