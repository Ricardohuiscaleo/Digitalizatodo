"use client";

import { useState, useEffect } from "react";
import { useBranding } from "@/context/BrandingContext";
import { identifyTenant, registerStudent } from "@/lib/api";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function RegisterPage() {
    const { branding, setBranding } = useBranding();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [identifying, setIdentifying] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        guardian_name: "",
        guardian_email: "",
        guardian_phone: "",
        students: [{ name: "", category: "kids" }],
        plan_id: 1, // Por ahora fijo, luego debería ser dinámico
    });

    const handleEmailBlur = async () => {
        if (!formData.guardian_email || identifying) return;
        setIdentifying(true);
        const data = await identifyTenant(formData.guardian_email);
        if (data?.found && data.tenants.length > 0) {
            const t = data.tenants[0];
            setBranding({
                id: t.id,
                slug: t.slug,
                name: t.name,
                logo: t.logo,
                primaryColor: t.primary_color || "#3b82f6",
            });
        }
        setIdentifying(false);
    };

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
        if (!branding?.id) {
            setError("No se pudo identificar la cuenta para este correo.");
            return;
        }

        setLoading(true);
        setError("");

        const result = await registerStudent(String(branding.id), formData);
        setLoading(false);

        if (result.errors) {
            setError("Por favor revisa los datos ingresados.");
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-background shadow-2xl shadow-emerald-500/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">¡Registro Exitoso!</h1>
                <p className="mt-4 text-foreground/60 italic">"Bienvenido a la familia de {branding?.name}"</p>
                <p className="mt-4 text-xs text-foreground/40 max-w-xs mx-auto">Tu cuenta ha sido creada. Ahora puedes ingresar con tu correo y tu número de teléfono como contraseña inicial.</p>
                <Link
                    href="/"
                    className="mt-12 w-full max-w-xs rounded-2xl bg-primary py-4 text-sm font-bold text-background shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all outline-none"
                    style={{ backgroundColor: branding?.primaryColor }}
                >
                    Ir al Login
                </Link>
            </div>
        );
    }

    if (!branding?.id && !identifying && formData.guardian_email === "") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
                <div className="w-full max-w-[480px] space-y-8 text-center">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/20 text-indigo-400 font-bold text-3xl">D</div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white tracking-tight">Elegir Tipo de Registro</h1>
                        <p className="text-gray-500">Parece que estás en la página principal. ¿Qué deseas hacer?</p>
                    </div>

                    <div className="grid gap-4">
                        <Link
                            href="/onboarding"
                            className="p-6 bg-[#111] border border-white/5 rounded-2xl text-left hover:border-indigo-500/50 transition-all group active:scale-95"
                        >
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                Soy Dueño de Negocio <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </h3>
                            <p className="text-gray-500 text-xs mt-1">Quiero registrar mi institución, centro o negocio y administrar el sistema.</p>
                        </Link>

                        <div className="p-6 bg-white/[0.02] border border-white/[0.03] rounded-2xl text-left opacity-60">
                            <h3 className="text-gray-400 font-bold text-lg">Soy Alumno / Apoderado</h3>
                            <p className="text-gray-600 text-xs mt-1">Para registrarte, debes usar el enlace único que te proporcionó tu institución (ej: digitalizatodo.cl/tu-institucion).</p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-600">
                        ¿Tienes dudas? <a href="https://digitalizatodo.cl" className="underline hover:text-white transition-colors">Volver a la Landing</a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background p-6">
            <header className="mb-8 flex flex-col items-center gap-4 pt-8">
                {branding?.logo ? (
                    <img src={branding.logo} alt={branding.name} className="h-16 w-auto" />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-4xl font-black text-primary" style={{ color: branding?.primaryColor, backgroundColor: `${branding?.primaryColor}20` }}>
                        {branding?.name?.[0] || 'D'}
                    </div>
                )}
                <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Únete a {branding?.name || 'Digitaliza Todo'}</h1>
                    <p className="text-xs font-medium text-foreground/40 uppercase tracking-widest mt-1">Auto-Registro de Alumnos</p>
                </div>
            </header>

            <main className="mx-auto w-full max-w-sm flex-1">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-20">
                    {/* Guardian Info */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 px-1">Datos del Apoderado</label>
                        <input
                            type="text"
                            placeholder="Nombre Completo"
                            required
                            className="h-14 rounded-2xl bg-white/5 px-6 text-sm outline-none transition-all hover:bg-white/10 focus:ring-2 focus:ring-primary/50"
                            value={formData.guardian_name}
                            onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                        />
                        <input
                            type="email"
                            placeholder="Correo Electrónico"
                            required
                            onBlur={handleEmailBlur}
                            className={`h-14 rounded-2xl bg-white/5 px-6 text-sm outline-none transition-all hover:bg-white/10 focus:ring-2 focus:ring-primary/50 ${identifying ? 'opacity-50' : ''}`}
                            value={formData.guardian_email}
                            onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                        />
                        <input
                            type="tel"
                            placeholder="Teléfono (Ej: +569...)"
                            required
                            className="h-14 rounded-2xl bg-white/5 px-6 text-sm outline-none transition-all hover:bg-white/10 focus:ring-2 focus:ring-primary/50"
                            value={formData.guardian_phone}
                            onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                        />
                    </div>

                    {/* Students Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">Alumnos a Inscribir</label>
                            <button type="button" onClick={addStudent} className="text-[10px] font-black uppercase text-primary" style={{ color: branding?.primaryColor }}>+ Añadir</button>
                        </div>
                        {formData.students.map((student, idx) => (
                            <div key={idx} className="flex flex-col gap-2 rounded-3xl border border-white/5 bg-white/5 p-4">
                                <input
                                    type="text"
                                    placeholder="Nombre del Alumno"
                                    required
                                    className="h-12 rounded-xl bg-background/50 px-4 text-sm outline-none border border-white/5"
                                    value={student.name}
                                    onChange={(e) => updateStudent(idx, 'name', e.target.value)}
                                />
                                <select
                                    className="h-12 rounded-xl bg-background/50 px-4 text-xs font-bold outline-none border border-white/5 text-foreground/60"
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

                    {error && (
                        <div className="rounded-2xl bg-red-500/10 p-4 text-center text-xs font-bold text-red-500">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || identifying}
                        className="h-16 rounded-2xl bg-primary text-sm font-bold text-background shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: branding?.primaryColor }}
                    >
                        {loading ? "Registrando..." : "Completar Registro"}
                    </button>

                    <p className="text-center text-[10px] text-foreground/30">
                        ¿Ya tienes cuenta? <Link href="/" className="font-bold text-foreground/60 transition-colors hover:text-foreground">Inicia Sesión</Link>
                    </p>
                </form>
            </main>
        </div>
    );
}
