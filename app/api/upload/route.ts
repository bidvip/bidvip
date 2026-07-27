import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractText } from '@/lib/extract-text'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const ENGEDELYEZETT_TIPUSOK = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_MERET = 10 * 1024 * 1024 // 10MB

async function szovegEllenorzes(szoveg: string, fajlNev: string): Promise<{ ok: boolean; reason: string }> {
  if (!szoveg || szoveg.trim().length < 20) return { ok: true, reason: '' }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `You are a content moderator. Check if this document content contains dangerous, illegal, or explicitly harmful material (weapons instructions, drug synthesis, malware code, hate speech, etc.).

File: ${fajlNev}
Content (first 3000 chars):
${szoveg.slice(0, 3000)}

Respond ONLY with JSON: {"ok": true} or {"ok": false, "reason": "<short reason, max 80 chars>"}`,
    }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : text)
  } catch {
    return { ok: true, reason: '' }
  }
}

async function kepEllenorzes(publicUrl: string, fajlNev: string): Promise<{ ok: boolean; reason: string }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: publicUrl } },
        { type: 'text', text: `Does this image contain dangerous, illegal, or explicitly offensive content (violence, weapons, drugs, explicit material, hate symbols)? File: ${fajlNev}\n\nRespond ONLY with JSON: {"ok": true} or {"ok": false, "reason": "<short reason, max 80 chars>"}` },
      ],
    }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : text)
  } catch {
    return { ok: true, reason: '' }
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await req.formData()
  const fajl = formData.get('fajl') as File

  if (!fajl) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ENGEDELYEZETT_TIPUSOK.includes(fajl.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  if (fajl.size > MAX_MERET) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const buffer = Buffer.from(await fajl.arrayBuffer())
  const nev = `${Date.now()}_${fajl.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  // Extract text before upload so we can check before storing
  let szoveg = ''
  if (!fajl.type.startsWith('image/')) {
    szoveg = await extractText(buffer, fajl.type)
    const ellenorzes = await szovegEllenorzes(szoveg, fajl.name)
    if (!ellenorzes.ok) {
      return NextResponse.json({ error: `File rejected: ${ellenorzes.reason}` }, { status: 422 })
    }
  }

  const { data, error } = await supabase.storage
    .from('project-files')
    .upload(nev, buffer, { contentType: fajl.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('project-files')
    .getPublicUrl(data.path)

  // Check image content after upload (needs public URL for vision API)
  if (fajl.type.startsWith('image/')) {
    const ellenorzes = await kepEllenorzes(publicUrl, fajl.name)
    if (!ellenorzes.ok) {
      await supabase.storage.from('project-files').remove([data.path])
      return NextResponse.json({ error: `Image rejected: ${ellenorzes.reason}` }, { status: 422 })
    }
  }

  return NextResponse.json({ url: publicUrl, nev: fajl.name, tipus: fajl.type, szoveg })
}
