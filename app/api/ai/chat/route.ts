import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { uzenet, elozmenyek, projekt } = await req.json()

  const rendszerPrompt = `You are an expert startup mentor on BidVip, a marketplace where startup ideas are auctioned to buyers. Your goal is to help the seller refine their idea until it is truly market-ready.

The seller's project:
- Name: ${projekt.nev}
- Category: ${projekt.kategoria}
- Short description: ${projekt.rovid_leiras}
- Detailed description: ${projekt.reszletes_leiras}

Always be brutally honest. Do not sugarcoat. If the idea is weak, say so clearly and explain why. Ask sharp clarifying questions. Push back on vague answers. Help them strengthen the value proposition, target market, competitive advantage, and pricing.

IMPORTANT: At the end of every response, you MUST add a JSON block on its own line:
{"score": <number 1-10 with one decimal>, "keszen": <true if score >= 8.5, false otherwise>}

Score criteria:
- 1-4: Idea is too vague, unrealistic, or not a real business
- 5-6: Some potential but major gaps remain
- 7-8: Solid idea but needs refinement
- 8.5-10: Market-ready — clear value prop, defined target market, competitive advantage, realistic pricing

Be strict. Most ideas start at 4-6 and need several rounds to reach 8.5.`

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system: rendszerPrompt,
    messages: [
      ...elozmenyek,
      { role: 'user', content: uzenet },
    ],
  })

  const teljesValasz = message.content[0].type === 'text' ? message.content[0].text : ''

  const jsonMatch = teljesValasz.match(/\{"score":\s*([\d.]+),\s*"keszen":\s*(true|false)\}/)
  const score = jsonMatch ? parseFloat(jsonMatch[1]) : null
  const keszen = jsonMatch ? jsonMatch[2] === 'true' : false
  const valasz = teljesValasz.replace(/\{"score":\s*[\d.]+,\s*"keszen":\s*(true|false)\}/g, '').trim()

  return NextResponse.json({ valasz, score, keszen })
}
