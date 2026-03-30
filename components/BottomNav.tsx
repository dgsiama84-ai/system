'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, ClipboardCheck, BarChart2, Receipt } from 'lucide-react'

const staffNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: ShoppingCart },
]

const adminNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Pengeluaran', icon: Receipt },
  { href: '/inventory', label: 'Stok', icon: Package },
  { href: '/opname', label: 'Opname', icon: ClipboardCheck },
  { href: '/reports', label: 'Laporan', icon: BarChart2 },
]

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const nav = role === 'admin' ? adminNav : staffNav

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#161616]/95 backdrop-blur-sm border-t border-[#2e2e2e]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              // ✅ Fix: tambah 'relative' agar span indicator absolute bisa terposisi dengan benar
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-150 ${
                active ? 'text-orange-400' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {/* ✅ Indicator bar di atas (bukan bawah yang tertutup safe area) */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
