import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendingUp, ShoppingBag, Users, Clock } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/transactions')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  // Total sales today
  const { data: todayTx } = await supabase
    .from('transactions')
    .select('total_price, quantity, created_by, products(name), profiles(email)')
    .gte('created_at', todayISO)

  const totalSales = todayTx?.reduce((sum, t) => sum + (t.total_price ?? 0), 0) ?? 0
  const totalTx = todayTx?.length ?? 0

  // Sales per staff
  const staffMap: Record<string, { email: string; total: number; count: number }> = {}
  for (const tx of todayTx ?? []) {
    const email = (tx.profiles as any)?.email ?? tx.created_by
    if (!staffMap[tx.created_by]) staffMap[tx.created_by] = { email, total: 0, count: 0 }
    staffMap[tx.created_by].total += tx.total_price ?? 0
    staffMap[tx.created_by].count += 1
  }

  // Recent transactions (last 10)
  const { data: recentTx } = await supabase
    .from('transactions')
    .select('id, quantity, total_price, created_at, products(name), profiles(email)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Dashboard</h1>
        <p className="text-white/40 text-sm mt-0.5">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs font-medium">Penjualan Hari Ini</span>
            <TrendingUp size={14} className="text-orange-400" />
          </div>
          <p className="text-xl font-bold text-orange-400">{formatRupiah(totalSales)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs font-medium">Transaksi</span>
            <ShoppingBag size={14} className="text-blue-400" />
          </div>
          <p className="text-xl font-bold text-blue-400">{totalTx}</p>
        </div>
      </div>

      {/* Sales per staff */}
      {Object.keys(staffMap).length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-white/40" />
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Penjualan per Staff</h2>
          </div>
          <div className="space-y-2">
            {Object.values(staffMap).map((s) => (
              <div key={s.email} className="flex items-center justify-between py-2 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.email.split('@')[0]}</p>
                  <p className="text-xs text-white/30">{s.count} transaksi</p>
                </div>
                <p className="text-sm font-bold text-orange-400">{formatRupiah(s.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-white/40" />
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Transaksi Terbaru</h2>
        </div>
        {!recentTx || recentTx.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-6">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{(tx.products as any)?.name ?? '—'}</p>
                  <p className="text-xs text-white/30">
                    {(tx.profiles as any)?.email?.split('@')[0]} · {tx.quantity}x ·{' '}
                    {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-sm font-bold">{formatRupiah(tx.total_price)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
