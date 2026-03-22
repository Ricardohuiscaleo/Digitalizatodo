"use client";

import { useState, useCallback } from 'react';
import { getFees, getFeesGuardiansSummary, getFeeDetail, createFee, deleteFee, approveFeePayment } from "@/lib/api";

export function useTreasuryData(slug: string | undefined, token: string | null, industry: string | undefined) {
    const [feesList, setFeesList] = useState<any[]>([]);
    const [feesSummary, setFeesSummary] = useState<any>(null);
    const [feesGuardians, setFeesGuardians] = useState<any[]>([]);
    const [feesLoading, setFeesLoading] = useState(false);
    const [feesGuardiansLoading, setFeesGuardiansLoading] = useState(false);
    const [selectedFee, setSelectedFee] = useState<any>(null);
    const [feePayments, setFeePayments] = useState<any[]>([]);
    const [feeDetailLoading, setFeeDetailLoading] = useState(false);
    const [feeProofUrl, setFeeProofUrl] = useState<string | null>(null);
    const [feeForm, setFeeForm] = useState({ title: '', description: '', amount: '', due_date: '', target: 'all', type: 'once', recurring_day: '', start_month: '', start_year: '', end_month: '', end_year: '' });
    const [feeSubmitting, setFeeSubmitting] = useState(false);
    const [feeFormError, setFeeFormError] = useState('');
    const [approvingFeePayment, setApprovingFeePayment] = useState<any>(null);
    const [feeApproveMethod, setFeeApproveMethod] = useState<'cash' | 'transfer'>('cash');
    const [feeApproveNotes, setFeeApproveNotes] = useState('');
    const [feeApprovingLoading, setFeeApprovingLoading] = useState(false);
    const [feesGuardianFilter, setFeesGuardianFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [feesSearch, setFeesSearch] = useState('');
    const [feesGuardianDropdown, setFeesGuardianDropdown] = useState<string | null>(null);
    const [feesBubbleModal, setFeesBubbleModal] = useState<any>(null);
    const [feesView, setFeesView] = useState<'list' | 'history'>('list');

    const filteredFees = useCallback((searchTerm: string) => {
        if (!searchTerm) return feesList;
        const low = searchTerm.toLowerCase();
        return feesList.filter(f => 
            f.title.toLowerCase().includes(low) || 
            (f.description && f.description.toLowerCase().includes(low))
        );
    }, [feesList]);

    const loadFees = useCallback(async () => {
        if (!slug || !token || industry !== 'school_treasury') return;
        setFeesLoading(true);
        try {
            const [feesData, guardiansData] = await Promise.all([
                getFees(slug, token),
                getFeesGuardiansSummary(slug, token)
            ]);
            setFeesList(feesData?.fees || []);
            setFeesSummary(guardiansData?.metrics || null);
            setFeesGuardians(guardiansData?.guardians || []);
        } finally {
            setFeesLoading(false);
        }
    }, [slug, token, industry]);

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feeForm.title || !feeForm.amount || !slug || !token) {
            setFeeFormError('Completa todos los campos requeridos');
            return;
        }
        setFeeSubmitting(true);
        setFeeFormError('');
        const startDate = feeForm.type === 'recurring' && feeForm.start_month && feeForm.start_year
            ? `${feeForm.start_year}-${String(feeForm.start_month).padStart(2, '0')}-01` : undefined;
        const endDate = feeForm.type === 'recurring' && feeForm.end_month && feeForm.end_year
            ? `${feeForm.end_year}-${String(feeForm.end_month).padStart(2, '0')}-28` : undefined;

        const result = await createFee(slug, token, {
            ...feeForm,
            amount: parseFloat(feeForm.amount),
            recurring_day: feeForm.type === 'recurring' ? parseInt(feeForm.recurring_day) : undefined,
            due_date: feeForm.type === 'once' ? feeForm.due_date : startDate,
            end_date: endDate,
        });
        setFeeSubmitting(false);
        if (result?.fee) {
            setFeeForm({ title: '', description: '', amount: '', due_date: '', target: 'all', type: 'once', recurring_day: '', start_month: '', start_year: '', end_month: '', end_year: '' });
            await loadFees();
            return true;
        } else {
            setFeeFormError(result?.message || 'Error al crear cuota');
            return false;
        }
    };

    const handleApproveFeePayment = async () => {
        if (!approvingFeePayment || !selectedFee || !slug || !token) return;
        setFeeApprovingLoading(true);
        await approveFeePayment(slug, token, selectedFee.id, {
            guardian_id: approvingFeePayment.guardian_id,
            payment_method: feeApproveMethod,
            notes: feeApproveNotes,
        });
        setFeeApprovingLoading(false);
        setApprovingFeePayment(null);
        setFeeApproveNotes('');
        const data = await getFeeDetail(slug, token, selectedFee.id);
        setFeePayments(data?.payments || []);
        await loadFees();
    };

    const openFee = async (fee: any) => {
        if (!slug || !token) return;
        setSelectedFee(fee);
        setFeeDetailLoading(true);
        const data = await getFeeDetail(slug || '', token || '', fee.id);
        setFeePayments(data?.payments || []);
        setFeeDetailLoading(false);
    };

    const handleDeleteFee = async (feeId: number) => {
        if (!confirm('¿Eliminar esta cuota y todos sus pagos?') || !slug || !token) return;
        await deleteFee(slug || '', token || '', feeId);
        loadFees();
    };

    return {
        feesList, setFeesList, feesSummary, setFeesSummary,
        feesGuardians, setFeesGuardians, feesLoading, setFeesLoading,
        feesGuardiansLoading, setFeesGuardiansLoading,
        selectedFee, setSelectedFee, feePayments, setFeePayments,
        feeDetailLoading, setFeeDetailLoading,
        feeProofUrl, setFeeProofUrl, feeForm, setFeeForm,
        feeSubmitting, setFeeSubmitting, feeFormError, setFeeFormError,
        approvingFeePayment, setApprovingFeePayment, feeApproveMethod, setFeeApproveMethod,
        feeApproveNotes, setFeeApproveNotes, feeApprovingLoading, setFeeApprovingLoading,
        feesGuardianFilter, setFeesGuardianFilter, feesSearch, setFeesSearch,
        feesGuardianDropdown, setFeesGuardianDropdown, feesBubbleModal, setFeesBubbleModal,
        feesView, setFeesView, filteredFees,
        loadFees, openFee, handleDeleteFee, handleCreateFee, handleApproveFeePayment
    };
}
