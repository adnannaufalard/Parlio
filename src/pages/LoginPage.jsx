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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang</h1>
          <p className="text-gray-600">Masuk ke akun Parlio Anda</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
          {/* hidden fields to prevent browser autofill */}
          <input type="text" name="fakeuser" autoComplete="off" className="hidden" />
          <input type="password" name="fakepass" autoComplete="new-password" className="hidden" />
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-gray-400"
              placeholder="nama@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-black border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition placeholder:text-gray-400"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
