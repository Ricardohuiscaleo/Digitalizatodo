"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTenantInfo } from "@/lib/api";
import { useBranding } from "@/context/BrandingContext";
import { Loader2 } from "lucide-react";

export default function TenantEntryPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { setBranding } = useBranding();

    useEffect(() => {
        const loadTenant = async () => {
            if (!slug) return;

            const tenant = await getTenantInfo(slug as string);

            if (tenant && !tenant.message) {
                setBranding({
                    id: tenant.id,
                    slug: tenant.slug,
                    name: tenant.name,
                    industry: tenant.industry,
                    logo: tenant.logo,
                    primaryColor: tenant.primary_color
                });
                // Redirigir al login raíz ya con el branding cargado
                router.replace("/");
            } else {
                // Si no existe, al home genérico
                router.replace("/");
            }
        };

        loadTenant();
    }, [slug, setBranding, router]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-gray-500 text-sm animate-pulse">Cargando institución...</p>
        </div>
    );
}
