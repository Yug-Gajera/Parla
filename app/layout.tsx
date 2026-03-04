import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "FluentLoop — Speak a Language for Real",
    template: "%s | FluentLoop"
  },
  description: "Master a language through AI-powered conversations. Immersive, context-aware, and effective language learning for serious learners.",
  keywords: ["language learning", "AI language tutor", "speaking practice", "CEFR level test", "fluency"],
  authors: [{ name: "FluentLoop Team" }],
  creator: "FluentLoop Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://fluentloop.ai",
    siteName: "FluentLoop",
    title: "FluentLoop — Speak a Language for Real",
    description: "AI-powered language learning that gets you actually speaking. Start your journey today.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FluentLoop Landing Page",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FluentLoop — Speak a Language for Real",
    description: "Master a language through AI-powered conversations.",
    images: ["/og-image.png"],
    creator: "@fluentloop",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL('https://fluentloop.ai'),
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
