"use client";

import { useState, useCallback, useEffect } from "react";
import { getSchedules, deletePaymentProof } from "@/lib/api";

export function useStudentMartialArtsData(slug: string | undefined, token: string | null) {
    const [schedulesList, setSchedulesList] = useState<any[]>([]);
    const [activeScanner, setActiveScanner] = useState<string | null>(null);

    const refreshSchedules = useCallback(async () => {
        if (slug && token) {
            const d = await getSchedules(slug, token);
            setSchedulesList(d?.schedules ?? []);
        }
    }, [slug, token]);

    useEffect(() => {
        if (slug && token) {
            refreshSchedules();
        }
    }, [slug, token, refreshSchedules]);

    const handleGenericPaymentProofDelete = async (paymentId: string) => {
        if (!slug || !token) return;
        const result = await deletePaymentProof(slug, token, paymentId);
        return result;
    };

    return {
        schedulesList,
        setSchedulesList,
        activeScanner,
        setActiveScanner,
        refreshSchedules,
        handleGenericPaymentProofDelete
    };
}
