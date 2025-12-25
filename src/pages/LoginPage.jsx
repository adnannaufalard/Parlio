import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Logo1 from '../assets/logo/1.png'
import Logo2 from '../assets/logo/2.png'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Clear inputs on mount to avoid autofill from browser cache
  useEffect(() => {
    setEmail('')
    setPassword('')
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    
    // Fetch user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
      
    if (profileError) {
      setError('Failed to fetch user role')
      setLoading(false)
      return
    }
    
    // Redirect based on role
    if (profile.role === 'superadmin') {
      navigate('/admin/dashboard')
    } else if (profile.role === 'guru') {
      navigate('/teacher/dashboard')
    } else if (profile.role === 'siswa') {
      navigate('/student/dashboard')
    } else {
      setError('Unknown role')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center group"
            >
              <img src={Logo1} alt="Parlio" className="h-12 object-contain group-hover:scale-105 transition-transform" />
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Bienvenue! 👋
            </h1>
            <p className="text-slate-600">
              Masuk untuk melanjutkan petualangan belajar bahasa Prancis
            </p>
          </div>
        
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            {/* hidden fields to prevent browser autofill */}
            <input type="text" name="fakeuser" autoComplete="off" className="hidden" />
            <input type="password" name="fakepass" autoComplete="new-password" className="hidden" />
          
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E258F]/20 focus:border-[#1E258F] transition placeholder:text-slate-400"
                placeholder="nama@email.com"
              />
            </div>
          
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-white text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E258F]/20 focus:border-[#1E258F] transition placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-medium text-center">{error}</p>
              </div>
            )}
          
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#1E258F] text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-[#161c6e] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memuat...</span>
                </span>
              ) : (
                '🚀 Masuk'
              )}
            </button>
          </form>
        
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-[#1E258F] text-sm font-medium inline-flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Kembali ke Beranda</span>
            </button>
          </div>

          {/* Info */}
          <div className="mt-10 pt-8 border-t border-slate-200">
            <div className="bg-[#1E258F]/5 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-1">Belum punya akun?</div>
                  <div className="text-xs text-slate-600">Hubungi guru bahasa Prancis kamu untuk mendapatkan akun Parlio.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E258F] via-[#252d9e] to-[#1a2080] relative overflow-hidden items-center justify-center p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-8">
            <img src={Logo2} alt="Parlio" className="h-20 mx-auto mb-6 object-contain" />
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Belajar Bahasa Prancis
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Sistem pembelajaran bahasa Prancis berbasis web dengan gamifikasi yang seru dan interaktif.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-3 mt-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center text-xl shadow-lg">⭐</div>
                <div className="text-left">
                  <div className="text-white font-semibold">XP & Level System</div>
                  <div className="text-blue-200 text-sm">Naik level setiap menyelesaikan quest</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-xl shadow-lg">💰</div>
                <div className="text-left">
                  <div className="text-white font-semibold">Coins & Rewards</div>
                  <div className="text-blue-200 text-sm">Kumpulkan Écus untuk hadiah</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center text-xl shadow-lg">📊</div>
                <div className="text-left">
                  <div className="text-white font-semibold">Leaderboard</div>
                  <div className="text-blue-200 text-sm">Bersaing dengan teman sekelas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Badge */}
          <div className="mt-10 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm text-white/80">
            <span>�</span>
            <span>SMAN 1 Padamara</span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-300/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}

export default LoginPage
