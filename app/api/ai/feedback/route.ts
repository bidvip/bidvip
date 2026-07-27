import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, kepUrlok = [], fajlSzovegek = [] } = await req.json()

  const dokumentumSzoveg = fajlSzovegek.length > 0
    ? `\nExtracted content from uploaded documents:\n${fajlSzovegek.map((s: string, i: number) => `[Document ${i + 1}]:\n${s}`).join('\n\n')}`
    : ''

  const szoveg = `You are a startup mentor reviewing a project idea submitted to BidVip, a marketplace where ideas are auctioned. Give honest, actionable feedback to help the seller improve their listing before it goes live.

Project:
- Name: ${nev}
- Category: ${kategoria}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}
${kepUrlok.length > 0 ? `\nThe seller uploaded ${kepUrlok.length} image(s) — factor them into your evaluation.` : '\nNo images uploaded yet — mention this as an improvement if relevant.'}${dokumentumSzoveg}

Respond in this exact JSON format (no markdown, just JSON):
{
  "score": <1-10 overall quality score>,
  "verdict": "<one sentence summary>",
  "strengths": ["<point>", "<point>"],
  "improvements": ["<specific actionable fix>", "<specific actionable fix>"],
  "ready": <true if score >= 7 and listing is strong enough, false otherwise>
}`

  const kepTartalom = kepUrlok.slice(0, 3).map((url: string) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 800,
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
    return NextResponse.json({ score: 5, verdict: 'Could not analyze.', strengths: [], improvements: ['Add more detail to your description.'], ready: false })
  }
}
