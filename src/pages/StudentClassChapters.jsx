import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'

function StudentClassChapters() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const [loading, setLoading] = useState(true)
  const [classData, setClassData] = useState(null)
  const [chapters, setChapters] = useState([])
  const [activeTab, setActiveTab] = useState('chapter')
  const [announcements, setAnnouncements] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (classId) {
      fetchClassChapters()
    }
  }, [classId])

  useEffect(() => {
    if (activeTab === 'announcements' && classId) {
      fetchAnnouncements()
    } else if (activeTab === 'members' && classId) {
      fetchMembers()
    }
  }, [activeTab, classId])

  // Gradient colors rotation (same as TeacherQuestBuilder)
  const chapterColors = [
    'from-blue-500 to-indigo-600',
    'from-green-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
  ]

  const fetchClassChapters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Get class info
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('id, class_name, class_code')
        .eq('id', classId)
        .single()

      if (classError) {
        console.error('Error fetching class:', classError)
        toast.error('Kelas tidak ditemukan')
        navigate('/student/chapters')
        return
      }

      setClassData(classInfo)

      // Check if student is member of this class
      const { data: membership, error: memberError } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('class_id', classId)
        .eq('student_id', user.id)
        .maybeSingle()

      if (memberError || !membership) {
        toast.error('Anda bukan anggota kelas ini')
        navigate('/student/chapters')
        return
      }

      // Get assigned chapters
      const { data: assignedChapters, error: chaptersError } = await supabase
        .from('class_chapters')
        .select(`
          chapter:chapters(
            id,
            title,
            description,
            floor_number,
            icon,
            bg_color,
            unlock_xp_required
          )
        `)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('chapter_id', { ascending: true })

      if (chaptersError) {
        console.error('Error fetching chapters:', chaptersError)
        setChapters([])
        setLoading(false)
        return
      }

      // Get student progress for each chapter
      const chaptersWithProgress = await Promise.all(
        (assignedChapters || []).map(async (ac) => {
          const chapter = ac.chapter
          
          // Get chapter progress (with error handling for missing table)
          let progress = { is_unlocked: false, is_completed: false }
          try {
            const { data: progressData } = await supabase
              .from('student_chapter_progress')
              .select('*')
              .eq('student_id', user.id)
              .eq('chapter_id', chapter.id)
              .maybeSingle()
            
            if (progressData) {
              progress = progressData
            }
          } catch (err) {
            console.warn('Progress table not ready:', err)
          }

          // Get lessons count
          const { count: lessonsCount } = await supabase
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .eq('chapter_id', chapter.id)

          // Get completed lessons count (with error handling)
          let completedCount = 0
          try {
            const { data: lessonIds } = await supabase
              .from('lessons')
              .select('id')
              .eq('chapter_id', chapter.id)

            if (lessonIds && lessonIds.length > 0) {
              const { count } = await supabase
                .from('student_lesson_progress')
                .select('id', { count: 'exact', head: true })
                .eq('student_id', user.id)
                .eq('is_completed', true)
                .in('lesson_id', lessonIds.map(l => l.id))
              
              completedCount = count || 0
            }
          } catch (err) {
            console.warn('Lesson progress not ready:', err)
          }

          return {
            ...chapter,
            progress,
            totalLessons: lessonsCount || 0,
            completedLessons: completedCount || 0,
            percentage: lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0
          }
        })
      )

      setChapters(chaptersWithProgress)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching class chapters:', error)
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
  }

  const handleChapterClick = (chapter) => {
    // Navigate to chapter detail (lessons) with color index
    const colorIndex = chapters.findIndex(c => c.id === chapter.id)
    const bgColor = chapterColors[colorIndex % chapterColors.length]
    navigate(`/student/chapters/${chapter.id}`, { 
      state: { bgColor, chapterData: chapter } 
    })
  }

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('class_announcements')
        .select(`
          *,
          teacher:profiles!class_announcements_teacher_id_fkey(full_name)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching announcements:', error)
        setAnnouncements([])
      } else {
        setAnnouncements(data || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setAnnouncements([])
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          joined_at,
          student_id,
          profiles!inner(
            id,
            full_name,
            email
          )
        `)
        .eq('class_id', classId)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error fetching members:', error)
        setMembers([])
      } else {
        // Transform data to match expected format
        const transformedData = (data || []).map(item => ({
          joined_at: item.joined_at,
          student: item.profiles
        }))
        setMembers(transformedData)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    }
  }

  if (loading) {
    return (
      <StudentLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat chapters...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout showClassNav={true} activeClassTab={activeTab} onClassTabChange={setActiveTab}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 via-white to-red-500 rounded-2xl shadow-sm p-[2px] mb-6">
        <div className="bg-white rounded-[14px] p-6">
          <button
            onClick={() => navigate('/student/chapters')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg font-['Poppins']"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Kembali ke Daftar Kelas</span>
          </button>
          
          <h1 className="text-2xl font-semibold text-gray-800 mb-2 font-['Poppins']">{classData?.class_name}</h1>
          <p className="text-sm text-gray-600 font-['Poppins']">Kode Kelas: <span className="font-mono font-medium text-blue-600">{classData?.class_code}</span></p>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'chapter' && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span>🗼</span> Menara Eiffel - {chapters.length} Chapter
          </h3>
        
        {chapters.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <div className="text-7xl mb-4">🗼</div>
            <h3 className="text-base font-semibold text-gray-800 mb-2 font-['Poppins']">Belum ada chapter</h3>
            <p className="text-sm text-gray-500 font-['Poppins']">Guru belum menambahkan chapter ke kelas ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, index) => {
              const isLocked = !chapter.progress?.is_unlocked && chapter.floor_number > 1
              const isCompleted = chapter.progress?.is_completed
              const bgColor = chapterColors[index % chapterColors.length]
              
              return (
                <div 
                  key={chapter.id}
                  className={`rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 ${
                    isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01] cursor-pointer'
                  }`}
                  onClick={() => !isLocked && handleChapterClick(chapter)}
                >
                  <div className={`bg-gradient-to-r ${bgColor} p-5 text-white`}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl flex-shrink-0 border border-white/30">
                        <span className="text-3xl">{chapter.icon || '📚'}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full border border-white/30 font-['Poppins']">
                            🗼 FLOOR {chapter.floor_number}
                          </span>
                          {isCompleted && (
                            <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm flex items-center gap-1 font-['Poppins']">
                              <span>✓</span> Selesai
                            </span>
                          )}
                          {isLocked && (
                            <span className="bg-gray-900/50 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 shadow-sm backdrop-blur-sm font-['Poppins']">
                              🔒 Terkunci
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-white mb-2 leading-tight font-['Poppins']">
                          {chapter.title}
                        </h3>
                        <p className="text-sm text-white/90 mb-3 line-clamp-2 leading-relaxed font-['Poppins']">
                          {chapter.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1.5 text-sm text-white font-['Poppins']">
                            <span>📖</span>
                            <span className="font-medium">{chapter.totalLessons}</span>
                            <span className="text-xs opacity-75">Pelajaran</span>
                          </div>
                          {chapter.completedLessons > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-white font-['Poppins']">
                              <span>✅</span>
                              <span className="font-medium">{chapter.completedLessons}</span>
                              <span className="text-xs opacity-75">Selesai</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-white/80 font-['Poppins']">
                              Progress
                            </span>
                            <span className="text-sm font-semibold text-white font-['Poppins']">
                              {chapter.percentage}%
                            </span>
                          </div>
                          <div className="bg-white/20 rounded-full h-2 overflow-hidden border border-white/30">
                            <div 
                              className="bg-white h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                              style={{ width: `${chapter.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Arrow icon for non-locked chapters */}
                      {!isLocked && (
                        <svg className="w-5 h-5 text-white/80 group-hover:text-white flex-shrink-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Bottom footer like TeacherQuestBuilder */}
                  <div className="p-3 bg-gray-50 flex items-center justify-between">
                    {isLocked ? (
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚡</span>
                        <p className="text-xs font-medium text-gray-700 font-['Poppins']">
                          Butuh {chapter.unlock_xp_required || 0} XP untuk membuka
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 font-['Poppins']">
                        {isCompleted ? '✅ Chapter selesai' : '👉 Klik untuk melihat pelajaran'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span className="text-xl">📢</span> 
            <span>Pengumuman Kelas</span>
          </h3>
          
          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Pengumuman</h3>
              <p className="text-sm text-gray-600 font-['Poppins']">
                Belum ada pengumuman dari guru untuk kelas ini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <span className="text-2xl">📢</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 mb-1 font-['Poppins']">
                        {announcement.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-['Poppins']">
                        Oleh {announcement.teacher?.full_name} • {new Date(announcement.created_at).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-['Poppins']">
                    {announcement.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span className="text-xl">👥</span> 
            <span>Anggota Kelas ({members.length})</span>
          </h3>
          
          {members.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Anggota</h3>
              <p className="text-sm text-gray-600 font-['Poppins']">
                Belum ada siswa yang bergabung ke kelas ini
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {members.map((member, index) => (
                <div key={member.student?.id || index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm font-['Poppins']">
                      {member.student?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 font-['Poppins']">
                        {member.student?.full_name || 'Unknown'}
                      </h4>
                      <p className="text-xs text-gray-500 font-['Poppins']">
                        {member.student?.email}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 font-['Poppins']">
                      Bergabung {new Date(member.joined_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  )
}

export default StudentClassChapters
