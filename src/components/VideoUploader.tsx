import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileVideo, X, Send, Loader2, CheckCircle, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processVideoRequest, getVideoStatus } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  prompt?: string;
  mode?: "snapshot" | "interval" | "prompt";
}

interface UploadedVideo {
  file: File;
  id: string;
  jobId?: string;
  progress: number;
  status: "uploading" | "ready" | "queued" | "processing" | "error" | "processed";
  options: VideoSnapshotOptions;
  duration?: number;
  durationLoaded: boolean;
}

export function VideoUploader() {
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      let resolved = false;
      
      const cleanup = () => {
        if (video.src) {
          window.URL.revokeObjectURL(video.src);
        }
      };
      
      const resolveDuration = (duration: number) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(duration);
        }
      };
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        console.log('Video duration loaded:', duration, 'for file:', file.name);
        if (isFinite(duration) && duration > 0) {
          resolveDuration(duration);
        } else {
          // Tenta esperar um pouco mais
          setTimeout(() => {
            const retryDuration = video.duration;
            if (isFinite(retryDuration) && retryDuration > 0) {
              resolveDuration(retryDuration);
            } else {
              resolveDuration(0);
            }
          }, 100);
        }
      };
      
      video.ondurationchange = () => {
        const duration = video.duration;
        console.log('Duration changed:', duration);
        if (isFinite(duration) && duration > 0) {
          resolveDuration(duration);
        }
      };
      
      video.onerror = (e) => {
        console.error('Video load error for', file.name, '- Formato pode não ser suportado pelo navegador');
        resolveDuration(0);
      };
      
      // Timeout de segurança de 3 segundos
      setTimeout(() => {
        console.warn('Timeout loading video duration for', file.name, '- Formato não suportado ou arquivo corrompido');
        resolveDuration(0);
      }, 3000);
      
      try {
        video.src = URL.createObjectURL(file);
        video.load();
      } catch (error) {
        console.error('Error creating video URL:', error);
        resolveDuration(0);
      }
    });
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
        prompt: undefined,
        mode: undefined,
      },
      duration: undefined,
      durationLoaded: false,
    }));

    setVideos((prev) => [...prev, ...newVideos]);

    // Get video duration for each video
    newVideos.forEach((video) => {
      getVideoDuration(video.file).then((duration) => {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, duration, durationLoaded: true } : v
          )
        );
      });
    });

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
  }, [getVideoDuration]);

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

  const validateVideoConfig = useCallback((video: UploadedVideo): boolean => {
    const mode = video.options.mode;
    if (mode === "snapshot") {
      return !!video.options.snapshotCount;
    }
    if (mode === "interval") {
      return !!video.options.intervalSeconds;
    }
    if (mode === "prompt") {
      return !!(video.options.prompt && video.options.prompt.trim().length > 0);
    }
    return false;
  }, []);
  
  const startPollingStatus = useCallback((jobId: string, localId: string) => {
    // don't start if already polling for this job
    if (pollingRefs.current[jobId]) return;

    const intervalId = window.setInterval(async () => {
      try {
        const res = await getVideoStatus(jobId);
        const serverStatus = (res?.data?.status || res?.data?.state || '') as string;

        // Normalize to known labels
        const normalized = serverStatus ? serverStatus.toLowerCase() : '';

        setVideos((prev) =>
          prev.map((v) => {
            if (v.id !== localId) return v;

            if (normalized.includes('queued')) return { ...v, status: 'queued' };
            if (normalized.includes('processing')) return { ...v, status: 'processing' };
            if (normalized.includes('completed') || normalized.includes('done') || normalized.includes('finished')) {
              return { ...v, status: 'processed' };
            }
            if (normalized.includes('failed') || normalized.includes('error')) return { ...v, status: 'error' };

            return v;
          })
        );

        // Stop polling when finished or failed
        if (normalized.includes('completed') || normalized.includes('done') || normalized.includes('finished') || normalized.includes('failed') || normalized.includes('error')) {
          const id = pollingRefs.current[jobId];
          if (id) {
            clearInterval(id);
            delete pollingRefs.current[jobId];
          }
        }
      } catch (e) {
        console.error('Polling status failed for', jobId, e);
      }
    }, 2000);

    pollingRefs.current[jobId] = intervalId;
  }, []);

  const processVideos = useCallback(async () => {
    const readyVideos = videos.filter((v) => v.status === "ready");
    if (readyVideos.length === 0) return;

    // Validar se todos os vídeos têm configuração
    const invalidVideos = readyVideos.filter(v => !validateVideoConfig(v));
    if (invalidVideos.length > 0) {
      alert(`Por favor, configure todos os vídeos antes de processar. ${invalidVideos.length} vídeo(s) sem configuração.`);
      return;
    }

    setIsProcessing(true);
    
    try {
      for (const video of readyVideos) {
        // Marcar como na fila (será controlado pelo backend)
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id ? { ...v, status: "queued" } : v
          )
        );

        // Preparar FormData
        const formData = new FormData();
        formData.append('file', video.file);
        formData.append('snapshotCount', video.options.snapshotCount?.toString() || '');
        formData.append('intervalSeconds', video.options.intervalSeconds?.toString() || '');
        formData.append('width', video.options.width.toString());
        formData.append('height', video.options.height.toString());
        formData.append('prompt', video.options.prompt || '');

        // Enviar para o servidor via service centralizado
        const response = await processVideoRequest(formData);

        if (response.ok) {
          // Try to extract a job id returned by the backend (id, jobId or videoId)
          let json: any = null;
          try {
            json = await response.json();
          } catch (e) {
            json = null;
          }

          const returnedJobId = json?.jobId || json?.id || json?.videoId || undefined;

          // Update video with job id and mark as queued or processing
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id ? { ...v, jobId: returnedJobId, status: returnedJobId ? 'queued' : 'processing' } : v
            )
          );

          if (returnedJobId) {
            // start polling
            startPollingStatus(returnedJobId, video.id);
          } else {
            // If no job id returned, optimistically mark as processing and then processed
            setVideos((prev) =>
              prev.map((v) =>
                v.id === video.id ? { ...v, status: 'processing' } : v
              )
            );
          }
        } else {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === video.id ? { ...v, status: "error" } : v
            )
          );
        }
      }
    } catch (error) {
      console.error("Error processing videos:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [videos, validateVideoConfig, startPollingStatus]);

  // Keep references to active polling intervals so we can clear them on unmount
  const pollingRefs = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      // clear intervals on unmount
      Object.values(pollingRefs.current).forEach((id) => clearInterval(id));
      pollingRefs.current = {};
    };
  }, []);

  const readyCount = videos.filter((v) => v.status === "ready").length;
  const configuredCount = videos.filter((v) => v.status === "ready" && validateVideoConfig(v)).length;

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
            <div>
              <h3 className="font-medium">
                Vídeos ({readyCount}/{videos.length})
              </h3>
              {readyCount > 0 && configuredCount < readyCount && (
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {configuredCount}/{readyCount} vídeos configurados
                </p>
              )}
            </div>
            {readyCount > 0 && (
              <Button
                onClick={processVideos}
                disabled={isProcessing || configuredCount === 0}
                className="gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Processar Vídeos
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

                  {video.status === "queued" && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Na fila...</span>
                    </div>
                  )}
                  
                  {video.status === "processing" && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-xs text-muted-foreground">Processando...</span>
                    </div>
                  )}
                  
                  {video.status === "processed" && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-500">Processado</span>
                    </div>
                  )}
                  
                  {video.status === "error" && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-xs text-red-600 dark:text-red-500">Erro</span>
                    </div>
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
                        {video.durationLoaded && video.duration && video.duration > 0 ? (
                          <div className="p-3 bg-secondary/50 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium">Duração do vídeo:</span>{" "}
                              <span className="text-muted-foreground">
                                {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}min
                                {" "}({video.duration.toFixed(1)}s)
                              </span>
                            </p>
                          </div>
                        ) : video.durationLoaded ? (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm text-yellow-600 dark:text-yellow-500">
                              <span className="font-medium">⚠️ Formato não suportado pelo navegador</span>
                              <br />
                              <span className="text-xs">Configure manualmente os valores. Recomendamos converter para MP4.</span>
                            </p>
                          </div>
                        ) : null}

                        <div className="grid gap-3">
                          <Label>Modo de Extração</Label>
                          <Select
                            value={video.options.mode || ""}
                            onValueChange={(value) => {
                              const mode = value as "snapshot" | "interval" | "prompt";
                              updateVideoOptions(video.id, { mode, snapshotCount: undefined, intervalSeconds: undefined, prompt: undefined });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha o modo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="snapshot">Número de snapshots</SelectItem>
                              <SelectItem value="interval">Intervalo entre snapshots</SelectItem>
                              <SelectItem value="prompt">Prompt de extração</SelectItem>
                            </SelectContent>
                          </Select>

                          {!video.options.mode && (
                            <p className="text-xs text-muted-foreground">Selecione um modo para ver os inputs correspondentes.</p>
                          )}

                          {video.options.mode === 'snapshot' && (
                            <div className="grid gap-3">
                              <Label htmlFor={`snapshot-count-${video.id}`}>Número de Snapshots</Label>
                              <Input
                                id={`snapshot-count-${video.id}`}
                                type="number"
                                min="1"
                                max={video.duration && video.duration > 0 ? Math.floor(video.duration) : 10000}
                                placeholder="Ex: 10 (distribuídos uniformemente)"
                                value={video.options.snapshotCount || ""}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                                  if (value) {
                                    const maxCount = video.duration && video.duration > 0 ? Math.floor(video.duration) : 10000;
                                    const limitedValue = Math.min(Math.max(value, 1), maxCount);
                                    updateVideoOptions(video.id, { snapshotCount: limitedValue });
                                  } else {
                                    updateVideoOptions(video.id, { snapshotCount: undefined });
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                {video.duration && video.duration > 0 ? `Máximo: ${Math.floor(video.duration)} snapshots` : 'Máximo: 10000 snapshots'}
                              </p>
                            </div>
                          )}

                          {video.options.mode === 'interval' && (
                            <div className="grid gap-3">
                              <Label htmlFor={`interval-${video.id}`}>Intervalo entre Snapshots (segundos)</Label>
                              <Input
                                id={`interval-${video.id}`}
                                type="number"
                                min="0.1"
                                max={video.duration && video.duration > 0 ? video.duration : 86400}
                                step="0.1"
                                placeholder="Ex: 2.5"
                                value={video.options.intervalSeconds || ""}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                  if (value) {
                                    const maxInterval = video.duration && video.duration > 0 ? video.duration : 86400;
                                    const limitedValue = Math.min(Math.max(value, 0.1), maxInterval);
                                    updateVideoOptions(video.id, { intervalSeconds: limitedValue });
                                  } else {
                                    updateVideoOptions(video.id, { intervalSeconds: undefined });
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">
                                {video.duration && video.duration > 0 ? `Máximo: ${video.duration.toFixed(1)}s` : 'Máximo: 24h (86400s)'}
                              </p>
                            </div>
                          )}

                          {video.options.mode === 'prompt' && (
                            <div className="grid gap-3">
                              <Label htmlFor={`prompt-${video.id}`}>Prompt de Extração</Label>
                              <Textarea
                                id={`prompt-${video.id}`}
                                placeholder="Descreva o que deseja extrair (ex: Extrair os melhores momentos do vídeo)"
                                value={video.options.prompt || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value && value.trim().length > 0) {
                                    updateVideoOptions(video.id, { prompt: value });
                                  } else {
                                    updateVideoOptions(video.id, { prompt: undefined });
                                  }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">Sugestões:</p>
                              <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => updateVideoOptions(video.id, { prompt: 'Extrair os melhores momentos do vídeo', mode: 'prompt' })} className="text-xs">Extrair os melhores momentos</Button>
                                <Button variant="outline" size="sm" onClick={() => updateVideoOptions(video.id, { prompt: 'Extrair os momentos mais marcantes e emocionantes', mode: 'prompt' })} className="text-xs">Momentos mais marcantes</Button>
                                <Button variant="outline" size="sm" onClick={() => updateVideoOptions(video.id, { prompt: 'Extrair cenas ideais para thumbnail', mode: 'prompt' })} className="text-xs">Cenas para thumbnail</Button>
                              </div>
                            </div>
                          )}
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
