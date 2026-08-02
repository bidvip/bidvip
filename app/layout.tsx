import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Árverési katalógus címbetűje — magas kontrasztú, szűk sorközzel szedve
const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "BidVip — Aukciós Ház",
  description: "Buy and sell validated startup projects through secure, AI-assisted, transparent auctions. Develop your idea with AI, then auction it to the highest bidder.",
  openGraph: {
    title: "BidVip — Aukciós Ház",
    description: "Buy and sell validated startup projects through secure, AI-assisted, transparent auctions.",
    url: "https://bidvip.vercel.app",
    siteName: "BidVip",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BidVip — Aukciós Ház",
    description: "Buy and sell validated startup projects through secure, AI-assisted, transparent auctions.",
  },
  metadataBase: new URL("https://bidvip.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hu"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
