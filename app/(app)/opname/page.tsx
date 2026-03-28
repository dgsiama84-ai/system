import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OpnameForm from '@/components/OpnameForm'

export default async function OpnamePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/transactions')

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, unit')
    .order('name')

  const { data: stocks } = await supabase
    .from('stocks')
    .select('ingredient_id, qty')

  // Build stockMap
  const stockMap: Record<string, number> = {}
  for (const s of stocks ?? []) {
    stockMap[s.ingredient_id] = s.qty
  }

  // Recent opname history
  const { data: history } = await supabase
    .from('stock_opname')
    .select('ingredient_id, system_qty, real_qty, difference, created_at, ingredients(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Stock Opname</h1>
        <p className="text-white/40 text-sm mt-0.5">Audit dan koreksi stok fisik</p>
      </div>

      <OpnameForm ingredients={ingredients ?? []} stockMap={stockMap} />

      {/* History */}
      {history && history.length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Riwayat Opname</h2>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="py-2.5 border-b border-[#2e2e2e] last:border-0">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold">{(h.ingredients as any)?.name}</p>
                  <span className={`text-sm font-bold ${h.difference > 0 ? 'text-green-400' : h.difference < 0 ? 'text-red-400' : 'text-white/40'}`}>
                    {h.difference > 0 ? '+' : ''}{h.difference}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span>Sistem: {h.system_qty}</span>
                  <span>→</span>
                  <span>Fisik: {h.real_qty}</span>
                  <span>·</span>
                  <span>{new Date(h.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
