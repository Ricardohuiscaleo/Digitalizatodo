"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TenantBranding {
    id: string | number;
    slug: string;
    name: string;
    industry?: string;
    logo: string;
    primaryColor: string;
}

interface BrandingContextType {
    branding: TenantBranding | null;
    setBranding: (branding: TenantBranding) => void;
    isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const defaultBranding: TenantBranding = {
    id: "digitalizatodo",
    slug: "portal",
    name: "Digitaliza Todo",
    logo: "/icon.webp",
    primaryColor: "#f59e0b",
};

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [branding, setBrandingState] = useState<TenantBranding | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Intentar recuperar del almacenamiento local
        const savedBranding = localStorage.getItem("tenant_branding");
        const tenantId = localStorage.getItem("tenant_id");

        if (savedBranding) {
            try {
                const parsed = JSON.parse(savedBranding);
                // Fallback: si el objeto guardado no tenía industry, lo recuperamos de tenant_industry
                if (!parsed.industry) {
                    parsed.industry = localStorage.getItem('tenant_industry') || undefined;
                }
                setBrandingState(parsed);
                document.documentElement.style.setProperty('--primary', parsed.primaryColor);
            } catch {
                setBrandingState(defaultBranding);
            }
            setIsLoading(false);
        } else if (!tenantId) {
            setBrandingState(defaultBranding);
            setIsLoading(false);
        }
        // Si hay tenantId pero no branding, la página que lo necesite lo pedirá o se quedará el default

    }, []);

    const setBranding = React.useCallback((newBranding: TenantBranding) => {
        setBrandingState(newBranding);
        localStorage.setItem("tenant_branding", JSON.stringify(newBranding));
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary', newBranding.primaryColor);
        }
    }, [setBrandingState]);

    return (
        <BrandingContext.Provider value={{ branding, setBranding, isLoading }}>
            {children}
        </BrandingContext.Provider>
    );
}

export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
}
