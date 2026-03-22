"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
    getProfile, 
    resumeSession, 
    getNotifications, 
    markAllNotificationsRead, 
    markNotificationRead,
    getAppUpdates,
    getSchedules,
    getExpenses,
    getMyFees
} from "@/lib/api";
import { useBranding } from "@/context/BrandingContext";
import { unlockAudio, setAppBadge } from "@/lib/audio";
import { subscribeToPush } from "@/lib/push";

export function useStudentCommon() {
    const { branding, setBranding } = useBranding();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [effectiveIndustry, setEffectiveIndustry] = useState<string>(
        () => typeof window !== 'undefined' ? (localStorage.getItem('tenant_industry') || '') : ''
    );

    // Notifications state
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toastNotification, setToastNotification] = useState<any>(null);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [showPushModal, setShowPushModal] = useState(false);
    
    // App updates
    const [appUpdates, setAppUpdates] = useState<any[]>([]);

    const refreshData = useCallback(async () => {
        let token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");

        if (!token && !tenantSlug) return;

        if (!token && tenantSlug) {
            const rememberToken = localStorage.getItem("remember_token");
            if (rememberToken) {
                const resumed = await resumeSession(tenantSlug, rememberToken);
                if (resumed?.token) {
                    token = resumed.token;
                    const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                    localStorage.setItem(key, token!);
                }
            }
        }

        if (!token || !tenantSlug) { window.location.href = "/"; return; }

        let profile = await getProfile(tenantSlug, token);

        if (!profile) {
            const rememberToken = localStorage.getItem("remember_token");
            if (rememberToken && tenantSlug) {
                const resumed = await resumeSession(tenantSlug, rememberToken);
                if (resumed?.token) {
                    const newToken = resumed.token;
                    const key = resumed.user_type === 'staff' ? 'staff_token' : 'auth_token';
                    localStorage.setItem(key, newToken);
                    profile = await getProfile(tenantSlug, newToken);
                }
            }
        }

        const notifData = await getNotifications(tenantSlug, token);
        if (notifData?.notifications) setNotifications(notifData.notifications);
        if (notifData?.unread !== undefined) setUnreadCount(notifData.unread);

        if (profile) {
            setData(profile);
            if (profile.tenant) {
                const ind = profile.tenant.industry || '';
                localStorage.setItem('tenant_industry', ind);
                setEffectiveIndustry(ind);
                setBranding({
                    id: String(profile.tenant.id),
                    slug: profile.tenant.slug,
                    name: profile.tenant.name,
                    industry: profile.tenant.industry,
                    logo: profile.tenant.logo,
                    primaryColor: profile.tenant.primary_color
                });
            }
        } else {
            window.location.href = "/";
        }
    }, [setBranding]);

    const handleAccountSwitch = (tenant: any) => {
        const availableTenants = localStorage.getItem("available_tenants");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("staff_token");
        localStorage.removeItem("remember_token");
        localStorage.setItem("tenant_id", String(tenant.id));
        localStorage.setItem("tenant_slug", tenant.slug);
        if (availableTenants) localStorage.setItem("available_tenants", availableTenants);
        window.location.href = "/";
    };

    const handleActivatePush = () => {
        setShowPushModal(false);
        if (typeof Notification !== 'undefined') {
            Notification.requestPermission().then(permission => {
                setPushPermission(permission);
                const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
                const slug = localStorage.getItem("tenant_slug");
                if (permission === 'granted' && token && slug && effectiveIndustry !== 'school_treasury') {
                    subscribeToPush(slug, token);
                }
            });
        }
    };

    const markAllRead = async () => {
        const tk = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const sl = localStorage.getItem("tenant_slug");
        if (tk && sl) {
            await markAllNotificationsRead(sl, tk);
            setUnreadCount(0);
            setNotifications(n => n.map(x => ({ ...x, read: true })));
        }
    };

    const markRead = async (id: number) => {
        const tk = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const sl = localStorage.getItem("tenant_slug");
        if (tk && sl) {
            await markNotificationRead(sl, tk, id);
            setNotifications(prev => prev.map(x => x.id === id ? { ...x, read: true } : x));
            setUnreadCount(c => Math.max(0, c - 1));
        }
    };

    // Photo upload state
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [studentPhotoLoadingId, setStudentPhotoLoadingId] = useState<string | null>(null);

    const handleProfilePhotoUpload = async (file: File) => {
        if (!file || !branding?.slug) return;
        setIsUploadingPhoto(true);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const formData = new FormData();
            formData.append("photo", file);
            const response = await fetch(`${API}/${branding.slug}/me/photo`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
                body: formData
            });
            if (response.ok) refreshData();
        } finally { setIsUploadingPhoto(false); }
    };

    const handleUploadPhoto = async (studentId: string, file: File) => {
        if (!file || !branding?.slug) return;
        setStudentPhotoLoadingId(studentId);
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const formData = new FormData();
        formData.append("photo", file);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || "https://admin.digitalizatodo.cl/api";
            const res = await fetch(`${API}/${branding.slug}/students/${studentId}/photo`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                body: formData,
            });
            if (res.ok) refreshData();
        } finally { setStudentPhotoLoadingId(null); }
    };

    return {
        branding,
        data,
        loading,
        setLoading,
        effectiveIndustry,
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        showNotifications,
        setShowNotifications,
        toastNotification,
        setToastNotification,
        pushPermission,
        setPushPermission,
        showPushModal,
        setShowPushModal,
        appUpdates,
        setAppUpdates,
        refreshData,
        handleAccountSwitch,
        handleActivatePush,
        markAllRead,
        markRead,
        isUploadingPhoto,
        studentPhotoLoadingId,
        handleProfilePhotoUpload,
        handleUploadPhoto
    };
}
