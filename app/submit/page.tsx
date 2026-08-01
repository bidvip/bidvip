'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter, useSearchParams } from 'next/navigation'
import KategoriaValaszto from '@/app/components/KategoriaValaszto'

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
    reserve_ar: '',
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
  const [step3FajlAllapot, setStep3FajlAllapot] = useState<'idle' | 'loading'>('idle')
  const step3FajlInputRef = useRef<HTMLInputElement>(null)
  const [aiErtekeles, setAiErtekeles] = useState<{ estimated_value: number; reasoning: string } | null>(null)
  const [ertekelesAllapot, setErtekelesAllapot] = useState<'idle' | 'loading'>('idle')

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
      if (stepParam === '3') { setLepes(3); return }
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
          setChatUzenetek([{ role: 'assistant', content: "Welcome back! Let's continue refining your idea." }])
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
          body: JSON.stringify({ user_id: user.id, user_email: user.email, nev: form.nev, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras, kategoria: form.kategoria, block_reason: data.block_reason || 'Content violates marketplace rules.', fajlok: feltoltottFajlok }),
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
    if (fajl.size > 10 * 1024 * 1024) { setHiba('File too large (max 10MB).'); return }
    if ((tokenEgyenleg ?? 0) < CHAT_COST) { setHiba('Not enough tokens to send a message.'); return }
    setChatFajlAllapot('loading')
    let ujFajl: Fajl
    try {
      const fd = new FormData()
      fd.append('fajl', fajl)
      if (userId) fd.append('user_id', userId)
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u?.email) fd.append('user_email', u.email)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const resData = await res.json()
      if (!res.ok) {
        if (resData.suspended) { setFelfuggesztve(resData.error); return }
        setHiba(`Upload failed: ${resData.error || res.status}`)
        return
      }
      ujFajl = resData
    } catch {
      setHiba('Upload failed: network error.')
      return
    } finally {
      setChatFajlAllapot('idle')
    }
    const ujFajlok = [...feltoltottFajlok, ujFajl]
    setFeltoltottFajlok(ujFajlok)
    setChatFajlAllapot('idle')
    if (draftId) await supabase.from('projektek').update({ fajlok: ujFajlok }).eq('id', draftId)
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
        await supabase.from('projektek').update({ chat_elozmenyek: [...ujUzenetek, { role: 'assistant', content: vegsoValasz }] }).eq('id', draftId)
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
    if (!draftId) {
      const { data: draft } = await supabase.from('projektek').insert([{
        user_id: user.id, nev: form.nev, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras,
        kategoria: form.kategoria, badge: 'idea', kikialtasi_ar: 0,
        lejarat: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        statusz: 'draft', fajlok: feltoltottFajlok,
      }]).select().single()
      if (draft) { setDraftId(draft.id); window.history.replaceState(null, '', `/submit?draft=${draft.id}`) }
    } else {
      await supabase.from('projektek').update({ nev: form.nev, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras, kategoria: form.kategoria, fajlok: feltoltottFajlok }).eq('id', draftId)
    }
    setChatUzenetek([{ role: 'assistant', content: '' }])
    try {
      const projektAdat = { nev: form.nev, kategoria: form.kategoria, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras }
      let vegsoSzoveg = ''
      const { score, keszen } = await chatStream(
        'Hello! I just passed the initial screening. Can you help me refine my idea further?',
        [], projektAdat,
        (text) => { vegsoSzoveg = text; setChatUzenetek([{ role: 'assistant', content: text }]) }
      )
      setChatKeszen(keszen)
      setChatScore(score)
      if (draftId && vegsoSzoveg) {
        await supabase.from('projektek').update({ chat_elozmenyek: [{ role: 'assistant', content: vegsoSzoveg }] }).eq('id', draftId)
      }
    } catch {
      setChatUzenetek([{ role: 'assistant', content: 'Failed to connect to AI. Please try again.' }])
    } finally {
      setChatAllapot('idle')
    }
  }

  async function chatKuldes() {
    if (!chatInput.trim() || chatAllapot === 'loading') return
    if ((tokenEgyenleg ?? 0) < CHAT_COST) { setHiba(`Not enough tokens. You need ${CHAT_COST} but have ${tokenEgyenleg}.`); return }
    const spendRes = await fetch('/api/tokens/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, amount: CHAT_COST }),
    })
    if (!spendRes.ok) { setHiba('Token deduction failed.'); return }
    setTokenEgyenleg((await spendRes.json()).uj_egyenleg)
    setHiba('')
    const ujUzenet: ChatUzenet = { role: 'user', content: chatInput }
    const ujUzenetek = [...chatUzenetek, ujUzenet]
    setChatUzenetek([...ujUzenetek, { role: 'assistant', content: '' }])
    setChatInput('')
    setChatAllapot('loading')
    try {
      const projektAdat = { nev: form.nev, kategoria: form.kategoria, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras }
      let vegsoValasz = ''
      const { score, keszen } = await chatStream(chatInput, chatUzenetek, projektAdat,
        (text) => { vegsoValasz = text; setChatUzenetek([...ujUzenetek, { role: 'assistant', content: text }]) }
      )
      setChatKeszen(keszen)
      setChatScore(score)
      if (draftId && vegsoValasz) {
        await supabase.from('projektek').update({ chat_elozmenyek: [...ujUzenetek, { role: 'assistant', content: vegsoValasz }] }).eq('id', draftId)
      }
    } catch {
      await fetch('/api/tokens/spend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, amount: -CHAT_COST }) })
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
    setErtekelesAllapot('loading')
    try {
      const badge = form.van_bevetel ? 'proven' : (form.van_kod || form.van_feliratkozok) ? 'prototype' : 'idea'
      const fajlSzovegek = feltoltottFajlok.filter(f => !f.tipus.startsWith('image/') && f.szoveg).map(f => f.szoveg as string)
      const res = await fetch('/api/ai/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nev: form.nev, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras, kategoria: form.kategoria, badge, fajlSzovegek, chat_score: chatScore }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiErtekeles(data)
        if (!form.kikialtasi_ar) setForm(prev => ({ ...prev, kikialtasi_ar: String(data.estimated_value) }))
      }
    } catch { /* ignore */ } finally {
      setErtekelesAllapot('idle')
    }
  }

  const totalCost = SUBMIT_COST + feltoltottFajlok.length * FILE_COST + (DURATION_COST[form.idotartam_nap] ?? 0)

  async function step3FajlFeltoltes(e: React.ChangeEvent<HTMLInputElement>) {
    const fajl = e.target.files?.[0]
    if (!fajl) return
    e.target.value = ''
    if (feltoltottFajlok.length >= 10) { setHiba('Maximum 10 files allowed.'); return }
    if (fajl.size > 10 * 1024 * 1024) { setHiba('File too large (max 10MB).'); return }
    setStep3FajlAllapot('loading')
    let ujFajl: Fajl
    try {
      const fd = new FormData()
      fd.append('fajl', fajl)
      if (userId) fd.append('user_id', userId)
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u?.email) fd.append('user_email', u.email)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const resData = await res.json()
      if (!res.ok) {
        if (resData.suspended) { setFelfuggesztve(resData.error); return }
        setHiba(`Upload failed: ${resData.error || res.status}`)
        return
      }
      ujFajl = resData
    } catch {
      setHiba('Upload failed: network error.')
      return
    } finally {
      setStep3FajlAllapot('idle')
    }
    const ujFajlok = [...feltoltottFajlok, ujFajl]
    setFeltoltottFajlok(ujFajlok)
    if (draftId) await supabase.from('projektek').update({ fajlok: ujFajlok }).eq('id', draftId)
    setHiba('')
  }

  async function beküldes(e: React.FormEvent) {
    e.preventDefault()
    setHiba('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    if ((tokenEgyenleg ?? 0) < totalCost) { setHiba(`Not enough tokens. You need ${totalCost} but have ${tokenEgyenleg}.`); return }
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
      setChatUzenetek(prev => [...prev, { role: 'assistant', content: `Your project was sent back for revision.\n\nReason: ${validateData.reason || 'The submission did not pass the content check.'}\n\nPlease address this before resubmitting.` }])
      setChatKeszen(false)
      setChatScore(null)
      if (draftId) localStorage.removeItem(`bv_score_${draftId}`)
      setAllapot('idle')
      setLepes(2)
      return
    }
    setAllapot('loading')
    const spendRes = await fetch('/api/tokens/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, amount: totalCost }),
    })
    const spendData = await spendRes.json()
    if (!spendRes.ok) {
      setHiba(spendData.error === 'insufficient_tokens' ? `Not enough tokens. You need ${totalCost} but have ${spendData.egyenleg}.` : 'Token deduction failed. Please try again.')
      setAllapot('hiba')
      return
    }
    const badge = form.van_bevetel ? 'proven' : (form.van_kod || form.van_feliratkozok) ? 'prototype' : 'idea'
    const projektAdat = {
      nev: form.nev, rovid_leiras: form.rovid_leiras, reszletes_leiras: form.reszletes_leiras,
      kategoria: form.kategoria, badge, kikialtasi_ar: parseInt(form.kikialtasi_ar),
      lejarat: new Date(Date.now() + parseInt(form.idotartam_nap) * 24 * 60 * 60 * 1000).toISOString(),
      van_domain: form.van_domain, van_kod: form.van_kod, van_feliratkozok: form.van_feliratkozok,
      // Minden beküldés a sorba kerül. Élesíteni kizárólag a cron élesít,
      // és az indulás előtt nem élesít semmit — így egy helyen dől el,
      // mikor kerülhet ötlet aukcióra.
      van_bevetel: form.van_bevetel, statusz: 'varakozas',
      varakozas_kezd: new Date().toISOString(), fajlok: feltoltottFajlok,
      sav: aiErtekeles ? (aiErtekeles.estimated_value >= 10000 ? 'premium' : aiErtekeles.estimated_value >= 1000 ? 'standard' : 'fast') : 'fast',
    }
    const anonRes = await fetch('/api/anon-name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, tipus: 'elado' }) })
    const { nev: anonEladoNev } = await anonRes.json()
    const { error } = draftId
      ? await supabase.from('projektek').update({ ...projektAdat, anon_elado_nev: anonEladoNev }).eq('id', draftId)
      : await supabase.from('projektek').insert([{ ...projektAdat, user_id: user.id, anon_elado_nev: anonEladoNev }])
    if (error) { setHiba('Something went wrong. Please try again.'); setAllapot('hiba') }
    else setAllapot('siker')
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)', color: 'var(--v-szoveg)', borderRadius: '8px',
  }
  const cardStyle: React.CSSProperties = {
    background: 'var(--v-bg-2)', border: '1px solid var(--v-vonal)', borderRadius: '8px',
  }

  // — Suspended —
  if (felfuggesztve) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-6"
          style={{ color: 'var(--v-rozsa)', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
          Fiók felfüggesztve
        </span>
        <h2 className="text-2xl font-black mb-2">A fiókod felfüggesztésre került</h2>
        <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--v-szoveg-2)' }}>Az admin felülvizsgálja a beküldésedet és e-mailben értesítünk az eredményről.</p>
        <div className="px-5 py-3 mb-8 text-sm max-w-md rounded-lg" style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', color: '#F87171' }}>
          <strong>Ok:</strong> {felfuggesztve}
        </div>
        <button onClick={() => router.push('/dashboard')} className="font-semibold text-sm px-6 py-3 rounded-lg transition"
          style={{ border: '1px solid var(--v-vonal)', color: 'var(--v-szoveg-2)', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v-vonal-2)'; e.currentTarget.style.color = 'var(--v-szoveg)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--v-vonal)'; e.currentTarget.style.color = 'var(--v-szoveg-2)' }}>
          ← Dashboard
        </button>
      </main>
    )
  }

  // — Success —
  if (allapot === 'siker') {
    return (
      <main className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)' }} />
        </div>
        <nav className="relative z-10 flex items-center px-8 py-5" style={{ borderBottom: '1px solid var(--v-vonal)' }}>
          <span className="text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>Bid<span style={{ color: 'var(--v-rozsa)' }}>Vip</span></span>
        </nav>
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-6"
              style={{ color: '#16A34A', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', padding: '6px 14px', borderRadius: '4px' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
              Sikeresen beküldve
            </span>
            <h2 className="text-3xl font-black mb-3" style={{ letterSpacing: '-0.03em' }}>Projekt beküldve!</h2>
            <p className="mb-6 leading-relaxed" style={{ color: 'var(--v-szoveg-2)' }}>
              Az admin csapatunk felülvizsgálja a projektedet, majd amikor jóváhagyják, élőbe kerül az Aukciós Házban.
            </p>
            <div className="flex items-start gap-3 px-4 py-3 mb-8 text-sm text-left rounded-lg"
              style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span className="shrink-0 mt-0.5" style={{ color: 'var(--v-arany)' }}>&#x1F512;</span>
              <span style={{ color: 'var(--v-szoveg-2)' }}>A projekt beküldés után <strong style={{ color: 'var(--v-szoveg)' }}>nem szerkeszthető</strong>. Ha változtatni szeretnél, vedd fel a kapcsolatot az adminnal.</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-lg font-semibold text-sm transition"
                style={{ background: 'var(--v-rozsa)', color: '#fff', boxShadow: '0 0 20px rgba(244,63,94,0.2)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
                Dashboard →
              </button>
              <button onClick={() => router.push('/aukciosHaz')} className="px-6 py-3 rounded-lg font-semibold text-sm transition"
                style={{ border: '1px solid var(--v-vonal)', color: 'var(--v-szoveg-2)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--v-vonal-2)'; e.currentTarget.style.color = 'var(--v-szoveg)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--v-vonal)'; e.currentTarget.style.color = 'var(--v-szoveg-2)' }}>
                Aukciós Ház
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--v-bg)', color: 'var(--v-szoveg)' }}>
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid var(--v-vonal)' }}>
        <a href="/" className="text-2xl font-black no-underline" style={{ letterSpacing: '-0.03em', color: 'var(--v-szoveg)' }}>
          Bid<span style={{ color: 'var(--v-rozsa)' }}>Vip</span>
        </a>
        <a href="/dashboard" className="text-sm no-underline transition" style={{ color: 'var(--v-szoveg-2)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}>
          ← Back
        </a>
      </nav>

      {/* Step indicator */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-4">
        <div className="relative h-0.5 rounded-full mb-6 mx-4" style={{ background: 'var(--v-vonal)' }}>
          <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: lepes === 1 ? '0%' : lepes === 2 ? '50%' : '100%',
              background: 'linear-gradient(90deg, var(--v-rozsa), #EF4444)',
              boxShadow: '0 0 8px rgba(244,63,94,0.4)',
            }} />
        </div>
        <div className="flex items-start justify-between">
          {([
            { n: 1, label: 'Leírás', sub: 'Projekt adatok' },
            { n: 2, label: 'AI Finomítás', sub: 'Mentori chat' },
            { n: 3, label: 'Beküldés', sub: 'Fájlok + live' },
          ] as const).map((s) => {
            const done = lepes > s.n
            const active = lepes === s.n
            return (
              <div key={s.n} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    border: `2px solid ${done || active ? 'var(--v-rozsa)' : 'var(--v-vonal)'}`,
                    background: done ? 'var(--v-rozsa)' : active ? 'rgba(244,63,94,0.12)' : 'var(--v-bg-2)',
                    color: done ? '#fff' : active ? 'var(--v-rozsa)' : 'var(--v-szoveg-3)',
                    boxShadow: active ? '0 0 12px rgba(244,63,94,0.3)' : 'none',
                  }}>
                  {done ? '✓' : s.n}
                </div>
                <span className="text-xs font-semibold" style={{ color: active ? 'var(--v-rozsa)' : done ? 'var(--v-szoveg-2)' : 'var(--v-szoveg-3)' }}>{s.label}</span>
                <span className="text-[10px] hidden sm:block" style={{ color: 'var(--v-szoveg-3)' }}>{s.sub}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* ── STEP 1 ── */}
        {lepes === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black mb-1" style={{ letterSpacing: '-0.03em' }}>Describe your project</h1>
              <p style={{ color: 'var(--v-szoveg-2)' }}>Get AI feedback — the AI also reviews your uploaded images.</p>
            </div>

            <div className="p-6 flex flex-col gap-4" style={cardStyle}>
              {[
                { mezo: 'nev', label: 'Project name *', placeholder: 'e.g. AI-powered customer support SaaS', type: 'input' },
                { mezo: 'rovid_leiras', label: 'Short description * (max 150 chars)', placeholder: 'What does it do in one sentence?', type: 'input', maxLength: 150 },
              ].map(f => (
                <div key={f.mezo}>
                  <label className="text-sm mb-1 block" style={{ color: 'var(--v-szoveg-2)' }}>{f.label}</label>
                  <input value={form[f.mezo as keyof typeof form] as string}
                    onChange={e => frissit(f.mezo, e.target.value)}
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    className="w-full px-4 py-3 focus:outline-none transition"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
                </div>
              ))}
              <div>
                <label className="text-sm mb-1 block" style={{ color: 'var(--v-szoveg-2)' }}>Detailed description *</label>
                <textarea rows={6} value={form.reszletes_leiras} onChange={e => frissit('reszletes_leiras', e.target.value)}
                  placeholder="What problem does it solve? Who is the target customer? What's the competitive advantage? What's included in the sale?"
                  className="w-full px-4 py-3 focus:outline-none resize-none transition"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
              </div>
              <div>
                <label className="text-sm mb-1 block" style={{ color: 'var(--v-szoveg-2)' }}>
                  Category * <span style={{ color: 'var(--v-szoveg-3)' }}>— ez alapján elemzi az AI az ötleted</span>
                </label>
                <KategoriaValaszto ertek={form.kategoria} onValt={t => frissit('kategoria', t)} />
              </div>
            </div>

            <div className="p-6 flex flex-col gap-3" style={cardStyle}>
              <h2 className="font-semibold">What&apos;s Included?</h2>
              {[
                { mezo: 'van_domain', label: 'Domain / URL' },
                { mezo: 'van_kod', label: 'Source code / repository' },
                { mezo: 'van_feliratkozok', label: 'Email list / subscribers' },
                { mezo: 'van_bevetel', label: 'Proven revenue' },
              ].map(item => (
                <label key={item.mezo} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form[item.mezo as keyof typeof form] as boolean}
                    onChange={e => frissit(item.mezo, e.target.checked)}
                    className="w-5 h-5" style={{ accentColor: 'var(--v-rozsa)' }} />
                  <span style={{ color: 'var(--v-szoveg)' }}>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="p-6 flex flex-col gap-4" style={cardStyle}>
              <h2 className="font-semibold">Files & Media <span className="font-normal text-sm" style={{ color: 'var(--v-szoveg-3)' }}>(optional)</span></h2>
              <label className="flex flex-col items-center justify-center py-6 cursor-pointer rounded-lg transition"
                style={{ border: '2px dashed var(--v-vonal)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')}>
                <span className="text-2xl mb-2">&#128206;</span>
                <span className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>Click to select files</span>
                <span className="text-xs mt-1" style={{ color: 'var(--v-szoveg-3)' }}>Images, PDF, Word, Excel — max 5 files, 10MB each</span>
                <input type="file" multiple accept="image/*,.pdf,.docx,.xlsx" onChange={fajlValasztas} className="hidden" />
              </label>
              {kivalasztottFajlok.length > 0 && (
                <div className="flex flex-col gap-2">
                  {kivalasztottFajlok.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--v-bg-3)', border: '1px solid var(--v-vonal)' }}>
                      <span className="truncate" style={{ color: 'var(--v-szoveg-2)' }}>
                        {f.type.startsWith('image/') ? '🖼️' : f.type === 'application/pdf' ? '📄' : '📊'} {f.name}
                      </span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {feltoltottFajlok[i] ? <span className="text-xs" style={{ color: '#16A34A' }}>✓</span> : <span className="text-xs" style={{ color: 'var(--v-szoveg-3)' }}>pending</span>}
                        <button type="button" onClick={() => fajlTorles(i)} className="transition" style={{ color: 'var(--v-szoveg-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-rozsa)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-3)')}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hiba && <p className="text-sm" style={{ color: '#F87171' }}>{hiba}</p>}

            {feedback && (
              <div className="rounded-lg p-6 flex flex-col gap-4" style={{
                border: `1px solid ${feedback.score === -1 ? 'rgba(244,63,94,0.3)' : feedback.ready ? 'rgba(22,163,74,0.3)' : 'rgba(251,191,36,0.3)'}`,
                background: feedback.score === -1 ? 'rgba(244,63,94,0.05)' : feedback.ready ? 'rgba(22,163,74,0.05)' : 'rgba(251,191,36,0.05)',
              }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">AI Feedback</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" style={{ color: feedback.score === -1 ? 'var(--v-rozsa)' : feedback.score >= 7 ? '#16A34A' : feedback.score >= 5 ? 'var(--v-arany)' : 'var(--v-rozsa)' }}>
                      {feedback.score === -1 ? '-1' : feedback.score}/10
                    </span>
                    {feedback.score === -1
                      ? <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--v-rozsa)', border: '1px solid rgba(244,63,94,0.2)' }}>Blocked</span>
                      : feedback.ready
                        ? <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>Ready</span>
                        : <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--v-arany)', border: '1px solid rgba(251,191,36,0.2)' }}>Needs improvement</span>}
                  </div>
                </div>
                {feedback.score === -1 ? (
                  <p className="text-sm" style={{ color: '#F87171' }}>Your content violates marketplace policies. Your account has been suspended pending admin review.</p>
                ) : (
                  <>
                    <p className="text-sm italic" style={{ color: 'var(--v-szoveg-2)' }}>&quot;{feedback.verdict}&quot;</p>
                    {feedback.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: '#16A34A' }}>Strengths</p>
                        {feedback.strengths.map((s, i) => <p key={i} className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>✓ {s}</p>)}
                      </div>
                    )}
                    {feedback.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--v-arany)' }}>Improve</p>
                        {feedback.improvements.map((s, i) => <p key={i} className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>→ {s}</p>)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <button type="button" onClick={aiFeedback}
              disabled={feedbackAllapot === 'loading' || feltoltesAllapot === 'loading' || !form.nev || !form.rovid_leiras || !form.reszletes_leiras || !form.kategoria}
              className="w-full py-3 rounded-lg font-semibold transition"
              style={{ border: '1px solid rgba(244,63,94,0.4)', color: 'var(--v-rozsa)', background: 'transparent',
                opacity: (feedbackAllapot === 'loading' || !form.nev || !form.rovid_leiras || !form.reszletes_leiras || !form.kategoria) ? 0.5 : 1 }}>
              {feltoltesAllapot === 'loading' ? 'Uploading...' : feedbackAllapot === 'loading' ? 'Analyzing...' : feedback ? 'Re-analyze' : 'Get AI Feedback (free)'}
            </button>

            {feedback && !feedback.ready && (
              <p className="text-sm text-center" style={{ color: 'var(--v-arany)' }}>Improve your listing based on the feedback, then re-analyze.</p>
            )}

            {feedback?.ready && (
              <button type="button" onClick={lepés1Tovabb}
                className="w-full py-3 rounded-lg font-semibold transition"
                style={{ background: 'var(--v-rozsa)', color: '#fff', boxShadow: '0 0 20px rgba(244,63,94,0.2)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
                ✓ Continue to AI Mentor →
              </button>
            )}
          </div>
        )}

        {/* ── STEP 2 ── */}
        {lepes === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <button type="button" onClick={() => setLepes(1)} className="text-sm mb-3 transition"
                style={{ color: 'var(--v-szoveg-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-3)')}>← Back</button>
              <h1 className="text-3xl font-black mb-1" style={{ letterSpacing: '-0.03em' }}>Refine with AI Mentor</h1>
              <p style={{ color: 'var(--v-szoveg-2)' }}>
                Chat with Sonnet 5 to make your idea market-ready.{' '}
                <span style={{ color: 'var(--v-rozsa)' }}>{CHAT_COST} tokens/message</span>
                {' · '}Balance:{' '}
                <span className="font-semibold" style={{ color: (tokenEgyenleg ?? 0) < CHAT_COST ? 'var(--v-rozsa)' : 'var(--v-szoveg)' }}>{tokenEgyenleg ?? '...'}</span>
              </p>
              {chatScore !== null && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 rounded-full h-2" style={{ background: 'var(--v-vonal)' }}>
                    <div className="h-2 rounded-full transition-all" style={{
                      width: `${chatScore * 10}%`,
                      background: chatScore >= 8.5 ? '#16A34A' : chatScore >= 7 ? 'var(--v-arany)' : 'var(--v-rozsa)',
                    }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color: chatScore >= 8.5 ? '#16A34A' : chatScore >= 7 ? 'var(--v-arany)' : 'var(--v-rozsa)' }}>{chatScore}/10</span>
                  <span className="text-xs" style={{ color: 'var(--v-szoveg-3)' }}>need 8.5</span>
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col gap-4 max-h-[500px] overflow-y-auto rounded-lg" style={cardStyle}>
              {chatUzenetek.map((u, i) => (
                <div key={i} className={`flex ${u.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] px-4 py-3 rounded-lg text-sm leading-relaxed"
                    style={{
                      background: u.role === 'user' ? 'var(--v-rozsa)' : 'var(--v-bg-3)',
                      color: u.role === 'user' ? '#fff' : 'var(--v-szoveg-2)',
                      border: u.role === 'user' ? 'none' : '1px solid var(--v-vonal)',
                    }}>
                    {u.content.split('\n').map((sor, j) => <p key={j} className={j > 0 ? 'mt-2' : ''}>{sor}</p>)}
                  </div>
                </div>
              ))}
              {chatAllapot === 'loading' && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-lg text-sm animate-pulse"
                    style={{ background: 'var(--v-bg-3)', color: 'var(--v-szoveg-3)', border: '1px solid var(--v-vonal)' }}>Thinking...</div>
                </div>
              )}
              <div ref={chatVegRef} />
            </div>

            {hiba && <p className="text-sm" style={{ color: '#F87171' }}>{hiba}</p>}

            {feltoltottFajlok.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {feltoltottFajlok.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                    style={{ background: 'var(--v-bg-3)', border: '1px solid var(--v-vonal)', color: 'var(--v-szoveg-2)' }}>
                    <span>{f.tipus.startsWith('image/') ? '🖼️' : f.tipus === 'application/pdf' ? '📄' : '📊'}</span>
                    <span className="max-w-[120px] truncate">{f.nev}</span>
                    <span style={{ color: '#16A34A' }}>✓</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatKuldes() } }}
                placeholder="Ask the AI mentor anything about your idea..."
                disabled={chatAllapot === 'loading' || chatFajlAllapot === 'loading'}
                className="flex-1 px-4 py-3 focus:outline-none transition"
                style={{ ...inputStyle, opacity: (chatAllapot === 'loading') ? 0.6 : 1 }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
              <button type="button" onClick={() => chatFajlInputRef.current?.click()}
                disabled={chatAllapot === 'loading' || chatFajlAllapot === 'loading' || feltoltottFajlok.length >= 5}
                className="shrink-0 px-3 py-3 rounded-lg font-bold text-base transition"
                style={{ background: 'var(--v-bg-3)', border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg)' }}>
                {chatFajlAllapot === 'loading' ? '...' : '+ File'}
              </button>
              <input ref={chatFajlInputRef} type="file" className="hidden" accept="image/*,.pdf,.docx,.xlsx" onChange={chatFajlFeltoltes} />
              <button onClick={chatKuldes}
                disabled={!chatInput.trim() || chatAllapot === 'loading' || chatFajlAllapot === 'loading' || (tokenEgyenleg ?? 0) < CHAT_COST}
                className="px-4 py-3 rounded-lg font-semibold text-sm shrink-0 transition"
                style={{ background: 'var(--v-rozsa)', color: '#fff', opacity: (!chatInput.trim() || chatAllapot === 'loading' || (tokenEgyenleg ?? 0) < CHAT_COST) ? 0.4 : 1 }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#EF4444' }}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
                Send
              </button>
            </div>

            {(tokenEgyenleg ?? 0) < CHAT_COST && (
              <p className="text-sm text-center" style={{ color: '#F87171' }}>
                Not enough tokens.{' '}
                <a href="/tokens?redirect=/submit" style={{ color: 'var(--v-rozsa)' }}>Buy tokens →</a>
              </p>
            )}

            <div className="pt-4" style={{ borderTop: '1px solid var(--v-vonal)' }}>
              {chatKeszen ? (
                <button type="button" onClick={lepés2Tovabb}
                  className="w-full py-3 rounded-lg font-semibold transition"
                  style={{ background: 'var(--v-rozsa)', color: '#fff', boxShadow: '0 0 20px rgba(244,63,94,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
                  ✓ Market-ready — Set price & submit →
                </button>
              ) : (
                <p className="text-center text-sm py-2" style={{ color: 'var(--v-szoveg-3)' }}>
                  The AI will unlock this button when your idea is market-ready.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {lepes === 3 && (
          <form onSubmit={beküldes} className="flex flex-col gap-6">
            <div>
              <button type="button" onClick={() => setLepes(2)} className="text-sm mb-3 transition"
                style={{ color: 'var(--v-szoveg-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--v-szoveg-2)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--v-szoveg-3)')}>← Back</button>
              <h1 className="text-3xl font-black mb-1" style={{ letterSpacing: '-0.03em' }}>Set price & submit</h1>
              <p style={{ color: 'var(--v-szoveg-2)' }}>Almost there — set your starting price and auction duration.</p>
            </div>

            <div className="p-4 flex items-center justify-between rounded-lg"
              style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <div>
                <p className="font-semibold" style={{ color: 'var(--v-szoveg)' }}>Submission cost</p>
                <p className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>{SUBMIT_COST} base + {feltoltottFajlok.length} × {FILE_COST} files + {DURATION_COST[form.idotartam_nap] ?? 0} duration</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: 'var(--v-arany)' }}>{totalCost} tokens</p>
                <p className="text-xs" style={{ color: (tokenEgyenleg ?? 0) < totalCost ? 'var(--v-rozsa)' : 'var(--v-szoveg-3)' }}>You have: {tokenEgyenleg ?? '...'}</p>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3" style={cardStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Final Documents</h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--v-szoveg-2)' }}>Upload deliverables buyers will receive. Each file costs {FILE_COST} tokens.</p>
                </div>
                <button type="button" onClick={() => step3FajlInputRef.current?.click()}
                  disabled={step3FajlAllapot === 'loading' || feltoltottFajlok.length >= 10}
                  className="shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition"
                  style={{ background: 'var(--v-bg-3)', border: '1px solid var(--v-vonal-2)', color: 'var(--v-szoveg)' }}>
                  {step3FajlAllapot === 'loading' ? 'Uploading...' : '+ Add File'}
                </button>
                <input ref={step3FajlInputRef} type="file" className="hidden" accept="image/*,.pdf,.docx,.xlsx,.zip,.pptx" onChange={step3FajlFeltoltes} />
              </div>
              {feltoltottFajlok.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs pb-1" style={{ color: 'var(--v-szoveg-3)', borderBottom: '1px solid var(--v-vonal)' }}>
                    <span>{feltoltottFajlok.length} file(s) attached</span>
                    <span style={{ color: 'var(--v-arany)' }}>Locked after submit</span>
                  </div>
                  {feltoltottFajlok.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--v-szoveg-2)' }}>
                      <span>{f.tipus.startsWith('image/') ? '🖼️' : f.tipus === 'application/pdf' ? '📄' : f.tipus.includes('zip') ? '🗜️' : '📄'}</span>
                      <span className="truncate flex-1">{f.nev}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--v-arany)' }}>+{FILE_COST} tokens</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-2" style={{ color: 'var(--v-szoveg-3)' }}>No files yet — add your pitch deck, business plan, or other documents.</p>
              )}
            </div>

            {ertekelesAllapot === 'loading' && (
              <div className="px-5 py-4 flex items-center gap-3 rounded-lg" style={cardStyle}>
                <div className="w-4 h-4 rounded-full animate-spin shrink-0"
                  style={{ border: '2px solid var(--v-rozsa)', borderTopColor: 'transparent' }} />
                <p className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>AI is estimating your project&apos;s value...</p>
              </div>
            )}
            {aiErtekeles && (
              <div className="px-5 py-4 rounded-lg" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--v-arany)' }}>AI Valuation</p>
                  <p className="font-bold text-xl" style={{ color: 'var(--v-arany)' }}>€{aiErtekeles.estimated_value.toLocaleString()}</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--v-szoveg-2)' }}>{aiErtekeles.reasoning}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--v-szoveg-3)' }}>
                  Starting price: €{aiErtekeles.estimated_value.toLocaleString()} – €{Math.round(aiErtekeles.estimated_value * 1.5).toLocaleString()} (max 1.5×)
                </p>
              </div>
            )}

            <div className="p-6 flex flex-col gap-3" style={cardStyle}>
              <h2 className="font-semibold">Starting Price</h2>
              <p className="text-sm" style={{ color: 'var(--v-szoveg-2)' }}>
                {aiErtekeles
                  ? `Set between €${aiErtekeles.estimated_value.toLocaleString()} and €${Math.round(aiErtekeles.estimated_value * 1.5).toLocaleString()} — buyers can bid higher.`
                  : 'The minimum bid the auction starts from (EUR).'}
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--v-szoveg-2)' }}>€</span>
                <input required type="number"
                  min={aiErtekeles ? aiErtekeles.estimated_value : 1}
                  max={aiErtekeles ? Math.round(aiErtekeles.estimated_value * 1.5) : undefined}
                  value={form.kikialtasi_ar}
                  onChange={e => {
                    const val = e.target.value
                    if (aiErtekeles) {
                      const num = parseInt(val)
                      const max = Math.round(aiErtekeles.estimated_value * 1.5)
                      if (num > max) { setHiba(`Maximum starting price is €${max.toLocaleString()} (1.5× AI estimate)`); return }
                      if (num < aiErtekeles.estimated_value) { setHiba(`Minimum starting price is €${aiErtekeles.estimated_value.toLocaleString()} (AI estimate)`); return }
                      setHiba('')
                    }
                    frissit('kikialtasi_ar', val)
                  }}
                  placeholder={aiErtekeles ? `e.g. ${aiErtekeles.estimated_value}` : 'e.g. 500'}
                  className="w-full pl-8 pr-4 py-3 focus:outline-none transition"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--v-rozsa)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--v-vonal)')} />
              </div>
            </div>

            <div className="p-6 flex flex-col gap-3" style={cardStyle}>
              <h2 className="font-semibold">Auction Duration</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { nap: '7', label: '7 days', sub: 'Fast sale', token: 0 },
                  { nap: '14', label: '14 days', sub: 'Recommended', token: 5 },
                  { nap: '30', label: '30 days', sub: 'More exposure', token: 15 },
                ].map(d => {
                  const sel = form.idotartam_nap === d.nap
                  return (
                    <button key={d.nap} type="button" onClick={() => frissit('idotartam_nap', d.nap)}
                      className="flex flex-col items-center p-4 rounded-lg transition"
                      style={{ border: `1px solid ${sel ? 'var(--v-rozsa)' : 'var(--v-vonal)'}`, background: sel ? 'rgba(244,63,94,0.08)' : 'var(--v-bg-2)' }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--v-vonal-2)' }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--v-vonal)' }}>
                      <span className="font-bold" style={{ color: 'var(--v-szoveg)' }}>{d.label}</span>
                      <span className="text-xs mt-1" style={{ color: 'var(--v-szoveg-2)' }}>{d.sub}</span>
                      <span className="text-xs mt-1" style={{ color: sel ? 'var(--v-rozsa)' : 'var(--v-arany)' }}>
                        {d.token === 0 ? 'included' : `+${d.token} tokens`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {hiba && <p className="text-sm text-center" style={{ color: '#F87171' }}>{hiba}</p>}

            {allapot === 'szures' && (
              <div className="px-5 py-4 text-center rounded-lg" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--v-arany)' }}>AI is reviewing your submission...</p>
                <p className="text-xs mt-1" style={{ color: 'var(--v-szoveg-2)' }}>Checking content quality. No tokens deducted yet.</p>
              </div>
            )}

            <button type="submit" disabled={allapot !== 'idle' && allapot !== 'hiba'}
              className="py-4 rounded-lg font-semibold text-lg transition"
              style={{ background: 'var(--v-rozsa)', color: '#fff', boxShadow: '0 0 24px rgba(244,63,94,0.2)', opacity: (allapot !== 'idle' && allapot !== 'hiba') ? 0.6 : 1 }}
              onMouseEnter={e => { if (allapot === 'idle') e.currentTarget.style.background = '#EF4444' }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--v-rozsa)')}>
              {allapot === 'szures' ? 'Reviewing...' : allapot === 'loading' ? 'Submitting...' : `Submit Project — ${totalCost} tokens →`}
            </button>

            {allapot === 'idle' && (
              <p className="text-xs text-center" style={{ color: 'var(--v-szoveg-3)' }}>
                An AI will review your project before it goes live. If rejected, you are sent back to the mentor — no tokens lost.
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  )
}

export default function Submit() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--v-bg)' }}>
        <div style={{ color: 'var(--v-szoveg-2)' }}>Loading...</div>
      </main>
    }>
      <SubmitInner />
    </Suspense>
  )
}
