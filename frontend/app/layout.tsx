import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProjectProvider } from "./lib/ProjectContext";

const nunito = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'CMS - Content Management System',
  description: 'Manage your content with ease',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={`${nunito.variable} ${geistSans.variable} ${geistMono.variable} antialiased`} style={{ fontFamily: 'var(--font-nunito-sans), system-ui, sans-serif' }}>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </body>
    </html>
  );
}