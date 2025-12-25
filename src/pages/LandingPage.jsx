import { useNavigate } from 'react-router-dom'
import Logo1 from '../assets/logo/1.png'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={Logo1} alt="Parlio" className="h-10 object-contain" />
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-[#1E258F] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#161c6e] transition-all shadow-md hover:shadow-lg"
          >
            Masuk
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#1E258F]/10 text-[#1E258F] px-4 py-2 rounded-full text-sm font-semibold">
                <span>🇫🇷</span>
                <span>Platform Gamifikasi Bahasa Prancis</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight">
                Belajar Bahasa Prancis{' '}
                <span className="text-[#1E258F]">Lebih Seru</span>
                <br />
                <span className="text-slate-600">dengan Gamifikasi!</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                Sistem informasi pembelajaran berbasis web dengan konsep gamifikasi. Belajar bahasa Prancis menjadi lebih menyenangkan dengan <span className="font-semibold text-[#1E258F]">XP, Level, Badge, dan Leaderboard</span>!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-[#1E258F] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#161c6e] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  🚀 Mulai Petualangan
                </button>
                <a
                  href="#fitur"
                  className="border-2 border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-[#1E258F] hover:text-[#1E258F] transition-all text-center"
                >
                  Pelajari Lebih Lanjut
                </a>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-8 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E258F]">A1</div>
                  <div className="text-sm text-slate-500">Level DELF</div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E258F]">100+</div>
                  <div className="text-sm text-slate-500">Quest</div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#1E258F]">🎮</div>
                  <div className="text-sm text-slate-500">Gamifikasi</div>
                </div>
              </div>
            </div>

            {/* Right Content - Gamification Illustration */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                {/* Main Card */}
                <div className="relative w-80 bg-white rounded-3xl shadow-2xl p-6 border border-slate-100">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#1E258F] to-[#3a45c9] rounded-2xl flex items-center justify-center text-3xl shadow-lg">🎓</div>
                    <div>
                      <div className="text-slate-900 font-bold text-lg">Level 5</div>
                      <div className="text-slate-500 text-sm">Expert Français</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Progress</span>
                      <span className="text-[#1E258F] font-semibold">2,450 / 3,000 XP</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-[#1E258F] to-[#3a45c9] rounded-full"></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">⭐</div>
                      <div className="text-amber-600 font-bold">2,450</div>
                      <div className="text-amber-600/70 text-xs">XP</div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">💰</div>
                      <div className="text-yellow-600 font-bold">850</div>
                      <div className="text-yellow-600/70 text-xs">Coins</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">🏆</div>
                      <div className="text-purple-600 font-bold">12</div>
                      <div className="text-purple-600/70 text-xs">Badge</div>
                    </div>
                  </div>

                  {/* Recent Badges */}
                  <div className="flex justify-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-lg shadow">👑</div>
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-lg shadow">🎯</div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-lg shadow">📚</div>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-lg shadow">🔥</div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg animate-bounce">
                  +50 XP
                </div>
                <div className="absolute top-1/2 -left-6 bg-[#1E258F] text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  🔥 Streak
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 px-6 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#1E258F]/10 text-[#1E258F] px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <span>✨</span>
              <span>Mengapa Parlio?</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Fitur Unggulan Gamifikasi</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Dirancang dengan framework MDA (Mechanics, Dynamics, Aesthetics) untuk pengalaman belajar yang optimal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mechanics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl mb-4">⭐</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">XP & Level</h3>
              <p className="text-slate-600">
                Kumpulkan Experience Points dari setiap quest yang diselesaikan dan naik level untuk membuka achievement baru.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-2xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Coins & Rewards</h3>
              <p className="text-slate-600">
                Dapatkan coins virtual (Écus) yang bisa digunakan untuk membeli item special di toko suvenir.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Badge & Achievement</h3>
              <p className="text-slate-600">
                Raih berbagai badge seperti "Roi de la Conjugaison" dan tunjukkan di profil sebagai penghargaan.
              </p>
            </div>

            {/* Dynamics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Quest Interaktif</h3>
              <p className="text-slate-600">
                Berbagai jenis soal menarik: pilihan ganda, isian, dan pencocokan untuk menguji pemahaman materi.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Leaderboard</h3>
              <p className="text-slate-600">
                Bersaing dengan teman sekelas! Lihat peringkat XP dan coins secara real-time.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Progress Tracking</h3>
              <p className="text-slate-600">
                Pantau perkembangan belajar dengan dashboard lengkap dan progress bar di setiap chapter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Cara Kerja Parlio</h2>
            <p className="text-lg text-slate-600">Langkah mudah untuk memulai petualangan belajar</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: '🔐', title: 'Login', desc: 'Masuk dengan akun yang diberikan guru' },
              { step: 2, icon: '📖', title: 'Pilih Materi', desc: 'Akses materi A1-A2 sesuai kelas' },
              { step: 3, icon: '🎮', title: 'Kerjakan Quest', desc: 'Selesaikan quest dan kumpulkan XP' },
              { step: 4, icon: '🏆', title: 'Raih Prestasi', desc: 'Naik level dan dapatkan rewards' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 bg-[#1E258F] rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#1E258F] to-[#2a34b8]">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="text-6xl mb-6"></div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Siap Memulai Petualangan?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dan mulai petualangan belajar bahasa Prancis dengan cara yang seru dan interaktif!
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-[#1E258F] px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all shadow-xl transform hover:-translate-y-0.5"
          >
            🚀 Mulai Sekarang
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <img src={Logo1} alt="Parlio" className="h-8 object-contain brightness-0 invert" />
            </div>
            <p className="text-slate-400 text-sm text-center">
              &copy; 2025 Parlio - Sistem Informasi Pembelajaran Bahasa Prancis dengan Gamifikasi
            </p>
            <div className="text-slate-400 text-sm">
              SMAN 1 Padamara
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
