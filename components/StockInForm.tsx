'use client'

import { useState } from 'react'
import { addStockIn } from '@/lib/actions'
import { Plus, AlertCircle } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  unit: string
}

export default function StockInForm({ ingredients }: { ingredients: Ingredient[] }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingData, setPendingData] = useState<{ ingredientId: string; ingredientName: string; pack: number; qty: number; note: string } | null>(null)

  // Step 1: validasi form → tampilkan konfirmasi
  function handlePreSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const ingredientId = (form.elements.namedItem('ingredient_id') as HTMLSelectElement).value
    const pack = Number((form.elements.namedItem('qty') as HTMLInputElement).value)
    const note = (form.elements.namedItem('note') as HTMLInputElement).value
    const ingredientName = ingredients.find(i => i.id === ingredientId)?.name ?? ''

    if (!ingredientId || !pack || pack <= 0) return

    setPendingData({ ingredientId, ingredientName, pack, qty: pack * 240, note })
    setConfirm(true)
  }

  // Step 2: konfirmasi → submit ke server
  async function handleConfirm() {
    if (!pendingData) return
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.set('ingredient_id', pendingData.ingredientId)
      formData.set('qty', String(pendingData.pack))
      formData.set('note', pendingData.note)
      await addStockIn(formData)
      setSuccess(true)
      setConfirm(false)
      setOpen(false)
      setPendingData(null)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Terjadi kesalahan')
      setConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setConfirm(false)
    setPendingData(null)
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="btn-primary">
        <Plus size={16} />
        Tambah Stok
      </button>

      {success && (
        <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          ✓ Stok berhasil ditambahkan
        </div>
      )}

      {open && !confirm && (
        <form onSubmit={handlePreSubmit} className="mt-3 card p-4 space-y-3">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Stok Masuk</p>

          <div>
            <label className="label">Bahan</label>
            <select name="ingredient_id" required className="input">
              <option value="">Pilih bahan...</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Jumlah (Pack)</label>
            <input
              name="qty"
              type="number"
              min="1"
              step="0.5"
              required
              placeholder="0"
              className="input"
            />
            <p className="text-xs text-white/30 mt-1">1 pack = 240 pcs</p>
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <input name="note" type="text" placeholder="Beli stok baru..." className="input" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">Lanjut</button>
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm bg-[#2e2e2e] font-semibold">
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Konfirmasi */}
      {confirm && pendingData && (
        <div className="mt-3 card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-400" />
            <p className="text-sm font-semibold text-white/80">Konfirmasi Tambah Stok</p>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2.5 border border-[#2e2e2e]">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Bahan</span>
              <span className="font-semibold">{pendingData.ingredientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Jumlah</span>
              <span className="font-semibold">{pendingData.pack} pack</span>
            </div>
            <div className="flex justify-between text-sm border-t border-[#2e2e2e] pt-2.5">
              <span className="text-white/40">Total Pcs</span>
              <span className="font-bold text-orange-400 text-base">{pendingData.qty.toLocaleString('id-ID')} pcs</span>
            </div>
            {pendingData.note && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Catatan</span>
                <span className="text-white/70">{pendingData.note}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-40"
            >
              {loading ? 'Menyimpan...' : '✓ Ya, Tambahkan'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-xl text-sm bg-[#2e2e2e] font-semibold"
            >
              Koreksi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
