'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, ClipboardCheck, BarChart2 } from 'lucide-react'

const staffNav = [
  { href: '/transactions', label: 'Transaksi', icon: ShoppingCart },
]

const adminNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: ShoppingCart },
  { href: '/inventory', label: 'Stok', icon: Package },
  { href: '/opname', label: 'Opname', icon: ClipboardCheck },
  { href: '/reports', label: 'Laporan', icon: BarChart2 },
]

export default function BottomNav({ role }: { role: string }) {
  const pathname = usePathname()
  const nav = role === 'admin' ? adminNav : staffNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#161616]/95 backdrop-blur-sm border-t border-[#2e2e2e] pb-safe">
      <div className="flex items-stretch">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-150 ${
                active ? 'text-orange-400' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-orange-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
