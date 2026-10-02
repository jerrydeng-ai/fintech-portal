import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSession } from "@/platform/auth/session";
import { SessionProvider } from "@/platform/auth/SessionProvider";
import { listUsers } from "@/platform/auth/user-repository";
import { prisma } from "@/platform/database/client";
import { AppShell } from "@/platform/shell/AppShell";
import { TOOL_MODULES } from "./tool-registry";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fintech Ops · Internal Tools",
  description: "KYC Review Queue built on a reusable internal-tools platform",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, users] = await Promise.all([getSession(), listUsers(prisma)]);
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        {session ? (
          <SessionProvider session={{ user: session.user, permissions: session.permissions }}>
            <AppShell session={session} switchableUsers={users} modules={TOOL_MODULES}>
              {children}
            </AppShell>
          </SessionProvider>
        ) : (
          <main className="p-10 text-sm text-slate-600">No user session. Run `npm run db:reset` to reseed demo users.</main>
        )}
      </body>
    </html>
  );
}
