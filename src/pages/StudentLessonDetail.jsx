import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import MediaGallery, { mergeLegacyMedia } from '../components/MediaGallery'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
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
                <h3 className="text-lg font-semibold font-['Poppins']">
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
                <span></span> Penjelasan dari Guru
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
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-3">
                <div 
                  className="text-gray-700 leading-relaxed font-['Poppins'] whitespace-pre-wrap prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: material.content }}
                />
              </div>
            )}

            {/* Render all media files using MediaGallery */}
            <MediaGallery
              mediaFiles={mergeLegacyMedia(material, { file_url: 'file_url' })}
            />
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
              <span className="text-lg">🎯</span>
              <span>{questCompleted ? 'Kerjakan Lagi' : 'Kerjakan Quest'}</span>
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

// Quest Confirmation Modal - simple confirmation
function QuestConfirmModal({ quest, attemptCount, attemptHistory, onClose, onStart }) {
  if (!quest) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xs w-full shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">🎯</div>
          <h3 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-1">{quest.title}</h3>
          <p className="text-sm text-gray-500 font-['Poppins'] mb-5">Apakah kamu sudah siap mengerjakan quest ini?</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition font-['Poppins'] text-sm">Belum</button>
            <button onClick={onStart} className="flex-1 py-2.5 bg-[#1E258F] hover:bg-[#161d6f] text-white font-semibold rounded-xl transition font-['Poppins'] text-sm">Siap!</button>
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
  
  // Modal states (quest confirm only — material uses dedicated page now)
  const [selectedQuest, setSelectedQuest] = useState(null)
  const [showQuestConfirm, setShowQuestConfirm] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState({ className: '', chapterTitle: '' })

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
        .select(`
          *,
          chapter_id,
          chapter:chapters(id, title)
        `)
        .eq('id', lessonId)
        .single()

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError)
        toast.error('Lesson tidak ditemukan')
        navigate('/student/classes', { replace: true })
        return
      }

      let className = ''
      if (location.state?.classId) {
        const { data: classData } = await supabase
          .from('classes')
          .select('class_name')
          .eq('id', location.state.classId)
          .single()
        className = classData?.class_name || ''
      }
      
      setBreadcrumbs({
        className,
        chapterTitle: lessonData.chapter?.title || ''
      })

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
      // Use getSession for faster auth check (cached)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return
      
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
    navigate(`/student/material/${material.id}`, {
      state: {
        lessonId: lessonId,
        classId: location.state?.classId
      }
    })
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
            <div className="w-32 h-32 mx-auto mb-4">
              <DotLottieReact
                src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
                loop
                autoplay
              />
            </div>
            <p className="text-gray-500 font-['Poppins']">Memuat materi...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  // Function to navigate back to class detail
  const handleBackToChapter = () => {
    if (location.state?.classId) {
      navigate(`/student/class/${location.state.classId}`)
      return
    }
    navigate('/student/chapters')
  }

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      {/* Header with Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToChapter}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wide text-gray-400 font-['Poppins']">
            {breadcrumbs.className && (
              <>
                <span>{breadcrumbs.className}</span>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </>
            )}
            {breadcrumbs.chapterTitle && (
              <>
                <span>{breadcrumbs.chapterTitle}</span>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </>
            )}
            <span className="text-[#4f46e5]">{lesson?.title}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 font-['Poppins'] mb-3 tracking-tight leading-tight">
          {lesson?.title}
        </h1>
        {lesson?.description && (
          <p className="text-xs sm:text-sm text-gray-600 font-['Poppins'] leading-relaxed max-w-4xl">
            {lesson?.description}
          </p>
        )}
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 mb-2">
          <h3 className="text-base font-semibold text-gray-900 font-['Poppins']">
            Daftar Materi
          </h3>
          <span className="text-sm font-medium text-gray-500 font-['Poppins']">
            {materials.length} Materi
          </span>
        </div>

        {materials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="w-40 h-40 mx-auto mb-4">
              <DotLottieReact
                src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                loop
                autoplay
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Materi</h3>
            <p className="text-sm text-gray-600 font-['Poppins']">
              Guru belum menambahkan materi untuk sub bab ini
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              let cumulativeLocked = false;
              return materials.map((material, index) => {
                const quest = questsMap[material.id]
                // If the material has a quest, it must be completed to unlock the next material.
                // If it doesn't have a quest, it doesn't block the next material in our simplified logic.
                const isCompleted = quest ? questCompletions[quest.id] : true
                
                const isLocked = cumulativeLocked
                if (!isCompleted) {
                  cumulativeLocked = true
                }
                
                const status = isCompleted ? 'completed' : isLocked ? 'locked' : 'current'
                
                return (
                  <button 
                    key={material.id}
                    disabled={isLocked}
                    onClick={() => handleMaterialClick(material)}
                    className={`w-full text-left flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                      status === 'completed' ? 'bg-white border-blue-200 hover:border-blue-300' :
                      status === 'current' ? 'bg-white border-[#4f46e5] shadow-sm ring-1 ring-[#4f46e5]' :
                      'bg-gray-50/50 border-gray-100 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {status === 'completed' ? (
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        ) : status === 'locked' ? (
                          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border border-gray-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 pr-4">
                        <h3 className={`font-semibold text-sm sm:text-base font-['Poppins'] truncate ${status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {material.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {status === 'current' ? (
                            <span className="text-xs font-semibold text-[#4f46e5] font-['Poppins']">Sedang Dipelajari</span>
                          ) : status === 'locked' ? (
                            <span className="text-xs text-gray-400 font-['Poppins']">Belum Dimulai</span>
                          ) : (
                            <span className="text-xs text-blue-600 font-['Poppins']">Selesai</span>
                          )}
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-400 font-['Poppins']">
                            {quest ? `${quest.questionCount} Soal` : material.material_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-auto">
                      {status === 'current' ? (
                        <div className="hidden sm:block">
                          <span className="px-4 py-2 bg-[#4f46e5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg font-['Poppins'] transition-colors">Lanjutkan</span>
                        </div>
                      ) : status === 'locked' ? (
                        <div className="hidden sm:block">
                          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      ) : null}
                    </div>
                  </button>
                )
              })
            })()}
          </div>
        )}
      </div>

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
