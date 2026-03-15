"use client";

import { useState, useEffect } from "react";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, login } from "@/lib/api";
import { Loader2, RefreshCw, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { setBranding, isLoading } = useBranding();
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-redirección si ya hay sesión
  useEffect(() => {
    const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
    const rememberToken = localStorage.getItem("remember_token");
    const tenantSlug = localStorage.getItem("tenant_slug");

    if ((token || rememberToken) && tenantSlug) {
      // Si tenemos token o remember, dejamos que el dashboard maneje la sesión
      const isStaff = !!localStorage.getItem("staff_token");
      window.location.href = isStaff ? "/dashboard" : "/dashboard/student";
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setError(null);
    setIsIdentifying(true);
    const data = await identifyTenant(email);
    setIsIdentifying(false);
    if (data?.found && data.tenants.length > 0) {
      const t = data.tenants[0];
      setTenant(t);
      setBranding({ id: t.id, slug: t.slug, name: t.name, industry: t.industry, logo: t.logo, primaryColor: t.primary_color });
      setStep("password");
    } else {
      setError("No encontramos una academia asociada a este correo.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    // IMPORTANTE: El backend espera el SLUG en la URL
    const result: any = await login(tenant.slug || tenant.id, { email, password, remember });
    setIsLoggingIn(false);
    if (result.token) {
      localStorage.setItem("tenant_id", String(tenant.id));
      localStorage.setItem("tenant_slug", tenant.slug);
      if (remember && result.remember_token) {
        localStorage.setItem("remember_token", result.remember_token);
      }
      if (result.user_type === "staff") {
        localStorage.setItem("staff_token", result.token);
        window.location.href = "/dashboard";
      } else {
        localStorage.setItem("auth_token", result.token);
        window.location.href = "/dashboard/student";
      }
    } else {
      setError(result.message || "Contraseña incorrecta");
    }
  };

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[360px] space-y-8 animate-in fade-in duration-300">

        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-500">
            {tenant?.logo
              ? <img src={tenant.logo} className="h-full w-full object-contain" />
              : <img src="/DLogo-v2.webp" className="h-full w-full object-contain" />
            }
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-zinc-900">{tenant?.name || "Digitaliza Todo"}</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">
              {step === "email" ? "Ingresa tu correo para continuar" : "Portal de gestión"}
            </p>
          </div>
        </div>

        {/* Paso 1: Email */}
        {step === "email" && (
          <div className="border border-zinc-100 rounded-2xl p-7 space-y-5 animate-in fade-in duration-200">
            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Correo electrónico</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none transition-all"
                  />
                  {isIdentifying && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" size={13} />}
                </div>
              </div>
              <button
                type="submit"
                disabled={isIdentifying}
                className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
              >
                {isIdentifying ? <Loader2 className="animate-spin" size={16} /> : "Continuar"}
              </button>
            </form>
          </div>
        )}

        {/* Paso 2: Contraseña */}
        {step === "password" && (
          <div className="border border-zinc-100 rounded-2xl p-7 space-y-5 animate-in fade-in duration-200">
            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-zinc-50 rounded-xl px-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-zinc-900"
                />
                <span className="text-xs text-zinc-500">Recordar sesión</span>
              </label>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" size={16} /> : "Iniciar sesión"}
              </button>
            </form>
            <button
              onClick={() => { setStep("email"); setError(null); setPassword(""); }}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <ArrowLeft size={12} /> Cambiar correo
            </button>
          </div>
        )}

        <p className="text-center text-xs text-zinc-400">
          ¿No tienes cuenta?{" "}
          <a href="/onboarding" className="text-zinc-600 hover:text-zinc-900 font-medium transition-colors">
            Regístrate y obtén una demo ❤️
          </a>
        </p>
      </div>
    </div>
  );
}
