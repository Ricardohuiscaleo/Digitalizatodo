"use client";

import { useState } from "react";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, login } from "@/lib/api";
import Image from "next/image";

export default function LoginPage() {
  const { branding, setBranding, isLoading } = useBranding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branding || !email || !password) return;

    setError(null);
    setIsLoggingIn(true);
    const result = await login(branding.id, { email, password });
    setIsLoggingIn(false);

    if (result.token) {
      if (result.user_type !== 'staff') {
        setError("Este portal es solo para profesores y administradores.");
        setIsLoggingIn(false);
        return;
      }
      localStorage.setItem("staff_token", result.token);
      localStorage.setItem("tenant_id", branding.id);
      window.location.href = "/dashboard";
    } else {
      setError(result.message || "Error al iniciar sesión.");
    }
  };

  const handleEmailBlur = async () => {
    if (!email || !email.includes("@")) return;

    setIsIdentifying(true);
    const data = await identifyTenant(email);
    setIsIdentifying(false);

    if (data && data.found && data.tenants.length > 0) {
      // Si hay varias, por ahora tomamos la primera para el branding visual
      setBranding(data.tenants[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-background via-background to-slate-900/50">
      <div className="w-full max-w-md space-y-8">
        {/* Branding Area */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden">
            {branding?.logo ? (
              <Image
                src={branding.logo}
                alt={branding.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {branding?.name || "Digitaliza Todo"}
            </h1>
            <div className="inline-block mt-1 px-3 py-1 rounded-full border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
              Management
            </div>
            <p className="mt-4 text-xs text-foreground/60">
              Ingresa al portal de gestión
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="mt-8 rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-center text-xs font-medium text-red-400 border border-red-500/20 animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 ml-1">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="tu@correo.com"
                className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 transition-all ${isIdentifying ? "border-primary/50 animate-pulse" : "border-white/10 focus:border-primary/50 focus:ring-primary/50"
                  }`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 ml-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-foreground placeholder:text-foreground/30 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isIdentifying || !branding}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-background shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-xs text-foreground/40 hover:text-primary transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-foreground/30">
          Digitaliza Todo &copy; 2026. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
