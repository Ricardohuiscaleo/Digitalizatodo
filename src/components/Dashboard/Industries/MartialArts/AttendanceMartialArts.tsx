"use client";

import React from 'react';
import { Search, Calendar, ChevronRight, CheckCircle2, QrCode } from 'lucide-react';
import { getBeltColor } from '@/lib/industryUtils';

interface AttendanceMartialArtsProps {
    allStudents: any[];
    attendance: Set<string>;
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    attendanceHistory: any[];
    toggleAttendance: (studentId: string) => void;
    setSelectedHistoryDate: (d: string | null) => void;
    setShowQRModal: (s: boolean) => void;
    branding: any;
    vocab: any;
}

/**
 * Vista de Asistencia/Tatami especializada para Artes Marciales (Martial Arts)
 * Incluye visualización de cinturones (grados) y foco en asistencia QR.
 */
const AttendanceMartialArts: React.FC<AttendanceMartialArtsProps> = ({
    allStudents,
    attendance,
    searchTerm,
    setSearchTerm,
    attendanceHistory,
    toggleAttendance,
    setSelectedHistoryDate,
    setShowQRModal,
    branding,
    vocab
}) => {
    const filteredStudents = allStudents.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="space-y-4 px-0 pb-32">
            {/* Buscador de Alumnos */}
            <div className="relative group focus-within:scale-[1.01] transition-all duration-300">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 group-focus-within:text-zinc-950 text-zinc-300 transition-colors z-10" size={20} />
                <input
                    type="text"
                    placeholder={`Buscar ${vocab.memberLabel.toLowerCase()}...`}
                    className="w-full bg-white pl-16 pr-6 py-3 rounded-[2.5rem] text-base font-black text-zinc-950 placeholder:text-zinc-300 placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none transition-all duration-300 shadow-[8px_8px_16px_#e5e5e5,-8px_-8px_16px_#ffffff] focus:shadow-[inset_4px_4px_8px_#e5e5e5,inset_-4px_-4px_8px_#ffffff] border-2 border-zinc-100 focus:border-zinc-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Activación de QR para el Dojo */}
            <button
                onClick={() => setShowQRModal(true)}
                style={{ backgroundColor: branding?.primaryColor || '#6366f1' }}
                className="w-full text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md border-b-4 border-black/20 transition-all active:scale-95 active:border-b-0"
            >
                <QrCode size={20} className="text-white" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">ACTIVAR ASISTENCIA DINÁMICA {vocab.unitLabel.toUpperCase()}</span>
            </button>

            {/* VISTA DESKTOP: TABLA DE TATAMI */}
            <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">{vocab.memberLabel}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Grado / Cinturón</th>
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
                                            <div className="flex flex-col">
                                                <span>{student.name}</span>
                                                {student.consumable_credits > 0 && (
                                                    <span className="text-[8px] text-[#c9a84c] font-black tracking-widest flex items-center gap-1 mt-0.5">
                                                        <span className="text-[10px]">★</span> {student.consumable_credits} SESIONES VIP
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-500">
                                        {student.label ? (
                                            <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest ${getBeltColor(student.label)}`}>{student.label}</span>
                                        ) : (
                                            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Sin Grado</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isPresent ? (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle2 size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">En el {vocab.unitLabel}</span>
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

            {/* VISTA MOBILE: GRID DE TATAMI */}
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
                                <div className="relative mb-2">
                                    <img
                                        src={student.photo}
                                        alt={student.name}
                                        className={`w-16 h-16 rounded-full object-cover transition-all ${isPresent ? 'ring-4 ring-emerald-400' : ''}`}
                                    />
                                    {isPresent && (
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-emerald-50 shadow-lg">
                                            <CheckCircle2 className="text-white" size={16} />
                                        </div>
                                    )}
                                    {!isPresent && student.payerStatus && student.payerStatus !== 'paid' && (
                                        <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow ${
                                            student.payerStatus === 'review' ? 'bg-amber-400' : 'bg-rose-500'
                                        }`} />
                                    )}
                                </div>
                                <p className={`font-black text-[9px] text-center leading-tight line-clamp-2 w-full uppercase mt-1 ${isPresent ? 'text-emerald-900' : 'text-zinc-800'}`}>
                                    {student.name.split(' ')[0]}
                                </p>
                                {student.label && (
                                    <div className={`mt-1.5 w-full h-1 rounded-full ${getBeltColor(student.label)}`} />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Historial de Tatami */}
            {attendanceHistory.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <Calendar size={18} className="text-zinc-400" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-900">Pasados por el {vocab.unitLabel}</h3>
                    </div>
                    <div className="space-y-3">
                        {Array.from(new Map(attendanceHistory.map((d: any) => [d.date, d])).values()).map((day: any) => (
                            <div 
                                key={day.date}
                                className="bg-white border border-zinc-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
                                onClick={() => setSelectedHistoryDate(day.date)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black text-zinc-900 uppercase">{day.date_formatted}</p>
                                        <p className="text-[10px] text-zinc-400 font-bold mt-0.5 uppercase">
                                            {day.total_present} Entrenaron • {day.total_students} Total
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-zinc-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceMartialArts;
