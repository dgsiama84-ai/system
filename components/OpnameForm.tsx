'use client'

import { useState } from 'react'
import { submitOpname } from '@/lib/actions'
import { Ingredient } from '@/types'
import { CheckCircle, ChevronDown } from 'lucide-react'

export default function OpnameForm({
  ingredients,
  stockMap,
}: {
  ingredients: Ingredient[]
  stockMap: Record<string, number>
}) {
  const [ingredientId, setIngredientId] = useState('')
  const [realQty, setRealQty] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const systemQty = ingredientId ? (stockMap[ingredientId] ?? 0) : null
  const diff = systemQty !== null && realQty !== '' ? parseFloat(realQty) - systemQty : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ingredientId || realQty === '') return
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await submitOpname(ingredientId, parseFloat(realQty))

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setIngredientId('')
      setRealQty('')
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="card p-5 space-y-4">
      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          <CheckCircle size={16} />
          Opname berhasil disimpan!
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Bahan</label>
          <div className="relative">
            <select
              value={ingredientId}
              onChange={e => setIngredientId(e.target.value)}
              className="input appearance-none pr-10"
              required
            >
              <option value="">Pilih bahan...</option>
              {ingredients.map(ing => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {systemQty !== null && (
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-white/50">Stok Sistem</span>
            <span className="text-base font-bold">{systemQty}</span>
          </div>
        )}

        <div>
          <label className="label">Stok Fisik (Real)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={realQty}
            onChange={e => setRealQty(e.target.value)}
            placeholder="0"
            className="input text-lg font-bold"
            required
          />
        </div>

        {diff !== null && (
          <div className={`rounded-xl px-4 py-3 flex items-center justify-between border ${
            diff > 0
              ? 'bg-green-500/8 border-green-500/20'
              : diff < 0
              ? 'bg-red-500/8 border-red-500/20'
              : 'bg-white/5 border-white/10'
          }`}>
            <span className="text-sm text-white/50">Selisih</span>
            <span className={`text-lg font-bold ${
              diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-white/40'
            }`}>
              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !ingredientId || realQty === ''}
          className="btn-primary w-full text-base py-3.5"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </>
          ) : '✓ Simpan Opname'}
        </button>
      </form>
    </div>
  )
}
