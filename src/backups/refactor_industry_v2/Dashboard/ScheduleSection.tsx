"use client";

import React from 'react';
import WeeklySchedule from "@/components/Schedule/WeeklySchedule";
import { createSchedule, updateSchedule, deleteSchedule } from "@/lib/api";

interface ScheduleSectionProps {
    schedulesLoading: boolean;
    schedulesList: any[];
    branding: any;
    token: string | null;
    loadSchedules: () => Promise<void>;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
    schedulesLoading,
    schedulesList,
    branding,
    token,
    loadSchedules
}) => {
    return (
        <div className="space-y-4 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-zinc-900">Horario de Clases</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Toca una celda para editar</p>
                </div>
            </div>
            {schedulesLoading ? (
                <div className="flex justify-center py-12"><span className="animate-spin text-zinc-300">&#9696;</span></div>
            ) : (
                <div className="bg-white rounded-[20px] p-4 border border-zinc-100 shadow-sm">
                    <WeeklySchedule
                        schedules={schedulesList}
                        editable
                        onSave={async (entry) => {
                            await createSchedule(branding?.slug || '', token || '', entry);
                            await loadSchedules();
                        }}
                        onUpdate={async (id, entry) => {
                            await updateSchedule(branding?.slug || '', token || '', id, entry);
                            await loadSchedules();
                        }}
                        onDelete={async (id) => {
                            await deleteSchedule(branding?.slug || '', token || '', id);
                            await loadSchedules();
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default ScheduleSection;
