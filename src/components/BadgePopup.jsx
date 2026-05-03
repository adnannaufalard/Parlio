import { useState, useEffect } from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { X, Star } from 'lucide-react'

// Import badge images
import uniteOne from '../assets/badge/unite-one.png'
import uniteTwo from '../assets/badge/unite-two.png'
import uniteThree from '../assets/badge/unite-three.png'
import uniteFour from '../assets/badge/unite-four.png'
import uniteFive from '../assets/badge/unite-five.png'

export function BadgePopup({ isOpen, onClose, badgeLevel = 1, chapterName = 'Pelajaran' }) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Determine badge colors based on level (1-5)
  const getBadgeStyle = (level) => {
    switch (level) {
      case 1: return { color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-400', name: 'Bronze', image: uniteOne }
      case 2: return { color: 'text-gray-400', bg: 'bg-gray-100', border: 'border-gray-300', name: 'Silver', image: uniteTwo }
      case 3: return { color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-400', name: 'Gold', image: uniteThree }
      case 4: return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-400', name: 'Platinum', image: uniteFour }
      case 5: return { color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-400', name: 'Diamond', image: uniteFive }
      default: return { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-400', name: 'Special', image: uniteOne }
    }
  }

  const style = getBadgeStyle(badgeLevel)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">

        {/* Background Animation */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
          <div className="w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="relative p-8 flex flex-col items-center text-center">

          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              <DotLottieReact
                src="https://lottie.host/819d9b4b-4b21-4f1f-9c09-4fb2c31e21e6/uJ2d6oE2oG.lottie"
                loop={false}
                autoplay
              />
            </div>
          )}

          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-blue-100 text-blue-700 font-['Poppins']">
              <Star className="w-3.5 h-3.5" fill="currentColor" />
              Pencapaian Baru!
            </span>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mt-2 mb-6 font-['Poppins']">Luar Biasa!</h3>

          {/* Badge Icon */}
          <div className="relative w-40 h-40 mb-6 flex items-center justify-center transform hover:scale-105 transition-transform duration-300 drop-shadow-xl">
            <img src={style.image} alt={`Badge Level ${badgeLevel}`} className="w-full h-full object-contain animate-in zoom-in duration-500 delay-150" />
            <div className={`absolute -bottom-2 px-4 py-1 bg-white rounded-full border-2 ${style.border} text-sm font-bold shadow-sm ${style.color} font-['Poppins'] animate-in slide-in-from-bottom-2 duration-500 delay-300`}>
              Lvl {badgeLevel}
            </div>
          </div>

          <h4 className={`text-xl font-bold mb-2 ${style.color} font-['Poppins']`}>
            Badge {style.name}
          </h4>

          <p className="text-gray-600 text-sm leading-relaxed mb-8 font-['Poppins']">
            Kamu telah menyelesaikan semua misi di <br /><strong className="text-gray-800">{chapterName}</strong>.<br />Teruskan semangat belajarmu!
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all active:scale-95 font-['Poppins']"
          >
            Lanjutkan Perjalanan
          </button>
        </div>
      </div>
    </div>
  )
}
