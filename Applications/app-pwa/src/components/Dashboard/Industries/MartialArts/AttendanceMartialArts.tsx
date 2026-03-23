"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle2, QrCode, Edit2, X, Save, Loader2, User, MoreHorizontal, Users, UserCheck, UserX } from 'lucide-react';
import { BeltDisplay } from './BeltDisplay';
import { BeltBadge } from './BeltBadge';
import { updateStudentBjj, updateStudentProfile } from '@/lib/api';

const BELT_OPTIONS = [
    { value: 'white', label: 'Blanco' },
    { value: 'blue', label: 'Azul' },
    { value: 'purple', label: 'Morado' },
    { value: 'brown', label: 'Café' },
    { value: 'black', label: 'Negro' },
];

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
    token: string | null;
    onStudentUpdated?: () => void;
    isDark?: boolean;
}

const AttendanceMartialArts: React.FC<AttendanceMartialArtsProps> = ({
    allStudents, attendance, searchTerm, setSearchTerm,
    toggleAttendance, setShowQRModal, branding, vocab,
    token, onStudentUpdated, isDark = false
}) => {
    const filteredStudents = allStudents.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [bjjForm, setBjjForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<{ label: string; from: string; to: string }[] | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const promoteRef = useRef(false);
    const dragStartY = useRef<number | null>(null);
    const dragDelta = useRef(0);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const presentCount = allStudents.filter(s => attendance.has(String(s.id))).length;

    const displayedStudents = filteredStudents.filter(s => {
        if (filter === 'present') return attendance.has(String(s.id));
        if (filter === 'absent') return !attendance.has(String(s.id));
        return true;
    });

    const BELT_LABELS: Record<string, string> = { white: 'Blanco', blue: 'Azul', purple: 'Morado', brown: 'Café', black: 'Negro' };
    const MODALITY_LABELS: Record<string, string> = { gi: 'Gi', nogi: 'No-Gi', both: 'Ambos' };
    const CATEGORY_LABELS: Record<string, string> = { adults: 'Adulto', kids: 'Infantil' };

    const openEdit = (student: any) => {
        setEditingStudent(student);
        setPendingChanges(null);
        setBjjForm({
            name: student.name || '',
            phone: student.phone || '',
            belt_rank: student.belt_rank || '',
            degrees: student.degrees ?? 0,
            gender: student.gender || '',
            weight: student.weight || '',
            height: student.height || '',
            modality: student.modality || 'gi',
            category: student.category || 'adults',
            previous_classes: student.previous_classes ?? 0,
        });
    };

    const buildChangeSummary = () => {
        if (!editingStudent) return [];
        const changes: { label: string; from: string; to: string }[] = [];
        const fields: [string, string, (v: any) => string][] = [
            ['name', 'Nombre', v => v],
            ['phone', 'Teléfono', v => v || '—'],
            ['belt_rank', 'Cinturón', v => BELT_LABELS[v] || v || '—'],
            ['degrees', 'Rayas', v => String(v)],
            ['category', 'Categoría', v => CATEGORY_LABELS[v] || v],
            ['modality', 'Modalidad', v => MODALITY_LABELS[v] || v],
            ['previous_classes', 'Clases anteriores', v => String(v ?? 0)],
            ['weight', 'Peso (kg)', v => v ? `${v} kg` : '—'],
            ['height', 'Altura (m)', v => v ? `${v} m` : '—'],
        ];
        for (const [key, label, fmt] of fields) {
            const from = fmt(editingStudent[key] ?? '');
            const to = fmt(bjjForm[key] ?? '');
            if (from !== to) changes.push({ label, from, to });
        }
        return changes;
    };

    const handleRequestSave = (promote: boolean) => {
        const changes = buildChangeSummary();
        if (promote) changes.push({ label: 'Promoción', from: '—', to: '✓ Promover cinturón' });
        setPendingChanges(changes.length > 0 ? changes : [{ label: 'Sin cambios', from: '', to: '' }]);
        promoteRef.current = promote;
    };

    const handleConfirmSave = async () => {
        if (!editingStudent || !branding?.slug || !token) return;
        const promote = promoteRef.current;
        setSaving(true);
        const { name, phone, previous_classes, ...bjjData } = bjjForm;
        await Promise.all([
            updateStudentProfile(branding.slug, token, editingStudent.id, { name, phone }),
            updateStudentBjj(branding.slug, token, editingStudent.id, { ...bjjData, previous_classes, promote }),
        ]);
        setSaving(false);
        setPendingChanges(null);
        setEditingStudent(null);
        onStudentUpdated?.();
    };

    // Swipe to close
    const onTouchStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; dragDelta.current = 0; };
    const onTouchMove = (e: React.TouchEvent) => {
        if (dragStartY.current === null) return;
        dragDelta.current = e.touches[0].clientY - dragStartY.current;
        if (dragDelta.current > 0 && sheetRef.current) {
            sheetRef.current.style.transform = `translateY(${dragDelta.current}px)`;
        }
    };
    const onTouchEnd = () => {
        if (dragDelta.current > 100) { setEditingStudent(null); setPendingChanges(null); }
        else if (sheetRef.current) sheetRef.current.style.transform = '';
        dragStartY.current = null;
        dragDelta.current = 0;
    };

    const primary = branding?.primaryColor || '#6366f1';

    return (
        <div className="space-y-4 px-0 pb-32">

            {/* Header con contador */}
            <div className={`rounded-[2rem] p-5 border flex items-center justify-between ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
                <div>
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {vocab.unitLabel} hoy
                    </p>
                    <p className={`text-3xl font-black tracking-tighter leading-none mt-0.5 ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                        {presentCount}
                        <span className={`text-sm font-black ml-1 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>
                            / {allStudents.length}
                        </span>
                    </p>
                </div>
                <button
                    onClick={() => setShowQRModal(true)}
                    className="flex flex-col items-center justify-center gap-0.5 px-5 py-2.5 rounded-2xl shadow-lg active:scale-95 transition-all border-2"
                    style={{ backgroundColor: 'rgba(13,148,136,0.15)', borderColor: '#0d9488', color: '#0d9488' }}
                >
                    <div className="flex items-center gap-1.5">
                        <QrCode size={15} />
                        <span className="text-[10px] font-black uppercase tracking-widest">QR Dojo</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.15em] opacity-80">Activar</span>
                </button>
            </div>

            {/* Buscador + Opciones */}
            <div className="relative" ref={optionsRef}>
                <div className={`flex items-center gap-3 px-5 py-3.5 rounded-[2rem] border transition-all ${
                    isDark
                        ? 'bg-zinc-900/60 border-zinc-800 focus-within:border-zinc-600'
                        : 'bg-white border-zinc-100 shadow-sm focus-within:border-zinc-300'
                }`}>
                    <Search size={18} className={isDark ? 'text-zinc-600' : 'text-zinc-300'} />
                    <input
                        type="text"
                        placeholder={`Buscar ${vocab.memberLabel.toLowerCase()}...`}
                        className={`flex-1 bg-transparent text-sm font-black uppercase tracking-widest placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none ${
                            isDark
                                ? 'text-white placeholder:text-zinc-700'
                                : 'text-zinc-950 placeholder:text-zinc-300'
                        }`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={() => setShowOptions(v => !v)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            showOptions
                                ? isDark ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-900'
                                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                </div>

                {/* Dropdown opciones */}
                {showOptions && (
                    <div className={`absolute right-0 top-full mt-2 w-52 rounded-2xl border shadow-xl z-50 overflow-hidden ${
                        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
                    }`}>
                        <p className={`px-4 pt-3 pb-1 text-[8px] font-black uppercase tracking-[0.2em] ${
                            isDark ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>Filtrar</p>
                        {([
                            { key: 'all', label: 'Todos', icon: Users },
                            { key: 'present', label: 'Presentes', icon: UserCheck },
                            { key: 'absent', label: 'Ausentes', icon: UserX },
                        ] as const).map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => { setFilter(key); setShowOptions(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${
                                    filter === key
                                        ? isDark ? 'text-white bg-zinc-800' : 'text-zinc-900 bg-zinc-50'
                                        : isDark ? 'text-zinc-500 hover:bg-zinc-800/50' : 'text-zinc-400 hover:bg-zinc-50'
                                }`}
                            >
                                <Icon size={13} />
                                {label}
                                {filter === key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                        ))}
                        <div className={`mx-4 my-1 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`} />
                        <button
                            onClick={() => { setEditMode(v => !v); setShowOptions(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 mb-1 text-[11px] font-black uppercase tracking-widest transition-colors ${
                                editMode
                                    ? 'text-amber-400 bg-amber-400/10'
                                    : isDark ? 'text-zinc-500 hover:bg-zinc-800/50' : 'text-zinc-400 hover:bg-zinc-50'
                            }`}
                        >
                            <Edit2 size={13} />
                            Editar perfiles
                            {editMode && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        </button>
                    </div>
                )}
            </div>

            {/* VISTA DESKTOP: TABLA */}
            <div className={`hidden md:block rounded-[2rem] border overflow-hidden ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-zinc-50'}`}>
                            {['Atleta', 'Grado', 'Estado', ''].map((h, i) => (
                                <th key={i} className={`px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'} ${i === 3 ? 'text-right' : ''}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800/50' : 'divide-zinc-50'}`}>
                        {displayedStudents.map(student => {
                            const isPresent = attendance.has(String(student.id));
                            return (
                                <tr key={student.id} className={`transition-colors ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50/80'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full overflow-hidden ring-2 flex-shrink-0 ${
                                                isPresent ? 'ring-emerald-400' : isDark ? 'ring-zinc-800' : 'ring-zinc-100'
                                            }`}>
                                                {student.photo
                                                    ? <img src={student.photo} className="w-full h-full object-cover" />
                                                    : <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-300'}`}><User size={16} /></div>
                                                }
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                                    {student.name}
                                                </p>
                                                {student.consumable_credits > 0 && (
                                                    <p className="text-[8px] font-black tracking-widest text-[#c9a84c] flex items-center gap-1 mt-0.5">
                                                        ★ {student.consumable_credits} SESIONES VIP
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {student.belt_rank
                                            ? <BeltDisplay beltRank={student.belt_rank} degrees={student.degrees ?? 0} />
                                            : <span className={`text-[9px] uppercase tracking-widest font-bold ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>Sin grado</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        {isPresent ? (
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <CheckCircle2 size={16} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">En el {vocab.unitLabel}</span>
                                            </div>
                                        ) : (
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-700' : 'text-zinc-300'}`}>Ausente</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(student)} className={`p-2 rounded-xl transition-all ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'}`}>
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                onClick={() => toggleAttendance(student.id)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    isPresent
                                                        ? isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                                        : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                                }`}
                                            >
                                                {isPresent ? 'Quitar' : 'Marcar'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* VISTA MOBILE: GRID */}
            <div className="grid grid-cols-3 gap-2.5 md:hidden">
                {displayedStudents.map(student => {
                    const isPresent = attendance.has(String(student.id));
                    return (
                        <div key={student.id} className="relative">
                            <button
                                onClick={() => editMode ? openEdit(student) : toggleAttendance(student.id)}
                                className={`relative flex flex-col items-center p-3.5 rounded-2xl transition-all w-full active:scale-95 ${
                                    editMode
                                        ? isDark
                                            ? 'bg-zinc-900/60 border-2 border-dashed border-amber-500/50'
                                            : 'bg-white border-2 border-dashed border-amber-400/60 shadow-sm'
                                        : isPresent
                                            ? 'bg-emerald-500/10 border-2 border-emerald-400 shadow-lg shadow-emerald-500/10'
                                            : isDark
                                                ? 'bg-zinc-900/60 border border-zinc-800'
                                                : 'bg-white border border-zinc-100 shadow-sm'
                                }`}
                            >
                                {/* Foto + cinturón superpuesto */}
                                <div className="relative mb-2">
                                    <div className={`w-[72px] h-[72px] rounded-full overflow-hidden ring-2 ${
                                        editMode ? 'ring-amber-400/40' : isPresent ? 'ring-emerald-400' : isDark ? 'ring-zinc-800' : 'ring-zinc-100'
                                    }`}>
                                        {student.photo
                                            ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" loading="lazy" />
                                            : <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-100 text-zinc-300'}`}><User size={22} /></div>
                                        }
                                        {editMode && (
                                            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40">
                                                <Edit2 size={16} className="text-white/90" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Cinturón SVG superpuesto en la parte inferior */}
                                    {!editMode && student.belt_rank && (
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2">
                                            <BeltBadge beltRank={student.belt_rank} degrees={student.degrees ?? 0} />
                                        </div>
                                    )}
                                    {!editMode && isPresent && (
                                        <div className="absolute -top-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5 border-2 border-white shadow">
                                            <CheckCircle2 className="text-white" size={12} />
                                        </div>
                                    )}
                                    {!editMode && !isPresent && student.payerStatus && student.payerStatus !== 'paid' && (
                                        <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 ${isDark ? 'border-zinc-900' : 'border-white'} shadow ${
                                            student.payerStatus === 'review' ? 'bg-amber-400' : 'bg-rose-500'
                                        }`} />
                                    )}
                                </div>
                                <p className={`font-black text-[10px] text-center leading-tight line-clamp-1 w-full uppercase mt-3 ${
                                    editMode ? 'text-amber-400' : isPresent ? 'text-emerald-500' : isDark ? 'text-zinc-300' : 'text-zinc-700'
                                }`}>
                                    {student.name.split(' ')[0]}
                                </p>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Modal BJJ — full width mobile, swipe to close */}
            {editingStudent && (
                <div
                    className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end justify-center"
                    onClick={() => { setEditingStudent(null); setPendingChanges(null); }}
                >
                    <div
                        ref={sheetRef}
                        className={`w-full max-w-lg rounded-t-[2rem] shadow-2xl overflow-hidden transition-transform duration-200 ${
                            isDark ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white'
                        }`}
                        onClick={e => e.stopPropagation()}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
                        </div>

                        {/* Header */}
                        <div className={`flex items-center justify-between px-6 pt-3 pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <div className="flex items-center gap-3">
                                {editingStudent.photo
                                    ? <img src={editingStudent.photo} className="w-10 h-10 rounded-full object-cover ring-2 ring-[#c9a84c]/40" />
                                    : <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}><User size={16} className={isDark ? 'text-zinc-600' : 'text-zinc-400'} /></div>
                                }
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Editar perfil BJJ</p>
                                    <h3 className={`text-base font-black leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>{editingStudent.name}</h3>
                                </div>
                            </div>
                            <button onClick={() => { setEditingStudent(null); setPendingChanges(null); }} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                <X size={14} className={isDark ? 'text-zinc-400' : 'text-zinc-500'} />
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-3 max-h-[45vh] overflow-y-auto">

                            {/* Datos personales */}
                            <div>
                                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Datos personales</p>
                                <div className="space-y-2">
                                    {([
                                        { label: 'Nombre completo', key: 'name', type: 'text' },
                                        { label: 'Teléfono', key: 'phone', type: 'tel' },
                                    ] as const).map(({ label, key, type }) => (
                                        <div key={key}>
                                            <label className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</label>
                                            <input
                                                type={type}
                                                value={bjjForm[key]}
                                                onChange={e => setBjjForm((f: any) => ({ ...f, [key]: e.target.value }))}
                                                className={`w-full border rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none transition-colors ${
                                                    isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-700 focus:border-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-zinc-300'
                                                }`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Asistencia actual */}
                            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl ${
                                attendance.has(String(editingStudent.id))
                                    ? 'bg-emerald-500/10 border border-emerald-400/30'
                                    : isDark ? 'bg-zinc-800/50 border border-zinc-700' : 'bg-zinc-50 border border-zinc-100'
                            }`}>
                                <div>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Asistencia hoy</p>
                                    <p className={`text-sm font-black mt-0.5 ${
                                        attendance.has(String(editingStudent.id)) ? 'text-emerald-500' : isDark ? 'text-zinc-400' : 'text-zinc-500'
                                    }`}>
                                        {attendance.has(String(editingStudent.id)) ? `✓ En el ${vocab.unitLabel}` : 'Ausente'}
                                    </p>
                                </div>
                                <CheckCircle2 size={20} className={attendance.has(String(editingStudent.id)) ? 'text-emerald-400' : isDark ? 'text-zinc-700' : 'text-zinc-200'} />
                            </div>

                            {/* Cinturón */}
                            <div>
                                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Cinturón actual</p>
                                <div className="flex gap-2 flex-wrap">
                                    {BELT_OPTIONS.map(b => (
                                        <button key={b.value} onClick={() => setBjjForm((f: any) => ({ ...f, belt_rank: b.value }))}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                                                bjjForm.belt_rank === b.value
                                                    ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]'
                                                    : isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-400'
                                            }`}>
                                            {b.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rayas */}
                            <div>
                                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Rayas actuales</p>
                                <div className="flex gap-2">
                                    {[0,1,2,3,4].map(n => (
                                        <button key={n} onClick={() => setBjjForm((f: any) => ({ ...f, degrees: n }))}
                                            className={`w-10 h-10 rounded-xl text-sm font-black border-2 transition-all ${
                                                bjjForm.degrees === n
                                                    ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]'
                                                    : isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-400'
                                            }`}>
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categoría y Modalidad */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Categoría', key: 'category', opts: [['adults','Adulto'],['kids','Infantil']] },
                                    { label: 'Modalidad', key: 'modality', opts: [['gi','Gi'],['nogi','No-Gi'],['both','Ambos']] },
                                ].map(({ label, key, opts }) => (
                                    <div key={key}>
                                        <label className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</label>
                                        <select
                                            value={bjjForm[key]}
                                            onChange={e => setBjjForm((f: any) => ({ ...f, [key]: e.target.value }))}
                                            className={`w-full border rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none ${
                                                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-700'
                                            }`}
                                        >
                                            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Peso y Altura */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Peso (kg)', key: 'weight', placeholder: '70' },
                                    { label: 'Altura (m)', key: 'height', placeholder: '1.75', step: '0.01' },
                                ].map(({ label, key, placeholder, step }) => (
                                    <div key={key}>
                                        <label className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</label>
                                        <input
                                            type="number" step={step} value={bjjForm[key]}
                                            onChange={e => setBjjForm((f: any) => ({ ...f, [key]: e.target.value }))}
                                            placeholder={placeholder}
                                            className={`w-full border rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none ${
                                                isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-700' : 'bg-zinc-50 border-zinc-100 text-zinc-700'
                                            }`}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Clases anteriores al sistema */}
                            <div className={`rounded-2xl p-3 border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Clases anteriores al sistema</p>
                                        <p className={`text-[9px] mt-0.5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Clases reales en DB: {editingStudent.total_attendances != null ? editingStudent.total_attendances - (editingStudent.previous_classes ?? 0) : '—'}</p>
                                    </div>
                                    <div className={`text-right`}>
                                        <p className={`text-[8px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Total</p>
                                        <p className={`text-lg font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                            {Number(bjjForm.previous_classes || 0) + (editingStudent.total_attendances != null ? editingStudent.total_attendances - (editingStudent.previous_classes ?? 0) : 0)}
                                        </p>
                                    </div>
                                </div>
                                <input
                                    type="number" min={0} value={bjjForm.previous_classes}
                                    onChange={e => setBjjForm((f: any) => ({ ...f, previous_classes: Number(e.target.value) }))}
                                    placeholder="0"
                                    className={`w-full border rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none ${
                                        isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-700' : 'bg-white border-zinc-200 text-zinc-900'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className={`px-6 pb-8 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <button onClick={() => handleRequestSave(false)}
                                style={{ backgroundColor: primary }}
                                className="w-full py-3.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                                <Save size={14} /> Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal confirmación de cambios */}
            {pendingChanges && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className={`w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden ${
                        isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'
                    }`}>
                        <div className={`px-6 pt-6 pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Confirmar cambios</p>
                            <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>¿Aplicar estos cambios?</h3>
                        </div>
                        <div className="px-6 py-4 space-y-2 max-h-64 overflow-y-auto">
                            {pendingChanges.map((c, i) => (
                                <div key={i} className={`flex items-start justify-between gap-3 py-2 border-b last:border-0 ${
                                    isDark ? 'border-zinc-800' : 'border-zinc-50'
                                }`}>
                                    <span className={`text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{c.label}</span>
                                    {c.from && c.to ? (
                                        <div className="flex items-center gap-2 text-right">
                                            <span className={`text-[10px] font-bold line-through ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>{c.from}</span>
                                            <span className="text-[9px] text-zinc-500">→</span>
                                            <span className={`text-[10px] font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>{c.to}</span>
                                        </div>
                                    ) : (
                                        <span className={`text-[10px] font-bold italic ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Sin cambios detectados</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={`px-6 pb-6 pt-4 flex gap-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <button
                                onClick={() => setPendingChanges(null)}
                                className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                                    isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                                }`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                disabled={saving}
                                style={{ backgroundColor: primary }}
                                className="flex-1 py-3 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                Aprobar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceMartialArts;
