import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'

function StudentChapterDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chapterId } = useParams()
  const [loading, setLoading] = useState(true)
  const [chapter, setChapter] = useState(null)
  const [lessons, setLessons] = useState([])
  
  // Get background color from navigation state or use default
  const bgColor = location.state?.bgColor || 'from-blue-500 to-indigo-600'

  useEffect(() => {
    if (chapterId) {
      fetchChapterData()
    }
  }, [chapterId])

  const fetchChapterData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get chapter info
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single()

      if (chapterError) {
        console.error('Error fetching chapter:', chapterError)
        toast.error('Chapter tidak ditemukan')
        navigate(-1)
        return
      }

      setChapter(chapterData)

      // Get lessons for this chapter
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('chapter_id', chapterId)
        
      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError)
        setLessons([])
      } else {
        // Sort manually if order_number exists, otherwise use id
        const sortedLessons = (lessonsData || []).sort((a, b) => {
          if (a.order_number !== undefined && b.order_number !== undefined) {
            return a.order_number - b.order_number
          }
          return a.id - b.id
        })
        
        // Get progress and quest count for each lesson
        const lessonsWithProgress = await Promise.all(
          sortedLessons.map(async (lesson) => {
            try {
              // Get progress
              const { data: progress } = await supabase
                .from('student_lesson_progress')
                .select('*')
                .eq('student_id', user.id)
                .eq('lesson_id', lesson.id)
                .maybeSingle()

              // Get quest count from quests table (not quest_questions)
              const { count: questCount } = await supabase
                .from('quests')
                .select('id', { count: 'exact', head: true })
                .eq('lesson_id', lesson.id)

              // Get materials count
              const { count: materialCount } = await supabase
                .from('lesson_materials')
                .select('id', { count: 'exact', head: true })
                .eq('lesson_id', lesson.id)

              return {
                ...lesson,
                progress: progress || { is_completed: false },
                questCount: questCount || 0,
                materialCount: materialCount || 0
              }
            } catch (err) {
              console.warn('Lesson data not ready:', err)
              return {
                ...lesson,
                progress: { is_completed: false },
                questCount: 0,
                materialCount: 0
              }
            }
          })
        )

        setLessons(lessonsWithProgress)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching chapter data:', error)
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

  const handleLessonClick = (lesson) => {
    // Navigate to lesson detail
    navigate(`/student/lesson/${lesson.id}`)
  }

  if (loading) {
    return (
      <StudentLayout showHeader={true} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Poppins']">Memuat lessons...</p>
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

      {/* Lessons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 font-['Poppins']">
            <span className="text-xl">Daftar Pelajaran</span> 
          </h3>
          <span className="bg-gradient-to-r from-blue-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-sm font-['Poppins']">
            {lessons.length} Lesson{lessons.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {lessons.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-50 via-gray-50 to-red-50 rounded-2xl shadow-sm p-10 text-center border border-gray-200">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Pelajaran</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto font-['Poppins']">
              Guru belum menambahkan pelajaran ke chapter ini. Silakan cek kembali nanti!
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {lessons.map((lesson, index) => {
              const isCompleted = lesson.progress?.is_completed
              
              // Lesson type config
              const lessonTypeConfig = {
                video: { icon: '🎥', label: 'Video', color: 'bg-red-50 text-red-600 border-red-100' },
                reading: { icon: '📖', label: 'Bacaan', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                exercise: { icon: '✍️', label: 'Latihan', color: 'bg-green-50 text-green-600 border-green-100' },
                quiz: { icon: '🎯', label: 'Quiz', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                default: { icon: '📚', label: 'Lesson', color: 'bg-gray-50 text-gray-600 border-gray-100' }
              }
              
              const typeConfig = lessonTypeConfig[lesson.type] || lessonTypeConfig.default
              
              return (
                <div 
                  key={lesson.id}
                  className={`group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border cursor-pointer ${
                    isCompleted ? 'border-green-200 bg-green-50/20' : 'border-gray-100 hover:border-blue-200'
                  }`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Number Badge */}
                      <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg shadow-sm transition-transform group-hover:scale-105 font-['Poppins'] ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 group-hover:from-blue-400 group-hover:to-blue-600 group-hover:text-white'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                            <span className="text-xs">⭐</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1 font-['Poppins']">
                            {lesson.title}
                          </h3>
                          {isCompleted && (
                            <span className="flex-shrink-0 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm flex items-center gap-1 font-['Poppins']">
                              <span>✓</span> Selesai
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2.5 line-clamp-2 leading-relaxed font-['Poppins']">
                          {lesson.description}
                        </p>
                        
                        {/* Lesson Meta */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {lesson.materialCount > 0 && (
                            <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-blue-100 font-['Poppins']">
                              <span>📚</span>
                              <span>{lesson.materialCount} Materi</span>
                            </span>
                          )}
                          {lesson.questCount > 0 && (
                            <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-purple-100 font-['Poppins']">
                              <span>🎯</span>
                              <span>{lesson.questCount} Quest</span>
                            </span>
                          )}
                          {lesson.duration && (
                            <span className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-gray-100 font-['Poppins']">
                              <span>⏱️</span>
                              <span>{lesson.duration} menit</span>
                            </span>
                          )}
                          {lesson.xp_reward && (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-amber-100 font-['Poppins']">
                              <span>⚡</span>
                              <span>+{lesson.xp_reward} XP</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Progress indicator at bottom */}
                  {!isCompleted && (
                    <div className="h-1 bg-gray-100">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-red-500 w-0 group-hover:w-full transition-all duration-500" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Coming Soon Notice - Enhanced */}
      <div className="mt-6 relative overflow-hidden bg-gradient-to-br from-blue-500 to-red-500 rounded-xl shadow-sm">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="relative p-5">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-lg">
              <span className="text-3xl">🚧</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white text-base mb-2 flex items-center gap-2 font-['Poppins']">
                <span>Fitur Dalam Pengembangan</span>
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium">BETA</span>
              </h4>
              <p className="text-white/90 text-sm leading-relaxed font-['Poppins']">
                Konten pembelajaran interaktif (video, bacaan, quiz) sedang dalam tahap pengembangan. 
                Saat ini Anda bisa melihat daftar lesson yang tersedia di chapter ini. 
                Nantikan update selanjutnya! 🎉
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentChapterDetail
