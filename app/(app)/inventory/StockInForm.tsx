'use client'

import { useState } from 'react'
import { addStockIn } from '../../actions'
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
        style={{ background: '#f97316' }}
      >
        <Plus size={16} />
        Tambah Stok
      </button>

      {success && (
        <div className="mt-3 p-3 rounded-xl bg-green-500/10 text-green-400 text-sm">
          Stok berhasil ditambahkan
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 card p-4 space-y-3">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Stok Masuk</p>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Jumlah (pack)</label>
            <p className="text-[10px] text-white/30 mb-1">1 pack = 240 pcs</p>
            <select
              name="ingredient_id"
              required
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
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
            <label className="text-xs text-white/40 mb-1 block">Jumlah</label>
            <input
              name="qty"
              type="number"
              min="1"
              required
              placeholder="0"
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Catatan (opsional)</label>
            <input
              name="note"
              type="text"
              placeholder="Beli stok baru..."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: '#f97316' }}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm bg-[#2e2e2e]"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  )
}