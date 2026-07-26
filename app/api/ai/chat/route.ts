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

Guide them with specific, actionable advice. Ask clarifying questions. Help them strengthen the value proposition, identify the target market, and make the listing compelling. When you believe the idea is market-ready, tell them clearly so they know they can proceed to submit.`

  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system: rendszerPrompt,
    messages: [
      ...elozmenyek,
      { role: 'user', content: uzenet },
    ],
  })

  const valasz = message.content[0].type === 'text' ? message.content[0].text : ''

  return NextResponse.json({ valasz })
}
