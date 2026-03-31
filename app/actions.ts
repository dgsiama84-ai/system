'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addStockIn(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Admin only')

  const ingredient_id = formData.get('ingredient_id') as string
  const location_id = formData.get('location_id') as string
  const packQty = Number(formData.get('qty'))
  const qty = packQty * 240
  const note = formData.get('note') as string

  if (!ingredient_id || !location_id || !packQty || packQty <= 0) {
    throw new Error('Data tidak valid')
  }

  const { error } = await supabase.from('stock_movements').insert({
    ingredient_id,
    qty,
    type: 'in',
    note: note || 'Stok masuk manual',
    created_by: user.id,
    location_id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/inventory')
}