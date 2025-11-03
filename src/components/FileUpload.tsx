import React, { useRef, useCallback, useMemo, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Download,
  Inbox,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatFileSize } from "@/lib/utils";
import type { ImageFile } from "@/types";
import libheif from "libheif-js";

interface FileUploadProps {
  files: ImageFile[];
  onFilesChange: (files: File[]) => void;
  onRemoveFile: (fileId: string) => void;
  onRetryFile: (fileId: string) => void;
  isProcessing: boolean;
  sizeUnit: "auto" | "B" | "KB" | "MB" | "GB";
}

export const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  onRemoveFile,
  onRetryFile,
  isProcessing,
  sizeUnit,
}) => {
  return (
    <FileUploadContent
      files={files}
      onFilesChange={onFilesChange}
      onRemoveFile={onRemoveFile}
      onRetryFile={onRetryFile}
      isProcessing={isProcessing}
      sizeUnit={sizeUnit}
    />
  );
};

const FileUploadContent: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  onRemoveFile,
  onRetryFile,
  isProcessing,
  sizeUnit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState({
    current: 0,
    total: 0,
  });

  // 转换 HEIC 文件为 JPEG
  const convertHeicFiles = useCallback(
    async (files: File[]): Promise<File[]> => {
      const heicFiles: File[] = [];
      const normalFiles: File[] = [];

      // 分类文件
      files.forEach((file) => {
        const isHeic =
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif");

        if (isHeic) {
          heicFiles.push(file);
        } else {
          normalFiles.push(file);
        }
      });

      if (heicFiles.length === 0) {
        return files; // 没有HEIC文件，直接返回
      }

      // 开始转换
      setIsConverting(true);
      setConvertProgress({ current: 0, total: heicFiles.length });

      const convertedFiles: File[] = [];
      const failedFiles: Array<{ name: string; error: string }> = [];

      // 初始化 libheif 解码器 (WebAssembly 版本，更强大)
      const decoder = new libheif.HeifDecoder();

      for (let i = 0; i < heicFiles.length; i++) {
        const heicFile = heicFiles[i];
        setConvertProgress({ current: i + 1, total: heicFiles.length });

        try {
          console.log(
            `[libheif] 开始转换 ${heicFile.name}, 大小: ${heicFile.size}`
          );

          // 1. 读取文件为 ArrayBuffer
          const arrayBuffer = await heicFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          // 2. 解码 HEIC 文件
          const images = decoder.decode(uint8Array);
          if (!images || images.length === 0) {
            throw new Error("未找到图像数据");
          }

          // 3. 获取主图（Live Photo 会有多张，取第一张）
          const image = images[0];
          const width = image.get_width();
          const height = image.get_height();

          console.log(`[libheif] 解码成功: ${width}x${height}px`);

          // 4. 转换为 ImageData (RGBA)
          const imageData = await new Promise<ImageData>((resolve, reject) => {
            const buffer = new Uint8ClampedArray(width * height * 4);
            image.display(
              { data: buffer, width, height },
              (displayData: {
                data: Uint8ClampedArray;
                width: number;
                height: number;
              }) => {
                if (!displayData || !displayData.data) {
                  reject(new Error("显示数据为空"));
                  return;
                }
                // 使用传入的 buffer 创建 ImageData
                const imgData = new ImageData(
                  new Uint8ClampedArray(buffer),
                  displayData.width,
                  displayData.height
                );
                resolve(imgData);
              }
            );
          });

          // 5. 使用 Canvas 转换为 JPEG
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("无法创建 Canvas 上下文");
          }

          ctx.putImageData(imageData, 0, 0);

          // 6. 导出为 JPEG Blob
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => {
                if (b) resolve(b);
                else reject(new Error("Canvas toBlob 失败"));
              },
              "image/jpeg",
              0.95 // 高质量
            );
          });

          // 7. 创建新的 File 对象
          const newFileName = heicFile.name.replace(/\.(heic|heif)$/i, ".jpg");
          const convertedFile = new File([blob], newFileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          console.log(
            `[libheif] ✅ ${newFileName}, 大小: ${convertedFile.size}`
          );
          convertedFiles.push(convertedFile);
        } catch (error) {
          console.error(`[libheif] ❌ ${heicFile.name}:`, error);
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          failedFiles.push({ name: heicFile.name, error: errorMsg });
        }
      }

      setIsConverting(false);
      setConvertProgress({ current: 0, total: 0 });

      // 显示转换结果摘要
      if (failedFiles.length > 0) {
        const failedList = failedFiles
          .map((f) => `  • ${f.name}: ${f.error}`)
          .join("\n");

        alert(
          `⚠️ HEIC 转换完成\n\n` +
            `✅ 成功: ${convertedFiles.length} 个文件\n` +
            `❌ 失败: ${failedFiles.length} 个文件\n\n` +
            `失败详情：\n${failedList}\n\n` +
            `建议：\n` +
            `1. 在 iPhone 设置 → 相机 → 格式，选择"最兼容"\n` +
            `2. 或使用桌面工具：iMazing HEIC Converter`
        );
      } else if (convertedFiles.length > 0) {
        console.log(`[libheif] 🎉 全部成功: ${convertedFiles.length} 个文件`);
      }

      // 返回转换后的文件 + 普通文件
      return [...normalFiles, ...convertedFiles];
    },
    []
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);

      if (selectedFiles.length === 0) return;

      // 自动转换 HEIC 文件
      const processedFiles = await convertHeicFiles(selectedFiles);
      onFilesChange(processedFiles);

      // 清空 input 值，允许重复选择相同文件
      if (event.target) {
        event.target.value = "";
      }
    },
    [onFilesChange, convertHeicFiles]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const droppedFiles = Array.from(event.dataTransfer.files);
      const imageFiles = droppedFiles.filter(
        (file) =>
          file.type.startsWith("image/") ||
          file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif")
      );

      if (imageFiles.length === 0) return;

      // 自动转换 HEIC 文件
      const processedFiles = await convertHeicFiles(imageFiles);
      onFilesChange(processedFiles);
    },
    [onFilesChange, convertHeicFiles]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const downloadFile = useCallback((file: ImageFile) => {
    if (file.compressedBlob) {
      const url = URL.createObjectURL(file.compressedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `compressed_${file.file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []);

  // 分离待处理和已处理文件
  const { pendingFiles, processedFiles } = useMemo(() => {
    const pending = files.filter(
      (f) => f.status === "pending" || f.status === "processing"
    );
    const processed = files.filter(
      (f) => f.status === "completed" || f.status === "error"
    );
    return { pendingFiles: pending, processedFiles: processed };
  }, [files]);

  // 空状态组件
  const EmptyState: React.FC<{ title: string; icon: React.ReactNode }> = ({
    title,
    icon,
  }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 mb-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
        {icon}
      </div>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 文件上传区域 - 现代设计 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          上传图片文件
        </h3>
        <div
          className=" bg-gray-50  rounded-xl p-8 text-center hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer group"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFileDialog}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Upload className="h-8 w-8 text-gray-500 group-hover:text-blue-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            拖拽图片到此处
          </h4>
          <p className="text-gray-600 mb-2">或点击选择文件</p>
          <p className="text-sm text-gray-500">
            支持 JPG、PNG、WebP 等格式，可批量上传
          </p>
          <p className="text-xs text-green-600 mt-1">
            ✅ 自动转换 iPhone HEIC 格式为 JPEG
          </p>

          {/* 转换进度提示 */}
          {isConverting && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">
                正在转换 HEIC 图片... ({convertProgress.current}/
                {convertProgress.total})
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* 文件队列区域 - 响应式布局 */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* 待处理队列 - 常驻显示 */}
        <div className="flex-1 bg-gray-50 rounded-xl   p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">待处理队列</h3>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {pendingFiles.length} 个文件
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto min-w-0 overscroll-contain scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {pendingFiles.length > 0 ? (
              pendingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 overflow-hidden w-full min-w-0"
                >
                  <div className="shrink-0 w-12 h-12">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {formatFileSize(file.originalSize, sizeUnit)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {file.status === "processing" && (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    {file.status === "pending" && (
                      <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        等待中
                      </div>
                    )}

                    <button
                      onClick={() => onRemoveFile(file.id)}
                      disabled={isProcessing && file.status === "processing"}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="删除文件"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="暂无待处理文件"
                icon={<Inbox className="w-10 h-10" />}
              />
            )}
          </div>
        </div>

        {/* 已处理队列 - 常驻显示 */}
        <div className="flex-1 bg-gray-50 rounded-xl p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">已处理队列</h3>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {processedFiles.length} 个文件
            </div>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto min-w-0 overscroll-contain scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {processedFiles.length > 0 ? (
              processedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center space-x-4 p-4 rounded-lg  transition-colors border overflow-hidden w-full min-w-0 ${
                    file.status === "completed"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="shrink-0 w-12 h-12">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {formatFileSize(file.originalSize, sizeUnit)}
                    </p>
                    {file.status === "completed" &&
                      file.compressedSize !== undefined && (
                        <p
                          className={`text-xs font-medium truncate ${
                            file.compressedSize < file.originalSize
                              ? "text-green-600"
                              : file.compressedSize > file.originalSize
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          压缩后:{" "}
                          {formatFileSize(file.compressedSize, sizeUnit)}
                          {file.compressedSize < file.originalSize && (
                            <span>
                              {" "}
                              (
                              {Math.round(
                                (1 - file.compressedSize / file.originalSize) *
                                  100
                              )}
                              % 减少)
                            </span>
                          )}
                          {file.compressedSize > file.originalSize && (
                            <span>
                              {" "}
                              (
                              {Math.round(
                                (file.compressedSize / file.originalSize - 1) *
                                  100
                              )}
                              % 增加，已保留原图)
                            </span>
                          )}
                          {file.compressedSize === file.originalSize && (
                            <span> (无变化)</span>
                          )}
                        </p>
                      )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {file.status === "completed" && (
                      <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        完成
                      </div>
                    )}
                    {file.status === "error" && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition-colors">
                            失败 ⓘ
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="max-w-xs">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-red-600">
                              压缩失败
                            </h4>
                            <p className="text-sm text-gray-700">{file.error}</p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {file.status === "completed" && file.compressedBlob && (
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        title="下载压缩后的文件"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}

                    {file.status === "error" && (
                      <button
                        onClick={() => onRetryFile(file.id)}
                        disabled={isProcessing}
                        className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="重新尝试"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveFile(file.id)}
                      disabled={isProcessing && file.status === "processing"}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="删除文件"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="暂无已处理文件"
                icon={<CheckCircle2 className="w-10 h-10" />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
