import { useState, useCallback, useMemo, useRef } from 'react';
import { getAttendanceHistory, storeAttendance, deleteAttendance } from "@/lib/api";
import { todayCL } from "@/lib/utils";

export function useMartialArtsData(slug: string | undefined, token: string | null, industry: string | undefined) {
    const [beltRank, setBeltRank] = useState<string | null>(null);
    const [attendance, setAttendance] = useState<Set<string>>(new Set());
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const processingRef = useRef<Set<string>>(new Set());

    const loadAttendanceHistory = useCallback(async (monthYear?: string) => {
        if (!slug || !token || industry !== 'martial_arts') return;
        setHistoryLoading(true);
        try {
            const data = await getAttendanceHistory(slug, token, undefined, monthYear);
            setAttendanceHistory(data?.attendance || []);
        } finally {
            setHistoryLoading(false);
        }
    }, [slug, token, industry]);

    const toggleAttendance = useCallback(async (rawId: string | number, allStudents?: any[]) => {
        if (!slug || !token || industry !== 'martial_arts') return;
        const studentId = String(rawId);
        
        if (processingRef.current.has(studentId)) return;
        processingRef.current.add(studentId);

        try {
            const isPresent = attendance.has(studentId);
            const student = allStudents?.find(s => String(s.id) === studentId);

            setAttendance(prev => {
                const next = new Set(prev);
                if (isPresent) next.delete(studentId); else next.add(studentId);
                return next;
            });

            // Optimistic update of history
            if (isPresent) {
                setAttendanceHistory(prev => prev.filter(r => !(String(r.student_id) === studentId && (r.date || r.created_at?.split('T')[0]) === todayCL())));
                await deleteAttendance(slug, token, studentId);
            } else {
                setAttendanceHistory(prev => [{
                    id: `local-${Date.now()}`,
                    student_id: studentId,
                    student: { id: studentId, name: student?.name || 'Alumno', photo: student?.photo },
                    date: todayCL(),
                    status: 'present',
                    created_at: new Date().toISOString(),
                    registration_method: 'manual',
                }, ...prev]);
                await storeAttendance(slug, token, { student_id: studentId, status: 'present' });
            }
        } finally {
            processingRef.current.delete(studentId);
        }
    }, [slug, token, industry, attendance]);

    return useMemo(() => ({
        beltRank, setBeltRank,
        attendance, setAttendance,
        attendanceHistory, setAttendanceHistory,
        historyLoading,
        loadAttendanceHistory,
        toggleAttendance
    }), [
        beltRank, attendance, attendanceHistory, historyLoading,
        loadAttendanceHistory, toggleAttendance
    ]);
}
