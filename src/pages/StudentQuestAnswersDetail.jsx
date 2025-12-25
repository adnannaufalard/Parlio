import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

function StudentQuestAnswersDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { attemptId } = useParams()
  const [loading, setLoading] = useState(true)
  const [attemptData, setAttemptData] = useState(null)
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState([])

  useEffect(() => {
    fetchAttemptDetails()
  }, [attemptId])

  const fetchAttemptDetails = async () => {
    try {
      setLoading(true)
      console.log('=== Fetching Attempt Details ===')
      console.log('Attempt ID:', attemptId)

      // Fetch attempt details with quest basic info
      const { data: attempt, error: attemptError } = await supabase
        .from('student_quest_attempts')
        .select('*, quests(id, title, description, lesson_id)')
        .eq('id', attemptId)
        .single()

      if (attemptError) {
        console.error('Error fetching attempt:', attemptError)
        throw attemptError
      }
      if (!attempt) {
        console.error('Attempt not found')
        toast.error('Data percobaan tidak ditemukan')
        navigate(-1)
        return
      }

      console.log('Attempt data:', attempt)
      console.log('Quest ID:', attempt.quests?.id)
      console.log('User answers:', attempt.user_answers)
      setAttemptData(attempt)

      // Fetch quest questions separately
      const { data: questQuestions, error: qqError} = await supabase
        .from('quest_questions')
        .select('id, question_id, question_order')
        .eq('quest_id', attempt.quests.id)
        .order('question_order', { ascending: true })

      if (qqError) {
        console.error('Error fetching quest questions:', qqError)
        throw qqError
      }
      console.log('Quest questions:', questQuestions)

      // Fetch questions details
      const questionIds = questQuestions.map(qq => qq.question_id)
      console.log('Question IDs:', questionIds)
      
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_answer, question_type, question_image_url, question_audio_url, question_video_url')
        .in('id', questionIds)

      if (questionsError) {
        console.error('Error fetching questions:', questionsError)
        throw questionsError
      }
      console.log('Questions data:', questions)

      // Create a map for easier lookup
      const questionsMap = {}
      questions.forEach(q => {
        questionsMap[q.id] = q
      })
      console.log('Questions map keys:', Object.keys(questionsMap))

      // Parse user answers
      const userAnswers = attempt.user_answers || {}
      console.log('User answers count:', Object.keys(userAnswers).length)
      console.log('User answers keys:', Object.keys(userAnswers))
      console.log('User answers full:', userAnswers)
      
      // Check if user_answers is empty (column might not exist yet)
      if (Object.keys(userAnswers).length === 0) {
        console.warn('User answers is empty - migration might not be run')
        toast.error('Data jawaban belum tersedia. Silakan jalankan migration database terlebih dahulu.')
        navigate(-1)
        return
      }
      
      // Get questions and combine with user answers
      const questionsWithAnswers = questQuestions.map((qq, index) => {
        const question = questionsMap[qq.question_id]
        if (!question) return null
        
        // Parse options from JSONB
        let parsedOptions = null
        if (question.options) {
          let rawOptions = question.options
          
          // If it's a string, parse it
          if (typeof rawOptions === 'string') {
            try {
              rawOptions = JSON.parse(rawOptions)
            } catch (e) {
              console.error('Failed to parse options:', e)
            }
          }
          
          // Convert array format to object format
          if (Array.isArray(rawOptions)) {
            parsedOptions = {}
            const letters = ['A', 'B', 'C', 'D', 'E', 'F']
            rawOptions.forEach((option, idx) => {
              if (option.text) {
                parsedOptions[letters[idx]] = option.text
              }
            })
          } else if (typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
            parsedOptions = rawOptions
          }
        }
        
        // IMPORTANT: Use quest_question.id (qq.id) as key, NOT question.id!
        // Because in StudentQuestDetail, we save with qq.id as key
        let userAnswer = userAnswers[qq.id]
        
        // If not found, try with string key
        if (userAnswer === undefined) {
          userAnswer = userAnswers[String(qq.id)]
        }
        
        // If still not found, try with number key
        if (userAnswer === undefined) {
          userAnswer = userAnswers[Number(qq.id)]
        }
        
        console.log(`Question ${question.id} (QQ ID: ${qq.id}) matching:`)
        console.log(`  Quest Question ID: ${qq.id} (type: ${typeof qq.id})`)
        console.log(`  Question ID: ${question.id} (type: ${typeof question.id})`)
        console.log(`  Using QQ ID as key: ${qq.id}`)
        console.log(`  User answer found: "${userAnswer}" (type: ${typeof userAnswer})`)
        console.log(`  Direct lookup [${qq.id}]:`, userAnswers[qq.id])
        console.log(`  String lookup ["${qq.id}"]:`, userAnswers[String(qq.id)])
        console.log(`  Number lookup [${Number(qq.id)}]:`, userAnswers[Number(qq.id)])
        
        // Determine if answer is correct
        let isCorrect = false
        let userAnswerLetter = null
        
        if (userAnswer !== undefined && userAnswer !== null) {
          // Handle both letter (A/B/C/D) and number (0/1/2/3) formats
          if (typeof userAnswer === 'string') {
            userAnswerLetter = userAnswer.toUpperCase()
          } else if (typeof userAnswer === 'number') {
            const letterMap = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' }
            userAnswerLetter = letterMap[userAnswer]
          }
          
          // Check correctness
          let correctAnswerLetter = question.correct_answer
          
          // Handle correct_answer format conversion
          if (typeof correctAnswerLetter === 'number') {
            const letterMap = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' }
            correctAnswerLetter = letterMap[correctAnswerLetter]
          } else if (typeof correctAnswerLetter === 'string' && parsedOptions) {
            // If correct_answer is actual text, find the letter
            if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(correctAnswerLetter)) {
              const foundKey = Object.entries(parsedOptions).find(
                ([key, value]) => value === correctAnswerLetter
              )?.[0]
              if (foundKey) {
                correctAnswerLetter = foundKey
              }
            }
          }
          
          // Alternative: find from options array (is_correct: true)
          if (!correctAnswerLetter && Array.isArray(question.options)) {
            const correctIdx = question.options.findIndex(opt => opt.is_correct === true)
            if (correctIdx !== -1) {
              const letters = ['A', 'B', 'C', 'D', 'E', 'F']
              correctAnswerLetter = letters[correctIdx]
            }
          }
          
          isCorrect = userAnswerLetter === correctAnswerLetter?.toUpperCase()
        }

        return {
          number: index + 1,
          id: question.id,
          text: question.question_text,
          options: parsedOptions || {},
          correctAnswer: question.correct_answer,
          userAnswer: userAnswerLetter,
          isCorrect,
          // Media files
          question_image_url: question.question_image_url || null,
          question_audio_url: question.question_audio_url || null,
          question_video_url: question.question_video_url || null,
          question_type: question.question_type || 'multiple_choice'
        }
      }).filter(q => q !== null)

      console.log('Questions with answers:', questionsWithAnswers)
      console.log('Total questions:', questionsWithAnswers.length)
      
      setQuestionsWithAnswers(questionsWithAnswers)
      setLoading(false)
      console.log('✅ Successfully loaded attempt details')
    } catch (error) {
      console.error('❌ Error fetching attempt details:', error)
      console.error('Error details:', error.message || error)
      toast.error('Gagal memuat detail jawaban')
      navigate(-1)
    }
  }

  const handleBack = () => {
    // Navigate back to lesson detail with quest tab active
    if (attemptData?.quests?.lesson_id) {
      navigate(`/student/lesson/${attemptData.quests.lesson_id}`, { 
        state: { activeTab: 'quest' } 
      })
    } else {
      navigate(-1)
    }
  }

  if (loading) {
    return (
      <StudentLayout showHeader={true} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4">
              <DotLottieReact
                src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
                loop
                autoplay
              />
            </div>
            <p className="text-gray-500 font-['Poppins']">Memuat detail jawaban...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  const correctCount = questionsWithAnswers.filter(q => q.isCorrect).length
  const wrongCount = questionsWithAnswers.length - correctCount
  const isPassed = attemptData?.passed || false

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl shadow-lg p-6 mb-6 text-white ${
          isPassed 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold font-['Poppins']">
              Detail Jawaban
            </h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isPassed 
                ? 'bg-white/20 backdrop-blur-sm' 
                : 'bg-white/20 backdrop-blur-sm'
            }`}>
              {isPassed ? '✓ LULUS' : '✗ TIDAK LULUS'}
            </span>
          </div>
          
          <h2 className="text-lg font-semibold mb-4 font-['Poppins']">
            {attemptData?.quests?.title}
          </h2>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold font-['Poppins']">
                {Math.round(attemptData?.percentage || 0)}%
              </div>
              <div className="text-xs text-white/80 font-['Poppins']">
                Skor
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-200 font-['Poppins']">
                {correctCount}
              </div>
              <div className="text-xs text-white/80 font-['Poppins']">
                Benar
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-200 font-['Poppins']">
                {wrongCount}
              </div>
              <div className="text-xs text-white/80 font-['Poppins']">
                Salah
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4 mb-6">
          {questionsWithAnswers.map((question) => (
            <div 
              key={question.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                question.isCorrect 
                  ? 'border-green-200' 
                  : 'border-red-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white ${
                    question.isCorrect 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}>
                    {question.number}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium font-['Poppins'] leading-relaxed">
                      {question.text}
                    </p>
                  </div>
                </div>
                <span className={`flex-shrink-0 ml-3 px-3 py-1 rounded-full text-sm font-semibold ${
                  question.isCorrect 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {question.isCorrect ? '✓ Benar' : '✗ Salah'}
                </span>
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

              {/* Options */}
              <div className="space-y-2">
                {Object.entries(question.options).map(([letter, text]) => {
                  const isUserAnswer = question.userAnswer === letter
                  const isCorrectAnswer = (() => {
                    if (typeof question.correctAnswer === 'string') {
                      return question.correctAnswer.toUpperCase() === letter
                    } else if (typeof question.correctAnswer === 'number') {
                      const letterMap = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' }
                      return letterMap[question.correctAnswer] === letter
                    }
                    return false
                  })()

                  let optionClass = 'bg-gray-50 border-gray-200'
                  let labelClass = 'bg-gray-200 text-gray-700'
                  let icon = null

                  if (isUserAnswer && question.isCorrect) {
                    // User answered correctly
                    optionClass = 'bg-green-50 border-green-300 ring-2 ring-green-200'
                    labelClass = 'bg-green-500 text-white'
                    icon = '✓'
                  } else if (isUserAnswer && !question.isCorrect) {
                    // User answered incorrectly
                    optionClass = 'bg-red-50 border-red-300 ring-2 ring-red-200'
                    labelClass = 'bg-red-500 text-white'
                    icon = '✗'
                  } else if (!question.isCorrect && isCorrectAnswer) {
                    // Show correct answer only if user was wrong
                    optionClass = 'bg-green-50 border-green-300'
                    labelClass = 'bg-green-500 text-white'
                    icon = '✓'
                  }

                  return (
                    <div 
                      key={letter}
                      className={`border-2 rounded-lg p-4 transition-all ${optionClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold ${labelClass}`}>
                          {letter}
                        </span>
                        <span className="flex-1 text-gray-900 font-['Poppins']">
                          {text}
                        </span>
                        {icon && (
                          <span className="flex-shrink-0 text-lg">
                            {icon}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Answer Explanation */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                {question.isCorrect ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium font-['Poppins']">
                      Jawaban kamu benar! ({question.userAnswer})
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium font-['Poppins']">
                        Jawaban kamu salah. Kamu menjawab: {question.userAnswer || '(Tidak dijawab)'}
                      </span>
                    </div>
                    <div className="ml-7 text-sm text-gray-600 font-['Poppins']">
                      Jawaban yang benar ditandai dengan warna hijau di atas.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 mt-6">
          <button
            onClick={handleBack}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all font-['Poppins']"
          >
            Kembali ke Lesson
          </button>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentQuestAnswersDetail
