import { useState, useCallback, useRef } from "react";
import { Upload, FileVideo, X, Download, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import JSZip from "jszip";

interface UploadedVideo {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "ready" | "error";
}

export function VideoUploader() {
  const { token } = useAuth();
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const processFiles = useCallback((files: FileList) => {
    const videoFiles = Array.from(files).filter((file) =>
      file.type.startsWith("video/")
    );

    const newVideos: UploadedVideo[] = videoFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: "uploading" as const,
    }));

    setVideos((prev) => [...prev, ...newVideos]);

    // Simulate upload progress
    newVideos.forEach((video) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id ? { ...v, progress: 100, status: "ready" } : v
            )
          );
        } else {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id ? { ...v, progress: Math.min(progress, 99) } : v
            )
          );
        }
      }, 200);
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const downloadZip = useCallback(async () => {
    const readyVideos = videos.filter((v) => v.status === "ready");
    if (readyVideos.length === 0) return;

    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      
      for (const video of readyVideos) {
        const arrayBuffer = await video.file.arrayBuffer();
        zip.file(video.file.name, arrayBuffer);
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `videos_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating zip:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [videos]);

  const readyCount = videos.filter((v) => v.status === "ready").length;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`upload-zone p-12 cursor-pointer group ${
          isDragging ? "upload-zone-active" : "hover:border-muted-foreground/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`p-4 rounded-2xl transition-colors duration-300 ${
            isDragging ? "bg-primary/10" : "bg-secondary group-hover:bg-primary/5"
          }`}>
            <Upload className={`w-8 h-8 transition-colors duration-300 ${
              isDragging ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            }`} />
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragging ? "Solte o vídeo aqui" : "Arraste e solte seus vídeos"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar
            </p>
          </div>
        </div>
      </div>

      {/* Video List */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              Vídeos ({readyCount}/{videos.length})
            </h3>
            {readyCount > 0 && (
              <Button
                onClick={downloadZip}
                disabled={isDownloading}
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Baixar ZIP
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border animate-scale-in"
              >
                <div className="p-2 rounded-lg bg-secondary">
                  <FileVideo className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{video.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(video.file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {video.status === "uploading" && (
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${video.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {Math.round(video.progress)}%
                      </span>
                    </div>
                  )}
                  
                  {video.status === "ready" && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVideo(video.id);
                    }}
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
