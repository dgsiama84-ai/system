'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- AUTH ---
export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { user: data.user }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data
}

// --- TRANSACTIONS ---
export async function createTransaction(productId: string, quantity: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Ensure profile row exists (prevents FK violation)
  await supabase.from('profiles').upsert(
    { id: user.id, email: user.email ?? '', role: 'staff' },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Get product price
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price')
    .eq('id', productId)
    .single()

  if (productError || !product) return { error: 'Product not found' }

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

  // Get recipe and deduct stock
  const { data: recipes } = await supabase
    .from('product_recipes')
    .select('ingredient_id, qty')
    .eq('product_id', productId)

  if (recipes && recipes.length > 0) {
    for (const recipe of recipes) {
      const deductQty = recipe.qty * quantity

      // Get current stock
      const { data: stock } = await supabase
        .from('stocks')
        .select('qty')
        .eq('ingredient_id', recipe.ingredient_id)
        .single()

      const currentQty = stock?.qty ?? 0
      const newQty = Math.max(0, currentQty - deductQty)

      // Update stock
      await supabase
        .from('stocks')
        .upsert({ ingredient_id: recipe.ingredient_id, qty: newQty })

      // Insert stock movement
      await supabase
        .from('stock_movements')
        .insert({
          ingredient_id: recipe.ingredient_id,
          qty: deductQty,
          type: 'out',
        })
    }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/inventory')
  return { transaction }
}

// --- STOCK OPNAME ---
export async function submitOpname(ingredientId: string, realQty: number) {
  const supabase = await createClient()

  // Get current system qty
  const { data: stock } = await supabase
    .from('stocks')
    .select('qty')
    .eq('ingredient_id', ingredientId)
    .single()

  const systemQty = stock?.qty ?? 0
  const difference = realQty - systemQty

  // Save opname
  const { error: opnameError } = await supabase
    .from('stock_opname')
    .insert({
      ingredient_id: ingredientId,
      system_qty: systemQty,
      real_qty: realQty,
      difference,
    })

  if (opnameError) return { error: opnameError.message }

  // Insert adjustment movement
  await supabase
    .from('stock_movements')
    .insert({
      ingredient_id: ingredientId,
      qty: Math.abs(difference),
      type: 'adjustment',
    })

  // Update stock to real qty
  await supabase
    .from('stocks')
    .upsert({ ingredient_id: ingredientId, qty: realQty })

  revalidatePath('/opname')
  revalidatePath('/inventory')
  return { success: true }
}