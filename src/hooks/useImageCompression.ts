import { useState, useCallback, useRef, useEffect } from "react";
import type { ImageFile, CompressionConfig, WorkerMessage } from "../types";

export const useImageCompression = () => {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  // 初始化 Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/imageCompression.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, data } = event.data;

      switch (type) {
        case "progress":
          setFiles((prev) =>
            prev.map((file) =>
              file.id === data.id
                ? { ...file, progress: data.progress || 0 }
                : file
            )
          );
          break;

        case "complete":
          if (data.result) {
            setFiles((prev) => {
              const updated = prev.map(
                (file): ImageFile =>
                  file.id === data.id
                    ? {
                        ...file,
                        status: "completed" as const,
                        compressedBlob: data.result!.compressedBlob,
                        compressedSize: data.result!.compressedSize,
                        progress: 100,
                      }
                    : file
              );

              // 处理下一个文件（只处理待处理的文件）
              const pendingFiles = updated.filter(
                (f) => f.status === "pending" || f.status === "processing"
              );

              setCurrentIndex((currentIdx) => {
                const nextIndex = currentIdx + 1;
                if (nextIndex < pendingFiles.length) {
                  // 延迟调用，确保状态已更新
                  setTimeout(() => processNextFile(nextIndex), 0);
                } else {
                  setIsProcessing(false);
                }
                return nextIndex;
              });

              return updated;
            });
          }
          break;

        case "error":
          setFiles((prev) => {
            const updated = prev.map(
              (file): ImageFile =>
                file.id === data.id
                  ? {
                      ...file,
                      status: "error" as const,
                      error: data.error,
                      progress: 0,
                    }
                  : file
            );

            // 处理下一个文件（只处理待处理的文件）
            const pendingFiles = updated.filter(
              (f) => f.status === "pending" || f.status === "processing"
            );

            setCurrentIndex((currentIdx) => {
              const nextIndex = currentIdx + 1;
              if (nextIndex < pendingFiles.length) {
                // 延迟调用，确保状态已更新
                setTimeout(() => processNextFile(nextIndex), 0);
              } else {
                setIsProcessing(false);
              }
              return nextIndex;
            });

            return updated;
          });
          break;
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]);

  const processNextFile = useCallback(
    (index: number) => {
      // 只处理待处理的文件，跳过已处理的文件
      const pendingFiles = files.filter(
        (f) => f.status === "pending" || f.status === "processing"
      );

      if (index >= pendingFiles.length) {
        setIsProcessing(false);
        return;
      }

      const file = pendingFiles[index];
      if (
        file &&
        workerRef.current &&
        (file.status === "pending" || file.status === "processing")
      ) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "processing" } : f
          )
        );

        workerRef.current.postMessage({
          type: "compress",
          data: {
            id: file.id,
            file: file.file,
            config: file.config,
          },
        });
      }
    },
    [files]
  );

  const addFiles = useCallback(
    (newFiles: File[], defaultConfig: CompressionConfig) => {
      const imageFiles: ImageFile[] = newFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        originalSize: file.size,
        status: "pending",
        progress: 0,
        config: { ...defaultConfig },
        preview: URL.createObjectURL(file),
      }));

      setFiles((prev) => [...prev, ...imageFiles]);
    },
    []
  );

  const updateFileConfig = useCallback(
    (fileId: string, config: CompressionConfig) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, config: { ...config } } : file
        )
      );
    },
    []
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  const startCompression = useCallback(() => {
    // 只处理待处理的文件，跳过已处理的文件
    const pendingFiles = files.filter(
      (f) => f.status === "pending" || f.status === "processing"
    );

    if (pendingFiles.length === 0) return;

    setIsProcessing(true);
    setCurrentIndex(0);
    processNextFile(0);
  }, [files, processNextFile]);

  const clearFiles = useCallback(() => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setIsProcessing(false);
    setCurrentIndex(0);
  }, [files]);

  const downloadFile = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (file?.compressedBlob) {
        const url = URL.createObjectURL(file.compressedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compressed_${file.file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },
    [files]
  );

  const downloadAll = useCallback(() => {
    files.forEach((file) => {
      if (file.status === "completed" && file.compressedBlob) {
        downloadFile(file.id);
      }
    });
  }, [files, downloadFile]);

  const completedFiles = files.filter((f) => f.status === "completed").length;
  const failedFiles = files.filter((f) => f.status === "error").length;
  const totalProgress =
    files.length > 0
      ? Math.round(
          files.reduce((sum, file) => sum + file.progress, 0) / files.length
        )
      : 0;

  return {
    files,
    isProcessing,
    currentIndex,
    completedFiles,
    failedFiles,
    totalProgress,
    addFiles,
    updateFileConfig,
    removeFile,
    startCompression,
    clearFiles,
    downloadFile,
    downloadAll,
  };
};
