import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { szakertoiKontextus } from '@/lib/kategoriak'

export const dynamic = 'force-dynamic'

const BADGE_RANGES: Record<string, { min: number; max: number }> = {
  idea:      { min: 100,   max: 15000  },
  prototype: { min: 1000,  max: 75000  },
  proven:    { min: 5000,  max: 500000 },
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, badge, fajlSzovegek = [], chat_score } = await req.json()

  const range = BADGE_RANGES[badge] || BADGE_RANGES['idea']

  const dokumentumok = fajlSzovegek.length > 0
    ? `\nAttached documents:\n${fajlSzovegek.map((s: string, i: number) => `[Doc ${i + 1}]: ${s.slice(0, 1500)}`).join('\n\n')}`
    : ''

  const scoreInfo = chat_score !== null && chat_score !== undefined
    ? `\nAI mentor readiness score: ${chat_score}/10`
    : ''

  const prompt = `You are a startup valuation expert on BidVip, a marketplace for buying and selling startup ideas and projects.

Estimate the fair market value (in EUR) for this project at its current stage. Be realistic and conservative — this is an early-stage marketplace, not a VC round.

Project:
- Name: ${nev}
- Category: ${kategoria}
- Stage: ${badge} (typical range for this stage: €${range.min.toLocaleString()} – €${range.max.toLocaleString()})
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}${dokumentumok}${scoreInfo}
${szakertoiKontextus(kategoria)}

Consider:
- How developed and detailed is the idea?
- Is there real IP, documentation, or assets?
- Market size and competition within this specific field
- Typical deal sizes and buyer budgets in this field
- Stage maturity
- Quality of the attached materials

Return ONLY this JSON (no markdown, no explanation):
{"estimated_value": <number in EUR, integer>, "reasoning": "<1-2 sentence explanation, max 120 chars>"}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  try {
    const match = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(match ? match[0] : text)
    const clamped = Math.max(range.min, Math.min(range.max, Math.round(result.estimated_value)))
    return NextResponse.json({ estimated_value: clamped, reasoning: result.reasoning || '' })
  } catch {
    return NextResponse.json({ estimated_value: range.min, reasoning: 'Could not estimate value.' })
  }
}
