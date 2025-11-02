export interface CompressionConfig {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio: boolean;
  useWebWorker: boolean;
  quality: number;
  initialQuality: number;
  alwaysKeepResolution: boolean;
  fileType: string;
  compressionMode?: "size" | "pixel" | "quality";
}

export interface ImageFile {
  id: string;
  file: File;
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
  config: CompressionConfig;
  preview?: string;
}

export interface CompressionResult {
  id: string;
  success: boolean;
  compressedBlob?: Blob;
  error?: string;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export interface WorkerMessage {
  type: "compress" | "progress" | "complete" | "error";
  data: {
    id: string;
    file: File;
    config: CompressionConfig;
    progress?: number;
    result?: CompressionResult;
    error?: string;
  };
}

export interface BatchCompressionState {
  files: ImageFile[];
  isProcessing: boolean;
  currentIndex: number;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
}
