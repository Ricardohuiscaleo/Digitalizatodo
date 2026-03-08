import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Digitaliza Todo | Academy Management",
  description: "Panel de gestión rápida para profesores y dueños.",
  icons: {
    icon: "/icon.webp",
    apple: "/icon.webp",
    shortcut: "/icon.webp",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Digitaliza Todo",
    statusBarStyle: "default",
  },
};

import { BrandingProvider } from "@/context/BrandingContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BrandingProvider>
          {children}
        </BrandingProvider>
      </body>
    </html>
  );
}
