const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://admin.digitalizatodo.cl/api';

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

async function safeJson(response: Response) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
    }
    // Si no es JSON, devolvemos el error amigablemente
    return {
        message: `Error del servidor (${response.status})`,
        status: response.status
    };
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

export async function getTenantInfo(slug: string) {
    try {
        const response = await fetch(`${API_URL}/${slug}/info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching tenant info:', error);
        return null;
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

        return await response.json();
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
export async function getStudents(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/students`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
        });

        return await response.json();
    } catch (error) {
        console.error('Error fetching students:', error);
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

        return await response.json();
    } catch (error) {
        console.error('Error storing attendance:', error);
        return { message: 'Error de conexión' };
    }
}

export async function getAttendanceQR(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/attendance/generate-qr`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        return await response.json();
    } catch (error) {
        console.error('Error fetching attendance QR:', error);
        return null;
    }
}

export async function markAttendanceViaQR(tenantId: string, token: string, qrToken: string, studentId: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/attendance/verify-qr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ qr_token: qrToken, student_id: studentId }),
        });

        return await response.json();
    } catch (error) {
        console.error('Error marking attendance via QR:', error);
        return { message: 'Error de conexión' };
    }
}

export async function getPayers(tenantId: string, token: string) {
    try {
        const response = await fetch(`${API_URL}/${tenantId}/payers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Id': tenantId,
            },
        });

        return await response.json();
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

        return await response.json();
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
            body: JSON.stringify({ prices }),
        });

        return await response.json();
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
                'X-Tenant-Id': tenantId,
            },
            body: formData,
        });

        return await response.json();
    } catch (error) {
        console.error('Error updating logo:', error);
        return { message: 'Error de conexión' };
    }
}
