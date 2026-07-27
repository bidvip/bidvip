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

const VESZELYES_TARTALOM_PROMPT = `You are a strict content safety moderator for a startup marketplace. Reject the file if it contains ANY of the following:

WEAPONS & VIOLENCE:
- Instructions for making bombs, explosives, or improvised weapons
- Weapon modification or illegal firearm instructions
- Plans for physical attacks or assassinations

ILLEGAL SCHEMES:
- Money laundering methods or techniques
- Tax evasion or financial fraud instructions
- Pyramid/Ponzi scheme blueprints
- Counterfeit currency or documents
- Identity theft methods

DRUGS & CONTROLLED SUBSTANCES:
- Drug synthesis, manufacturing, or trafficking instructions
- Instructions for creating or distributing controlled substances

TERRORISM & EXTREMISM:
- Terrorism financing or planning
- Extremist recruitment or propaganda
- Instructions for mass casualty events

EXPLOITATION & ABUSE:
- Child sexual abuse material (CSAM) or grooming
- Human trafficking instructions
- Coercive control or abuse methods

CYBERCRIME:
- Malware, ransomware, or hacking tools
- Phishing kits or social engineering scripts
- Instructions for unauthorized system access

HATE & DISCRIMINATION:
- Content promoting genocide or ethnic cleansing
- Explicit hate speech targeting protected groups`

async function szovegEllenorzes(szoveg: string, fajlNev: string): Promise<{ ok: boolean; reason: string }> {
  if (!szoveg || szoveg.trim().length < 20) return { ok: true, reason: '' }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: `${VESZELYES_TARTALOM_PROMPT}

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
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: publicUrl } },
        { type: 'text', text: `${VESZELYES_TARTALOM_PROMPT}\n\nFile: ${fajlNev}\n\nDoes this image contain any of the above dangerous/illegal content?\n\nRespond ONLY with JSON: {"ok": true} or {"ok": false, "reason": "<short reason, max 80 chars>"}` },
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

async function felfuggeszt(supabase: ReturnType<typeof createClient>, user_id: string, user_email: string, fajlNev: string, ok: string) {
  await Promise.all([
    supabase.from('felfuggesztesek').insert([{ user_id, user_email, ok }]),
    supabase.from('reports').insert([{
      user_id,
      user_email,
      nev: `Dangerous file upload: ${fajlNev}`,
      rovid_leiras: '',
      reszletes_leiras: '',
      kategoria: '',
      block_reason: ok,
      fajlok: [],
      ip_cim: 'upload',
      user_agent: 'upload-scanner',
      statusz: 'pending',
    }]),
  ])
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await req.formData()
  const fajl = formData.get('fajl') as File
  const user_id = (formData.get('user_id') as string) || ''
  const user_email = (formData.get('user_email') as string) || ''

  if (!fajl) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ENGEDELYEZETT_TIPUSOK.includes(fajl.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  if (fajl.size > MAX_MERET) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const buffer = Buffer.from(await fajl.arrayBuffer())
  const nev = `${Date.now()}_${fajl.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  // Extract text and scan BEFORE uploading to storage
  let szoveg = ''
  if (!fajl.type.startsWith('image/')) {
    szoveg = await extractText(buffer, fajl.type)
    const ellenorzes = await szovegEllenorzes(szoveg, fajl.name)
    if (!ellenorzes.ok) {
      if (user_id) await felfuggeszt(supabase, user_id, user_email, fajl.name, ellenorzes.reason)
      return NextResponse.json({ error: `File rejected: ${ellenorzes.reason}`, suspended: !!user_id }, { status: 422 })
    }
  }

  const { data, error } = await supabase.storage
    .from('project-files')
    .upload(nev, buffer, { contentType: fajl.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('project-files')
    .getPublicUrl(data.path)

  // Check image AFTER upload (vision API needs public URL), then delete if dangerous
  if (fajl.type.startsWith('image/')) {
    const ellenorzes = await kepEllenorzes(publicUrl, fajl.name)
    if (!ellenorzes.ok) {
      await supabase.storage.from('project-files').remove([data.path])
      if (user_id) await felfuggeszt(supabase, user_id, user_email, fajl.name, ellenorzes.reason)
      return NextResponse.json({ error: `Image rejected: ${ellenorzes.reason}`, suspended: !!user_id }, { status: 422 })
    }
  }

  return NextResponse.json({ url: publicUrl, nev: fajl.name, tipus: fajl.type, szoveg })
}
