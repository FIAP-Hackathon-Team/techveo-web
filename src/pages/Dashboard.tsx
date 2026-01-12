import { Header } from "@/components/Header";
import { VideoUploader } from "@/components/VideoUploader";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3 animate-fade-in">
            <h1 className="text-3xl font-semibold tracking-tight">
              Upload de Vídeos
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Faça upload de seus vídeos e baixe todos em um arquivo ZIP compactado
            </p>
          </div>

          <VideoUploader />
        </div>
      </main>
    </div>
  );
}
