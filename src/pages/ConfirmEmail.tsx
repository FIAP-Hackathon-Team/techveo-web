import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authConfirmRequest, authResendConfirmRequest } from "@/services/api";

type Payload = {
  email?: string;
  userId?: string;
  pin: string;
};

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const [email, setEmail] = useState(state.email || "");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const combinedPin = digits.join("");
    if (combinedPin.length < 6 || (!email && !state.userId)) {
      setError("Informe o email (ou verifique link) e o Código de 6 dígitos");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Payload = { pin: combinedPin };
      if (email) payload.email = email;
      if (state.userId) payload.userId = state.userId;

      const res = await authConfirmRequest(payload);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Erro ao confirmar conta");
        return;
      }

      setMessage("Conta confirmada com sucesso. Redirecionando para login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.message || "Erro de rede");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    if (!email && !state.userId) {
      setError("Informe o email para reenviar o Código");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Omit<Payload, "pin"> = {};
      if (email) payload.email = email;
      if (state.userId) payload.userId = state.userId;

      const res = await authResendConfirmRequest(payload);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Erro ao reenviar Código");
        return;
      }

      setMessage("Código reenviado. Verifique seu email.");
    } catch (err) {
      setError(err?.message || "Erro de rede");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight">Confirmação de Email</h1>
            <p className="text-muted-foreground mt-1">Insira o código enviado por email</p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!state.userId} className="h-11 bg-card border-border" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">Código</Label>
                <div className="flex justify-between" onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
                  if (!pasted) return;
                  const chars = pasted.slice(0, 6).split('');
                  const next = [...digits];
                  for (let i = 0; i < chars.length; i++) next[i] = chars[i];
                  setDigits(next);
                  const nextIndex = chars.length >= 6 ? 5 : chars.length;
                  inputsRef.current[nextIndex]?.focus();
                }}>
                  {digits.map((d, i) => (
                    <Input
                      key={i}
                      id={`pin-${i}`}
                      value={d}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(-1);
                        const next = [...digits];
                        next[i] = v;
                        setDigits(next);
                        if (v && i < 5) inputsRef.current[i + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (digits[i]) {
                            const next = [...digits];
                            next[i] = '';
                            setDigits(next);
                          } else if (i > 0) {
                            inputsRef.current[i - 1]?.focus();
                            const next = [...digits];
                            next[i - 1] = '';
                            setDigits(next);
                          }
                        }
                        if (e.key === 'ArrowLeft' && i > 0) {
                          inputsRef.current[i - 1]?.focus();
                        }
                        if (e.key === 'ArrowRight' && i < 5) {
                          inputsRef.current[i + 1]?.focus();
                        }
                      }}
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      ref={(el) => (inputsRef.current[i] = el)}
                      className="w-12 h-12 text-center text-lg bg-card border-border"
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent-foreground">{message}</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-11 font-medium">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </form>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Não recebeu o email?</p>
            <Button variant="ghost" onClick={handleResend} disabled={isLoading} className="h-9">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reenviar Código"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
