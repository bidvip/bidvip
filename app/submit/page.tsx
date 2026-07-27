'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'

const categories = [
  'SaaS / Software', 'E-commerce', 'Mobile App', 'Content / Blog',
  'Marketplace', 'Fintech', 'Edtech', 'Healthtech', 'Other',
]

const SUBMIT_COST = 25
const FILE_COST = 2
const DURATION_COST: Record<string, number> = { '7': 0, '14': 5, '30': 15 }
const CHAT_COST = 2

type Feedback = {
  score: number
  verdict: string
  strengths: string[]
  improvements: string[]
  ready: boolean
}

type Fajl = { nev: string; url: string; tipus: string; szoveg?: string }
type ChatUzenet = { role: 'user' | 'assistant'; content: string }

function SubmitInner() {
  const router = useRouter()
  const supabase = createClient()
  const chatVegRef = useRef<HTMLDivElement>(null)

  const [lepes, setLepes] = useState<1 | 2 | 3>(1)

  const [form, setForm] = useState({
    nev: '',
    rovid_leiras: '',
    reszletes_leiras: '',
    kategoria: '',
    kikialtasi_ar: '',
    idotartam_nap: '14',
    van_domain: false,
    van_kod: false,
    van_feliratkozok: false,
    van_bevetel: false,
  })

  const [kivalasztottFajlok, setKivalasztottFajlok] = useState<File[]>([])
  const [feltoltottFajlok, setFeltoltottFajlok] = useState<Fajl[]>([])
  const [feltoltesAllapot, setFeltoltesAllapot] = useState<'idle' | 'loading'>('idle')

  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [feedbackAllapot, setFeedbackAllapot] = useState<'idle' | 'loading'>('idle')

  // Step 2 — chat
  const [chatUzenetek, setChatUzenetek] = useState<ChatUzenet[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatAllapot, setChatAllapot] = useState<'idle' | 'loading'>('idle')
  const [chatKeszen, setChatKeszen] = useState(false)
  const [chatScore, setChatScore] = useState<number | null>(null)
  const [tokenEgyenleg, setTokenEgyenleg] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [allapot, setAllapot] = useState<'idle' | 'szures' | 'loading' | 'siker' | 'hiba'>('idle')
  const [hiba, setHiba] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [felfuggesztve, setFelfuggesztve] = useState<string | null>(null)
  const [chatFajlAllapot, setChatFajlAllapot] = useState<'idle' | 'loading'>('idle')
  const chatFajlInputRef = useRef<HTMLInputElement>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    if (chatVegRef.current) chatVegRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [chatUzenetek])

  useEffect(() => {
    if (!draftId || chatScore === null) return
    localStorage.setItem(`bv_score_${draftId}`, JSON.stringify({ score: chatScore, keszen: chatKeszen }))
  }, [chatScore, chatKeszen, draftId])

  useEffect(() => {
    async function ellenorizFelfuggesztes() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch(`/api/suspension?user_id=${user.id}`)
      const data = await res.json()
      if (data.suspended) setFelfuggesztve(data.ok || 'A tartalmad megszegte a marketplace szabályait.')
    }
    ellenorizFelfuggesztes()
  }, [])

  useEffect(() => {
    const draft = searchParams.get('draft')
    if (!draft) return
    async function betoltDraft() {
      const supabaseClient = createClient()
      const { data } = await supabaseClient.from('projektek').select('*').eq('id', draft).eq('statusz', 'draft').single()
      if (!data) return
      setForm(prev => ({
        ...prev,
        nev: data.nev || '',
        rovid_leiras: data.rovid_leiras || '',
        reszletes_leiras: data.reszletes_leiras || '',
        kategoria: data.kategoria || '',
        van_domain: data.van_domain || false,
        van_kod: data.van_kod || false,
        van_feliratkozok: data.van_feliratkozok || false,
        van_bevetel: data.van_bevetel || false,
      }))
      if (data.fajlok) setFeltoltottFajlok(data.fajlok)
      setDraftId(draft)
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: tokenData } = await supabaseClient.from('tokenek').select('egyenleg').eq('user_id', user.id).single()
        setTokenEgyenleg(tokenData?.egyenleg ?? 0)
      }
      const stepParam = new URLSearchParams(window.location.search).get('step')
      if (stepParam === '3') {
        setLepes(3)
        return
      }
      setLepes(2)

      if (data.chat_elozmenyek && data.chat_elozmenyek.length > 0) {
        setChatUzenetek(data.chat_elozmenyek)
        setChatAllapot('idle')
        const savedScore = localStorage.getItem(`bv_score_${draft}`)
        if (savedScore) {
          try {
            const { score, keszen } = JSON.parse(savedScore)
            setChatScore(score)
            setChatKeszen(keszen)
          } catch { /* ignore */ }
        }
      } else {
        setChatAllapot('loading')
        try {
          const projektAdat = { nev: data.nev, kategoria: data.kategoria, rovid_leiras: data.rovid_leiras, reszletes_leiras: data.reszletes_leiras }
          const { score, keszen } = await chatStream(
            'Hello! I just passed the initial screening. Can you help me refine my idea further?',
            [],
            projektAdat,
            (text) => setChatUzenetek([{ role: 'assistant', content: text }])
          )
          setChatKeszen(keszen)
          setChatScore(score)
        } catch {
          setChatUzenetek([{ role: 'assistant', content: 'Welcome back! Let\'s continue refining your idea.' }])
        } finally {
          setChatAllapot('idle')
        }
      }
    }
    betoltDraft()
  }, [])

  function frissit(mezo: string, ertek: string | boolean) {
    setForm(prev => ({ ...prev, [mezo]: ertek }))
    if (feedback) setFeedback(null)
  }

  function fajlValasztas(e: React.ChangeEvent<HTMLInputElement>) {
    const fajlok = Array.from(e.target.files || [])
    setKivalasztottFajlok(prev => [...prev, ...fajlok].slice(0, 5))
    e.target.value = ''
    if (feedback) setFeedback(null)
  }

  function fajlTorles(index: number) {
    setKivalasztottFajlok(prev => prev.filter((_, i) => i !== index))
    setFeltoltottFajlok(prev => prev.filter((_, i) => i !== index))
    if (feedback) setFeedback(null)
  }

  async function aiFeedback() {
    if (!form.nev || !form.rovid_leiras || !form.reszletes_leiras || !form.kategoria) {
      setHiba('Fill in all fields before getting AI feedback.')
      return
    }
    setHiba('')
    setFeedbackAllapot('loading')

    let kepUrlok: string[] = feltoltottFajlok.filter(f => f.tipus.startsWith('image/')).map(f => f.url)
    const ujFajlok: Fajl[] = [...feltoltottFajlok]
    const ujak = kivalasztottFajlok.slice(feltoltottFajlok.length)
    if (ujak.length > 0) {
      setFeltoltesAllapot('loading')
      for (const fajl of ujak) {
        const fd = new FormData()
        fd.append('fajl', fajl)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) { const data = await res.json(); ujFajlok.push(data) }
      }
      setFeltoltottFajlok(ujFajlok)
      setFeltoltesAllapot('idle')
      kepUrlok = ujFajlok.filter(f => f.tipus.startsWith('image/')).map(f => f.url)
    }

    const fajlSzovegek = ujFajlok.filter(f => !f.tipus.startsWith('image/') && f.szoveg).map(f => f.szoveg as string)
    const res = await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nev: form.nev, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras, kategoria: form.kategoria, kepUrlok, fajlSzovegek }),
    })
    const data = await res.json()
    if (data.score === -1) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            user_email: user.email,
            nev: form.nev,
            rovid_leiras: form.rovid_leiras,
            reszletes_leiras: form.reszletes_leiras,
            kategoria: form.kategoria,
            block_reason: data.block_reason || 'Content violates marketplace rules.',
            fajlok: feltoltottFajlok,
          }),
        })
        setFelfuggesztve(data.block_reason || 'Content violates marketplace rules.')
      }
      setFeedbackAllapot('idle')
      return
    }
    setFeedback(data)
    setFeedbackAllapot('idle')
  }

  async function chatStream(uzenet: string, elozmenyek: ChatUzenet[], projektAdat: object, onChunk: (text: string) => void, fajlokParam?: Fajl[]): Promise<{ score: number | null; keszen: boolean }> {
    const fajlok = fajlokParam ?? feltoltottFajlok
    const kepUrlok = fajlok.filter(f => f.tipus.startsWith('image/')).map(f => f.url)
    const fajlSzovegek = fajlok.filter(f => !f.tipus.startsWith('image/') && f.szoveg).map(f => f.szoveg as string)
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uzenet, elozmenyek, projekt: projektAdat, kepUrlok, fajlSzovegek }),
    })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let acc = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      acc += decoder.decode(value, { stream: true })
      const metaIdx = acc.indexOf('__BIDVIP_META__')
      if (metaIdx !== -1) {
        const displayText = acc.substring(0, metaIdx).replace(/\{"score":\s*[\d.]+,\s*"keszen":\s*(true|false)\}/g, '').trim()
        onChunk(displayText)
        try {
          const meta = JSON.parse(acc.substring(metaIdx + '__BIDVIP_META__'.length))
          return { score: meta.score, keszen: meta.keszen ?? false }
        } catch { return { score: null, keszen: false } }
      } else {
        const display = acc.replace(/\{"score":\s*[\d.]+,\s*"keszen":\s*(true|false)\}/g, '').trim()
        onChunk(display)
      }
    }
    return { score: null, keszen: false }
  }

  async function chatFajlFeltoltes(e: React.ChangeEvent<HTMLInputElement>) {
    const fajl = e.target.files?.[0]
    if (!fajl) return
    e.target.value = ''
    if (feltoltottFajlok.length >= 5) { setHiba('Maximum 5 files allowed.'); return }
    if ((tokenEgyenleg ?? 0) < CHAT_COST) { setHiba('Not enough tokens to send a message.'); return }

    setChatFajlAllapot('loading')
    const fd = new FormData()
    fd.append('fajl', fajl)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const resData = await res.json()
    if (!res.ok) { setChatFajlAllapot('idle'); setHiba(`Upload failed: ${resData.error || res.status}`); return }
    const ujFajl: Fajl = resData
    const ujFajlok = [...feltoltottFajlok, ujFajl]
    setFeltoltottFajlok(ujFajlok)
    setChatFajlAllapot('idle')
    if (draftId) {
      await supabase.from('projektek').update({ fajlok: ujFajlok }).eq('id', draftId)
    }

    const spendRes = await fetch('/api/tokens/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount: CHAT_COST }),
    })
    if (!spendRes.ok) { setHiba('Token deduction failed.'); return }
    const spendData = await spendRes.json()
    setTokenEgyenleg(spendData.uj_egyenleg)
    setHiba('')

    const uzenet = `I've uploaded a file: "${fajl.name}". Please review its contents and tell me how it supports my listing and what could be improved.`
    const ujUzenet: ChatUzenet = { role: 'user', content: uzenet }
    const ujUzenetek = [...chatUzenetek, ujUzenet]
    setChatUzenetek([...ujUzenetek, { role: 'assistant', content: '' }])
    setChatAllapot('loading')

    try {
      const projektAdat = { nev: form.nev, kategoria: form.kategoria, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras }
      let vegsoValasz = ''
      const { score, keszen } = await chatStream(uzenet, chatUzenetek, projektAdat,
        (text) => { vegsoValasz = text; setChatUzenetek([...ujUzenetek, { role: 'assistant', content: text }]) },
        ujFajlok
      )
      setChatKeszen(keszen)
      setChatScore(score)
      if (draftId && vegsoValasz) {
        const mentendoUzenetek = [...ujUzenetek, { role: 'assistant', content: vegsoValasz }]
        await supabase.from('projektek').update({ chat_elozmenyek: mentendoUzenetek }).eq('id', draftId)
      }
    } catch {
      setChatUzenetek([...ujUzenetek, { role: 'assistant', content: 'Connection error. Your token was refunded. Please try again.' }])
      setTokenEgyenleg(prev => (prev ?? 0) + CHAT_COST)
    } finally {
      setChatAllapot('idle')
    }
  }

  async function lepés1Tovabb() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const { data: tokenData } = await supabase.from('tokenek').select('egyenleg').eq('user_id', user.id).single()
    setTokenEgyenleg(tokenData?.egyenleg ?? 0)
    setUserId(user.id)
    setChatAllapot('loading')
    setLepes(2)
    // Save draft
    if (!draftId) {
      const { data: draft } = await supabase.from('projektek').insert([{
        user_id: user.id,
        nev: form.nev,
        rovid_leiras: form.rovid_leiras,
        reszletes_leiras: form.reszletes_leiras,
        kategoria: form.kategoria,
        badge: 'idea',
        kikialtasi_ar: 0,
        lejarat: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        statusz: 'draft',
        user_email: user.email,
        fajlok: feltoltottFajlok,
      }]).select().single()
      if (draft) {
        setDraftId(draft.id)
        window.history.replaceState(null, '', `/submit?draft=${draft.id}`)
      }
    } else {
      await supabase.from('projektek').update({
        nev: form.nev,
        rovid_leiras: form.rovid_leiras,
        reszletes_leiras: form.reszletes_leiras,
        kategoria: form.kategoria,
        fajlok: feltoltottFajlok,
      }).eq('id', draftId)
    }
    setChatUzenetek([{ role: 'assistant', content: '' }])
    try {
      const projektAdat = { nev: form.nev, kategoria: form.kategoria, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras }
      let vegsoSzoveg = ''
      const { score, keszen } = await chatStream(
        'Hello! I just passed the initial screening. Can you help me refine my idea further?',
        [],
        projektAdat,
        (text) => { vegsoSzoveg = text; setChatUzenetek([{ role: 'assistant', content: text }]) }
      )
      setChatKeszen(keszen)
      setChatScore(score)
      if (draftId && vegsoSzoveg) {
        const mentendoUzenetek = [{ role: 'assistant', content: vegsoSzoveg }]
        await supabase.from('projektek').update({ chat_elozmenyek: mentendoUzenetek }).eq('id', draftId)
      }
    } catch (e) {
      setChatUzenetek([{ role: 'assistant', content: 'Failed to connect to AI. Please try again.' }])
    } finally {
      setChatAllapot('idle')
    }
  }

  async function chatKuldes() {
    if (!chatInput.trim() || chatAllapot === 'loading') return
    if ((tokenEgyenleg ?? 0) < CHAT_COST) {
      setHiba(`Not enough tokens. You need ${CHAT_COST} but have ${tokenEgyenleg}.`)
      return
    }

    const spendRes = await fetch('/api/tokens/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount: CHAT_COST }),
    })
    if (!spendRes.ok) { setHiba('Token deduction failed.'); return }
    const spendData = await spendRes.json()
    setTokenEgyenleg(spendData.uj_egyenleg)
    setHiba('')

    const ujUzenet: ChatUzenet = { role: 'user', content: chatInput }
    const ujUzenetek = [...chatUzenetek, ujUzenet]
    setChatUzenetek(ujUzenetek)
    setChatInput('')
    setChatAllapot('loading')

    const ujValasz: ChatUzenet = { role: 'assistant', content: '' }
    setChatUzenetek([...ujUzenetek, ujValasz])
    try {
      const projektAdat = { nev: form.nev, kategoria: form.kategoria, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras }
      let vegsoValasz = ''
      const { score, keszen } = await chatStream(
        chatInput,
        chatUzenetek,
        projektAdat,
        (text) => { vegsoValasz = text; setChatUzenetek([...ujUzenetek, { role: 'assistant', content: text }]) }
      )
      setChatKeszen(keszen)
      setChatScore(score)
      if (draftId && vegsoValasz) {
        const mentendoUzenetek = [...ujUzenetek, { role: 'assistant', content: vegsoValasz }]
        await supabase.from('projektek').update({ chat_elozmenyek: mentendoUzenetek }).eq('id', draftId)
      }
    } catch (e) {
      await fetch('/api/tokens/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: -CHAT_COST }),
      })
      setTokenEgyenleg((prev) => (prev ?? 0) + CHAT_COST)
      setChatUzenetek([...ujUzenetek, { role: 'assistant', content: 'Connection error. Your token was refunded. Please try again.' }])
    } finally {
      setChatAllapot('idle')
    }
  }

  async function lepés2Tovabb() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    const { data: tokenData } = await supabase.from('tokenek').select('egyenleg').eq('user_id', user.id).single()
    setTokenEgyenleg(tokenData?.egyenleg ?? 0)
    setLepes(3)
  }

  const totalCost = SUBMIT_COST + feltoltottFajlok.length * FILE_COST + (DURATION_COST[form.idotartam_nap] ?? 0)

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    setHiba('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    if ((tokenEgyenleg ?? 0) < totalCost) {
      setHiba(`Not enough tokens. You need ${totalCost} but have ${tokenEgyenleg}.`)
      return
    }

    const spendRes = await fetch('/api/tokens/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: totalCost }),
    })
    const spendData = await spendRes.json()
    if (!spendRes.ok) {
      setHiba(spendData.error === 'insufficient_tokens'
        ? `Not enough tokens. You need ${totalCost} but have ${spendData.egyenleg}.`
        : 'Token deduction failed. Please try again.')
      return
    }

    setAllapot('szures')

    const fajlSzovegek = feltoltottFajlok.filter(f => !f.tipus.startsWith('image/') && f.szoveg).map(f => f.szoveg as string)
    const kepUrlok = feltoltottFajlok.filter(f => f.tipus.startsWith('image/')).map(f => f.url)
    const validateRes = await fetch('/api/ai/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nev: form.nev, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras, kategoria: form.kategoria, fajlSzovegek, kepUrlok }),
    })
    const validateData = validateRes.ok ? await validateRes.json() : { ok: true }
    if (!validateData.ok) {
      setHiba(validateData.reason || 'Your submission did not pass our content check. Please ensure it contains a real business idea.')
      setAllapot('hiba')
      return
    }

    setAllapot('loading')

    const badge = form.van_bevetel ? 'proven' : (form.van_kod || form.van_feliratkozok) ? 'prototype' : 'idea'

    const projektAdat = {
      nev: form.nev,
      rovid_leiras: form.rovid_leiras,
      reszletes_leiras: form.reszletes_leiras,
      kategoria: form.kategoria,
      badge,
      kikialtasi_ar: parseInt(form.kikialtasi_ar),
      lejarat: new Date(Date.now() + parseInt(form.idotartam_nap) * 24 * 60 * 60 * 1000).toISOString(),
      van_domain: form.van_domain,
      van_kod: form.van_kod,
      van_feliratkozok: form.van_feliratkozok,
      van_bevetel: form.van_bevetel,
      statusz: 'aktiv',
      fajlok: feltoltottFajlok,
    }

    const { error } = draftId
      ? await supabase.from('projektek').update(projektAdat).eq('id', draftId)
      : await supabase.from('projektek').insert([{ ...projektAdat, user_id: user.id, user_email: user.email }])

    if (error) {
      setHiba('Something went wrong. Please try again.')
      setAllapot('hiba')
    } else {
      setAllapot('siker')
    }
  }

  if (felfuggesztve) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Account suspended</h2>
        <p className="text-gray-400 mb-2 text-center">Your account has been temporarily suspended pending review.</p>
        <div className="bg-red-900/20 border border-red-800 rounded-xl px-5 py-3 mb-6 text-sm text-red-300 max-w-md text-center">
          <strong>Reason:</strong> {felfuggesztve}
        </div>
        <p className="text-gray-500 text-sm text-center max-w-sm">An admin will review your submission and you will be notified by email of the outcome.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-6 border border-gray-700 text-gray-400 hover:text-white transition px-6 py-3 rounded-full">
          Back to Dashboard
        </button>
      </main>
    )
  }

  if (allapot === 'siker') {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Project submitted!</h2>
        <p className="text-gray-400 mb-3 text-center">Your project is now live on the marketplace.</p>
        <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-800 rounded-xl px-4 py-3 mb-6 text-sm text-amber-300">
          <span>🔒</span>
          <span>This project has been submitted and <strong>cannot be edited</strong>.</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="bg-violet-600 hover:bg-violet-700 transition px-6 py-3 rounded-full font-semibold">
          Back to Dashboard
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <a href="/" className="text-2xl font-bold tracking-tight">Bid<span className="text-violet-500">Vip</span></a>
        <a href="/dashboard" className="text-gray-400 text-sm hover:text-white transition">← Back</a>
      </nav>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-2 flex items-center gap-2">
        {[
          { n: 1, label: 'Describe' },
          { n: 2, label: 'Refine with AI' },
          { n: 3, label: 'Submit' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 text-sm font-semibold ${lepes === s.n ? 'text-violet-400' : lepes > s.n ? 'text-gray-500' : 'text-gray-600'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border shrink-0 ${lepes === s.n ? 'border-violet-500 bg-violet-900/40' : lepes > s.n ? 'border-gray-600 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
                {lepes > s.n ? '✓' : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <div className="h-px flex-1 bg-gray-800 mx-1" />}
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* STEP 1 */}
        {lepes === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Describe your project</h1>
              <p className="text-gray-400">Get AI feedback — the AI also reviews your uploaded images.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Project name *</label>
                <input value={form.nev} onChange={e => frissit('nev', e.target.value)} placeholder="e.g. AI-powered customer support SaaS"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Short description * (max 150 chars)</label>
                <input maxLength={150} value={form.rovid_leiras} onChange={e => frissit('rovid_leiras', e.target.value)} placeholder="What does it do in one sentence?"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Detailed description *</label>
                <textarea rows={6} value={form.reszletes_leiras} onChange={e => frissit('reszletes_leiras', e.target.value)}
                  placeholder="What problem does it solve? Who is the target customer? What's the competitive advantage? What's included in the sale?"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Category *</label>
                <select value={form.kategoria} onChange={e => frissit('kategoria', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-violet-500">
                  <option value="">Select a category...</option>
                  {categories.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
              <h2 className="font-semibold">What&apos;s Included?</h2>
              {[
                { mezo: 'van_domain', label: 'Domain / URL' },
                { mezo: 'van_kod', label: 'Source code / repository' },
                { mezo: 'van_feliratkozok', label: 'Email list / subscribers' },
                { mezo: 'van_bevetel', label: 'Proven revenue' },
              ].map(item => (
                <label key={item.mezo} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[item.mezo as keyof typeof form] as boolean}
                    onChange={e => frissit(item.mezo, e.target.checked)} className="w-5 h-5 accent-violet-500" />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-semibold">Files & Media <span className="text-gray-500 font-normal text-sm">(optional)</span></h2>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-violet-500 rounded-xl py-6 cursor-pointer transition">
                <span className="text-3xl mb-2">📎</span>
                <span className="text-gray-400 text-sm">Click to select files</span>
                <span className="text-gray-600 text-xs mt-1">Images, PDF, Word, Excel — max 5 files, 10MB each</span>
                <input type="file" multiple accept="image/*,.pdf,.docx,.xlsx" onChange={fajlValasztas} className="hidden" />
              </label>
              {kivalasztottFajlok.length > 0 && (
                <div className="flex flex-col gap-2">
                  {kivalasztottFajlok.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-xl text-sm">
                      <span className="text-gray-300 truncate">{f.type.startsWith('image/') ? '🖼️' : f.type === 'application/pdf' ? '📄' : '📊'} {f.name}</span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {feltoltottFajlok[i] ? <span className="text-green-400 text-xs">✓</span> : <span className="text-gray-500 text-xs">pending</span>}
                        <button type="button" onClick={() => fajlTorles(i)} className="text-gray-500 hover:text-red-400 transition">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hiba && <p className="text-red-400 text-sm">{hiba}</p>}

            {feedback && (
              <div className={`rounded-2xl border p-6 flex flex-col gap-4 ${feedback.score === -1 ? 'border-red-700 bg-red-900/10' : feedback.ready ? 'border-green-700 bg-green-900/10' : 'border-amber-700 bg-amber-900/10'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">🤖 AI Feedback</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${feedback.score === -1 ? 'text-red-500' : feedback.score >= 7 ? 'text-green-400' : feedback.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                      {feedback.score === -1 ? '-1' : feedback.score}/10
                    </span>
                    {feedback.score === -1
                      ? <span className="text-xs bg-red-900/40 text-red-400 border border-red-800 px-2 py-1 rounded-full">🚫 Blocked</span>
                      : feedback.ready
                        ? <span className="text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-1 rounded-full">Ready</span>
                        : <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-800 px-2 py-1 rounded-full">Needs improvement</span>}
                  </div>
                </div>
                {feedback.score === -1 ? (
                  <p className="text-red-300 text-sm">Your content violates marketplace policies. Your account has been suspended pending admin review.</p>
                ) : (
                  <>
                    <p className="text-gray-300 text-sm italic">&quot;{feedback.verdict}&quot;</p>
                    {feedback.strengths.length > 0 && (
                      <div>
                        <p className="text-green-400 text-xs font-semibold mb-1 uppercase tracking-wide">Strengths</p>
                        {feedback.strengths.map((s, i) => <p key={i} className="text-gray-300 text-sm">✓ {s}</p>)}
                      </div>
                    )}
                    {feedback.improvements.length > 0 && (
                      <div>
                        <p className="text-amber-400 text-xs font-semibold mb-1 uppercase tracking-wide">Improve</p>
                        {feedback.improvements.map((s, i) => <p key={i} className="text-gray-300 text-sm">→ {s}</p>)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <button type="button" onClick={aiFeedback}
              disabled={feedbackAllapot === 'loading' || feltoltesAllapot === 'loading' || !form.nev || !form.rovid_leiras || !form.reszletes_leiras || !form.kategoria}
              className="w-full py-3 rounded-full border border-violet-700 text-violet-400 hover:bg-violet-900/20 disabled:opacity-60 transition font-semibold">
              {feltoltesAllapot === 'loading' ? '📎 Uploading...' : feedbackAllapot === 'loading' ? '🤖 Analyzing...' : feedback ? '🔄 Re-analyze' : '🤖 Get AI Feedback (free)'}
            </button>

            {feedback && !feedback.ready && (
              <p className="text-amber-400 text-sm text-center">Improve your listing based on the feedback, then re-analyze.</p>
            )}

            {feedback?.ready && (
              <button type="button" onClick={lepés1Tovabb}
                className="w-full bg-violet-600 hover:bg-violet-700 transition py-3 rounded-full font-semibold">
                ✓ Continue to AI Mentor →
              </button>
            )}
          </div>
        )}

        {/* STEP 2 — Sonnet 5 Chat */}
        {lepes === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <button type="button" onClick={() => setLepes(1)} className="text-gray-500 hover:text-gray-300 text-sm mb-3 transition">← Back</button>
              <h1 className="text-3xl font-bold mb-1">Refine with AI Mentor</h1>
              <p className="text-gray-400">Chat with Sonnet 5 to make your idea market-ready. <span className="text-violet-400">{CHAT_COST} tokens/message</span> · Balance: <span className={`font-semibold ${(tokenEgyenleg ?? 0) < CHAT_COST ? 'text-red-400' : 'text-white'}`}>{tokenEgyenleg ?? '...'}</span></p>
            {chatScore !== null && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${chatScore >= 8.5 ? 'bg-green-500' : chatScore >= 7 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${chatScore * 10}%` }} />
                </div>
                <span className={`text-sm font-bold ${chatScore >= 8.5 ? 'text-green-400' : chatScore >= 7 ? 'text-amber-400' : 'text-red-400'}`}>{chatScore}/10</span>
                <span className="text-xs text-gray-500">need 8.5</span>
              </div>
            )}
            </div>

            {/* Chat messages */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
              {chatUzenetek.map((u, i) => (
                <div key={i} className={`flex ${u.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${u.role === 'user' ? 'bg-violet-700 text-white' : 'bg-gray-800 text-gray-200'}`}>
                    {u.content.split('\n').map((sor, j) => <p key={j} className={j > 0 ? 'mt-2' : ''}>{sor}</p>)}
                  </div>
                </div>
              ))}
              {chatAllapot === 'loading' && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 px-4 py-3 rounded-2xl text-sm text-gray-400 animate-pulse">Thinking...</div>
                </div>
              )}
              <div ref={chatVegRef} />
            </div>

            {hiba && <p className="text-red-400 text-sm">{hiba}</p>}

            {/* Attached files in chat */}
            {feltoltottFajlok.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {feltoltottFajlok.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-full text-xs text-gray-300">
                    <span>{f.tipus.startsWith('image/') ? '🖼️' : f.tipus === 'application/pdf' ? '📄' : '📊'}</span>
                    <span className="max-w-[120px] truncate">{f.nev}</span>
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatKuldes() } }}
                placeholder="Ask the AI mentor anything about your idea..."
                disabled={chatAllapot === 'loading' || chatFajlAllapot === 'loading'}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => chatFajlInputRef.current?.click()}
                disabled={chatAllapot === 'loading' || chatFajlAllapot === 'loading' || feltoltottFajlok.length >= 5}
                className="shrink-0 px-3 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 border border-gray-500 text-white disabled:opacity-40 transition font-bold text-base whitespace-nowrap">
                {chatFajlAllapot === 'loading' ? '...' : '+ File'}
              </button>
              <input ref={chatFajlInputRef} type="file" className="hidden" accept="image/*,.pdf,.docx,.xlsx" onChange={chatFajlFeltoltes} />
              <button onClick={chatKuldes} disabled={!chatInput.trim() || chatAllapot === 'loading' || chatFajlAllapot === 'loading' || (tokenEgyenleg ?? 0) < CHAT_COST}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 transition px-4 py-3 rounded-xl font-semibold text-sm shrink-0">
                Send
              </button>
            </div>

            {(tokenEgyenleg ?? 0) < CHAT_COST && (
              <p className="text-red-400 text-sm text-center">Not enough tokens. <a href="/tokens?redirect=/submit" className="text-violet-400 hover:underline">Buy tokens →</a></p>
            )}

            <div className="border-t border-gray-800 pt-4">
              {chatKeszen ? (
                <button type="button" onClick={lepés2Tovabb}
                  className="w-full bg-violet-600 hover:bg-violet-700 transition py-3 rounded-full font-semibold">
                  ✓ Market-ready — Set price & submit →
                </button>
              ) : (
                <p className="text-center text-gray-500 text-sm py-2">The AI will unlock this button when your idea is market-ready.</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3 — Price & Submit */}
        {lepes === 3 && (
          <form onSubmit={beküldes} className="flex flex-col gap-6">
            <div>
              <button type="button" onClick={() => setLepes(2)} className="text-gray-500 hover:text-gray-300 text-sm mb-3 transition">← Back</button>
              <h1 className="text-3xl font-bold mb-1">Set price & submit</h1>
              <p className="text-gray-400">Almost there — set your starting price and auction duration.</p>
            </div>

            <div className="bg-violet-900/20 border border-violet-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-violet-300">Submission cost</p>
                <p className="text-gray-400 text-sm">{SUBMIT_COST} base + {feltoltottFajlok.length} × {FILE_COST} files + {DURATION_COST[form.idotartam_nap] ?? 0} duration</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-violet-400">{totalCost} tokens</p>
                <p className={`text-xs ${(tokenEgyenleg ?? 0) < totalCost ? 'text-red-400' : 'text-gray-500'}`}>You have: {tokenEgyenleg ?? '...'}</p>
              </div>
            </div>

            {feltoltottFajlok.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400 font-semibold">{feltoltottFajlok.length} file(s) attached</p>
                  <span className="text-xs text-amber-400 flex items-center gap-1">🔒 Locked — cannot be removed after submit</span>
                </div>
                {feltoltottFajlok.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{f.tipus.startsWith('image/') ? '🖼️' : f.tipus === 'application/pdf' ? '📄' : '📊'}</span>
                    <span className="truncate">{f.nev}</span>
                    <span className="ml-auto text-violet-400 text-xs shrink-0">-{FILE_COST} tokens</span>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
              <h2 className="font-semibold">Starting Price</h2>
              <p className="text-gray-400 text-sm">The minimum bid the auction starts from (EUR).</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                <input required type="number" min={1} value={form.kikialtasi_ar} onChange={e => frissit('kikialtasi_ar', e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-3">
              <h2 className="font-semibold">Auction Duration</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { nap: '7', label: '7 days', sub: 'Fast sale', token: 0 },
                  { nap: '14', label: '14 days', sub: 'Recommended', token: 5 },
                  { nap: '30', label: '30 days', sub: 'More exposure', token: 15 },
                ].map(d => (
                  <button key={d.nap} type="button" onClick={() => frissit('idotartam_nap', d.nap)}
                    className={`flex flex-col items-center p-4 rounded-xl border transition ${form.idotartam_nap === d.nap ? 'border-violet-500 bg-violet-900/20' : 'border-gray-700 hover:border-gray-600'}`}>
                    <span className="font-bold">{d.label}</span>
                    <span className="text-xs text-gray-400 mt-1">{d.sub}</span>
                    <span className="text-xs text-violet-400 mt-1">{d.token === 0 ? 'included' : `+${d.token} tokens`}</span>
                  </button>
                ))}
              </div>
            </div>

            {hiba && <p className="text-red-400 text-sm text-center">{hiba}</p>}

            <button type="submit" disabled={allapot !== 'idle' && allapot !== 'hiba'}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition py-4 rounded-full font-semibold text-lg">
              {allapot === 'szures' ? '🤖 Checking content...' : allapot === 'loading' ? 'Submitting...' : `Submit Project — ${totalCost} tokens →`}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

export default function Submit() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="text-gray-400">Loading...</div></main>}>
      <SubmitInner />
    </Suspense>
  )
}
