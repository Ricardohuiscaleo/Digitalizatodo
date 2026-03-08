const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin.digitalizatodo.cl/api';

export async function identifyTenant(email: string) {
    try {
        const response = await fetch(`${API_URL}/identify-tenant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error identifying tenant:', error);
        return null;
    }
}

export async function getTenantInfo(tenantId: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/info`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error fetching tenant info:', error);
        return null;
    }
}

export async function getPlans(tenantId: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/plans`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Error fetching plans:', error);
        return [];
    }
}

export async function login(tenantId: string, credentials: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        return await response.json();
    } catch (error) {
        console.error('Error logging in:', error);
        return { message: 'Error de conexión' };
    }
}
export async function getProfile(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await response.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

export async function getPayments(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payments`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await response.json();
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

        return await response.json();
    } catch (error) {
        console.error('Error initiating payment:', error);
        return null;
    }
}

export async function registerStudent(tenantId: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/register-student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        return await response.json();
    } catch (error) {
        console.error('Error registering student:', error);
        return { message: 'Error de conexión' };
    }
}

export async function uploadProof(tenantId: string, paymentId: string, token: string, file: File) {
    try {
        const form = new FormData();
        form.append('proof', file);
        const response = await fetch(`${API_URL}/${tenantId}/payments/${paymentId}/upload-proof`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form,
        });
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function getAttendanceHistory(tenantId: string, token: string, studentId?: string) {
    try {
        const url = new URL(`${API_URL}/${tenantId}/attendance`);
        if (studentId) url.searchParams.append('student_id', studentId);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await response.json();
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        return null;
    }
}
