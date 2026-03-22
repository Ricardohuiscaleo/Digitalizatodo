"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getRegistrationPage, registerStudent } from "@/lib/api";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

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
    self_student: { category: "adults", belt: "white", degrees: 0, modality: "gi" },
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
    `w-full h-11 bg-zinc-50 rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 border transition-all focus:ring-2 ring-zinc-950 outline-none ${errors[field] ? "border-red-400" : "border-zinc-100 hover:border-zinc-200"}`;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  if (!tenant) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-zinc-400 text-sm">Página de registro no encontrada.</p>
    </div>
  );

  if (success) return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-white">
      <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
        <CheckCircle2 className="text-emerald-500" size={32} />
      </div>
      <h1 className="text-xl font-black text-zinc-900">¡Registro exitoso!</h1>
      <p className="text-sm text-zinc-500 mt-2">Bienvenido a <span className="font-semibold text-zinc-800">{tenant.name}</span></p>
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
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center shadow-sm">
            {tenant.logo
              ? <img src={tenant.logo} className="h-full w-full object-contain" />
              : <span className="text-xl font-black text-zinc-400">{tenant.name?.[0]}</span>
            }
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black text-zinc-900">Únete a {tenant.name}</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">Formulario de registro</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          {/* DATOS DEL APODERADO/TITULAR */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-widest font-black text-zinc-400">
              Datos del {config.guardianLabel}
            </label>
            <div className="space-y-2.5">
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
          <div className="space-y-4 pt-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-zinc-400">Crear Cuenta</label>
            <div className="space-y-2.5">
              {(["password", "password_confirmation"] as const).map((field, idx) => (
                <div key={field} className="relative">
                  {errors[field] && (
                    <div className="absolute -top-7 left-2 z-10">
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
                      className={`w-full h-11 bg-zinc-50 rounded-xl px-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-300 border transition-all focus:ring-2 ring-zinc-950 outline-none ${errors[field] ? "border-red-400" : "border-zinc-100 hover:border-zinc-200"}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOGGLE "YO TAMBIÉN PARTICIPO" — solo industrias que lo usan */}
          {config.showSelfRegister && (
            <div className={`rounded-2xl border transition-all ${form.is_self_register ? "bg-zinc-50 border-zinc-200 p-4" : "bg-zinc-50/50 border-zinc-100 p-3"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={form.is_self_register}
                    onChange={e => setForm({ ...form, is_self_register: e.target.checked })}
                    className="sr-only" />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.is_self_register ? "bg-zinc-950" : "bg-zinc-200"}`}></div>
                  <div className={`absolute left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_self_register ? "translate-x-4" : "translate-x-0"}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-zinc-900 uppercase">{config.selfRegisterLabel}</span>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase">
                    {form.is_self_register ? `Se te inscribirá como ${config.memberLabel.toLowerCase()}` : `Solo inscribirás a otros`}
                  </span>
                </div>
              </label>

              {form.is_self_register && config.showBJJGraduation && (
                <div className="mt-4 space-y-3 pt-4 border-t border-zinc-200 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Tu Graduación Persona</span>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(deg => (
                          <button key={deg} type="button" 
                            onClick={() => setForm({ ...form, self_student: { ...form.self_student, degrees: deg } })}
                            className={`w-5 h-5 rounded-md text-[9px] font-black transition-all ${form.self_student.degrees === deg ? 'bg-zinc-950 text-white shadow-md' : 'bg-white text-zinc-300 border border-zinc-100'}`}>
                            {deg}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5 h-8">
                      {BJJ_BELTS.map(belt => (
                        <button key={belt.id} type="button"
                          onClick={() => setForm({ ...form, self_student: { ...form.self_student, belt: belt.id } })}
                          className={`flex-1 rounded-lg border transition-all flex items-center justify-center relative overflow-hidden ${form.self_student.belt === belt.id ? 'border-zinc-950 ring-2 ring-zinc-950/5 scale-105 z-10' : 'border-zinc-100 opacity-40'}`}
                          style={{ backgroundColor: belt.color }}
                        >
                          <span className={`text-[9px] font-black pointer-events-none ${belt.textColor}`}>{belt.name}</span>
                          <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-zinc-950/90 pointer-events-none" />
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'gi', label: '🥋 Gi' },
                          { id: 'nogi', label: '👕 No-Gi' },
                          { id: 'both', label: '⚡ Ambas' }
                        ].map(mod => (
                          <button key={mod.id} type="button"
                            onClick={() => setForm({ ...form, self_student: { ...form.self_student, modality: mod.id } })}
                            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${form.self_student.modality === mod.id ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white text-zinc-400 border-zinc-100'}`}
                          >
                            {mod.label}
                          </button>
                        ))}
                      </div>
                </div>
              )}
            </div>
          )}

          {/* LISTA DE ALUMNOS/ESTUDIANTES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-widest font-black text-zinc-400">
                {config.showSelfRegister ? `Otros ${config.membersLabel.toLowerCase()} a inscribir` : `${config.membersLabel} a inscribir`}
              </label>
              <button type="button"
                onClick={() => setForm({ ...form, students: [...form.students, { name: "", category: config.courseOptions[0].value }] })}
                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors">
                + Agregar
              </button>
            </div>

            {errors.students && <p className="text-[9px] text-red-500 font-bold uppercase animate-pulse">{errors.students}</p>}

            <div className="space-y-4">
              {form.students.map((s: any, i) => (
                <div key={i} className="space-y-3 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl animate-in slide-in-from-right-2 duration-200">
                  <div className="flex gap-2">
                    <input
                      placeholder={`Nombre del ${config.memberLabel.toLowerCase()}`}
                      value={s.name}
                      onChange={e => { const st = [...form.students]; st[i].name = e.target.value; setForm({ ...form, students: st }); if (errors.students) setErrors({ ...errors, students: "" }); }}
                      className="flex-1 h-11 bg-white rounded-xl px-4 text-sm text-zinc-900 placeholder:text-zinc-300 border border-zinc-100 focus:border-zinc-950 transition-all outline-none font-bold"
                    />
                    <select value={s.category}
                      onChange={e => { const st = [...form.students]; st[i].category = e.target.value; setForm({ ...form, students: st }); }}
                      className="h-11 bg-white rounded-xl px-3 text-[10px] font-black uppercase text-zinc-600 border border-zinc-100 focus:border-zinc-950 outline-none">
                      {config.courseOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* BJJ FIELDS */}
                  {config.showBJJGraduation && (
                    <div className="space-y-3 p-3 bg-white/50 rounded-xl border border-zinc-100/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Cinturón & Grados</span>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3, 4].map(deg => (
                            <button key={deg} type="button" 
                              onClick={() => { const st = [...form.students]; st[i].degrees = deg; setForm({ ...form, students: st }); }}
                              className={`w-5 h-5 rounded-md text-[9px] font-black transition-all ${s.degrees === deg ? 'bg-zinc-950 text-white shadow-md' : 'bg-white text-zinc-300 border border-zinc-100'}`}>
                              {deg}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 h-8">
                        {BJJ_BELTS.map(belt => (
                          <button key={belt.id} type="button"
                            onClick={() => { const st = [...form.students]; st[i].belt = belt.id; setForm({ ...form, students: st }); }}
                            className={`flex-1 rounded-lg border transition-all flex items-center justify-center relative overflow-hidden ${s.belt === belt.id ? 'border-zinc-950 ring-2 ring-zinc-950/5 scale-105 z-10' : 'border-zinc-100 opacity-40 hover:opacity-100'}`}
                            style={{ backgroundColor: belt.color }}
                          >
                            <span className={`text-[9px] font-black pointer-events-none ${belt.textColor}`}>{belt.name}</span>
                            <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-zinc-950/90 pointer-events-none" />
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'gi', label: '🥋 Gi' },
                          { id: 'nogi', label: '👕 No-Gi' },
                          { id: 'both', label: '⚡ Ambas' }
                        ].map(mod => (
                          <button key={mod.id} type="button"
                            onClick={() => { const st = [...form.students]; st[i].modality = mod.id; setForm({ ...form, students: st }); }}
                            className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${s.modality === mod.id ? 'bg-zinc-950 text-white border-zinc-950 shadow-sm' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}
                          >
                            {mod.label}
                          </button>
                        ))}
                      </div>
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
              <div className="bg-zinc-50 rounded-xl p-6 border border-dashed border-zinc-200 text-center">
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                  Agrega al menos un {config.memberLabel.toLowerCase()}
                </p>
              </div>
            )}
          </div>

          {/* RESUMEN DE PRECIOS — solo industrias con pricing */}
          {config.showPricing && totals.totalInscriptions > 0 && (
            <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200 space-y-3">
              <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Resumen de Inscripción</h3>
              <div className="space-y-1 text-sm">
                {totals.adultsCount > 0 && (
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>{totals.adultsCount}x Adulto</span>
                    <span className="font-medium">${(totals.adultsCount * (pricing.adult || 0)).toLocaleString("es-CL")}</span>
                  </div>
                )}
                {totals.kidsCount > 0 && (
                  <div className="flex justify-between items-center text-zinc-600">
                    <span>{totals.kidsCount}x Kids</span>
                    <span className="font-medium">${(totals.kidsCount * (pricing.kids || 0)).toLocaleString("es-CL")}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-zinc-200 pt-3 flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-zinc-900 font-bold">Total mensual</span>
                  {totals.hasDiscount && (
                    <span className="text-[10px] font-black text-emerald-500 uppercase">
                      ¡{pricing.discountPercentage}% Descuento Familiar!
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {totals.hasDiscount && (
                    <span className="text-xs text-zinc-400 line-through block">${totals.subtotal.toLocaleString("es-CL")}</span>
                  )}
                  <span className="text-xl font-black text-zinc-900">${totals.total.toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-zinc-200 disabled:opacity-40">
            {submitting ? <Loader2 className="animate-spin text-zinc-400" size={18} /> : (
              <><span>Completar Inscripción</span><CheckCircle2 size={18} className="opacity-40" /></>
            )}
          </button>

          <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-zinc-950 hover:underline">Iniciar sesión</a>
          </p>
        </form>
      </div>
    </div>
  );
}
