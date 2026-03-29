import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { cache } from 'react'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

// Cache per-request — tidak fetch ulang kalau sudah ada di request yang sama
const getProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  return { user, profile }
})

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') || ''

  if (pathname.startsWith('/login')) {
    return <>{children}</>
  }

  const data = await getProfile()
  if (!data) redirect('/login')

  const role = data.profile?.role ?? 'staff'

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0d]">
      <TopBar email={data.profile?.email ?? ''} role={role} />
      <main className="flex-1 overflow-y-auto pb-24 pt-16">
        {children}
      </main>
      <BottomNav role={role} />
    </div>
  )
}