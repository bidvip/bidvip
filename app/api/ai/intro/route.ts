import { NextRequest, NextResponse } from 'next/server'
import { megkovetelBejelentkezes } from '@/lib/auth'
import { aiKorlat } from '@/lib/sebessegkorlat'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const BADGE_LABELS: Record<string, string> = {
  papir: 'Concept',
  prototipus: 'Prototype',
  bizonyitott: 'Proven',
}

export async function POST(req: NextRequest) {
  const v = await megkovetelBejelentkezes(req)
  if (v instanceof NextResponse) return v
  const korlat = aiKorlat(v.user.id)
  if (korlat) return korlat

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const { nev, rovid_leiras, kategoria, badge, kikialtasi_ar } = await req.json()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are a compelling startup pitch writer. Write a SHORT, exciting 3-sentence introduction for this project. No headers, no titles, no bullet points, no markdown — just 3 clean sentences of flowing prose.

Project: ${nev}
Category: ${kategoria}
Stage: ${BADGE_LABELS[badge] || badge}
Starting bid: €${kikialtasi_ar}
Description: ${rovid_leiras}

Rules:
- Do NOT start with the project name or a title
- Do NOT use any markdown formatting (no #, no **, no -)
- Sentence 1: what the product does and who it's for
- Sentence 2: the market opportunity and timing, grounded in the real dynamics of the ${kategoria} field
- Sentence 3: why a buyer should be excited to acquire this now
- Use the vocabulary a professional in ${kategoria} would use — no generic startup buzzwords`,
    }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('')

  return NextResponse.json({ intro: text })
}
