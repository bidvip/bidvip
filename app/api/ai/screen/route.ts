import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, kepUrlok = [] } = await req.json()

  const szoveg = `You are a content moderator for BidVip, a startup idea marketplace. Evaluate if this submission is a genuine business idea worth listing.

Name: ${nev}
Short description: ${rovid_leiras}
Detailed description: ${reszletes_leiras}
Category: ${kategoria}
${kepUrlok.length > 0 ? `\nThe seller uploaded ${kepUrlok.length} image(s) — evaluate if they look genuine and relevant.` : ''}

Respond with JSON only. No markdown, no explanation — just the JSON object.
If valid: {"ok": true}
If invalid (spam, gibberish, test data, too vague, or not a real business idea): {"ok": false, "reason": "brief explanation"}`

  const kepTartalom = kepUrlok.slice(0, 3).map((url: string) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        ...kepTartalom,
        { type: 'text' as const, text: szoveg },
      ],
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
