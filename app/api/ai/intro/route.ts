import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const BADGE_LABELS: Record<string, string> = {
  papir: 'Concept',
  prototipus: 'Prototype',
  bizonyitott: 'Proven',
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const { nev, rovid_leiras, kategoria, badge, kikialtasi_ar } = await req.json()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are a compelling startup pitch writer. Write a SHORT, exciting 3-sentence introduction for this project that makes a potential buyer immediately understand what it is and why it's interesting. Write it like the opening of a great pitch deck — clear, vivid, enthusiastic but professional. No headers, no bullet points, just flowing prose.

Project: ${nev}
Category: ${kategoria}
Stage: ${BADGE_LABELS[badge] || badge}
Starting bid: €${kikialtasi_ar}
Description: ${rovid_leiras}

Write exactly 3 sentences. First sentence: what the project IS. Second sentence: the opportunity/market. Third sentence: why a buyer should be excited.`,
    }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('')

  return NextResponse.json({ intro: text })
}
