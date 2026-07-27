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

STEP 1 — SAFETY CHECK (do this first, before anything else):
Does the submission describe ANY of the following?
- Weapons manufacturing, bomb making, explosives, firearms trafficking
- Illegal drugs production or distribution
- Hacking tools, malware, cyberattacks
- Fraud, scams, phishing, counterfeit goods
- Human trafficking, exploitation, child abuse
- Violence, terrorism, self-harm promotion
- Hate speech or discrimination
- Pure gibberish or test data with no real content (e.g. "asdf", "bomb")

If YES to any of the above: you MUST respond with blocked=true. Do NOT give normal feedback. Do NOT give a score. Just block it.

STEP 2 — Only if NOT blocked: evaluate the business idea as a startup mentor.

Project:
- Name: ${nev}
- Category: ${kategoria}
- Short description: ${rovid_leiras}
- Detailed description: ${reszletes_leiras}
${kepUrlok.length > 0 ? `\nThe seller uploaded ${kepUrlok.length} image(s).` : ''}${dokumentumSzoveg}

Respond ONLY with this exact JSON (no markdown):
{
  "blocked": <true or false>,
  "block_reason": "<why blocked, or empty string>",
  "score": <1-10, or 0 if blocked>,
  "verdict": "<one sentence, or empty if blocked>",
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

  const VESZELYES_SZAVAK = ['illegal', 'dangerous', 'weapons', 'bomb', 'explosive', 'drug', 'harm', 'violence', 'trafficking', 'malware', 'fraud', 'scam']

  try {
    const match = text.match(/\{[\s\S]*\}/)
    const result = JSON.parse(match ? match[0] : text)

    // Fallback: ha score <= 2 és a szöveg veszélyes kulcsszavakat tartalmaz, force block
    if (!result.blocked && result.score <= 2) {
      const szovegEgyutt = `${result.verdict} ${(result.improvements || []).join(' ')}`.toLowerCase()
      const veszelyes = VESZELYES_SZAVAK.some(sz => szovegEgyutt.includes(sz))
      if (veszelyes) {
        return NextResponse.json({
          blocked: true,
          block_reason: result.verdict || 'Content violates marketplace policies.',
          score: 0, verdict: '', strengths: [], improvements: [], ready: false,
        })
      }
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ blocked: false, score: 5, verdict: 'Could not analyze.', strengths: [], improvements: ['Add more detail to your description.'], ready: false })
  }
}
