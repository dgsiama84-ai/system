'use client'

import { useState } from 'react'
// ✅ Fix: pakai alias path, bukan relative '../actions'
import { addStockIn } from '@/lib/actions'
import { Plus } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  unit: string
}

export default function StockInForm({ ingredients }: { ingredients: Ingredient[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const formData = new FormData(e.currentTarget)
      await addStockIn(formData)
      setSuccess(true)
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="btn-primary"
      >
        <Plus size={16} />
        Tambah Stok
      </button>

      {success && (
        <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Stok berhasil ditambahkan
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 card p-4 space-y-3">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Stok Masuk</p>

          <div>
            <label className="label">Bahan</label>
            <select
              name="ingredient_id"
              required
              className="input"
            >
              <option value="">Pilih bahan...</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jumlah</label>
            <input
              name="qty"
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="0"
              className="input"
            />
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <input
              name="note"
              type="text"
              placeholder="Beli stok baru..."
              className="input"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm bg-[#2e2e2e] font-semibold"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
