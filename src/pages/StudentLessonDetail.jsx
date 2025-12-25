import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import UserInfoHeader from '../components/UserInfoHeader'
import toast from 'react-hot-toast'

// Video Preview Component
function VideoPreview({ url, className = "" }) {
  const getEmbedUrl = (url) => {
    try {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      const match = url.match(youtubeRegex)
      
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
      
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
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`} style={{ paddingBottom: '56.25%' }}>
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

// Material Preview Modal Component
function MaterialPreviewModal({ material, onClose, onOpenQuest, quest, questCompleted }) {
  if (!material) return null

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'pdf': return '📄'
      case 'link': return '🔗'
      case 'text': return '📝'
      default: return '📚'
    }
  }

  const openInNewTab = () => {
    if (material.file_url) {
      window.open(material.file_url, '_blank')
    } else if (material.external_url) {
      window.open(material.external_url, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-[#1E258F] text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm text-2xl">
                {getMaterialIcon(material.material_type)}
              </div>
              <div>
                <h3 className="text-lg font-bold font-['Poppins']">
                  {material.title}
                </h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-['Poppins']">
                  {material.material_type === 'text' ? 'Text' :
                   material.material_type === 'video' ? 'Video' :
                   material.material_type === 'pdf' ? 'PDF' :
                   material.material_type === 'link' ? 'Link' :
                   material.material_type}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Description */}
          {material.description && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2 font-['Poppins']">
                <span>📋</span> Penjelasan dari Guru
              </h4>
              <p className="text-sm text-blue-700 leading-relaxed font-['Poppins'] whitespace-pre-wrap">
                {material.description}
              </p>
            </div>
          )}

          {/* Content Preview */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 font-['Poppins']">
              Preview Materi
            </h4>
            
            {material.material_type === 'text' && material.content && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div 
                  className="text-gray-700 leading-relaxed font-['Poppins'] whitespace-pre-wrap prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: material.content }}
                />
              </div>
            )}

            {material.material_type === 'video' && material.file_url && (
              <VideoPreview url={material.file_url} />
            )}

            {material.material_type === 'link' && (
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
                <div className="text-5xl mb-3">🔗</div>
                <p className="text-sm text-gray-600 mb-4 font-['Poppins']">Link eksternal ke materi</p>
                <button
                  onClick={() => window.open(material.external_url || material.file_url, '_blank')}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors font-['Poppins']"
                >
                  <span>Buka Link</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            )}

            {material.material_type === 'pdf' && material.file_url && (
              <div className="space-y-3">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  <iframe
                    src={material.file_url}
                    className="w-full h-full"
                    title={material.title}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
          {/* Open in new tab button */}
          {(material.file_url || material.external_url) && material.material_type !== 'text' && (
            <button
              onClick={openInNewTab}
              className="w-full py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 font-['Poppins']"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Buka di Tab Baru</span>
            </button>
          )}
          
          {/* Quest button - only show if quest exists */}
          {quest && (
            <button
              onClick={() => onOpenQuest(quest)}
              className={`w-full py-3 px-4 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 font-['Poppins'] ${
                questCompleted 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-[#1E258F] hover:bg-[#161d6f] text-white'
              }`}
            >
              <span className="text-lg">{questCompleted ? '✓' : '🎯'}</span>
              <span>{questCompleted ? 'Quest Sudah Selesai - Kerjakan Lagi' : 'Kerjakan Quest'}</span>
            </button>
          )}

          {!quest && (
            <div className="text-center py-2 text-sm text-gray-500 font-['Poppins']">
              <span className="text-lg mr-2">📝</span>
              Belum ada quest untuk materi ini
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Quest Confirmation Modal
function QuestConfirmModal({ quest, attemptCount, attemptHistory, onClose, onStart }) {
  const [showHistory, setShowHistory] = useState(false)
  
  if (!quest) return null

  const maxAttempts = quest.max_attempts || 3
  const remainingAttempts = maxAttempts - attemptCount

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header - Fixed */}
        <div className="bg-[#1E258F] text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm text-xl">
                🎯
              </div>
              <div>
                <h3 className="text-base font-bold font-['Poppins'] line-clamp-1">
                  {quest.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {quest.questionCount || 0} Soal
                  </span>
                  <span className="text-xs bg-amber-400/30 px-2 py-0.5 rounded-full">
                    {remainingAttempts}/{maxAttempts} tersisa
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Confirmation Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800 font-semibold font-['Poppins'] flex items-center gap-2">
              <span>⚠️</span>
              Yakin ingin mengerjakan quest sekarang?
            </p>
          </div>

          {/* Quest Info - Grid Layout */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-2 font-['Poppins']">📋 Informasi Quest</h4>
            <div className="grid grid-cols-2 gap-2">
              {quest.time_limit_minutes && (
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="text-lg font-bold text-red-600 font-['Poppins']">⏱️ {quest.time_limit_minutes}</div>
                  <div className="text-xs text-gray-500 font-['Poppins']">menit</div>
                </div>
              )}
              <div className="bg-white rounded-lg p-2 border border-gray-100">
                <div className="text-lg font-bold text-purple-600 font-['Poppins']">🔄 {maxAttempts}x</div>
                <div className="text-xs text-gray-500 font-['Poppins']">maks percobaan</div>
              </div>
              {quest.poin_per_soal && (
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="text-lg font-bold text-blue-600 font-['Poppins']">💯 {quest.poin_per_soal}</div>
                  <div className="text-xs text-gray-500 font-['Poppins']">poin/soal</div>
                </div>
              )}
              {quest.min_points && (
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="text-lg font-bold text-green-600 font-['Poppins']">🎯 {quest.min_points}</div>
                  <div className="text-xs text-gray-500 font-['Poppins']">min. poin lulus</div>
                </div>
              )}
              {quest.xp_reward && (
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="text-lg font-bold text-amber-600 font-['Poppins']">⚡ {quest.xp_reward}</div>
                  <div className="text-xs text-gray-500 font-['Poppins']">XP reward</div>
                </div>
              )}
              {quest.coins_reward && (
                <div className="bg-white rounded-lg p-2 border border-gray-100">
                  <div className="text-lg font-bold text-yellow-600 font-['Poppins']">🪙 {quest.coins_reward}</div>
                  <div className="text-xs text-gray-500 font-['Poppins']">koin reward</div>
                </div>
              )}
            </div>
          </div>

          {/* Attempt History Section */}
          {attemptHistory && attemptHistory.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700 font-['Poppins'] flex items-center gap-2">
                  <span>📊</span> Histori Pengerjaan ({attemptHistory.length})
                </span>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform ${showHistory ? 'rotate-180' : ''}`} 
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showHistory && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {attemptHistory.map((attempt, idx) => {
                    const attemptPassed = attempt.passed || (attempt.percentage >= (quest.min_score_to_pass || 70))
                    const formatDateTime = (dateString) => {
                      if (!dateString) return '-'
                      const date = new Date(dateString)
                      return date.toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }
                    
                    return (
                      <div 
                        key={attempt.id || idx}
                        className={`bg-white rounded-lg p-3 border ${attemptPassed ? 'border-green-200' : 'border-red-200'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              attemptPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {attemptPassed ? 'LULUS' : 'GAGAL'}
                            </span>
                            <span className="text-xs font-medium text-gray-600 font-['Poppins']">
                              #{attempt.attempt_number}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-['Poppins']">
                            {formatDateTime(attempt.completed_at)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1 text-center">
                          <div>
                            <div className="text-sm font-bold text-gray-800 font-['Poppins']">
                              {Math.round(attempt.percentage || 0)}%
                            </div>
                            <div className="text-[10px] text-gray-400 font-['Poppins']">Skor</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-800 font-['Poppins']">
                              {attempt.score || 0}
                            </div>
                            <div className="text-[10px] text-gray-400 font-['Poppins']">Poin</div>
                          </div>
                          <div>
                            <div className={`text-sm font-bold font-['Poppins'] ${attempt.xp_earned > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                              {attempt.xp_earned > 0 ? `+${attempt.xp_earned}` : '-'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-['Poppins']">XP</div>
                          </div>
                          <div>
                            <div className={`text-sm font-bold font-['Poppins'] ${attempt.coins_earned > 0 ? 'text-yellow-600' : 'text-gray-300'}`}>
                              {attempt.coins_earned > 0 ? `+${attempt.coins_earned}` : '-'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-['Poppins']">Koin</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          {quest.time_limit_minutes && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-3">
              <p className="text-xs text-red-700 font-['Poppins'] flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span><b>Perhatian:</b> Timer dimulai saat klik "Kerjakan"!</span>
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer - Fixed */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors font-['Poppins'] text-sm"
            >
              Batal
            </button>
            <button
              onClick={onStart}
              className="flex-1 px-4 py-2.5 bg-[#1E258F] hover:bg-[#161d6f] text-white font-semibold rounded-lg transition-all font-['Poppins'] text-sm"
            >
              Kerjakan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentLessonDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lessonId } = useParams()
  const [loading, setLoading] = useState(true)
  const [lesson, setLesson] = useState(null)
  const [materials, setMaterials] = useState([])
  const [questsMap, setQuestsMap] = useState({}) // Map material_id -> quest
  const [questCompletions, setQuestCompletions] = useState({})
  const [questAttemptCounts, setQuestAttemptCounts] = useState({})
  const [questAttemptHistory, setQuestAttemptHistory] = useState({}) // Map quest_id -> attempts array
  
  // Modal states
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [selectedQuest, setSelectedQuest] = useState(null)
  const [showQuestConfirm, setShowQuestConfirm] = useState(false)

  useEffect(() => {
    if (lessonId) {
      fetchLessonData()
      fetchMaterials()
      fetchQuests()
    }
  }, [lessonId])

  const fetchLessonData = async () => {
    try {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*, chapter_id')
        .eq('id', lessonId)
        .single()

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError)
        toast.error('Lesson tidak ditemukan')
        navigate('/student/classes', { replace: true })
        return
      }

      setLesson(lessonData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching lesson data:', error)
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

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
        setMaterials(data || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      setMaterials([])
    }
  }

  const fetchQuests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get all quests for this lesson with question count
      const { data: questsData, error: questsError } = await supabase
        .from('quests')
        .select(`
          *,
          quest_questions(id)
        `)
        .eq('lesson_id', lessonId)

      if (questsError) {
        console.error('Error fetching quests:', questsError)
        return
      }

      if (!questsData || questsData.length === 0) {
        return
      }

      // Create map of material_id -> quest
      const qMap = {}
      questsData.forEach(quest => {
        if (quest.material_id) {
          qMap[quest.material_id] = {
            ...quest,
            questionCount: quest.quest_questions?.length || 0
          }
        }
      })
      setQuestsMap(qMap)

      // Fetch completions and history
      if (user) {
        const questIds = questsData.map(q => q.id)
        
        // Get all attempts with full details
        const { data: attempts } = await supabase
          .from('student_quest_attempts')
          .select('*')
          .eq('student_id', user.id)
          .in('quest_id', questIds)
          .order('attempt_number', { ascending: false })

        if (attempts) {
          const completionMap = {}
          const countMap = {}
          const historyMap = {}
          
          attempts.forEach(attempt => {
            if (attempt.passed) {
              completionMap[attempt.quest_id] = true
            }
            countMap[attempt.quest_id] = (countMap[attempt.quest_id] || 0) + 1
            
            // Build history array per quest
            if (!historyMap[attempt.quest_id]) {
              historyMap[attempt.quest_id] = []
            }
            historyMap[attempt.quest_id].push(attempt)
          })
          
          setQuestCompletions(completionMap)
          setQuestAttemptCounts(countMap)
          setQuestAttemptHistory(historyMap)
        }
      }
    } catch (error) {
      console.error('Error fetching quests:', error)
    }
  }

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material)
    setShowMaterialModal(true)
  }

  const handleOpenQuest = (quest) => {
    setSelectedQuest(quest)
    setShowMaterialModal(false)
    setShowQuestConfirm(true)
  }

  const handleStartQuest = () => {
    if (selectedQuest) {
      setShowQuestConfirm(false)
      navigate(`/student/quest/${selectedQuest.id}`)
    }
  }

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'pdf': return '📄'
      case 'link': return '🔗'
      case 'text': return '📝'
      default: return '📚'
    }
  }

  if (loading) {
    return (
      <StudentLayout showHeader={true} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Poppins']">Memuat materi...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  // Function to navigate back to chapter detail
  const handleBackToChapter = () => {
    if (lesson?.chapter_id) {
      navigate(`/student/chapters/${lesson.chapter_id}`, {
        state: { classId: location.state?.classId }
      })
    } else {
      navigate('/student/chapters')
    }
  }

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      {/* User Info Header */}
      <UserInfoHeader />

      {/* Header */}
      <div className="bg-[#1E258F] rounded-2xl shadow-lg mb-6 overflow-hidden">
        <div className="p-6">
          <button
            onClick={handleBackToChapter}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-['Poppins']"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Kembali</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <span className="text-3xl">📖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-['Poppins']">{lesson?.title}</h1>
              {lesson?.description && (
                <p className="text-sm text-white/70 mt-1 font-['Poppins'] line-clamp-2">{lesson?.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-semibold text-gray-800 font-['Poppins'] flex items-center gap-2">
            <span>📚</span> Daftar Materi
          </h3>
          <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium font-['Poppins']">
            {materials.length} Materi
          </span>
        </div>

        {materials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Materi</h3>
            <p className="text-sm text-gray-600 font-['Poppins']">
              Guru belum menambahkan materi untuk sub bab ini
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material, index) => {
              const quest = questsMap[material.id]
              const isQuestCompleted = quest ? questCompletions[quest.id] : false
              
              return (
                <div 
                  key={material.id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border cursor-pointer ${
                    isQuestCompleted ? 'border-green-200' : 'border-gray-100 hover:border-blue-200'
                  }`}
                  onClick={() => handleMaterialClick(material)}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Number Badge */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        isQuestCompleted 
                          ? 'bg-green-100' 
                          : 'bg-blue-50'
                      }`}>
                        {getMaterialIcon(material.material_type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-['Poppins']">Materi {index + 1}</span>
                          {isQuestCompleted && (
                            <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium font-['Poppins']">
                              ✓ Quest Selesai
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-800 line-clamp-1 font-['Poppins']">
                          {material.title}
                        </h3>
                        
                        {material.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-['Poppins']">
                            {material.description}
                          </p>
                        )}
                        
                        {/* Meta info */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium font-['Poppins']">
                            {material.material_type === 'text' ? '📝 Text' :
                             material.material_type === 'video' ? '🎥 Video' :
                             material.material_type === 'pdf' ? '📄 PDF' :
                             material.material_type === 'link' ? '🔗 Link' :
                             '📚 ' + material.material_type}
                          </span>
                          {quest && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium font-['Poppins']">
                              🎯 Ada Quest ({quest.questionCount} soal)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Material Preview Modal */}
      {showMaterialModal && selectedMaterial && (
        <MaterialPreviewModal
          material={selectedMaterial}
          onClose={() => {
            setShowMaterialModal(false)
            setSelectedMaterial(null)
          }}
          onOpenQuest={handleOpenQuest}
          quest={questsMap[selectedMaterial.id]}
          questCompleted={questsMap[selectedMaterial.id] ? questCompletions[questsMap[selectedMaterial.id].id] : false}
        />
      )}

      {/* Quest Confirmation Modal */}
      {showQuestConfirm && selectedQuest && (
        <QuestConfirmModal
          quest={selectedQuest}
          attemptCount={questAttemptCounts[selectedQuest.id] || 0}
          attemptHistory={questAttemptHistory[selectedQuest.id] || []}
          onClose={() => {
            setShowQuestConfirm(false)
            setSelectedQuest(null)
          }}
          onStart={handleStartQuest}
        />
      )}
    </StudentLayout>
  )
}

export default StudentLessonDetail
