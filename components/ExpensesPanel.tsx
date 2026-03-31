'use client'

import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { addExpense } from '@/lib/actions'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(n)
}

const CATEGORIES = [
  { value: 'camelo', label: 'Camelo (Produk)' },
  { value: 'air', label: 'Air Galon' },
  { value: 'lem', label: 'Lem' },
  { value: 'kemasan', label: 'Kemasan (Plastik/Staples)' },
  { value: 'transport', label: 'Transportasi' },
  { value: 'alat', label: 'Peralatan' },
  { value: 'lainnya', label: 'Lainnya' },
]

const categoryColors: Record<string, string> = {
  camelo: 'text-blue-400 bg-blue-400/10',
  air: 'text-cyan-400 bg-cyan-400/10',
  lem: 'text-purple-400 bg-purple-400/10',
  kemasan: 'text-green-400 bg-green-400/10',
  transport: 'text-yellow-400 bg-yellow-400/10',
  alat: 'text-pink-400 bg-pink-400/10',
  lainnya: 'text-white/40 bg-white/5',
}

interface Expense {
  id: string
  name: string
  amount: number
  category: string
  date: string
  locations?: { name: string }
}

interface Location {
  id: string
  name: string
}

export default function ExpensesPanel({
  expenses,
  totalExpenses,
  locations,
}: {
  expenses: Expense[]
  totalExpenses: number
  locations: Location[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pendingData, setPendingData] = useState<FormData | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    name: string
    amount: number
    category: string
    date: string
    locationName: string
  } | null>(null)

  function handlePreSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const locationId = formData.get('location_id') as string
    const locationName = locations.find(l => l.id === locationId)?.name ?? ''
    setPendingData(formData)
    setConfirmData({
      name: formData.get('name') as string,
      amount: Number(formData.get('amount')),
      category: formData.get('category') as string,
      date: formData.get('date') as string,
      locationName,
    })
    setShowConfirm(true)
  }

  async function handleConfirm() {
    if (!pendingData) return
    setShowConfirm(false)
    setLoading(true)
    setError('')
    try {
      await addExpense(pendingData)
      setSuccess(true)
      setOpen(false)
      setPendingData(null)
      setConfirmData(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Pengeluaran</h1>
          <p className="text-white/40 text-sm mt-0.5">Catat biaya operasional</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#f97316' }}
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40 text-xs font-medium">Total Pengeluaran</span>
          <Wallet size={14} className="text-red-400" />
        </div>
        <p className="text-xl font-bold text-red-400">{formatRupiah(totalExpenses)}</p>
        <p className="text-[10px] text-white/30 mt-1">Semua lokasi</p>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-green-500/10 text-green-400 text-sm">
          Pengeluaran berhasil dicatat
        </div>
      )}

      {open && (
        <form onSubmit={handlePreSubmit} className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Pengeluaran Baru</p>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Lokasi</label>
            <select
              name="location_id"
              required
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            >
              <option value="">Pilih lokasi...</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Keterangan</label>
            <input
              name="name"
              type="text"
              autoComplete="off"
              required
              placeholder="Beli..."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Kategori</label>
            <select
              name="category"
              required
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Jumlah (Rp)</label>
            <input
              name="amount"
              type="number"
              min="0"
              required
              placeholder="0"
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Tanggal</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
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
              {loading ? 'Menyimpan...' : 'Lanjut'}
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

      {/* List expenses */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Riwayat Pengeluaran</h2>
        {expenses.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-6">Belum ada pengeluaran</p>
        ) : (
          <div className="space-y-0">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{e.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[e.category] ?? categoryColors.lainnya}`}>
                      {CATEGORIES.find(c => c.value === e.category)?.label ?? e.category}
                    </span>
                    {e.locations?.name && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-orange-400 bg-orange-400/10">
                        {e.locations.name}
                      </span>
                    )}
                    <span className="text-xs text-white/30">
                      {new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-bold text-red-400">{formatRupiah(e.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showConfirm && confirmData && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[60] px-4 pb-6">
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">Konfirmasi Pengeluaran</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Lokasi</span>
                <span className="font-semibold text-orange-400">{confirmData.locationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Keterangan</span>
                <span className="font-semibold text-right max-w-[60%]">{confirmData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Kategori</span>
                <span className="font-semibold">{CATEGORIES.find(c => c.value === confirmData.category)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Tanggal</span>
                <span className="font-semibold">
                  {new Date(confirmData.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#2e2e2e] pt-2 mt-2">
                <span className="text-white/50">Total</span>
                <span className="font-bold text-red-400 text-base">{formatRupiah(confirmData.amount)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: '#f97316' }}
              >
                {loading ? 'Menyimpan...' : 'Ya, Catat'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#2e2e2e]"
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