import React from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import type { ImageFile } from "@/types";

interface ProgressDisplayProps {
  files: ImageFile[];
  isProcessing: boolean;
  totalProgress: number;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  files,
  isProcessing,
  totalProgress,
}) => {
  const completedFiles = files.filter((f) => f.status === "completed").length;
  const failedFiles = files.filter((f) => f.status === "error").length;
  const pendingFiles = files.filter((f) => f.status === "pending").length;
  const processingFiles = files.filter((f) => f.status === "processing").length;

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 总体进度 - 现代设计 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">处理进度</h3>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {completedFiles} 完成
            </div>
            {failedFiles > 0 && (
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                {failedFiles} 失败
              </div>
            )}
            {processingFiles > 0 && (
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {processingFiles} 处理中
              </div>
            )}
            {pendingFiles > 0 && (
              <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                {pendingFiles} 等待
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, totalProgress))}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {Math.min(100, Math.max(0, totalProgress))}% 完成 ({completedFiles + failedFiles} / {files.length}
          )
        </p>
      </div>

      {/* 处理状态 */}
      {isProcessing && (
        <div className="text-center py-6 bg-blue-50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-sm font-medium text-blue-900">
            正在处理图片，请稍候...
          </p>
        </div>
      )}

      {/* 完成状态 */}
      {!isProcessing && completedFiles > 0 && (
        <div className="text-center py-6 bg-green-50 rounded-lg">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
          <p className="text-sm font-semibold text-green-900">
            压缩完成！共处理 {completedFiles} 个文件
          </p>
          {failedFiles > 0 && (
            <p className="text-xs text-red-600 mt-2">
              {failedFiles} 个文件处理失败
            </p>
          )}
        </div>
      )}
    </div>
  );
};
