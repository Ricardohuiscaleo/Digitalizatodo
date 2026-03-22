"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getRegistrationPage, registerStudent } from "@/lib/api";
import { Loader2, CheckCircle2, Eye, EyeOff, Users, Calendar } from "lucide-react";

type IndustryConfig = {
  memberLabel: string;
  membersLabel: string;
  selfRegisterLabel: string;
  showSelfRegister: boolean;
  showPricing: boolean;
  showCategory: boolean;
  showBJJGraduation: boolean; // New: BJJ belts/stripes
  courseLabel: string;
  courseOptions: { value: string; label: string }[];
  guardianLabel: string;
};

function getIndustryConfig(industry: string): IndustryConfig {
  const isSchool = industry === "school_treasury" || industry === "education";
  const isMartialArts = industry === "martial_arts";

  if (isSchool) {
    return {
      memberLabel: "Estudiante",
      membersLabel: "Estudiantes",
      selfRegisterLabel: "",
      showSelfRegister: false,
      showPricing: false,
      showCategory: true,
      showBJJGraduation: false,
      courseLabel: "Curso",
      courseOptions: [
        { value: "pre_kinder", label: "Pre-Kinder" },
        { value: "kinder", label: "Kinder" },
        { value: "1_basico", label: "1° Básico" },
        { value: "2_basico", label: "2° Básico" },
        { value: "3_basico", label: "3° Básico" },
        { value: "4_basico", label: "4° Básico" },
        { value: "5_basico", label: "5° Básico" },
        { value: "6_basico", label: "6° Básico" },
        { value: "7_basico", label: "7° Básico" },
        { value: "8_basico", label: "8° Básico" },
        { value: "1_medio", label: "1° Medio" },
        { value: "2_medio", label: "2° Medio" },
        { value: "3_medio", label: "3° Medio" },
        { value: "4_medio", label: "4° Medio" },
      ],
      guardianLabel: "Apoderado",
    };
  }

  // martial_arts, fitness, dance, music, clinic, default
  return {
    memberLabel: "Alumno",
    membersLabel: "Alumnos",
    selfRegisterLabel: "Yo también participaré",
    showSelfRegister: true,
    showPricing: true,
    showCategory: true,
    showBJJGraduation: isMartialArts,
    courseLabel: "Categoría",
    courseOptions: [
      { value: "kids", label: "Kids" },
      { value: "adults", label: "Adulto" },
    ],
    guardianLabel: "Titular",
  };
}

export default function RegisterPage() {
  const { code } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    guardian_name: "", guardian_email: "", guardian_phone: "",
    password: "", password_confirmation: "",
    is_self_register: false,
    self_student: { category: "adults", belt: "", degrees: null as number | null, modality: "gi", birth_date: "" },
    students: [] as any[],
    plan_id: null,
  });

  const BJJ_BELTS = [
    { id: 'white', name: 'B', color: '#ffffff', textColor: 'text-zinc-400' },
    { id: 'blue', name: 'A', color: '#1e40af', textColor: 'text-blue-100' },
    { id: 'purple', name: 'M', color: '#7e22ce', textColor: 'text-purple-100' },
    { id: 'brown', name: 'C', color: '#78350f', textColor: 'text-amber-100' },
    { id: 'black', name: 'N', color: '#18181b', textColor: 'text-zinc-100', border: 'border-zinc-700' },
  ];

  useEffect(() => {
    getRegistrationPage(code as string).then(t => {
      setTenant(t);
      setLoading(false);
    });
  }, [code]);

  const config: IndustryConfig = tenant ? getIndustryConfig(tenant.industry || "default") : getIndustryConfig("default");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.guardian_name) e.guardian_name = "El nombre es obligatorio";
    if (!form.guardian_email) e.guardian_email = "El correo es obligatorio";
    if (!form.guardian_phone) e.guardian_phone = "El teléfono es obligatorio";
    if (!form.password) e.password = "La contraseña es obligatoria";
    if (form.password.length < 8) e.password = "Mínimo 8 caracteres";
    if (form.password !== form.password_confirmation) e.password_confirmation = "No coinciden";
    if (!form.is_self_register && form.students.length === 0)
      e.students = `Debes inscribir al menos un ${config.memberLabel.toLowerCase()}`;
    if (!form.is_self_register && form.students.some(s => !s.name))
      e.students = "El nombre del alumno es obligatorio";
    
    if (config.showBJJGraduation) {
      if (form.is_self_register && !form.self_student.belt)
        e.self_belt = "Selecciona tu cinturón";
      if (form.is_self_register && form.self_student.degrees === null)
        e.self_degrees = "Selecciona tus grados";
      if (form.is_self_register && !form.self_student.birth_date)
        e.self_birth = "Fecha de nacimiento obligatoria";
      
      if (!form.is_self_register && form.students.some(s => !s.belt))
        e.students_belt = "Todos deben tener un cinturón";
      if (!form.is_self_register && form.students.some(s => s.degrees === null))
        e.students_degrees = "Todos deben tener grados seleccionados";
      if (!form.is_self_register && form.students.some(s => !s.birth_date))
        e.students_birth = "Todos deben tener fecha de nacimiento";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setError("");
    const result = await registerStudent(tenant.id, form);
    setSubmitting(false);
    if (result?.errors) {
      const first = Object.values(result.errors)[0] as string[];
      setError(first[0] || "Revisa los datos ingresados.");
    } else if (result?.guardian_id || result?.message?.includes("exitoso")) {
      setSuccess(true);
    } else {
      setError(result?.message || "Error al registrar.");
    }
  };

  const pricing = tenant?.data?.pricing || tenant?.data?.prices || { kids: 0, adult: 0, discountThreshold: 2, discountPercentage: 0 };

  const ModernDateInput = ({ value, onChange, placeholder, error }: any) => {
    const handleValueChange = (e: React.FocusEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
      let formatted = v;
      if (v.length >= 2) formatted = `${v.slice(0, 2)} / ${v.slice(2)}`;
      if (v.length >= 4) formatted = `${v.slice(0, 2)} / ${v.slice(2, 4)} / ${v.slice(4)}`;
      onChange(formatted);
    };

    return (
      <div className="relative group/date">
        <input type="text" value={value} onChange={handleValueChange} placeholder={placeholder} inputMode="numeric" maxLength={14}
          className={`w-full h-14 bg-zinc-900/40 rounded-[1.2rem] px-6 text-base text-white border transition-all outline-none font-black tracking-widest placeholder:text-zinc-800 ${error ? "border-red-500/50 text-red-100" : "border-zinc-800 focus:border-amber-500 shadow-xl focus:shadow-amber-500/10"}`}
        />
        <Calendar size={18} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-500/50" : "text-zinc-700 group-focus-within/date:text-amber-500"}`} />
      </div>
    );
  };

  const calculateTotal = () => {
    let kidsCount = 0, adultsCount = 0;
    if (form.is_self_register) adultsCount += 1;
    form.students.forEach(s => {
      if (s.name.trim()) {
        if (s.category === "kids") kidsCount += 1;
        else adultsCount += 1;
      }
    });
    const totalInscriptions = kidsCount + adultsCount;
    const subtotal = (kidsCount * (pricing.kids || 0)) + (adultsCount * (pricing.adult || 0));
    let total = subtotal, hasDiscount = false;
    if (pricing.discountThreshold > 0 && totalInscriptions >= pricing.discountThreshold && pricing.discountPercentage > 0) {
      total = subtotal * (1 - pricing.discountPercentage / 100);
      hasDiscount = true;
    }
    return { kidsCount, adultsCount, totalInscriptions, subtotal, total, hasDiscount };
  };

  const totals = calculateTotal();

  const inputClass = (field: string) =>
    `w-full h-12 bg-zinc-900/50 rounded-2xl px-5 text-sm text-white placeholder:text-zinc-700 border transition-all outline-none font-bold ${errors[field] ? "border-red-500/50" : "border-zinc-800 focus:border-amber-500/50"}`;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <Loader2 className="animate-spin text-zinc-800" size={32} />
    </div>
  );

  if (!tenant) return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Página de registro no encontrada</p>
    </div>
  );

  if (success) return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-[#09090b]">
      <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
        <CheckCircle2 className="text-emerald-500" size={40} />
      </div>
      <h1 className="text-2xl font-black text-white uppercase tracking-tighter">¡Registro exitoso!</h1>
      <p className="text-sm text-zinc-500 mt-3 font-bold">Bienvenido a <span className="text-amber-500">{tenant.name}</span></p>
      <a href="/login" className="mt-10 h-14 px-10 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-xl">
        Ir al login
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center p-6 pb-20 selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-sm pt-10 space-y-10 animate-in fade-in duration-1000">

        {/* Branding */}
        <div className="flex flex-col items-center gap-5">
          <div className="h-20 w-20 rounded-[2rem] bg-zinc-900 overflow-hidden flex items-center justify-center shadow-2xl border border-zinc-800 p-1 relative group">
            <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            {tenant.logo
              ? <img src={tenant.logo} className="h-full w-full object-contain relative z-10" />
              : <span className="text-2xl font-black text-zinc-700 relative z-10">{tenant.name?.[0]}</span>
            }
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Únete a {tenant.name}</h1>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Formulario de registro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          {/* DATOS DEL APODERADO/TITULAR */}
          <div className="space-y-5 bg-zinc-900/30 p-6 rounded-[2.5rem] border border-zinc-800/50 backdrop-blur-sm">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-amber-500" />
              Datos del {config.guardianLabel}
            </label>
            <div className="space-y-3">
              <div className="relative">
                <input placeholder="Nombre completo" value={form.guardian_name}
                  onChange={e => { setForm({ ...form, guardian_name: e.target.value }); if (errors.guardian_name) setErrors({ ...errors, guardian_name: "" }); }}
                  className={inputClass("guardian_name")} />
                {errors.guardian_name && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_name}</span>}
              </div>
              <div className="relative">
                <input type="email" placeholder="Correo electrónico" value={form.guardian_email}
                  onChange={e => { setForm({ ...form, guardian_email: e.target.value }); if (errors.guardian_email) setErrors({ ...errors, guardian_email: "" }); }}
                  className={inputClass("guardian_email")} />
                {errors.guardian_email && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_email}</span>}
              </div>
              <div className="relative">
                <input type="tel" placeholder="Teléfono" value={form.guardian_phone}
                  onChange={e => { setForm({ ...form, guardian_phone: e.target.value }); if (errors.guardian_phone) setErrors({ ...errors, guardian_phone: "" }); }}
                  className={inputClass("guardian_phone")} />
                {errors.guardian_phone && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_phone}</span>}
              </div>
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div className="space-y-5 bg-zinc-900/30 p-6 rounded-[2.5rem] border border-zinc-800/50 backdrop-blur-sm">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-indigo-500" />
              Crear Cuenta
            </label>
            <div className="space-y-3">
              {(["password", "password_confirmation"] as const).map((field, idx) => (
                <div key={field} className="relative">
                  {errors[field] && (
                    <div className="absolute -top-7 left-2 z-10 transition-all">
                      <div className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        {errors[field]}
                        <div className="absolute -bottom-1 left-3 w-2 h-2 bg-red-500 rotate-45"></div>
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={idx === 0 ? "Contraseña (mín. 8 caracteres)" : "Confirmar contraseña"}
                      value={form[field]}
                      onChange={e => { setForm({ ...form, [field]: e.target.value }); if (errors[field]) setErrors({ ...errors, [field]: "" }); }}
                      className={`w-full h-12 bg-zinc-950/50 rounded-2xl px-5 pr-11 text-sm text-white placeholder:text-zinc-700 border transition-all outline-none font-bold ${errors[field] ? "border-red-500/50" : "border-zinc-800 focus:border-indigo-500/50 shadow-inner"}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOGGLE "YO TAMBIÉN PARTICIPO" — solo industrias que lo usan */}
          {config.showSelfRegister && (
            <div className={`rounded-[2.5rem] border transition-all relative overflow-hidden ${form.is_self_register ? "bg-zinc-900 border-zinc-700 p-6 shadow-2xl" : "bg-zinc-900/30 border-zinc-800 p-4"}`}>
              {form.is_self_register && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
              )}
              <label className="flex items-center gap-4 cursor-pointer relative z-10">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={form.is_self_register}
                    onChange={e => setForm({ ...form, is_self_register: e.target.checked })}
                    className="sr-only" />
                  <div className={`w-12 h-7 rounded-full transition-colors border ${form.is_self_register ? "bg-amber-500 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-zinc-800 border-zinc-700"}`}></div>
                  <div className={`absolute left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${form.is_self_register ? "translate-x-5" : "translate-x-0"}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">{config.selfRegisterLabel}</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">
                    {form.is_self_register ? `Atleta + Titular` : `Solo Titular (No entrena)`}
                  </span>
                </div>
              </label>

              {form.is_self_register && config.showBJJGraduation && (
                <div className="mt-8 space-y-6 pt-8 border-t border-zinc-800 animate-in fade-in zoom-in duration-500">
                  <div className="space-y-4">
                    <div className="flex flex-col px-1">
                      <label className="text-[11px] uppercase tracking-[0.2em] font-black text-white/90">Tu Fecha de Nacimiento</label>
                      <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mt-1">Día / Mes / Año</span>
                    </div>
                    <ModernDateInput value={form.self_student.birth_date} placeholder="DD / MM / AAAA"
                      onChange={(v: string) => setForm({ ...form, self_student: { ...form.self_student, birth_date: v } })}
                      error={errors.self_birth}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">Tu Cinturón actual</label>
                    <div className="flex gap-1.5 h-10">
                      {BJJ_BELTS.map(belt => (
                        <button key={belt.id} type="button"
                          onClick={() => setForm({ ...form, self_student: { ...form.self_student, belt: belt.id } })}
                          className={`flex-1 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden group/belt ${form.self_student.belt === belt.id ? 'border-amber-500 ring-4 ring-amber-500/20 scale-105 z-10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-zinc-800 opacity-40 hover:opacity-100'}`}
                          style={{ backgroundColor: belt.color }}
                        >
                          <span className={`text-[9px] font-bold pointer-events-none z-10 ${belt.textColor} uppercase tracking-tighter`}>{belt.name}</span>
                          <div className={`absolute right-0 top-0 bottom-0 w-1/4 bg-zinc-950/90 pointer-events-none transition-all ${form.self_student.belt === belt.id ? 'w-1/3' : 'group-hover/belt:w-1/3'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.self_student.belt && (
                    <div key={form.self_student.belt} className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-4 bg-zinc-950/40 p-5 rounded-[2rem] border border-zinc-800/50 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white">Grados (Rayas)</label>
                          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Tu progreso en el tatami</p>
                        </div>
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4].map(deg => (
                            <button key={deg} type="button" 
                              onClick={() => setForm({ ...form, self_student: { ...form.self_student, degrees: deg } })}
                              className={`w-8 h-8 rounded-full text-xs font-black transition-all flex items-center justify-center ${form.self_student.degrees === deg 
                                ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-110' 
                                : 'bg-zinc-900 text-zinc-600 border border-zinc-800 hover:border-zinc-700'}`}>
                              {deg}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {form.self_student.degrees !== null && (
                    <div className="grid grid-cols-3 gap-2 animate-in fade-in zoom-in duration-500 delay-150">
                      {[
                        { id: 'gi', label: '🥋 Gi' },
                        { id: 'nogi', label: '👕 No-Gi' },
                        { id: 'both', label: '⚡ Ambas' }
                      ].map(mod => (
                        <button key={mod.id} type="button"
                          onClick={() => setForm({ ...form, self_student: { ...form.self_student, modality: mod.id } })}
                          className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${form.self_student.modality === mod.id 
                            ? 'bg-white text-black border-white shadow-xl' 
                            : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          {mod.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LISTA DE ALUMNOS/ESTUDIANTES */}
          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">
                {config.showSelfRegister ? `Otros ${config.membersLabel.toLowerCase()}` : `${config.membersLabel} a inscribir`}
              </label>
              <button type="button"
                onClick={() => setForm({ ...form, students: [...form.students, { name: "", category: config.courseOptions[0].value, belt: "", degrees: null as number | null, modality: "gi", birth_date: "" }] })}
                className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-2">
                <span className="w-5 h-5 bg-amber-500/10 rounded flex items-center justify-center">+</span>
                Agregar
              </button>
            </div>

            {errors.students && <p className="text-[10px] text-red-400 font-bold uppercase animate-pulse px-2">{errors.students}</p>}

            <div className="space-y-5">
              {form.students.map((s: any, i) => (
                <div key={i} className="space-y-4 p-6 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.05] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Users size={40} className="text-white" />
                  </div>

                  <div className="flex gap-2">
                    <input
                      placeholder={`Nombre del ${config.memberLabel.toLowerCase()}`}
                      value={s.name}
                      onChange={e => { const st = [...form.students]; st[i].name = e.target.value; setForm({ ...form, students: st }); if (errors.students) setErrors({ ...errors, students: "" }); }}
                      className="flex-1 h-12 bg-zinc-950/50 rounded-2xl px-5 text-sm text-white placeholder:text-zinc-700 border border-zinc-800 focus:border-amber-500/50 transition-all outline-none font-bold shadow-inner"
                    />
                    <select value={s.category}
                      onChange={e => { const st = [...form.students]; st[i].category = e.target.value; setForm({ ...form, students: st }); }}
                      className="h-12 bg-zinc-950/50 rounded-2xl px-3 text-[10px] font-black uppercase text-amber-500 border border-zinc-800 focus:border-amber-500/50 outline-none cursor-pointer">
                      {config.courseOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-zinc-900 text-white">{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col px-1">
                      <label className="text-[11px] uppercase tracking-[0.2em] font-black text-white/90">Fecha de Nacimiento</label>
                      <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mt-1">Día / Mes / Año</span>
                    </div>
                    <ModernDateInput value={s.birth_date} placeholder="DD / MM / AAAA"
                      onChange={(v: string) => { const st = [...form.students]; st[i].birth_date = v; setForm({ ...form, students: st }); }}
                      error={errors.students_birth}
                    />
                  </div>

                  {/* BJJ FIELDS */}
                  {config.showBJJGraduation && (
                    <div className="space-y-4">
                      {/* Paso 1: Cinturón */}
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">Selecciona Cinturón</label>
                        <div className="flex gap-1.5 h-10">
                          {BJJ_BELTS.map(belt => (
                            <button key={belt.id} type="button"
                              onClick={() => { const st = [...form.students]; st[i].belt = belt.id; setForm({ ...form, students: st }); }}
                              className={`flex-1 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden group/belt ${s.belt === belt.id ? 'border-amber-500 ring-4 ring-amber-500/20 scale-105 z-10 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-zinc-800 opacity-40 hover:opacity-100'}`}
                              style={{ backgroundColor: belt.color }}
                            >
                              <span className={`text-[9px] font-bold pointer-events-none z-10 ${belt.textColor} uppercase tracking-tighter`}>{belt.name}</span>
                              <div className={`absolute right-0 top-0 bottom-0 w-1/4 bg-zinc-950/90 pointer-events-none transition-all ${s.belt === belt.id ? 'w-1/3' : 'group-hover/belt:w-1/3'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Paso 2: Grados (Rayas) con Animación - SOLO SI HAY CINTURÓN SELECCIONADO */}
                      {s.belt && (
                        <div key={s.belt} className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-4 bg-zinc-950/40 p-5 rounded-[2rem] border border-zinc-800/50 shadow-inner">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white">Grados (Rayas)</label>
                              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Nivel de graduación</p>
                            </div>
                            <div className="flex gap-1.5">
                              {[0, 1, 2, 3, 4].map(deg => (
                                <button key={deg} type="button" 
                                  onClick={() => { const st = [...form.students]; st[i].degrees = deg; setForm({ ...form, students: st }); }}
                                  className={`w-8 h-8 rounded-full text-xs font-black transition-all flex items-center justify-center ${s.degrees === deg 
                                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] scale-110' 
                                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800 hover:border-zinc-700'}`}>
                                  {deg}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Paso 3: Modalidad - SOLO SI HAY GRADO SELECCIONADO */}
                      {s.degrees !== null && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in zoom-in duration-500 delay-150">
                          {[
                            { id: 'gi', label: '🥋 Gi' },
                            { id: 'nogi', label: '👕 No-Gi' },
                            { id: 'both', label: '⚡ Ambas' }
                          ].map(mod => (
                            <button key={mod.id} type="button"
                              onClick={() => { const st = [...form.students]; st[i].modality = mod.id; setForm({ ...form, students: st }); }}
                              className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${s.modality === mod.id 
                                ? 'bg-white text-black border-white shadow-xl' 
                                : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                            >
                              {mod.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {form.students.length > 1 && (
                    <div className="flex justify-end">
                      <button type="button"
                        onClick={() => setForm({ ...form, students: form.students.filter((_, idx) => idx !== i) })}
                        className="text-[9px] font-black uppercase text-red-400 hover:text-red-500 transition-colors flex items-center gap-1 active:scale-95">
                        Eliminar {config.memberLabel.toLowerCase()} ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {form.students.length === 0 && !form.is_self_register && (
              <div className="bg-zinc-900/20 rounded-[2.5rem] p-12 border border-dashed border-zinc-800 text-center space-y-3">
                <Users size={32} className="mx-auto text-zinc-800" />
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
                  Agrega al menos un {config.memberLabel.toLowerCase()}
                </p>
              </div>
            )}
          </div>

          {/* RESUMEN DE PRECIOS — solo industrias con pricing */}
          {config.showPricing && totals.totalInscriptions > 0 && (
            <div className="bg-zinc-900/40 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-zinc-800 space-y-5 shadow-2xl relative overflow-hidden group">
               <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
              <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Resumen de Inscripción</h3>
              <div className="space-y-3 text-sm">
                {totals.adultsCount > 0 && (
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="font-bold uppercase tracking-tighter">{totals.adultsCount}x ADULTO</span>
                    <span className="font-black text-white">${(totals.adultsCount * (pricing.adult || 0)).toLocaleString("es-CL")}</span>
                  </div>
                )}
                {totals.kidsCount > 0 && (
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="font-bold uppercase tracking-tighter">{totals.kidsCount}x KIDS</span>
                    <span className="font-black text-white">${(totals.kidsCount * (pricing.kids || 0)).toLocaleString("es-CL")}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-zinc-800/50 pt-5 flex items-end justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Total mensual</span>
                  {totals.hasDiscount && (
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter animate-pulse">
                      -{pricing.discountPercentage}% Familia Arica
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {totals.hasDiscount && (
                    <span className="text-xs text-zinc-600 line-through block tracking-tighter">${totals.subtotal.toLocaleString("es-CL")}</span>
                  )}
                  <span className="text-3xl font-black text-white tracking-tighter">${totals.total.toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-6">
            <button type="submit" disabled={submitting}
              className="w-full h-14 bg-white hover:bg-zinc-200 text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-30 group relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {submitting ? <Loader2 className="animate-spin text-zinc-900" size={20} /> : (
                <><span>Completar Inscripción</span><CheckCircle2 size={20} className="text-zinc-400" /></>
              )}
            </button>

            <p className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              ¿Ya tienes cuenta?{" "}
              <a href="/login" className="text-white hover:text-amber-500 transition-colors underline-offset-4 hover:underline">Iniciar sesión</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
