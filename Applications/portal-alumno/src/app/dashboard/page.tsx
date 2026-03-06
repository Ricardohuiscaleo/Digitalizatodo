"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";
import { getProfile, initiatePayment, getPayments } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

export default function DashboardPage() {
    const { branding, setBranding } = useBranding();
    const [data, setData] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("student_token");
        const tenantId = localStorage.getItem("tenant_id");

        if (!token || !tenantId) {
            window.location.href = "/";
            return;
        }

        const fetchData = async () => {
            const [profile, paymentsData] = await Promise.all([
                getProfile(tenantId, token),
                getPayments(tenantId, token)
            ]);

            if (profile) {
                setData(profile);
                setPayments(paymentsData?.payments || []);
            } else {
                // Token inválido o error
                localStorage.removeItem("student_token");
                window.location.href = "/";
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    const handlePayNow = async () => {
        if (payments.length === 0) return;

        const token = localStorage.getItem("student_token");
        const tenantId = localStorage.getItem("tenant_id");
        if (!token || !tenantId) return;

        setIsPaying(true);
        const result = await initiatePayment(tenantId, payments[0].id, token);
        setIsPaying(false);

        if (result && result.payment_url) {
            window.location.href = result.payment_url;
        }
    };

    if (loading || !data) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    const { guardian, students, total_due } = data;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header / Nav */}
            <header className="sticky top-0 z-10 border-b border-white/5 bg-background/80 p-4 backdrop-blur-lg">
                <div className="mx-auto flex max-w-lg items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-primary/10">
                            <Image
                                src={branding?.logo || "/icon.webp"}
                                alt="Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-foreground">{branding?.name}</h2>
                            <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-medium">Portal Alumno</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.href = "/";
                        }}
                        className="rounded-full bg-white/5 p-2 text-foreground/60 hover:bg-white/10 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-lg space-y-6 p-4 pt-8">
                {/* Welcome Section */}
                <section className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Hola, {guardian.name.split(' ')[0]} 👋</h1>
                    <p className="text-sm text-foreground/50">Bienvenido a tu panel de control.</p>
                </section>

                {/* Financial Summary Card */}
                <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-background shadow-xl shadow-primary/20">
                    <div className="relative z-10 flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total por Pagar</span>
                        <h3 className="text-3xl font-black tracking-tighter">${total_due.toLocaleString()}</h3>
                        <button
                            onClick={handlePayNow}
                            disabled={isPaying || payments.length === 0}
                            className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-background/10 py-2.5 text-xs font-bold transition-all hover:bg-background/20 disabled:opacity-50"
                        >
                            {isPaying ? "Procesando..." : "Pagar Ahora"}
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </button>
                    </div>
                    {/* Subtle pattern or glow */}
                    <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
                </section>

                {/* My Students */}
                <section className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/40 ml-1">Mis Alumnos</h4>
                    <div className="grid gap-4">
                        {students.map((student: any) => (
                            <div key={student.id} className="group relative flex items-center gap-4 rounded-3xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 active:scale-[0.98]">
                                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white/5 shadow-inner">
                                    {student.photo ? (
                                        <Image src={student.photo} alt={student.name} fill className="object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary/40">
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-sm font-bold text-foreground">{student.name}</h5>
                                    <p className="text-[10px] font-medium text-foreground/40">{student.category}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {student.pending_payments > 0 ? (
                                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[8px] font-black uppercase text-red-500 border border-red-500/20">
                                            {student.pending_payments} pendiente(s)
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-500 border border-emerald-500/20">
                                            Al día
                                        </span>
                                    )}
                                    {/* Attendance dots */}
                                    <div className="flex gap-1 mt-1">
                                        {student.recent_attendance?.map((att: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 w-1.5 rounded-full ${att.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'
                                                    }`}
                                                title={att.date}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Actions / Bottom Links */}
                <section className="grid grid-cols-2 gap-4">
                    <Link href="/dashboard/attendance" className="flex flex-col items-center gap-3 rounded-3xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 active:scale-95">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Asistencia</span>
                    </Link>
                    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /><path d="M12 2v20" /><path d="M4 19h16" /></svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Notas</span>
                    </div>
                </section>
            </main>

            {/* Bottom Floating Bar (Mobile Navigation Feel) */}
            <nav className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-8 rounded-full border border-white/10 bg-background/60 px-8 py-4 backdrop-blur-2xl shadow-2xl">
                <button className="text-primary transition-transform active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </button>
                <button className="text-foreground/40 hover:text-foreground transition-all active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="m11 9 3 3-3 3" /><path d="M15 12H9" /></svg>
                </button>
                <button className="text-foreground/40 hover:text-foreground transition-all active:scale-90">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </button>
            </nav>
        </div>
    );
}
