'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [jelszo, setJelszo] = useState('')
  const [jelszo2, setJelszo2] = useState('')
  const [allapot, setAllapot] = useState<'idle' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    if (jelszo !== jelszo2) {
      setHiba('Passwords do not match.')
      setAllapot('hiba')
      return
    }
    setAllapot('loading')
    const { error } = await supabase.auth.updateUser({ password: jelszo })
    if (error) {
      setHiba(error.message)
      setAllapot('hiba')
    } else {
      setAllapot('siker')
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="flex items-center px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Set new password</h2>
          <p className="text-gray-400 text-sm mb-8">Choose a new password for your account.</p>

          {allapot === 'siker' ? (
            <div className="bg-violet-900/40 border border-violet-700 rounded-2xl px-6 py-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-violet-300 font-semibold">Password updated!</p>
              <p className="text-gray-400 text-sm mt-2">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={beküldes} className="flex flex-col gap-4">
              <input
                type="password"
                required
                minLength={6}
                value={jelszo}
                onChange={e => setJelszo(e.target.value)}
                placeholder="New password (min. 6 characters)"
                className="px-5 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              <input
                type="password"
                required
                minLength={6}
                value={jelszo2}
                onChange={e => setJelszo2(e.target.value)}
                placeholder="Confirm new password"
                className="px-5 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
              {allapot === 'hiba' && <p className="text-red-400 text-sm text-center">{hiba}</p>}
              <button
                type="submit"
                disabled={allapot === 'loading'}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition py-3 rounded-full font-semibold"
              >
                {allapot === 'loading' ? 'Saving...' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
