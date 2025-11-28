import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'

// Video Preview Component
function VideoPreview({ url }) {
  // Convert YouTube URL to embed or handle direct video files
  const getEmbedUrl = (url) => {
    try {
      // YouTube patterns
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      const match = url.match(youtubeRegex)
      
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
      
      // If already embed or direct video URL
      if (url.includes('youtube.com/embed/') || url.includes('.mp4') || url.includes('.webm')) {
        return url
      }
      
      return url
    } catch (error) {
      return url
    }
  }

  const embedUrl = getEmbedUrl(url)
  const isYouTube = embedUrl.includes('youtube.com/embed/')

  return (
    <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
      {isYouTube ? (
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          src={embedUrl}
          controls
          className="absolute top-0 left-0 w-full h-full"
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  )
}

function StudentLessonDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lessonId} = useParams()
  const [loading, setLoading] = useState(true)
  const [lesson, setLesson] = useState(null)
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'material') // 'material', 'quest'
  const [materials, setMaterials] = useState([])
  const [quests, setQuests] = useState([]) // Changed from questions to quests (array of quests with their questions)
  const [questCompletions, setQuestCompletions] = useState({}) // Track which quests are completed
  const [questAttemptCounts, setQuestAttemptCounts] = useState({}) // Track attempt counts per quest
  const [selectedQuest, setSelectedQuest] = useState(null) // For modal
  const [showQuestModal, setShowQuestModal] = useState(false) // Show/hide modal
  const [showHistoryModal, setShowHistoryModal] = useState(false) // Show/hide history modal
  const [questHistory, setQuestHistory] = useState([]) // History data

  useEffect(() => {
    if (lessonId) {
      fetchLessonData()
      fetchMaterials()
    }
  }, [lessonId])

  useEffect(() => {
    if (activeTab === 'quest' && lessonId) {
      fetchQuestions()
      fetchQuestCompletions()
      fetchQuestAttemptCounts()
    }
  }, [activeTab, lessonId])

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('material_order', { ascending: true })

      if (error) {
        console.error('Error fetching materials:', error)
        setMaterials([])
      } else {
        console.log('Materials loaded:', data?.length || 0)
        console.log('Materials data:', data)
        setMaterials(data || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      setMaterials([])
    }
  }

  const fetchLessonData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get lesson info
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError)
        toast.error('Lesson tidak ditemukan')
        navigate(-1)
        return
      }

      console.log('Lesson data loaded:', lessonData) // Debug log
      console.log('Content exists:', lessonData?.content ? 'Yes' : 'No')
      console.log('Content length:', lessonData?.content?.length || 0)

      setLesson(lessonData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching lesson data:', error)
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

  const fetchQuestCompletions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all passed attempts for quests in this lesson
      const { data: attempts, error } = await supabase
        .from('student_quest_attempts')
        .select('quest_id, passed')
        .eq('student_id', user.id)
        .eq('passed', true)

      if (!error && attempts) {
        // Create a map of quest_id -> passed status
        const completionMap = {}
        attempts.forEach(attempt => {
          completionMap[attempt.quest_id] = true
        })
        setQuestCompletions(completionMap)
      }
    } catch (error) {
      console.error('Error fetching quest completions:', error)
    }
  }

  const fetchQuestAttemptCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all attempts count for each quest
      const { data: attempts, error } = await supabase
        .from('student_quest_attempts')
        .select('quest_id')
        .eq('student_id', user.id)

      if (!error && attempts) {
        // Count attempts per quest_id
        const countMap = {}
        attempts.forEach(attempt => {
          countMap[attempt.quest_id] = (countMap[attempt.quest_id] || 0) + 1
        })
        setQuestAttemptCounts(countMap)
        
        console.log('Quest attempt counts:', countMap)
      }
    } catch (error) {
      console.error('Error fetching quest attempt counts:', error)
    }
  }

  const fetchQuestHistory = async (questId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get quest details to know total questions and points per question
      const { data: questData, error: questError } = await supabase
        .from('quests')
        .select(`
          *,
          quest_questions(id)
        `)
        .eq('id', questId)
        .single()

      if (questError) {
        console.error('Error fetching quest:', questError)
        toast.error('Gagal memuat data quest')
        return
      }

      const totalQuestions = questData?.quest_questions?.length || 0

      // Get attempts
      const { data: attempts, error } = await supabase
        .from('student_quest_attempts')
        .select('*')
        .eq('student_id', user.id)
        .eq('quest_id', questId)
        .order('attempt_number', { ascending: true })

      if (!error && attempts) {
        // Calculate correct/wrong answers for each attempt
        const attemptsWithDetails = attempts.map(attempt => {
          // Calculate based on score and max_score
          // If max_score = 50 and score = 40, and there are 5 questions
          // Points per question = 50 / 5 = 10
          // Correct answers = 40 / 10 = 4
          const pointsPerQuestion = totalQuestions > 0 ? attempt.max_score / totalQuestions : 0
          const correctAnswers = pointsPerQuestion > 0 ? Math.round(attempt.score / pointsPerQuestion) : 0
          const wrongAnswers = totalQuestions - correctAnswers

          console.log(`=== Attempt #${attempt.attempt_number} Calculation ===`)
          console.log('Total Questions:', totalQuestions)
          console.log('Max Score:', attempt.max_score)
          console.log('Actual Score:', attempt.score)
          console.log('Points per Question:', pointsPerQuestion)
          console.log('Correct Answers:', correctAnswers)
          console.log('Wrong Answers:', wrongAnswers)

          return {
            ...attempt,
            totalQuestions,
            correctAnswers,
            wrongAnswers
          }
        })

        setQuestHistory(attemptsWithDetails)
        setShowHistoryModal(true)
      }
    } catch (error) {
      console.error('Error fetching quest history:', error)
      toast.error('Gagal memuat histori')
    }
  }

  const fetchQuestions = async () => {
    try {
      // Get quests with full details for this lesson
      const { data: questsData, error: questsError } = await supabase
        .from('quests')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true })

      if (questsError) {
        console.error('Error fetching quests:', questsError)
        setQuests([])
        return
      }

      if (!questsData || questsData.length === 0) {
        console.log('No quests found for this lesson')
        setQuests([])
        return
      }

      console.log('Quests found:', questsData.length)

      // For each quest, get its questions
      const questsWithQuestions = await Promise.all(
        questsData.map(async (quest) => {
          const { data: questQuestions, error: qqError } = await supabase
            .from('quest_questions')
            .select(`
              *,
              question:questions(*)
            `)
            .eq('quest_id', quest.id)
            .order('question_order', { ascending: true })

          if (qqError) {
            console.error('Error fetching questions for quest:', quest.id, qqError)
            return { ...quest, questions: [] }
          }

          console.log(`Quest "${quest.title}" has ${questQuestions?.length || 0} questions`)
          if (questQuestions && questQuestions.length > 0) {
            console.log('Sample question data:', questQuestions[0])
            console.log('Sample options RAW:', questQuestions[0]?.question?.options)
            console.log('Options type:', typeof questQuestions[0]?.question?.options)
          }

          // Map questions with proper structure
          const mappedQuestions = (questQuestions || []).map(qq => {
            let parsedOptions = null
            
            // Handle options - it might be stored as JSON string or already as object
            if (qq.question?.options) {
              let rawOptions = qq.question.options
              
              // Parse if string
              if (typeof rawOptions === 'string') {
                try {
                  rawOptions = JSON.parse(rawOptions)
                } catch (e) {
                  console.error('Failed to parse options:', e)
                }
              }
              
              // Convert array format to object format
              if (Array.isArray(rawOptions)) {
                // Format: [{text: "...", is_correct: true/false}, ...]
                // Convert to: {A: "...", B: "...", C: "...", D: "..."}
                parsedOptions = {}
                const letters = ['A', 'B', 'C', 'D', 'E', 'F']
                rawOptions.forEach((option, index) => {
                  if (option.text) {
                    parsedOptions[letters[index]] = option.text
                  }
                })
                console.log('Converted array options to object:', parsedOptions)
              } else if (typeof rawOptions === 'object' && !Array.isArray(rawOptions)) {
                // Already in correct format
                parsedOptions = rawOptions
                console.log('Options already in object format:', parsedOptions)
              }
            }

            return {
              id: qq.id,
              question_text: qq.question?.question_text || '',
              question_type: qq.question?.question_type || '',
              options: parsedOptions,
              correct_answer: qq.question?.correct_answer,
              points: qq.points_override || qq.question?.points || 0,
              question_order: qq.question_order
            }
          })

          return {
            ...quest,
            questions: mappedQuestions
          }
        })
      )

      console.log('Processed quests:', questsWithQuestions)
      setQuests(questsWithQuestions)
    } catch (error) {
      console.error('Error fetching questions:', error)
      setQuests([])
    }
  }

  const handleQuestClick = (quest) => {
    setSelectedQuest(quest)
    setShowQuestModal(true)
  }

  const handleStartQuest = () => {
    if (selectedQuest) {
      setShowQuestModal(false)
      navigate(`/student/quest/${selectedQuest.id}`)
    }
  }

  if (loading) {
    return (
      <StudentLayout showHeader={true} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Poppins']">Memuat lesson...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors bg-white hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 font-['Poppins']"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Kembali</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('material')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all font-['Poppins'] ${
              activeTab === 'material'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📚 Materi
          </button>
          <button
            onClick={() => setActiveTab('quest')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all font-['Poppins'] ${
              activeTab === 'quest'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🎯 Quest
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'material' && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span className="text-xl">📚</span> 
            <span>Materi Pembelajaran</span>
          </h3>
          
          {materials.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Materi</h3>
              <p className="text-sm text-gray-600 font-['Poppins']">
                Guru belum menambahkan materi untuk lesson ini
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material, index) => (
                <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-semibold font-['Poppins']">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 mb-2 font-['Poppins']">
                        {material.title}
                      </h4>
                      {material.description && (
                        <p className="text-sm text-gray-600 mb-3 font-['Poppins']">
                          {material.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium border border-blue-100 font-['Poppins']">
                      {material.material_type === 'text' ? '📝 Text' :
                       material.material_type === 'video' ? '🎥 Video' :
                       material.material_type === 'pdf' ? '📄 PDF' :
                       material.material_type === 'link' ? '🔗 Link' :
                       '📚 ' + material.material_type}
                    </span>
                  </div>

                  {/* Material Content */}
                  {material.material_type === 'text' && material.content && (
                    <div className="prose max-w-none">
                      <div 
                        className="text-gray-700 leading-relaxed font-['Poppins'] whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: material.content }}
                      />
                    </div>
                  )}

                  {material.material_type === 'video' && material.file_url && (
                    <VideoPreview url={material.file_url} />
                  )}

                  {material.material_type === 'link' && material.external_url && (
                    <a 
                      href={material.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm font-['Poppins']"
                    >
                      <span>🔗 Buka Link</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {material.material_type === 'pdf' && material.file_url && (
                    <div className="space-y-3">
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                        <iframe
                          src={material.file_url}
                          className="w-full h-full"
                          title={material.title}
                        />
                      </div>
                      <a 
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm font-['Poppins']"
                      >
                        <span>📄 Buka PDF di Tab Baru</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'quest' && (
        <div className="space-y-6">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span className="text-xl">🎯</span> 
            <span>Quest - Soal Latihan</span>
          </h3>
          
          {quests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Quest</h3>
              <p className="text-sm text-gray-600 font-['Poppins']">
                Guru belum menambahkan quest untuk lesson ini
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quests.map((quest, questIndex) => {
                const isCompleted = questCompletions[quest.id]
                const attemptCount = questAttemptCounts[quest.id] || 0
                const maxAttempts = quest.max_attempts || 3
                const hasReachedMaxAttempts = attemptCount >= maxAttempts
                const canAttempt = !hasReachedMaxAttempts
                
                return (
                  <div key={quest.id} className={`bg-white rounded-xl shadow-sm border ${hasReachedMaxAttempts && !isCompleted ? 'border-red-200' : 'border-gray-100'} ${canAttempt ? 'hover:shadow-md hover:border-purple-300' : ''} transition-all relative overflow-hidden`}>
                    {/* Completion Badge - Ribbon Style */}
                    {isCompleted && (
                      <div className="absolute top-0 right-0 z-10">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-4 py-1.5 text-xs font-bold shadow-lg flex items-center gap-1 font-['Poppins']"
                          style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 10% 100%)'
                          }}>
                          <span>✓</span>
                          <span>LULUS</span>
                        </div>
                      </div>
                    )}

                    {/* Max Attempts Badge - Only show if reached max and not completed */}
                    {hasReachedMaxAttempts && !isCompleted && (
                      <div className="absolute top-0 left-0 z-10">
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white px-4 py-1.5 text-xs font-bold shadow-lg flex items-center gap-1 font-['Poppins']"
                          style={{
                            clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)'
                          }}>
                          <span>🚫</span>
                          <span>BATAS TERCAPAI</span>
                        </div>
                      </div>
                    )}

                    {/* Main Quest Card - Clickable only if can attempt */}
                    <button
                      onClick={() => canAttempt ? handleQuestClick(quest) : toast.error(`Batas maksimal percobaan (${maxAttempts}x) telah tercapai. Hanya bisa melihat histori.`, { duration: 4000 })}
                      disabled={!canAttempt}
                      className={`w-full p-6 text-left group ${!canAttempt ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`flex-shrink-0 w-12 h-12 ${isCompleted ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-purple-500 to-blue-500'} text-white rounded-xl flex items-center justify-center font-bold text-lg font-['Poppins'] shadow-sm group-hover:scale-110 transition-transform`}>
                          {isCompleted ? '✓' : questIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-1 font-['Poppins'] group-hover:text-purple-600 transition-colors">
                            {quest.title}
                          </h4>
                          {quest.description && (
                            <p className="text-sm text-gray-600 font-['Poppins'] line-clamp-2">
                              {quest.description}
                            </p>
                          )}
                        </div>
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full font-medium border border-purple-100 font-['Poppins']">
                          📝 {quest.questions?.length || 0} Soal
                        </span>
                        {quest.xp_reward && (
                          <span className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full font-medium border border-amber-100 font-['Poppins']">
                            ⚡ {quest.xp_reward} XP/soal
                          </span>
                        )}
                        {quest.coins_reward && (
                          <span className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full font-medium border border-yellow-100 font-['Poppins']">
                            🪙 {quest.coins_reward} Koin/soal
                          </span>
                        )}
                        {quest.time_limit_minutes && (
                          <span className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-medium border border-red-100 font-['Poppins']">
                            ⏱️ {quest.time_limit_minutes} menit
                          </span>
                        )}
                        {/* Attempt Counter */}
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold border font-['Poppins'] ${
                          hasReachedMaxAttempts 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : attemptCount > 0 
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          🎯 {attemptCount}/{maxAttempts} percobaan
                        </span>
                      </div>
                    </button>

                    {/* History Button - Show if completed OR reached max attempts */}
                    {(isCompleted || hasReachedMaxAttempts) && attemptCount > 0 && (
                      <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            fetchQuestHistory(quest.id)
                          }}
                          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 font-['Poppins']"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          📜 Lihat Histori ({attemptCount}/{maxAttempts})
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quest Confirmation Modal */}
      {showQuestModal && selectedQuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQuestModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-xl font-['Poppins'] shadow-lg">
                🎯
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 font-['Poppins']">
                  {selectedQuest.title}
                </h3>
                {selectedQuest.description && (
                  <p className="text-sm text-gray-600 mt-1 font-['Poppins']">
                    {selectedQuest.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowQuestModal(false)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quest Rules */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border border-purple-100">
              <h4 className="text-sm font-bold text-gray-900 mb-3 font-['Poppins'] flex items-center gap-2">
                <span className="text-lg">📋</span>
                Aturan Quest
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm font-['Poppins']">
                  <span className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base">📝</span>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900">Jumlah Soal:</span>
                    <span className="text-gray-700 ml-1">{selectedQuest.questions?.length || 0} soal</span>
                  </div>
                </div>

                {selectedQuest.time_limit_minutes && (
                  <div className="flex items-center gap-3 text-sm font-['Poppins']">
                    <span className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base">⏱️</span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Batas Waktu:</span>
                      <span className="text-red-600 ml-1 font-semibold">{selectedQuest.time_limit_minutes} menit</span>
                    </div>
                  </div>
                )}

                {selectedQuest.max_attempts && (
                  <div className="flex items-center gap-3 text-sm font-['Poppins']">
                    <span className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base">🔄</span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Maksimal Percobaan:</span>
                      <span className="text-gray-700 ml-1">{selectedQuest.max_attempts}x</span>
                    </div>
                  </div>
                )}

                {selectedQuest.min_score_to_pass && (
                  <div className="flex items-center gap-3 text-sm font-['Poppins']">
                    <span className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base">🎯</span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Nilai Minimal Lulus:</span>
                      <span className="text-gray-700 ml-1">{selectedQuest.min_score_to_pass}%</span>
                    </div>
                  </div>
                )}

                {selectedQuest.xp_reward && (
                  <div className="flex items-center gap-3 text-sm font-['Poppins']">
                    <span className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base">⚡</span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Reward XP:</span>
                      <span className="text-amber-600 ml-1 font-semibold">{selectedQuest.xp_reward} XP</span>
                    </div>
                  </div>
                )}

                {selectedQuest.coins_reward && (
                  <div className="flex items-center gap-3 text-sm font-['Poppins']">
                    <span className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base">🪙</span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Reward Koin:</span>
                      <span className="text-yellow-600 ml-1 font-semibold">{selectedQuest.coins_reward} koin</span>
                    </div>
                  </div>
                )}

                {selectedQuest.unlock_previous_required && (
                  <div className="flex items-center gap-3 text-sm font-['Poppins']">
                    <span className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-base">🔒</span>
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">Syarat:</span>
                      <span className="text-gray-700 ml-1">Harus menyelesaikan quest sebelumnya</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            {selectedQuest.time_limit_minutes && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-700 font-['Poppins'] flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Perhatian:</span> Timer akan dimulai saat Anda klik tombol "Mulai Kerjakan"!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuestModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors font-['Poppins']"
              >
                Kembali
              </button>
              <button
                onClick={handleStartQuest}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transition-all font-['Poppins']"
              >
                Mulai Kerjakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quest History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-['Poppins']">
                      Histori Quest
                    </h3>
                    <p className="text-sm text-white/80 font-['Poppins']">
                      {questHistory.length} percobaan dilakukan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {questHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📋</span>
                  </div>
                  <p className="text-gray-500 font-['Poppins']">Belum ada histori</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questHistory.map((attempt, index) => {
                    const isPassed = attempt.passed
                    const formatDate = (dateString) => {
                      const date = new Date(dateString)
                      return date.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }

                    return (
                      <div
                        key={attempt.id}
                        className={`border-2 rounded-xl p-5 ${
                          isPassed 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        {/* Attempt Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                              isPassed 
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                                : 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                            }`}>
                              {isPassed ? '✓' : '✗'}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 font-['Poppins']">
                                Percobaan ke-{attempt.attempt_number}
                              </h4>
                              <p className="text-xs text-gray-600 font-['Poppins']">
                                {formatDate(attempt.completed_at)}
                              </p>
                            </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                            isPassed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}>
                            {isPassed ? 'LULUS' : 'BELUM LULUS'}
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-2xl font-bold text-purple-600 font-['Poppins']">
                              {Math.round(attempt.percentage)}%
                            </div>
                            <div className="text-xs text-gray-600 font-['Poppins']">Skor</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-2xl font-bold text-blue-600 font-['Poppins']">
                              {attempt.score}/{attempt.max_score}
                            </div>
                            <div className="text-xs text-gray-600 font-['Poppins']">Poin</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-2xl font-bold text-amber-600 font-['Poppins']">
                              {attempt.xp_earned}
                            </div>
                            <div className="text-xs text-gray-600 font-['Poppins']">XP</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-2xl font-bold text-yellow-600 font-['Poppins']">
                              {attempt.coins_earned}
                            </div>
                            <div className="text-xs text-gray-600 font-['Poppins']">Koin</div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 font-['Poppins']">
                          <span className="flex items-center gap-1">
                            ✅ {attempt.correctAnswers || 0} benar
                          </span>
                          <span className="flex items-center gap-1">
                            ❌ {attempt.wrongAnswers || 0} salah
                          </span>
                          <span className="flex items-center gap-1">
                            📝 Total {attempt.totalQuestions || 0} soal
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all font-['Poppins']"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  )
}

export default StudentLessonDetail
