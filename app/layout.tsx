import type { Metadata } from "next";
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

import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";

import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Employee Tracker",
  description: "Modern internal business dashboard for employee tracking",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  console.log({ session });
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Sidebar user={session?.user}>{children}</Sidebar>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
