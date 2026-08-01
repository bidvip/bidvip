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

  const { nev, rovid_leiras, kategoria, badge, kikialtasi_ar } = await req.json()

  const szoveg = `You are a senior investment analyst writing a buyer-focused acquisition report for a project listed on BidVip, a startup auction platform. Your reader is a potential buyer evaluating this as an investment opportunity.

Your tone is that of a professional VC or M&A advisor — analytical, forward-looking, and opportunity-focused. You are NOT a critic. You identify potential, growth scenarios, and strategic value.

Project details:
- Name: ${nev}
- Category: ${kategoria}
- Stage: ${BADGE_LABELS[badge] || badge}
- Starting bid: €${kikialtasi_ar}
- Short description: ${rovid_leiras}
${szakertoiKontextus(kategoria)}

Note: Only public listing info is available — full documentation is unlocked for the winning buyer.

Write a professional investment analysis with these sections (use markdown headers):

## Market Opportunity
Analyze the market size, trends, and tailwinds. Where could this market be in 5–10 years? What macro forces support this?

## Strategic Value for a Buyer
What can an acquirer do with this? Who are the ideal buyer profiles (solo founder, agency, corporate, investor)? What synergies or use cases exist?

## Growth Scenarios (5–10 Year Outlook)
Paint 2–3 realistic scenarios for where this project could go with the right owner and execution. Be specific about revenue models, scale, and exit potential.

## Key Questions to Investigate
What should a serious buyer verify in the full documentation? (Keep this brief and practical — not a red-flag list, but a due diligence checklist.)

## Acquisition Value Assessment
Is the starting bid attractive, fair, or premium for this stage? What's the upside if assumptions play out?

Be concise, professional, and optimistic-but-grounded. Do not list generic warnings. Focus on opportunity.`

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
