import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, AlertTriangle } from 'lucide-react'
import StockInForm from './StockInForm'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, location_id').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/transactions')

  const { data: locations } = await supabase.from('locations').select('id, name')

  const { data: ingredients } = await supabase
    .from('ingredients').select('id, name, unit').order('name')

  // Admin lihat stok semua lokasi
  const { data: stocks } = await supabase
    .from('stocks')
    .select('qty, location_id, ingredients(id, name, unit)')
    .order('ingredients(name)')

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('qty, type, created_at, ingredients(name), locations(name)')
    .order('created_at', { ascending: false })
    .limit(15)

  const LOW_STOCK_THRESHOLD = 5
  const locationMap: Record<string, string> = {}
  for (const l of locations ?? []) locationMap[l.id] = l.name

  // Group stok per lokasi
  const stockByLocation: Record<string, typeof stocks> = {}
  for (const l of locations ?? []) stockByLocation[l.id] = []
  for (const s of stocks ?? []) {
    if (s.location_id && stockByLocation[s.location_id]) {
      stockByLocation[s.location_id]!.push(s)
    }
  }

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Inventori</h1>
        <p className="text-white/40 text-sm mt-0.5">Stok bahan baku per lokasi</p>
      </div>

      <StockInForm ingredients={ingredients ?? []} locations={locations ?? []} />

      {/* Stok per lokasi */}
      {(locations ?? []).map((loc) => (
        <div key={loc.id}>
          <h2 className="text-xs font-semibold text-orange-400/70 uppercase tracking-wider mb-2">{loc.name}</h2>
          <div className="space-y-2">
            {!stockByLocation[loc.id] || stockByLocation[loc.id]!.length === 0 ? (
              <div className="card p-4 text-center text-white/20 text-sm">
                <Package size={20} className="mx-auto mb-1 opacity-20" />
                Belum ada stok
              </div>
            ) : (
              stockByLocation[loc.id]!.map((s) => {
                const ing = s.ingredients as any
                const isLow = s.qty <= LOW_STOCK_THRESHOLD
                return (
                  <div key={`${ing?.id}-${loc.id}`} className={`card p-4 flex items-center justify-between ${isLow ? 'border-yellow-500/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      {isLow && <AlertTriangle size={16} className="text-yellow-400 shrink-0" />}
                      <div>
                        <p className="font-semibold text-sm">{ing?.name}</p>
                        <p className="text-xs text-white/30">{ing?.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isLow ? 'text-yellow-400' : 'text-white'}`}>{s.qty}</p>
                      {isLow && <p className="text-[10px] text-yellow-400/70">Stok rendah</p>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}

      {/* Recent movements */}
      {movements && movements.length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Mutasi Stok Terbaru</h2>
          <div className="space-y-1.5">
            {movements.map((m, i) => {
              const typeConfig = {
                out: { color: 'text-red-400', label: 'Keluar', prefix: '-' },
                in: { color: 'text-green-400', label: 'Masuk', prefix: '+' },
                adjustment: { color: 'text-blue-400', label: 'Opname', prefix: '±' },
              }
              const cfg = typeConfig[m.type as keyof typeof typeConfig] ?? typeConfig.out
              return (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#2e2e2e] last:border-0">
                  <div>
                    <p className="text-sm">{(m.ingredients as any)?.name}</p>
                    <p className="text-xs text-white/30">
                      {(m as any).locations?.name && <span className="text-orange-400/60">{(m as any).locations.name} · </span>}
                      {cfg.label} · {new Date(m.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${cfg.color}`}>{cfg.prefix}{m.qty}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}