import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingBag, TrendingUp, Clock, User, Users, Wallet } from 'lucide-react'

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function getTodayRange() {
  const now = new Date()
  const offset = 8 * 60 * 60 * 1000
  const localNow = new Date(now.getTime() + offset)
  const start = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 0, 0, 0, 0) - offset).toISOString()
  const end = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 23, 59, 59, 999) - offset).toISOString()
  return { start, end }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email, name, code, location_id')
    .eq('id', user.id)
    .single()

  const name = (profile as any)?.name || profile?.email?.split('@')[0] || 'User'
  const code = (profile as any)?.code || ''

  if (profile?.role === 'admin') {
    return <AdminDashboard supabase={supabase} adminName={name} adminCode={code} />
  }

  return (
    <StaffDashboard
      supabase={supabase}
      userId={user.id}
      locationId={profile?.location_id}
      email={profile?.email ?? ''}
      name={name}
      role={profile?.role ?? 'staff'}
      code={code}
    />
  )
}

async function AdminDashboard({ supabase, adminName, adminCode }: { supabase: any; adminName: string; adminCode: string }) {
  const { start, end } = getTodayRange()

  // Admin lihat semua lokasi
  const [{ data: todayTx }, { data: todayPurchases }, { data: allProfiles }, { data: recentPurchases }, { data: recentStock }] = await Promise.all([
  supabase.from('transactions').select('total_price, quantity, created_by, products(name), locations(name)').gte('created_at', start).lte('created_at', end),
  supabase.from('purchases').select('purchase_items(amount)').gte('created_at', start).lte('created_at', end),
  supabase.from('profiles').select('id, name, email'),
  supabase.from('purchases').select('id, date, note, created_at, purchase_items(label, amount), purchase_contributions(amount_paid, locations(name))').order('created_at', { ascending: false }).limit(5),
  supabase.from('stock_movements').select('id, qty, created_at, ingredients(name), locations(name)').eq('type', 'in').order('created_at', { ascending: false }).limit(5),
])

  const profileMap: Record<string, { name: string; email: string }> = {}
  for (const p of allProfiles ?? []) profileMap[p.id] = { name: p.name, email: p.email }

  const totalSales = todayTx?.reduce((s: number, t: any) => s + (t.total_price ?? 0), 0) ?? 0
  const totalExpensesAmt = todayPurchases?.reduce((s: number, p: any) =>
  s + (p.purchase_items?.reduce((ss: number, i: any) => ss + (i.amount ?? 0), 0) ?? 0), 0) ?? 0
  const totalTx = todayTx?.length ?? 0

  const staffMap: Record<string, { name: string; total: number; count: number }> = {}
  for (const tx of todayTx ?? []) {
    const staffName = profileMap[tx.created_by]?.name || profileMap[tx.created_by]?.email?.split('@')[0] || 'Staff'
    if (!staffMap[tx.created_by]) staffMap[tx.created_by] = { name: staffName, total: 0, count: 0 }
    staffMap[tx.created_by].total += tx.total_price ?? 0
    staffMap[tx.created_by].count += 1
  }
  const staffList = Object.values(staffMap).sort((a, b) => b.total - a.total)

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
          Halo, {adminName} {adminCode && `(${adminCode})`} 👋
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Singapore' })}
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs font-medium">Penjualan Hari Ini</span>
              <TrendingUp size={14} className="text-orange-400" />
            </div>
            <p className="text-xl font-bold text-orange-400">{formatRupiah(totalSales)}</p>
            <p className="text-[10px] text-white/30 mt-1">Semua lokasi</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-xs font-medium">Transaksi</span>
              <ShoppingBag size={14} className="text-blue-400" />
            </div>
            <p className="text-xl font-bold text-blue-400">{totalTx}</p>
            <p className="text-[10px] text-white/30 mt-1">Semua lokasi</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/40 text-xs font-medium">Pengeluaran Hari Ini</span>
            <Wallet size={14} className="text-red-400" />
          </div>
          <p className="text-xl font-bold text-red-400">{formatRupiah(totalExpensesAmt)}</p>
          <p className="text-[10px] text-white/30 mt-1">Semua lokasi</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users size={14} className="text-white/40" />
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Penjualan per Staff Hari Ini</h2>
        </div>
        {staffList.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-4">Belum ada transaksi hari ini</p>
        ) : (
          <div className="space-y-0">
            {staffList.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-white/30">{s.count} transaksi</p>
                </div>
                <p className="text-sm font-bold text-orange-400">{formatRupiah(s.total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-white/40" />
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Aktivitas Terbaru</h2>
        </div>
        {!recentPurchases || recentPurchases.length === 0 ? (
  <p className="text-white/30 text-sm text-center py-6">Belum ada pembelian</p>
) : (
  <div className="space-y-0">
    {recentPurchases.map((p: any) => {
      const total = p.purchase_items?.reduce((s: number, i: any) => s + (i.amount ?? 0), 0) ?? 0
      const totalBayar = p.purchase_contributions?.reduce((s: number, c: any) => s + (c.amount_paid ?? 0), 0) ?? 0
      const adminTanggung = total - totalBayar
      return (
        <div key={p.id} className="py-2.5 border-b border-[#2e2e2e] last:border-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {p.purchase_items?.[0]?.label ?? 'Pembelian Stok'}
              {p.purchase_items?.length > 1 && ` +${p.purchase_items.length - 1} item`}
            </p>
            <p className="text-sm font-bold text-blue-400">{formatRupiah(total)}</p>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-white/30">
              {new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })}
            </p>
            {adminTanggung > 0 && (
              <p className="text-xs text-red-400">admin tanggung {formatRupiah(adminTanggung)}</p>
            )}
          </div>
        </div>
      )
    })}
  </div>
)}
        {recentStock && recentStock.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#2e2e2e] space-y-0">
            {recentStock.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-semibold">Stok Masuk: {item.ingredients?.name ?? 'Bahan'}</p>
                  <p className="text-xs text-white/30">
                    {item.locations?.name && <span className="text-orange-400/60">{item.locations.name} · </span>}
                    {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })}
                  </p>
                </div>
                <p className="text-sm font-bold text-green-400">+{item.qty}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

async function StaffDashboard({ supabase, userId, locationId, email, name, role, code }: {
  supabase: any; userId: string; locationId: string; email: string; name: string; role: string; code: string
}) {
  const { start, end } = getTodayRange()

  const { data: todayTx } = await supabase
    .from('transactions')
    .select('id, quantity, total_price, created_at, products(name)')
    .eq('created_by', userId)
    .eq('location_id', locationId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  const todaySales = (todayTx ?? []).reduce((s: number, t: any) => s + (t.total_price ?? 0), 0)
  const todayCount = todayTx?.length ?? 0

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
          Halo, {name} {code && `(${code})`} 👋
        </h1>
        <p className="text-white/40 text-sm mt-0.5">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Singapore' })}
        </p>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
          <User size={20} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{name}</p>
          <p className="text-xs text-white/40 truncate">{email}</p>
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
                  <p className="text-xs text-white/30">{tx.quantity}x · {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Singapore' })}</p>
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