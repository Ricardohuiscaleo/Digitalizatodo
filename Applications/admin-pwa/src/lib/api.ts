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

// ─── Super Admin Endpoints (Hypothetical) ───────────────────────────────────

export async function getGlobalStats(token: string) {
    try {
        const response = await fetch(`${API_URL}/super-admin/stats`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching global stats:', error);
        return null;
    }
}

export async function getAllTenants(token: string) {
    try {
        const response = await fetch(`${API_URL}/super-admin/tenants`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching all tenants:', error);
        return [];
    }
}

export async function getTenantTermsAcceptance(token: string) {
    try {
        const response = await fetch(`${API_URL}/super-admin/terms-acceptance`, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error fetching terms acceptance:', error);
        return [];
    }
}

// ─── App Updates (Super Admin can Create/Delete) ────────────────────────────

export async function createGlobalAppUpdate(token: string, data: any) {
    try {
        const response = await fetch(`${API_URL}/super-admin/app-updates`, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        return await safeJson(response);
    } catch (error) {
        console.error('Error creating app update:', error);
        return null;
    }
}
