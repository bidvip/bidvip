import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'info.webbloki@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user_ids } = await req.json()
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({})
  }

  const emailMap: Record<string, string> = {}
  await Promise.all(
    user_ids.slice(0, 100).map(async (id: string) => {
      const { data: { user: u } } = await supabase.auth.admin.getUserById(id)
      if (u?.email) emailMap[id] = u.email
    })
  )

  return NextResponse.json(emailMap)
}
