'use client'

import { useState } from 'react'
import { createTransaction } from '@/lib/actions'
import { Product } from '@/types'
import { CheckCircle, ChevronDown, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(n)
}

interface StockInfo {
  ingredient_name: string
  qty: number
  unit: string
  qty_used: number
}

export default function TransactionForm({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [loadingStock, setLoadingStock] = useState(false)

  const selectedProduct = products.find(p => p.id === productId)
  const total = selectedProduct ? selectedProduct.price * quantity : 0

async function handleProductChange(id: string) {
  setProductId(id)
  setStocks([])
  if (!id) return

  setLoadingStock(true)
  const supabase = createClient()

  // 1. Ambil user location_id dulu
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('location_id')
    .eq('id', user.id)
    .single()

  const locationId = profile?.location_id

  // 2. Ambil ingredients dari produk
  const { data } = await supabase
    .from('product_ingredients')
    .select('qty_used, ingredients(id, name, unit)')
    .eq('product_id', id)

  if (data && locationId) {
    // 3. Fetch stok per ingredient untuk lokasi ini
    const mapped = await Promise.all(data.map(async (d: any) => {
      const { data: stockData } = await supabase
        .from('stocks')
        .select('qty')
        .eq('ingredient_id', d.ingredients?.id)
        .eq('location_id', locationId)
        .single()

      return {
        ingredient_name: d.ingredients?.name,
        unit: d.ingredients?.unit,
        qty_used: d.qty_used,
        qty: stockData?.qty ?? 0,
      }
    }))
    setStocks(mapped)
  }

  setLoadingStock(false)
}

  async function handleConfirm() {
    setShowConfirm(false)
    setLoading(true)
    setError('')

    const result = await createTransaction(productId, quantity)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setProductId('')
      setQuantity(1)
      setStocks([])
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId || quantity < 1) return
    setShowConfirm(true)
  }

  const stockWarnings = stocks.filter(s => s.qty < s.qty_used * quantity)

  return (
    <div className="card p-5 space-y-4">
      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          <CheckCircle size={16} />
          Transaksi berhasil dicatat!
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Produk</label>
          <div className="relative">
            <select
              value={productId}
              onChange={e => handleProductChange(e.target.value)}
              className="input appearance-none pr-10"
              required
            >
              <option value="">Pilih produk...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatRupiah(p.price)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {loadingStock && (
          <p className="text-xs text-white/30">Mengecek stok...</p>
        )}

        {stocks.length > 0 && (
          <div className="rounded-xl border border-[#2e2e2e] overflow-hidden">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 py-2 border-b border-[#2e2e2e]">
              Stok Bahan
            </p>
            {stocks.map((s, i) => {
              const needed = s.qty_used * quantity
              const isLow = s.qty < needed
              return (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-[#2e2e2e] last:border-0">
                  <div className="flex items-center gap-2">
                    {isLow && <AlertTriangle size={13} className="text-yellow-400 shrink-0" />}
                    <span className="text-sm">{s.ingredient_name}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isLow ? 'text-red-400' : 'text-green-400'}`}>
                     Stok {s.qty} {s.unit}
                    </span>
                    <p className="text-[10px] text-white/30">butuh {needed} {s.unit}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div>
          <label className="label">Jumlah</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-11 h-11 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform"
            >−</button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input text-center text-lg font-bold flex-1"
              required
            />
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="w-11 h-11 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-white text-xl font-bold flex items-center justify-center active:scale-95 transition-transform"
            >+</button>
          </div>
        </div>

        {selectedProduct && (
          <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-white/50">Total</span>
            <span className="text-lg font-bold text-orange-400">{formatRupiah(total)}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !productId || stockWarnings.length > 0}
          className="btn-primary w-full text-base py-3.5 disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </span>
          ) : stockWarnings.length > 0 ? 'Stok Tidak Cukup' : '✓ Catat Transaksi'}
        </button>
      </form>

      {/* Modal Konfirmasi — z-[60] agar di atas navbar z-50 */}
      {showConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[60] px-4 pb-6">
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">Konfirmasi Transaksi</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Produk</span>
                <span className="font-semibold">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Jumlah</span>
                <span className="font-semibold">{quantity}x</span>
              </div>
              <div className="flex justify-between border-t border-[#2e2e2e] pt-2 mt-2">
                <span className="text-white/50">Total</span>
                <span className="font-bold text-orange-400 text-base">{formatRupiah(total)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirm} className="btn-primary flex-1 py-3">
                Ya, Catat
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[#2e2e2e] text-sm font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
