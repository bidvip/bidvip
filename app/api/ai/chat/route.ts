import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const { uzenet, elozmenyek, projekt } = await req.json()

  const rendszerPrompt = `You are an expert startup mentor on BidVip, a marketplace where startup ideas are auctioned to buyers. Your goal is to help the seller refine their idea until it is truly market-ready and attractive to potential buyers.

The seller's project:
- Name: ${projekt.nev}
- Category: ${projekt.kategoria}
- Short description: ${projekt.rovid_leiras}
- Detailed description: ${projekt.reszletes_leiras}

Guide them with specific, actionable advice. Ask clarifying questions. Help them strengthen the value proposition, identify the target market, and make the listing compelling.

IMPORTANT: At the end of every response, you MUST add a JSON block on its own line in this exact format:
{"keszen": false}
or when the idea is genuinely market-ready:
{"keszen": true}

Only set keszen:true when the idea has a clear value proposition, target market, competitive advantage, and realistic pricing. Be strict — most ideas need several rounds of refinement.`

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

  // Extract keszen flag and clean response text
  const jsonMatch = teljesValasz.match(/\{"keszen":\s*(true|false)\}/)
  const keszen = jsonMatch ? jsonMatch[1] === 'true' : false
  const valasz = teljesValasz.replace(/\{"keszen":\s*(true|false)\}/g, '').trim()

  return NextResponse.json({ valasz, keszen })
}
