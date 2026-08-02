import type { NextConfig } from "next";

/**
 * Biztonsági fejlécek.
 *
 * Ezek nem a szerverkódot védik, hanem a böngészőnek adnak utasítást arra,
 * mit NE engedjen meg. Enélkül a legjobban megírt végpont mellett is
 * beágyazható az oldal idegen keretbe, vagy futtatható rajta idegen szkript.
 */
const biztonsagiFejlecek = [
  // Csak HTTPS-en, két évig, aldomainekkel együtt
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Ne találgassa a böngésző a fájltípust
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Ne lehessen idegen oldalba ágyazni (kattintás-eltérítés ellen)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Külső oldalnak ne áruljuk el a teljes útvonalat
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nem kérünk kamerát, mikrofont, helyadatot — tiltsuk is le
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

/**
 * Tartalombiztonsági szabály.
 *
 * A 'unsafe-inline' és 'unsafe-eval' sajnos kell: a Next.js beágyazott
 * szkriptet és stílust használ, a fejlesztői mód pedig eval-t. Szigorúbb
 * szabályhoz nonce-alapú megoldás kellene, ami jelentős átalakítás —
 * addig is ez lényegesen jobb, mint a semmi.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'],

  // A böngésző ne indexelje/gyorsítótárazza rosszul a hibás típusokat
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:ut*',
        headers: [
          ...biztonsagiFejlecek,
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
};

export default nextConfig;
