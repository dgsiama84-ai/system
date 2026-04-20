'use client'

import { useState } from 'react'
import { Plus, Wallet, ShoppingBag, Trash2, AlertCircle } from 'lucide-react'
import { addExpense, addPurchase } from '@/lib/actions'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta'
  })
}

const CATEGORIES = [
  { value: 'camelo',    label: 'Camelo (Produk)' },
  { value: 'air',       label: 'Air Galon' },
  { value: 'lem',       label: 'Lem' },
  { value: 'kemasan',   label: 'Kemasan' },
  { value: 'transport', label: 'Transportasi' },
  { value: 'alat',      label: 'Peralatan' },
  { value: 'lainnya',   label: 'Lainnya' },
]

const CAT_COLOR: Record<string, string> = {
  camelo:    'text-blue-400 bg-blue-400/10',
  air:       'text-cyan-400 bg-cyan-400/10',
  lem:       'text-purple-400 bg-purple-400/10',
  kemasan:   'text-green-400 bg-green-400/10',
  transport: 'text-yellow-400 bg-yellow-400/10',
  alat:      'text-pink-400 bg-pink-400/10',
  lainnya:   'text-white/40 bg-white/5',
}

interface Expense {
  id: string; name: string; amount: number
  category: string; note?: string; created_at: string
}

interface PurchaseItem { id: string; label: string; amount: number }
interface PurchaseContrib { id: string; amount_paid: number; locations: { name: string } }
interface Purchase {
  id: string; date: string; note?: string; created_at: string
  purchase_items: PurchaseItem[]
  purchase_contributions: PurchaseContrib[]
}
interface Location { id: string; name: string }

type Tab = 'expenses' | 'purchases'

export default function AdminTransactionsPanel({
  locations, expenses, purchases,
}: {
  locations: Location[]
  expenses: Expense[]
  purchases: Purchase[]
}) {
  const [tab, setTab] = useState<Tab>('expenses')

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Transaksi Admin</h1>
        <p className="text-white/40 text-sm mt-0.5">Pengeluaran & Pembelian Stok</p>
      </div>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-1">
        {([['expenses', 'Pengeluaran'], ['purchases', 'Pembelian Stok']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-orange-500 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'expenses'
        ? <ExpensesTab expenses={expenses} />
        : <PurchasesTab purchases={purchases} locations={locations} />
      }
    </div>
  )
}

// ── EXPENSES TAB ────────────────────────────────────────────────
function ExpensesTab({ expenses }: { expenses: Expense[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pending, setPending] = useState<FormData | null>(null)
  const [confirmData, setConfirmData] = useState<{ name: string; amount: number; category: string; note: string } | null>(null)

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  function handlePreSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setPending(fd)
    setConfirmData({
      name: fd.get('name') as string,
      amount: Number(fd.get('amount')),
      category: fd.get('category') as string,
      note: fd.get('note') as string,
    })
    setShowConfirm(true)
  }

  async function handleConfirm() {
    if (!pending) return
    setLoading(true)
    setError('')
    try {
      await addExpense(pending)
      setSuccess(true); setOpen(false); setShowConfirm(false); setPending(null); setConfirmData(null)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) { setError(err.message); setShowConfirm(false) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="stat-card flex-1 mr-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-xs">Total Pengeluaran</span>
            <Wallet size={13} className="text-red-400" />
          </div>
          <p className="text-lg font-bold text-red-400">{formatRupiah(total)}</p>
        </div>
        <button onClick={() => { setOpen(!open); setError('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          style={{ background: '#f97316' }}>
          <Plus size={15} /> Tambah
        </button>
      </div>

      {success && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">✓ Pengeluaran berhasil dicatat</div>}
      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">⚠️ {error}</div>}

      {open && !showConfirm && (
        <form onSubmit={handlePreSubmit} className="card p-4 space-y-3">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Pengeluaran Baru</p>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Keterangan</label>
            <input name="name" type="text" required autoComplete="off" placeholder="Beli..."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Kategori</label>
            <select name="category" required className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Jumlah (Rp)</label>
            <input name="amount" type="number" min="1" required placeholder="0"
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Catatan (opsional)</label>
            <input name="note" type="text" placeholder="Info tambahan..."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#f97316' }}>Lanjut</button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-xl text-sm bg-[#2e2e2e]">Batal</button>
          </div>
        </form>
      )}

      {/* Riwayat */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Riwayat Pengeluaran</h2>
        {expenses.length === 0
          ? <p className="text-white/20 text-sm text-center py-6">Belum ada pengeluaran</p>
          : <div className="space-y-0">
              {expenses.map(e => (
                <div key={e.id} className="flex items-start justify-between py-3 border-b border-[#2e2e2e] last:border-0">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-semibold">{e.name}</p>
                    {e.note && <p className="text-xs text-white/30 mt-0.5">{e.note}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CAT_COLOR[e.category] ?? CAT_COLOR.lainnya}`}>
                        {CATEGORIES.find(c => c.value === e.category)?.label ?? e.category}
                      </span>
                      <span className="text-xs text-white/30">{formatDate(e.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-red-400 shrink-0">{formatRupiah(e.amount)}</p>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Confirm modal */}
      {showConfirm && confirmData && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[60] px-4 pb-6">
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-400" />
              <h3 className="font-bold text-base">Konfirmasi Pengeluaran</h3>
            </div>
            <div className="bg-[#111] rounded-xl p-4 border border-[#2e2e2e] space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-white/50">Keterangan</span><span className="font-semibold text-right max-w-[60%]">{confirmData.name}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Kategori</span><span className="font-semibold">{CATEGORIES.find(c => c.value === confirmData.category)?.label}</span></div>
              {confirmData.note && <div className="flex justify-between"><span className="text-white/50">Catatan</span><span className="text-white/70 text-right max-w-[60%]">{confirmData.note}</span></div>}
              <div className="flex justify-between border-t border-[#2e2e2e] pt-2.5">
                <span className="text-white/50">Total</span>
                <span className="font-bold text-red-400 text-base">{formatRupiah(confirmData.amount)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirm} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: '#f97316' }}>
                {loading ? 'Menyimpan...' : '✓ Ya, Catat'}
              </button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#2e2e2e]">Koreksi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── PURCHASES TAB ───────────────────────────────────────────────
function PurchasesTab({ purchases, locations }: { purchases: Purchase[]; locations: Location[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [items, setItems] = useState([{ label: '', amount: 0 }])
  const [contribs, setContribs] = useState<{ location_id: string; amount_paid: number | '' }[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  const totalBiaya = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)
  const totalBayar = contribs.reduce((s, c) => s + (Number(c.amount_paid) || 0), 0)
  const adminTanggung = totalBiaya - totalBayar
  const validItems = items.filter(i => i.label.trim() && Number(i.amount) > 0)

  const totalAllPurchases = purchases.reduce((s, p) =>
    s + p.purchase_items.reduce((ss, i) => ss + i.amount, 0), 0)

  function addItem() { setItems([...items, { label: '', amount: 0 }]) }
  function removeItem(idx: number) { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)) }
  function updateItem(idx: number, field: 'label' | 'amount', val: string | number) {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  function addContrib() {
    if (!locations.length) return
    setContribs([...contribs, { location_id: locations[0].id, amount_paid: '' }])
  }
  function removeContrib(idx: number) { setContribs(contribs.filter((_, i) => i !== idx)) }
  function updateContrib(idx: number, field: 'location_id' | 'amount_paid', val: string | number) {
    setContribs(contribs.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  function handlePreSubmit() {
    if (validItems.length === 0) { setError('Minimal 1 item biaya harus diisi'); return }
    setError(''); setShowConfirm(true)
  }

  async function handleConfirm() {
    setShowConfirm(false); setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.set('date', date)
      fd.set('note', note)
      fd.set('items', JSON.stringify(validItems))
      fd.set('contributions', JSON.stringify(
        contribs.map(c => ({ location_id: c.location_id, amount_paid: Number(c.amount_paid) || 0 }))
      ))
      await addPurchase(fd)
      setSuccess(true); setOpen(false)
      setItems([{ label: '', amount: 0 }]); setContribs([]); setNote('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="stat-card flex-1 mr-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-xs">Total Pembelian</span>
            <ShoppingBag size={13} className="text-blue-400" />
          </div>
          <p className="text-lg font-bold text-blue-400">{formatRupiah(totalAllPurchases)}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{purchases.length} pembelian</p>
        </div>
        <button onClick={() => { setOpen(!open); setError('') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          style={{ background: '#f97316' }}>
          <Plus size={15} /> Tambah
        </button>
      </div>

      {success && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">✓ Pembelian berhasil dicatat</div>}
      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">⚠️ {error}</div>}

      {/* Form */}
      {open && !showConfirm && (
        <div className="card p-4 space-y-4">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-wider">Pembelian Baru</p>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Tanggal</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>

          {/* Rincian biaya */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-white/40">Rincian Biaya</label>
              <button onClick={addItem} type="button" className="text-xs text-orange-400 flex items-center gap-1">
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" placeholder="Keterangan..." value={item.label}
                    onChange={e => updateItem(idx, 'label', e.target.value)}
                    className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2 text-sm text-white" />
                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">Rp</span>
                    <input type="number" min="0" value={item.amount || ''}
                      onChange={e => updateItem(idx, 'amount', Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl pl-8 pr-3 py-2 text-sm text-white" />
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
              <button onClick={addContrib} type="button" className="text-xs text-orange-400 flex items-center gap-1">
                <Plus size={12} /> Tambah Lokasi
              </button>
            </div>
            <div className="space-y-2">
              {contribs.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5">
                  <select value={c.location_id} onChange={e => updateContrib(idx, 'location_id', e.target.value)}
                    className="bg-transparent text-sm font-semibold text-orange-400 outline-none flex-1">
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <div className="relative w-36 shrink-0">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-xs">Rp</span>
                    <input type="number" min="0" value={c.amount_paid}
                      onChange={e => updateContrib(idx, 'amount_paid', e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#0f0f0f] border border-[#2e2e2e] rounded-lg pl-7 pr-2 py-1.5 text-sm text-white" />
                  </div>
                  <button onClick={() => removeContrib(idx)} type="button" className="text-red-400 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {contribs.length > 0 && (
              <div className="flex justify-between mt-2 px-1 border-t border-[#2e2e2e] pt-2">
                <span className="text-xs text-white/40">Ditanggung Admin</span>
                <span className={`text-sm font-bold ${adminTanggung > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatRupiah(adminTanggung)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-white/40 mb-1 block">Catatan (opsional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="..."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl px-3 py-2.5 text-sm text-white" />
          </div>

          <div className="flex gap-2">
            <button onClick={handlePreSubmit} disabled={totalBiaya === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: '#f97316' }}>Lanjut</button>
            <button onClick={() => setOpen(false)} type="button"
              className="px-4 py-2.5 rounded-xl text-sm bg-[#2e2e2e]">Batal</button>
          </div>
        </div>
      )}

      {/* Riwayat pembelian */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Riwayat Pembelian</h2>
        {purchases.length === 0
          ? <p className="text-white/20 text-sm text-center py-6">Belum ada pembelian</p>
          : <div className="space-y-3">
              {purchases.map(p => {
                const total = p.purchase_items.reduce((s, i) => s + i.amount, 0)
                const totalBayar = p.purchase_contributions.reduce((s, c) => s + c.amount_paid, 0)
                const admin = total - totalBayar
                return (
                  <div key={p.id} className="border border-[#2e2e2e] rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/40">{formatDate(p.date)}</span>
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
                            <span className="text-green-400">{formatRupiah(c.amount_paid)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs border-t border-[#2e2e2e] pt-1 mt-1">
                          <span className="text-white/40">Saya Tanggung</span>
                          <span className={`font-semibold ${admin > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {formatRupiah(admin)}
                          </span>
                        </div>
                      </div>
                    )}
                    {p.note && <p className="text-xs text-white/30 italic">{p.note}</p>}
                  </div>
                )
              })}
            </div>
        }
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[60] px-4 pb-6">
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-400" />
              <h3 className="font-bold text-base">Konfirmasi Pembelian</h3>
            </div>
            <div className="bg-[#111] rounded-xl p-4 border border-[#2e2e2e] space-y-2 text-sm">
              {validItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-white/50">{item.label}</span>
                  <span>{formatRupiah(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-[#2e2e2e] pt-2">
                <span>Total</span><span>{formatRupiah(totalBiaya)}</span>
              </div>
              {contribs.filter(c => Number(c.amount_paid) > 0).length > 0 && (
                <div className="border-t border-[#2e2e2e] pt-2 space-y-1">
                  {contribs.filter(c => Number(c.amount_paid) > 0).map((c, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-orange-400">{locations.find(l => l.id === c.location_id)?.name}</span>
                      <span className="text-green-400">{formatRupiah(Number(c.amount_paid))}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-[#2e2e2e] pt-1">
                    <span className="text-white/50">Saya Tanggung</span>
                    <span className="text-red-400 font-semibold">{formatRupiah(adminTanggung)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirm} disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: '#f97316' }}>
                {loading ? 'Menyimpan...' : '✓ Ya, Catat'}
              </button>
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#2e2e2e]">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
