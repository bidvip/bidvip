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

const LEIRAS =
  'Ötletek aukciós háza. Nem kell kész terméked — hozd az ötletet, az AI segít ' +
  'kidolgozni, felbecsüljük mennyit ér, és élő aukción értékesítjük komoly vevők előtt.'

export const metadata: Metadata = {
  // A címsablon miatt az aloldalak automatikusan „Beküldés — BidVip" alakot kapnak
  title: {
    default: 'BidVip — Ötletek aukciós háza',
    template: '%s — BidVip',
  },
  description: LEIRAS,
  applicationName: 'BidVip',
  keywords: ['startup ötlet', 'ötlet eladása', 'aukció', 'piactér', 'üzleti ötlet', 'BidVip'],
  openGraph: {
    title: 'BidVip — Ötletek aukciós háza',
    description: LEIRAS,
    url: ALAP_URL,
    siteName: 'BidVip',
    locale: 'hu_HU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BidVip — Ötletek aukciós háza',
    description: LEIRAS,
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  metadataBase: new URL('https://bidvip.vercel.app'),
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
      <body className="min-h-full flex flex-col">
        {/* Billentyűzettel érkezőnek ne kelljen minden oldalon átlépkednie
            a teljes fejlécen. Csak fókuszra jelenik meg. */}
        <a href="#tartalom" className="ugrolink">Ugrás a tartalomra</a>
        {children}
      </body>
    </html>
  );
}
