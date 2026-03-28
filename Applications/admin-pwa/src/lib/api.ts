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

// ─── Super Admin Authentication ──────────────────────────────────────────

export async function loginAdmin(credentials: any) {
    try {
        console.log('Intentando login en:', `${API_URL}/admin/login`);
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(credentials),
        });
        console.log('Login response status:', response.status);
        return await safeJson(response);
    } catch (error) {
        console.error('Login error:', error);
        return { message: 'Network error or server down' };
    }
}

// ─── Global Tenant Management ──────────────────────────────────────────────

export async function getAllTenants(token: string) {
    try {
        console.log('Fetching tenants from:', `${API_URL}/admin/tenants`);
        const response = await fetch(`${API_URL}/admin/tenants`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) return null;
        const data = await safeJson(response);
        return data?.tenants || [];

    } catch (error) {
        console.error('Error fetching all tenants:', error);
        return null;
    }
}

export async function getAllUsers(token: string) {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) return null;
        const data = await safeJson(response);
        return data?.users || [];
    } catch (error) {
        console.error('Error fetching all users:', error);
        return null;
    }
}


export async function createTenant(token: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/admin/tenants`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error creating tenant:', error);
        return null;
    }
}

export async function updateTenant(token: string, id: string | number, data: any) {
    try {
        const response = await fetch(`${API_URL}/admin/tenants/${id}`, {
            method: 'PATCH',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return null;
    }
}

export async function resetTenantPassword(token: string, id: string | number) {
    try {
        const response = await fetch(`${API_URL}/admin/tenants/${id}/reset-password`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error resetting password:', error);
        return null;
    }
}

// ─── SaaS Plan Management ────────────────────────────────────────────────

export async function getAllSaasPlans(token: string) {
    try {
        console.log('Fetching SaaS plans from:', `${API_URL}/admin/plans`);
        const response = await fetch(`${API_URL}/admin/plans`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            console.error('SaaS plans response not OK:', response.status);
            return null;
        }
        const data = await safeJson(response);
        return data?.plans || [];
    } catch (error) {
        console.error('Error fetching SaaS plans:', error);
        return null;
    }
}

export async function updateSaasPlan(token: string, id: number, data: any) {
    try {
        console.log(`Updating SaaS plan ${id} at:`, `${API_URL}/admin/plans/${id}`);
        const response = await fetch(`${API_URL}/admin/plans/${id}`, {
            method: 'PUT',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error updating SaaS plan:', error);
        return null;
    }
}

export async function syncSaasPlanWithMP(token: string, planId: number | string, interval: 'months' | 'years' = 'months') {
    try {
        console.log(`Syncing SaaS plan ${planId} with MP at:`, `${API_URL}/admin/plans/${planId}/sync-mp`);
        const response = await fetch(`${API_URL}/admin/plans/${planId}/sync-mp`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ interval }),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error syncing plan with MP:', error);
        return null;
    }
}

// ─── Tenant-specific User Management ───────────────────────────────────────

export async function getTenantUsers(token: string, tenantId: string | number) {
    try {
        const response = await fetch(`${API_URL}/admin/tenants/${tenantId}/users`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) return [];
        const data = await safeJson(response);
        return data?.users || [];
    } catch (error) {
        console.error('Error fetching tenant users:', error);
        return [];
    }
}

export async function addTenantUser(token: string, tenantId: string | number, userData: any) {
    try {
        const response = await fetch(`${API_URL}/admin/tenants/${tenantId}/users`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error adding tenant user:', error);
        return null;
    }
}

export async function removeTenantUser(token: string, tenantId: string | number, userId: string | number) {
    try {
        const response = await fetch(`${API_URL}/admin/tenants/${tenantId}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error removing tenant user:', error);
        return null;
    }
}
