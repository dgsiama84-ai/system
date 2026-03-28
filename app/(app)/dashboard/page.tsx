import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingBag, TrendingUp, Clock, User } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(n)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, name')
    .eq('id', user.id)
    .single()

  const name = (profile as any)?.name || profile?.email?.split('@')[0] || 'User'

  if (profile?.role === 'admin') {
    return <AdminDashboard supabase={supabase} adminName={name} />
  }

  return (
    <StaffDashboard
      supabase={supabase}
      userId={user.id}
      email={profile?.email ?? ''}
      name={name}
      role={profile?.role ?? 'staff'}
    />
  )
}

async function AdminDashboard({ supabase, adminName }: { supabase: any; adminName: string }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayTx } = await supabase
    .from('transactions')
    .select('total_price, quantity, created_by, products(name), profiles(name, email)')
    .gte('created_at', today.toISOString())

  const totalSales = todayTx?.reduce((s: number, t: any) => s + (t.total_price ?? 0), 0) ?? 0
  const totalTx = todayTx?.length ?? 0

  const staffMap: Record<string, { name: string; total: number; count: number }> = {}

  for (const tx of todayTx ?? []) {
    const name = tx.profiles?.name || tx.profiles?.email?.split('@')[0] || 'Staff'

    if (!staffMap[tx.created_by]) {
      staffMap[tx.created_by] = { name, total: 0, count: 0 }
    }

    staffMap[tx.created_by].total += tx.total_price ?? 0
    staffMap[tx.created_by].count += 1
  }

  const { data: recentTx } = await supabase
    .from('transactions')
    .select('id, quantity, total_price, created_at, products(name), profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
          Halo, {adminName} 👋
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

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

      {Object.keys(staffMap).length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Penjualan per Staff
          </h2>
          <div className="space-y-0">
            {Object.values(staffMap).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-white/30">{s.count} transaksi</p>
                </div>
                <p className="text-sm font-bold text-orange-400">
                  {formatRupiah(s.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-white/40" />
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Transaksi Terbaru
          </h2>
        </div>
        {!recentTx || recentTx.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-6">Belum ada transaksi</p>
        ) : (
          <div className="space-y-0">
            {recentTx.map((tx: any) => {
              const name = tx.profiles?.name || tx.profiles?.email?.split('@')[0] || 'Staff'

              return (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
                  <div>
                    <p className="text-sm font-semibold">{tx.products?.name ?? '—'}</p>
                    <p className="text-xs text-white/30">
                      {name} · {tx.quantity}x ·{' '}
                      {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{formatRupiah(tx.total_price)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

async function StaffDashboard({ supabase, userId, email, name, role }: {
  supabase: any
  userId: string
  email: string
  name: string
  role: string
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayTx } = await supabase
    .from('transactions')
    .select('id, quantity, total_price, created_at, products(name)')
    .eq('created_by', userId)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('created_at', { ascending: false })

  const todaySales = (todayTx ?? []).reduce((s: number, t: any) => s + (t.total_price ?? 0), 0)
  const todayCount = todayTx?.length ?? 0

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
          Halo, {name} 👋
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
          <User size={20} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{email}</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/5 text-white/40 border border-white/10 uppercase tracking-wide shrink-0">
          {role}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs font-medium">Penjualan Hari Ini</span>
            <TrendingUp size={14} className="text-orange-400" />
          </div>
          <p className="text-xl font-bold text-orange-400">{formatRupiah(todaySales)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs font-medium">Transaksi</span>
            <ShoppingBag size={14} className="text-blue-400" />
          </div>
          <p className="text-xl font-bold text-blue-400">{todayCount}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-white/40" />
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Transaksi Hari Ini</h2>
        </div>
        {!todayTx || todayTx.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/20 text-sm">Belum ada transaksi hari ini</p>
            <p className="text-white/10 text-xs mt-1">Yuk mulai catat penjualan!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {todayTx.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{tx.products?.name ?? '—'}</p>
                  <p className="text-xs text-white/30">
                    {tx.quantity}x · {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <p className="text-sm font-bold text-orange-400">{formatRupiah(tx.total_price)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}