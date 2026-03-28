export type Role = 'admin' | 'staff'

export interface Profile {
  id: string
  email: string
  role: Role
}

export interface Product {
  id: string
  name: string
  price: number
}

export interface Transaction {
  id: string
  product_id: string
  quantity: number
  total_price: number
  created_by: string
  created_at: string
  products?: { name: string; price: number }
  profiles?: { email: string }
}

export interface Expense {
  id: string
  name: string
  amount: number
  created_by: string
  created_at: string
}

export interface Ingredient {
  id: string
  name: string
  unit: string
}

export interface ProductRecipe {
  product_id: string
  ingredient_id: string
  qty: number
}

export interface Stock {
  ingredient_id: string
  qty: number
  ingredients?: Ingredient
}

export interface StockMovement {
  ingredient_id: string
  qty: number
  type: 'in' | 'out' | 'adjustment'
  created_at: string
}

export interface StockOpname {
  id?: string
  ingredient_id: string
  system_qty: number
  real_qty: number
  difference: number
  created_at?: string
}
