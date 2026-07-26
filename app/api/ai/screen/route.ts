import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria } = await req.json()

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a content moderator for BidVip, a startup idea marketplace. Evaluate if this submission is a genuine business idea worth listing.

Name: ${nev}
Short description: ${rovid_leiras}
Detailed description: ${reszletes_leiras}
Category: ${kategoria}

Respond with JSON only. No markdown, no explanation — just the JSON object.
If valid: {"ok": true}
If invalid (spam, gibberish, test data, too vague, or not a real business idea): {"ok": false, "reason": "brief explanation"}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  try {
    const match = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(match ? match[0] : text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ ok: true })
  }
}
