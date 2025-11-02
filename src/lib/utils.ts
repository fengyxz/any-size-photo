import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(
  bytes: number,
  unit?: "auto" | "B" | "KB" | "MB" | "GB"
): string {
  if (bytes === 0) return "0 B";

  if (unit === "auto") {
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const k = 1024;
  const unitMap = {
    B: 1,
    KB: k,
    MB: k * k,
    GB: k * k * k,
  };

  const multiplier = unitMap[unit as keyof typeof unitMap] || 1;
  const value = bytes / multiplier;

  return parseFloat(value.toFixed(2)) + " " + unit;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes}分${remainingSeconds}秒`;
}
