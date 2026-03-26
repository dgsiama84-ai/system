import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/transactions')

  // Last 7 days
  const days: { date: string; label: string; sales: number; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const nextD = new Date(d)
    nextD.setDate(nextD.getDate() + 1)

    const { data: txs } = await supabase
      .from('transactions')
      .select('total_price')
      .gte('created_at', d.toISOString())
      .lt('created_at', nextD.toISOString())

    days.push({
      date: d.toISOString(),
      label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
      sales: txs?.reduce((s, t) => s + (t.total_price ?? 0), 0) ?? 0,
      count: txs?.length ?? 0,
    })
  }

  const totalWeek = days.reduce((s, d) => s + d.sales, 0)
  const totalTxWeek = days.reduce((s, d) => s + d.count, 0)
  const maxSales = Math.max(...days.map(d => d.sales), 1)

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Laporan</h1>
        <p className="text-white/40 text-sm mt-0.5">7 hari terakhir</p>
      </div>

      {/* Weekly summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="text-white/40 text-xs font-medium mb-1">Total Penjualan</p>
          <p className="text-lg font-bold text-orange-400">{formatRupiah(totalWeek)}</p>
          <p className="text-xs text-white/30 mt-0.5">7 hari terakhir</p>
        </div>
        <div className="stat-card">
          <p className="text-white/40 text-xs font-medium mb-1">Total Transaksi</p>
          <p className="text-lg font-bold text-blue-400">{totalTxWeek}</p>
          <p className="text-xs text-white/30 mt-0.5">7 hari terakhir</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Penjualan Harian</h2>
        <div className="flex items-end gap-2 h-32">
          {days.map((d, i) => {
            const heightPct = (d.sales / maxSales) * 100
            const isToday = i === 6
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-orange-500' : 'bg-white/10'}`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
                <span className="text-[9px] text-white/30 text-center leading-tight">{d.label.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily table */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Ringkasan Harian</h2>
        <div className="space-y-0">
          <div className="grid grid-cols-3 py-2 border-b border-[#2e2e2e] text-[10px] font-semibold text-white/30 uppercase tracking-wider">
            <span>Tanggal</span>
            <span className="text-center">Transaksi</span>
            <span className="text-right">Penjualan</span>
          </div>
          {days.map((d, i) => (
            <div key={d.date} className={`grid grid-cols-3 py-3 border-b border-[#2e2e2e] last:border-0 ${i === 6 ? 'text-white' : 'text-white/60'}`}>
              <span className="text-sm flex items-center gap-1.5">
                {i === 6 && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />}
                {d.label}
              </span>
              <span className="text-sm text-center">{d.count}</span>
              <span className={`text-sm text-right font-semibold ${d.sales > 0 ? 'text-orange-400' : 'text-white/20'}`}>
                {d.sales > 0 ? formatRupiah(d.sales) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
