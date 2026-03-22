"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getRegistrationPage, registerStudent } from "@/lib/api";
import { Loader2, CheckCircle2, Eye, EyeOff, Users, Calendar, RefreshCw, Sun, Moon } from "lucide-react";

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

const ModernDateInput = ({ value, onChange, placeholder, error, isDarkMode }: any) => {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const isDeleting = input.length < (value?.length || 0);

    if (isDeleting) {
      onChange(input);
      return;
    }

    let digits = input.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length >= 2) formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    if (digits.length >= 4) formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
    onChange(formatted);
  };

  return (
    <div className="relative group/date">
      <input type="text" value={value} onChange={handleValueChange} placeholder={placeholder} inputMode="numeric" maxLength={14}
        className={`w-full h-14 rounded-[1.2rem] px-6 text-base border transition-all outline-none font-black tracking-widest ${isDarkMode 
          ? "bg-zinc-900/40 text-white border-zinc-800 focus:border-amber-500 placeholder:text-zinc-800" 
          : "bg-white text-zinc-900 border-zinc-200 focus:border-amber-500 placeholder:text-zinc-300 shadow-sm"} 
          ${error ? "border-red-500/50 text-red-500" : ""}`}
      />
      <Calendar size={18} className={`absolute right-5 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-500/50" : isDarkMode ? "text-zinc-700" : "text-zinc-300"} group-focus-within/date:text-amber-500`} />
    </div>
  );
};

export default function RegisterPage() {
  const { code } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    guardian_name: "", guardian_email: "", guardian_phone: "+56 ",
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
  
  const today = new Date();
  const todayPlaceholder = `${String(today.getDate()).padStart(2, '0')} / ${String(today.getMonth() + 1).padStart(2, '0')} / ${today.getFullYear()}`;

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
  const guardianNameParts = form.guardian_name.trim().split(/\s+/).filter(p => p.length > 0);
  const isGuardianNameComplete = guardianNameParts.length >= 2;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const isDeleting = input.length < form.guardian_phone.length;

    // Proteccion de prefijo +56
    if (!input.startsWith('+56')) {
      setForm({ ...form, guardian_phone: '+56 ' });
      return;
    }
    if (input.length < 4) {
      setForm({ ...form, guardian_phone: '+56 ' });
      return;
    }

    if (isDeleting) {
      setForm({ ...form, guardian_phone: input });
      return;
    }

    let raw = input.slice(4).replace(/\D/g, '').slice(0, 9);
    let formatted = "+56";
    if (raw.length > 0) {
      formatted += " " + raw.substring(0, 1); // 9
      if (raw.length > 1) {
        formatted += " " + raw.substring(1, 5); // XXXX
        if (raw.length > 5) {
          formatted += " " + raw.substring(5, 7); // XX
          if (raw.length > 7) {
            formatted += " " + raw.substring(7, 9); // XX
          }
        }
      }
    } else {
      formatted += " ";
    }
    setForm({ ...form, guardian_phone: formatted });
  };

  const inputClass = (field: string) => {
    const base = "w-full h-12 rounded-2xl px-5 text-sm transition-all outline-none font-bold border";
    const theme = isDarkMode 
      ? "bg-zinc-900/50 text-white placeholder:text-zinc-700 border-zinc-800 focus:border-amber-500/50" 
      : "bg-white text-zinc-900 border-zinc-200 focus:border-amber-500 shadow-sm placeholder:text-zinc-300";
    const error = errors[field] ? "border-red-500/50" : "";
    return `${base} ${theme} ${error}`;
  };

  if (loading) return (
    <div className={`flex min-h-screen items-center justify-center transition-colors duration-700 ${isDarkMode ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
      <Loader2 className={`animate-spin ${isDarkMode ? 'text-zinc-800' : 'text-zinc-300'}`} size={32} />
    </div>
  );

  if (!tenant) return (
    <div className={`flex min-h-screen items-center justify-center transition-colors duration-700 ${isDarkMode ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
      <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Página de registro no encontrada</p>
    </div>
  );

  if (success) return (
    <div className={`flex min-h-screen flex-col items-center justify-center p-6 text-center transition-colors duration-700 ${isDarkMode ? 'bg-[#09090b]' : 'bg-zinc-50'}`}>
      <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
        <CheckCircle2 className="text-emerald-500" size={40} />
      </div>
      <h1 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-black'}`}>¡Registro exitoso!</h1>
      <p className="text-sm text-zinc-500 mt-3 font-bold">Bienvenido a <span className="text-amber-500">{tenant.name}</span></p>
      <a href="/login" className={`mt-10 h-14 px-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-xl text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white hover:bg-zinc-800'}`}>
        Ir al login
      </a>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center px-2 py-6 sm:p-6 pb-2 selection:bg-amber-500 selection:text-black transition-colors duration-700 ${isDarkMode ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
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
          <div className="text-center space-y-2">
            <h1 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Únete a {tenant.name}</h1>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Formulario de registro</p>
              
              {/* THEME TOGGLE — ULTRA MINIMALIST */}
              <button type="button" onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 hover:bg-zinc-500/10 ${isDarkMode ? 'text-zinc-700 hover:text-amber-500' : 'text-zinc-300 hover:text-amber-600'}`}>
                <div className="relative w-3.5 h-3.5 overflow-hidden">
                  <div className={`absolute inset-0 transition-all duration-500 ${isDarkMode ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                    <Moon size={14} />
                  </div>
                  <div className={`absolute inset-0 transition-all duration-500 ${isDarkMode ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
                    <Sun size={14} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          {/* DATOS DEL APODERADO/TITULAR */}
          <div className={`space-y-5 p-6 rounded-[2.5rem] border backdrop-blur-sm transition-all duration-700 ${isDarkMode ? "bg-zinc-900/30 border-zinc-800/50" : "bg-white border-zinc-200 shadow-sm"}`}>
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-amber-500" />
              Datos del {config.guardianLabel}
            </label>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="relative">
                  <input placeholder="Nombre completo" value={form.guardian_name}
                    onChange={e => { setForm({ ...form, guardian_name: e.target.value }); if (errors.guardian_name) setErrors({ ...errors, guardian_name: "" }); }}
                    className={inputClass("guardian_name")} />
                  {errors.guardian_name && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_name}</span>}
                </div>
                {form.guardian_name.trim().length > 0 && (
                  <div className="flex flex-wrap gap-2 px-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    {guardianNameParts.map((part, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">{part}</span>
                        <span className="text-[7px] font-bold uppercase text-zinc-600">
                          {idx === 0 ? "Nombre" : idx === 1 ? "Apel. Paterno" : "Apel. Materno"}
                        </span>
                      </div>
                    ))}
                    {guardianNameParts.length < 3 && (
                      <span className="text-[9px] font-black uppercase text-zinc-500/40 tracking-widest self-center ml-auto italic pt-1">
                        {guardianNameParts.length === 1 ? "(Faltan tus apellidos)" : "(Falta tu 2do apellido)"}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="relative">
                <input type="email" placeholder="Correo electrónico" value={form.guardian_email}
                  onChange={e => { setForm({ ...form, guardian_email: e.target.value }); if (errors.guardian_email) setErrors({ ...errors, guardian_email: "" }); }}
                  className={inputClass("guardian_email")} />
                {errors.guardian_email && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_email}</span>}
              </div>
              <div className="relative">
                <input type="tel" placeholder="Teléfono" value={form.guardian_phone}
                  onChange={handlePhoneChange}
                  className={inputClass("guardian_phone")} />
                {errors.guardian_phone && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_phone}</span>}
              </div>
            </div>
          </div>


          {/* TOGGLE "YO TAMBIÉN PARTICIPO" — blue card premium */}
          {config.showSelfRegister && isGuardianNameComplete && (
            <div className={`rounded-[2.5rem] border transition-all duration-500 relative animate-in zoom-in fade-in duration-700 overflow-hidden ${form.is_self_register 
              ? (isDarkMode ? "bg-blue-900/10 border-blue-500/50 p-6 shadow-[0_0_50px_rgba(37,99,235,0.1)] scale-[1.02]" : "bg-blue-50 border-blue-300 p-6 shadow-xl scale-[1.02]") 
              : (isDarkMode ? "bg-blue-900/5 border-blue-900/30 p-4" : "bg-blue-50/50 border-blue-100 p-4")}`}>
              {form.is_self_register && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
              )}
              <label className="flex items-center gap-4 cursor-pointer relative z-10">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={form.is_self_register}
                    onChange={e => setForm({ ...form, is_self_register: e.target.checked })}
                    className="sr-only" />
                  <div className={`w-12 h-7 rounded-full transition-colors border ${form.is_self_register ? "bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]" : (isDarkMode ? "bg-zinc-800 border-zinc-700" : "bg-zinc-200 border-zinc-300")}`}></div>
                  <div className={`absolute left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${form.is_self_register ? "translate-x-5" : "translate-x-0"}`}></div>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
                    YO, {guardianNameParts[0]} TAMBIÉN ENTRENARÉ
                  </span>
                </div>
              </label>

              {form.is_self_register && config.showBJJGraduation && (
                <div className="mt-8 space-y-6 pt-8 border-t border-zinc-800 animate-in fade-in zoom-in duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col">
                        <label className={`text-[11px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-white/90' : 'text-zinc-800'}`}>Tu Fecha de Nacimiento</label>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mt-1">Día / Mes / Año</span>
                      </div>
                      <div className="relative flex items-center group/cat">
                        <select value={form.self_student.category}
                          onChange={e => setForm({ ...form, self_student: { ...form.self_student, category: e.target.value } })}
                          className={`h-8 w-24 rounded-xl px-2 pr-7 text-center text-[9px] font-black uppercase text-amber-500 border outline-none cursor-pointer transition-all appearance-none ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900' : 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm'}`}>
                          {config.courseOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className={isDarkMode ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"}>{opt.label}</option>
                          ))}
                        </select>
                        <RefreshCw size={10} className={`absolute right-2 pointer-events-none transition-colors ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'} group-focus-within/cat:text-amber-500 group-hover/cat:text-amber-500`} />
                      </div>
                    </div>
                    <ModernDateInput value={form.self_student.birth_date} placeholder={todayPlaceholder} isDarkMode={isDarkMode}
                      onChange={(v: string) => setForm({ ...form, self_student: { ...form.self_student, birth_date: v } })}
                      error={errors.self_birth}
                    />
                  </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 px-1">Tu Cinturón actual</label>
                      <div className="flex gap-1.5 h-10">
                        {BJJ_BELTS.map(belt => (
                          <button key={belt.id} type="button"
                            onClick={() => setForm({ ...form, self_student: { ...form.self_student, belt: belt.id } })}
                            className={`flex-1 rounded-2xl border transition-all flex items-center justify-center relative overflow-hidden group/belt ${form.self_student.belt === belt.id ? 'border-amber-500 z-10' : (isDarkMode ? 'border-zinc-800 opacity-40 hover:opacity-100' : 'border-zinc-200 opacity-60 hover:opacity-100')}`}
                            style={{ backgroundColor: belt.color }}
                          >
                            <span className={`text-[9px] font-bold pointer-events-none z-10 ${belt.textColor} uppercase tracking-tighter`}>{belt.name}</span>
                            <div className={`absolute right-0 top-0 bottom-0 w-1/4 bg-zinc-950/90 pointer-events-none transition-all ${form.self_student.belt === belt.id ? 'w-1/3' : 'group-hover/belt:w-1/3'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.self_student.belt && (
                      <div className={`animate-in fade-in slide-in-from-top-4 duration-700 space-y-3 p-3 rounded-[1.5rem] border shadow-inner flex flex-col items-center text-center ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-white border-zinc-100 shadow-sm'}`}>
                        <label className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-white/80' : 'text-zinc-800'}`}>Grados (Rayas)</label>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4].map(deg => (
                            <button key={deg} type="button" 
                              onClick={() => setForm({ ...form, self_student: { ...form.self_student, degrees: deg } })}
                              className={`w-8 h-8 rounded-full text-[10px] font-black transition-all flex items-center justify-center ${form.self_student.degrees === deg 
                                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-110' 
                                : (isDarkMode ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 hover:border-zinc-700' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:border-zinc-300')}`}>
                              {deg}
                            </button>
                          ))}
                        </div>
                        <p className="text-[7.5px] text-zinc-600 font-bold uppercase tracking-widest">Nivel de graduación</p>
                      </div>
                    )}

                  {form.self_student.degrees !== null && (
                    <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      {[
                        { id: 'gi', label: '🥋 Gi' },
                        { id: 'nogi', label: '👕 No-Gi' },
                        { id: 'both', label: '⚡ Ambas' }
                      ].map(mod => (
                        <button key={mod.id} type="button"
                          onClick={() => setForm({ ...form, self_student: { ...form.self_student, modality: mod.id } })}
                          className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${form.self_student.modality === mod.id 
                            ? (isDarkMode ? 'bg-white text-black border-white shadow-xl' : 'bg-black text-white border-black shadow-lg') 
                            : (isDarkMode ? 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-100 text-zinc-400 border-zinc-200 hover:border-zinc-300')}`}
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
            <style jsx>{`
              @keyframes spin360 {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes spinInverse360 {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(-360deg); }
              }
              .animate-spin-360 {
                animation: spin360 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
              }
              .animate-spin-inverse {
                animation: spinInverse360 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
              }
            `}</style>
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">
                {config.showSelfRegister ? `Otros ${config.membersLabel.toLowerCase()}` : `${config.membersLabel} a inscribir`}
              </label>
              <button type="button"
                onClick={() => setForm({ ...form, students: [...form.students, { name: "", category: config.courseOptions[0].value, belt: "", degrees: null as number | null, modality: "gi", birth_date: "" }] })}
                className="group flex items-center gap-2.5 transition-all active:scale-95">
                <div className="relative">
                  <div key={form.students.length} className={`w-6 h-6 rounded-full flex items-center justify-center border animate-spin-360 ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-500/5 border-amber-200'}`}>
                    <span className="text-amber-500 font-black text-sm">+</span>
                  </div>
                  {form.students.length > 0 && (
                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2 animate-in zoom-in duration-300 ${isDarkMode ? 'bg-amber-500 text-zinc-950 border-zinc-950' : 'bg-black text-white border-white shadow-sm'}`}>
                      <span className="text-[8px] font-black">{form.students.length}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-amber-500' : 'text-zinc-600 group-hover:text-amber-600'}`}>Agregar {config.memberLabel}</span>
              </button>
            </div>

            {errors.students && <p className="text-[10px] text-red-400 font-bold uppercase animate-pulse px-2">{errors.students}</p>}

            <div className="space-y-5">
              {form.students.map((s: any, i) => (
                <div key={i} className={`space-y-6 p-6 rounded-[2.5rem] border animate-in slide-in-from-bottom-4 duration-500 relative overflow-hidden group transition-all duration-700 ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>

                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        placeholder={`Nombre completo del ${config.memberLabel.toLowerCase()}`}
                        value={s.name}
                        onChange={e => { const st = [...form.students]; st[i].name = e.target.value; setForm({ ...form, students: st }); if (errors.students) setErrors({ ...errors, students: "" }); }}
                        className={inputClass(`student_name_${i}`)}
                      />
                    </div>
                    {s.name.trim().length > 0 && (
                      <div className="flex flex-wrap gap-2 px-3 animate-in fade-in slide-in-from-top-1 duration-300">
                        {s.name.trim().split(/\s+/).filter((p: string) => p.length > 0).map((part: string, idx: number) => (
                          <div key={idx} className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest leading-tight">{part}</span>
                            <span className="text-[7px] font-bold uppercase text-zinc-600 leading-tight">
                              {idx === 0 ? "Nombre" : idx === 1 ? "Apel. Paterno" : "Apel. Materno"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className={`text-[11px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-white/90' : 'text-zinc-800'}`}>Fecha Nacimiento</label>
                      <div className="relative flex items-center group/cat">
                        <select value={s.category}
                          onChange={e => { const st = [...form.students]; st[i].category = e.target.value; setForm({ ...form, students: st }); }}
                          className={`h-8 w-24 rounded-xl px-2 pr-7 text-center text-[9px] font-black uppercase text-amber-500 border outline-none cursor-pointer transition-all appearance-none ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900' : 'bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm'}`}>
                          {config.courseOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className={isDarkMode ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"}>{opt.label}</option>
                          ))}
                        </select>
                        <RefreshCw size={10} className={`absolute right-2 pointer-events-none transition-colors ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'} group-focus-within/cat:text-amber-500 group-hover/cat:text-amber-500`} />
                      </div>
                    </div>
                    <ModernDateInput value={s.birth_date} placeholder={todayPlaceholder} isDarkMode={isDarkMode}
                      onChange={(v: string) => { const st = [...form.students]; st[i].birth_date = v; setForm({ ...form, students: st }); }}
                      error={errors.students_birth}
                    />
                  </div>

                  {/* BJJ FIELDS */}
                  {config.showBJJGraduation && (
                    <div className="space-y-4">
                      {/* Paso 1: Cinturón */}
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 px-1">Selecciona Cinturón</label>
                        <div className="flex gap-1.5 h-10">
                          {BJJ_BELTS.map(belt => (
                            <button key={belt.id} type="button"
                              onClick={() => { const st = [...form.students]; st[i].belt = belt.id; setForm({ ...form, students: st }); }}
                              className={`flex-1 rounded-2xl border transition-all flex items-center justify-center relative overflow-hidden group/belt ${s.belt === belt.id ? 'border-amber-500 z-10' : (isDarkMode ? 'border-zinc-800 opacity-40 hover:opacity-100' : 'border-zinc-200 opacity-60 hover:opacity-100')}`}
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
                        <div className={`animate-in fade-in slide-in-from-top-4 duration-700 space-y-3 p-3 rounded-[1.5rem] border shadow-inner flex flex-col items-center text-center ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-white border-zinc-100 shadow-sm'}`}>
                          {/* Fila 1: Label */}
                          <label className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-white/80' : 'text-zinc-800'}`}>Grados (Rayas)</label>
                          
                          {/* Fila 2: Selector */}
                          <div className="flex gap-2">
                            {[0, 1, 2, 3, 4].map(deg => (
                              <button key={deg} type="button" 
                                onClick={() => { const st = [...form.students]; st[i].degrees = deg; setForm({ ...form, students: st }); }}
                                className={`w-8 h-8 rounded-full text-[10px] font-black transition-all flex items-center justify-center ${s.degrees === deg 
                                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-110' 
                                  : (isDarkMode ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 hover:border-zinc-700' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:border-zinc-300')}`}>
                                {deg}
                              </button>
                            ))}
                          </div>

                          {/* Fila 3: Subtítulo */}
                          <p className="text-[7.5px] text-zinc-600 font-bold uppercase tracking-widest">Nivel de graduación</p>
                        </div>
                      )}
                      
                      {/* Paso 3: Modalidad - SOLO SI HAY GRADO SELECCIONADO */}
                      {s.degrees !== null && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          {[
                            { id: 'gi', label: '🥋 Gi' },
                            { id: 'nogi', label: '👕 No-Gi' },
                            { id: 'both', label: '⚡ Ambas' }
                          ].map(mod => (
                            <button key={mod.id} type="button"
                              onClick={() => { const st = [...form.students]; st[i].modality = mod.id; setForm({ ...form, students: st }); }}
                              className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${s.modality === mod.id 
                                ? (isDarkMode ? 'bg-white text-black border-white shadow-xl' : 'bg-black text-white border-black shadow-lg') 
                                : (isDarkMode ? 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-100 text-zinc-400 border-zinc-200 hover:border-zinc-300')}`}
                            >
                              {mod.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button type="button"
                      onClick={() => setForm({ ...form, students: form.students.filter((_, idx) => idx !== i) })}
                      className="text-[9px] font-black uppercase text-red-400 hover:text-red-500 transition-colors flex items-center gap-1 active:scale-95 group/del">
                      Eliminar {config.memberLabel.toLowerCase()} <span key={form.students.length} className="inline-block animate-spin-inverse text-xs">×</span>
                    </button>
                  </div>
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
            <div className={`backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border space-y-5 shadow-2xl relative overflow-hidden group transition-all duration-700 ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
               <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl" />
              <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Resumen de Inscripción</h3>
              <div className="space-y-3 text-sm">
                {totals.adultsCount > 0 && (
                  <div className={`flex justify-between items-center transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    <span className="font-bold uppercase tracking-tighter">{totals.adultsCount}x ADULTO</span>
                    <span className={`font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>${(totals.adultsCount * (pricing.adult || 0)).toLocaleString("es-CL")}</span>
                  </div>
                )}
                {totals.kidsCount > 0 && (
                  <div className={`flex justify-between items-center transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    <span className="font-bold uppercase tracking-tighter">{totals.kidsCount}x KIDS</span>
                    <span className={`font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>${(totals.kidsCount * (pricing.kids || 0)).toLocaleString("es-CL")}</span>
                  </div>
                )}
              </div>
              <div className={`border-t pt-5 flex items-end justify-between relative z-10 ${isDarkMode ? 'border-zinc-800/50' : 'border-zinc-100'}`}>
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
                  <span className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>${totals.total.toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>
          )}
          {/* CONTRASEÑA — al final como paso previo al envío */}
          <div className={`space-y-5 p-6 rounded-[2.5rem] border backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 transition-all duration-700 ${isDarkMode ? "bg-zinc-900/30 border-zinc-800/50" : "bg-white border-zinc-200 shadow-sm"}`}>
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
                      className={`w-full h-12 rounded-2xl px-5 pr-11 text-sm border transition-all outline-none font-bold ${isDarkMode ? "bg-zinc-950/50 text-white placeholder:text-zinc-700 border-zinc-800 focus:border-indigo-500/50 shadow-inner" : "bg-zinc-50 text-zinc-900 border-zinc-200 focus:border-indigo-500 shadow-sm placeholder:text-zinc-300"}`}
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

          <div className="space-y-4 pt-6">
            <button type="submit" disabled={submitting}
              className={`w-full h-14 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-30 group relative overflow-hidden ${isDarkMode ? 'bg-white hover:bg-zinc-200 text-black' : 'bg-black hover:bg-zinc-800 text-white shadow-xl shadow-black/10'}`}>
               <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {submitting ? <Loader2 className={`animate-spin ${isDarkMode ? 'text-zinc-900' : 'text-zinc-200'}`} size={20} /> : (
                <><span>Completar Inscripción</span><CheckCircle2 size={20} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} /></>
              )}
            </button>

            <div className="flex flex-col items-center">
              <p className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                ¿Ya tienes cuenta?{" "}
                <a href="/login" className={`transition-colors underline-offset-4 hover:underline ${isDarkMode ? 'text-white hover:text-amber-500' : 'text-black hover:text-amber-600'}`}>Iniciar sesión</a>
              </p>
            </div>
          </div>
        </form>

        <footer className="mt-20 pb-12 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="flex flex-col items-center gap-1.5">
            <h3 className={`text-[11px] font-black uppercase tracking-[0.4em] transition-colors ${isDarkMode ? 'text-zinc-400' : 'text-zinc-800'}`}>
              DIGITALIZA TODO
            </h3>
            <p className={`text-[8px] font-black uppercase tracking-[0.2em] leading-tight transition-colors ${isDarkMode ? 'text-zinc-600/60' : 'text-zinc-400'}`}>
              Somos una empresa de desarrollo de software a la medida
            </p>
          </div>
          
          <a href="https://digitaliza.todo" target="_blank" rel="noopener noreferrer" 
            className="group flex flex-col items-center gap-1 transition-all active:scale-95">
            <span className={`text-[8px] font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-600 group-hover:text-zinc-500' : 'text-zinc-400 group-hover:text-zinc-500'}`}>¿Necesitas nuestros servicios?</span>
            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-zinc-700 group-hover:text-amber-500 transition-all border-b border-white/0 group-hover:border-amber-500/30 pb-0.5">
              Haz click aquí
            </span>
          </a>

          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800 pt-2 flex items-center justify-center gap-2">
            <div className="w-4 h-[1px] bg-zinc-900" />
            DIGITALIZANDO EN ARICA, CHILE 🇨🇱
            <div className="w-4 h-[1px] bg-zinc-900" />
          </p>
        </footer>
      </div>
    </div>
  );
}
