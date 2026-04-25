import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Interface — SWAT Task Dashboard",
  description: "Secure SWAT team task management and monitoring platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full bg-slate-950 text-white antialiased`}>
        <AuthGuard>
          <AppShell>{children}</AppShell>
        </AuthGuard>
      </body>
    </html>
  );
}
