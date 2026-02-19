import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { socialLoginUrl } from "@/services/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn(email, password);
    
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Erro ao fazer login");
    }
    
    setIsLoading(false);
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    window.location.href = socialLoginUrl(provider);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary">
              <Video className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">TechVeo</h1>
              <p className="text-muted-foreground mt-1">
                Faça login para continuar
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 bg-card border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11 bg-card border-border"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Social login buttons */}
          <div className="pt-2">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleSocialLogin("google")}
                className="flex-1 h-11"
                variant="outline"
              >
                <span className="mr-2 flex items-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2045c0-.638-.0573-1.251-.164-1.836H9v3.478h4.844c-.209 1.126-.84 2.083-1.785 2.727v2.266h2.888c1.691-1.558 2.693-3.854 2.693-6.635z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.468-.806 5.958-2.188l-2.888-2.266c-.802.538-1.83.857-3.07.857-2.36 0-4.36-1.593-5.08-3.734H.995v2.344C2.48 15.83 5.522 18 9 18z" fill="#34A853"/>
                    <path d="M3.92 10.669c-.18-.538-.283-1.114-.283-1.699s.103-1.161.283-1.699V4.927H.995A8.997 8.997 0 000 9c0 1.45.345 2.824.995 4.073l2.925-2.404z" fill="#FBBC05"/>
                    <path d="M9 3.579c1.322 0 2.51.455 3.446 1.349l2.586-2.586C13.463.954 11.425 0 9 0 5.522 0 2.48 2.17.995 4.927l2.925 2.344C4.64 5.172 6.64 3.579 9 3.579z" fill="#EA4335"/>
                  </svg>
                </span>
                Entrar com Google
              </Button>

              <Button
                onClick={() => handleSocialLogin("facebook")}
                className="flex-1 h-11"
                variant="outline"
              >
                <span className="mr-2 flex items-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12.073C22 6.486 17.523 2 11.936 2S2 6.486 2 12.073C2 17.104 5.656 21.128 10.438 21.93v-6.99H7.898v-2.87h2.54V9.845c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.773-1.63 1.562v1.88h2.773l-.443 2.87h-2.33v6.99C18.344 21.128 22 17.104 22 12.073z" fill="#1877F2"/>
                  </svg>
                </span>
                Entrar com Facebook
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-center text-xs text-muted-foreground flex-1">
              Configure seu endpoint de autenticação no backend
            </p>
            <Button
              variant="ghost"
              onClick={() => navigate("/register")}
              className="text-xs"
            >
              Criar conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
