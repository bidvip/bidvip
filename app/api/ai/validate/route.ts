import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, fajlSzovegek = [], kepUrlok = [] } = await req.json()

  const dokumentumSzoveg = fajlSzovegek.length > 0
    ? `\nDocument contents:\n${fajlSzovegek.map((s: string, i: number) => `[Doc ${i + 1}]:\n${s.slice(0, 2000)}`).join('\n\n')}`
    : ''

  const kepMegjegyzes = kepUrlok.length > 0
    ? `\n${kepUrlok.length} image(s) attached — check them for dangerous, illegal, or offensive visual content.`
    : ''

  const prompt = `You are a content moderator for BidVip, a startup idea auction marketplace. Your job is to verify that a submitted project listing contains REAL, LEGITIMATE content — not spam, gibberish, test data, jokes, illegal content, or placeholder text.

Project submission:
- Name: ${nev}
- Category: ${kategoria}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}${dokumentumSzoveg}${kepMegjegyzes}

Rules — reject if:
1. Content is clearly fake, nonsensical, or test data (e.g. "asdf", "test 123", "hello world")
2. The idea is illegal, harmful, or violates basic marketplace rules (weapons, drugs, hacking tools, fraud, violence, hate)
3. The description is so vague it's meaningless (e.g. "I have a great idea")
4. There is no real business concept at all
5. Any attached image contains dangerous, illegal, or explicitly offensive content

Accept if:
- There is a recognizable startup/business idea, even if imperfect or early-stage
- The seller is making a genuine attempt to describe something real
- The content makes basic sense as a business listing

Respond ONLY with this exact JSON (no markdown, no explanation):
{"ok": true, "reason": ""}
or
{"ok": false, "reason": "<short reason why rejected, max 100 chars>"}`

  type MessageContent = { type: 'text'; text: string } | { type: 'image'; source: { type: 'url'; url: string } }
  const content: MessageContent[] = kepUrlok.slice(0, 5).map((url: string) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))
  content.push({ type: 'text', text: prompt })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [{ role: 'user', content }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  try {
    const match = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(match ? match[0] : text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ ok: true, reason: '' })
  }
}
