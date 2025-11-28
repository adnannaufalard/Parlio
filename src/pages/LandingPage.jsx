import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-4 drop-shadow-lg">
            Parlio
          </h1>
          <div className="h-1 w-24 bg-white mx-auto rounded-full mb-6"></div>
          <p className="text-xl md:text-2xl text-white/90 font-light">
            Aplikasi Pembelajaran Bahasa Prancis
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="bg-white text-indigo-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition duration-300 shadow-2xl"
        >
          Mulai Belajar &rarr;
        </button>
      </div>
    </div>
  )
}

export default LandingPage
