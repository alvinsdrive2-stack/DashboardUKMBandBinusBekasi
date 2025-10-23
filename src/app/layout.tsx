import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChakraProviders } from "@/components/providers/chakra-provider";
import { SessionProviders } from "@/components/providers/session-provider";
import { QueryClientProviderWrapper } from "@/components/providers/query-client-provider";

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
    icon: "https://i.imgur.com/YZICojL.png",
    shortcut: "https://i.imgur.com/YZICojL.png",
    apple: "https://i.imgur.com/YZICojL.png",
  },
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
            </QueryClientProviderWrapper>
          </ChakraProviders>
        </SessionProviders>
      </body>
    </html>
  );
}
