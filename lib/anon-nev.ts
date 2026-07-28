export function generálAnonNev(tipus: 'Seller' | 'Buyer'): string {
  const szam = Math.floor(1000 + Math.random() * 9000)
  return `${tipus}${szam}`
}

export async function getNapiAnonNev(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  user_id: string,
  tipus: 'elado' | 'vevo'
): Promise<string> {
  const ma = new Date().toISOString().split('T')[0]

  const { data: meglevo } = await (supabase as any)
    .from('anon_nevek')
    .select('anon_elado, anon_vevo')
    .eq('user_id', user_id)
    .eq('datum', ma)
    .single()

  if (meglevo && meglevo[`anon_${tipus}`]) {
    return meglevo[`anon_${tipus}`]
  }

  const ujNev = generálAnonNev(tipus === 'elado' ? 'Seller' : 'Buyer')

  await (supabase as any)
    .from('anon_nevek')
    .upsert({
      user_id,
      datum: ma,
      [`anon_${tipus}`]: ujNev,
    }, { onConflict: 'user_id,datum', ignoreDuplicates: false })

  return ujNev
}
