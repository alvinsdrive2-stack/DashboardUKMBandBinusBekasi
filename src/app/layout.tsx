import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChakraProviders } from "@/components/providers/chakra-provider";
import { SessionProviders } from "@/components/providers/session-provider";
import { QueryClientProviderWrapper } from "@/components/providers/query-client-provider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UKM Band Bekasi Dashboard",
  description: "Dashboard untuk manajemen acara dan personel UKM Band Bekasi",
  icons: {
    icon: "/icons/favicon.png",
    shortcut: "/icons/favicon.png",
    apple: "/icons/favicon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BandHub",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "UKM Band Bekasi Dashboard",
    title: "UKM Band Bekasi Dashboard",
    description: "Dashboard untuk manajemen acara dan personel UKM Band Bekasi",
  },
  twitter: {
    card: "summary",
    title: "UKM Band Bekasi Dashboard",
    description: "Dashboard untuk manajemen acara dan personel UKM Band Bekasi",
  },
};

export const viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionProviders>
          <ChakraProviders>
            <QueryClientProviderWrapper>
              {children}
              <PWAInstallPrompt />
            </QueryClientProviderWrapper>
          </ChakraProviders>
        </SessionProviders>
      </body>
    </html>
  );
}
