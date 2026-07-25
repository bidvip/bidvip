'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/auth')
      } else {
        setUser(data.user)
        setLoading(false)
      }
    })
  }, [])

  async function kilepes() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Betöltés...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">
          Bid<span className="text-violet-500">Vip</span>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <button
            onClick={kilepes}
            className="border border-gray-700 hover:border-gray-500 transition px-4 py-2 rounded-full text-sm"
          >
            Kilépés
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Üdv, <span className="text-violet-400">{user?.email?.split('@')[0]}</span>!</h1>
        <p className="text-gray-400 mb-10">Ez a te BidVip dashboardod — hamarosan itt kezelheted a projektjeidet.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Saját projektek</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Aktív licitek</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-1">Lezárt tranzakciók</p>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-4">💡</div>
          <h2 className="text-xl font-bold mb-2">Töltsd fel az első projektedet</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm">Adj el egy ötletet, prototípust vagy bizonyított projektet — a piac dönti el az árat.</p>
          <a href="/projekt-feltoltes" className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
            + Projekt feltöltése
          </a>
        </div>
      </div>
    </main>
  )
}
