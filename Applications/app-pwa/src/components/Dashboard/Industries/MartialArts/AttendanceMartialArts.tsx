"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, CheckCircle2, QrCode, Edit2, X, Save, Loader2, User, MoreHorizontal, Users, UserCheck, UserX, Sparkles, Trash2, Check } from 'lucide-react';
import { BeltDisplay } from './BeltDisplay';
import { BeltBadge } from './BeltBadge';
import { StudentAvatar } from './StudentAvatar';
import { updateStudentBjj, updateStudentProfile, getStudent, deleteStudents, updateStudentPlan, deleteStudentEnrollment } from '@/lib/api';
import { ALLIANCE_BJJ_GRADUATION, calcBeltProgress } from '@/lib/industryUtils';
import { nowCL } from '@/lib/utils';

// Opciones de cinturones computadas dinámicamente según la categoría del alumno.

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
    activeSchedule: any;
    schedulesList?: any[];
}

const AttendanceMartialArts: React.FC<AttendanceMartialArtsProps> = ({
    allStudents, attendance, searchTerm, setSearchTerm,
    toggleAttendance, setShowQRModal, branding, vocab,
    token, onStudentUpdated, isDark = false, activeSchedule,
    schedulesList = []
}) => {
    const [isSmartFilterEnabled, setIsSmartFilterEnabled] = React.useState(true);

    const nextSchedule = useMemo(() => {
        if (!schedulesList.length) return null;
        const now = nowCL();
        const dow = now.getDay();
        const currentTime = now.toLocaleTimeString('en-GB', { hour12: false });
    
        // 1. Mismo día, más tarde
        let next = schedulesList
            .filter(s => s.day_of_week === dow && s.start_time > currentTime)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
        
        // 2. Siguientes días
        if (!next) {
            for (let i = 1; i <= 7; i++) {
                const nextDow = (dow + i) % 7;
                next = schedulesList
                    .filter(s => s.day_of_week === nextDow)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];
                if (next) break;
            }
        }
        return next;
    }, [schedulesList]);

    const filteredStudents = allStudents.filter(s => {
        if (s.deleted_at) return false;
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        const activeOrNext = activeSchedule || nextSchedule;

        if (activeOrNext && isSmartFilterEnabled) {
            const scheduleCat = activeOrNext.category?.toLowerCase(); // "adulto" o "kids"
            const studentCat = s.category?.toLowerCase(); // "adults" o "kids"
            
            // Mapeo flexible
            const isAdultSchedule = scheduleCat === 'adulto' || scheduleCat === 'adults';
            const isKidsSchedule = scheduleCat === 'kids';
            
            const isAdultStudent = studentCat === 'adults' || studentCat === 'adulto' || !studentCat; // adult default if nix
            const isKidsStudent = studentCat === 'kids';

            if (isAdultSchedule && isAdultStudent) return true;
            if (isKidsSchedule && isKidsStudent) return true;
            
            return false;
        }

        return true;
    });

    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [bjjForm, setBjjForm] = useState<any>({
        name: '', phone: '', email: '', 
        birth_date: '',
        belt_rank: 'white', degrees: 0, 
        modality: 'gi', category: 'adults', 
        weight: '', height: '',
        previous_classes: 0, total_attendances: 0, virtual_classes: 0
    });
    const [bjjError, setBjjError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<{ label: string; from: string; to: string }[] | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [filter, setFilter] = useState<'all' | 'present' | 'absent'>('all');
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [currentEnrollment, setCurrentEnrollment] = useState<any>(null);
    const [showOptions, setShowOptions] = useState(false);
    const optionsRef = useRef<HTMLDivElement>(null);
    const promoteRef = useRef(false);

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

    const BELT_LABELS: Record<string, string> = { 
        white: 'Blanco', 
        gris: 'Gris', grey: 'Gris', gray: 'Gris',
        amarillo: 'Amarillo', yellow: 'Amarillo',
        naranja: 'Naranja', orange: 'Naranja',
        verde: 'Verde', green: 'Verde',
        blue: 'Azul', 
        purple: 'Morado', 
        brown: 'Marrón', marron: 'Marrón', 'marrón': 'Marrón', cafe: 'Marrón', 'café': 'Marrón',
        black: 'Negro',
        'rojo-negro': 'Rojo-Negro'
    };
    const MODALITY_LABELS: Record<string, string> = { gi: 'Gi', nogi: 'No-Gi', both: 'Ambos' };
    const CATEGORY_LABELS: Record<string, string> = { adults: 'Adulto', kids: 'Infantil' };

    const normalizeBelt = (belt: string | null | undefined): string => {
        if (!belt) return 'Blanco';
        const b = belt.toLowerCase();
        if (b === 'blanco' || b === 'white') return 'Blanco';
        if (b === 'gris' || b === 'grey' || b === 'gray') return 'Gris';
        if (b === 'amarillo' || b === 'yellow') return 'Amarillo';
        if (b === 'naranja' || b === 'orange') return 'Naranja';
        if (b === 'verde' || b === 'green') return 'Verde';
        if (b === 'azul' || b === 'blue') return 'Azul';
        if (b === 'morado' || b === 'purple') return 'Morado';
        if (b === 'café' || b === 'cafe' || b === 'brown' || b === 'marrón' || b === 'marron') return 'Marrón';
        if (b === 'negro' || b === 'black') return 'Negro';
        return 'Blanco';
    };



    const getBjjMax = (belt: string) => {
        const entry = ALLIANCE_BJJ_GRADUATION.find(b => b.id === belt);
        if (!entry || entry.totalClasses === null || entry.classesPerStripe === null) return null;
        return { maxTotal: entry.totalClasses, classesPerStripe: entry.classesPerStripe };
    };

    const validateBjj = (form: any, student: any): string | null => {
        const beltKey = normalizeBelt(form.belt_rank);
        const config = getBjjMax(beltKey);
        if (!config) return null;
        const inSystem = student?.total_attendances ?? 0;
        const total = Number(form.previous_classes || 0) + inSystem;
        if (total > config.classesPerStripe) {
            const beltLabel = beltKey;
            return `Con ${total} clases desde la última raya supera el máximo de ${config.classesPerStripe} para el cinturón ${beltLabel}`;
        }
        return null;
    };

    const openEdit = async (student: any) => {
        if (!branding?.slug || !token) return;
        
        setLoadingStudent(true);
        // Abrimos con datos locales formateando la fecha a YYYY-MM-DD
        const initialDate = student.birth_date ? student.birth_date.split('T')[0] : '';
        setEditingStudent(student); 
        setBjjForm({
            name: student.name || '',
            phone: student.phone || '',
            email: student.email || '',
            birth_date: initialDate,
            belt_rank: normalizeBelt(student.belt_rank),
            degrees: Number(student.degrees ?? 0),
            modality: student.modality || 'gi',
            category: student.category || 'adults',
            weight: student.weight || '',
            height: student.height || '',
            plan_id: student.enrollment?.plan_id || '',
            custom_price: student.enrollment?.custom_price || '',
            previous_classes: student.previous_classes ?? 0,
            total_attendances: student.total_attendances ?? 0,
        });
        
        try {
            const response = await getStudent(branding.slug, token, student.id);
            if (response && response.student) {
                const s = response.student;
                setAvailablePlans(s.available_plans || []);
                setCurrentEnrollment(s.enrollment || null);
                setBjjForm({
                    name: s.name || '',
                    phone: s.phone || '',
                    email: s.email || '',
                    belt_rank: normalizeBelt(s.belt_rank),
                    degrees: Number(s.belt_progress?.degrees ?? s.degrees ?? student.degrees ?? 0),
                    gender: s.gender || '',
                    weight: s.weight || '',
                    height: s.height || '',
                    birth_date: s.birth_date ? s.birth_date.split('T')[0] : '',
                    plan_id: s.enrollment?.plan_id || '',
                    custom_price: s.enrollment?.custom_price || '',
                    modality: s.modality || 'gi',
                    category: s.category || 'adults',
                    previous_classes: s.previous_classes ?? 0,
                    total_attendances: s.total_attendances ?? 0,
                    virtual_classes: s.belt_progress?.virtual_classes ?? 0,
                });
            }
        } catch (err) {
            console.error("Error fetching student realtime:", err);
            // Si falla, mantenemos los locales que ya cargamos
        } finally {
            setLoadingStudent(false);
        }
    };

    const buildChangeSummary = () => {
        if (!editingStudent) return [];
        const changes: { label: string; from: string; to: string }[] = [];
        const fields: [string, string, (v: any) => string][] = [
            ['name', 'Nombre', v => v],
            ['phone', 'Teléfono', v => v || '—'],
            ['email', 'Correo', v => v || '—'],
            ['belt_rank', 'Cinturón', v => BELT_LABELS[v] || v || '—'],
            ['degrees', 'Rayas', v => v === 5 ? '🎓 Listo para Ascenso' : String(v)],
            ['category', 'Categoría', v => CATEGORY_LABELS[v] || v],
            ['modality', 'Modalidad', v => MODALITY_LABELS[v] || v],
            ['previous_classes', 'Clases anteriores', v => String(v ?? 0)],
            ['weight', 'Peso (kg)', v => v ? `${v} kg` : '—'],
            ['height', 'Altura (m)', v => v ? `${v} m` : '—'],
            ['birth_date', 'Fecha Nacimiento', v => v || '—'],
            ['plan_id', 'Plan Entrenamiento', v => {
                const p = availablePlans.find(pl => String(pl.id) === String(v));
                return p ? p.name : 'Sin plan';
            }],
            ['custom_price', 'Precio Pesonalizado', v => v ? `$${Number(v).toLocaleString('es-CL')}` : 'Precio Base'],
        ];
        for (const [key, label, fmt] of fields) {
            let from;
            if (key === 'plan_id') {
                from = fmt(currentEnrollment?.plan_id ?? '');
            } else if (key === 'custom_price') {
                from = fmt(currentEnrollment?.custom_price ?? '');
            } else {
                from = fmt(editingStudent[key] ?? '');
            }
            const to = fmt(bjjForm[key] ?? '');
            if (from !== to) changes.push({ label, from, to });
        }
        return changes;
    };

    const handleRequestSave = (promote: boolean) => {
        const err = validateBjj(bjjForm, editingStudent);
        if (err) { setBjjError(err); return; }
        setBjjError(null);
        const changes = buildChangeSummary();
        if (promote) changes.push({ label: 'Promoción', from: '—', to: '✓ Promover cinturón' });
        setPendingChanges(changes.length > 0 ? changes : [{ label: 'Sin cambios', from: '', to: '' }]);
        promoteRef.current = promote;
    };

    const onStudentUpdatedInternal = () => {
        onStudentUpdated?.();
    };

    const handleConfirmSave = async () => {
        if (!editingStudent || !branding?.slug || !token) return;
        const promote = promoteRef.current;
        setSaving(true);
        const { name, phone, email, previous_classes, plan_id, custom_price, ...bjjData } = bjjForm;
        
        const tasks: Promise<any>[] = [
            updateStudentProfile(branding.slug, token, editingStudent.id, { name, phone, email }),
            updateStudentBjj(branding.slug, token, editingStudent.id, { ...bjjData, previous_classes, promote }),
        ];

        // Solo si el plan o el precio cambió
        if (String(plan_id) !== String(currentEnrollment?.plan_id ?? '') || custom_price !== (currentEnrollment?.custom_price ?? '')) {
            tasks.push(updateStudentPlan(branding.slug, token, editingStudent.id, plan_id, custom_price));
        }

        await Promise.all(tasks);
        setSaving(false);
        setEditingStudent(null);
        setPendingChanges(null);
        onStudentUpdatedInternal();
    };

    const handleDeleteEnrollment = async () => {
        if (!editingStudent || !branding?.slug || !token) return;
        if (!confirm('¿Estás seguro de eliminar el plan de este alumno? Esto desactivará su suscripción actual.')) return;
        
        setSaving(true);
        await deleteStudentEnrollment(branding.slug, token, editingStudent.id);
        setSaving(false);
        setEditingStudent(null);
        onStudentUpdatedInternal();
    };

    const primary = branding?.primaryColor || '#6366f1';

    return (
        <div className="space-y-4 px-0 pb-32">

            {/* Header con contador — sin tarjeta */}
            <div className="flex items-center justify-between px-1">
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
                    className="flex items-center gap-3 px-8 py-1.5 rounded-2xl shadow-xl active:scale-95 transition-all border-2"
                    style={{ 
                        backgroundColor: isDark ? 'rgba(13,148,136,0.1)' : 'rgba(13,148,136,0.05)', 
                        borderColor: '#0d9488', 
                        color: '#0d9488' 
                    }}
                >
                    <div className="p-1.5 rounded-lg bg-[#0d9488]/10 mr-0.5">
                        <QrCode size={18} strokeWidth={3} />
                    </div>
                    <div className="text-left py-0.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">QR Dojo</p>
                        <p className={`text-[7px] font-black uppercase tracking-[0.1em] opacity-80 ${isDark ? 'text-[#0d9488]/60' : 'text-[#0d9488]/70'}`}>
                            Activar
                        </p>
                    </div>
                </button>
            </div>

            {(activeSchedule || nextSchedule) && (
                <div className={`flex items-center justify-between p-4 rounded-3xl border mb-3 shadow-lg transition-all ${
                    isDark ? 'bg-zinc-800/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                            activeSchedule 
                                ? 'bg-emerald-500 animate-pulse shadow-emerald-500/40' 
                                : 'bg-amber-500 shadow-amber-500/20'
                        }`} />
                        <div>
                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                {isSmartFilterEnabled ? 'Smart Switch Active:' : activeSchedule ? 'Clase Actual:' : 'Próxima Clase:'}
                            </p>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                                {activeSchedule?.name || nextSchedule?.name}
                                {!activeSchedule && nextSchedule && (
                                    <span className="ml-2 opacity-40 text-[9px] lowercase font-bold">
                                        (falta {(() => {
                                            const h = Number(nextSchedule.start_time.split(':')[0]);
                                            const m = Number(nextSchedule.start_time.split(':')[1]);
                                            const now = nowCL();
                                            const target = new Date(now);
                                            target.setHours(h, m, 0);
                                            if (target < now) target.setDate(target.getDate() + 1);
                                            const diff = target.getTime() - now.getTime();
                                            const dh = Math.floor(diff / (1000 * 60 * 60));
                                            const dm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                            return dh > 0 ? `${dh}h ${dm}m` : `${dm}m`;
                                        })()})
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsSmartFilterEnabled(!isSmartFilterEnabled)}
                        className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                            isSmartFilterEnabled 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                                : isDark ? 'bg-zinc-800 text-zinc-500 hover:text-zinc-300' : 'bg-white text-zinc-400 border border-zinc-100'
                        }`}
                    >
                        <Sparkles size={11} className={isSmartFilterEnabled ? 'animate-pulse' : ''} />
                        {isSmartFilterEnabled ? 'Activo' : 'Smart Switch'}
                    </button>
                </div>
            )}

            {/* Buscador + Barra de Selección (Filtros) */}
            <div className="space-y-3">
                <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all ${
                    isDark
                        ? 'bg-zinc-800 border-zinc-700 focus-within:border-zinc-500'
                        : 'bg-zinc-50 border-zinc-200 focus-within:border-zinc-300'
                }`}>
                    <Search size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                    <input
                        type="text"
                        placeholder={`Buscar ${vocab.memberLabel.toLowerCase()}...`}
                        className={`flex-1 bg-transparent text-[11px] font-black uppercase tracking-widest placeholder:font-black placeholder:uppercase placeholder:tracking-widest focus:outline-none ${
                            isDark
                                ? 'text-white placeholder:text-zinc-600'
                                : 'text-zinc-950 placeholder:text-zinc-400'
                        }`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-700 pl-2">
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                editMode
                                    ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/20'
                                    : isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-zinc-100 text-zinc-400'
                            }`}
                            title={editMode ? "Volver a Asistencia" : "Cambiar a Modo Edición"}
                        >
                            <Edit2 size={13} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Barra de Selección Animada */}
                <div className={`flex p-1 rounded-2xl h-10 relative ${isDark ? 'bg-zinc-800/80' : 'bg-zinc-100/60'}`}>
                    {(() => {
                        const FILTERS = [
                            { key: 'all', label: 'Todos', icon: Users },
                            { key: 'present', label: 'Presentes', icon: UserCheck },
                            { key: 'absent', label: 'Ausentes', icon: UserX },
                        ] as const;
                        const activeIdx = FILTERS.findIndex(f => f.key === filter);
                        
                        return (
                            <>
                                <div
                                    className={`absolute inset-y-1 rounded-xl shadow-sm border transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                                        isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-white border-zinc-100'
                                    }`}
                                    style={{
                                        width: `calc(${100 / FILTERS.length}% - 2px)`,
                                        transform: `translateX(${activeIdx * 100}%)`
                                    }}
                                />
                                {FILTERS.map(f => (
                                    <button key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        className={`flex-1 relative z-10 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-colors duration-200 ${
                                            filter === f.key
                                                ? isDark ? 'text-white' : 'text-zinc-950'
                                                : isDark ? 'text-zinc-500' : 'text-zinc-400'
                                        }`}
                                    >
                                        <f.icon size={11} strokeWidth={3} />
                                        {f.label}
                                    </button>
                                ))}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* VISTA UNIFICADA: GRID RESPONSIVO */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 md:gap-3">
                {displayedStudents.map(student => {
                    const isPresent = attendance.has(String(student.id));
                    const inSystem = student.total_attendances ?? 0;
                    const totalClasses = (student.previous_classes ?? 0) + inSystem;
                    const classesCount = totalClasses;
                    return (
                        <div key={student.id} className="relative">
                            <button
                                onClick={() => {
                                    if (editMode) openEdit(student);
                                    else toggleAttendance(student.id);
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    openEdit(student);
                                }}
                                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all w-full aspect-square active:scale-95 ${
                                    editMode
                                        ? isDark ? 'bg-amber-400/5 border-2 border-dashed border-amber-500/50' : 'bg-amber-50/50 border-2 border-dashed border-amber-400/60'
                                        : isPresent
                                            ? 'bg-emerald-500/10 border-2 border-emerald-400 shadow-lg shadow-emerald-500/10'
                                            : isDark
                                                ? 'bg-zinc-800 border border-zinc-700'
                                                : 'bg-white border border-zinc-100 shadow-sm'
                                }`}
                            >
                                <div className="relative">
                                    <StudentAvatar
                                        photo={student.photo}
                                        name={student.name}
                                        size={52}
                                        beltRank={student.belt_rank}
                                        degrees={student.degrees ?? 0}
                                        classesCount={classesCount}
                                        modality={student.modality}
                                        isDark={isDark}
                                        ring={editMode
                                            ? 'ring-amber-400/40 bg-zinc-800'
                                            : isPresent
                                                ? 'ring-emerald-400 bg-zinc-800'
                                                : isDark ? 'ring-zinc-700 bg-zinc-800' : 'ring-zinc-100 bg-zinc-100'
                                        }
                                    />
                                    {editMode && (
                                        <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1 border-2 border-white shadow-lg z-30">
                                            <Edit2 className="text-white" size={10} strokeWidth={4} />
                                        </div>
                                    )}
                                    {!editMode && isPresent && (
                                        <div className="absolute -top-1 -left-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white shadow z-20">
                                            <CheckCircle2 className="text-white" size={10} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-center justify-center gap-0.5 mt-1.5 px-0.5">
                                    <div className="flex items-center justify-center gap-1">
                                        <div className={`w-1 h-1 rounded-full flex-shrink-0 ${
                                            student.payment_status === 'overdue' ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' :
                                            student.payment_status === 'pending' ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' :
                                            'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]'
                                        }`} />
                                        <p className={`font-black text-[9px] text-center leading-none line-clamp-1 uppercase ${
                                            isPresent ? 'text-emerald-500' : isDark ? 'text-zinc-300' : 'text-zinc-700'
                                        }`}>
                                            {student.name.split(' ')[0]}
                                        </p>
                                    </div>
                                    {student.category?.toLowerCase() === 'kids' && (
                                        <span className="text-[7px] font-black uppercase text-fuchsia-500 tracking-[0.2em] -mt-0.5 animate-pulse">KID</span>
                                    )}
                                </div>
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
                        className={`w-full max-w-lg rounded-t-[2rem] shadow-2xl overflow-hidden transition-transform duration-200 ${
                            isDark ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white'
                        }`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-6 pt-3 pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <div className="flex items-center gap-3">
                                <StudentAvatar
                                    photo={editingStudent.photo}
                                    beltRank={bjjForm.belt_rank}
                                    degrees={bjjForm.degrees ?? 0}
                                    modality={bjjForm.modality}
                                    isDark={isDark}
                                    size={48}
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Editar perfil BJJ</p>
                                        {bjjForm.category?.toLowerCase() === 'kids' && (
                                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-fuchsia-500 text-white rounded-md tracking-widest animate-pulse">KID</span>
                                        )}
                                    </div>
                                    <h3 className={`text-base font-black leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>{bjjForm.name || editingStudent.name}</h3>
                                </div>
                            </div>
                            <button onClick={() => { setEditingStudent(null); setPendingChanges(null); }} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                <X size={14} className={isDark ? 'text-zinc-400' : 'text-zinc-500'} />
                            </button>
                        </div>
                        
                        <div className="relative">
                            {loadingStudent && (
                                <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-all ${
                                    isDark ? 'bg-zinc-900/60' : 'bg-white/60'
                                }`}>
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-4 border-t-amber-500 border-zinc-200 animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                        </div>
                                    </div>
                                    <p className={`mt-4 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse ${
                                        isDark ? 'text-amber-500/80' : 'text-amber-600/80'
                                    }`}>Sincronizando...</p>
                                </div>
                            )}

                            <div className={`px-6 py-4 space-y-3 max-h-[45vh] overflow-y-auto ${loadingStudent ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                {/* Datos personales */}
                                <div>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Datos personales</p>
                                <div className="space-y-2">
                                    {([
                                        { label: 'Nombre completo', key: 'name', type: 'text' },
                                        { label: 'Teléfono', key: 'phone', type: 'tel' },
                                        { label: 'Correo', key: 'email', type: 'email' },
                                        { label: 'Fecha Nacimiento', key: 'birth_date', type: 'date' },
                                    ] as const).map(({ label, key, type }) => (
                                        <div key={key}>
                                            <label className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>{label}</label>
                                            <input
                                                type={type}
                                                value={bjjForm[key] || ''}
                                                onChange={e => setBjjForm((f: any) => ({ ...f, [key]: e.target.value }))}
                                                className={`w-full border rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none transition-colors ${
                                                    isDark ? 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-700 focus:border-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-zinc-300'
                                                }`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Asistencia actual & Estadísticas */}
                            <div className="space-y-2">
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

                                <div className={`grid grid-cols-4 gap-2 px-1 py-1 rounded-2xl border ${
                                    isDark ? 'bg-zinc-800/20 border-zinc-800/50' : 'bg-zinc-100/50 border-zinc-100'
                                }`}>
                                    <div className="text-center py-2 px-1">
                                        <p className={`text-[6px] font-black uppercase tracking-widest opacity-40 mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Anteriores</p>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-zinc-500'}`}>
                                            {bjjForm.previous_classes || 0}
                                        </div>
                                    </div>
                                    <div className="text-center py-2 px-1">
                                        <p className={`text-[6px] font-black uppercase tracking-widest opacity-40 mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Sistema</p>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black ${isDark ? 'bg-zinc-800 text-emerald-500' : 'bg-white text-emerald-600'}`}>
                                            {bjjForm.total_attendances || 0}
                                        </div>
                                    </div>
                                    <div className="text-center py-2 px-1">
                                        <p className={`text-[6px] font-black uppercase tracking-widest opacity-40 mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Virtuales</p>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black ${isDark ? 'bg-zinc-800 text-indigo-400' : 'bg-white text-indigo-500'}`}>
                                            {bjjForm.virtual_classes || 0}
                                        </div>
                                    </div>
                                    <div className="text-center py-2 px-1">
                                        <p className={`text-[6px] font-black uppercase tracking-widest opacity-40 mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Total / {(() => {
                                            const config = ALLIANCE_BJJ_GRADUATION.find(b => b.id === bjjForm.belt_rank);
                                            return config?.totalClasses || 30;
                                        })()}</p>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20`}>
                                            {(bjjForm.total_attendances || 0) + (bjjForm.previous_classes || 0) + (bjjForm.virtual_classes || 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Plan de Entrenamiento */}
                            <div>
                                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Plan de Entrenamiento</p>
                                <div className={`p-4 rounded-2xl border transition-all ${
                                    isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'
                                }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white shadow-sm'}`}>
                                                <Users size={14} className="text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Plan Actual</p>
                                                <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                                    {currentEnrollment ? currentEnrollment.plan?.name : 'Sin plan activo'}
                                                </p>
                                            </div>
                                        </div>
                                        {currentEnrollment && (
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteEnrollment(); }}
                                                className={`p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors`}
                                                title="Eliminar Plan"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <label className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Cambiar Plan</label>
                                    <select
                                        value={bjjForm.plan_id || ''}
                                        onChange={e => setBjjForm((f: any) => ({ ...f, plan_id: e.target.value }))}
                                        className={`w-full border rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none transition-colors ${
                                            isDark ? 'bg-zinc-900 border-zinc-800 text-white focus:border-emerald-500/50' : 'bg-white border-zinc-200 text-zinc-900 focus:border-emerald-500/50'
                                        }`}
                                    >
                                        <option value="">-- Sin plan / Inactivo --</option>
                                        {availablePlans.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - ${Number(p.price).toLocaleString('es-CL')}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="mt-3">
                                        <label className={`text-[8px] font-black uppercase tracking-widest block mb-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Precio Personalizado (opcional)</label>
                                        <div className="relative">
                                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>$</span>
                                            <input
                                                type="number"
                                                value={bjjForm.custom_price || ''}
                                                onChange={e => setBjjForm((f: any) => ({ ...f, custom_price: e.target.value }))}
                                                placeholder="Usar precio base del plan"
                                                className={`w-full border rounded-xl pl-8 pr-4 py-2.5 text-xs font-bold focus:outline-none transition-colors ${
                                                    isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-emerald-500' : 'bg-white border-zinc-100 text-zinc-900 focus:border-emerald-500'
                                                }`}
                                            />
                                        </div>
                                        <p className={`text-[7px] mt-1 italic ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>* Deja en blanco para cobrar el precio normal del plan.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cinturón */}
                            <div>
                                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Cinturón actual</p>
                                <div className="flex gap-2 flex-wrap">
                                    {ALLIANCE_BJJ_GRADUATION
                                        .filter(b => b.category === 'both' || b.category === bjjForm.category)
                                        .map(b => (
                                        <button key={b.id} onClick={() => {
                                            const config = ALLIANCE_BJJ_GRADUATION.find(entry => entry.id === b.id);
                                            const total = Number(bjjForm.previous_classes || 0) + Math.max(0, (editingStudent?.total_attendances ?? 0) - (editingStudent?.previous_classes ?? 0));
                                            const maxDegrees = (config && config.classesPerStripe) ? Math.min(4, Math.floor(total / config.classesPerStripe)) : 4;
                                            setBjjForm((f: any) => ({
                                                ...f,
                                                belt_rank: b.id,
                                                degrees: Math.min(Number(f.degrees), maxDegrees)
                                            }));
                                            setBjjError(null);
                                        }}
                                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                                                bjjForm.belt_rank === b.id
                                                    ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]'
                                                    : isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-400'
                                            }`}>
                                            {b.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rayas */}
                            {(() => {
                                return (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Rayas actuales</p>
                                            {Number(bjjForm.degrees) === 5 && (
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse">🎓 Listo para Ascenso</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {[0, 1, 2, 3, 4, 5].map(n => {
                                                const isSelected = Number(bjjForm.degrees) === n;
                                                return (
                                                    <button key={n}
                                                        type="button"
                                                        onClick={() => { 
                                                            const config = ALLIANCE_BJJ_GRADUATION.find(b => b.id === bjjForm.belt_rank);
                                                            const virtual = n * (config?.classesPerStripe || 0);
                                                            setBjjForm((f: any) => ({ ...f, degrees: n, virtual_classes: virtual })); 
                                                            setBjjError(null); 
                                                        }}
                                                        className={`w-10 h-10 rounded-xl text-sm font-black border-2 transition-all flex items-center justify-center ${
                                                            isSelected
                                                                ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c] ring-2 ring-[#c9a84c]/20'
                                                                : isDark ? 'border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                                                        }`}>
                                                        {n === 5 ? '🎓' : n}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

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
                            {(() => {
                                const prevClasses = Number(bjjForm.previous_classes || 0);
                                const inSystem = editingStudent?.total_attendances ?? 0;
                                const total = prevClasses + inSystem;
                                const config = ALLIANCE_BJJ_GRADUATION.find(b => b.id === bjjForm.belt_rank);
                                const maxTotal = (config && config.classesPerStripe) ? config.classesPerStripe : null;
                                const overLimit = maxTotal !== null && total > maxTotal;
                                return (
                                    <div className={`rounded-2xl border overflow-hidden ${
                                        overLimit
                                            ? 'border-rose-400 bg-rose-500/5'
                                            : isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'
                                    }`}>
                                        {/* Fila 1: label + input */}
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[8px] font-black uppercase tracking-[0.2em] leading-tight ${
                                                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                                                }`}>Clases anteriores</p>
                                                <p className={`text-[8px] mt-0.5 ${
                                                    isDark ? 'text-zinc-600' : 'text-zinc-500'
                                                }`}>al sistema</p>
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={bjjForm.previous_classes || ''}
                                                onChange={e => {
                                                    const v = e.target.value.replace(/\D/g, '');
                                                    setBjjForm((f: any) => ({ ...f, previous_classes: v === '' ? 0 : Number(v) }));
                                                    setBjjError(null);
                                                }}
                                                placeholder="ej: 45"
                                                className={`w-24 border rounded-xl px-3 py-2 text-sm font-black text-center focus:outline-none flex-shrink-0 ${
                                                    overLimit
                                                        ? 'border-rose-400 bg-rose-500/10 text-rose-500'
                                                        : isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-300'
                                                }`}
                                            />
                                        </div>
                                        {/* Fila 2: stats */}
                                        <div className={`grid grid-cols-3 divide-x border-t ${
                                            isDark ? 'divide-zinc-700 border-zinc-700' : 'divide-zinc-200 border-zinc-200'
                                        }`}>
                                            <div className="px-3 py-2.5">
                                                <p className={`text-[8px] font-black uppercase tracking-widest ${
                                                    isDark ? 'text-zinc-600' : 'text-zinc-400'
                                                }`}>Anteriores</p>
                                                <p className={`text-xl font-black mt-0.5 ${
                                                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                                                }`}>{prevClasses}</p>
                                            </div>
                                            <div className="px-3 py-2.5">
                                                <p className={`text-[8px] font-black uppercase tracking-widest ${
                                                    isDark ? 'text-zinc-600' : 'text-zinc-400'
                                                }`}>Sistema</p>
                                                <p className={`text-xl font-black mt-0.5 ${
                                                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                                                }`}>{inSystem}</p>
                                            </div>
                                            <div className="px-3 py-2.5">
                                                <p className={`text-[8px] font-black uppercase tracking-widest ${
                                                    overLimit ? 'text-rose-400' : isDark ? 'text-zinc-500' : 'text-zinc-400'
                                                }`}>Total{maxTotal ? ` / ${maxTotal}` : ''}</p>
                                                <p className={`text-xl font-black mt-0.5 ${
                                                    overLimit ? 'text-rose-500' : isDark ? 'text-white' : 'text-zinc-900'
                                                }`}>{total}</p>
                                            </div>
                                        </div>
                                        {overLimit && (
                                            <p className="px-4 py-2 text-[9px] font-black text-rose-500 uppercase tracking-widest border-t border-rose-400/30">
                                                ⚠ Supera el máximo para {ALLIANCE_BJJ_GRADUATION.find(b => b.id === bjjForm.belt_rank)?.name} — considera promover
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Error de validación */}
                            {bjjError && (
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest px-1">
                                    ⚠ {bjjError}
                                </p>
                            )}
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
