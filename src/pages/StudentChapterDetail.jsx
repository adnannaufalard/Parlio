import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

function StudentChapterDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { chapterId } = useParams()
  const [loading, setLoading] = useState(true)
  const [chapter, setChapter] = useState(null)
  const [lessons, setLessons] = useState([])

  useEffect(() => {
    if (chapterId) {
      fetchChapterData()
    }
  }, [chapterId])

  const fetchChapterData = async () => {
    try {
      // Use getSession for faster auth check (cached)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setLoading(false)
        return
      }

      // Get chapter info (includes class_id)
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single()

      if (chapterError) {
        console.error('Error fetching chapter:', chapterError)
        toast.error('Pelajaran tidak ditemukan')
        navigate('/student/chapters')
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
    // Navigate to lesson detail with classId for proper back navigation
    navigate(`/student/lesson/${lesson.id}`, {
      state: { classId: location.state?.classId, chapterId: chapterId }
    })
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
            <p className="text-gray-500 font-['Poppins']">Memuat lessons...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      {/* Header - Dark Blue with Chapter Info */}
      <div className="bg-[#1E258F] rounded-2xl shadow-lg mb-6 overflow-hidden">
        <div className="p-6">
          <button
            onClick={() => location.state?.classId ? navigate(`/student/class/${location.state.classId}`) : navigate('/student/chapters')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-['Poppins']"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Kembali</span>
          </button>

          <div className="flex items-center gap-4">
    
            <div>
              <h1 className="text-xl font-semibold text-white font-['Poppins']">{chapter?.title}</h1>
              {chapter?.description && (
                <p className="text-sm text-white/70 mt-1 font-['Poppins'] line-clamp-2">{chapter?.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-semibold text-gray-800 font-['Poppins']">
            Daftar Sub Bab
          </h3>
          <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium font-['Poppins']">
            {lessons.length} Sub Bab
          </span>
        </div>
        
        {lessons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
            <div className="w-40 h-40 mx-auto mb-4">
              <DotLottieReact
                src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                loop
                autoplay
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Sub Bab</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto font-['Poppins']">
              Guru belum menambahkan sub bab ke pelajaran ini. Silakan cek kembali nanti!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const isCompleted = lesson.progress?.is_completed
              
              return (
                <div 
                  key={lesson.id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border cursor-pointer ${
                    isCompleted ? 'border-green-200' : 'border-gray-100 hover:border-blue-200'
                  }`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Number Badge */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg font-['Poppins'] ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-800 line-clamp-1 font-['Poppins']">
                            {lesson.title}
                          </h3>
                          {isCompleted && (
                            <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium font-['Poppins']">
                              Selesai
                            </span>
                          )}
                        </div>
                        
                        {lesson.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-1 font-['Poppins']">
                            {lesson.description}
                          </p>
                        )}
                        
                        {/* Meta info */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {lesson.materialCount > 0 && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium flex items-center gap-1 font-['Poppins']">
                              <span>📚</span>
                              <span>{lesson.materialCount} Materi</span>
                            </span>
                          )}
                          {lesson.questCount > 0 && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium flex items-center gap-1 font-['Poppins']">
                              <span>🎯</span>
                              <span>{lesson.questCount} Quest</span>
                            </span>
                          )}
                          {lesson.xp_reward && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium flex items-center gap-1 font-['Poppins']">
                              <span>⚡</span>
                              <span>+{lesson.xp_reward} XP</span>
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
    </StudentLayout>
  )
}

export default StudentChapterDetail
