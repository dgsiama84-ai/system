'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const hasEnv =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!hasEnv) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email atau password salah.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] px-5">
      {/* Background grain */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
            <span className="text-3xl">🧊</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Es Camelo
          </h1>
          <p className="text-white/40 text-sm mt-1">Internal Management System</p>
        </div>

        {/* Setup warning if env vars missing */}
        {!hasEnv && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-4 space-y-3">
            <p className="text-yellow-400 text-sm font-semibold">⚠ Konfigurasi diperlukan</p>
            <p className="text-yellow-400/70 text-xs leading-relaxed">
              File <code className="bg-yellow-500/10 px-1 py-0.5 rounded">.env.local</code> belum dikonfigurasi.
            </p>
            <div className="bg-black/30 rounded-xl p-3 text-xs font-mono text-white/60 space-y-1">
              <p className="text-white/30"># .env.local</p>
              <p>NEXT_PUBLIC_SUPABASE_URL=<span className="text-orange-400">https://xxxx.supabase.co</span></p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=<span className="text-orange-400">eyJhbG...</span></p>
            </div>
            <p className="text-yellow-400/60 text-xs">
              Ambil nilai ini dari:{' '}
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-yellow-400"
              >
                Supabase Dashboard → Settings → API
              </a>
            </p>
            <p className="text-yellow-400/50 text-xs">Setelah itu restart: <code className="bg-yellow-500/10 px-1 py-0.5 rounded">npm run dev</code></p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@escamelo.com"
              className="input"
              required
              autoComplete="email"
              disabled={!hasEnv}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              autoComplete="current-password"
              disabled={!hasEnv}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !hasEnv}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Masuk...
              </>
            ) : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
