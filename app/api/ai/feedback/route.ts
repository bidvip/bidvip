import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { nev, rovid_leiras, reszletes_leiras, kategoria, kepUrlok = [], fajlSzovegek = [] } = await req.json()

  const dokumentumSzoveg = fajlSzovegek.length > 0
    ? `\nExtracted content from uploaded documents:\n${fajlSzovegek.map((s: string, i: number) => `[Document ${i + 1}]:\n${s}`).join('\n\n')}`
    : ''

  const szoveg = `You are a content moderator and startup mentor for BidVip, an idea auction marketplace.

SCORING RULES — read carefully:

Score -1 (BLOCKED) — use this if the content contains ANY of:
- Weapons manufacturing, bomb making, explosives, firearms trafficking
- Illegal drugs production or distribution
- Hacking tools, malware, cyberattacks for harm
- Fraud, scams, phishing, counterfeit goods
- Human trafficking, exploitation, child abuse
- Violence, terrorism, self-harm promotion
- Hate speech or discrimination
A score of -1 means automatic account suspension. Use it ONLY for genuinely dangerous or illegal content.

Score 1-3 — weak or meaningless idea:
- Pure gibberish, random words, or test data ("asdf", "test 123")
- No real business concept at all
- Extremely vague with zero substance
These are bad ideas but NOT illegal — give normal improvement feedback.

Score 4-6 — has potential but incomplete
Score 7-10 — strong idea, ready to proceed

Project:
- Name: ${nev}
- Category: ${kategoria}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}
${kepUrlok.length > 0 ? `\nThe seller uploaded ${kepUrlok.length} image(s).` : ''}${dokumentumSzoveg}

Respond ONLY with this exact JSON (no markdown):
{
  "score": <-1 if blocked, 1-10 otherwise>,
  "block_reason": "<short reason if score is -1, else empty string>",
  "verdict": "<one sentence summary, empty if score is -1>",
  "strengths": ["<point>"],
  "improvements": ["<point>"],
  "ready": <true if score >= 7, false otherwise>
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

    // Normalize: ha a Haiku mégis blocked mezőt adott vissza (régi formátum)
    if (result.blocked === true && result.score !== -1) {
      result.score = -1
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ score: 5, verdict: 'Could not analyze.', strengths: [], improvements: ['Add more detail to your description.'], ready: false })
  }
}
