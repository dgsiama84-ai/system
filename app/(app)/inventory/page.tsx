import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, AlertTriangle } from 'lucide-react'
import StockInForm from './StockInForm'

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/transactions')

  const { data: stocks } = await supabase
    .from('stocks')
    .select('qty, ingredients(id, name, unit)')
    .order('ingredients(name)')

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, unit')
    .order('name')

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('qty, type, created_at, ingredients(name)')
    .order('created_at', { ascending: false })
    .limit(15)

  const LOW_STOCK_THRESHOLD = 5

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Inventori</h1>
        <p className="text-white/40 text-sm mt-0.5">Stok bahan baku saat ini</p>
      </div>

      <StockInForm ingredients={ingredients ?? []} />

      {/* Stock cards */}
      <div className="space-y-2">
        {!stocks || stocks.length === 0 ? (
          <div className="card p-8 text-center text-white/30">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p>Belum ada data stok</p>
          </div>
        ) : (
          stocks.map((s) => {
            const ing = s.ingredients as any
            const isLow = s.qty <= LOW_STOCK_THRESHOLD
            return (
              <div key={ing?.id} className={`card p-4 flex items-center justify-between ${isLow ? 'border-yellow-500/30' : ''}`}>
                <div className="flex items-center gap-3">
                  {isLow && <AlertTriangle size={16} className="text-yellow-400 shrink-0" />}
                  <div>
                    <p className="font-semibold text-sm">{ing?.name}</p>
                    <p className="text-xs text-white/30">{ing?.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isLow ? 'text-yellow-400' : 'text-white'}`}>
                    {s.qty}
                  </p>
                  {isLow && <p className="text-[10px] text-yellow-400/70">Stok rendah</p>}
                </div>
              </div>
            )
          })
        )}
      </div>

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
                      {cfg.label} · {new Date(m.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${cfg.color}`}>
                    {cfg.prefix}{m.qty}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}