"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/context/BrandingContext";
import { getProfile } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { branding, setBranding } = useBranding();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("staff_token");
        const tenantSlug = localStorage.getItem("tenant_slug");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        const verifySession = async () => {
            try {
                if (tenantSlug) {
                    const profile = await getProfile(tenantSlug, token);
                    if (!profile || profile.message === 'Unauthenticated.') {
                        localStorage.clear();
                        window.location.href = "/login";
                        return;
                    }

                    // Si el perfil trae branding, lo actualizamos
                    if (profile.tenant) {
                        setBranding({
                            id: profile.tenant.id,
                            slug: profile.tenant.slug,
                            name: profile.tenant.name,
                            logo: profile.tenant.logo,
                            primaryColor: profile.tenant.primary_color
                        });
                    }
                }
            } catch (error) {
                console.error("Session verification failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white/10">
            {children}
        </div>
    );
}
