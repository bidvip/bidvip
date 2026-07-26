import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ENGEDELYEZETT_TIPUSOK = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const MAX_MERET = 10 * 1024 * 1024 // 10MB

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

  const { data, error } = await supabase.storage
    .from('project-files')
    .upload(nev, buffer, { contentType: fajl.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('project-files')
    .getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl, nev: fajl.name, tipus: fajl.type })
}
