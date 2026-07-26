import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const BADGE_LABELS: Record<string, string> = {
  papir: 'Concept (idea only)',
  prototipus: 'Prototype (tangible exists)',
  bizonyitott: 'Proven (real revenue/users)',
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, badge, kikialtasi_ar } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    messages: [{
      role: 'user',
      content: `You are an experienced startup analyst reviewing a project listed on BidVip, a marketplace where startup ideas and projects are auctioned to buyers.

Project details:
- Name: ${nev}
- Category: ${kategoria}
- Stage: ${BADGE_LABELS[badge] || badge}
- Starting bid: €${kikialtasi_ar}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}

Provide a thorough, honest analysis with these sections (use markdown headers):

## Market Opportunity
## Strengths
## Weaknesses / Risks
## Suggestions for Improvement
## Valuation Assessment

Be direct, specific, and constructive. Consider the stage and starting price in your valuation assessment.`,
    }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('')

  return NextResponse.json({ analysis: text })
}
