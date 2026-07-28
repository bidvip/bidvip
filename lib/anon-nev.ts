export async function getNapiAnonNev(
  supabase: any,
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

  // Count how many users already have a name today → next sequential number
  const { count } = await (supabase as any)
    .from('anon_nevek')
    .select(mezó, { count: 'exact', head: true })
    .eq('datum', ma)
    .not(mezó, 'is', null)

  const sorszam = 1001 + (count || 0)
  const ujNev = `${prefix}${sorszam}`

  await (supabase as any)
    .from('anon_nevek')
    .upsert({ user_id, datum: ma, [mezó]: ujNev }, { onConflict: 'user_id,datum' })

  return ujNev
}
