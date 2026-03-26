import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'staff'

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0d]">
      <TopBar email={profile?.email ?? ''} role={role} />
      <main className="flex-1 overflow-y-auto pb-24 pt-16">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}
