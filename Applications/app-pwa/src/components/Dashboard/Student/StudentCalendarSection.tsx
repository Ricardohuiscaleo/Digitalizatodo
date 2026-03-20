import React from "react";
import WeeklySchedule from "@/components/Schedule/WeeklySchedule";
import StudentCalendar from "@/components/Calendar/StudentCalendar";

interface StudentCalendarSectionProps {
    branding: any;
    schedulesList: any[];
    students: any[];
    primaryColor: string;
    isSchoolTreasury?: boolean;
}

export function StudentCalendarSection({
    branding,
    schedulesList,
    students,
    primaryColor,
    isSchoolTreasury
}: StudentCalendarSectionProps) {
    // school_treasury: mostrar horario de clases
    if (isSchoolTreasury) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                <div>
                    <h2 className="text-2xl font-black text-zinc-900">Mi Horario</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Horario semanal de clases</p>
                </div>
                <div className="bg-white rounded-[20px] p-4 border border-zinc-100 shadow-sm">
                    {schedulesList.length === 0 ? (
                        <p className="text-center text-xs text-zinc-300 py-8 font-bold">Sin horario cargado aún</p>
                    ) : (
                        <WeeklySchedule key={schedulesList.length + schedulesList.map(s=>s.id).join(',')} schedules={schedulesList} editable={false} />
                    )}
                </div>
            </div>
        );
    }

    // Otros: calendario de asistencia
    const combinedAttendance = students.flatMap((s: any) =>
        (s.recent_attendance || []).map((a: any) => ({
            ...a,
            studentName: s.name,
            studentPhoto: s.photo,
            studentCategory: s.category
        }))
    );
    
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
            <header className="mb-4 shrink-0 px-1">
                <h2 className="text-2xl font-black text-zinc-900">Asistencia</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Actividad de todos tus alumnos</p>
            </header>
            <div className="flex-1 min-h-0">
                <StudentCalendar attendance={combinedAttendance} primaryColor={primaryColor} />
            </div>
        </div>
    );
}
