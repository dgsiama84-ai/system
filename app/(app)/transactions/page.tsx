import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionForm from '@/components/TransactionForm'
import { Product } from '@/types'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .order('name')

  const { data: recentTx } = await supabase
    .from('transactions')
    .select('id, quantity, total_price, created_at, products(name)')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Input Transaksi</h1>
        <p className="text-white/40 text-sm mt-0.5">Catat penjualan baru</p>
      </div>

      <TransactionForm products={products as Product[] ?? []} />

      {/* My recent transactions */}
      {recentTx && recentTx.length > 0 && (
        <div className="card p-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Transaksi Terakhir Saya</h2>
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <p className="text-sm font-semibold">{(tx.products as any)?.name ?? '—'}</p>
                  <p className="text-xs text-white/30">
                    {tx.quantity}x · {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-sm font-bold text-orange-400">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.total_price)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
