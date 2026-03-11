import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Parlova — Speak. Read. Become Fluent.",
    template: "%s | Parlova"
  },
  description: "The AI conversation coach and immersion library that serious learners have been waiting for. Speak out loud. Read real content. Actually become fluent.",
  keywords: ["language learning", "AI language tutor", "speaking practice", "CEFR level test", "fluency"],
  authors: [{ name: "Parlova Team" }],
  creator: "Parlova Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://parlova.ai",
    siteName: "Parlova",
    title: "Parlova — Speak. Read. Become Fluent.",
    description: "AI-powered language learning that gets you actually speaking. Start your journey today.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Parlova",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Parlova — Speak. Read. Become Fluent.",
    description: "Master a language through AI-powered conversations.",
    images: ["/og-image.png"],
    creator: "@parlova",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL('https://parlova.ai'),
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
        className={`${cormorantGaramond.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
