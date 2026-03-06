"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTenantInfo, getPlans, registerStudent } from "@/lib/api";
import { useBranding } from "@/context/BrandingContext";
import Link from "next/link";
import Image from "next/image";

export default function TenantRegisterPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.tenant as string;
    const { setBranding } = useBranding();

    const [tenantInfo, setTenantInfo] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        guardian_name: "",
        guardian_email: "",
        guardian_phone: "",
        students: [{ name: "", category: "adults" }],
        plan_id: "",
    });

    useEffect(() => {
        if (!tenantId) return;

        async function loadData() {
            setLoading(true);
            const [info, availablePlans] = await Promise.all([
                getTenantInfo(tenantId),
                getPlans(tenantId)
            ]);

            if (info) {
                setTenantInfo(info);
                setBranding({
                    id: info.id,
                    name: info.name,
                    industry: info.industry,
                    logo: info.logo,
                    primaryColor: info.primary_color
                });
            } else {
                setError("La academia no existe o no se pudo cargar info.");
            }

            if (availablePlans) {
                setPlans(availablePlans);
                if (availablePlans.length > 0) {
                    setFormData(prev => ({ ...prev, plan_id: availablePlans[0].id }));
                }
            }
            setLoading(false);
        }

        loadData();
    }, [tenantId]);

    const addStudent = () => {
        setFormData({
            ...formData,
            students: [...formData.students, { name: "", category: "adults" }]
        });
    };

    const updateStudent = (index: number, field: string, value: string) => {
        const newStudents = [...formData.students];
        (newStudents[index] as any)[field] = value;
        setFormData({ ...formData, students: newStudents });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;

        setSubmitting(true);
        setError("");

        const result = await registerStudent(tenantId, formData);
        setSubmitting(false);

        if (result.errors) {
            setError(Object.values(result.errors).flat().join(", "));
        } else if (result.message === 'Registro exitoso.') {
            setSuccess(true);
        } else {
            setError(result.message || "Error al registrar.");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background animate-in fade-in duration-500">
                <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-background shadow-2xl shadow-emerald-500/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">¡Ya estás registrado!</h1>
                <p className="mt-4 text-foreground/60 italic">Bienvenido a {tenantInfo?.name}</p>
                <p className="mt-6 text-sm text-foreground/40 max-w-xs mx-auto">Tu cuenta ha sido creada exitosamente. Ahora puedes gestionar tus pagos y asistencias.</p>

                <Link
                    href="/"
                    className="mt-12 w-full max-w-xs rounded-2xl bg-primary py-4 text-sm font-bold text-background shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all outline-none"
                    style={{ backgroundColor: tenantInfo?.primary_color }}
                >
                    Ir a Gestionar mi Cuenta
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background p-6 bg-gradient-to-b from-background to-primary/5">
            <header className="mb-8 flex flex-col items-center gap-4 pt-8">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                    {tenantInfo?.logo ? (
                        <Image src={tenantInfo.logo} alt={tenantInfo.name} fill className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-black text-2xl" style={{ color: tenantInfo?.primary_color, backgroundColor: `${tenantInfo?.primary_color}20` }}>
                            D
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">Inscríbete en {tenantInfo?.name}</h1>
                    <div className="inline-block mt-1 px-3 py-1 rounded-full border border-primary/10 bg-primary/5 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                        {tenantInfo?.industry === 'Escuela de Artes Marciales' ? 'ALUMNOS Y FAMILIAS' : 'CLIENTES'}
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-sm flex-1">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-20">
                    {/* Guardian Info */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 px-1 italic">Tus Datos de Contacto</label>
                        <input
                            type="text"
                            placeholder="Tu Nombre Completo"
                            required
                            className="h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                            value={formData.guardian_name}
                            onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                        />
                        <input
                            type="email"
                            placeholder="Tu Correo Electrónico"
                            required
                            className="h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                            value={formData.guardian_email}
                            onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                        />
                        <input
                            type="tel"
                            placeholder="Tu Teléfono (WhatsApp)"
                            required
                            className="h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                            value={formData.guardian_phone}
                            onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                        />
                    </div>

                    {/* Students Info */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 italic">¿Quién entrena?</label>
                            <button type="button" onClick={addStudent} className="text-[10px] font-black uppercase text-primary" style={{ color: tenantInfo?.primary_color }}>+ Añadir Alumno</button>
                        </div>
                        {formData.students.map((student, idx) => (
                            <div key={idx} className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-white/5 p-5">
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

                    {/* Plan Selection */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 px-1 italic">Selecciona un Plan</label>
                        <select
                            className="h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                            value={formData.plan_id}
                            required
                            onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                        >
                            {plans.map(plan => (
                                <option key={plan.id} value={plan.id} className="bg-background">
                                    {plan.name} - ${Number(plan.price).toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="rounded-2xl bg-red-500/10 p-4 text-center text-xs font-bold text-red-500 animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="h-16 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest text-background shadow-xl shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: tenantInfo?.primary_color }}
                    >
                        {submitting ? "Procesando..." : "Completar Inscripción"}
                    </button>

                    <p className="text-center text-[10px] text-foreground/30">
                        ¿Ya estás inscrito? <Link href="/" className="font-bold text-foreground/60 transition-colors hover:text-foreground underline">Inicia Sesión en Mi Cuenta</Link>
                    </p>
                </form>
            </main>
        </div>
    );
}
