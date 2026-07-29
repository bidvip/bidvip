import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#100C0F', color: '#F5F0E8' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ opacity: 0.015,
          backgroundImage: 'radial-gradient(circle, #F5F0E8 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <nav className="relative z-10 flex items-center px-8 py-5" style={{ borderBottom: '1px solid #2E2028', backdropFilter: 'blur(8px)' }}>
        <Link href="/" className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
          Bid<span style={{ color: '#DC2626' }}>Vip</span>
        </Link>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <div className="text-7xl mb-6 select-none" style={{ filter: 'grayscale(0.2)' }}>📺</div>
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-6"
            style={{ color: '#DC2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#DC2626' }} />
            Channel 404 — Off Air
          </div>
          <h1 className="text-4xl font-black mb-3" style={{ letterSpacing: '-0.04em' }}>No signal.</h1>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#9C8B7A' }}>
            This channel doesn&apos;t exist — or the auction has already ended. Try tuning to another frequency.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/marketplace"
              className="font-black text-sm px-6 py-3 rounded-lg transition"
              style={{ background: '#DC2626', color: '#fff', boxShadow: '0 0 24px rgba(220,38,38,0.25)' }}
              onMouseEnter={undefined}>
              Aukciós Ház →
            </Link>
            <Link href="/"
              className="text-sm font-semibold px-6 py-3 rounded-lg transition"
              style={{ border: '1px solid #2E2028', color: '#9C8B7A' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
