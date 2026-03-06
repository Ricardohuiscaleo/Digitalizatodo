"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TenantBranding {
    id: string;
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
            const parsed = JSON.parse(savedBranding);
            setBrandingState(parsed);
            document.documentElement.style.setProperty('--primary', parsed.primaryColor);
            setIsLoading(false);
        } else if (!tenantId) {
            setBrandingState(defaultBranding);
            setIsLoading(false);
        }
        // Si hay tenantId pero no branding, la página que lo necesite lo pedirá o se quedará el default
    }, []);

    const setBranding = (newBranding: TenantBranding) => {
        setBrandingState(newBranding);
        localStorage.setItem("tenant_branding", JSON.stringify(newBranding));
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary', newBranding.primaryColor);
        }
    };

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
