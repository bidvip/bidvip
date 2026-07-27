import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, launchEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'info.webbloki@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify caller is the admin user via Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: feliratkozok, error } = await supabase
    .from('feliratkozok')
    .select('email')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!feliratkozok || feliratkozok.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0 })
  }

  const { subject, html } = launchEmail()
  let sent = 0
  let failed = 0

  for (const row of feliratkozok) {
    try {
      await sendEmail(row.email, subject, html)
      sent++
      await new Promise(r => setTimeout(r, 100))
    } catch {
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: feliratkozok.length })
}
