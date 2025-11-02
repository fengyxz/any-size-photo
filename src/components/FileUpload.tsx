import React, { useRef, useCallback, useMemo } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Download,
  Inbox,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import type { ImageFile } from "@/types";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      if (selectedFiles.length > 0) {
        onFilesChange(selectedFiles);
      }
    },
    [onFilesChange]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const droppedFiles = Array.from(event.dataTransfer.files);
      const imageFiles = droppedFiles.filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        onFilesChange(imageFiles);
      }
    },
    [onFilesChange]
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
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
                      <div
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium cursor-help"
                        title={file.error}
                      >
                        失败
                      </div>
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
