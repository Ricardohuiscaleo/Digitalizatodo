"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getTenantInfo, registerStudent } from "@/lib/api";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function TenantRegisterPage() {
  const { slug } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [identifying, setIdentifying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    guardian_name: "", guardian_email: "", guardian_phone: "",
    password: "", password_confirmation: "",
    is_self_register: true,
    students: [{ name: "", category: "kids" }],
    plan_id: null,
  });

  useEffect(() => {
    getTenantInfo(slug as string).then(t => {
      if (t && !t.message) setTenant(t);
      setIdentifying(false);
    });
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) { setError("Las contraseñas no coinciden."); return; }
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
              <button type="button" onClick={() => setForm({...form, students: [...form.students, {name:"",category:"kids"}]})}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900">+ Agregar</button>
            </div>
            {form.students.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input required placeholder="Nombre del alumno" value={s.name}
                  onChange={e => { const st=[...form.students]; st[i].name=e.target.value; setForm({...form,students:st}); }}
                  className="flex-1 h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 focus:ring-2 ring-zinc-900 outline-none" />
                <select value={s.category}
                  onChange={e => { const st=[...form.students]; st[i].category=e.target.value; setForm({...form,students:st}); }}
                  className="h-11 bg-zinc-50 rounded-xl px-3 text-xs text-zinc-600 focus:ring-2 ring-zinc-900 outline-none">
                  <option value="kids">Kids</option>
                  <option value="adults">Adulto</option>
                </select>
              </div>
            ))}
          </div>

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
