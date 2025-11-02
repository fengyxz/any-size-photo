import React, { useState, useEffectEvent } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Settings, RotateCcw } from "lucide-react";
import type { CompressionConfig as CompressionConfigType } from "@/types";
import { formatFileSize } from "@/lib/utils";

interface CompressionConfigProps {
  config: CompressionConfigType;
  onConfigChange: (config: CompressionConfigType) => void;
  onStartCompression: () => void;
  onClearFiles: () => void;
  isProcessing: boolean;
  hasFiles: boolean;
  completedFiles: number;
  totalFiles: number;
  sizeUnit: "auto" | "B" | "KB" | "MB" | "GB";
  onSizeUnitChange: (unit: "auto" | "B" | "KB" | "MB" | "GB") => void;
  files: Array<{ originalSize: number }>; // 添加 files 参数
}

export const CompressionConfig: React.FC<CompressionConfigProps> = ({
  config,
  onConfigChange,
  onStartCompression,
  onClearFiles,
  isProcessing,
  hasFiles,
  completedFiles,
  totalFiles,
  sizeUnit,
  onSizeUnitChange,
  files,
}) => {
  const [maxSizeUnit, setMaxSizeUnit] = useState<"B" | "KB" | "MB" | "GB">(
    "MB"
  );
  const [maxSizeValue, setMaxSizeValue] = useState<number>(1);
  const [maxSizeInputValue, setMaxSizeInputValue] = useState<string>("1");
  const [qualityInputValue, setQualityInputValue] = useState<string>("0.8");
  const [initialQualityInputValue, setInitialQualityInputValue] =
    useState<string>("0.8");
  const [compressionMode, setCompressionMode] = useState<
    "size" | "pixel" | "quality"
  >("size");
  const [widthInputValue, setWidthInputValue] = useState<string>("1920");
  const [heightInputValue, setHeightInputValue] = useState<string>("1080");

  // 转换文件大小单位
  const convertFileSize = (
    value: number,
    fromUnit: "B" | "KB" | "MB" | "GB",
    toUnit: "B" | "KB" | "MB" | "GB"
  ) => {
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const bytes = value * units[fromUnit];
    return bytes / units[toUnit];
  };

  // 当配置或单位改变时，更新显示值
  React.useEffect(() => {
    const convertedValue = convertFileSize(config.maxSizeMB, "MB", maxSizeUnit);
    setMaxSizeValue(convertedValue);
    // 更新输入框显示值，去掉不必要的尾随0
    const displayValue = convertedValue.toString();
    setMaxSizeInputValue(displayValue);
  }, [config.maxSizeMB, maxSizeUnit]);

  // 当质量配置改变时，更新输入框显示值
  React.useEffect(() => {
    setQualityInputValue(config.quality.toString());
    setInitialQualityInputValue(config.initialQuality.toString());
  }, [config.quality, config.initialQuality]);

  // 当宽度高度配置改变时，更新输入框显示值
  React.useEffect(() => {
    if (config.maxWidth !== undefined) {
      setWidthInputValue(config.maxWidth.toString());
    }
    if (config.maxHeight !== undefined) {
      setHeightInputValue(config.maxHeight.toString());
    }
  }, [config.maxWidth, config.maxHeight]);

  // 使用 useEffectEvent 处理质量自动调整
  const handleQualityAdjustment = useEffectEvent(
    (maxSizeMB: number, currentQuality: number) => {
      if (compressionMode === "size") {
        const recommendedQuality = getRecommendedQuality(maxSizeMB);
        // 只有当质量需要更新时才更新
        if (Math.abs(currentQuality - recommendedQuality) > 0.01) {
          onConfigChange({
            ...config,
            maxSizeMB,
            quality: recommendedQuality,
            initialQuality: recommendedQuality,
          });
        }
      }
    }
  );

  // 文件大小模式：始终自动计算质量
  React.useEffect(() => {
    handleQualityAdjustment(config.maxSizeMB, config.quality);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.maxSizeMB, compressionMode]);

  // 使用 useEffectEvent 处理配置更新
  const handleConfigUpdate = useEffectEvent(
    (newConfig: CompressionConfigType) => {
      onConfigChange(newConfig);
    }
  );

  const handleInputChange = (
    field: keyof CompressionConfigType,
    value: string | number | boolean
  ) => {
    const newConfig = {
      ...config,
      [field]: value,
      compressionMode, // 始终包含当前的压缩模式
    };
    handleConfigUpdate(newConfig);
  };

  // 根据文件大小自动推荐质量
  const getRecommendedQuality = (maxSizeMB: number) => {
    if (maxSizeMB >= 2) return 0.9; // 大文件 -> 高质量
    if (maxSizeMB >= 1) return 0.8; // 中等文件 -> 中等质量
    if (maxSizeMB >= 0.5) return 0.7; // 小文件 -> 低质量
    return 0.6; // 极小文件 -> 更低质量
  };

  // 检查是否存在压缩冲突
  const hasCompressionConflict = () => {
    const recommendedQuality = getRecommendedQuality(config.maxSizeMB);
    return config.quality > recommendedQuality + 0.2 && config.maxSizeMB < 0.5;
  };

  // 根据质量估算文件大小（基于实际上传的文件）
  const estimateFileSize = (quality: number) => {
    if (files.length === 0) {
      return 0; // 没有文件时返回0
    }

    // 计算所有文件的总大小
    const totalOriginalSize = files.reduce(
      (sum, file) => sum + file.originalSize,
      0
    );
    const averageOriginalSizeMB = totalOriginalSize / (1024 * 1024); // 转换为MB

    // 基于质量的经验公式：压缩后大小 ≈ 原始大小 × 质量^2 × 0.8
    const compressionRatio = Math.pow(quality, 2) * 0.8;
    return averageOriginalSizeMB * compressionRatio;
  };


  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* 压缩模式选择 - 紧凑设计 */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <Settings className="h-4 w-4 mr-2 text-blue-600" />
          压缩模式
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              setCompressionMode("size");
              onConfigChange({ ...config, compressionMode: "size" });
            }}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              compressionMode === "size"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            disabled={isProcessing}
          >
            📏 文件大小
          </button>

          <button
            onClick={() => {
              setCompressionMode("pixel");
              onConfigChange({ ...config, compressionMode: "pixel" });
            }}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              compressionMode === "pixel"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            disabled={isProcessing}
          >
            🖼️ 像素尺寸
          </button>

          <button
            onClick={() => {
              setCompressionMode("quality");
              onConfigChange({ ...config, compressionMode: "quality" });
            }}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              compressionMode === "quality"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            disabled={isProcessing}
          >
            🎨 质量
          </button>
        </div>
      </div>

      {/* 文件大小模式配置 - 紧凑设计 */}
      {compressionMode === "size" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              文件大小设置
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">单位:</span>
              <select
                value={sizeUnit}
                onChange={(e) =>
                  onSizeUnitChange(
                    e.target.value as "auto" | "B" | "KB" | "MB" | "GB"
                  )
                }
                className="px-2 py-1 bg-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">自动</option>
                <option value="B">B</option>
                <option value="KB">KB</option>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </select>
            </div>
          </div>

          {/* 智能质量提示 - 紧凑版 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🤖</span>
              <span className="text-sm font-semibold text-blue-900">
                智能质量调整
              </span>
            </div>
            <span className="text-sm text-blue-600 font-mono font-bold">
              {getRecommendedQuality(config.maxSizeMB)}
            </span>
          </div>

          {/* 文件大小输入 */}
          <div>
            <Label
              htmlFor="maxSizeMB"
              className="text-sm font-medium text-gray-900 block mb-2"
            >
              最大文件大小
            </Label>
            <div className="flex space-x-2">
              <Input
                id="maxSizeMB"
                type="text"
                value={maxSizeInputValue}
                onChange={(e) => {
                  const valueStr = e.target.value;
                  // 允许空字符串或数字输入
                  if (valueStr === "" || /^-?\d*\.?\d*$/.test(valueStr)) {
                    // 保存原始输入字符串
                    setMaxSizeInputValue(valueStr);

                    if (
                      valueStr === "" ||
                      valueStr === "." ||
                      valueStr === "-"
                    ) {
                      // 空输入或只输入小数点/负号时不更新数值
                      return;
                    }

                    const value = parseFloat(valueStr);
                    if (!isNaN(value)) {
                      setMaxSizeValue(value);
                      const convertedValue = convertFileSize(
                        value,
                        maxSizeUnit,
                        "MB"
                      );
                      const recommendedQuality =
                        getRecommendedQuality(convertedValue);

                      // 立即更新配置，确保同步
                      const newConfig = {
                        ...config,
                        maxSizeMB: convertedValue,
                        quality:
                          compressionMode === "size"
                            ? recommendedQuality
                            : config.quality,
                        initialQuality:
                          compressionMode === "size"
                            ? recommendedQuality
                            : config.initialQuality,
                      };
                      handleConfigUpdate(newConfig);
                    }
                  }
                }}
                onBlur={(e) => {
                  // 失去焦点时，如果值为空或无效，重置为当前值
                  const valueStr = e.target.value.trim();
                  if (valueStr === "" || valueStr === "." || valueStr === "-") {
                    setMaxSizeInputValue(maxSizeValue.toString());
                  } else {
                    const value = parseFloat(valueStr);
                    if (isNaN(value) || value <= 0) {
                      setMaxSizeInputValue(maxSizeValue.toString());
                    } else {
                      // 去掉不必要的尾随0
                      setMaxSizeInputValue(value.toString());
                    }
                  }
                }}
                disabled={isProcessing}
                className="flex-1 py-2 px-3 bg-gray-50 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <select
                value={maxSizeUnit}
                onChange={(e) => {
                  const newUnit = e.target.value as "B" | "KB" | "MB" | "GB";
                  setMaxSizeUnit(newUnit);
                  // 当单位改变时，更新显示值
                  const convertedValue = convertFileSize(
                    config.maxSizeMB,
                    "MB",
                    newUnit
                  );
                  setMaxSizeValue(convertedValue);
                  setMaxSizeInputValue(convertedValue.toString());
                }}
                className="px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[80px]"
                disabled={isProcessing}
              >
                <option value="B">B</option>
                <option value="KB">KB</option>
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                实际限制:{" "}
                <span className="font-mono font-semibold text-blue-600">
                  {formatFileSize(config.maxSizeMB * 1024 * 1024, maxSizeUnit)}
                </span>
              </span>
            </div>

            {hasCompressionConflict() && (
              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                ⚠️ 文件大小过小但质量过高，可能导致最终文件大小超出预期
              </div>
            )}
          </div>
        </div>
      )}

      {/* 像素模式配置 - 紧凑设计 */}
      {compressionMode === "pixel" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">
            像素尺寸设置
          </h3>

          {/* 宽高比例模式选择 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label
                htmlFor="keepAspectRatio"
                className="text-sm font-medium text-gray-900"
              >
                保持原始比例
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                关闭时可能扭曲图片，按设置的宽高强制拉伸
              </p>
            </div>
            <Switch
              id="keepAspectRatio"
              checked={config.keepAspectRatio}
              onCheckedChange={(checked: boolean) => {
                handleInputChange("keepAspectRatio", checked);
              }}
              disabled={isProcessing}
            />
          </div>

          {/* 宽度和高度输入 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="maxWidth"
                className="text-sm font-medium text-gray-900"
              >
                宽度 (像素)
              </Label>
              <Input
                id="maxWidth"
                type="text"
                value={widthInputValue}
                onChange={(e) => {
                  const valueStr = e.target.value;
                  // 只允许数字输入
                  if (valueStr === "" || /^\d*$/.test(valueStr)) {
                    setWidthInputValue(valueStr);
                    if (valueStr !== "" && valueStr !== "-") {
                      const value = parseInt(valueStr) || 0;
                      const newConfig = {
                        ...config,
                        maxWidth: value > 0 ? value : undefined,
                      };
                      // 如果保持比例，同步更新 maxWidthOrHeight
                      if (config.keepAspectRatio && value > 0) {
                        newConfig.maxWidthOrHeight = value;
                      }
                      onConfigChange(newConfig);
                    }
                  }
                }}
                onBlur={(e) => {
                  const valueStr = e.target.value.trim();
                  if (valueStr === "" || valueStr === "-") {
                    setWidthInputValue(config.maxWidth?.toString() || "1920");
                  } else {
                    const value = parseInt(valueStr);
                    if (isNaN(value) || value <= 0) {
                      setWidthInputValue(config.maxWidth?.toString() || "1920");
                    } else {
                      setWidthInputValue(value.toString());
                    }
                  }
                }}
                disabled={isProcessing}
                className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <Label
                htmlFor="maxHeight"
                className="text-sm font-medium text-gray-900"
              >
                高度 (像素)
              </Label>
              <Input
                id="maxHeight"
                type="text"
                value={heightInputValue}
                onChange={(e) => {
                  const valueStr = e.target.value;
                  // 只允许数字输入
                  if (valueStr === "" || /^\d*$/.test(valueStr)) {
                    setHeightInputValue(valueStr);
                    if (valueStr !== "" && valueStr !== "-") {
                      const value = parseInt(valueStr) || 0;
                      const newConfig = {
                        ...config,
                        maxHeight: value > 0 ? value : undefined,
                      };
                      // 如果保持比例，同步更新 maxWidthOrHeight
                      if (config.keepAspectRatio && value > 0) {
                        newConfig.maxWidthOrHeight = value;
                      }
                      onConfigChange(newConfig);
                    }
                  }
                }}
                onBlur={(e) => {
                  const valueStr = e.target.value.trim();
                  if (valueStr === "" || valueStr === "-") {
                    setHeightInputValue(config.maxHeight?.toString() || "1080");
                  } else {
                    const value = parseInt(valueStr);
                    if (isNaN(value) || value <= 0) {
                      setHeightInputValue(
                        config.maxHeight?.toString() || "1080"
                      );
                    } else {
                      setHeightInputValue(value.toString());
                    }
                  }
                }}
                disabled={isProcessing}
                className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <p className="text-xs text-gray-600">
            {config.keepAspectRatio
              ? "图片会保持原始宽高比，按最大尺寸缩放"
              : "⚠️ 自由比例模式：图片可能被拉伸变形"}
          </p>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label
                htmlFor="alwaysKeepResolution"
                className="text-sm font-medium text-gray-900"
              >
                保持原始分辨率
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                启用时忽略尺寸设置，只压缩文件大小
              </p>
            </div>
            <Switch
              id="alwaysKeepResolution"
              checked={config.alwaysKeepResolution}
              onCheckedChange={(checked: boolean) =>
                handleInputChange("alwaysKeepResolution", checked)
              }
              disabled={isProcessing}
            />
          </div>
        </div>
      )}

      {/* 质量模式配置 - 紧凑设计 */}
      {compressionMode === "quality" && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">质量设置</h3>

          {/* 预计文件大小显示 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <span className="text-sm font-medium text-blue-900">
                预计文件大小
              </span>
              <span className="text-xs text-blue-600 ml-2">
                {files.length > 0
                  ? `(基于${files.length}个文件，平均${(
                      files.reduce((sum, file) => sum + file.originalSize, 0) /
                      files.length /
                      (1024 * 1024)
                    ).toFixed(1)}MB)`
                  : "(请先上传文件)"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">
                {files.length > 0
                  ? `${estimateFileSize(config.quality).toFixed(1)} MB`
                  : "0 MB"}
              </span>
              {files.length > 0 && (
                <span className="text-xs text-blue-500 ml-2">
                  压缩率:{" "}
                  {Math.round(
                    (1 -
                      estimateFileSize(config.quality) /
                        (files.reduce(
                          (sum, file) => sum + file.originalSize,
                          0
                        ) /
                          (1024 * 1024))) *
                      100
                  )}
                  %
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="quality"
                className="text-sm font-medium text-gray-900"
              >
                压缩质量 (0.1-1.0)
              </Label>
              <Input
                id="quality"
                type="text"
                value={qualityInputValue}
                onChange={(e) => {
                  const valueStr = e.target.value;
                  // 允许小数输入
                  if (valueStr === "" || /^-?\d*\.?\d*$/.test(valueStr)) {
                    // 保存原始输入字符串
                    setQualityInputValue(valueStr);

                    if (
                      valueStr === "" ||
                      valueStr === "." ||
                      valueStr === "-"
                    ) {
                      // 空输入或只输入小数点/负号时不更新数值
                      return;
                    }

                    const value = parseFloat(valueStr);
                    if (!isNaN(value)) {
                      // 限制在 0.1-1.0 范围内
                      const clampedValue = Math.min(1.0, Math.max(0.1, value));
                      handleInputChange("quality", clampedValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  // 失去焦点时，如果值为空或无效，重置为当前值
                  const valueStr = e.target.value.trim();
                  if (valueStr === "" || valueStr === "." || valueStr === "-") {
                    setQualityInputValue(config.quality.toString());
                  } else {
                    const value = parseFloat(valueStr);
                    if (isNaN(value)) {
                      setQualityInputValue(config.quality.toString());
                    } else {
                      const clampedValue = Math.min(1.0, Math.max(0.1, value));
                      handleInputChange("quality", clampedValue);
                      setQualityInputValue(clampedValue.toString());
                    }
                  }
                }}
                disabled={isProcessing}
                className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                0.9=高质量，0.7=中等质量，0.5=低质量
              </p>
            </div>

            <div>
              <Label
                htmlFor="initialQuality"
                className="text-sm font-medium text-gray-900"
              >
                初始质量 (0.1-1.0)
              </Label>
              <Input
                id="initialQuality"
                type="text"
                value={initialQualityInputValue}
                onChange={(e) => {
                  const valueStr = e.target.value;
                  // 允许小数输入
                  if (valueStr === "" || /^-?\d*\.?\d*$/.test(valueStr)) {
                    // 保存原始输入字符串
                    setInitialQualityInputValue(valueStr);

                    if (
                      valueStr === "" ||
                      valueStr === "." ||
                      valueStr === "-"
                    ) {
                      // 空输入或只输入小数点/负号时不更新数值
                      return;
                    }

                    const value = parseFloat(valueStr);
                    if (!isNaN(value)) {
                      // 限制在 0.1-1.0 范围内
                      const clampedValue = Math.min(1.0, Math.max(0.1, value));
                      handleInputChange("initialQuality", clampedValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  // 失去焦点时，如果值为空或无效，重置为当前值
                  const valueStr = e.target.value.trim();
                  if (valueStr === "" || valueStr === "." || valueStr === "-") {
                    setInitialQualityInputValue(
                      config.initialQuality.toString()
                    );
                  } else {
                    const value = parseFloat(valueStr);
                    if (isNaN(value)) {
                      setInitialQualityInputValue(
                        config.initialQuality.toString()
                      );
                    } else {
                      const clampedValue = Math.min(1.0, Math.max(0.1, value));
                      handleInputChange("initialQuality", clampedValue);
                      setInitialQualityInputValue(clampedValue.toString());
                    }
                  }
                }}
                disabled={isProcessing}
                className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-xs text-gray-600 mt-1">通常与压缩质量相同</p>
            </div>
          </div>
        </div>
      )}

      {/* 通用设置 - 紧凑设计 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">通用设置</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label
              htmlFor="fileType"
              className="text-xs font-medium text-gray-700 block mb-1"
            >
              输出格式
            </Label>
            <select
              id="fileType"
              value={config.fileType}
              onChange={(e) =>
                handleInputChange(
                  "fileType",
                  e.target.value as "image/jpeg" | "image/png" | "image/webp"
                )
              }
              disabled={isProcessing}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          <div className="flex items-center justify-center sm:justify-start">
            <div className="flex items-center space-x-2">
              <Switch
                id="useWebWorker"
                checked={config.useWebWorker}
                onCheckedChange={(checked: boolean) =>
                  handleInputChange("useWebWorker", checked)
                }
                disabled={isProcessing}
              />
              <Label
                htmlFor="useWebWorker"
                className="text-xs font-medium text-gray-700"
              >
                后台处理
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onStartCompression}
          disabled={!hasFiles || isProcessing}
          className="flex-1"
          size="sm"
        >
          {isProcessing ? "压缩中..." : "开始压缩"}
        </Button>

        <Button
          onClick={onClearFiles}
          variant="outline"
          disabled={isProcessing}
          size="sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          清空
        </Button>
      </div>

      {/* 进度信息 */}
      {isProcessing && (
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-900 font-medium">
            正在处理 {totalFiles} 个文件中的第 {completedFiles + 1} 个
          </p>
        </div>
      )}
    </div>
  );
};
