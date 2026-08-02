import { ImageResponse } from 'next/og'

export const alt = 'BidVip — Ötletek aukciós háza'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Megosztási kép. Enélkül a link üres, kép nélküli dobozként jelenik meg
 * a közösségi felületeken — induló piactérnél, ahol a szájreklám a fő
 * csatorna, ez közvetlen veszteség.
 */
export default function OgKep() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '0 90px',
          background: '#07050D',
          backgroundImage:
            'radial-gradient(circle at 25% 0%, rgba(124,58,237,.55) 0%, transparent 55%),' +
            'radial-gradient(circle at 80% 15%, rgba(244,63,94,.38) 0%, transparent 55%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 44 }}>
          <div style={{ width: 16, height: 16, borderRadius: 99, background: '#F43F5E' }} />
          <div style={{ fontSize: 30, fontWeight: 700, color: '#F3F0FA', letterSpacing: -0.5 }}>BidVip</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 76, fontWeight: 800, color: '#F3F0FA', lineHeight: 1.06, letterSpacing: -2.5 }}>
          <div>Minden ötletben</div>
          <div>van potenciál.</div>
          <div style={{ color: '#FB7185' }}>Megmutatjuk mekkora.</div>
        </div>

        <div style={{ display: 'flex', gap: 34, marginTop: 52, fontSize: 25, color: '#A79FC4' }}>
          <div>25 szakterület</div>
          <div style={{ color: '#362A57' }}>·</div>
          <div>AI-értékbecslés</div>
          <div style={{ color: '#362A57' }}>·</div>
          <div>Élő aukció</div>
        </div>
      </div>
    ),
    size
  )
}
