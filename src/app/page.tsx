"use client";

import { useState, useEffect } from "react";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, login, resumeSession } from "@/lib/api";
import { Loader2, RefreshCw, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { setBranding, isLoading } = useBranding();
  const [step, setStep] = useState<"email" | "tenant" | "password">("email");  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
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
    const checkSession = async () => {
      const storedToken = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
      const rememberToken = localStorage.getItem("remember_token");
      const tenantSlug = localStorage.getItem("tenant_slug");

      if (tenantSlug) {
        if (storedToken) {
          const isStaff = !!localStorage.getItem("staff_token");
          window.location.href = isStaff ? "/dashboard" : "/dashboard/student";
          return;
        }

        if (rememberToken) {
          // Intentar reanimar sesión silenciosamente
          const resumed = await resumeSession(tenantSlug, rememberToken);
          if (resumed?.token) {
            const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
            localStorage.setItem(key, resumed.token);
            window.location.href = resumed.user_type === 'staff' ? "/dashboard" : "/dashboard/student";
            return;
          }
        }
      }
    };

    checkSession();
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setError(null);
    setIsIdentifying(true);
    const data = await identifyTenant(email);
    setIsIdentifying(false);
    if (data?.found && data.tenants.length > 0) {
      if (data.tenants.length === 1) {
        selectTenant(data.tenants[0]);
      } else {
        setAvailableTenants(data.tenants);
        setStep("tenant");
      }
    } else {
      setError("No encontramos una cuenta asociada a este correo.");
    }
  };

  const selectTenant = (t: any) => {
    setTenant(t);
    setBranding({ id: t.id, slug: t.slug, name: t.name, industry: t.industry, logo: t.logo, primaryColor: t.primary_color });
    setStep("password");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    const result: any = await login(tenant.slug || tenant.id, { email, password, remember });
    setIsLoggingIn(false);
    
    if (result.token) {
      localStorage.setItem("tenant_id", String(tenant.id));
      localStorage.setItem("tenant_slug", tenant.slug);
      if (result.tenant) {
        localStorage.setItem("tenant_industry", result.tenant.industry || "");
        setBranding({ id: result.tenant.id, slug: result.tenant.slug, name: result.tenant.name, industry: result.tenant.industry, logo: result.tenant.logo, primaryColor: result.tenant.primary_color });
      }
      
      // Persistir otros tenants disponibles si existen
      if (availableTenants.length > 1) {
        localStorage.setItem("available_tenants", JSON.stringify(availableTenants));
      }
      
      if (remember && result.remember_token) {
        localStorage.setItem("remember_token", result.remember_token);
      }
      
      if (result.user_type === "staff") {
        localStorage.setItem("staff_token", result.token);
        if (result.role) localStorage.setItem("user_role", result.role);
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

        {/* Branding Optimizado con Efecto Marco Premium */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-zinc-100 to-white shadow-xl flex items-center justify-center overflow-hidden transition-all duration-700 hover:scale-105 relative border border-zinc-50">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden ring-4 ring-white shadow-inner">
                    {tenant?.logo
                      ? <img src={tenant.logo} className="h-full w-full object-cover" />
                      : <img src="/DLogo-v2.webp" className="h-full w-full object-cover" />
                    }
                </div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-black text-zinc-900 tracking-tight">{tenant?.name || "Digitaliza Todo"}</h1>
            
            <div className="mt-2 min-h-[28px] flex justify-center">
              {step === "email" ? (
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] pt-1">
                  Identifícate para continuar
                </p>
              ) : (
                <div className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 shadow-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      {tenant?.detected_roles?.includes("guardian") && tenant?.detected_roles?.includes("staff")
                        ? "Cuenta Multi-Rol Detectada"
                        : tenant?.detected_roles?.includes("staff")
                          ? "Portal de Gestión"
                          : "Portal de Alumnos / Apoderados"}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formularios */}
        <div className="relative">
          {/* Paso 1: Email */}
          {step === "email" && (
            <div className="border border-zinc-100 rounded-[2.5rem] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-sm">
              {error && (
                <div className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 animate-in shake-in duration-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="mi@correo.com"
                      className="w-full h-14 bg-zinc-50 rounded-2xl px-6 text-sm font-medium text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:ring-4 ring-zinc-100 outline-none transition-all"
                    />
                    {isIdentifying && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-zinc-400" size={16} />
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isIdentifying}
                  className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  Continuar <ArrowLeft className="rotate-180" size={14} />
                </button>
              </form>
            </div>
          )}

          {/* Paso 1.5: Selector de Tenant */}
          {step === "tenant" && (
            <div className="border border-zinc-100 rounded-[2.5rem] p-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Selecciona tu organización</p>
              {availableTenants.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTenant(t)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-all text-left"
                >
                  <img src={t.logo} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{t.detected_roles?.includes('staff') ? 'Staff' : 'Apoderado'}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setStep("email"); setError(null); }}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all py-1"
              >
                <ArrowLeft size={12} /> Usar otro correo
              </button>
            </div>
          )}

          {/* Paso 2: Contraseña */}
          {step === "password" && (
            <div className="border border-zinc-100 rounded-[2.5rem] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-sm">
              {error && (
                <div className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  {error}
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tu Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 bg-zinc-50 rounded-2xl px-6 text-sm font-medium text-zinc-900 placeholder:text-zinc-300 focus:bg-white focus:ring-4 ring-zinc-100 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-900 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={e => setRemember(e.target.checked)}
                        className="peer h-5 w-5 opacity-0 absolute cursor-pointer"
                      />
                      <div className="h-5 w-5 bg-zinc-100 border border-zinc-200 rounded-lg peer-checked:bg-zinc-900 peer-checked:border-zinc-900 transition-all" />
                      <div className="absolute text-white scale-0 peer-checked:scale-100 transition-transform left-1 top-1">
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-800 transition-colors">Mantener sesión activa</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-14 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {isLoggingIn ? <Loader2 className="animate-spin" size={16} /> : "Iniciar Sesión"}
                </button>
              </form>
              
              <button
                onClick={() => { setStep("email"); setError(null); setPassword(""); }}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all py-1"
              >
                <ArrowLeft size={12} /> Usar otro correo
              </button>
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <p className="text-[11px] font-bold text-zinc-400">
            ¿Nuevo en Digitaliza Todo?{" "}
            <a href="/onboarding" className="text-zinc-900 hover:underline">
              Obtén tu demo aquí ❤️
            </a>
          </p>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="fixed bottom-8 text-center w-full">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-200">Digitalizatodo Engine © 2026</p>
      </div>
    </div>
  );
}
