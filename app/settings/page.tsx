'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const SZEREPKOR_LABEL: Record<string, string> = {
  elado: 'Seller',
  vevo: 'Buyer',
  mindketto: 'Buyer & Seller',
}

export default function Settings() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [szerepkor, setSzerepkor] = useState<string | null>(null)
  const [tokenEgyenleg, setTokenEgyenleg] = useState<number | null>(null)
  const [anonVevo, setAnonVevo] = useState<string | null>(null)
  const [anonElado, setAnonElado] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [ujJelszo, setUjJelszo] = useState('')
  const [ujJelszoMegint, setUjJelszoMegint] = useState('')
  const [jelszoAllapot, setJelszoAllapot] = useState<'idle' | 'loading' | 'ok' | 'hiba'>('idle')
  const [jelszoHiba, setJelszoHiba] = useState('')

  const [torlesAllapot, setTorlesAllapot] = useState(false)

  useEffect(() => {
    async function betolt() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/auth'); return }
      setUser(u)

      const [{ data: profil }, { data: tokenek }, { data: anonok }] = await Promise.all([
        supabase.from('profiles').select('szerepkor').eq('id', u.id).single(),
        supabase.from('tokenek').select('egyenleg').eq('user_id', u.id).single(),
        supabase.from('anon_nevek').select('nev, szerepkor').eq('user_id', u.id),
      ])

      setSzerepkor(profil?.szerepkor ?? null)
      setTokenEgyenleg(tokenek?.egyenleg ?? 0)

      const vevo = anonok?.find((a: any) => a.szerepkor === 'vevo')
      const elado = anonok?.find((a: any) => a.szerepkor === 'elado')
      setAnonVevo(vevo?.nev ?? null)
      setAnonElado(elado?.nev ?? null)
      setLoading(false)
    }
    betolt()
  }, [])

  async function jelszoValtoztat(e: React.FormEvent) {
    e.preventDefault()
    if (ujJelszo !== ujJelszoMegint) { setJelszoHiba('Passwords do not match.'); setJelszoAllapot('hiba'); return }
    if (ujJelszo.length < 8) { setJelszoHiba('Password must be at least 8 characters.'); setJelszoAllapot('hiba'); return }
    setJelszoAllapot('loading')
    const { error } = await supabase.auth.updateUser({ password: ujJelszo })
    if (error) { setJelszoHiba(error.message); setJelszoAllapot('hiba') }
    else { setJelszoAllapot('ok'); setUjJelszo(''); setUjJelszoMegint('') }
  }

  async function kijelentkezes() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 text-sm">Loading...</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-sm">
        <a href="/" className="text-2xl font-bold tracking-tight">Bid<span className="text-violet-500">Vip</span></a>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <a href="/dashboard" className="hover:text-white transition">Dashboard</a>
          <span>/</span>
          <span className="text-gray-300">Beállítások</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Fiókbeállítások</h1>
          <p className="text-gray-500 text-sm mt-1">Profilod, biztonságod és preferenciáid kezelése.</p>
        </div>

        {/* Profile */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-gray-400">Profile</h2>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <span className="text-[10px] text-gray-600 border border-gray-700 rounded-full px-2 py-0.5">read-only</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Role</p>
                <p className="text-sm font-medium">{SZEREPKOR_LABEL[szerepkor ?? ''] ?? szerepkor}</p>
              </div>
              <a href="/onboarding" className="text-[11px] text-violet-400 hover:text-violet-300 transition">Change →</a>
            </div>

            {(anonVevo || anonElado) && (
              <div className="py-3">
                <p className="text-xs text-gray-500 mb-2">Your anonymous names on BidVip</p>
                <div className="flex flex-col gap-1.5">
                  {anonVevo && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-blue-900/40 text-blue-400 border border-blue-800 rounded-full px-2 py-0.5">Buyer</span>
                      <span className="text-sm font-mono text-gray-300">{anonVevo}</span>
                    </div>
                  )}
                  {anonElado && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-800 rounded-full px-2 py-0.5">Seller</span>
                      <span className="text-sm font-mono text-gray-300">{anonElado}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 mt-2">Anonymous names protect your identity. They reset daily.</p>
              </div>
            )}
          </div>
        </section>

        {/* Tokens */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-gray-400">Token Balance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-violet-400">⚡ {tokenEgyenleg ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">tokens available for AI features</p>
            </div>
            <a href="/tokens"
              className="bg-violet-600 hover:bg-violet-700 transition text-white text-sm font-semibold px-5 py-2.5 rounded-full">
              Buy Tokens →
            </a>
          </div>
        </section>

        {/* Change Password */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-gray-400">Change Password</h2>
          <form onSubmit={jelszoValtoztat} className="flex flex-col gap-3">
            <input
              type="password" placeholder="New password" value={ujJelszo}
              onChange={e => { setUjJelszo(e.target.value); setJelszoAllapot('idle') }}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"
            />
            <input
              type="password" placeholder="Confirm new password" value={ujJelszoMegint}
              onChange={e => { setUjJelszoMegint(e.target.value); setJelszoAllapot('idle') }}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"
            />
            {jelszoAllapot === 'hiba' && <p className="text-red-400 text-xs">{jelszoHiba}</p>}
            {jelszoAllapot === 'ok' && <p className="text-green-400 text-xs font-semibold">✓ Password updated successfully.</p>}
            <button type="submit" disabled={jelszoAllapot === 'loading' || !ujJelszo}
              className="py-3 rounded-xl bg-gray-700 hover:bg-gray-600 disabled:opacity-40 transition text-sm font-semibold">
              {jelszoAllapot === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Sign out */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Sign Out</p>
            <p className="text-gray-500 text-xs mt-0.5">You will be redirected to the homepage.</p>
          </div>
          <button onClick={kijelentkezes}
            className="text-sm font-semibold px-5 py-2.5 rounded-full border border-gray-700 hover:border-gray-500 hover:text-white text-gray-400 transition">
            Sign Out
          </button>
        </section>

        {/* Danger zone */}
        <section className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-sm uppercase tracking-widest text-red-500">Danger Zone</h2>
          {!torlesAllapot ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-gray-500 text-xs mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <button onClick={() => setTorlesAllapot(true)}
                className="text-sm font-semibold px-5 py-2.5 rounded-full border border-red-800 text-red-400 hover:bg-red-900/30 transition">
                Delete
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-red-400 text-sm font-semibold">Are you sure? This is permanent.</p>
              <div className="flex gap-3">
                <button onClick={() => setTorlesAllapot(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition">
                  Cancel
                </button>
                <a href="mailto:support@bidvip.com?subject=Account deletion request"
                  className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold text-center transition">
                  Contact Support →
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
