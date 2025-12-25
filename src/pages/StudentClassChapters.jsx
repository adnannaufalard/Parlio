import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import UserInfoHeader from '../components/UserInfoHeader'
import toast from 'react-hot-toast'

function StudentClassChapters() {
  const navigate = useNavigate()
  const { classId } = useParams()
  const [loading, setLoading] = useState(true)
  const [classData, setClassData] = useState(null)
  const [chapters, setChapters] = useState([])
  const [activeTab, setActiveTab] = useState('pelajaran')
  const [announcements, setAnnouncements] = useState([])
  const [members, setMembers] = useState([])
  const [forumPosts, setForumPosts] = useState([])
  const [leaderboardData, setLeaderboardData] = useState([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)

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
    } else if (activeTab === 'forum' && classId) {
      fetchForumPosts()
    } else if (activeTab === 'leaderboard' && classId) {
      fetchLeaderboard()
    }
  }, [activeTab, classId])

  // No longer using gradient colors - using white cards instead

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
    // Navigate to chapter detail (lessons)
    navigate(`/student/chapters/${chapter.id}`, { 
      state: { chapterData: chapter, classId: classId } 
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
        .order('is_pinned', { ascending: false })
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

  const fetchForumPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('class_forum_posts')
        .select(`
          *,
          author:profiles!class_forum_posts_user_id_fkey(id, full_name)
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching forum posts:', error)
        setForumPosts([])
      } else {
        setForumPosts(data || [])
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error)
      setForumPosts([])
    }
  }

  const fetchLeaderboard = async () => {
    try {
      // Get all members with their XP from class
      const { data: membersData, error } = await supabase
        .from('class_members')
        .select(`
          student_id,
          profiles!inner(
            id,
            full_name,
            xp_points
          )
        `)
        .eq('class_id', classId)

      if (error) {
        console.error('Error fetching leaderboard:', error)
        setLeaderboardData([])
        return
      }

      // Sort by XP
      const sorted = (membersData || [])
        .map(m => ({
          id: m.profiles.id,
          name: m.profiles.full_name,
          xp: m.profiles.xp_points || 0
        }))
        .sort((a, b) => b.xp - a.xp)

      setLeaderboardData(sorted)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboardData([])
    }
  }

  const handlePostComment = async () => {
    if (!newComment.trim()) return

    setPostingComment(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('class_forum_posts')
        .insert([{
          class_id: classId,
          user_id: user.id,
          content: newComment.trim()
        }])

      if (error) throw error

      toast.success('Komentar berhasil diposting')
      setNewComment('')
      fetchForumPosts()
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Gagal memposting komentar')
    } finally {
      setPostingComment(false)
    }
  }

  if (loading) {
    return (
      <StudentLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat pelajaran...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout showClassNav={true} activeClassTab={activeTab} onClassTabChange={setActiveTab}>
      {/* User Info Header */}
      <UserInfoHeader />

      {/* Header Section - Dark Blue Background */}
      <div className="bg-[#1E258F] rounded-2xl shadow-lg mb-6 overflow-hidden">
        <div className="p-6">
          <button
            onClick={() => navigate('/student/chapters')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-['Poppins']"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Kembali ke Daftar Kelas</span>
          </button>
          
          <h1 className="text-2xl font-bold text-white mb-2 font-['Poppins']">{classData?.class_name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70 font-['Poppins']">Kode Kelas:</span>
            <span className="bg-white/20 text-white font-mono font-semibold px-3 py-1 rounded-lg text-sm">{classData?.class_code}</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pelajaran' && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span>📚</span> Daftar Pelajaran - {chapters.length} Pelajaran
          </h3>
        
          {chapters.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <div className="text-7xl mb-4">📚</div>
              <h3 className="text-base font-semibold text-gray-800 mb-2 font-['Poppins']">Belum ada pelajaran</h3>
              <p className="text-sm text-gray-500 font-['Poppins']">Guru belum menambahkan pelajaran ke kelas ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter, index) => {
                const isLocked = !chapter.progress?.is_unlocked && chapter.floor_number > 1
                const isCompleted = chapter.progress?.is_completed
                
                return (
                  <div 
                    key={chapter.id}
                    className={`bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-200 border ${
                      isLocked ? 'opacity-70 cursor-not-allowed border-gray-200' : 'hover:border-blue-300 cursor-pointer border-gray-100'
                    } ${isCompleted ? 'border-green-200' : ''}`}
                    onClick={() => !isLocked && handleChapterClick(chapter)}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="bg-blue-50 p-3 rounded-xl flex-shrink-0 border border-blue-100">
                          <span className="text-3xl">{chapter.icon || '📚'}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {isCompleted && (
                              <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 font-['Poppins']">
                                <span>✓</span> Selesai
                              </span>
                            )}
                            {isLocked && (
                              <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 font-['Poppins']">
                                🔒 Terkunci
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-tight font-['Poppins']">
                            {chapter.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed font-['Poppins']">
                            {chapter.description}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700 font-['Poppins']">
                              <span>📖</span>
                              <span className="font-medium">{chapter.totalLessons}</span>
                              <span className="text-xs text-gray-500">Sub Bab</span>
                            </div>
                            {chapter.completedLessons > 0 && (
                              <div className="flex items-center gap-1.5 text-sm text-green-600 font-['Poppins']">
                                <span>✅</span>
                                <span className="font-medium">{chapter.completedLessons}</span>
                                <span className="text-xs">Selesai</span>
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-500 font-['Poppins']">
                                Progress
                              </span>
                              <span className="text-sm font-semibold text-gray-700 font-['Poppins']">
                                {chapter.percentage}%
                              </span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${chapter.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Arrow icon for non-locked chapters */}
                        {!isLocked && (
                          <svg className="w-5 h-5 text-gray-400 hover:text-blue-500 flex-shrink-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Bottom footer */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      {isLocked ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base">⚡</span>
                          <p className="text-xs font-medium text-gray-600 font-['Poppins']">
                            Butuh {chapter.unlock_xp_required || 0} XP untuk membuka
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 font-['Poppins']">
                          {isCompleted ? '✅ Pelajaran selesai' : '👉 Klik untuk melihat sub bab'}
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
                <div key={announcement.id} className={`bg-white rounded-xl shadow-sm border p-5 ${announcement.is_pinned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${announcement.is_pinned ? 'bg-amber-50' : 'bg-blue-50'}`}>
                      <span className="text-2xl">{announcement.is_pinned ? '📌' : '📢'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-gray-800 font-['Poppins']">
                          {announcement.title}
                        </h4>
                        {announcement.is_pinned && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium font-['Poppins']">
                            Disematkan
                          </span>
                        )}
                      </div>
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

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span className="text-xl">🏆</span> 
            <span>Leaderboard Kelas</span>
          </h3>
          
          {leaderboardData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Data</h3>
              <p className="text-sm text-gray-600 font-['Poppins']">
                Leaderboard akan muncul setelah ada aktivitas siswa
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboardData.map((student, index) => {
                const isTop3 = index < 3
                const medals = ['🥇', '🥈', '🥉']
                const bgColors = [
                  'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300',
                  'bg-gradient-to-r from-gray-100 to-slate-200 border-gray-300',
                  'bg-gradient-to-r from-orange-100 to-amber-200 border-orange-300'
                ]

                return (
                  <div 
                    key={student.id} 
                    className={`rounded-xl shadow-sm border p-4 ${
                      isTop3 ? bgColors[index] : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        isTop3 ? 'bg-white shadow-sm' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isTop3 ? medals[index] : index + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                        {student.name?.charAt(0).toUpperCase() || '?'}
                      </div>

                      {/* Name */}
                      <div className="flex-1">
                        <h4 className={`font-semibold font-['Poppins'] ${isTop3 ? 'text-gray-900' : 'text-gray-800'}`}>
                          {student.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-['Poppins']">
                          Level {Math.floor(student.xp / 100) + 1}
                        </p>
                      </div>

                      {/* XP */}
                      <div className="flex items-center gap-1 bg-yellow-400/80 text-yellow-900 px-3 py-1.5 rounded-full font-semibold text-sm shadow-sm">
                        <span>⚡</span>
                        <span>{student.xp} XP</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Forum Tab */}
      {activeTab === 'forum' && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span className="text-xl">💬</span> 
            <span>Forum Diskusi Kelas</span>
          </h3>

          {/* Post Comment Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tulis komentar atau pertanyaan..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900 font-['Poppins']"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handlePostComment}
                disabled={postingComment || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm font-['Poppins'] flex items-center gap-2"
              >
                {postingComment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Kirim</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {forumPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Diskusi</h3>
              <p className="text-sm text-gray-600 font-['Poppins']">
                Mulai diskusi dengan menulis komentar pertama!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {forumPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                      {post.author?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-800 font-['Poppins']">
                          {post.author?.full_name || 'Anonymous'}
                        </h4>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 font-['Poppins']">
                          {new Date(post.created_at).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-['Poppins']">
                        {post.content}
                      </p>
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
