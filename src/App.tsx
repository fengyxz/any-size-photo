import { useState } from "react";
import { FileUpload } from "./components/FileUpload";
import { CompressionConfig } from "./components/CompressionConfig";
import { ProgressDisplay } from "./components/ProgressDisplay";
import { useImageCompression } from "./hooks/useImageCompression";
import { Download } from "lucide-react";
import type { CompressionConfig as CompressionConfigType } from "./types";
import Intro from "./components/Intro";
import { Logo } from "./components/Logo";

const defaultConfig: CompressionConfigType = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  maxWidth: 1920,
  maxHeight: 1080,
  keepAspectRatio: true,
  useWebWorker: true,
  quality: 0.8,
  initialQuality: 0.8,
  alwaysKeepResolution: false,
  fileType: "image/jpeg",
  compressionMode: "size", // 默认为文件大小模式
};

function App() {
  const [config, setConfig] = useState<CompressionConfigType>(defaultConfig);
  const [sizeUnit, setSizeUnit] = useState<"auto" | "B" | "KB" | "MB" | "GB">(
    "auto"
  );
  const {
    files,
    isProcessing,
    completedFiles,
    failedFiles,
    totalProgress,
    addFiles,
    updateFileConfig,
    removeFile,
    retryFile,
    startCompression,
    clearFiles,
    downloadAll,
  } = useImageCompression();

  const handleFilesChange = (newFiles: File[]) => {
    addFiles(newFiles, config);
  };

  const handleConfigChange = (newConfig: CompressionConfigType) => {
    setConfig(newConfig);
    // 更新所有文件的配置
    files.forEach((file) => {
      updateFileConfig(file.id, newConfig);
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Logo size={48} className="shrink-0" />
            <h1 className="text-3xl font-bold">智能图片压缩工具</h1>
          </div>
          <p className="text-gray-600 text-lg">
            快速压缩图片文件，支持批量处理，保持高质量的同时减小文件大小
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 左侧：文件上传和处理进度 */}
          <div className="xl:col-span-2 space-y-6">
            <FileUpload
              files={files}
              onFilesChange={handleFilesChange}
              onRemoveFile={removeFile}
              onRetryFile={retryFile}
              isProcessing={isProcessing}
              sizeUnit={sizeUnit}
            />

            <ProgressDisplay
              files={files}
              isProcessing={isProcessing}
              totalProgress={totalProgress}
            />

            {/* 下载全部按钮 - 放在处理进度下面 */}
            {completedFiles > 0 && (
              <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      压缩完成
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      共完成 {completedFiles} 个文件
                      {failedFiles > 0 && `，失败 ${failedFiles} 个`}
                    </p>
                  </div>
                  <button
                    onClick={downloadAll}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download className="h-5 w-5" />
                    <span>下载全部压缩文件</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：压缩配置 */}
          <div className="xl:col-span-1">
            <CompressionConfig
              config={config}
              onConfigChange={handleConfigChange}
              onStartCompression={startCompression}
              onClearFiles={clearFiles}
              isProcessing={isProcessing}
              hasFiles={files.length > 0}
              completedFiles={completedFiles}
              totalFiles={files.length}
              sizeUnit={sizeUnit}
              onSizeUnitChange={setSizeUnit}
              files={files}
            />

            {/* 使用说明 - 放在下方 */}
            <Intro />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
