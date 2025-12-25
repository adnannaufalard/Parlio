import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

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
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 group"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform">
                  <span className="text-white font-black text-2xl transform -rotate-3">P</span>
                </div>
              </div>
              <div>
                <span className="text-gray-900 font-black text-3xl tracking-tight">Parlio</span>
              </div>
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              Selamat Datang! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              Masuk ke akun Parlio untuk melanjutkan petualangan belajar bahasa Prancis
            </p>
          </div>
        
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
            {/* hidden fields to prevent browser autofill */}
            <input type="text" name="fakeuser" autoComplete="off" className="hidden" />
            <input type="password" name="fakepass" autoComplete="new-password" className="hidden" />
          
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-4 bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition placeholder:text-gray-400 font-medium"
                placeholder="nama@email.com"
              />
            </div>
          
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-4 bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition placeholder:text-gray-400 font-medium"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-semibold text-center">{error}</p>
              </div>
            )}
          
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                'Masuk ke Akun'
              )}
            </button>
          </form>
        
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 text-sm font-semibold inline-flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Kembali ke Beranda</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-10 pt-8 border-t-2 border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-blue-600">1000+</div>
                <div className="text-xs text-gray-600 font-semibold">Siswa</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-500">100+</div>
                <div className="text-xs text-gray-600 font-semibold">Quest</div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">4.9★</div>
                <div className="text-xs text-gray-600 font-semibold">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden items-center justify-center p-12">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-8">
            <div className="text-6xl mb-6 animate-bounce-slow">🇫🇷</div>
            <h2 className="text-5xl font-black text-white mb-6 leading-tight">
              Kuasai Bahasa Prancis!
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Belajar bahasa Prancis dengan sistem gamifikasi yang seru dan interaktif. Setiap pelajaran adalah petualangan baru!
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🎮</div>
                <div className="text-left">
                  <div className="text-white font-bold text-lg">Gamifikasi Penuh</div>
                  <div className="text-blue-100 text-sm">XP, Level, Coins & Rewards</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20">
              <div className="flex items-center gap-4">
                <div className="text-3xl">📊</div>
                <div className="text-left">
                  <div className="text-white font-bold text-lg">Progress Tracking</div>
                  <div className="text-blue-100 text-sm">Dashboard & Leaderboard Real-time</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/20">
              <div className="flex items-center gap-4">
                <div className="text-3xl">🎯</div>
                <div className="text-left">
                  <div className="text-white font-bold text-lg">Quest Interaktif</div>
                  <div className="text-blue-100 text-sm">Berbagai Jenis Soal Menarik</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}

export default LoginPage
