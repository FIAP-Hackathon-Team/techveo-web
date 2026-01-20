import { useState, useCallback, useRef } from "react";
import { Upload, FileVideo, X, Download, Loader2, CheckCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import JSZip from "jszip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoSnapshotOptions {
  snapshotCount?: number;
  intervalSeconds?: number;
  width: number;
  height: number;
}

interface UploadedVideo {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "ready" | "error";
  options: VideoSnapshotOptions;
}

export function VideoUploader() {
  const { token } = useAuth();
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState<string | null>(null);
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
      options: {
        width: 1920,
        height: 1080,
      },
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

  const updateVideoOptions = useCallback((id: string, options: Partial<VideoSnapshotOptions>) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, options: { ...v.options, ...options } } : v
      )
    );
  }, []);

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

                  <Dialog open={configDialogOpen === video.id} onOpenChange={(open) => setConfigDialogOpen(open ? video.id : null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 rounded-full hover:bg-primary/10"
                        title="Configurações"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Configurações do Vídeo</DialogTitle>
                        <DialogDescription>
                          Configure as opções de extração de snapshots para {video.file.name}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-6 py-4">
                        <div className="grid gap-3">
                          <Label htmlFor={`snapshot-count-${video.id}`}>
                            Número de Snapshots
                          </Label>
                          <Input
                            id={`snapshot-count-${video.id}`}
                            type="number"
                            min="1"
                            placeholder="Ex: 10 (distribuídos uniformemente)"
                            value={video.options.snapshotCount || ""}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              updateVideoOptions(video.id, { snapshotCount: value });
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Deixe vazio para usar o intervalo em segundos
                          </p>
                        </div>

                        <div className="grid gap-3">
                          <Label htmlFor={`interval-${video.id}`}>
                            Intervalo entre Snapshots (segundos)
                          </Label>
                          <Input
                            id={`interval-${video.id}`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            placeholder="Ex: 2.5"
                            value={video.options.intervalSeconds || ""}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : undefined;
                              updateVideoOptions(video.id, { intervalSeconds: value });
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            Deixe vazio para usar o número de snapshots
                          </p>
                        </div>

                        <div className="grid gap-3">
                          <Label>Tamanho dos Snapshots</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`width-${video.id}`} className="text-xs text-muted-foreground">
                                Largura (px)
                              </Label>
                              <Input
                                id={`width-${video.id}`}
                                type="number"
                                min="1"
                                value={video.options.width}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1920;
                                  updateVideoOptions(video.id, { width: value });
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`height-${video.id}`} className="text-xs text-muted-foreground">
                                Altura (px)
                              </Label>
                              <Input
                                id={`height-${video.id}`}
                                type="number"
                                min="1"
                                value={video.options.height}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1080;
                                  updateVideoOptions(video.id, { height: value });
                                }}
                              />
                            </div>
                          </div>
                          <Select
                            value={`${video.options.width}x${video.options.height}`}
                            onValueChange={(value) => {
                              const [width, height] = value.split('x').map(Number);
                              updateVideoOptions(video.id, { width, height });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1920x1080">Full HD (1920x1080)</SelectItem>
                              <SelectItem value="1280x720">HD (1280x720)</SelectItem>
                              <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                              <SelectItem value="640x480">SD (640x480)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setConfigDialogOpen(null)}
                        >
                          Fechar
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

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
