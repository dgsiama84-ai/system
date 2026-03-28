'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function TopBar({ email, role }: { email: string; role: string }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0d0d0d]/90 backdrop-blur-sm border-b border-[#2e2e2e] flex items-center justify-between px-5">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">🧊</span>
        <span className="font-bold text-sm tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          Es Camelo
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
          role === 'admin'
            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
            : 'bg-white/5 text-white/40 border border-white/10'
        }`}>
          {role}
        </span>
      </div>
      <button onClick={handleSignOut} className="btn-ghost px-2.5 py-2">
        <LogOut size={16} />
      </button>
    </header>
  )
}
