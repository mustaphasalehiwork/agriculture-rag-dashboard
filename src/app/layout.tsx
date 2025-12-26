import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { FarmProvider } from "@/contexts/FarmContext";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { ActivityProvider } from "@/contexts/ActivityContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agriculture RAG Dashboard",
  description: "Manage PDF documents for RAG system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CompanyProvider>
            <FarmProvider>
              <CategoryProvider>
                <ActivityProvider>
                  {children}
                  <Toaster />
                </ActivityProvider>
              </CategoryProvider>
            </FarmProvider>
          </CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}