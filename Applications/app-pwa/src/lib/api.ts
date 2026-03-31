const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin.digitalizatodo.cl/api';

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

async function safeJson(response: Response) {
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        }
    } catch (e) {
        console.error("Error parsing JSON:", e);
    }
    return response.ok ? {} : null;
}

export async function identifyTenant(email: string) {
    try {
        const response = await fetch(`${API_URL}/identify-tenant`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify({ email }),
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error identifying tenant:', error);
        return { found: false, message: 'Error de conexión' };
    }
}

export async function getIndustries() {
    try {
        const response = await fetch(`${API_URL}/industries`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: defaultHeaders,
        });

        return await safeJson(response) || [];
    } catch (error) {
        console.error('Error fetching industries:', error);
        return [];
    }
}

export async function getSaasPlans() {
    try {
        const response = await fetch(`${API_URL}/saas-plans`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: defaultHeaders,
        });

        const data = await safeJson(response);
        return data?.plans || [];
    } catch (error) {
        console.error('Error fetching plans:', error);
        return [];
    }
}

export async function getTenantInfo(slug: string) {
    try {
        const response = await fetch(`${API_URL}/${slug}/info`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching tenant info:', error);
        return null;
    }
}

export async function getCourses(tenantSlug: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/courses`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: defaultHeaders,
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return { courses: [] };
    }
}

export async function registerTenant(data: any) {
    try {
        const response = await fetch(`${API_URL}/register-tenant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await safeJson(response);
        if (!response.ok) {
            return { errors: result?.errors, message: result?.message || 'Error en el servidor' };
        }
        return result;
    } catch (error) {
        console.error('Error registering tenant:', error);
        return { message: 'Error de conexión' };
    }
}

export async function login(tenantId: string, credentials: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/auth/login`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(credentials),
        });

        const data = await safeJson(response);
        if (!response.ok) {
            return { message: data.message || 'Error en el inicio de sesión' };
        }
        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        return { message: 'Error de conexión o datos inválidos' };
    }
}

export async function resumeSession(tenantId: string, rememberToken: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/auth/resume`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify({ remember_token: rememberToken }),
        });
        const data = await safeJson(response);
        if (!response.ok) return null;
        return data;
    } catch {
        return null;
    }
}
export async function getProfile(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/me`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export async function getPayments(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payments`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching payments:', error);
        return null;
    }
}

export async function initiatePayment(tenantId: string, paymentId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payments/${paymentId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ gateway: 'mercadopago' }),
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error initiating payment:', error);
        return null;
    }
}

export async function createSubscription(tenantId: string, token: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/mercadopago/subscribe`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify({
                plan_id: data.plan_id,
                student_id: data.student_id,
                email: data.email,
                amount: data.amount,
                fee_payment_id: data.fee_payment_id // 🚀 El cable final para la automatización
            }),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error creating subscription:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

export async function initiateSaasSubscription(tenantSlug: string, token: string, planId: number | string, interval: 'monthly' | 'yearly') {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/saas/subscribe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ plan_id: planId, interval }),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error initiating SaaS subscription:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

export async function updateBankInfo(tenantId: string, token: string, bankData: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/settings/bank-info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(bankData),
        });

        return await safeJson(response);
    } catch {
        return null;
    }
}

export async function registerStudent(tenantId: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/register-student`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
            },
            body: JSON.stringify(data),
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error registering student:', error);
        return { message: 'Error de conexión' };
    }
}

export async function getAttendanceHistory(tenantId: string, token: string, studentId?: string, month?: string) {
    try {
        const url = new URL(`${API_URL}/${tenantId}/attendance`);
        if (studentId) url.searchParams.append('student_id', studentId);
        if (month) url.searchParams.append('month', month);

        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        return null;
    }
}
export async function getStudents(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching students:', error);
        return null;
    }
}

export async function getStudent(tenantId: string, token: string, studentId: string | number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students/${studentId}`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching student:', error);
        return null;
    }
}

export async function storeAttendance(tenantId: string, token: string, data: { student_id: string, status: string, notes?: string }) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
            body: JSON.stringify(data),
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error storing attendance:', error);
        return { message: 'Error de conexión' };
    }
}

export async function deleteAttendance(tenantId: string, token: string, studentId: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/attendance/${studentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error deleting attendance:', error);
        return { message: 'Error de conexión' };
    }
}

export async function getAttendanceQR(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/attendance/generate-qr`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching attendance QR:', error);
        return null;
    }
}

export async function markAttendanceViaQR(tenantId: string, token: string, qrToken: string, studentId: string, isPersonalized: boolean = false) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/attendance/verify-qr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ qr_token: qrToken, student_id: studentId, is_personalized: isPersonalized }),
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error marking attendance via QR:', error);
        return { message: 'Error de conexión' };
    }
}

export async function buyConsumablePack(tenantId: string, token: string, studentId: string, type: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payments/consumable`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ student_id: studentId, type })
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error buying consumable pack:', error);
        return { message: 'Error de conexión' };
    }
}

export async function buyPlanWithProof(tenantId: string, token: string, studentId: string, planId: string, file: File) {
    try {
        const formData = new FormData();
        formData.append('student_id', studentId);
        formData.append('plan_id', planId);
        formData.append('proof', file);
        
        const response = await fetch(`${API_URL}/${tenantId}/payments/plan-purchase`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: formData
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function getPayers(tenantId: string, token: string, filters?: { month?: string | number, year?: string | number, history?: boolean }) {
    try {
        const url = new URL(`${API_URL}/${tenantId}/payers`);
        if (filters) {
            if (filters.month) url.searchParams.append('month', String(filters.month));
            if (filters.year) url.searchParams.append('year', String(filters.year));
            if (filters.history) url.searchParams.append('history', filters.history ? 'true' : 'false');
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching payers:', error);
        return null;
    }
}

export async function approvePayment(tenantId: string, token: string, payerId: string | number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payers/${payerId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error approving payment:', error);
        return { message: 'Error de conexión' };
    }
}

export async function updatePricing(tenantId: string, token: string, prices: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/settings/pricing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
            body: JSON.stringify(prices),
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error updating pricing:', error);
        return { message: 'Error de conexión' };
    }
}

export async function updateLogo(tenantId: string, token: string, file: File) {
    try {
        const formData = new FormData();
        formData.append('logo', file);

        const response = await fetch(`${API_URL}/${tenantId}/settings/logo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'X-Tenant-Id': tenantId,
            },
            body: formData,
        });

        return await safeJson(response);
    } catch (error) {
        console.error('Error updating logo:', error);
        return { message: 'Error de conexión' };
    }
}

export async function generateRegistrationPage(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/settings/registration-page`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-Tenant-Id': tenantId },
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function getRegistrationPageCode(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/settings/registration-page`, {
            headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-Id': tenantId },
        });
        return await safeJson(response);
    } catch {
        return { code: null };
    }
}

export async function deleteRegistrationPage(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/settings/registration-page`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-Id': tenantId },
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function getRegistrationPage(code: string) {
    try {
        const response = await fetch(`${API_URL}/r/${code}`);
        if (!response.ok) return null;
        return await safeJson(response);
    } catch {
        return null;
    }
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/notifications`, {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch {
        return { unread: 0, notifications: [] };
    }
}

export async function markNotificationRead(tenantId: string, token: string, notificationId: number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch {
        return null;
    }
}

export async function markAllNotificationsRead(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/notifications/read-all`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch {
        return null;
    }
}

// ─── App Updates ─────────────────────────────────────────────────────────────

export async function getAppUpdates(target?: 'staff' | 'student', industry?: string) {
    try {
        const url = new URL(`${API_URL}/app-updates`);
        if (target) url.searchParams.append('target', target);
        if (industry) url.searchParams.append('industry', industry);
        const response = await fetch(url.toString(), {
            method: 'GET',
            cache: 'no-store' as RequestCache,
            headers: defaultHeaders,
        });
        return await safeJson(response);
    } catch {
        return { latest: null, updates: [] };
    }
}

// ─── Payment Proof ───────────────────────────────────────────────────────────

export async function deletePaymentProof(tenantId: string, token: string, paymentId: string | number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payments/${paymentId}/proof`, {
            method: 'DELETE',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
        });
        return await safeJson(response);
    } catch {
        return null;
    }
}

export async function deleteFeePaymentProof(tenantId: string, token: string, paymentId: string | number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees/payments/${paymentId}/proof`, {
            method: 'DELETE',
            headers: { ...defaultHeaders, Authorization: `Bearer ${token}` },
        });
        return await safeJson(response);
    } catch {
        return null;
    }
}

// ─── Expenses (Tesorero) ─────────────────────────────────────────────────────

export async function getExpenses(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/expenses`, {
            cache: 'no-store' as RequestCache,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return { expenses: [], summary: [], total: 0 };
    }
}


export async function createExpense(tenantId: string, token: string, data: FormData) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/expenses`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            body: data,
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function deleteExpense(tenantId: string, token: string, id: number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/expenses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

// ─── Fees / Cuotas (Tesorero) ─────────────────────────────────────────────────

export async function getFeesGuardiansSummary(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees/guardians-summary`, {
            cache: 'no-store' as RequestCache,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return { guardians: [] };
    }
}

export async function getFees(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees`, {
            cache: 'no-store' as RequestCache,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return { fees: [] };
    }
}

export async function getFeeDetail(tenantId: string, token: string, feeId: number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees/${feeId}`, {
            cache: 'no-store' as RequestCache,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return null;
    }
}

export async function createFee(tenantId: string, token: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function deleteFee(tenantId: string, token: string, feeId: number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees/${feeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function approveFeePayment(tenantId: string, token: string, feeId: number, data: { guardian_id: number; payment_method: 'cash' | 'transfer'; notes?: string }) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees/${feeId}/approve-payment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function rejectFeePayment(tenantId: string, token: string, feeId: number, data: { guardian_id: number; payment_id: number; notes?: string }) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees/${feeId}/reject-payment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

// ─── Digitalizatodo Pay (Mercado Pago OAuth) ──────────────────────────────────

export async function getMercadoPagoAuthUrl(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/mercadopago/auth/url`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
                'Accept': 'application/json'
            },
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching MP auth URL:', error);
        return null;
    }
}

export async function getMyFees(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/fees/my`, {
            cache: 'no-store' as RequestCache,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return { fees: [] };
    }
}

export async function submitFeePayment(
    tenantId: string,
    token: string,
    items: { fee_id: number; periods: { month: number; year: number }[] }[],
    proofFile: File
) {
    try {
        const formData = new FormData();
        formData.append('proof', proofFile);
        items.forEach((item, i) => {
            formData.append(`items[${i}][fee_id]`, String(item.fee_id));
            item.periods.forEach((p, j) => {
                formData.append(`items[${i}][periods][${j}][month]`, String(p.month));
                formData.append(`items[${i}][periods][${j}][year]`, String(p.year));
            });
        });
        const response = await fetch(`${API_URL}/${tenantId}/fees/submit-payment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            body: formData,
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function getPlans(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/plans`, {
            cache: 'no-store' as RequestCache,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return [];
    }
}

export async function createPlan(tenantId: string, token: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/plans`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function updatePlan(tenantId: string, token: string, id: number, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/plans/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function deletePlan(tenantId: string, token: string, id: number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/plans/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function getSchedules(tenantSlug: string, token?: string) {
    try {
        const headers: any = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${API_URL}/${tenantSlug}/schedules?_t=${Date.now()}`, { cache: 'no-store', headers });
        return await safeJson(response);
    } catch { return { schedules: [] }; }
}

export async function createSchedule(tenantSlug: string, token: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/schedules`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function updateSchedule(tenantSlug: string, token: string, id: number, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/schedules/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function deleteSchedule(tenantSlug: string, token: string, id: number) {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/schedules/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function acceptTerms(tenantSlug: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/settings/accept-terms`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify({ accepted_at: new Date().toISOString() }),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error accepting terms:', error);
        return { message: 'Error de conexión' };
    }
}


export async function updateStudentName(tenantId: string, token: string, studentId: string | number, name: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students/${studentId}/name`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name }),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function getGuardianSettlement(tenantId: string, token: string, guardianId: number | string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payers/${guardianId}/settlement`, {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch {
        return null;
    }
}

export async function updateStudentProfile(tenantId: string, token: string, studentId: string | number, data: {
    name?: string;
    phone?: string;
    email?: string;
}) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students/${studentId}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function updateStudentBjj(tenantId: string, token: string, studentId: string | number, data: {
    belt_rank?: string | null;
    degrees?: number | null;
    gender?: string | null;
    weight?: number | null;
    height?: number | null;
    modality?: string | null;
    category?: string | null;
    birth_date?: string | null;
    promote?: boolean;
}) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students/${studentId}/bjj`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function updateStudentPlan(tenantId: string, token: string, studentId: string | number, planId: number | string, customPrice?: number | string | null) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students/${studentId}/plan`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ plan_id: planId, custom_price: customPrice }),
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function deleteStudentEnrollment(tenantId: string, token: string, studentId: string | number) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students/${studentId}/enrollment`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch { return null; }
}

export async function deleteGuardian(tenantId: string, token: string, guardianId: number | string, data: FormData) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payers/${guardianId}`, {
            method: 'POST', // Laravel uses POST with _method=DELETE for FormData
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            body: data,
        });
        return await safeJson(response);
    } catch {
        return { error: 'Error de conexión' };
    }
}

export async function getTenantTerms(tenantSlug: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/settings/terms`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        });
        return await safeJson(response);
    } catch { return { terms: null }; }
}

export async function updateTenantTerms(tenantSlug: string, token: string, content: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantSlug}/settings/terms`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ content }),
        });
        return await safeJson(response);
    } catch { return { message: 'Error de conexión' }; }
}

export async function deleteStudents(tenantId: string, token: string, ids: (string | number)[]) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students/bulk-delete`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
                'Accept': 'application/json' 
            },
            body: JSON.stringify({ ids }),
        });
        return await safeJson(response);
    } catch {
        return { error: 'Error de conexión' };
    }
}

export async function sendResetLink(tenantId: string, email: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/auth/forgot-password`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify({ email }),
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}

export async function resetPassword(tenantId: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/auth/reset-password`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch {
        return { message: 'Error de conexión' };
    }
}
