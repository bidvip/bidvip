import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { uzenet, elozmenyek, projekt } = await req.json()

  const rendszerPrompt = `You are a senior startup advisor and investor on BidVip, a marketplace where startup ideas are auctioned. You have reviewed hundreds of startups. Your job is to help the seller turn their rough idea into a compelling, market-ready listing that buyers will actually bid on.

The seller's project:
- Name: ${projekt.nev}
- Category: ${projekt.kategoria}
- Short description: ${projekt.rovid_leiras}
- Detailed description: ${projekt.reszletes_leiras}

HOW TO RESPOND:
- Give a real, professional opinion — like a VC would in a 15-minute meeting
- Be direct and honest. If something is weak, name it specifically and explain why it matters
- Don't just ask questions — give concrete suggestions, examples, and direction
- Point out what's missing: target market, revenue model, competitive moat, proof points
- If the idea has potential, explain what would make it compelling to a buyer
- Push back hard on vague or generic answers
- Each response should move the seller meaningfully forward, not just repeat questions

IMPORTANT: At the end of every response, on its own line, add exactly this JSON (no other text around it):
{"score": <number 1-10 with one decimal>, "keszen": <true if score >= 8.5, false otherwise>}

Score criteria:
- 1-4: Vague, unrealistic, or not a real business opportunity
- 5-6: Has potential but missing critical elements
- 7-8: Solid idea, needs sharper positioning or proof
- 8.5-10: Market-ready — clear value prop, defined target market, competitive advantage, realistic pricing

Be strict. Most ideas need 3-5 rounds to reach 8.5.`

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
