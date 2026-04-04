'use client'

import { useState } from 'react'
import { Plus, ShoppingBag, Trash2, AlertCircle } from 'lucide-react'
import { addPurchase } from '@/lib/actions'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(n)
}

interface PurchaseItem {
  label: string
  amount: number
}

interface Contribution {
  location_id: string
  pack_ordered: number | ''
  pack_paid: number | ''
  amount_paid: number | ''
}

interface Purchase {
  id: string
  date: string
  note?: string
  purchase_items: { label: string; amount: number }[]
  purchase_contributions: {
    pack_ordered: number
    pack_paid: number
    amount_paid: number
    locations: { name: string }
  }[]
}

interface Location {
  id: string
  name: string
}

function getValidItems(items: PurchaseItem[]) {
  return items.filter(i => i.label.trim() !== '' && i.amount > 0)
}

export default function PurchasesTab({
  purchases,
  locations,
}: {
  purchases: Purchase[]
  locations: Location[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [items, setItems] = useState<PurchaseItem[]>([{ label: '', amount: 0 }])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  const validItems = getValidItems(items)
  const totalBiaya = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const totalKontribusi = contributions.reduce((s, c) => s + (Number(c.amount_paid) || 0), 0)
  const tanggunganAdmin = totalBiaya - totalKontribusi

  function addItem() {
    setItems([...items, { label: '', amount: 0 }])
  }

  function removeItem(idx: number) {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof PurchaseItem, value: string | number) {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function addContribution() {
    if (locations.length === 0) return
    setContributions([...contributions, {
      location_id: locations[0].id,
      pack_ordered: '',
      pack_paid: '',
      amount_paid: '',
    }])
  }

  function removeContribution(idx: number) {
    setContributions(contributions.filter((_, i) => i !== idx))
  }

  function updateContribution(idx: number, field: keyof Contribution, value: string | number) {
    setContributions(contributions.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  function handlePreSubmit() {
    if (validItems.length === 0) {
      setError('Minimal 1 item biaya harus diisi')
      return
    }
    setError('')
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setShowConfirm(false)
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.set('date', date)
      formData.set('note', note)
      formData.set('items', JSON.stringify(validItems))
      // Normalize contributions — pack_ordered & pack_paid default ke 0 kalau kosong
      const normalizedContributions = contributions.map(c => ({
        location_id: c.location_id,
        pack_ordered: Number(c.pack_ordered) || 0,
        pack_paid: Number(c.pack_paid) || 0,
        amount_paid: Number(c.amount_paid) || 0,
      }))
      formData.set('contributions', JSON.stringify(normalizedContributions))
      await addPurchase(formData)
      setSuccess(true)
      setOpen(false)
      setItems([{ label: '', amount: 0 }])
      setContributions([])
      setNote('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Pembelian Stok</h1>
          <p className="text-white/40 text-sm mt-0.5">Pengadaan & kontribusi lokasi</p>
        </div>
        <button
          onClick={() => { setOpen(!open); setError('') }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#f97316' }}
        >
          <Plus size={16} /> Tambah Pembelian
        </button>
      </div>

      {/* Stat */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40 text-xs font-medium">Total Pembelian Stok</span>
          <ShoppingBag size={14} className="text-blue-400" />
        </div>
        <p className="text-xl font-bold text-blue-400">
          {formatRupiah(purchases.reduce((s, p) => s + p.purchase_items.reduce((ss, i) => ss + i.amount, 0), 0))}
        </p>
        <p className="text-[10px] text-white/30 mt-1">{purchases.length} pembelian</p>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          ✓ Pembelian berhasil dicatat
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      {open && (
        <div className="card p-4 space-y-4">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Pembelian Baru</p>

          {/* Tanggal */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>

          {/* Items biaya */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/40">Rincian Biaya</label>
              <button onClick={addItem} type="button"
                className="text-xs text-orange-400 flex items-center gap-1">
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Keterangan..."
                    value={item.label}
                    onChange={e => updateItem(idx, 'label', e.target.value)}
                    className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white"
                  />
                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={item.amount || ''}
                      onChange={e => updateItem(idx, 'amount', Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl pl-8 pr-3 py-2 text-sm text-white"
                    />
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} type="button" className="text-red-400 shrink-0">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs text-white/40">Total Biaya</span>
              <span className="text-sm font-bold">{formatRupiah(totalBiaya)}</span>
            </div>
          </div>

          {/* Kontribusi lokasi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/40">Kontribusi Lokasi</label>
              <button onClick={addContribution} type="button"
                className="text-xs text-orange-400 flex items-center gap-1">
                <Plus size={12} /> Tambah Lokasi
              </button>
            </div>
            <div className="space-y-3">
              {contributions.map((c, idx) => (
                <div key={idx} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={c.location_id}
                      onChange={e => updateContribution(idx, 'location_id', e.target.value)}
                      className="bg-transparent text-sm font-semibold text-orange-400 outline-none"
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <button onClick={() => removeContribution(idx)} type="button" className="text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/30 block mb-1">
                        Jumlah Dipesan
                        <span className="text-white/20 ml-1">(opsional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={c.pack_ordered}
                        onChange={e => updateContribution(idx, 'pack_ordered', e.target.value)}
                        placeholder="0"
                        className="w-full bg-[#0f0f0f] border border-[#2e2e2e] rounded-lg px-2 py-1.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/30 block mb-1">Bayar</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={c.amount_paid}
                          onChange={e => updateContribution(idx, 'amount_paid', e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#0f0f0f] border border-[#2e2e2e] rounded-lg pl-7 pr-2 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {contributions.length > 0 && (
              <div className="flex justify-between mt-3 px-1 border-t border-[#2e2e2e] pt-3">
                <span className="text-xs text-white/40">Ditanggung Admin</span>
                <span className={`text-sm font-bold ${tanggunganAdmin > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatRupiah(tanggunganAdmin)}
                </span>
              </div>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="text-xs text-white/40 mb-1 block">Catatan (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="..."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePreSubmit}
              disabled={loading || totalBiaya === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: '#f97316' }}
            >
              Lanjut
            </button>
            <button
              onClick={() => setOpen(false)}
              type="button"
              className="px-4 py-2.5 rounded-xl text-sm bg-[#2e2e2e]"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* List purchases */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Riwayat Pembelian</h2>
        {purchases.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-6">Belum ada pembelian</p>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => {
              const total = p.purchase_items.reduce((s, i) => s + i.amount, 0)
              const totalBayar = p.purchase_contributions.reduce((s, c) => s + c.amount_paid, 0)
              const adminTanggung = total - totalBayar
              return (
                <div key={p.id} className="border border-[#2e2e2e] rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">
                      {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-sm font-bold">{formatRupiah(total)}</span>
                  </div>

                  <div className="space-y-1">
                    {p.purchase_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-white/50">{item.label}</span>
                        <span>{formatRupiah(item.amount)}</span>
                      </div>
                    ))}
                  </div>

                  {p.purchase_contributions.length > 0 && (
                    <div className="border-t border-[#2e2e2e] pt-2 space-y-1">
                      {p.purchase_contributions.map((c, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-orange-400">{c.locations?.name}</span>
                          <div className="text-right">
                            <span className="text-green-400">{formatRupiah(c.amount_paid)}</span>
                            {c.pack_ordered > 0 && c.pack_paid > 0 && c.pack_ordered > c.pack_paid && (
                              <span className="text-yellow-400 ml-2">
                                utang {c.pack_ordered - c.pack_paid} pack
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs border-t border-[#2e2e2e] pt-1 mt-1">
                        <span className="text-white/40">Admin tanggung</span>
                        <span className={`font-semibold ${adminTanggung > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {formatRupiah(adminTanggung)}
                        </span>
                      </div>
                    </div>
                  )}

                  {p.note && <p className="text-xs text-white/30 italic">{p.note}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal konfirmasi */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[60] px-4 pb-6">
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-400" />
              <h3 className="font-bold text-base">Konfirmasi Pembelian</h3>
            </div>
            <div className="space-y-2 text-sm bg-[#111] rounded-xl p-4 border border-[#2e2e2e]">
              <div className="space-y-1">
                {validItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-white/50">{item.label}</span>
                    <span>{formatRupiah(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t border-[#2e2e2e] pt-2">
                <span>Total</span>
                <span>{formatRupiah(totalBiaya)}</span>
              </div>
              {contributions.length > 0 && (
                <div className="space-y-1 border-t border-[#2e2e2e] pt-2">
                  {contributions.map((c, i) => {
                    const loc = locations.find(l => l.id === c.location_id)
                    const packOrdered = Number(c.pack_ordered) || 0
                    const packPaid = Number(c.pack_paid) || 0
                    return (
                      <div key={i} className="flex justify-between">
                        <span className="text-orange-400">{loc?.name}</span>
                        <div className="text-right text-xs">
                          <span className="text-green-400">{formatRupiah(Number(c.amount_paid) || 0)}</span>
                          {packOrdered > 0 && packPaid > 0 && packOrdered > packPaid && (
                            <span className="text-yellow-400 ml-1">
                              utang {packOrdered - packPaid} pack
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-between border-t border-[#2e2e2e] pt-1">
                    <span className="text-white/50">Admin tanggung</span>
                    <span className="text-red-400 font-semibold">{formatRupiah(tanggunganAdmin)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: '#f97316' }}
              >
                {loading ? 'Menyimpan...' : '✓ Ya, Catat'}
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
