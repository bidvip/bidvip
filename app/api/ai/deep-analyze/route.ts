import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { szakertoiKontextus } from '@/lib/kategoriak'

export const dynamic = 'force-dynamic'

const BADGE_LABELS: Record<string, string> = {
  papir: 'Concept (idea only)',
  prototipus: 'Prototype (tangible exists)',
  bizonyitott: 'Proven (real revenue/users)',
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, badge, kikialtasi_ar, kepUrlok = [] } = await req.json()

  const szoveg = `You are a senior startup analyst writing a comprehensive market analysis for a project listed on BidVip, a startup idea marketplace. This analysis will be shown to potential buyers to help them make an informed bidding decision.

Project:
- Name: ${nev}
- Category: ${kategoria}
- Stage: ${BADGE_LABELS[badge] || badge}
- Starting bid: €${kikialtasi_ar}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}
${kepUrlok.length > 0 ? `\nThe seller uploaded ${kepUrlok.length} image(s) — factor them into your analysis.` : ''}
${szakertoiKontextus(kategoria)}

Write a thorough, honest, professional analysis with these sections (use ## markdown headers):

## Market Opportunity
## Strengths
## Weaknesses / Risks
## Suggestions for the Buyer
## Valuation Assessment

Be specific, direct, and data-driven where possible. Consider the stage and starting price in your valuation. This is a Sonnet-level deep analysis — go beyond surface observations.`

  const kepTartalom = kepUrlok.slice(0, 4).map((url: string) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2048,
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
