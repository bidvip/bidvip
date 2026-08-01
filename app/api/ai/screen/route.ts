import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { szakertoiKontextus } from '@/lib/kategoriak'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, kepUrlok = [] } = await req.json()

  const szoveg = `You are a content moderator for BidVip, a startup idea marketplace. Evaluate if this submission is a genuine business idea worth listing, and classify its maturity level.

Name: ${nev}
Short description: ${rovid_leiras}
Detailed description: ${reszletes_leiras}
Category: ${kategoria}
${kepUrlok.length > 0 ? `\nThe seller uploaded ${kepUrlok.length} image(s) — use them to better judge maturity.` : ''}

Respond with JSON only. No markdown, no explanation — just the JSON object.
If valid: {"ok": true, "badge": "<level>"}
If invalid (spam, gibberish, test data, too vague, or not a real business idea): {"ok": false, "reason": "brief explanation"}

Badge levels (pick one):
- "idea" — idea only, no code, no users, no revenue
- "prototype" — something tangible exists: code, mockup, domain, or early users, but no real revenue
- "proven" — real revenue or proven measurable traction

Calibrate these levels to the field — "prototype" means something different in software than in
biotech, hardware or energy. In lab- or hardware-based fields a validated experiment, a working
bench unit, a patent filing or a pilot installation counts as prototype-level maturity.
${szakertoiKontextus(kategoria)}`

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
