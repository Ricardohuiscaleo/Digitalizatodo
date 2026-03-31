"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getTenantInfo, registerStudent, getPlans } from "@/lib/api";
import { Loader2, CheckCircle2, Crown, Baby } from "lucide-react";

export default function TenantRegisterPage() {
  const { slug } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [identifying, setIdentifying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const isMartialArts = tenant?.industry === 'martial_arts';

  const [form, setForm] = useState<any>({
    guardian_name: "", guardian_email: "", guardian_phone: "",
    password: "", password_confirmation: "",
    is_self_register: true,
    students: [], // Empezar vacío, el apoderado se marca por defecto
    plan_id: null,
    adult_plan_id: null,
    kid_plan_id: null,
  });

  useEffect(() => {
    getTenantInfo(slug as string).then(t => {
      if (t && !t.message) setTenant(t);
      setIdentifying(false);
    });
    getPlans(slug as string, "").then(p => {
      if (Array.isArray(p)) setPlans(p);
    });
  }, [slug]);

  const calculateAge = (date: string) => {
    if (!date) return 0;
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const hasAdults = form.is_self_register || form.students.some((s: any) => {
    if (isMartialArts) return calculateAge(s.birth_date) >= 14;
    return s.category === 'adults';
  });
  const hasKids = form.students.some((s: any) => {
    if (isMartialArts) return s.birth_date && calculateAge(s.birth_date) < 14;
    return s.category === 'kids';
  });

  const adultPlans = plans.filter((p: any) => p.target_audience === 'adults' || p.target_audience === 'all');
  const kidPlans = plans.filter((p: any) => p.target_audience === 'kids' || p.target_audience === 'all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) { setError("Las contraseñas no coinciden."); return; }
    
    // Validaciones de planes obligatorios
    if (hasAdults && !form.adult_plan_id && !form.plan_id) {
      setError("Debes seleccionar un plan para adultos.");
      return;
    }
    if (hasKids && !form.kid_plan_id && !form.plan_id) {
      setError("Debes seleccionar un plan para niños.");
      return;
    }

    setLoading(true); setError("");
    const result = await registerStudent(slug as string, form);
    setLoading(false);
    if (result.errors) {
      const first = Object.values(result.errors)[0] as string[];
      setError(first[0] || "Revisa los datos ingresados.");
    } else if (result.message && !result.guardian) {
      setError(result.message);
    } else {
      setSuccess(true);
    }
  };

  if (identifying) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  if (!tenant) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-zinc-400 text-sm">Institución no encontrada.</p>
    </div>
  );

  if (success) return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-white">
      <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
        <CheckCircle2 className="text-emerald-500" size={32} />
      </div>
      <h1 className="text-xl font-black text-zinc-900">¡Registro exitoso!</h1>
      <p className="text-sm text-zinc-500 mt-2">Bienvenido a <span className="font-semibold text-zinc-800">{tenant.name}</span></p>
      <p className="text-xs text-zinc-400 mt-4 max-w-xs">Ya puedes iniciar sesión con tu correo y contraseña.</p>
      <a href="/login" className="mt-8 h-11 px-8 bg-zinc-950 text-white text-sm font-semibold rounded-xl flex items-center justify-center transition-all active:scale-95">
        Ir al login
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 pb-20">
      <div className="w-full max-w-sm pt-10 space-y-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center">
            {tenant.logo
              ? <img src={tenant.logo} className="h-full w-full object-contain" />
              : <span className="text-xl font-black text-zinc-400">{tenant.name?.[0]}</span>
            }
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black text-zinc-900">Únete a {tenant.name}</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">Registro de titular</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-500">Tus datos</label>
            <input required placeholder="Nombre completo" value={form.guardian_name}
              onChange={e => setForm({...form, guardian_name: e.target.value})}
              className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none" />
            <input required type="email" placeholder="Correo electrónico" value={form.guardian_email}
              onChange={e => setForm({...form, guardian_email: e.target.value})}
              className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none" />
            <input required type="tel" placeholder="Teléfono" value={form.guardian_phone}
              onChange={e => setForm({...form, guardian_phone: e.target.value})}
              className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none" />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-500">Contraseña</label>
            <input required type="password" placeholder="Contraseña" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none" />
            <input required type="password" placeholder="Confirmar contraseña" value={form.password_confirmation}
              onChange={e => setForm({...form, password_confirmation: e.target.value})}
              className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-500">Alumnos a inscribir</label>
              <button type="button" onClick={() => setForm({...form, students: [...form.students, {name:"",category:"kids", birth_date: ""}]})}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900">+ Agregar familiar</button>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 transition-all">
                <input 
                    type="checkbox" 
                    id="self_register"
                    checked={form.is_self_register}
                    onChange={e => setForm({...form, is_self_register: e.target.checked})}
                    className="h-5 w-5 bg-white border-zinc-200 rounded-lg text-zinc-950 focus:ring-zinc-950"
                />
                <label htmlFor="self_register" className="flex-1 cursor-pointer">
                    <p className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">Yo también voy a entrenar</p>
                    <p className="text-[10px] text-zinc-400">Inscribirte como alumno titular</p>
                </label>
            </div>

            {form.students.map((s: any, i: number) => (
              <div key={i} className="group relative space-y-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                        <input required placeholder="Nombre del familiar" value={s.name}
                            onChange={e => { const st=[...form.students]; st[i].name=e.target.value; setForm({...form,students:st}); }}
                            className="w-full h-10 bg-white border border-zinc-200 rounded-xl px-3 text-xs text-zinc-900 placeholder:text-zinc-300 focus:ring-1 ring-zinc-950 outline-none" 
                        />
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[8px] font-black text-zinc-400 uppercase ml-1">Fecha de Nacimiento</label>
                                <input required type="date" value={s.birth_date}
                                    onChange={e => { 
                                        const st=[...form.students]; 
                                        st[i].birth_date=e.target.value;
                                        if (isMartialArts) st[i].category = calculateAge(e.target.value) >= 14 ? 'adults' : 'kids';
                                        setForm({...form,students:st}); 
                                    }}
                                    className="w-full h-10 bg-white border border-zinc-200 rounded-xl px-3 text-xs text-zinc-900 focus:ring-1 ring-zinc-950 outline-none" 
                                />
                            </div>
                            {!isMartialArts && (
                                <div className="w-1/3">
                                    <label className="text-[8px] font-black text-zinc-400 uppercase ml-1">Categoría</label>
                                    <select value={s.category}
                                        onChange={e => { const st=[...form.students]; st[i].category=e.target.value; setForm({...form,students:st}); }}
                                        className="w-full h-10 bg-white border border-zinc-200 rounded-xl px-2 text-[10px] font-bold text-zinc-600 focus:ring-1 ring-zinc-950 outline-none">
                                        <option value="kids">Niño</option>
                                        <option value="adults">Adulto</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <button type="button" onClick={() => { const st=form.students.filter((_: any, idx: number)=>idx!==i); setForm({...form, students:st}); }}
                        className="h-10 w-10 flex items-center justify-center text-zinc-300 hover:text-rose-500 transition-colors mt-auto">
                        <Loader2 size={16} className="rotate-45" />
                    </button>
                </div>
              </div>
            ))}
          </div>

          {/* Plan Selection - Martial Arts Specific mandatory logic */}
          {isMartialArts && (hasAdults || hasKids) && (
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <label className="text-xs font-black text-zinc-900 uppercase tracking-widest">Planes de Membresía</label>
              
              {hasAdults && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Crown size={12} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight text-zinc-400">Plan para Adultos</span>
                  </div>
                  <select 
                    required 
                    value={form.adult_plan_id || ""}
                    onChange={e => setForm({...form, adult_plan_id: e.target.value})}
                    className="w-full h-11 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-sm text-zinc-900 focus:ring-2 ring-zinc-900 outline-none"
                  >
                    <option value="">Selecciona un plan...</option>
                    {adultPlans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ${parseFloat(p.price).toLocaleString('es-CL')}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasKids && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Baby size={12} className="text-indigo-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight text-zinc-400">Plan para Niños (Kids)</span>
                  </div>
                  <select 
                    required 
                    value={form.kid_plan_id || ""}
                    onChange={e => setForm({...form, kid_plan_id: e.target.value})}
                    className="w-full h-11 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-sm text-zinc-900 focus:ring-2 ring-zinc-900 outline-none"
                  >
                    <option value="">Selecciona un plan...</option>
                    {kidPlans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ${parseFloat(p.price).toLocaleString('es-CL')}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {/* Plan Selection for other industries - Just show one plan selector if exists */}
          {!isMartialArts && plans.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-zinc-500">Selecciona tu plan</label>
              <select 
                required 
                value={form.plan_id || ""}
                onChange={e => setForm({...form, plan_id: e.target.value})}
                className="w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none"
              >
                <option value="">Seleccionar plan...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - ${parseFloat(p.price).toLocaleString('es-CL')}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Completar registro"}
          </button>

          <p className="text-center text-xs text-zinc-400">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-zinc-600 hover:text-zinc-900 font-medium">Iniciar sesión</a>
          </p>
        </form>
      </div>
    </div>
  );
}
