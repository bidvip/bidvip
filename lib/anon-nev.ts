export async function getNapiAnonNev(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  user_id: string,
  tipus: 'elado' | 'vevo'
): Promise<string> {
  const ma = new Date().toISOString().split('T')[0]
  const mezó = `anon_${tipus}`
  const prefix = tipus === 'elado' ? 'Seller' : 'Buyer'

  // Return existing name if already assigned today
  const { data: meglevo } = await (supabase as any)
    .from('anon_nevek')
    .select(mezó)
    .eq('user_id', user_id)
    .eq('datum', ma)
    .single()

  if (meglevo?.[mezó]) return meglevo[mezó]

  // Get all names already taken today to avoid collision
  const { data: maiNevek } = await (supabase as any)
    .from('anon_nevek')
    .select(mezó)
    .eq('datum', ma)
    .not(mezó, 'is', null)

  const foglalt = new Set((maiNevek || []).map((r: any) => r[mezó]))

  // Generate unique name
  let ujNev: string
  let kiserletek = 0
  do {
    const szam = Math.floor(1000 + Math.random() * 9000)
    ujNev = `${prefix}${szam}`
    kiserletek++
  } while (foglalt.has(ujNev) && kiserletek < 100)

  await (supabase as any)
    .from('anon_nevek')
    .upsert({ user_id, datum: ma, [mezó]: ujNev }, { onConflict: 'user_id,datum' })

  return ujNev
}
