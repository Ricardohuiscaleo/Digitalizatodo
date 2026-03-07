"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBranding } from "@/context/BrandingContext";
import { getTenantInfo, registerStudent } from "@/lib/api";
import Link from "next/link";
import { ChevronRight, Loader2, CheckCircle2, User, Mail, Phone, Users, Lock } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function TenantRegisterPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { branding, setBranding } = useBranding();
    const [loading, setLoading] = useState(false);
    const [identifying, setIdentifying] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        guardian_name: "",
        guardian_email: "",
        guardian_phone: "",
        password: "",
        password_confirmation: "",
        is_self_register: true,
        students: [{ name: "", category: "kids" }],
        plan_id: 1,
    });

    useEffect(() => {
        const loadTenant = async () => {
            if (!slug) return;
            const tenant = await getTenantInfo(slug as string);
            if (tenant && !tenant.message) {
                setBranding({
                    id: tenant.id,
                    name: tenant.name,
                    industry: tenant.industry,
                    logo: tenant.logo,
                    primaryColor: tenant.primary_color
                });
            } else {
                router.replace("/");
            }
            setIdentifying(false);
        };
        loadTenant();
    }, [slug, setBranding, router]);

    const addStudent = () => {
        setFormData({
            ...formData,
            students: [...formData.students, { name: "", category: "kids" }]
        });
    };

    const updateStudent = (index: number, field: string, value: string) => {
        const newStudents = [...formData.students];
        (newStudents[index] as any)[field] = value;
        setFormData({ ...formData, students: newStudents });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branding?.id) return;

        if (formData.password !== formData.password_confirmation) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await registerStudent(branding.id, formData);
            if (result.errors) {
                const firstError = Object.values(result.errors)[0] as string[];
                setError(firstError[0] || "Por favor revisa los datos ingresados.");
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError("Error al procesar el registro.");
        } finally {
            setLoading(false);
        }
    };

    if (identifying) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-gray-500 text-sm animate-pulse">Cargando academia...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white italic">¡Registro Exitoso!</h1>
                <p className="mt-4 text-gray-400">Bienvenido a la familia de <span className="text-white font-bold">{branding?.name}</span></p>
                <div className="mt-8 p-6 bg-[#111] border border-white/5 rounded-2xl max-w-sm">
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Tu cuenta ha sido creada. Ahora puedes ingresar con tu correo y tu número de teléfono como contraseña inicial.
                    </p>
                </div>
                <button
                    onClick={() => router.push(`/${branding?.id}`)}
                    className="mt-10 w-full max-w-xs h-14 rounded-2xl font-bold text-black shadow-xl transition-all active:scale-95"
                    style={{ backgroundColor: branding?.primaryColor }}
                >
                    Ir al Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center p-6 pb-20">
            <header className="w-full max-w-sm mb-10 text-center space-y-4 pt-8">
                <div className="inline-flex h-16 w-auto items-center justify-center overflow-hidden">
                    {branding?.logo ? (
                        <img src={branding.logo} alt={branding.name} className="h-full object-contain" />
                    ) : (
                        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl font-black text-white">
                            {branding?.name?.[0]}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Únete a {branding?.name}</h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Portal de Auto-Registro</p>
                </div>
            </header>

            <main className="w-full max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Identification Toggle */}
                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_self_register: true })}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                                formData.is_self_register ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-gray-400"
                            )}
                        >
                            Soy el Titular
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_self_register: false })}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all",
                                !formData.is_self_register ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-gray-400"
                            )}
                        >
                            Soy Apoderado
                        </button>
                    </div>

                    {/* Guardian Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">
                            {formData.is_self_register ? "Tus Datos Personales" : "Datos del Apoderado"}
                        </label>
                        <div className="space-y-3">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Nombre Completo"
                                    required
                                    className="w-full h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                    value={formData.guardian_name}
                                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="email"
                                    placeholder="Correo Electrónico"
                                    required
                                    className="w-full h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                    value={formData.guardian_email}
                                    onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="tel"
                                    placeholder="Teléfono (Móvil)"
                                    required
                                    className="w-full h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                    value={formData.guardian_phone}
                                    onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Seguridad de la Cuenta</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    required
                                    className="w-full h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="password"
                                    placeholder="Confirmar"
                                    required
                                    className="w-full h-14 bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Students Section */}
                    {!formData.is_self_register && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Alumnos a Inscribir</label>
                                <button
                                    type="button"
                                    onClick={addStudent}
                                    className="text-[10px] font-black uppercase"
                                    style={{ color: branding?.primaryColor }}
                                >
                                    + Añadir más
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.students.map((student, idx) => (
                                    <div key={idx} className="p-5 bg-white/[0.02] border border-white/[0.03] rounded-3xl space-y-4">
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                            <input
                                                type="text"
                                                placeholder="Nombre del Alumno"
                                                required
                                                className="w-full h-12 bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 text-sm text-white focus:outline-none transition-all"
                                                value={student.name}
                                                onChange={(e) => updateStudent(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="w-full h-12 bg-black/20 border border-white/5 rounded-xl px-4 text-xs font-bold text-gray-400 focus:outline-none appearance-none cursor-pointer"
                                            value={student.category}
                                            onChange={(e) => updateStudent(idx, 'category', e.target.value)}
                                        >
                                            <option value="kids">Kids (Niños)</option>
                                            <option value="teen">Teen (Jóvenes)</option>
                                            <option value="adults">Adults (Adultos)</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                            <p>{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-2xl text-black font-extrabold shadow-xl transition-all active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: branding?.primaryColor }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <span>Completar Registro</span>
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-gray-600">
                        ¿Ya tienes cuenta? <Link href={`/${branding?.id}`} className="text-white hover:underline">Inicia Sesión aquí</Link>
                    </p>
                </form>
            </main>
        </div>
    );
}
