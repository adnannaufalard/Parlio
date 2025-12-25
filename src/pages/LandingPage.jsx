import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-gray-900 font-bold text-2xl">Parlio</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-block bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Platform Pembelajaran Bahasa Prancis
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Belajar Bahasa Prancis dengan{' '}
                <span className="text-blue-600">Gamifikasi</span>
              </h1>
              
              <p className="text-xl text-gray-600">
                Platform pembelajaran interaktif dengan sistem level dan reward. Setiap pelajaran adalah petualangan baru untuk menguasai bahasa Prancis.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-red-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-600 transition"
                >
                  Mulai Belajar Gratis
                </button>
              </div>
            </div>

            {/* Right Content - Simple Tower */}
            <div className="hidden lg:block">
              <div className="space-y-3">
                {[
                  { level: 5, color: 'from-red-500 to-red-600', label: 'Expert' },
                  { level: 4, color: 'from-blue-500 to-blue-600', label: 'Advanced' },
                  { level: 3, color: 'from-blue-600 to-blue-700', label: 'Intermediate' },
                  { level: 2, color: 'from-red-500 to-red-600', label: 'Elementary' },
                  { level: 1, color: 'from-gray-800 to-gray-900', label: 'Beginner' },
                ].map((item) => (
                  <div key={item.level} className="flex justify-center">
                    <div
                      className={`bg-gradient-to-r ${item.color} rounded-xl h-16 flex items-center justify-center shadow-lg`}
                      style={{ width: `${(6 - item.level) * 60 + 180}px` }}
                    >
                      <div className="text-center">
                        <div className="text-white font-bold text-lg">Level {item.level}</div>
                        <div className="text-white/80 text-xs">{item.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fitur Unggulan</h2>
            <p className="text-xl text-gray-600">Kenapa memilih Parlio untuk belajar bahasa Prancis</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gamifikasi</h3>
              <p className="text-gray-600">
                Sistem XP, level, coins, dan streak yang membuat belajar menjadi menyenangkan.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">�</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pembelajaran Bertahap</h3>
              <p className="text-gray-600">
                Setiap pelajaran dirancang bertahap dari dasar hingga mahir dengan konten menarik.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Dashboard lengkap dengan statistik dan leaderboard real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Siap Memulai Petualangan?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Bergabung dengan ribuan siswa yang telah belajar bahasa Prancis dengan cara yang menyenangkan
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-blue-600 px-12 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Mulai Sekarang - Gratis!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900">
        <div className="container mx-auto text-center text-gray-400">
          <p>&copy; 2025 Parlio - Platform Pembelajaran Bahasa Prancis</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
