import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

function StudentQuestDetail() {
  const navigate = useNavigate()
  const { questId } = useParams()
  const [loading, setLoading] = useState(true)
  const [quest, setQuest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [timerActive, setTimerActive] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [currentQuestion, setCurrentQuestion] = useState(0)

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

      const { data: questData } = await supabase
        .from('quests')
        .select('max_attempts')
        .eq('id', questId)
        .single()

      const { data: attempts, error } = await supabase
        .from('student_quest_attempts')
        .select('attempt_number, score, percentage, xp_earned, coins_earned')
        .eq('student_id', user.id)
        .eq('quest_id', questId)
        .order('attempt_number', { ascending: false })

      if (!error && attempts && attempts.length >= questData?.max_attempts) {
        toast.error(`Maksimal percobaan (${questData.max_attempts}x) telah tercapai!`)
        navigate(-1)
        return
      }

      if (!error && attempts && attempts.length > 0) {
        setAttemptNumber(attempts[0].attempt_number + 1)
        const bestAttempt = attempts.reduce((best, current) => 
          current.score > best.score ? current : best
        , attempts[0])
        window.bestQuestAttempt = bestAttempt
      } else {
        setAttemptNumber(1)
        window.bestQuestAttempt = null
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchQuestData = async () => {
    try {
      // Fetch quest with lesson data to get chapter_id
      const { data: questData, error: questError } = await supabase
        .from('quests')
        .select('*, lesson:lessons(id, chapter_id)')
        .eq('id', questId)
        .single()

      if (questError) {
        toast.error('Quest tidak ditemukan')
        navigate(-1)
        return
      }

      // Store chapter_id in quest object for later use
      setQuest({
        ...questData,
        chapter_id: questData.lesson?.chapter_id
      })

      if (questData.time_limit_minutes) {
        setTimeRemaining(questData.time_limit_minutes * 60)
        setTimerActive(true)
        setStartTime(Date.now())
      }

      const { data: questQuestions, error: qqError } = await supabase
        .from('quest_questions')
        .select(`*, question:questions(*)`)
        .eq('quest_id', questId)
        .order('question_order', { ascending: true })

      if (!qqError) {
        const mappedQuestions = (questQuestions || []).map(qq => {
          let parsedOptions = null
          let rawOptions = qq.question?.options
          
          if (rawOptions && typeof rawOptions === 'string') {
            try { rawOptions = JSON.parse(rawOptions) } catch {}
          }
          
          if (Array.isArray(rawOptions)) {
            parsedOptions = {}
            const letters = ['A', 'B', 'C', 'D', 'E', 'F']
            rawOptions.forEach((option, index) => {
              if (option.text) parsedOptions[letters[index]] = option.text
            })
          } else if (typeof rawOptions === 'object') {
            parsedOptions = rawOptions
          }

          let correctAnswerKey = qq.question?.correct_answer
          if (correctAnswerKey && parsedOptions && !['A','B','C','D','E','F'].includes(correctAnswerKey)) {
            const foundKey = Object.entries(parsedOptions).find(([k, v]) => v === correctAnswerKey)?.[0]
            if (foundKey) correctAnswerKey = foundKey
          }
          
          if (!correctAnswerKey && Array.isArray(rawOptions)) {
            const idx = rawOptions.findIndex(opt => opt.is_correct)
            if (idx !== -1) correctAnswerKey = ['A','B','C','D','E','F'][idx]
          }

          return {
            id: qq.id,
            question_text: qq.question?.question_text || '',
            question_type: qq.question?.question_type || '',
            options: parsedOptions,
            correct_answer: correctAnswerKey,
            points: qq.points_override || qq.question?.points || 0,
            question_image_url: qq.question?.question_image_url,
            question_audio_url: qq.question?.question_audio_url,
            question_video_url: qq.question?.question_video_url
          }
        })
        setQuestions(mappedQuestions)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleTimeUp = () => {
    setTimerActive(false)
    toast.error('Waktu habis!')
    setTimeout(() => handleSubmit(true), 1500)
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unanswered = questions.filter(q => !userAnswers[q.id])
      if (unanswered.length > 0) {
        if (!window.confirm(`Ada ${unanswered.length} soal belum dijawab. Submit?`)) return
      }
    }

    try {
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
      let correctAnswers = 0, wrongAnswers = 0, totalScore = 0, maxScore = 0
      
      // Build answers detail for result page
      const answersDetail = []

      questions.forEach(question => {
        maxScore += question.points
        const userAnswer = userAnswers[question.id]
        let isCorrect = false
        
        if (userAnswer) {
          if (question.question_type === 'short_answer') {
            isCorrect = userAnswer.trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase()
          } else {
            isCorrect = userAnswer === question.correct_answer
          }
          
          if (isCorrect) {
            correctAnswers++
            totalScore += question.points
          } else {
            wrongAnswers++
          }
        } else {
          wrongAnswers++
        }

        answersDetail.push({
          questionId: question.id,
          questionText: question.question_text,
          questionType: question.question_type,
          options: question.options,
          userAnswer: userAnswer || null,
          correctAnswer: question.correct_answer,
          isCorrect,
          points: question.points
        })
      })

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
      const isPassed = percentage >= (quest?.min_score_to_pass || 70)
      const xpEarned = isPassed ? (correctAnswers * (quest?.xp_reward || 0)) : 0
      const coinsEarned = isPassed ? (correctAnswers * (quest?.coins_reward || 0)) : 0

      const resultData = {
        questId, lessonId: quest?.lesson_id, chapterId: quest?.chapter_id, questTitle: quest?.title || 'Quest',
        score: totalScore, maxScore, percentage, correctAnswers, wrongAnswers,
        totalQuestions: questions.length, timeSpent, xpEarned, coinsEarned,
        minScoreToPass: quest?.min_score_to_pass || 70, maxAttempts: quest?.max_attempts || 3,
        attemptNumber, passed: isPassed, answersDetail,
        isBetterScore: !window.bestQuestAttempt || totalScore > window.bestQuestAttempt.score,
        previousBestPercentage: window.bestQuestAttempt?.percentage || 0
      }

      const bestPrevious = window.bestQuestAttempt
      const isBetterScore = !bestPrevious || totalScore > bestPrevious.score

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const attemptData = {
          student_id: user.id, quest_id: questId, attempt_number: attemptNumber,
          score: totalScore, max_score: maxScore, percentage, passed: isPassed,
          xp_earned: xpEarned, coins_earned: coinsEarned, completed_at: new Date().toISOString(),
          user_answers: userAnswers
        }

        const { data: savedAttempt, error } = await supabase
          .from('student_quest_attempts')
          .upsert(attemptData, { onConflict: 'student_id,quest_id,attempt_number' })
          .select().single()

        if (!error) resultData.attemptId = savedAttempt?.id

        if (isPassed && isBetterScore && (xpEarned > 0 || coinsEarned > 0)) {
          const { data: profile } = await supabase
            .from('profiles').select('xp_points, coins').eq('id', user.id).single()

          if (profile) {
            let xpToAdd = bestPrevious?.xp_earned ? xpEarned - bestPrevious.xp_earned : xpEarned
            let coinsToAdd = bestPrevious?.coins_earned ? coinsEarned - bestPrevious.coins_earned : coinsEarned

            await supabase.from('profiles').update({
              xp_points: (profile.xp_points || 0) + xpToAdd,
              coins: (profile.coins || 0) + coinsToAdd
            }).eq('id', user.id)
          }
        }
      }

      navigate('/student/quest-result', { state: { result: resultData }, replace: true })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal submit quest')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return { mins, secs, formatted: `${mins}:${secs.toString().padStart(2, '0')}` }
  }

  const answeredCount = Object.keys(userAnswers).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-['Poppins']">Memuat quest...</p>
        </div>
      </div>
    )
  }

  const time = timeRemaining !== null ? formatTime(timeRemaining) : null
  const isLowTime = timeRemaining !== null && timeRemaining < 60

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Sidebar - Timer & Progress */}
      <div className="hidden lg:flex lg:w-72 bg-[#1E258F] text-white flex-col fixed h-screen">
        {/* Quest Title */}
        <div className="p-5 border-b border-white/10">
          <h2 className="font-bold text-lg font-['Poppins'] line-clamp-2">{quest?.title}</h2>
          <p className="text-sm text-white/70 mt-1 font-['Poppins']">Percobaan ke-{attemptNumber}</p>
        </div>

        {/* Timer - Large Display */}
        {time && (
          <div className={`p-6 text-center ${isLowTime ? 'bg-red-600' : ''}`}>
            <div className="text-xs uppercase tracking-wider text-white/70 mb-2 font-['Poppins']">Sisa Waktu</div>
            <div className={`text-5xl font-bold font-mono ${isLowTime ? 'animate-pulse' : ''}`}>
              {time.mins.toString().padStart(2, '0')}:{time.secs.toString().padStart(2, '0')}
            </div>
            {isLowTime && (
              <div className="mt-2 text-sm text-white/90 font-['Poppins']">⚠️ Waktu hampir habis!</div>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="p-5 border-t border-white/10">
          <div className="flex justify-between text-sm mb-2 font-['Poppins']">
            <span>Progress</span>
            <span>{answeredCount}/{questions.length}</span>
          </div>
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-green-400 h-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Navigator */}
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-white/70 mb-3 font-['Poppins']">Navigasi Soal</div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all font-['Poppins'] ${
                  currentQuestion === idx
                    ? 'bg-white text-[#1E258F] scale-110'
                    : userAnswers[q.id]
                    ? 'bg-green-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button in Sidebar */}
        <div className="p-5 border-t border-white/10">
          <button
            onClick={() => handleSubmit(false)}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors font-['Poppins']"
          >
            Submit Quest
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#1E258F] text-white p-4 z-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="font-bold font-['Poppins'] line-clamp-1">{quest?.title}</h2>
            <p className="text-xs text-white/70 font-['Poppins']">{answeredCount}/{questions.length} dijawab</p>
          </div>
          {time && (
            <div className={`px-4 py-2 rounded-lg font-mono font-bold ${isLowTime ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
              {time.formatted}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        <div className="max-w-3xl mx-auto p-4 lg:p-8 pt-20 lg:pt-8 pb-32 lg:pb-8">
          {/* Current Question */}
          {questions[currentQuestion] && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Question Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-['Poppins']">
                    Soal {currentQuestion + 1} dari {questions.length}
                  </span>
                  <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-medium font-['Poppins']">
                    {questions[currentQuestion].points} poin
                  </span>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 font-['Poppins']">
                  {questions[currentQuestion].question_text}
                </h3>

                {/* Media */}
                {questions[currentQuestion].question_image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                    <img src={questions[currentQuestion].question_image_url} alt="" className="max-w-full h-auto max-h-64 mx-auto" />
                  </div>
                )}
                {questions[currentQuestion].question_audio_url && (
                  <audio controls className="w-full mb-4">
                    <source src={questions[currentQuestion].question_audio_url} />
                  </audio>
                )}
                {questions[currentQuestion].question_video_url && (
                  <video controls className="w-full max-h-64 mb-4 rounded-lg">
                    <source src={questions[currentQuestion].question_video_url} />
                  </video>
                )}

                {/* Options */}
                {questions[currentQuestion].question_type === 'multiple_choice' && questions[currentQuestion].options && (
                  <div className="space-y-3">
                    {Object.entries(questions[currentQuestion].options).map(([key, value]) => (
                      <label 
                        key={key}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer font-['Poppins'] ${
                          userAnswers[questions[currentQuestion].id] === key
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          userAnswers[questions[currentQuestion].id] === key
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {key}
                        </div>
                        <span className="text-gray-700 flex-1">{value}</span>
                        <input
                          type="radio"
                          name={`q-${questions[currentQuestion].id}`}
                          value={key}
                          checked={userAnswers[questions[currentQuestion].id] === key}
                          onChange={() => handleAnswerChange(questions[currentQuestion].id, key)}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {questions[currentQuestion].question_type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['Benar', 'Salah'].map((option) => (
                      <label 
                        key={option}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer font-['Poppins'] ${
                          userAnswers[questions[currentQuestion].id] === option
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-2xl">{option === 'Benar' ? '✓' : '✗'}</span>
                        <span className="font-medium text-gray-700">{option}</span>
                        <input
                          type="radio"
                          name={`q-${questions[currentQuestion].id}`}
                          value={option}
                          checked={userAnswers[questions[currentQuestion].id] === option}
                          onChange={() => handleAnswerChange(questions[currentQuestion].id, option)}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {questions[currentQuestion].question_type === 'short_answer' && (
                  <input
                    type="text"
                    value={userAnswers[questions[currentQuestion].id] || ''}
                    onChange={(e) => handleAnswerChange(questions[currentQuestion].id, e.target.value)}
                    placeholder="Ketik jawaban..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-['Poppins'] text-lg"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-['Poppins']"
                >
                  ← Sebelumnya
                </button>
                
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                    className="px-5 py-2.5 bg-[#1E258F] text-white rounded-lg font-medium hover:bg-[#161d6f] transition-colors font-['Poppins']"
                  >
                    Selanjutnya →
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubmit(false)}
                    className="px-5 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors font-['Poppins']"
                  >
                    Submit Quest
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50 font-['Poppins']"
          >
            ← Prev
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold font-['Poppins']"
          >
            Submit
          </button>
          <button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
            className="flex-1 py-3 bg-[#1E258F] text-white rounded-lg font-medium disabled:opacity-50 font-['Poppins']"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentQuestDetail
