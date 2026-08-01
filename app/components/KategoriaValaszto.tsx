'use client'

import { useState, useRef, useEffect } from 'react'
import { KATEGORIA_FA, keressTemat } from '@/lib/kategoriak'

export default function KategoriaValaszto({ ertek, onValt }: { ertek: string; onValt: (t: string) => void }) {
  const [nyitva, setNyitva] = useState(false)
  const [kereses, setKereses] = useState('')
  const [nyitottCsoport, setNyitottCsoport] = useState<string | null>(null)
  const dobozRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function kattintasKivul(e: MouseEvent) {
      if (dobozRef.current && !dobozRef.current.contains(e.target as Node)) setNyitva(false)
    }
    document.addEventListener('mousedown', kattintasKivul)
    return () => document.removeEventListener('mousedown', kattintasKivul)
  }, [])

  const talalatok = kereses ? keressTemat(kereses) : []
  const kivalasztottSzin = KATEGORIA_FA.find(c => c.temak.includes(ertek))?.szin ?? '#DC2626'

  function valaszt(tema: string) {
    onValt(tema)
    setNyitva(false)
    setKereses('')
    setNyitottCsoport(null)
  }

  return (
    <div ref={dobozRef} className="relative">
      <button type="button" onClick={() => setNyitva(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left transition rounded-lg"
        style={{
          background: '#100C0F',
          border: `1px solid ${nyitva ? kivalasztottSzin : '#2E2028'}`,
          color: ertek ? '#F5F0E8' : '#5A4F4A',
        }}>
        <span className="flex items-center gap-2.5 min-w-0">
          {ertek && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: kivalasztottSzin }} />}
          <span className="truncate">{ertek || 'Válassz témát...'}</span>
        </span>
        <span className="flex-shrink-0 ml-2 transition-transform"
          style={{ color: '#5A4F4A', transform: nyitva ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {nyitva && (
        <div className="absolute z-50 mt-2 w-full rounded-xl overflow-hidden"
          style={{ background: '#160F14', border: '1px solid #2E2028', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>

          <div className="p-3" style={{ borderBottom: '1px solid #2E2028' }}>
            <input autoFocus value={kereses} onChange={e => setKereses(e.target.value)}
              placeholder="Keress témát... (pl. napenergia, AI, oktatás)"
              className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none"
              style={{ background: '#100C0F', border: '1px solid #2E2028', color: '#F5F0E8' }} />
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
            {kereses ? (
              talalatok.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm" style={{ color: '#5A4F4A' }}>Nincs találat</p>
              ) : (
                <div className="p-2 flex flex-col gap-1">
                  {talalatok.slice(0, 40).map(t => (
                    <button key={t.nev} type="button" onClick={() => valaszt(t.nev)}
                      className="w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-2.5 transition"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${t.szin}14`)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.szin }} />
                      <span className="text-sm truncate" style={{ color: '#F5F0E8' }}>{t.nev}</span>
                      <span className="ml-auto text-[10px] flex-shrink-0" style={{ color: '#5A4F4A' }}>{t.csoport}</span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="p-2 flex flex-col gap-1">
                {KATEGORIA_FA.map(cs => {
                  const nyitottE = nyitottCsoport === cs.nev
                  return (
                    <div key={cs.nev}>
                      <button type="button" onClick={() => setNyitottCsoport(nyitottE ? null : cs.nev)}
                        className="w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-2.5 transition"
                        style={{ background: nyitottE ? `${cs.szin}14` : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${cs.szin}14`)}
                        onMouseLeave={e => (e.currentTarget.style.background = nyitottE ? `${cs.szin}14` : 'transparent')}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cs.szin }} />
                        <span className="text-sm font-semibold" style={{ color: nyitottE ? cs.szin : '#F5F0E8' }}>{cs.nev}</span>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                          style={{ color: '#5A4F4A', border: '1px solid #2E2028' }}>{cs.temak.length}</span>
                      </button>

                      {nyitottE && (
                        <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
                          {cs.temak.map(t => (
                            <button key={t} type="button" onClick={() => valaszt(t)}
                              className="text-xs px-2.5 py-1.5 rounded-md transition"
                              style={{ border: `1px solid ${cs.szin}33`, color: cs.szin, background: `${cs.szin}0d` }}
                              onMouseEnter={e => (e.currentTarget.style.background = `${cs.szin}26`)}
                              onMouseLeave={e => (e.currentTarget.style.background = `${cs.szin}0d`)}>
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
