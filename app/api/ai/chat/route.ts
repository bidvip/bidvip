import { NextRequest } from 'next/server'
import { szakertoiKontextus } from '@/lib/kategoriak'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { uzenet, elozmenyek, projekt, kepUrlok = [], fajlSzovegek = [] } = await req.json()

  const rendszerPrompt = `You are a senior startup advisor and investor on BidVip, a marketplace where startup ideas are auctioned. You have reviewed hundreds of startups. Your job is to help the seller turn their rough idea into a compelling, market-ready listing that buyers will actually bid on.

The seller's project:
- Name: ${projekt.nev}
- Category: ${projekt.kategoria}
- Short description: ${projekt.rovid_leiras}
- Detailed description: ${projekt.reszletes_leiras}${fajlSzovegek.length > 0 ? `\n\nExtracted content from uploaded documents:\n${fajlSzovegek.map((s: string, i: number) => `[Document ${i + 1}]:\n${s}`).join('\n\n')}` : ''}

HOW TO RESPOND:
- Give a real, professional opinion — like a VC would in a 15-minute meeting
- Be direct and honest. If something is weak, name it specifically and explain why it matters
- Don't just ask questions — give concrete suggestions, examples, and direction
- Point out what's missing: target market, revenue model, competitive moat, proof points
- If the idea has potential, explain what would make it compelling to a buyer
- Push back hard on vague or generic answers
- Each response should move the seller meaningfully forward, not just repeat questions

IMPORTANT: At the end of every response, on its own line, add exactly this JSON (no other text around it):
{"score": <number 1-10 with one decimal>, "keszen": <true if score >= 8.5, false otherwise>}

Score criteria:
- 1-4: Vague, unrealistic, or not a real business opportunity
- 5-6: Has potential but missing critical elements
- 7-8: Solid idea, needs sharper positioning or proof
- 8.5-10: Market-ready — clear value prop, defined target market, competitive advantage, realistic pricing

Be strict. Most ideas need 3-5 rounds to reach 8.5.`

  const kepTartalom = kepUrlok.slice(0, 4).map((url: string) => ({
    type: 'image',
    source: { type: 'url', url },
  }))

  const utolsoUzenet = kepTartalom.length > 0
    ? { role: 'user', content: [...kepTartalom, { type: 'text', text: uzenet }] }
    : { role: 'user', content: uzenet }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      stream: true,
      system: rendszerPrompt,
      messages: [...elozmenyek, utolsoUzenet],
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    return new Response(`\n\n__BIDVIP_META__${JSON.stringify({ score: null, keszen: false, error: err })}`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const encoder = new TextEncoder()
  let fullText = ''

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const json = JSON.parse(data)
              if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
                fullText += json.delta.text
                controller.enqueue(encoder.encode(json.delta.text))
              }
            } catch {}
          }
        }

        const jsonMatch = fullText.match(/\{"score":\s*([\d.]+),\s*"keszen":\s*(true|false)\}/)
        const score = jsonMatch ? parseFloat(jsonMatch[1]) : null
        const keszen = jsonMatch ? jsonMatch[2] === 'true' : false
        controller.enqueue(encoder.encode(`\n\n__BIDVIP_META__${JSON.stringify({ score, keszen })}`))
      } catch (e) {
        controller.enqueue(encoder.encode(`\n\n__BIDVIP_META__${JSON.stringify({ score: null, keszen: false })}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
