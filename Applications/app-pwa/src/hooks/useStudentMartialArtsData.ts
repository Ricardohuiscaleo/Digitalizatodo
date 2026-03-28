"use client";

import { useState, useCallback, useEffect } from "react";
import { getSchedules, deletePaymentProof, getPlans } from "@/lib/api";

export function useStudentMartialArtsData(slug: string | undefined, token: string | null) {
    const [schedulesList, setSchedulesList] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [activeScanner, setActiveScanner] = useState<string | null>(null);

    const refreshSchedules = useCallback(async () => {
        if (slug && token) {
            const [sData, pData] = await Promise.all([
                getSchedules(slug, token),
                getPlans(slug, token)
            ]);
            setSchedulesList(sData?.schedules ?? []);
            setPlans(pData?.plans || pData || []); // Handle different API responses
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
        plans,
        setPlans,
        activeScanner,
        setActiveScanner,
        refreshSchedules,
        handleGenericPaymentProofDelete
    };
}
