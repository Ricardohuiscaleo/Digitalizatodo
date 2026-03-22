"use client";

import { useState, useCallback, useEffect } from "react";
import { getMyFees, getExpenses, submitFeePayment, deleteFeePaymentProof } from "@/lib/api";

export function useStudentTreasuryData(slug: string | undefined, token: string | null) {
    const [myFees, setMyFees] = useState<any[]>([]);
    const [feePayModal, setFeePayModal] = useState<{ fees: any[] } | null>(null);
    const [expensesList, setExpensesList] = useState<any[]>([]);
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [expensesBalance, setExpensesBalance] = useState(0);
    const [expensesSummary, setExpensesSummary] = useState<any[]>([]);
    const [expensesLoading, setExpensesLoading] = useState(false);

    const refreshMyFees = useCallback(async () => {
        if (slug && token) {
            const d = await getMyFees(slug, token);
            setMyFees(d?.fees ?? []);
        }
    }, [slug, token]);

    useEffect(() => {
        if (slug && token) {
            refreshMyFees();
        }
    }, [slug, token, refreshMyFees]);

    const loadExpenses = useCallback(async () => {
        if (!slug || !token) return;
        setExpensesLoading(true);
        const data = await getExpenses(slug, token);
        setExpensesList(data?.expenses ?? []);
        setExpensesTotal(data?.total ?? 0);
        setExpensesBalance(data?.balance ?? 0);
        setExpensesSummary(data?.summary ?? []);
        setExpensesLoading(false);
    }, [slug, token]);

    const handleDeleteFeeProof = async (paymentId: string) => {
        if (!slug || !token) return;
        const result = await deleteFeePaymentProof(slug, token, paymentId);
        if (result) refreshMyFees();
        return result;
    };

    return {
        myFees,
        setMyFees,
        feePayModal,
        setFeePayModal,
        refreshMyFees,
        expensesList,
        expensesTotal,
        expensesBalance,
        expensesSummary,
        expensesLoading,
        loadExpenses,
        handleDeleteFeeProof,
        submitFeePayment
    };
}
