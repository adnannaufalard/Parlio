import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'

function StudentQuestDetail() {
  const navigate = useNavigate()
  const { questId } = useParams()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [quest, setQuest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [timerActive, setTimerActive] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [attemptNumber, setAttemptNumber] = useState(1)

  useEffect(() => {
    if (questId) {
      fetchQuestData()
      fetchAttemptNumber()
    }
  }, [questId])

  // Timer countdown
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timerActive, timeRemaining])

  const fetchAttemptNumber = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get quest details to check max_attempts
      const { data: questData, error: questError } = await supabase
        .from('quests')
        .select('max_attempts')
        .eq('id', questId)
        .single()

      if (questError) {
        console.error('Error fetching quest:', questError)
        return
      }

      // Get both latest attempt number and best score
      const { data: attempts, error } = await supabase
        .from('student_quest_attempts')
        .select('attempt_number, score, percentage, xp_earned, coins_earned')
        .eq('student_id', user.id)
        .eq('quest_id', questId)
        .order('attempt_number', { ascending: false })

      // Check if max attempts reached
      if (!error && attempts && attempts.length >= questData.max_attempts) {
        toast.error(`Maksimal percobaan (${questData.max_attempts}x) telah tercapai!`, {
          duration: 4000
        })
        navigate(-1)
        return
      }

      if (!error && attempts && attempts.length > 0) {
        setAttemptNumber(attempts[0].attempt_number + 1)
        
        // Store best attempt for comparison later
        const bestAttempt = attempts.reduce((best, current) => 
          current.score > best.score ? current : best
        , attempts[0])
        
        console.log('=== PREVIOUS ATTEMPTS ===')
        console.log('Total attempts:', attempts.length)
        console.log('Best score so far:', bestAttempt.score)
        console.log('Best percentage:', bestAttempt.percentage)
        console.log('Best XP earned:', bestAttempt.xp_earned)
        console.log('Best Coins earned:', bestAttempt.coins_earned)
        
        // Store in state for later use
        window.bestQuestAttempt = bestAttempt
      } else {
        setAttemptNumber(1)
        window.bestQuestAttempt = null
      }
    } catch (error) {
      console.error('Error fetching attempt number:', error)
      setAttemptNumber(1)
      window.bestQuestAttempt = null
    }
  }

  const fetchQuestData = async () => {
    try {
      // Get quest details
      const { data: questData, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single()

      if (questError) {
        console.error('Error fetching quest:', questError)
        toast.error('Quest tidak ditemukan')
        navigate(-1)
        return
      }

      setQuest(questData)

      // Initialize timer if quest has time limit
      if (questData.time_limit_minutes) {
        setTimeRemaining(questData.time_limit_minutes * 60) // Convert to seconds
        setTimerActive(true)
        setStartTime(Date.now())
      }

      // Get quest questions
      const { data: questQuestions, error: qqError } = await supabase
        .from('quest_questions')
        .select(`
          *,
          question:questions(*)
        `)
        .eq('quest_id', questId)
        .order('question_order', { ascending: true })

      if (qqError) {
        console.error('Error fetching questions:', qqError)
        setQuestions([])
      } else {
        // Map and parse questions
        const mappedQuestions = (questQuestions || []).map(qq => {
          let parsedOptions = null
          
          if (qq.question?.options) {
            let rawOptions = qq.question.options
            
            if (typeof rawOptions === 'string') {
              try {
                rawOptions = JSON.parse(rawOptions)
              } catch (e) {
                console.error('Failed to parse options:', e)
              }
            }
            
            if (Array.isArray(rawOptions)) {
              parsedOptions = {}
              const letters = ['A', 'B', 'C', 'D', 'E', 'F']
              rawOptions.forEach((option, index) => {
                if (option.text) {
                  parsedOptions[letters[index]] = option.text
                }
              })
            } else if (typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
              parsedOptions = rawOptions
            }
          }

          // Handle correct_answer: support both formats
          // Format 1 (old): correct_answer stores the actual text answer
          // Format 2 (new): correct_answer stores the letter (A/B/C/D)
          let correctAnswerKey = qq.question?.correct_answer
          
          // If correct_answer is the actual text, find the key (A/B/C/D)
          if (correctAnswerKey && parsedOptions && typeof correctAnswerKey === 'string') {
            // Check if it's already a letter (A, B, C, D)
            if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(correctAnswerKey)) {
              // It's the actual answer text, find the key
              const foundKey = Object.entries(parsedOptions).find(
                ([key, value]) => value === correctAnswerKey
              )?.[0]
              
              if (foundKey) {
                correctAnswerKey = foundKey
              }
            }
          }
          
          // Alternative: If correct_answer is not found, extract from options array (is_correct: true)
          if (!correctAnswerKey && Array.isArray(rawOptions)) {
            const correctOption = rawOptions.findIndex(opt => opt.is_correct === true)
            if (correctOption !== -1) {
              const letters = ['A', 'B', 'C', 'D', 'E', 'F']
              correctAnswerKey = letters[correctOption]
            }
          }

          return {
            id: qq.id,
            question_text: qq.question?.question_text || '',
            question_type: qq.question?.question_type || '',
            options: parsedOptions,
            correct_answer: correctAnswerKey, // Now always in A/B/C/D format
            points: qq.points_override || qq.question?.points || 0,
            question_order: qq.question_order,
            // Media files
            question_image_url: qq.question?.question_image_url || null,
            question_audio_url: qq.question?.question_audio_url || null,
            question_video_url: qq.question?.question_video_url || null
          }
        })
        
        setQuestions(mappedQuestions)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching quest data:', error)
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleTimeUp = () => {
    setTimerActive(false)
    toast.error('Waktu habis! Quest akan otomatis di-submit.')
    // Auto submit when time is up
    setTimeout(() => {
      handleSubmit(true)
    }, 2000)
  }

  const handleSubmit = async (autoSubmit = false) => {
    // Check if all questions are answered (if not auto-submit)
    if (!autoSubmit) {
      const unanswered = questions.filter(q => !userAnswers[q.id])
      if (unanswered.length > 0) {
        const confirm = window.confirm(
          `Masih ada ${unanswered.length} soal yang belum dijawab. Yakin ingin submit?`
        )
        if (!confirm) return
      }
    }

    try {
      // Calculate time spent
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0

      // Calculate score and correct/wrong answers
      let correctAnswers = 0
      let wrongAnswers = 0
      let totalScore = 0
      let maxScore = 0

      questions.forEach(question => {
        maxScore += question.points
        const userAnswer = userAnswers[question.id]
        
        if (userAnswer) {
          // Check if answer is correct by comparing with correct_answer field
          let isCorrect = false
          
          if (question.question_type === 'short_answer') {
            // For short answer, do case-insensitive comparison and trim whitespace
            isCorrect = userAnswer.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase()
          } else {
            // For multiple choice and true/false
            isCorrect = userAnswer === question.correct_answer
          }
          
          console.log('Question:', question.question_text)
          console.log('User answer:', userAnswer)
          console.log('Correct answer:', question.correct_answer)
          console.log('Is correct:', isCorrect)

          if (isCorrect) {
            correctAnswers++
            totalScore += question.points
          } else {
            wrongAnswers++
          }
        } else {
          wrongAnswers++
        }
      })

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
      const isPassed = percentage >= (quest?.min_score_to_pass || 70)

      // Calculate XP and Coins based on correct answers
      // XP and Coins are rewarded PER correct answer, not flat rate
      const xpPerQuestion = quest?.xp_reward || 0
      const coinsPerQuestion = quest?.coins_reward || 0
      const xpEarned = isPassed ? (correctAnswers * xpPerQuestion) : 0
      const coinsEarned = isPassed ? (correctAnswers * coinsPerQuestion) : 0

      console.log('=== REWARD CALCULATION ===')
      console.log('Correct Answers:', correctAnswers)
      console.log('XP per question:', xpPerQuestion)
      console.log('Coins per question:', coinsPerQuestion)
      console.log('Total XP earned:', xpEarned)
      console.log('Total Coins earned:', coinsEarned)
      console.log('Passed:', isPassed)

      // Prepare result data
      const resultData = {
        questId: questId,
        lessonId: quest?.lesson_id,
        questTitle: quest?.title || 'Quest',
        score: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        correctAnswers: correctAnswers,
        wrongAnswers: wrongAnswers,
        totalQuestions: questions.length,
        timeSpent: timeSpent,
        xpEarned: xpEarned,
        coinsEarned: coinsEarned,
        minScoreToPass: quest?.min_score_to_pass || 70,
        maxAttempts: quest?.max_attempts || 3,
        attemptNumber: attemptNumber,
        passed: isPassed,
        // Add improvement tracking
        isBetterScore: !window.bestQuestAttempt || totalScore > window.bestQuestAttempt.score,
        previousBestScore: window.bestQuestAttempt?.score || 0,
        previousBestPercentage: window.bestQuestAttempt?.percentage || 0
      }

      // Check if this is a better score than previous attempts (BEFORE saving)
      const bestPrevious = window.bestQuestAttempt
      const isBetterScore = !bestPrevious || totalScore > bestPrevious.score
      const isFirstPass = !bestPrevious || !bestPrevious.xp_earned
      
      console.log('=== SCORE COMPARISON ===')
      console.log('Current score:', totalScore)
      console.log('Previous best score:', bestPrevious?.score || 'None')
      console.log('Is better score:', isBetterScore)
      console.log('Is first time passing:', isFirstPass)

      // Save attempt to database
      const { data: { user } } = await supabase.auth.getUser()
      let savedAttemptId = null
      if (user) {
        // First, try to save with user_answers (if column exists)
        // If it fails, save without user_answers
        let attemptData = {
          student_id: user.id,
          quest_id: questId,
          attempt_number: attemptNumber,
          score: totalScore,
          max_score: maxScore,
          percentage: percentage,
          passed: isPassed,
          xp_earned: xpEarned,
          coins_earned: coinsEarned,
          completed_at: new Date().toISOString()
        }

        // Try to add user_answers if column exists
        try {
          attemptData.user_answers = userAnswers
          console.log('=== SAVING USER ANSWERS ===')
          console.log('User answers to save:', userAnswers)
          console.log('User answers keys:', Object.keys(userAnswers))
          console.log('Sample answer:', Object.entries(userAnswers)[0])
          console.log('All answers detail:')
          Object.entries(userAnswers).forEach(([key, value]) => {
            console.log(`  Key: "${key}" (type: ${typeof key}) → Value: "${value}" (type: ${typeof value})`)
          })
        } catch (e) {
          console.log('user_answers column might not exist yet, skipping...')
        }

        const { data: savedAttempt, error: insertError } = await supabase
          .from('student_quest_attempts')
          .upsert(attemptData, {
            onConflict: 'student_id,quest_id,attempt_number',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error saving attempt:', insertError)
          
          // If error is about user_answers column, retry without it
          if (insertError.message && insertError.message.includes('user_answers')) {
            console.log('Retrying without user_answers column...')
            delete attemptData.user_answers
            
            const { data: retryAttempt, error: retryError } = await supabase
              .from('student_quest_attempts')
              .upsert(attemptData, {
                onConflict: 'student_id,quest_id,attempt_number',
                ignoreDuplicates: false
              })
              .select()
              .single()

            if (retryError) {
              console.error('Retry also failed:', retryError)
              toast.error('Gagal menyimpan hasil attempt')
            } else {
              console.log('✅ Quest attempt saved successfully (without user_answers)!')
              savedAttemptId = retryAttempt?.id
            }
          } else {
            toast.error('Gagal menyimpan hasil attempt')
          }
        } else {
          console.log('✅ Quest attempt saved successfully!')
          savedAttemptId = savedAttempt?.id
        }
        
        // Add attemptId to resultData
        resultData.attemptId = savedAttemptId

        // Update user XP and coins ONLY if:
        // 1. Quest is passed AND
        // 2. This is better score than before (or first attempt)
        if (isPassed && (xpEarned > 0 || coinsEarned > 0) && isBetterScore) {
          try {
            // Get current profile data
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('xp_points, coins')
              .eq('id', user.id)
              .single()

            if (profileError) {
              console.error('Error fetching profile:', profileError)
            } else if (profile) {
              // Calculate XP/Coins difference
              // If this is improvement, only add the DIFFERENCE
              let xpToAdd = xpEarned
              let coinsToAdd = coinsEarned
              
              if (bestPrevious && bestPrevious.xp_earned > 0) {
                // Subtract previous rewards, add new rewards (net difference)
                xpToAdd = xpEarned - bestPrevious.xp_earned
                coinsToAdd = coinsEarned - bestPrevious.coins_earned
              }

              const newXP = (profile.xp_points || 0) + xpToAdd
              const newCoins = (profile.coins || 0) + coinsToAdd
              
              console.log('=== PROFILE UPDATE ===')
              console.log('Current XP:', profile.xp_points || 0)
              console.log('Current Coins:', profile.coins || 0)
              console.log('Previous XP earned:', bestPrevious?.xp_earned || 0)
              console.log('Previous Coins earned:', bestPrevious?.coins_earned || 0)
              console.log('New XP earned:', xpEarned)
              console.log('New Coins earned:', coinsEarned)
              console.log('XP Difference (adding):', xpToAdd)
              console.log('Coins Difference (adding):', coinsToAdd)
              console.log('New Total XP:', newXP)
              console.log('New Total Coins:', newCoins)

              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  xp_points: newXP,
                  coins: newCoins
                })
                .eq('id', user.id)

              if (updateError) {
                console.error('Error updating XP/Coins:', updateError)
                toast.error('Quest berhasil, tapi gagal update XP/Coins')
              } else {
                console.log('✅ Profile updated successfully!')
                if (xpToAdd > 0 || coinsToAdd > 0) {
                  toast.success(`Skor meningkat! +${xpToAdd} XP, +${coinsToAdd} Koin`)
                } else if (xpToAdd < 0) {
                  // This shouldn't happen, but just in case
                  console.warn('⚠️ Score decreased, but profile already updated')
                }
              }
            }
          } catch (xpError) {
            console.error('Error updating rewards:', xpError)
          }
        } else if (isPassed && !isBetterScore) {
          console.log('⚠️ Score not improved. No XP/Coins update.')
        }
      }
      
      // Show toast after all processing
      if (isPassed && !isBetterScore) {
        toast.success('Quest selesai! Skor belum meningkat dari percobaan sebelumnya.', {
          duration: 4000
        })
      } else if (!isPassed || isBetterScore) {
        toast.success('Quest berhasil di-submit!')
      }
      
      // Navigate to result page
      setTimeout(() => {
        navigate('/student/quest-result', { 
          state: { result: resultData },
          replace: true 
        })
      }, 500)
    } catch (error) {
      console.error('Error submitting quest:', error)
      toast.error('Gagal submit quest')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <StudentLayout showHeader={true} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Poppins']">Memuat quest...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      {/* Quest Header */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2 font-['Poppins']">
              {quest?.title}
            </h1>
            {quest?.description && (
              <p className="text-sm text-white/90 font-['Poppins']">
                {quest.description}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quest Info */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/20 px-3 py-1.5 rounded-lg font-['Poppins'] text-sm">
            📝 {questions.length} Soal
          </div>
          {quest?.xp_reward && (
            <div className="bg-white/20 px-3 py-1.5 rounded-lg font-['Poppins'] text-sm">
              ⚡ {quest.xp_reward} XP
            </div>
          )}
          {quest?.coins_reward && (
            <div className="bg-white/20 px-3 py-1.5 rounded-lg font-['Poppins'] text-sm">
              🪙 {quest.coins_reward} Koin
            </div>
          )}
          {timeRemaining !== null && (
            <div className={`px-3 py-1.5 rounded-lg font-['Poppins'] text-sm font-semibold ${
              timeRemaining < 60 ? 'bg-red-500 animate-pulse' : 'bg-white/20'
            }`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-6">
        {questions.map((question, qIndex) => (
          <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-semibold font-['Poppins']">
                {qIndex + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800 mb-2 font-['Poppins']">
                  {question.question_text}
                </h3>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full font-medium border border-blue-100 font-['Poppins']">
                    {question.question_type === 'multiple_choice' ? '📝 Pilihan Ganda' : 
                     question.question_type === 'true_false' ? '✓/✗ Benar/Salah' :
                     question.question_type === 'short_answer' ? '✍️ Jawaban Singkat' :
                     '📋 ' + question.question_type}
                  </span>
                  {question.points > 0 && (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium border border-amber-100 font-['Poppins']">
                      ⚡ {question.points} poin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Media Display */}
            {(question.question_image_url || question.question_audio_url || question.question_video_url) && (
              <div className="space-y-3 mb-4 ml-13">
                {question.question_image_url && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={question.question_image_url} 
                      alt="Question media" 
                      className="max-w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                )}
                {question.question_audio_url && (
                  <audio controls className="w-full">
                    <source src={question.question_audio_url} type="audio/mpeg" />
                    <source src={question.question_audio_url} type="audio/wav" />
                    <source src={question.question_audio_url} type="audio/ogg" />
                    Browser Anda tidak mendukung audio player.
                  </audio>
                )}
                {question.question_video_url && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <video controls className="w-full max-h-80">
                      <source src={question.question_video_url} type="video/mp4" />
                      <source src={question.question_video_url} type="video/webm" />
                      <source src={question.question_video_url} type="video/ogg" />
                      Browser Anda tidak mendukung video player.
                    </video>
                  </div>
                )}
              </div>
            )}

            {/* Answer Options */}
            {question.question_type === 'multiple_choice' && question.options && (
              <div className="space-y-2 ml-13">
                {Object.entries(question.options).map(([key, value]) => (
                  <label 
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer font-['Poppins'] ${
                      userAnswers[question.id] === key
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={key}
                      checked={userAnswers[question.id] === key}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{key}. {value}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'true_false' && (
              <div className="space-y-2 ml-13">
                {['Benar', 'Salah'].map((option) => (
                  <label 
                    key={option}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer font-['Poppins'] ${
                      userAnswers[question.id] === option
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={userAnswers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'short_answer' && (
              <div className="ml-13">
                <input
                  type="text"
                  value={userAnswers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder="Ketik jawaban Anda di sini..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-['Poppins']"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Button - Sticky */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors font-['Poppins']"
          >
            Kembali
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all font-['Poppins']"
          >
            Submit Quest
          </button>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentQuestDetail
