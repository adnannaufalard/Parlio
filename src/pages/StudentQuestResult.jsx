import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'

function StudentQuestResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [resultData, setResultData] = useState(null)

  useEffect(() => {
    // Get result data from navigation state
    if (location.state?.result) {
      setResultData(location.state.result)
      setLoading(false)
    } else {
      toast.error('Data hasil tidak ditemukan')
      navigate(-1)
    }
  }, [location, navigate])

  const handleTryAgain = () => {
    if (resultData?.questId) {
      // Double check if retry is allowed
      if (!canRetry) {
        toast.error('Maksimal percobaan telah tercapai!')
        return
      }
      navigate(`/student/quest/${resultData.questId}`)
    }
  }

  const handleBack = () => {
    // Navigate back to lesson detail with quest tab active
    if (resultData?.lessonId) {
      navigate(`/student/lesson/${resultData.lessonId}`, { 
        state: { activeTab: 'quest' } 
      })
    } else {
      navigate(-1)
    }
  }

  const handleViewAnswers = () => {
    // Navigate to answers detail page
    if (resultData?.attemptId) {
      navigate(`/student/quest-answers/${resultData.attemptId}`)
    } else {
      toast.error('Data percobaan tidak ditemukan')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins} menit ${secs} detik`
  }

  if (loading) {
    return (
      <StudentLayout showHeader={true} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Poppins']">Memuat hasil...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  const isPassed = resultData.percentage >= (resultData.minScoreToPass || 70)
  const canRetry = resultData.attemptNumber < (resultData.maxAttempts || 3)

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      <div className="max-w-2xl mx-auto">
        {/* Result Header */}
        <div className={`rounded-2xl shadow-xl p-8 mb-6 text-white relative overflow-hidden ${
          isPassed 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          <div className="relative z-10">
            {/* Icon & Status */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                <span className="text-6xl">
                  {isPassed ? '🎉' : '😢'}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2 font-['Poppins']">
                {isPassed ? 'Selamat!' : 'Belum Berhasil'}
              </h1>
              <p className="text-lg text-white/90 font-['Poppins']">
                {isPassed 
                  ? 'Kamu berhasil menyelesaikan quest ini!' 
                  : 'Jangan menyerah, coba lagi!'}
              </p>
            </div>

            {/* Score Display */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-4">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2 font-['Poppins']">
                  {Math.round(resultData.percentage)}%
                </div>
                <div className="text-sm text-white/80 font-['Poppins']">
                  Skor Akhir
                </div>
                
                {/* Show improvement indicator */}
                {resultData.attemptNumber > 1 && resultData.isBetterScore && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold font-['Poppins']">
                      Meningkat dari {Math.round(resultData.previousBestPercentage)}%
                    </span>
                  </div>
                )}
                {resultData.attemptNumber > 1 && !resultData.isBetterScore && resultData.passed && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-sm font-semibold font-['Poppins']">
                      Skor terbaik tetap: {Math.round(resultData.previousBestPercentage)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quest Title */}
            <div className="text-center">
              <h2 className="text-xl font-semibold font-['Poppins']">
                {resultData.questTitle}
              </h2>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 font-['Poppins'] flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Statistik
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Correct Answers */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-green-700 font-['Poppins']">
                    {resultData.correctAnswers}
                  </div>
                  <div className="text-xs text-green-600 font-['Poppins']">
                    Jawaban Benar
                  </div>
                </div>
              </div>
            </div>

            {/* Wrong Answers */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                  ✗
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-red-700 font-['Poppins']">
                    {resultData.wrongAnswers}
                  </div>
                  <div className="text-xs text-red-600 font-['Poppins']">
                    Jawaban Salah
                  </div>
                </div>
              </div>
            </div>

            {/* Time Spent */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                  ⏱️
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-blue-700 font-['Poppins']">
                    {formatTime(resultData.timeSpent)}
                  </div>
                  <div className="text-xs text-blue-600 font-['Poppins']">
                    Waktu Mengerjakan
                  </div>
                </div>
              </div>
            </div>

            {/* Total Score */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                  📝
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-amber-700 font-['Poppins']">
                    {resultData.score}/{resultData.maxScore}
                  </div>
                  <div className="text-xs text-amber-600 font-['Poppins']">
                    Total Poin
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards (only if passed AND earned rewards) */}
        {isPassed && (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 font-['Poppins'] flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              Reward
              {resultData.attemptNumber > 1 && resultData.isBetterScore && (
                <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Skor Meningkat!
                </span>
              )}
              {resultData.attemptNumber > 1 && !resultData.isBetterScore && (
                <span className="ml-2 text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  Tidak Ada Reward Tambahan
                </span>
              )}
            </h3>
            
            {resultData.isBetterScore && (resultData.xpEarned > 0 || resultData.coinsEarned > 0) ? (
              <div className="flex items-center justify-center gap-6">
                {resultData.xpEarned > 0 && (
                  <div className="flex items-center gap-3 bg-white rounded-lg px-6 py-4 shadow-sm">
                    <span className="text-3xl">⚡</span>
                    <div>
                      <div className="text-2xl font-bold text-amber-600 font-['Poppins']">
                        +{resultData.xpEarned}
                      </div>
                      <div className="text-xs text-gray-600 font-['Poppins']">
                        XP {resultData.attemptNumber > 1 ? '(Peningkatan)' : ''}
                      </div>
                    </div>
                  </div>
                )}
                
                {resultData.coinsEarned > 0 && (
                  <div className="flex items-center gap-3 bg-white rounded-lg px-6 py-4 shadow-sm">
                    <span className="text-3xl">🪙</span>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600 font-['Poppins']">
                        +{resultData.coinsEarned}
                      </div>
                      <div className="text-xs text-gray-600 font-['Poppins']">
                        Koin {resultData.attemptNumber > 1 ? '(Peningkatan)' : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-3 bg-white rounded-lg px-6 py-4 shadow-sm">
                  <span className="text-3xl">ℹ️</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900 font-['Poppins']">
                      Tidak Ada Reward Tambahan
                    </div>
                    <div className="text-xs text-gray-600 font-['Poppins']">
                      Skor belum meningkat dari percobaan sebelumnya ({Math.round(resultData.previousBestPercentage)}%)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attempt Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <div className="text-sm font-semibold text-gray-900 font-['Poppins']">
                  Percobaan ke-{resultData.attemptNumber}
                </div>
                <div className="text-xs text-gray-600 font-['Poppins']">
                  dari {resultData.maxAttempts} percobaan
                </div>
              </div>
            </div>
            {!isPassed && !canRetry && (
              <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-medium font-['Poppins']">
                Maksimal percobaan tercapai
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors font-['Poppins']"
          >
            Kembali
          </button>
          
          {isPassed ? (
            <button
              onClick={handleViewAnswers}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all font-['Poppins'] flex items-center justify-center gap-2"
            >
              <span>📝</span>
              <span>Lihat Detail</span>
            </button>
          ) : canRetry ? (
            <button
              onClick={handleTryAgain}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all font-['Poppins'] flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Coba Lagi</span>
            </button>
          ) : null}
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentQuestResult
