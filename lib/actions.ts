'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price, name')
    .eq('id', productId)
    .single()

  if (productError || !product) return { error: 'Produk tidak ditemukan' }

  const totalPrice = product.price * quantity

  // Insert transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      product_id: productId,
      quantity,
      total_price: totalPrice,
      created_by: user.id,
    })
    .select()
    .single()

  if (txError) return { error: txError.message }

  // ✅ Get recipe dan deduct stok
  const { data: recipes } = await supabase
    .from('product_recipes')
    .select('ingredient_id, qty')
    .eq('product_id', productId)

  if (recipes && recipes.length > 0) {
    for (const recipe of recipes) {
      const deductQty = recipe.qty * quantity // 50 pcs × qty repack

      // Get current stock
      const { data: stock } = await supabase
        .from('stocks')
        .select('qty')
        .eq('ingredient_id', recipe.ingredient_id)
        .single()

      const newQty = Math.max(0, (stock?.qty ?? 0) - deductQty)

      // Update stock
      await supabase
        .from('stocks')
        .upsert({ ingredient_id: recipe.ingredient_id, qty: newQty })

      // Catat stock movement dengan traceability
      await supabase
        .from('stock_movements')
        .insert({
          ingredient_id: recipe.ingredient_id,
          qty: deductQty,
          type: 'out',
          ref_id: transaction.id,
          notes: `Penjualan ${quantity} repack ${product.name}`,
        })
    }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/inventory')
  revalidatePath('/reports')
  return { success: true }
}

// --- STOCK IN (Tambah stok manual) ---
export async function addStockIn(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ingredientId = formData.get('ingredient_id') as string
  const qty = parseFloat(formData.get('qty') as string)
  const note = formData.get('note') as string | null

  if (!ingredientId || isNaN(qty) || qty <= 0) {
    throw new Error('Data tidak valid')
  }

  // Get current stock
  const { data: stock } = await supabase
    .from('stocks')
    .select('qty')
    .eq('ingredient_id', ingredientId)
    .single()

  const newQty = (stock?.qty ?? 0) + qty

  // Update stock
  const { error: stockError } = await supabase
    .from('stocks')
    .upsert({ ingredient_id: ingredientId, qty: newQty })

  if (stockError) throw new Error(stockError.message)

  // Catat movement
  await supabase
    .from('stock_movements')
    .insert({
      ingredient_id: ingredientId,
      qty,
      type: 'in',
      notes: note || 'Tambah stok manual',
    })

  revalidatePath('/inventory')
}

// --- EXPENSES ---
export async function createExpense(formData: {
  name: string
  amount: number
  category: 'operational' | 'stock_purchase'
  ingredientId?: string
  qtyPack?: number
  pcsPerPack?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const qtyPcs =
    formData.category === 'stock_purchase' && formData.qtyPack && formData.pcsPerPack
      ? formData.qtyPack * formData.pcsPerPack
      : null

  const { error } = await supabase
    .from('expenses')
    .insert({
      name: formData.name,
      amount: formData.amount,
      category: formData.category,
      ingredient_id: formData.ingredientId ?? null,
      qty_pcs: qtyPcs,
      qty_pack: formData.qtyPack ?? null,
      pcs_per_pack: formData.pcsPerPack ?? 240,
      created_by: user.id,
    })

  // Stok otomatis bertambah via DB trigger saat category = 'stock_purchase'
  if (error) return { error: error.message }

  revalidatePath('/expenses')
  revalidatePath('/inventory')
  revalidatePath('/reports')
  return { success: true }
}

// --- STOCK OPNAME ---
export async function submitOpname(ingredientId: string, realQty: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: stock } = await supabase
    .from('stocks')
    .select('qty')
    .eq('ingredient_id', ingredientId)
    .single()

  const systemQty = stock?.qty ?? 0
  const difference = realQty - systemQty

  const { data: opname, error: opnameError } = await supabase
    .from('stock_opname')
    .insert({
      ingredient_id: ingredientId,
      system_qty: systemQty,
      real_qty: realQty,
      difference,
    })
    .select()
    .single()

  if (opnameError) return { error: opnameError.message }

  // Catat movement adjustment
  await supabase
    .from('stock_movements')
    .insert({
      ingredient_id: ingredientId,
      qty: Math.abs(difference),
      type: 'adjustment',
      ref_id: opname.id,
      notes: `Opname: sistem ${systemQty} → fisik ${realQty} (selisih ${difference > 0 ? '+' : ''}${difference})`,
    })

  // Update stock ke qty real
  await supabase
    .from('stocks')
    .upsert({ ingredient_id: ingredientId, qty: realQty })

  revalidatePath('/opname')
  revalidatePath('/inventory')
  revalidatePath('/reports')
  return { success: true }
}

export async function addExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin only')

  const { error } = await supabase.from('expenses').insert({
    name: formData.get('name') as string,
    amount: Number(formData.get('amount')),
    category: formData.get('category') as string,
    date: formData.get('date') as string,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/transactions')
}