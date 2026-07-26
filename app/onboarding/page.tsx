'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [valasztott, setValasztott] = useState<'vevo' | 'elado' | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function mentes() {
    if (!valasztott) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      szerepkor: valasztott,
    })

    if (!error) {
      router.push('/dashboard')
    } else {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="flex items-center px-8 py-5 border-b border-gray-800">
        <span className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </span>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold text-center mb-2">How do you want to use BidVip?</h1>
          <p className="text-gray-400 text-center mb-10">You can change this anytime in your settings.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setValasztott('vevo')}
              className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition ${
                valasztott === 'vevo'
                  ? 'border-violet-500 bg-violet-900/20'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <span className="text-5xl">🛒</span>
              <div className="text-center">
                <p className="font-bold text-lg mb-1">I&apos;m a Buyer</p>
                <p className="text-gray-400 text-sm">I&apos;m looking for projects to acquire — I browse, bid, and buy.</p>
              </div>
            </button>

            <button
              onClick={() => setValasztott('elado')}
              className={`flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition ${
                valasztott === 'elado'
                  ? 'border-violet-500 bg-violet-900/20'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <span className="text-5xl">💡</span>
              <div className="text-center">
                <p className="font-bold text-lg mb-1">I&apos;m a Seller</p>
                <p className="text-gray-400 text-sm">I want to sell my project, idea, or startup through an open auction.</p>
              </div>
            </button>
          </div>

          <button
            onClick={mentes}
            disabled={!valasztott || loading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition py-4 rounded-full font-semibold text-lg"
          >
            {loading ? 'Saving...' : 'Continue →'}
          </button>
        </div>
      </div>
    </main>
  )
}
