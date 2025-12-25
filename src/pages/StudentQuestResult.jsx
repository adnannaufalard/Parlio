import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

function StudentQuestResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [resultData, setResultData] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (location.state?.result) {
      setResultData(location.state.result)
      setLoading(false)
      fetchUserProfile()
    } else {
      toast.error('Data hasil tidak ditemukan')
      navigate(-1)
    }
  }, [location, navigate])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, xp_points, coins')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserProfile(profile)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleTryAgain = () => {
    if (resultData?.questId && canRetry) {
      // Navigate to quest with replace to avoid stacking history
      navigate(`/student/quest/${resultData.questId}`, { replace: true })
    }
  }

  const handleBack = () => {
    // Navigate back to lesson detail
    if (resultData?.lessonId) {
      navigate(`/student/lesson/${resultData.lessonId}`, { replace: true })
    } else if (resultData?.chapterId) {
      navigate(`/student/chapters/${resultData.chapterId}`, { replace: true })
    } else {
      navigate('/student/chapters', { replace: true })
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-32 h-32">
          <DotLottieReact
            src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    )
  }

  // Use the passed status from resultData (calculated in StudentQuestDetail)
  const isPassed = resultData.passed || false
  const canRetry = resultData.attemptNumber < (resultData.maxAttempts || 3)
  
  // Check if rewards were given (only when passing with better score)
  const rewardsGiven = isPassed && resultData.isBetterScore
  const noRewardsReason = !isPassed 
    ? 'Kamu belum lulus quest ini' 
    : !resultData.isBetterScore 
      ? 'Skor tidak lebih tinggi dari sebelumnya' 
      : null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with integrated User Info */}
      <div className={`${isPassed ? 'bg-green-600' : 'bg-red-500'} text-white`}>
        {/* User Info Bar - Glassmorphism */}
        {userProfile && (
          <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {userProfile.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                    {userProfile.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="font-medium font-['Poppins'] text-sm">
                  {userProfile.full_name || 'Siswa'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-amber-200">⚡</span>
                  <span className="text-sm font-medium font-['Poppins']">{userProfile.xp_points?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-yellow-200">🪙</span>
                  <span className="text-sm font-medium font-['Poppins']">{userProfile.coins?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Status */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <span className="text-5xl">{isPassed ? '🎉' : '😢'}</span>
            </div>
            <h1 className="text-2xl font-bold mb-1 font-['Poppins']">
              {isPassed ? 'Selamat!' : 'Belum Berhasil'}
            </h1>
            <p className="text-white/80 font-['Poppins']">
              {isPassed ? 'Kamu lulus quest ini!' : 'Coba lagi, kamu pasti bisa!'}
            </p>
          </div>

          {/* Score */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-6xl font-bold font-['Poppins'] mb-1">
              {Math.round(resultData.percentage)}
            </div>
            <div className="text-white/80 text-sm font-['Poppins']">
              {resultData.score}/{resultData.maxScore} poin
            </div>
            
            {resultData.attemptNumber > 1 && resultData.isBetterScore && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-['Poppins']">
                📈 Meningkat dari {Math.round(resultData.previousBestPercentage)}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600 font-['Poppins']">{resultData.correctAnswers}</div>
            <div className="text-xs text-gray-500 font-['Poppins']">Benar</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-red-500 font-['Poppins']">{resultData.wrongAnswers}</div>
            <div className="text-xs text-gray-500 font-['Poppins']">Salah</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600 font-['Poppins']">{formatTime(resultData.timeSpent)}</div>
            <div className="text-xs text-gray-500 font-['Poppins']">Waktu</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-700 font-['Poppins']">{resultData.attemptNumber}/{resultData.maxAttempts}</div>
            <div className="text-xs text-gray-500 font-['Poppins']">Percobaan</div>
          </div>
        </div>

        {/* Rewards Section - Always show with status */}
        <div className={`rounded-xl p-4 ${rewardsGiven ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-semibold font-['Poppins'] ${rewardsGiven ? 'text-amber-800' : 'text-gray-600'}`}>
              {rewardsGiven ? 'Reward Didapat' : 'Status Reward'}
            </h3>
            {rewardsGiven && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium font-['Poppins']">
                Ditambahkan ✓
              </span>
            )}
          </div>
          
          {rewardsGiven ? (
            <div className="flex justify-center gap-6">
              {resultData.xpEarned > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600 font-['Poppins']">+{resultData.xpEarned}</div>
                  <div className="text-xs text-amber-700 font-['Poppins']">XP</div>
                </div>
              )}
              {resultData.coinsEarned > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 font-['Poppins']">+{resultData.coinsEarned}</div>
                  <div className="text-xs text-yellow-700 font-['Poppins']">Coin</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="flex justify-center gap-6 mb-3 opacity-50">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-400 font-['Poppins']">+0</div>
                  <div className="text-xs text-gray-400 font-['Poppins']">XP</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-400 font-['Poppins']">+0</div>
                  <div className="text-xs text-gray-400 font-['Poppins']">Coin</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-['Poppins'] flex items-center justify-center gap-1">
                <span></span>
                <span>{noRewardsReason}</span>
              </p>
            </div>
          )}
        </div>

        {/* Toggle Answer Details */}
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-800 font-['Poppins']">
            Lihat Detail Jawaban
          </span>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${showAnswers ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Answer Details */}
        {showAnswers && resultData.answersDetail && (
          <div className="space-y-3">
            {resultData.answersDetail.map((answer, idx) => (
              <div 
                key={answer.questionId}
                className={`bg-white rounded-xl overflow-hidden shadow-sm border-l-4 ${
                  answer.isCorrect ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="p-4">
                  {/* Question Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${
                      answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {answer.isCorrect ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1 font-['Poppins']">Soal {idx + 1}</div>
                      <p className="text-gray-800 font-medium font-['Poppins']">{answer.questionText}</p>
                    </div>
                  </div>

                  {/* Answer Display */}
                  <div className="ml-11 space-y-2">
                    {/* User's Answer */}
                    <div className={`p-3 rounded-lg ${
                      answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="text-xs text-gray-500 mb-1 font-['Poppins']">Jawaban kamu:</div>
                      <div className={`font-medium font-['Poppins'] ${
                        answer.isCorrect ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {answer.userAnswer ? (
                          answer.options && answer.options[answer.userAnswer] 
                            ? `${answer.userAnswer}. ${answer.options[answer.userAnswer]}`
                            : answer.userAnswer
                        ) : (
                          <span className="italic text-gray-400">Tidak dijawab</span>
                        )}
                      </div>
                    </div>

                    {/* Correct Answer - Only show for correct answers */}
                    {answer.isCorrect && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 text-lg">✓</span>
                          <span className="text-green-700 font-medium font-['Poppins']">Jawaban benar!</span>
                        </div>
                      </div>
                    )}

                    {/* For wrong answers - show hint but NOT the correct answer */}
                    {!answer.isCorrect && (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-600 font-['Poppins'] text-sm">
                          <span>💡</span>
                          <span>Pelajari kembali materi untuk menemukan jawaban yang benar</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 pb-8">
          <button
            onClick={handleBack}
            className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors font-['Poppins']"
          >
            Kembali
          </button>
          
          {canRetry && (
            <button
              onClick={handleTryAgain}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-colors font-['Poppins'] ${
                isPassed 
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentQuestResult
