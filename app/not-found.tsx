import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Background orb */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center px-8 py-5 border-b border-white/5">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <div className="text-8xl mb-6 select-none">📺</div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-red-400 uppercase bg-red-950/40 border border-red-800/40 px-4 py-2 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
            Channel 404 — Off Air
          </div>
          <h1 className="text-4xl font-black mb-3">No signal.</h1>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            This channel doesn&apos;t exist — or the auction has already ended. Try tuning to another frequency.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/marketplace"
              className="bg-violet-600 hover:bg-violet-500 transition px-6 py-3 rounded-xl font-semibold text-sm shadow-[0_0_20px_rgba(124,58,237,0.25)]">
              📺 Open Aukciós Ház
            </Link>
            <Link href="/"
              className="border border-gray-700 hover:border-gray-500 transition px-6 py-3 rounded-xl font-semibold text-sm text-gray-400 hover:text-white">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
