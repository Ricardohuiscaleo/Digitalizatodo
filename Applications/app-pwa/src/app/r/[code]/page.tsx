"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRegistrationPage, registerStudent } from "@/lib/api";
import {
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Users,
  Calendar,
  RefreshCw,
  Sun,
  Moon,
  Star,
  Check,
  Info,
  ShieldCheck,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  AlertCircle,
  Award,
  Zap,
  Plus,
  Sparkles
} from "lucide-react";

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

const validateName = (name: string) => name.trim().split(/\s+/).filter(part => part.length > 0).length >= 3;
const validateEmail = (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && !email.includes('..');
const validatePhone = (phone: string) => phone.replace(/\D/g, '').length === 11;

const ValidationIcon = ({ isValid, value }: { isValid: boolean, value: string }) => {
  if (!value || value.trim() === "" || value === "+56 ") return null;
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 flex items-center justify-center">
      {isValid ? (
        <CheckCircle2 key="valid" size={16} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-in zoom-in-95 duration-500" />
      ) : (
        <AlertCircle key="invalid" size={16} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-in zoom-in-95 duration-500" />
      )}
    </div>
  );
};

const isValidDate = (formatted: string) => {
  if (formatted.length !== 14) return false;
  const digits = formatted.replace(/\D/g, '');
  const dd = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const yyyy = parseInt(digits.slice(4, 8), 10);
  const now = new Date();
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  if (yyyy < now.getFullYear() - 122 || yyyy > now.getFullYear()) return false;
  const date = new Date(yyyy, mm - 1, dd);
  return date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd;
};

const ModernDateInput = ({ value, onChange, placeholder, error, isDarkMode }: any) => {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const isDeleting = input.length < (value?.length || 0);

    if (isDeleting) {
      onChange(input);
      return;
    }

    let digits = input.replace(/\D/g, '');
    // Clamp día
    if (digits.length >= 1 && parseInt(digits[0], 10) > 3) digits = '0' + digits;
    if (digits.length >= 2) {
      const dd = parseInt(digits.slice(0, 2), 10);
      if (dd > 31) digits = '31' + digits.slice(2);
      if (dd < 1 && digits.length === 2) digits = '01' + digits.slice(2);
    }
    // Clamp mes
    if (digits.length >= 3 && parseInt(digits[2], 10) > 1) digits = digits.slice(0, 2) + '0' + digits.slice(2);
    if (digits.length >= 4) {
      const mm = parseInt(digits.slice(2, 4), 10);
      if (mm > 12) digits = digits.slice(0, 2) + '12' + digits.slice(4);
      if (mm < 1 && digits.length === 4) digits = digits.slice(0, 2) + '01' + digits.slice(4);
    }
    // Clamp año
    if (digits.length === 8) {
      const yyyy = parseInt(digits.slice(4, 8), 10);
      const nowY = new Date().getFullYear();
      if (yyyy > nowY) digits = digits.slice(0, 4) + String(nowY);
      if (yyyy < nowY - 122) digits = digits.slice(0, 4) + String(nowY - 122);
    }
    digits = digits.slice(0, 8);
    let formatted = digits;
    if (digits.length >= 2) formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    if (digits.length >= 4) formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`;
    onChange(formatted);
  };

  const valid = isValidDate(value || '');
  const complete = (value || '').length === 14;

  return (
    <div className="relative group/date">
      <input type="text" value={value} onChange={handleValueChange} placeholder={placeholder} inputMode="numeric" maxLength={14}
        className={`w-full h-14 rounded-[1.2rem] px-6 text-base border transition-all outline-none font-black tracking-widest ${isDarkMode
          ? "bg-zinc-900/40 text-white border-zinc-800 focus:border-[#c9a84c] placeholder:text-zinc-800"
          : "bg-white text-zinc-900 border-zinc-200 focus:border-[#c9a84c] placeholder:text-zinc-300 shadow-sm"} 
          ${error ? "border-red-500/50 text-red-500" : ""}`}
      />
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {(value && value.length > 0) && (
          <div key={complete && valid ? 'ok' : 'err'}>
            {complete && valid ? (
              <CheckCircle2 size={14} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-in zoom-in duration-300" />
            ) : (
              <AlertCircle size={14} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-in zoom-in duration-300" />
            )}
          </div>
        )}
        <Calendar size={18} className={`transition-colors ${error ? "text-red-500/50" : isDarkMode ? "text-zinc-700" : "text-zinc-300"} group-focus-within/date:text-[#c9a84c]`} />
      </div>
    </div>
  );
};

const ALLIANCE_BJJ_GRADUATION = [
  {
    id: 'Blanco',
    name: 'Blanco',
    level: 'Nivel fundamentos',
    totalClasses: 150,
    classesPerStripe: 30,
    stripes: 4,
    ibjjfMinYears: null,
    color: '#ffffff',
    textColor: 'text-zinc-400',
  },
  {
    id: 'Azul',
    name: 'Azul',
    level: 'Nivel intermedio bajo',
    totalClasses: 325,
    classesPerStripe: 65,
    stripes: 4,
    ibjjfMinYears: null,
    color: '#1e40af',
    textColor: 'text-blue-100',
  },
  {
    id: 'Morado',
    name: 'Morado',
    level: 'Nivel intermedio avanzado',
    totalClasses: 375,
    classesPerStripe: 75,
    stripes: 4,
    ibjjfMinYears: 2,
    color: '#7e22ce',
    textColor: 'text-purple-100',
  },
  {
    id: 'Marrón',
    name: 'Marrón',
    level: 'Nivel avanzado',
    totalClasses: 375,
    classesPerStripe: 75,
    stripes: 4,
    ibjjfMinYears: 1.5,
    color: '#78350f',
    textColor: 'text-amber-100',
  },
  {
    id: 'Negro',
    name: 'Negro',
    level: 'Maestría',
    totalClasses: null,
    classesPerStripe: null,
    stripes: null,
    ibjjfMinYears: 1.5,
    color: '#18181b',
    textColor: 'text-zinc-100',
  },
];

const RegistrationProgress = ({ form, canShowPlans, isDarkMode }: any) => {
  const steps = [
    { id: 1, label: 'Identidad', done: true },
    { id: 2, label: 'Participantes', done: !!(form.guardian_name && form.guardian_email) },
    { id: 3, label: 'Horarios', done: canShowPlans },
    { id: 4, label: 'Pago', done: !!(form.plan_id || form.adult_plan_id || form.kid_plan_id) }
  ];

  const currentStep = steps.reduce((acc, s) => s.done ? s.id : acc, 0);
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-[300] transition-all duration-700 translate-y-0 opacity-100">
      <div className={`absolute inset-0 backdrop-blur-xl border-b transition-colors duration-700 ${isDarkMode ? 'bg-black/60 border-zinc-800/50' : 'bg-white/80 border-zinc-200'}`} />
      <div className="max-w-md mx-auto px-6 py-3 relative">
        <div className="flex justify-between items-center mb-2">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${s.done ? 'bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.5)]' : (isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200')}`} />
              <span className={`text-[7px] font-black uppercase tracking-widest transition-colors duration-500 ${s.done ? (isDarkMode ? 'text-white' : 'text-zinc-900') : 'text-zinc-600'}`}>{s.label}</span>
            </div>
          ))}
        </div>
        <div className={`h-1 w-full rounded-full overflow-hidden relative ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}>
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#c9a84c] to-[#f59e0b] shadow-[0_0_15px_rgba(201,168,76,0.4)] transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const PlanCard = ({ plan, isSelected, onSelect, isDarkMode, monthlyBase = 0 }: any) => {
  const price = parseFloat(plan.price);
  const isVip = plan.category === 'vip';
  
  const durMonths = (function() {
    switch(plan.billing_cycle) {
      case 'quarterly': return 3;
      case 'semi_annual': return 6;
      case 'annual': return 12;
      default: return 1;
    }
  })();

  // Logic for duration label (Poster alignment)
  const durLabel = (function() {
    if (isVip) {
      if (plan.name.toLowerCase().includes('pack 4')) return '4 CLASES';
      if (plan.name.toLowerCase().includes('clase')) return '1 CLASE';
      return 'SESIÓN';
    }
    return `${durMonths} ${durMonths === 1 ? 'MES' : 'MESES'}`;
  })();

  const monthlyVal = price / durMonths;
  const totalSavings = (monthlyBase > 0 && monthlyBase * durMonths > price) ? (monthlyBase * durMonths - price) : 0;
  
  // Elite/Featured status
  const isElite = plan.billing_cycle === 'annual' || (isVip && plan.name.toLowerCase().includes('pack 4'));

  const getCycleLabel = (cycle: string) => {
    if (isVip) {
      if (plan.name.toLowerCase().includes('pack')) return 'PACK ESPECIAL';
      if (plan.name.toLowerCase().includes('referido')) return 'BENEFICIO ALUMNO';
      return 'CLASE INDIVIDUAL';
    }
    switch(cycle) {
      case 'monthly_fixed': return 'MENSUAL';
      case 'monthly_from_enrollment': return 'MENSUAL';
      case 'quarterly': return 'TRIMESTRAL';
      case 'semi_annual': return 'SEMESTRAL';
      case 'annual': return 'ANUAL';
      default: return plan.is_recurring ? 'MENSUAL' : 'PAGO ÚNICO';
    }
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`p-6 rounded-[1.5rem] border transition-all text-center group relative overflow-hidden flex flex-col items-center gap-4 ${isSelected
        ? 'border-[#c9a84c] bg-[#c9a84c]/5 shadow-[0_0_30px_rgba(201,168,76,0.15)] scale-[1.02]'
        : (isElite 
           ? 'border-[#c9a84c]/40 bg-zinc-950/40 hover:border-[#c9a84c]' 
           : (isDarkMode ? 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 shadow-sm'))}`}
    >
      {isElite && (
        <div className="absolute top-0 right-0 bg-[#c9a84c] text-black px-3 py-1 text-[8px] font-black rounded-bl-xl flex items-center gap-1.5 shadow-lg z-20 animate-in slide-in-from-top duration-500">
          <span className="text-[10px]">★</span> {isVip ? 'RECOMENDADO' : 'MEJOR VALOR'}
        </div>
      )}

      {isSelected && (
        <div className="absolute top-3 left-3 animate-in zoom-in duration-300">
          <Check size={14} className="text-[#c9a84c]" strokeWidth={4} />
        </div>
      )}
      
      <div className="flex flex-col gap-1 mt-2">
        <span className={`text-sm font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {getCycleLabel(plan.billing_cycle)}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {durLabel}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          ${price.toLocaleString('es-CL')}
        </span>
        {!isVip && (
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            ${Math.round(monthlyVal).toLocaleString('es-CL')}/mes
          </span>
        )}
        {isVip && plan.name.toLowerCase().includes('pack') && (
          <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-[#c9a84c]/60' : 'text-amber-700/60'}`}>
            ${Math.round(price/4).toLocaleString('es-CL')} c/u
          </span>
        )}
      </div>

      {totalSavings > 0 && (
        <div className="mt-2 w-full flex justify-center animate-in slide-in-from-bottom duration-700">
          <div className="bg-emerald-600 px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none block">
              AHORRA ${totalSavings.toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      )}
      
      <div className={`mt-2 text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border transition-all ${isSelected ? 'bg-white text-black border-white' : (isDarkMode ? 'border-zinc-800 text-zinc-600' : 'border-zinc-200 text-zinc-400')}`}>
        {isSelected ? 'SELECCIONADO' : 'SELECCIONAR'}
      </div>
    </button>
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
    registration_mode: null as 'dojo' | 'vip_only' | null,
    self_student: { category: "", belt: "", degrees: null as number | null, modality: "", birth_date: "", is_new_to_jiujitsu: false, gender: 'male', weight: '', height: '' },
    students: [] as any[],
    plan_id: null as number | null, // Para VIP o planes únicos
    adult_plan_id: null as number | null,
    kid_plan_id: null as number | null,
    accept_dojo_terms: false,
    accept_digitaliza_terms: false,
    pack_type: null as string | null,
  });

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);



  const BJJ_BELTS = ALLIANCE_BJJ_GRADUATION.map(b => ({
    id: b.id,
    name: b.name[0],
    color: b.color,
    textColor: b.textColor,
  }));

  useEffect(() => {
    getRegistrationPage(code as string).then(t => {
      setTenant(t);
      setLoading(false);
    });
  }, [code]);

  const calculateCategory = (birthDate: string): string => {
    if (!birthDate || birthDate.length < 14) return "";
    try {
      const parts = birthDate.split(" / ");
      if (parts.length !== 3) return "adults";
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const birth = new Date(year, month, day);
      if (isNaN(birth.getTime())) return "adults";

      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return (age >= 4 && age <= 15) ? "kids" : "adults";
    } catch (e) {
      return "adults";
    }
  };

  const config: IndustryConfig = tenant ? getIndustryConfig(tenant.industry || "default") : getIndustryConfig("default");

  // Force BJJ features for thrkxjko to ensure visibility during testing
  if (code === 'thrkxjko') {
    config.showBJJGraduation = true;
    config.showSelfRegister = true;
  }

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

    if (!form.registration_mode)
      e.registration_mode = "Debes elegir un plan (Dojo o VIP)";
    
    if (form.registration_mode === 'dojo') {
      if (totals.adultsCount > 0 && !form.adult_plan_id) e.adult_plan_id = "Selecciona un plan para adultos";
      if (totals.kidsCount > 0 && !form.kid_plan_id) e.kid_plan_id = "Selecciona un plan para niños";
    }

    if (!form.accept_dojo_terms || !form.accept_digitaliza_terms)
      e.terms = "Debes aceptar los términos y condiciones";

    if (config.showBJJGraduation) {
      if (form.is_self_register && !form.self_student.belt)
        e.self_belt = "Selecciona tu cinturón";
      if (form.is_self_register && form.self_student.degrees === null)
        e.self_degrees = "Selecciona tus grados";
      if (form.is_self_register && !isValidDate(form.self_student.birth_date))
        e.self_birth = "Fecha inválida (DD / MM / AAAA)";

      if (!form.is_self_register && form.students.some(s => !s.belt))
        e.students_belt = "Todos deben tener un cinturón";
      if (!form.is_self_register && form.students.some(s => s.degrees === null))
        e.students_degrees = "Todos deben tener grados seleccionados";
      if (!form.is_self_register && form.students.some(s => !isValidDate(s.birth_date)))
        e.students_birth = "Todos deben tener fecha válida";
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
  
  // Auto-detect base monthly prices for savings calculation
  const findMonthly = (target: 'adults' | 'kids') => {
    const p = (tenant?.plans || []).find((pl: any) => {
      const name = (pl.name || '').toLowerCase();
      const cycle = (pl.billing_cycle || '').toLowerCase();
      const isMensual = cycle.includes('monthly') || name.includes('mensual');
      const matchesTarget = target === 'adults' ? (!name.includes('kids')) : (name.includes('kids'));
      return isMensual && matchesTarget;
    });
    return p ? parseFloat(p.price) : 0;
  };

  const adultMonthlyBase = findMonthly('adults') || 0;
  const kidsMonthlyBase = findMonthly('kids') || 0;


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

    // Monthly subtotal calculation
    const isVipOnly = form.registration_mode === 'vip_only';
    const activePlans = tenant?.plans || [];

    let subtotal = 0;
    let selectedVipPrice = 0;

    if (isVipOnly && form.plan_id) {
      const selectedPlan = activePlans.find((p: any) => p.id === form.plan_id);
      selectedVipPrice = selectedPlan ? parseFloat(selectedPlan.price) : 0;
    } else if (!isVipOnly) {
      // Cálculo separado por categoría si se eligen planes específicos
      const adultPlan = activePlans.find((p: any) => p.id === form.adult_plan_id);
      const kidPlan = activePlans.find((p: any) => p.id === form.kid_plan_id);

      const adultPrice = adultPlan ? parseFloat(adultPlan.price) : 0;
      const kidPrice = kidPlan ? parseFloat(kidPlan.price) : 0;

      subtotal = (adultsCount * adultPrice) + (kidsCount * kidPrice);
    }

    const packPrice = selectedVipPrice;
    let total = subtotal + packPrice, hasDiscount = false;
    
    if (!isVipOnly && pricing.discountThreshold > 0 && totalInscriptions >= pricing.discountThreshold && pricing.discountPercentage > 0) {
      total = (subtotal * (1 - pricing.discountPercentage / 100)) + packPrice;
      hasDiscount = true;
    }
    return { kidsCount, adultsCount, totalInscriptions, subtotal, total, hasDiscount, packPrice, isVipOnly };
  };

  const totals = calculateTotal();
  const guardianNameParts = form.guardian_name.trim().split(/\s+/).filter(p => p.length > 0);
  const isGuardianNameComplete = guardianNameParts.length >= 2;

  const hasSpecificAdultPlans = (tenant?.plans || []).some((p: any) => p.category === 'dojo' && p.target_audience === 'adults');
  const hasSpecificKidPlans = (tenant?.plans || []).some((p: any) => p.category === 'dojo' && p.target_audience === 'kids');

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
      ? "bg-zinc-900/50 text-white placeholder:text-zinc-700 border-zinc-800 focus:border-[#c9a84c]/50"
      : "bg-white text-zinc-900 border-zinc-200 focus:border-[#c9a84c] shadow-sm placeholder:text-zinc-300";
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
      <p className="text-sm text-zinc-500 mt-3 font-bold">Bienvenido a <span className="text-[#c9a84c]">{tenant.name}</span></p>
      <a href="/login" className={`mt-10 h-14 px-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-xl text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-white text-black' : 'bg-black text-white hover:bg-zinc-800'}`}>
        Ir al login
      </a>
    </div>
  );
  const renderModalitySchedules = (s: any, isSelf: boolean = false, index: number = 0) => {
    const onUpdate = (modality: string) => {
      if (isSelf) {
        setForm({ ...form, self_student: { ...form.self_student, modality } });
      } else {
        const st = [...form.students];
        st[index].modality = modality;
        setForm({ ...form, students: st });
      }
    };

    if (!s.birth_date) {
      return (
        <div className={`mt-6 p-8 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-700 ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800/50' : 'bg-white/50 border-zinc-200'
          }`}>
          <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-zinc-300 shadow-sm'}`}>
            <Calendar size={24} className="opacity-40" />
          </div>
          <div className="space-y-1.5">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              ¿CUÁNDO NACISTE?
            </p>
            <p className={`text-[9px] font-bold leading-relaxed max-w-[200px] mx-auto ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Ingresa tu fecha de nacimiento arriba para ver los horarios disponibles para tu categoría. ✨
            </p>
          </div>
        </div>
      );
    }

    if (!s.belt || s.belt.includes('Selecciona')) {
      return (
        <div className={`mt-6 p-8 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-700 ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800/50' : 'bg-white/50 border-zinc-200'
          }`}>
          <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-zinc-300 shadow-sm'}`}>
            <Award size={24} className="opacity-40" />
          </div>
          <div className="space-y-1.5">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              SELECCIONA TU CINTURÓN
            </p>
            <p className={`text-[9px] font-bold leading-relaxed max-w-[200px] mx-auto ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Indica tu grado actual arriba para desbloquear la selección de modalidad y ver los horarios. 🥋
            </p>
          </div>
        </div>
      );
    }

    if (s.degrees === null) {
      return (
        <div className={`mt-6 p-8 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-700 ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800/50' : 'bg-white/50 border-zinc-200'
          }`}>
          <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-zinc-300 shadow-sm'}`}>
            <Star size={24} className="opacity-40" />
          </div>
          <div className="space-y-1.5">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              INDICA TUS GRADOS
            </p>
            <p className={`text-[9px] font-bold leading-relaxed max-w-[200px] mx-auto ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Selecciona cuántas rayas tienes en tu cinturón para ver los horarios correspondientes. ⭐
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 pt-4 border-t border-zinc-500/10 mt-4 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex flex-col gap-2">
          <label className={`text-[10px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Modalidad de Entrenamiento</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'gi', label: '🥋 GI', desc: 'Con Uniforme' },
              { id: 'nogi', label: '👕 NO-GI', desc: 'Ropa Deportiva' },
              { id: 'both', label: '⚡ AMBAS', desc: 'Multidisciplina' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onUpdate(m.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${s.modality === m.id
                  ? 'bg-[#c9a84c] border-[#c9a84c] text-black shadow-lg shadow-[#c9a84c]/20'
                  : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-amber-200')
                  }`}
              >
                <span className="text-sm font-black mb-1">{m.label}</span>
                <span className={`text-[7px] font-black uppercase tracking-widest ${s.modality === m.id ? 'text-black/60' : 'text-zinc-600'}`}>
                  {m.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* SCHEDULES VIEWER OR PLACEHOLDER */}
        {!s.modality ? (
          <div className={`mt-2 p-8 rounded-[2.5rem] border border-dashed flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-700 ${isDarkMode ? 'bg-zinc-900/20 border-zinc-800/50' : 'bg-white/50 border-zinc-200'
            }`}>
            <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-zinc-300 shadow-sm'}`}>
              <Zap size={20} className="opacity-40" />
            </div>
            <div className="space-y-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                ELIGE UNA MODALIDAD
              </p>
              <p className={`text-[8px] font-bold leading-relaxed max-w-[180px] mx-auto ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Selecciona tu estilo de entrenamiento favorito para desbloquear los horarios y planes. ⚡
              </p>
            </div>
          </div>
        ) : (
          <div className={`p-3 rounded-3xl border animate-in fade-in slide-in-from-top-2 duration-500 ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
            <label className={`text-[8px] uppercase tracking-[0.2em] font-black mb-2 block ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Horarios Disponibles ({s.category?.toUpperCase() || 'ADULTOS'})</label>
            <div className="mt-0">
              {(() => {
                const daysMapping: any = { 0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIÉRCOLES', 4: 'JUEVES', 5: 'VIERNES', 6: 'SÁBADO' };
                const schedules = (tenant?.schedules || []).filter((sch: any) => {
                  const schCat = (sch.category || '').toLowerCase();
                const sCat = (s.category || '').toLowerCase();
                
                const matchesCategory = 
                  (schCat.includes('adult') && sCat.includes('adult')) || 
                  (schCat.includes('kid') && sCat.includes('kid'));

                const subject = (sch.subject || sch.name || '').toUpperCase();
                let matchesModality = false;

                if (s.modality === 'both') {
                  matchesModality = true;
                } else if (sch.modality) {
                  matchesModality = (sch.modality === s.modality) || (sch.modality === 'both');
                } else {
                  if (s.modality === 'gi') {
                    const isExplicitNoGi = subject.includes('NO-GI') || subject.includes('NOGI');
                    matchesModality = !isExplicitNoGi;
                  } else if (s.modality === 'nogi') {
                    matchesModality = subject.includes('NO-GI') || subject.includes('NOGI');
                  }
                }

                return matchesCategory && matchesModality;
              });

              if (schedules.length === 0) {
                const anyInThisCategory = (tenant?.schedules || []).some((sch: any) => sch.category === s.category);
                return (
                  <div className="py-6 px-2 text-center space-y-2 border-2 border-dashed border-zinc-200/50 rounded-2xl">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      No hay horarios específicos para esta modalidad ({s.modality})
                    </p>
                    {anyInThisCategory && (
                      <p className={`text-[9px] font-medium leading-relaxed px-4 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        Intenta seleccionando otra modalidad para ver las clases disponibles para {s.category?.toLowerCase().includes('kid') ? 'niños' : 'adultos'}.
                      </p>
                    )}
                  </div>
                );
              }

              // Group by day of week
              const grouped: any = {};
              [1, 2, 3, 4, 5, 6, 0].forEach(d => grouped[d] = []);
              schedules.forEach((sch: any) => grouped[sch.day_of_week].push(sch));

              return (
                <div className="flex overflow-x-auto pb-4 gap-4 snap-x no-scrollbar">
                  {[1, 2, 3, 4, 5, 6, 0].map(day => {
                    const daySchedules = grouped[day];
                    if (daySchedules.length === 0) return null;

                    const activeModality = s.modality || 'gi';
                    
                    const getScheduleColor = (timeStr: string, mod: string) => {
                      if (mod === 'kids') return { text: 'text-emerald-400', border: 'border-emerald-400/20', bg: 'bg-emerald-400/5', dot: 'bg-emerald-500' };
                      const hour = parseInt(timeStr.split(':')[0]);
                      if (hour < 12) return { text: 'text-yellow-400', border: 'border-yellow-400/20', bg: 'bg-yellow-400/5', dot: 'bg-yellow-500' };
                      if (hour < 18) return { text: 'text-teal-400', border: 'border-teal-400/20', bg: 'bg-teal-400/5', dot: 'bg-teal-500' };
                      return { text: 'text-cyan-400', border: 'border-cyan-400/20', bg: 'bg-cyan-400/5', dot: 'bg-cyan-500' };
                    };

                    return (
                      <div key={day} className="flex-none w-28 snap-start flex flex-col transition-all duration-500">
                        <span className={`text-[8px] font-black uppercase tracking-[0.3em] mb-4 pb-1 border-b ${
                          isDarkMode ? 'text-zinc-600 border-zinc-800' : 'text-zinc-400 border-zinc-200'
                        }`}>
                          {daysMapping[day]}
                        </span>
                        <div className="space-y-3">
                          {daySchedules
                            .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
                            .map((sch: any) => {
                              const scheduleColors = getScheduleColor(sch.start_time, sch.category?.toLowerCase().includes('kid') ? 'kids' : activeModality);
                              const cardStyle = isDarkMode 
                                ? `${scheduleColors.bg} ${scheduleColors.border} bg-zinc-950/60` 
                                : 'bg-white border-zinc-100 shadow-sm';
                                
                              return (
                                <div 
                                  key={sch.id} 
                                  className={`group relative p-3 rounded-2xl border transition-all duration-500 hover:scale-[1.02] ${cardStyle}`}
                                >
                                  <div className={`text-xl font-black tracking-tighter leading-none mb-1.5 ${isDarkMode ? scheduleColors.text : 'text-black'}`}>
                                    {sch.start_time.slice(0, 5)}
                                  </div>
                                  <div className={`text-[7px] font-black uppercase tracking-widest opacity-40 truncate ${isDarkMode ? 'text-white' : 'text-zinc-500'}`}>
                                    {sch.name || sch.subject}
                                  </div>
                                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-current ${scheduleColors.text}`} />
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const isGuardianComplete = isGuardianNameComplete && 
                            validateEmail(form.guardian_email) && 
                            form.guardian_phone.replace(/\D/g, '').length >= 11;

  const isSelfComplete = !form.is_self_register || form.self_student.modality !== "";
  const areStudentsComplete = form.students.length === 0 || form.students.every((s: any) => s.modality !== "");
  const canShowPlans = isSelfComplete && areStudentsComplete && (form.is_self_register || form.students.length > 0);

  return (
    <div className={`min-h-screen flex flex-col items-center px-2 py-6 sm:p-6 pb-2 selection:bg-[#c9a84c] selection:text-black transition-colors duration-700 ${isDarkMode ? 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950' : 'bg-zinc-100'}`}>
      <RegistrationProgress form={form} canShowPlans={canShowPlans} isDarkMode={isDarkMode} />
      {isDarkMode && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-5%] right-[-5%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[0%] left-[-10%] w-[60%] h-[60%] bg-slate-500/15 rounded-full blur-[100px]" />
          <div className="absolute top-[30%] left-[10%] w-[40%] h-[40%] bg-sky-500/15 rounded-full blur-[80px]" />
        </div>
      )}
      <div className="w-full max-w-sm pt-20 space-y-10 animate-in fade-in duration-1000">

        {/* Branding */}
        <div className="flex flex-col items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center shadow-2xl border border-zinc-800 p-1 relative group">
            <div className="absolute inset-0 bg-[#c9a84c]/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            {tenant.logo
              ? <img src={tenant.logo} className="h-full w-full object-contain rounded-full relative z-10" />
              : <span className="text-2xl font-black text-zinc-700 relative z-10">{tenant.name?.[0]}</span>
            }
          </div>
          <div className="text-center space-y-2">
            <h1 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Únete a {tenant.name}</h1>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Formulario de registro</p>

              {/* THEME TOGGLE — ULTRA MINIMALIST */}
              <button type="button" onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 hover:bg-zinc-500/10 ${isDarkMode ? 'text-zinc-700 hover:text-[#c9a84c]' : 'text-zinc-300 hover:text-amber-600'}`}>
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
          <div className={`space-y-5 p-6 rounded-[2.5rem] border backdrop-blur-xl transition-all duration-700 ${isDarkMode ? "bg-slate-900/40 border-slate-800/50" : "bg-white border-zinc-200 shadow-sm"}`}>
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#c9a84c]" />
              Datos del {config.guardianLabel}
            </label>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="relative">
                  <input placeholder="Nombre completo" value={form.guardian_name}
                    onChange={e => { setForm({ ...form, guardian_name: e.target.value }); if (errors.guardian_name) setErrors({ ...errors, guardian_name: "" }); }}
                    className={inputClass("guardian_name")} />
                  <ValidationIcon isValid={validateName(form.guardian_name)} value={form.guardian_name} />
                  {errors.guardian_name && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_name}</span>}
                </div>
                {form.guardian_name.trim().length > 0 && (
                  <div className="flex flex-wrap gap-2 px-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    {guardianNameParts.map((part, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[#c9a84c] tracking-widest">{part}</span>
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
                <ValidationIcon isValid={validateEmail(form.guardian_email)} value={form.guardian_email} />
                {errors.guardian_email && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_email}</span>}
              </div>
              <div className="relative">
                <input type="tel" placeholder="Teléfono" value={form.guardian_phone}
                  onChange={handlePhoneChange}
                  className={inputClass("guardian_phone")} />
                <ValidationIcon isValid={validatePhone(form.guardian_phone)} value={form.guardian_phone} />
                {errors.guardian_phone && <span className="text-[9px] text-red-500 font-bold uppercase ml-4 absolute -bottom-4 left-0">{errors.guardian_phone}</span>}
              </div>
            </div>
          </div>


          {/* TOGGLE "YO TAMBIÉN PARTICIPO" — blue card premium */}
          {config.showSelfRegister && isGuardianNameComplete && (
            <div className={`rounded-[2.5rem] border transition-all duration-700 relative animate-in zoom-in fade-in overflow-hidden ${form.is_self_register
              ? (isDarkMode ? "bg-blue-900/10 border-blue-500/50 p-6 shadow-[0_0_50px_rgba(37,99,235,0.1)] scale-[1.02]" : "bg-blue-50 border-blue-300 p-6 shadow-xl scale-[1.02]")
              : (isDarkMode ? "bg-blue-900/5 border-blue-900/30 p-4" : "bg-blue-50/50 border-blue-100 p-4")}`}>
              {isGuardianComplete && (
                <>
                  {form.is_self_register && (
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                  )}
                  <label className="flex items-center gap-4 cursor-pointer relative z-10 animate-in fade-in slide-in-from-top-2 duration-700">
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
                </>
              )}

              {form.is_self_register && (
                <div className="mt-8 space-y-6 pt-8 border-t border-zinc-800 animate-in fade-in zoom-in duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col flex-1">
                        <label className={`text-[11px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-white/90' : 'text-zinc-800'}`}>Tu Fecha de Nacimiento</label>
                        <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mt-1">Día / Mes / Año</span>
                      </div>
                      {form.self_student.category && (
                        <div className="flex flex-col items-end group/cat">
                          <span className={`text-[7px] font-black uppercase tracking-[0.2em] mb-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Categoría</span>
                          <div key={form.self_student.category} className={`text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95 slide-in-from-right-2 duration-500 ${isDarkMode ? 'text-[#c9a84c]' : 'text-amber-700'}`}>
                            {form.self_student.category === 'kids' ? 'Kids (4-15)' : 'Adulto'}
                          </div>
                        </div>
                      )}
                    </div>
                    <ModernDateInput value={form.self_student.birth_date} placeholder={todayPlaceholder} isDarkMode={isDarkMode}
                      onChange={(v: string) => {
                        const cat = calculateCategory(v);
                        // Reset cascading fields if date is invalid or cleared
                        const isInvalid = !v || v.length < 10;
                        setForm({ 
                          ...form, 
                          self_student: { 
                            ...form.self_student, 
                            birth_date: v, 
                            category: cat,
                            belt: isInvalid ? "" : form.self_student.belt,
                            degrees: isInvalid ? null : form.self_student.degrees,
                            modality: isInvalid ? "" : form.self_student.modality
                          } 
                        });
                      }}
                      error={errors.self_birth}
                    />

                    {/* BJJ PROFILE: GENDER, WEIGHT, HEIGHT */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2 items-end">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className={`text-[8px] uppercase tracking-wider font-black ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Género</label>
                          <div className="relative">
                            <button type="button" onClick={() => setActiveTooltip(activeTooltip === 'gender_self' ? null : 'gender_self')} className="text-zinc-500 hover:text-[#c9a84c] transition-colors">
                              <Info size={9} />
                            </button>
                            {activeTooltip === 'gender_self' && (
                              <div className="absolute bottom-full left-0 mb-2 w-52 p-3 rounded-3xl bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-100 animate-in fade-in zoom-in duration-300">
                                Según certificado de nacimiento. Se usa para categorías de competencia IBJJF.
                                <div className="absolute top-full left-4 border-8 border-transparent border-t-zinc-900" />
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, self_student: { ...form.self_student, gender: form.self_student.gender === 'male' ? 'female' : 'male' } })}
                          className={`h-12 px-2 rounded-2xl flex items-center justify-between w-full transition-all duration-500 active:scale-95 group/gender relative overflow-hidden border ${form.self_student.gender === 'male'
                            ? (isDarkMode ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600')
                            : (isDarkMode ? 'bg-fuchsia-600/20 border-fuchsia-600/50 text-fuchsia-400' : 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600')
                            } font-black text-[8px] tracking-widest uppercase`}
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/gender:opacity-100 transition-opacity" />
                          <span className="relative z-10 animate-in fade-in zoom-in-95 duration-500 truncate" key={form.self_student.gender}>
                            {form.self_student.gender === 'male' ? 'MASCULINO' : 'FEMENINO'}
                          </span>
                          <RefreshCw className={`w-2.5 h-2.5 relative z-10 transition-transform duration-500 shrink-0 ${form.self_student.gender === 'female' ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[8px] uppercase tracking-wider font-black ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Peso</label>
                        <div className="relative h-12">
                          <input type="number" placeholder="90"
                            value={form.self_student.weight}
                            onChange={e => setForm({ ...form, self_student: { ...form.self_student, weight: e.target.value.replace(/[^0-9]/g, '').slice(0, 3) } })}
                            className={`w-full h-full rounded-2xl border px-2 text-center text-[10px] font-black transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDarkMode
                              ? 'bg-zinc-800 border-zinc-700 text-white placeholder-white/10'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400/20'
                              } focus:border-[#c9a84c]/50`}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            {form.self_student.weight && (
                              <CheckCircle2 size={10} className="text-emerald-500 animate-in zoom-in fade-in" />
                            )}
                          </div>
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[6px] font-black text-zinc-500/40 uppercase">kg</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[8px] uppercase tracking-wider font-black ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Altura</label>
                        <div className="relative h-12">
                          <input type="number" placeholder="180"
                            value={form.self_student.height}
                            onChange={e => setForm({ ...form, self_student: { ...form.self_student, height: e.target.value.replace(/[^0-9]/g, '').slice(0, 3) } })}
                            className={`w-full h-full rounded-2xl border px-2 text-center text-[10px] font-black transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDarkMode
                              ? 'bg-zinc-800 border-zinc-700 text-white placeholder-white/10'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400/20'
                              } focus:border-[#c9a84c]/50`}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            {form.self_student.height && (
                              <CheckCircle2 size={10} className="text-emerald-500 animate-in zoom-in fade-in" />
                            )}
                          </div>
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[6px] font-black text-zinc-500/40 uppercase">cm</span>
                        </div>
                      </div>

                    </div>

                    {config.showBJJGraduation && (
                      <div className="flex items-center gap-3 px-1 mt-1 transition-all">
                        <label className="flex items-center gap-1.5 cursor-pointer group/premium">
                          <input type="checkbox" checked={form.self_student.is_new_to_jiujitsu}
                            onChange={e => {
                              const checked = e.target.checked;
                              setForm({ ...form, self_student: { ...form.self_student, is_new_to_jiujitsu: checked, belt: checked ? 'white' : form.self_student.belt, degrees: checked ? 0 : form.self_student.degrees } });
                            }}
                            className="w-3.5 h-3.5 rounded-lg border-zinc-700 bg-zinc-900 accent-[#c9a84c] transition-all"
                          />
                          <span className={`text-[9px] font-black uppercase tracking-[0.15em] leading-none transition-colors ${form.self_student.is_new_to_jiujitsu ? 'text-[#c9a84c]' : 'text-zinc-500'}`}>
                            {form.self_student.gender === 'male' ? 'Es Nuevo en Jiu-Jitsu' : 'Es Nueva en Jiu-Jitsu'}
                          </span>
                        </label>
                        <div className="relative">
                          <button type="button" onClick={() => setActiveTooltip(activeTooltip === 'self' ? null : 'self')} className="text-zinc-500 hover:text-[#c9a84c] transition-colors">
                            <Info size={12} />
                          </button>
                          {activeTooltip === 'self' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-100 animate-in fade-in zoom-in duration-300">
                              Si eres nuevo, comenzarás como cinturón blanco. ¡No te preocupes, nosotros te guiaremos!
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                            </div>
                          )}
                        </div>
                      </div>
                      )}

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 px-1 flex justify-between">
                        Tu Cinturón actual
                        {errors.self_belt && <span className="text-red-500 animate-pulse">{errors.self_belt}</span>}
                      </label>
                      <div className="flex gap-1.5 h-10">
                        {BJJ_BELTS.map(belt => (
                          <button key={belt.id} type="button"
                            onClick={() => !form.self_student.is_new_to_jiujitsu && setForm({ ...form, self_student: { ...form.self_student, belt: belt.id } })}
                            disabled={form.self_student.is_new_to_jiujitsu}
                            className={`flex-1 rounded-2xl border transition-all flex items-center justify-center relative overflow-hidden group/belt ${form.self_student.belt === belt.id ? 'border-[#c9a84c] z-10' : (isDarkMode ? 'border-zinc-800 opacity-40 hover:opacity-100' : 'border-zinc-200 opacity-60 hover:opacity-100')} ${form.self_student.is_new_to_jiujitsu && belt.id !== 'white' ? 'grayscale opacity-20' : ''}`}
                            style={{ backgroundColor: belt.color }}
                          >
                            <span className={`text-[9px] font-bold pointer-events-none z-10 ${belt.textColor} uppercase tracking-tighter`}>{belt.name}</span>
                            <div className={`absolute right-0 top-0 bottom-0 w-1/4 bg-zinc-950/90 pointer-events-none transition-all ${form.self_student.belt === belt.id ? 'w-1/3' : 'group-hover/belt:w-1/3'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.self_student.belt && (
                      <div className={`animate-in fade-in slide-in-from-top-4 duration-700 space-y-3 p-3 rounded-3xl border shadow-inner flex flex-col items-center text-center ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-white border-zinc-100 shadow-sm'}`}>
                        <label className={`text-[10px] uppercase tracking-[0.2em] font-black flex justify-between w-full px-2 ${isDarkMode ? 'text-white/80' : 'text-zinc-800'}`}>
                          Grados (Rayas)
                          {errors.self_degrees && <span className="text-red-500 animate-pulse">{errors.self_degrees}</span>}
                        </label>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4].map(deg => (
                            <button key={deg} type="button"
                              onClick={() => !form.self_student.is_new_to_jiujitsu && setForm({ ...form, self_student: { ...form.self_student, degrees: deg } })}
                              disabled={form.self_student.is_new_to_jiujitsu}
                              className={`w-8 h-8 rounded-full text-[10px] font-black transition-all flex items-center justify-center ${form.self_student.degrees === deg
                                ? 'bg-[#c9a84c] text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-110'
                                : (isDarkMode ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 hover:border-zinc-700' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:border-zinc-300')} ${form.self_student.is_new_to_jiujitsu && deg !== 0 ? 'opacity-20' : ''}`}>
                              {deg}
                            </button>
                          ))}
                        </div>
                        <p className="text-[7.5px] text-zinc-600 font-bold uppercase tracking-widest">Nivel de graduación</p>
                      </div>
                    )}

                    {/* MODALITY & SCHEDULES */}
                    {renderModalitySchedules(form.self_student, true)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LISTA DE ALUMNOS/ESTUDIANTES - GATED TEMPRANO */}
          {isGuardianComplete && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                onClick={() => setForm({ ...form, students: [...form.students, { name: "", category: "", belt: "", degrees: null as number | null, modality: "", birth_date: "", is_new_to_jiujitsu: false, gender: 'male', weight: '', height: '' }] })}
                className="group flex items-center gap-2.5 transition-all active:scale-95">
                <div className="relative">
                  <div key={form.students.length} className={`w-6 h-6 rounded-full flex items-center justify-center border animate-spin-360 ${isDarkMode ? 'bg-[#c9a84c]/10 border-[#c9a84c]/20' : 'bg-[#c9a84c]/5 border-amber-200'}`}>
                    <span className="text-[#c9a84c] font-black text-sm">+</span>
                  </div>
                  {form.students.length > 0 && (
                    <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2 animate-in zoom-in duration-300 ${isDarkMode ? 'bg-[#c9a84c] text-zinc-950 border-zinc-950' : 'bg-black text-white border-white shadow-sm'}`}>
                      <span className="text-[8px] font-black">{form.students.length}</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-[#c9a84c]' : 'text-zinc-600 group-hover:text-amber-600'}`}>Agregar {config.memberLabel}</span>
              </button>
            </div>

            {errors.students && <p className="text-[10px] text-red-400 font-bold uppercase animate-pulse px-2">{errors.students}</p>}

            <div className="space-y-5">
              {form.students.length === 0 && (
                <div className={`p-10 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all animate-in fade-in zoom-in duration-500 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/10' : 'border-zinc-200 bg-zinc-50/50'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed ${isDarkMode ? 'border-zinc-800 text-zinc-700' : 'border-zinc-200 text-zinc-300'}`}>
                    <Plus size={32} />
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center px-4">
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      AGREGA AL MENOS UN ALUMNO
                    </span>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter leading-relaxed">
                      Presiona el botón + para comenzar
                    </p>
                  </div>
                </div>
              )}
              {form.students.map((s: any, i) => (
                <div key={i} className={`space-y-6 p-6 rounded-[2.5rem] border animate-in slide-in-from-bottom-4 duration-700 relative overflow-hidden group transition-all ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>

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
                            <span className="text-[10px] font-black uppercase text-[#c9a84c] tracking-widest leading-tight">{part}</span>
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
                      <div className="flex flex-col flex-1">
                        <label className={`text-[11px] uppercase tracking-[0.2em] font-black ${isDarkMode ? 'text-white/90' : 'text-zinc-800'}`}>Fecha Nacimiento</label>
                      </div>
                      {s.category && (
                        <div className="flex flex-col items-end group/cat">
                          <span className={`text-[7px] font-black uppercase tracking-[0.2em] mb-0.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Categoría</span>
                          <div key={s.category} className={`text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95 slide-in-from-right-2 duration-500 ${isDarkMode ? 'text-[#c9a84c]' : 'text-amber-700'}`}>
                            {s.category === 'kids' ? 'Kids (4-15)' : 'Adulto'}
                          </div>
                        </div>
                      )}
                    </div>
                    <ModernDateInput value={s.birth_date} placeholder={todayPlaceholder} isDarkMode={isDarkMode}
                      onChange={(v: string) => {
                        const cat = calculateCategory(v);
                        const st = [...form.students];
                        // Reset cascading fields if date is invalid or cleared
                        const isInvalid = !v || v.length < 10;
                        st[i].birth_date = v;
                        st[i].category = cat;
                        if (isInvalid) {
                          st[i].belt = "";
                          st[i].degrees = null;
                          st[i].modality = "";
                        }
                        setForm({ ...form, students: st });
                      }}
                      error={errors.students_birth}
                    />

                    {/* BJJ PROFILE: GENDER, WEIGHT, HEIGHT */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2 items-end">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                          <label className={`text-[8px] uppercase tracking-wider font-black ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Género</label>
                          <div className="relative">
                            <button type="button" onClick={() => setActiveTooltip(activeTooltip === `gender_${i}` ? null : `gender_${i}`)} className="text-zinc-500 hover:text-[#c9a84c] transition-colors">
                              <Info size={9} />
                            </button>
                            {activeTooltip === `gender_${i}` && (
                              <div className="absolute bottom-full left-0 mb-2 w-52 p-3 rounded-3xl bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-100 animate-in fade-in zoom-in duration-300">
                                Según certificado de nacimiento. Se usa para categorías de competencia IBJJF.
                                <div className="absolute top-full left-4 border-8 border-transparent border-t-zinc-900" />
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.students];
                            updated[i].gender = s.gender === 'male' ? 'female' : 'male';
                            setForm({ ...form, students: updated });
                          }}
                          className={`h-12 px-2 rounded-2xl flex items-center justify-between w-full transition-all duration-500 active:scale-95 group/gender relative overflow-hidden border ${s.gender === 'male'
                            ? (isDarkMode ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600')
                            : (isDarkMode ? 'bg-fuchsia-600/20 border-fuchsia-600/50 text-fuchsia-400' : 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-600')
                            } font-black text-[8px] tracking-widest uppercase`}
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/gender:opacity-100 transition-opacity" />
                          <span className="relative z-10 animate-in fade-in zoom-in-95 duration-500 truncate" key={s.gender}>
                            {s.gender === 'male' ? 'MASCULINO' : 'FEMENINO'}
                          </span>
                          <RefreshCw className={`w-2.5 h-2.5 relative z-10 transition-transform duration-500 shrink-0 ${s.gender === 'female' ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[8px] uppercase tracking-wider font-black ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Peso</label>
                        <div className="relative h-12">
                          <input type="number" placeholder="90"
                            value={s.weight}
                            onChange={e => {
                              const st = [...form.students];
                              st[i].weight = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                              setForm({ ...form, students: st });
                            }}
                            className={`w-full h-full rounded-2xl border px-2 text-center text-[10px] font-black transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-white/10' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400/20'
                              } focus:border-[#c9a84c]/50`}
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[6px] font-black text-zinc-500/40 uppercase">kg</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[8px] uppercase tracking-wider font-black ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Altura</label>
                        <div className="relative h-12">
                          <input type="number" placeholder="180"
                            value={s.height}
                            onChange={e => {
                              const st = [...form.students];
                              st[i].height = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                              setForm({ ...form, students: st });
                            }}
                            className={`w-full h-full rounded-2xl border px-2 text-center text-[10px] font-black transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-white/10' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400/20'
                              } focus:border-[#c9a84c]/50`}
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[6px] font-black text-zinc-500/40 uppercase">cm</span>
                        </div>
                      </div>
                    </div>

                    {config.showBJJGraduation && (
                      <div className="flex items-center gap-3 px-1 mt-1 transition-all">
                        <label className="flex items-center gap-1.5 cursor-pointer group/premium">
                          <input type="checkbox" checked={s.is_new_to_jiujitsu}
                            onChange={e => {
                              const checked = e.target.checked;
                              const st = [...form.students];
                              st[i].is_new_to_jiujitsu = checked;
                              if (checked) {
                                st[i].belt = 'white';
                                st[i].degrees = 0;
                              }
                              setForm({ ...form, students: st });
                            }}
                            className="w-3.5 h-3.5 rounded-lg border-zinc-700 bg-zinc-900 accent-[#c9a84c] transition-all"
                          />
                          <span className={`text-[9px] font-black uppercase tracking-[0.15em] leading-none transition-colors ${s.is_new_to_jiujitsu ? 'text-[#c9a84c]' : 'text-zinc-500'}`}>
                            {s.gender === 'male' ? 'Es Nuevo en Jiu-Jitsu' : 'Es Nueva en Jiu-Jitsu'}
                          </span>
                        </label>
                        <div className="relative">
                          <button type="button" onClick={() => setActiveTooltip(activeTooltip === `student_${i}` ? null : `student_${i}`)} className="text-zinc-500 hover:text-[#c9a84c] transition-colors">
                            <Info size={12} />
                          </button>
                          {activeTooltip === `student_${i}` && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-4 rounded-3xl bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-100 animate-in fade-in zoom-in duration-300">
                              Si eres nuevo, comenzarás como cinturón blanco. ¡No te preocupes, nosotros te guiaremos!
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BJJ FIELDS */}
                  {config.showBJJGraduation && (
                    <div className="space-y-4">
                      {/* Paso 1: Cinturón */}
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 px-1 flex justify-between">
                          Selecciona Cinturón
                          {errors.students_belt && <span className="text-red-500 animate-pulse">{errors.students_belt}</span>}
                        </label>
                        <div className="flex gap-1.5 h-10">
                          {BJJ_BELTS.map(belt => (
                            <button key={belt.id} type="button"
                              onClick={() => !s.is_new_to_jiujitsu && (function () { const st = [...form.students]; st[i].belt = belt.id; setForm({ ...form, students: st }); })()}
                              disabled={s.is_new_to_jiujitsu}
                              className={`flex-1 rounded-2xl border transition-all flex items-center justify-center relative overflow-hidden group/belt ${s.belt === belt.id ? 'border-[#c9a84c] z-10' : (isDarkMode ? 'border-zinc-800 opacity-40 hover:opacity-100' : 'border-zinc-200 opacity-60 hover:opacity-100')} ${s.is_new_to_jiujitsu && belt.id !== 'white' ? 'grayscale opacity-20' : ''}`}
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
                        <div className={`animate-in fade-in slide-in-from-top-4 duration-700 space-y-3 p-3 rounded-3xl border shadow-inner flex flex-col items-center text-center ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50' : 'bg-white border-zinc-100 shadow-sm'}`}>
                          {/* Fila 1: Label */}
                          <label className={`text-[10px] uppercase tracking-[0.2em] font-black flex justify-between w-full px-2 ${isDarkMode ? 'text-white/80' : 'text-zinc-800'}`}>
                            Grados (Rayas)
                            {errors.students_degrees && <span className="text-red-500 animate-pulse">{errors.students_degrees}</span>}
                          </label>

                          {/* Fila 2: Selector */}
                          <div className="flex gap-2">
                            {[0, 1, 2, 3, 4].map(deg => (
                              <button key={deg} type="button"
                                onClick={() => !s.is_new_to_jiujitsu && (function () { const st = [...form.students]; st[i].degrees = deg; setForm({ ...form, students: st }); })()}
                                disabled={s.is_new_to_jiujitsu}
                                className={`w-8 h-8 rounded-full text-[10px] font-black transition-all flex items-center justify-center ${s.degrees === deg
                                  ? 'bg-[#c9a84c] text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-110'
                                  : (isDarkMode ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 hover:border-zinc-700' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 hover:border-zinc-300')} ${s.is_new_to_jiujitsu && deg !== 0 ? 'opacity-20' : ''}`}>
                                {deg}
                              </button>
                            ))}
                          </div>

                          {/* Fila 3: Subtítulo */}
                          <p className="text-[7.5px] text-zinc-600 font-bold uppercase tracking-widest">Nivel de graduación</p>
                        </div>
                      )}

                      {/* MODALITY & SCHEDULES */}
                      {renderModalitySchedules(s, false, i)}
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
          </div>
        )}

        {/* REGISTRATION & PLANS — SOLO SI HAY MODALIDAD SELECCIONADA EN TODOS */}
        {canShowPlans && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="space-y-8 animate-in fade-in duration-1000">
            {/* REGISTRATION MODE SELECTOR (MOVED) */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 px-2 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#c9a84c]" />
                {totals.adultsCount > 0 && totals.kidsCount > 0 ? "ELIGE TUS PLANES" :
                 totals.kidsCount > 0 ? "ELIGE TU PLAN KID" : "ELIGE TU PLAN ADULTO"}
                {errors.registration_mode && <span className="text-red-500 animate-pulse ml-2 text-[8px] tracking-normal">{errors.registration_mode}</span>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, registration_mode: 'dojo', plan_id: null })}
                  className={`p-4 rounded-[2.5rem] border transition-all flex flex-col items-center gap-2 text-center group ${form.registration_mode === 'dojo'
                    ? 'border-[#c9a84c] bg-[#c9a84c]/5 shadow-[0_0_20px_rgba(201,168,76,0.1)]'
                    : (isDarkMode ? 'border-zinc-800/50 bg-zinc-900/10 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm')}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${form.registration_mode === 'dojo' ? 'bg-[#c9a84c] text-black shadow-lg' : (isDarkMode ? 'bg-zinc-800/50 text-zinc-600' : 'bg-zinc-100 text-zinc-400')}`}>
                    <Users size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${form.registration_mode === 'dojo' ? (isDarkMode ? 'text-white' : 'text-zinc-900') : 'text-zinc-500'}`}>
                      SER PARTE DEL DOJO
                    </span>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter text-center">INSCRIPCIÓN REGULAR</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, registration_mode: 'vip_only', plan_id: null })}
                  className={`p-4 rounded-[2.5rem] border transition-all flex flex-col items-center gap-2 text-center group ${form.registration_mode === 'vip_only'
                    ? 'border-[#c9a84c] bg-[#c9a84c]/5 shadow-[0_0_20px_rgba(201,136,76,0.15)]'
                    : (isDarkMode ? 'border-zinc-800/50 bg-zinc-900/10 hover:border-zinc-700' : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm')}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${form.registration_mode === 'vip_only' ? 'bg-[#c9a84c] text-black shadow-[0_0_15px_rgba(201,136,76,0.5)]' : (isDarkMode ? 'bg-zinc-800/50 text-zinc-600' : 'bg-zinc-100 text-zinc-400')}`}>
                    <Star size={18} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${form.registration_mode === 'vip_only' ? (isDarkMode ? 'text-white' : 'text-zinc-900') : 'text-zinc-500'}`}>
                      SESIONES VIP 1-A-1
                    </span>
                    <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter text-center">SIN MENSUALIDAD</span>
                  </div>
                </button>
              </div>
            </div>

            {/* PLAN SELECTION (DOJO or VIP) */}
            {form.registration_mode && (
              <div className={`space-y-8 p-6 sm:p-8 rounded-[2.5rem] border backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-700 ${isDarkMode ? 'bg-slate-900/40 border-slate-800/50' : 'bg-white border-zinc-200'} ${(form.registration_mode === 'vip_only' || form.registration_mode === 'dojo') && !form.plan_id && !form.adult_plan_id && !form.kid_plan_id ? 'border-[#c9a84c]/50' : ''}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/5 rounded-full blur-3xl" />

                {form.registration_mode === 'vip_only' ? (
                  <div className="space-y-6">
                    <div className="space-y-1 relative z-10">
                      <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#c9a84c]">
                        Paso Final: Selecciona tu Pack VIP
                      </h3>
                      {errors.plan_id && <p className="text-[10px] text-red-500 font-black uppercase animate-pulse">{errors.plan_id}</p>}
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                        Elige el pack de sesiones para comenzar hoy
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 relative z-10">
                      {(tenant?.plans || []).filter((p: any) => p.category === 'vip').map((plan: any) => (
                        <PlanCard 
                          key={plan.id} 
                          plan={plan} 
                          monthlyBase={0}
                          isSelected={form.plan_id === plan.id}
                          onSelect={() => { 
                            setForm({ ...form, plan_id: plan.id });
                            if (errors.plan_id) setErrors({ ...errors, plan_id: "" });
                          }}
                          isDarkMode={isDarkMode}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 relative z-10">
                    {totals.adultsCount > 0 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#c9a84c]">
                            ELIGE TU PLAN ADULTO {totals.adultsCount > 1 ? `(X${totals.adultsCount})` : ""}
                          </h3>
                          {errors.adult_plan_id && <p className="text-[10px] text-red-500 font-black uppercase animate-pulse">{errors.adult_plan_id}</p>}
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                            Inscripción para los participantes adultos
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {(tenant?.plans || [])
                            .filter((p: any) => p.category === 'dojo' && (
                              p.target_audience === 'adults' || 
                                (p.target_audience === 'all' && !p.name.toLowerCase().includes('kids') && !hasSpecificAdultPlans)
                            ))
                            .map((plan: any) => (
                              <PlanCard 
                                key={plan.id} 
                                plan={plan} 
                                monthlyBase={adultMonthlyBase || 0}
                                isSelected={form.adult_plan_id === plan.id}
                                onSelect={() => { 
                                  setForm({ ...form, adult_plan_id: plan.id });
                                  if (errors.adult_plan_id) setErrors({ ...errors, adult_plan_id: "" });
                                }}
                                isDarkMode={isDarkMode}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {totals.kidsCount > 0 && (
                      <div className="space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-[#c9a84c]">
                            ELIGE TU PLAN KID {totals.kidsCount > 1 ? `(X${totals.kidsCount})` : ""}
                          </h3>
                          {errors.kid_plan_id && <p className="text-[10px] text-red-500 font-black uppercase animate-pulse">{errors.kid_plan_id}</p>}
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                            Inscripción para los participantes menores de edad
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {(tenant?.plans || [])
                            .filter((p: any) => p.category === 'dojo' && (
                              p.target_audience === 'kids' || 
                              (p.target_audience === 'all' && p.name.toLowerCase().includes('kids') && !hasSpecificKidPlans)
                            ))
                            .map((plan: any) => (
                              <PlanCard 
                                key={plan.id} 
                                plan={plan} 
                                monthlyBase={kidsMonthlyBase || 0}
                                isSelected={form.kid_plan_id === plan.id}
                                onSelect={() => { 
                                  setForm({ ...form, kid_plan_id: plan.id });
                                  if (errors.kid_plan_id) setErrors({ ...errors, kid_plan_id: "" });
                                }}
                                isDarkMode={isDarkMode}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RESUMEN DE PRECIOS — solo industrias con pricing */}
          {config.showPricing && totals.totalInscriptions > 0 && form.registration_mode !== null && (
            <div className={`backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border space-y-5 shadow-2xl relative overflow-hidden group transition-all duration-700 ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#c9a84c]/5 rounded-full blur-3xl" />
              <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Resumen de Inscripción</h3>
              <div className="space-y-3 text-sm">
                {totals.isVipOnly ? (
                  <div className={`flex justify-between items-center transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span className="font-bold uppercase tracking-tighter italic">REGISTRO VIP (PAGO ÚNICO)</span>
                    <span className="font-black">$0</span>
                  </div>
                ) : (
                  <>
                    {(totals.adultsCount > 0 && form.adult_plan_id) && (
                      <div className={`flex justify-between items-center transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'} animate-in slide-in-from-left duration-300`}>
                        <span className="font-bold uppercase tracking-tighter">
                          {totals.adultsCount}x {tenant?.plans?.find((p: any) => p.id === form.adult_plan_id)?.name || 'PLAN ADULTO'}
                        </span>
                        <span className="font-black">${((tenant?.plans?.find((p: any) => p.id === form.adult_plan_id)?.price || 0) * totals.adultsCount).toLocaleString("es-CL")}</span>
                      </div>
                    )}
                    
                    {/* PLAN KIDS */}
                    {(totals.kidsCount > 0 && form.kid_plan_id) && (
                      <div className={`flex justify-between items-center transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'} animate-in slide-in-from-left duration-300 delay-75`}>
                        <span className="font-bold uppercase tracking-tighter">
                          {totals.kidsCount}x {tenant?.plans?.find((p: any) => p.id === form.kid_plan_id)?.name || 'PLAN KID'}
                        </span>
                        <span className="font-black">${((tenant?.plans?.find((p: any) => p.id === form.kid_plan_id)?.price || 0) * totals.kidsCount).toLocaleString("es-CL")}</span>
                      </div>
                    )}
                  </>
                )}
                
                {totals.isVipOnly && form.plan_id && (
                  <div className="flex justify-between items-center text-[#c9a84c] animate-in zoom-in duration-300">
                    <span className="font-bold uppercase tracking-tighter">
                      1x {tenant?.plans?.find((p: any) => p.id === form.plan_id)?.name || 'PACK VIP'}
                    </span>
                    <span className="font-black">${totals.packPrice.toLocaleString("es-CL")}</span>
                  </div>
                )}
              </div>
              <div className={`border-t pt-5 flex items-end justify-between relative z-10 ${isDarkMode ? 'border-zinc-800/50' : 'border-zinc-100'}`}>
                <div className="flex flex-col">
                  <span className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Total a pagar hoy</span>
                  {totals.hasDiscount && (
                    <span className="text-[10px] font-black text-[#c9a84c] uppercase tracking-tighter animate-pulse">
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

          {/* TERMS & CONDITIONS CHECKBOXES */}
          <div className="space-y-4 px-2">
            <div className={`p-6 rounded-[2.5rem] border backdrop-blur-sm transition-all duration-700 ${isDarkMode ? "bg-zinc-900/40 border-zinc-800/80" : "bg-zinc-50 border-zinc-200"}`}>
              <div className="space-y-4">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={form.accept_dojo_terms}
                      onChange={(e) => setForm({ ...form, accept_dojo_terms: e.target.checked })}
                    />
                    <div className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${form.accept_dojo_terms ? 'bg-[#c9a84c] border-[#c9a84c] shadow-[0_0_15px_rgba(201,168,76,0.3)]' : `bg-transparent ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'} group-hover:border-zinc-700`}`}>
                      <Check size={14} className={`text-black transition-opacity ${form.accept_dojo_terms ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-[11px] font-black uppercase tracking-widest leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Acepto los <a href={`/r/${code}/terms`} target="_blank" className="text-[#c9a84c] hover:underline underline-offset-4">términos y condiciones</a> del dojo
                    </span>
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Contrato de prestación de servicios deportivos</span>
                  </div>
                </label>

                <div className="h-px bg-zinc-900/50" />

                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={form.accept_digitaliza_terms}
                      onChange={(e) => setForm({ ...form, accept_digitaliza_terms: e.target.checked })}
                    />
                    <div className={`w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${form.accept_digitaliza_terms ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : `bg-transparent ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'} group-hover:border-zinc-700`}`}>
                      <Check size={14} className={`text-white transition-opacity ${form.accept_digitaliza_terms ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-[11px] font-black uppercase tracking-widest leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Acepto los <a href="https://digitalizatodo.cl/legal/" target="_blank" className="text-zinc-400 hover:text-white underline underline-offset-4">Aviso Legal</a>, <a href="https://digitalizatodo.cl/terminos/" target="_blank" className="text-zinc-400 hover:text-white underline underline-offset-4">Términos</a> y <a href="https://digitalizatodo.cl/privacidad/" target="_blank" className="text-zinc-400 hover:text-white underline underline-offset-4">Privacidad</a> de Digitaliza Todo
                    </span>
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Plataforma de gestión y pagos</span>
                  </div>
                </label>
              </div>
              {errors.terms && <p className="mt-4 text-[9px] text-red-500 font-black uppercase tracking-widest text-center animate-pulse">{errors.terms}</p>}
            </div>
          </div>
          {/* CONTRASEÑA — al final como paso previo al envío */}
          <div className={`space-y-5 p-6 rounded-[2.5rem] border backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-bottom-6 transition-all duration-700 ${isDarkMode ? "bg-zinc-900/30 border-zinc-800/50" : "bg-white border-zinc-200 shadow-sm"}`}>
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

          {/* SECCIÓN: RESUMEN SEMANAL — Vista Global */}
          {tenant?.schedules && tenant.schedules.length > 0 && (
            <div className={`p-4 sm:p-6 rounded-[2.5rem] border animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 transition-all ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <label className={`text-[8px] sm:text-[9px] uppercase tracking-[0.3em] font-black ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>Resumen Semanal (LUN-VIE)</label>
                <div className="h-px flex-1 mx-2 sm:mx-4 bg-zinc-500/10" />
              </div>
              
              <div className="grid grid-cols-5 gap-1 sm:gap-3 transition-all">
                {[1, 2, 3, 4, 5].map(day => {
                  const dayMapping: any = { 1: 'LUN', 2: 'MAR', 3: 'MIE', 4: 'JUE', 5: 'VIE' };
                  const daySchedules = (tenant.schedules || []).filter((sch: any) => sch.day_of_week === day);
                  
                  return (
                    <div key={day} className="space-y-3 transition-all transform duration-500">
                      <div className={`text-[7px] sm:text-[8px] font-black text-center uppercase tracking-widest ${isDarkMode ? 'text-[#c9a84c]/50' : 'text-amber-700/50'}`}>
                        {dayMapping[day]}
                      </div>
                      <div className="space-y-2">
                        {daySchedules
                          .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
                          .map((sch: any) => {
                            const mod = (sch.modality || 'gi').toLowerCase();
                            const isKid = (sch.category || '').toLowerCase().includes('kid');
                            const hour = parseInt(sch.start_time.split(':')[0]);
                            
                            let color = 'bg-cyan-500';
                            let textColor = 'text-cyan-400';
                            if (isKid) { color = 'bg-emerald-500'; textColor = 'text-emerald-400'; }
                            else if (hour < 12) { color = 'bg-yellow-400'; textColor = 'text-yellow-400'; }
                            else if (hour < 18) { color = 'bg-teal-400'; textColor = 'text-teal-400'; }

                            return (
                              <div key={sch.id} className="flex flex-col items-center gap-0.5 group">
                                <span className={`text-[8px] sm:text-[9px] font-black tracking-tighter transition-all group-hover:scale-110 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>
                                  {sch.start_time.slice(0, 5)}
                                </span>
                                <div className={`h-1 w-2 sm:w-3 rounded-full ${color} opacity-40 transition-all group-hover:opacity-100 shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                <span className={`text-[4px] sm:text-[5px] font-black uppercase truncate w-full text-center transition-all ${isDarkMode ? `opacity-40 group-hover:opacity-100 ${textColor}` : `opacity-60 group-hover:opacity-100 ${textColor.replace('-400', '-600')}`}`}>
                                  {isKid ? 'KIDS' : (sch.modality === 'both' ? 'AMBOS' : (sch.modality || 'GI').toUpperCase())}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

            <div className="space-y-4 pt-6">
              <button type="submit" disabled={submitting}
                className={`w-full h-14 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl disabled:opacity-30 group relative overflow-hidden ${isDarkMode ? 'bg-white hover:bg-zinc-200 text-black' : 'bg-black hover:bg-zinc-800 text-white shadow-xl shadow-black/10'}`}>
                <div className="absolute inset-0 bg-linear-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {submitting ? <Loader2 className={`animate-spin ${isDarkMode ? 'text-zinc-900' : 'text-zinc-200'}`} size={20} /> : (
                  <><span>Completar Inscripción</span><CheckCircle2 size={20} className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'} /></>
                )}
              </button>
              <p className="text-center text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                ¿Ya tienes cuenta?{" "}
                <a href="/login" className={`transition-colors underline-offset-4 hover:underline ${isDarkMode ? 'text-white hover:text-amber-500' : 'text-black hover:text-amber-600'}`}>Iniciar sesión</a>
              </p>
            </div>
          </div>
        )}

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
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700 group-hover:text-amber-500 transition-all border-b border-white/0 group-hover:border-amber-500/30 pb-0.5">
              Haz click aquí
            </span>
          </a>

          <div className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800 pt-2 flex items-center justify-center gap-2">
            <div className="w-4 h-px bg-zinc-900" />
            DIGITALIZANDO EN ARICA, CHILE 🇨🇱
            <div className="w-4 h-px bg-zinc-900" />
          </div>
        </footer>
      </div>
    </div>
  );
}
