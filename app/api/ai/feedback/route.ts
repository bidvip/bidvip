import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria } = await req.json()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a startup mentor reviewing a project idea submitted to BidVip, a marketplace where ideas are auctioned. Give honest, actionable feedback to help the seller improve their listing before it goes live.

Project:
- Name: ${nev}
- Category: ${kategoria}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}

Respond in this exact JSON format (no markdown, just JSON):
{
  "score": <1-10 overall quality score>,
  "verdict": "<one sentence summary>",
  "strengths": ["<point>", "<point>"],
  "improvements": ["<specific actionable fix>", "<specific actionable fix>"],
  "ready": <true if score >= 7 and listing is strong enough, false otherwise>
}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  try {
    const match = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(match ? match[0] : text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ score: 5, verdict: 'Could not analyze.', strengths: [], improvements: ['Add more detail to your description.'], ready: false })
  }
}
