"use client";

import React from 'react';
import { Search, Calendar, ChevronRight, CheckCircle2, QrCode } from 'lucide-react';
import { StudentAvatar } from './Industries/MartialArts/StudentAvatar';

interface AttendanceSectionProps {
    allStudents: any[];
    attendance: Set<string>;
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    attendanceHistory: any[];
    formatMoney: (n: number) => string;
    toggleAttendance: (studentId: string) => void;
    setSelectedHistoryDate: (d: string | null) => void;
    setShowQRModal: (s: boolean) => void;
    branding: any;
    vocab: any;
    activeSchedule: any;
}

const AttendanceSection: React.FC<AttendanceSectionProps> = ({
    allStudents,
    attendance,
    searchTerm,
    setSearchTerm,
    attendanceHistory,
    formatMoney,
    toggleAttendance,
    setSelectedHistoryDate,
    setShowQRModal,
    branding,
    vocab,
    activeSchedule
}) => {
    const [isSmartFilterEnabled, setIsSmartFilterEnabled] = React.useState(true);

    // Lógica de filtrado con Smart Filter
    const filteredStudents = allStudents.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (activeSchedule && isSmartFilterEnabled) {
            // El horario tiene category (Adulto/Kids)
            // El alumno tiene category (adult/kids o similar)
            const scheduleCat = activeSchedule.category?.toLowerCase();
            const studentCat = s.category?.toLowerCase();
            
            // Mapeo simple de categorías
            if (scheduleCat === 'adulto' && studentCat === 'adulto') return true;
            if (scheduleCat === 'kids' && studentCat === 'kids') return true;
            
            return false;
        }

        return true;
    });

    const getBeltStyle = (label: string) => {
        const lower = label.toLowerCase();
        if (lower.includes('blanco')) return { bg: 'bg-zinc-100', text: 'text-zinc-900', border: 'border-zinc-300' };
        if (lower.includes('azul')) return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' };
        if (lower.includes('morado')) return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700' };
        if (lower.includes('marrón') || lower.includes('marron') || lower.includes('café')) return { bg: 'bg-[#5d3a1a]', text: 'text-white', border: 'border-[#4a2e15]' };
        if (lower.includes('negro')) return { bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-950' };
        return { bg: 'bg-zinc-100', text: 'text-zinc-500', border: 'border-zinc-200' };
    };

    return (
        <div className="space-y-4 px-0 pb-32">
            {/* Buscador Neumórfico con Profundidad */}
            <div className="relative group focus-within:scale-[1.01] transition-all duration-300">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 group-focus-within:text-zinc-950 text-zinc-300 transition-colors z-10" size={20} />
                <input
                    type="text"
                    placeholder="Buscar participante..."
                    className="w-full bg-white pl-16 pr-6 py-3 rounded-[2.5rem] text-base font-black text-zinc-950 placeholder:text-zinc-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none transition-all duration-300 shadow-[8px_8px_16px_#e5e5e5,-8px_-8px_16px_#ffffff] focus:shadow-[inset_4px_4px_8px_#e5e5e5,inset_-4px_-4px_8px_#ffffff] border-2 border-zinc-100 focus:border-zinc-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <button
                onClick={() => setShowQRModal(true)}
                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                className="w-full text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md border-b-4 border-black/20 transition-all active:scale-95 active:border-b-0"
            >
                <QrCode size={20} className="text-white" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">ACTIVAR ASISTENCIA DINÁMICA QR</span>
            </button>

            {/* Banner de Clase Activa */}
            {activeSchedule && (
                <div className="bg-[#0f0f10] border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Clase en curso</p>
                            <p className="text-sm font-black text-white uppercase">{activeSchedule.name}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsSmartFilterEnabled(!isSmartFilterEnabled)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isSmartFilterEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                        {isSmartFilterEnabled ? 'Filtro ON' : 'Filtro OFF'}
                    </button>
                </div>
            )}

            {/* VISTA DESKTOP: TABLA */}
            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Participante</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoría / Rango</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Estado Hoy</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                        {filteredStudents.map(student => {
                            const isPresent = attendance.has(String(student.id));
                            return (
                                <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-black text-zinc-900 uppercase">
                                        <div className="flex items-center gap-3">
                                            <img src={student.photo} className="w-10 h-10 rounded-full object-cover border border-zinc-100" />
                                            <span>{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-500">
                                        {student.label && branding?.industry === 'martial_arts' ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border ${getBeltStyle(student.label).bg} ${getBeltStyle(student.label).text} ${getBeltStyle(student.label).border}`}>
                                                    {student.label}
                                                </span>
                                                {student.degrees > 0 && (
                                                    <span className="text-[10px] font-black text-amber-500">
                                                        {'|'.repeat(student.degrees)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">
                                                {student.category === 'kids' ? vocab?.cat1 : student.category === 'adult' ? vocab?.cat2 : student.category || ''}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isPresent ? (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle2 size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Presente</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Ausente</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleAttendance(student.id)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isPresent ? 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200' : 'bg-emerald-500 text-white shadow-md shadow-emerald-100'}`}
                                        >
                                            {isPresent ? 'Quitar' : 'Marcar'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* VISTA MOBILE: GRID DE TARJETAS */}
            <div className="grid grid-cols-3 gap-3 md:hidden">
                {filteredStudents.map(student => {
                    const isPresent = attendance.has(String(student.id));
                    return (
                        <div key={student.id} className="relative">
                            <button
                                onClick={() => toggleAttendance(student.id)}
                                className={`relative flex flex-col items-center p-3 rounded-2xl transition-all w-full ${isPresent ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-400 shadow-lg scale-105 z-10' : 'bg-white shadow-sm border border-zinc-100 active:scale-95'
                                    }`}
                            >
                                <StudentAvatar
                                        photo={student.photo}
                                        name={student.name}
                                        size={64}
                                        ring={isPresent ? 'ring-emerald-400 bg-zinc-100' : 'ring-zinc-200 bg-zinc-100'}
                                        beltRank={student.belt_rank}
                                        degrees={student.degrees ?? 0}
                                        payerStatus={student.payerStatus}
                                        showPayerDot={!isPresent}
                                        isDark={false}
                                    />
                                <p className={`font-black text-[9px] text-center leading-tight line-clamp-2 w-full uppercase mt-1 ${isPresent ? 'text-emerald-900' : 'text-zinc-800'}`}>
                                    {student.name.split(' ')[0]}
                                </p>
                                {student.label && branding?.industry === 'martial_arts' && (
                                    <div className="mt-1 flex items-center gap-0.5">
                                        <div className={`w-3 h-1.5 rounded-sm border-[0.5px] ${getBeltStyle(student.label).bg} ${getBeltStyle(student.label).border}`}></div>
                                        {student.degrees > 0 && <span className="text-[7px] font-black text-zinc-400">{student.degrees}</span>}
                                    </div>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AttendanceSection;
