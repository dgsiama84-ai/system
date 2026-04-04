'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- HELPER ---
async function getUserProfile(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('id, role, location_id')
    .eq('id', user.id)
    .single()
  return data ? { ...data, uid: user.id } : null
}

// --- AUTH ---
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

// --- TRANSACTIONS ---
export async function createTransaction(productId: string, quantity: number) {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)
  if (!profile) return { error: 'Not authenticated' }

  const { data: product } = await supabase
    .from('products')
    .select('price, name')
    .eq('id', productId)
    .single()
  if (!product) return { error: 'Produk tidak ditemukan' }

  const { error } = await supabase.from('transactions').insert({
    product_id: productId,
    quantity,
    total_price: product.price * quantity,
    created_by: profile.uid,
    location_id: profile.location_id,
  })

  if (error) {
    const uuidMatch = error.message.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    )
    if (uuidMatch) {
      const { data: ing } = await supabase
        .from('ingredients').select('name').eq('id', uuidMatch[0]).single()
      if (ing) return { error: `Stok ${ing.name} tidak cukup` }
    }
    return { error: error.message }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/inventory')
  revalidatePath('/reports')
  return { success: true }
}

// --- STOCK IN ---
export async function addStockIn(formData: FormData) {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)
  if (!profile) throw new Error('Not authenticated')
  if (profile.role !== 'admin') throw new Error('Admin only')

  const ingredient_id = formData.get('ingredient_id') as string
  const location_id = formData.get('location_id') as string
  const qty = parseFloat(formData.get('qty') as string)
  const note = formData.get('note') as string | null

  if (!ingredient_id || !location_id || isNaN(qty) || qty <= 0) throw new Error('Data tidak valid')

  const { error } = await supabase.from('stock_movements').insert({
    ingredient_id,
    qty,
    type: 'in',
    note: note || 'Tambah stok manual',
    created_by: profile.uid,
    location_id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/inventory')
}
export async function addExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin only')

  const name = formData.get('name') as string
  const amount = Number(formData.get('amount'))
  const category = formData.get('category') as string
  const note = formData.get('note') as string | null

  if (!name || !amount || !category) throw new Error('Data tidak valid')

  const { error } = await supabase.from('expenses').insert({
    name, amount, category,
    note: note || null,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/transactions')
}

// --- STOCK OPNAME ---
export async function submitOpname(ingredientId: string, realQty: number) {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)
  if (!profile) return { error: 'Not authenticated' }

  const { data: stock } = await supabase
    .from('stocks')
    .select('qty')
    .eq('ingredient_id', ingredientId)
    .eq('location_id', profile.location_id)
    .single()

  const systemQty = stock?.qty ?? 0
  const difference = realQty - systemQty

  const { error: opnameError } = await supabase.from('stock_opname').insert({
    ingredient_id: ingredientId,
    system_qty: systemQty,
    real_qty: realQty,
    difference,
    created_by: profile.uid,
  })

  if (opnameError) return { error: opnameError.message }

  await supabase.from('stock_movements').insert({
    ingredient_id: ingredientId,
    qty: realQty,
    type: 'adjustment',
    note: `Opname: sistem ${systemQty} → fisik ${realQty}`,
    created_by: profile.uid,
    location_id: profile.location_id,
  })

  revalidatePath('/opname')
  revalidatePath('/inventory')
  revalidatePath('/reports')
  return { success: true }
}

// --- PURCHASES ---
export async function addPurchase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin only')

  const date = formData.get('date') as string
  const note = formData.get('note') as string | null
  const items = JSON.parse(formData.get('items') as string) as { label: string; amount: number }[]
  const contributions = JSON.parse(formData.get('contributions') as string) as { location_id: string; amount_paid: number }[]

  if (!items.length) throw new Error('Minimal 1 item biaya')

  // Insert purchase
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({ date, note: note || null, created_by: user.id })
    .select('id')
    .single()
  if (purchaseError) throw new Error(purchaseError.message)

  // Insert items
  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(items.map(i => ({ purchase_id: purchase.id, label: i.label, amount: i.amount })))
  if (itemsError) throw new Error(itemsError.message)

  // Insert contributions (hanya yang amount_paid > 0)
  const validContribs = contributions.filter(c => c.location_id && Number(c.amount_paid) > 0)
  if (validContribs.length > 0) {
    const { error: contribError } = await supabase
      .from('purchase_contributions')
      .insert(validContribs.map(c => ({
        purchase_id: purchase.id,
        location_id: c.location_id,
        amount_paid: Number(c.amount_paid),
      })))
    if (contribError) throw new Error(contribError.message)
  }

  revalidatePath('/transactions')
}