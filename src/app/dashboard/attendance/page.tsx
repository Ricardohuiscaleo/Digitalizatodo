"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";
import { getAttendanceHistory } from "@/lib/api";
import Link from "next/link";

export default function AttendanceHistoryPage() {
    const { branding } = useBranding();
    const [attendances, setAttendances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("student_token");
        const tenantId = localStorage.getItem("tenant_id");

        if (!token || !tenantId) {
            window.location.href = "/";
            return;
        }

        const fetchData = async () => {
            const data = await getAttendanceHistory(tenantId, token);
            if (data && data.attendances) {
                setAttendances(data.attendances);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-10 border-b border-white/5 bg-background/80 p-4 backdrop-blur-lg">
                <div className="mx-auto flex max-w-lg items-center gap-4">
                    <Link href="/dashboard" className="rounded-full bg-white/5 p-2 text-foreground/60 hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Historial de Asistencia</h1>
                </div>
            </header>

            <main className="mx-auto max-w-lg space-y-6 p-4 pt-8">
                {attendances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                        <p className="text-sm font-medium">No hay registros de asistencia a&uacute;n.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {attendances.map((att) => (
                            <div key={att.id} className="flex items-center justify-between rounded-3xl border border-white/5 bg-white/5 p-5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-black uppercase tracking-widest text-foreground/30">
                                        {new Date(att.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                    <h3 className="text-sm font-bold text-foreground">{att.student_name}</h3>
                                    {att.notes && <p className="text-[10px] text-foreground/40 italic mt-1">"{att.notes}"</p>}
                                </div>
                                <div className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter border ${att.status === 'present'
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                    {att.status === 'present' ? 'Presente' : 'Ausente'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
