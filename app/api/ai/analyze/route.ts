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

  const { nev, rovid_leiras, kategoria, badge, kikialtasi_ar } = await req.json()

  const szoveg = `You are an experienced startup analyst reviewing a project listed on BidVip, a marketplace where startup ideas and projects are auctioned to buyers.

You only have access to the PUBLIC listing information — the full description and documents are locked and only available to the winning buyer. Base your analysis strictly on what is shown below.

Project details:
- Name: ${nev}
- Category: ${kategoria}
- Stage: ${BADGE_LABELS[badge] || badge}
- Starting bid: €${kikialtasi_ar}
- Short description: ${rovid_leiras}

Provide a thorough, honest analysis with these sections (use markdown headers):

## Market Opportunity
## Strengths
## Weaknesses / Risks
## Suggestions for Improvement
## Valuation Assessment

Be direct and constructive. Do NOT invent or assume details beyond what is given. If the short description lacks detail, note that in your analysis.`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: szoveg,
    }],
  })

  const text = message.content
    .filter(b => b.type === 'text')
    .map(b => (b.type === 'text' ? b.text : ''))
    .join('')

  return NextResponse.json({ analysis: text })
}
