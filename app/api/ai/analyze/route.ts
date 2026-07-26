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

  const { nev, rovid_leiras, reszletes_leiras, kategoria, badge, kikialtasi_ar, kepUrlok = [] } = await req.json()

  const szoveg = `You are an experienced startup analyst reviewing a project listed on BidVip, a marketplace where startup ideas and projects are auctioned to buyers.

Project details:
- Name: ${nev}
- Category: ${kategoria}
- Stage: ${BADGE_LABELS[badge] || badge}
- Starting bid: €${kikialtasi_ar}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}
${kepUrlok.length > 0 ? `\nThe seller has uploaded ${kepUrlok.length} image(s) — take them into account in your analysis.` : ''}

Provide a thorough, honest analysis with these sections (use markdown headers):

## Market Opportunity
## Strengths
## Weaknesses / Risks
## Suggestions for Improvement
## Valuation Assessment

Be direct, specific, and constructive. Consider the stage and starting price in your valuation assessment.`

  const kepTartalom = kepUrlok.slice(0, 4).map((url: string) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        ...kepTartalom,
        { type: 'text' as const, text: szoveg },
      ],
    }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('')

  return NextResponse.json({ analysis: text })
}
