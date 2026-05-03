import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import UserInfoHeader from '../components/UserInfoHeader'
import toast from 'react-hot-toast'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ForumCommentItem } from '../components/ForumCommentItem'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { logActivity } from '../lib/activityLogger'
import { NotificationService } from '../lib/notificationService'

function StudentClassChapters() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [currentUserId, setCurrentUserId] = useState(null)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [forumPostToDelete, setForumPostToDelete] = useState(null)
  const [collapsedChapterIds, setCollapsedChapterIds] = useState([])
  const [selectedLessonId, setSelectedLessonId] = useState(null)

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

  // Effect for handling URL ?tab parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tabParam = params.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [location.search])

  // Effect for handling scroll to comment hash
  useEffect(() => {
    if (activeTab === 'forum' && forumPosts.length > 0 && location.hash) {
      const hashId = location.hash.substring(1)
      if (hashId.startsWith('comment-')) {
        setTimeout(() => {
          const element = document.getElementById(hashId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('bg-blue-50')
            setTimeout(() => {
              element.classList.remove('bg-blue-50')
            }, 2000)
          }
        }, 300)
      }
    }
  }, [activeTab, forumPosts, location.hash])

  // No longer using gradient colors - using white cards instead

  const fetchClassChapters = async () => {
    try {
      // Use getSession for faster auth check (cached)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setLoading(false)
        return
      }

      setCurrentUserId(user.id)

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

      const chapterIds = (assignedChapters || []).map(ac => ac.chapter?.id).filter(Boolean)

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, title, description, order_number, chapter_id')
        .in('chapter_id', chapterIds)

      const lessonsByChapter = {}
        ; (lessonsData || []).forEach((lesson) => {
          if (!lessonsByChapter[lesson.chapter_id]) {
            lessonsByChapter[lesson.chapter_id] = []
          }
          lessonsByChapter[lesson.chapter_id].push(lesson)
        })

      const allLessonIds = (lessonsData || []).map(l => l.id)

      const { data: questsData } = allLessonIds.length > 0
        ? await supabase
          .from('quests')
          .select('id, lesson_id')
          .in('lesson_id', allLessonIds)
        : { data: [] }

      const questIds = (questsData || []).map(q => q.id)
      const { data: attemptsData } = questIds.length > 0
        ? await supabase
          .from('student_quest_attempts')
          .select('quest_id')
          .eq('student_id', user.id)
          .eq('passed', true)
          .in('quest_id', questIds)
        : { data: [] }

      const passedQuestIds = new Set((attemptsData || []).map(a => a.quest_id))
      const questIdsByLesson = {}
        ; (questsData || []).forEach((quest) => {
          if (!questIdsByLesson[quest.lesson_id]) {
            questIdsByLesson[quest.lesson_id] = []
          }
          questIdsByLesson[quest.lesson_id].push(quest.id)
        })

      const chaptersWithProgress = await Promise.all(
        (assignedChapters || []).map(async (ac) => {
          const chapter = ac.chapter

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

          const chapterLessons = (lessonsByChapter[chapter.id] || []).sort((a, b) => {
            if (a.order_number !== undefined && b.order_number !== undefined) {
              return a.order_number - b.order_number
            }
            return a.id - b.id
          })

          const lessonsWithProgress = chapterLessons.map((lesson) => {
            const lessonQuestIds = questIdsByLesson[lesson.id] || []
            const isCompleted = lessonQuestIds.length > 0
              ? lessonQuestIds.every((questId) => passedQuestIds.has(questId))
              : false

            return {
              ...lesson,
              questCount: lessonQuestIds.length,
              isCompleted
            }
          })

          const totalLessons = lessonsWithProgress.length
          const completedCount = lessonsWithProgress.filter(l => l.isCompleted).length
          const isCompleted = totalLessons > 0 && completedCount === totalLessons

          return {
            ...chapter,
            progress,
            lessons: lessonsWithProgress,
            totalLessons,
            completedLessons: completedCount,
            percentage: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
            isCompleted
          }
        })
      )

      const sortedChapters = chaptersWithProgress.sort((a, b) => a.floor_number - b.floor_number)
      setChapters(sortedChapters)
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
          student_id,
          profiles!inner(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('class_id', classId)

      if (error) {
        console.error('Error fetching members:', error)
        setMembers([])
      } else {
        // Transform data to match expected format
        const transformedData = (data || []).map(item => ({
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
          author:profiles!class_forum_posts_user_id_fkey(id, full_name, avatar_url)
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
      // Get class members first
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select(`
          student_id,
          profiles!inner(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('class_id', classId)

      if (membersError) {
        console.error('Error fetching members:', membersError)
        setLeaderboardData([])
        return
      }

      if (!membersData || membersData.length === 0) {
        setLeaderboardData([])
        return
      }

      // Get chapters assigned to this class
      const { data: classChapters } = await supabase
        .from('class_chapters')
        .select('chapter_id')
        .eq('class_id', classId)
        .eq('is_active', true)

      if (!classChapters || classChapters.length === 0) {
        // No chapters, show members with 0 score
        const sorted = membersData.map(m => ({
          id: m.profiles.id,
          name: m.profiles.full_name,
          avatar_url: m.profiles.avatar_url,
          avg_score: 0,
          quest_count: 0
        })).sort((a, b) => a.name.localeCompare(b.name))
        setLeaderboardData(sorted)
        return
      }

      const chapterIds = classChapters.map(c => c.chapter_id)

      // Get lessons in those chapters
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('chapter_id', chapterIds)

      if (!lessons || lessons.length === 0) {
        const sorted = membersData.map(m => ({
          id: m.profiles.id,
          name: m.profiles.full_name,
          avatar_url: m.profiles.avatar_url,
          avg_score: 0,
          quest_count: 0
        })).sort((a, b) => a.name.localeCompare(b.name))
        setLeaderboardData(sorted)
        return
      }

      const lessonIds = lessons.map(l => l.id)

      // Get quests in those lessons
      const { data: quests } = await supabase
        .from('quests')
        .select('id')
        .in('lesson_id', lessonIds)

      if (!quests || quests.length === 0) {
        const sorted = membersData.map(m => ({
          id: m.profiles.id,
          name: m.profiles.full_name,
          avatar_url: m.profiles.avatar_url,
          avg_score: 0,
          quest_count: 0
        })).sort((a, b) => a.name.localeCompare(b.name))
        setLeaderboardData(sorted)
        return
      }

      const questIds = quests.map(q => q.id)
      const studentIds = membersData.map(m => m.student_id)

      // Get scores from quest attempts for these quests by class members
      const { data: attempts } = await supabase
        .from('student_quest_attempts')
        .select('student_id, score, max_score')
        .in('quest_id', questIds)
        .in('student_id', studentIds)

      // Calculate avg score per student
      const scoresByStudent = {}
        ; (attempts || []).forEach(a => {
          if (!scoresByStudent[a.student_id]) {
            scoresByStudent[a.student_id] = { total: 0, max: 0, count: 0 }
          }
          scoresByStudent[a.student_id].total += a.score || 0
          scoresByStudent[a.student_id].max += a.max_score || 0
          scoresByStudent[a.student_id].count += 1
        })

      // Build leaderboard with class-specific scores
      const leaderboardWithScores = membersData.map(m => {
        const studentScores = scoresByStudent[m.student_id] || { total: 0, max: 0, count: 0 }
        const avgScore = studentScores.max > 0
          ? Math.round((studentScores.total / studentScores.max) * 100)
          : 0
        return {
          id: m.profiles.id,
          name: m.profiles.full_name,
          avatar_url: m.profiles.avatar_url,
          avg_score: avgScore,
          quest_count: studentScores.count
        }
      }).sort((a, b) => b.avg_score - a.avg_score || b.quest_count - a.quest_count)

      setLeaderboardData(leaderboardWithScores)
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

      await logActivity({
        action: `Mengirim komentar di forum kelas`,
        actionType: 'create',
        resourceType: 'forum',
        resourceName: classData?.class_name
      })

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

  const handleEditForumPost = async (postId) => {
    if (!editingCommentContent.trim()) return

    try {
      const { error } = await supabase
        .from('class_forum_posts')
        .update({ content: editingCommentContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', currentUserId) // Extra security

      if (error) throw error

      toast.success('Komentar berhasil diperbarui')
      setEditingCommentId(null)
      setEditingCommentContent('')
      fetchForumPosts()
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Gagal memperbarui komentar')
    }
  }

  const handleReplyForumPost = async (parentId, content) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newPost, error } = await supabase
        .from('class_forum_posts')
        .insert([{
          class_id: classId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId
        }])
        .select()
        .single()

      if (error) throw error

      // Notify parent post owner
      const { data: parentPost } = await supabase
        .from('class_forum_posts')
        .select('user_id, profiles!class_forum_posts_user_id_fkey(role)')
        .eq('id', parentId)
        .single()

      if (parentPost && parentPost.user_id !== user.id) {
        const { data: currentUserProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const recipientRole = parentPost.profiles?.role
        const link = recipientRole === 'guru'
          ? `/teacher/classes/${classId}?tab=forum#comment-${newPost.id}`
          : `/student/class/${classId}?tab=forum#comment-${newPost.id}`

        await NotificationService.createNotification({
          userId: parentPost.user_id,
          title: 'Balasan Baru di Forum',
          message: `${currentUserProfile?.full_name || 'Seseorang'} membalas komentar Anda di forum kelas.`,
          type: 'forum',
          link
        })
      }

      await logActivity({
        action: `Membalas komentar di forum kelas`,
        actionType: 'create',
        resourceType: 'forum',
        resourceName: classData?.class_name
      })

      toast.success('Balasan berhasil diposting')
      fetchForumPosts()
    } catch (error) {
      console.error('Error posting reply:', error)
      toast.error('Gagal memposting balasan')
    }
  }

  const handleDeleteForumPost = async () => {
    if (!forumPostToDelete) return

    try {
      const { error } = await supabase
        .from('class_forum_posts')
        .delete()
        .eq('id', forumPostToDelete)
        .eq('user_id', currentUserId) // Extra security

      if (error) throw error

      toast.success('Komentar berhasil dihapus')
      fetchForumPosts()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Gagal menghapus komentar')
    } finally {
      setForumPostToDelete(null)
    }
  }

  const getNodeStyles = (status) => {
    if (status === 'completed') {
      return {
        circle: 'bg-emerald-500 border-emerald-500 text-white',
        line: 'bg-emerald-400',
        badge: 'bg-emerald-100 text-emerald-700'
      }
    }

    if (status === 'locked') {
      return {
        circle: 'bg-gray-200 border-gray-300 text-gray-500',
        line: 'bg-gray-300',
        badge: 'bg-gray-100 text-gray-600'
      }
    }

    return {
      circle: 'bg-blue-500 border-blue-500 text-white',
      line: 'bg-blue-400',
      badge: 'bg-blue-100 text-blue-700'
    }
  }

  const toggleChapterInfo = (chapterId) => {
    setCollapsedChapterIds((prev) => (
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    ))
  }

  const toggleLessonInfo = (lessonId) => {
    setSelectedLessonId((prev) => (prev === lessonId ? null : lessonId))
  }

  if (loading) {
    return (
      <StudentLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-48 h-48 mx-auto mb-2">
              <DotLottieReact
                src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
                loop
                autoplay
              />
            </div>
            <p className="text-gray-500 font-['Poppins']">Memuat pelajaran...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout showClassNav={true} activeClassTab={activeTab} onClassTabChange={setActiveTab}>
      {/* Header Section - Dark Blue Background */}
      <div className="relative bg-[#1E258F] rounded-2xl shadow-lg mb-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
          <div className="aurora-ribbon aurora-ribbon-1" />
          <div className="aurora-ribbon aurora-ribbon-2" />
          <div className="aurora-stars" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
        </div>
        <div className="relative z-10 p-6 sm:p-7 min-h-[170px] sm:min-h-[190px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <button
              onClick={() => navigate('/student/chapters')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-['Poppins']"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Kembali ke Daftar Kelas</span>
            </button>

            <div className="text-left sm:text-right">
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2 font-['Poppins']">
                {classData?.class_name}
              </h1>
              <div className="flex items-center gap-2 justify-start sm:justify-end">
                <span className="text-sm text-white/70 font-['Poppins']">Kode Kelas:</span>
                <span className="bg-white/20 text-white font-mono font-semibold px-3 py-1 rounded-lg text-sm">
                  {classData?.class_code}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pelajaran' && (
        <div className="relative overflow-hidden rounded-2xl bg-white p-4 sm:p-6">
          <div className="absolute inset-0 lesson-sky pointer-events-none">
            <div className="lesson-sky-layer lesson-sky-layer-1" />
            <div className="lesson-sky-layer lesson-sky-layer-2" />
            <div className="lesson-sky-layer lesson-sky-layer-3" />
            <div className="lesson-meteor lesson-meteor-1" />
            <div className="lesson-meteor lesson-meteor-2" />
            <div className="lesson-meteor lesson-meteor-3" />
          </div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
              <span></span> Daftar Pelajaran
            </h3>

            {chapters.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                <div className="w-48 h-48 mx-auto mb-2">
                  <DotLottieReact
                    src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                    loop
                    autoplay
                  />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-2 font-['Poppins']">Belum ada pelajaran</h3>
                <p className="text-sm text-gray-500 font-['Poppins']">Guru belum menambahkan pelajaran ke kelas ini</p>
              </div>
            ) : (
              <div className="relative space-y-10 py-2">
                <div className="absolute left-[15px] sm:left-[19px] top-6 bottom-6 w-px bg-gray-200 z-0" />
                {chapters.map((chapter, chapterIndex) => {
                  const previousChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null
                  const isChapterLocked = chapterIndex > 0 && !previousChapter?.isCompleted
                  const chapterStatus = chapter.isCompleted ? 'completed' : isChapterLocked ? 'locked' : 'current'
                  const lessons = chapter.lessons || []

                  return (
                    <div key={chapter.id} className="relative z-10 flex gap-6 sm:gap-8">
                      {/* Timeline Node */}
                      <div className="flex-shrink-0 mt-1">
                        {chapterStatus === 'completed' ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-sm relative z-10">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : chapterStatus === 'locked' ? (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center shadow-sm relative z-10">
                            <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#4f46e5]/20 flex items-center justify-center relative z-10">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4f46e5] shadow-sm shadow-indigo-200"></div>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-400 uppercase font-['Poppins']">
                            BAB {String(chapterIndex + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md font-['Poppins'] uppercase ${chapterStatus === 'completed' ? 'bg-green-100 text-green-700' :
                            chapterStatus === 'locked' ? 'bg-gray-100 text-gray-500' :
                              'bg-indigo-100 text-[#4f46e5]'
                            }`}>
                            {chapterStatus === 'completed' ? 'COMPLETED' : chapterStatus === 'locked' ? 'PENDING' : 'IN PROGRESS'}
                          </span>
                        </div>

                        <h2 className={`text-base sm:text-lg font-semibold mb-1 font-['Poppins'] ${chapterStatus === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>
                          {chapter.title}
                        </h2>

                        <p className={`text-xs sm:text-sm mb-3 font-['Poppins'] ${chapterStatus === 'locked' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {chapter.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5 font-['Poppins']">
                          <span>{chapter.completedLessons} / {chapter.totalLessons} Sub Bab</span>
                          <span>{chapter.percentage}%</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${chapterStatus === 'completed' ? 'bg-[#10b981]' : chapterStatus === 'locked' ? 'bg-gray-300' : 'bg-[#4f46e5]'}`}
                            style={{ width: `${chapter.percentage}%` }}
                          />
                        </div>

                        {/* Lessons Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                          {lessons.map((lesson, lessonIndex) => {
                            const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null
                            const isLessonLocked = isChapterLocked || (lessonIndex > 0 && !previousLesson?.isCompleted)
                            const lessonStatus = lesson.isCompleted ? 'completed' : isLessonLocked ? 'locked' : 'current'

                            return (
                              <button
                                key={lesson.id}
                                disabled={isLessonLocked}
                                onClick={() => navigate(`/student/lesson/${lesson.id}`, {
                                  state: { classId: classId, chapterId: chapter.id }
                                })}
                                className={`text-left flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all ${lessonStatus === 'completed' ? 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm' :
                                  lessonStatus === 'current' ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' :
                                    'bg-white border-gray-100 opacity-60 cursor-not-allowed'
                                  }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Icon */}
                                  <div className="flex-shrink-0">
                                    {lessonStatus === 'completed' ? (
                                      <div className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-500">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    ) : lessonStatus === 'locked' ? (
                                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center border border-[#4f46e5]">
                                        <div className="w-2 h-2 rounded-full bg-[#4f46e5]"></div>
                                      </div>
                                    )}
                                  </div>

                                  <span className={`font-semibold text-xs sm:text-sm font-['Poppins'] truncate ${lessonStatus === 'current' ? 'text-[#4f46e5]' :
                                    lessonStatus === 'locked' ? 'text-gray-400' :
                                      'text-gray-800'
                                    }`}>
                                    {lesson.title}
                                  </span>
                                </div>

                                <div className="flex-shrink-0 ml-3">
                                  {lessonStatus === 'current' ? (
                                    <span className="text-[10px] font-semibold text-[#4f46e5] font-['Poppins'] uppercase">Mulai</span>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 font-['Poppins']">{lesson.questCount > 0 ? `${lesson.questCount} Quest` : ''}</span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 px-1 font-['Poppins']">
            <span>Pengumuman Kelas</span>
          </h3>

          {announcements.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="w-48 h-48 mx-auto mb-2">
                <DotLottieReact
                  src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                  loop
                  autoplay
                />
              </div>
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
            <span>Anggota Kelas ({members.length})</span>
          </h3>

          {members.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="w-48 h-48 mx-auto mb-2">
                <DotLottieReact
                  src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                  loop
                  autoplay
                />
              </div>
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
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.student?.avatar_url} alt={member.student?.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-lg">
                        {member.student?.full_name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 font-['Poppins']">
                        {member.student?.full_name || 'Unknown'}
                      </h4>
                      <p className="text-xs text-gray-500 font-['Poppins']">
                        {member.student?.email}
                      </p>
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
            <span>Leaderboard Kelas</span>
          </h3>

          {leaderboardData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
              <div className="w-48 h-48 mx-auto mb-2">
                <DotLottieReact
                  src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                  loop
                  autoplay
                />
              </div>
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
                    className={`rounded-xl shadow-sm border p-4 ${isTop3 ? bgColors[index] : 'bg-white border-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg ${isTop3 ? 'bg-white shadow-sm' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {isTop3 ? medals[index] : index + 1}
                      </div>

                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm overflow-hidden">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          student.name?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1">
                        <h4 className={`font-semibold font-['Poppins'] ${isTop3 ? 'text-gray-900' : 'text-gray-800'}`}>
                          {student.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-['Poppins']">
                          {student.quest_count || 0} Quest dikerjakan
                        </p>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-1 bg-blue-500/80 text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-sm">
                        <span>Rata-rata : </span>
                        <span>{student.avg_score || 0}</span>
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
              <div className="w-48 h-48 mx-auto mb-2">
                <DotLottieReact
                  src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                  loop
                  autoplay
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Diskusi</h3>
              <p className="text-sm text-gray-600 font-['Poppins']">
                Mulai diskusi dengan menulis komentar pertama!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {forumPosts.filter(p => !p.parent_id).map((post) => (
                <ForumCommentItem
                  key={post.id}
                  post={post}
                  allPosts={forumPosts}
                  currentUserId={currentUserId}
                  isTeacher={false}
                  onDelete={(postId) => setForumPostToDelete(postId)}
                  onEdit={(postId, content) => {
                    setEditingCommentContent(content)
                    handleEditForumPost(postId)
                  }}
                  onReply={handleReplyForumPost}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Forum Post Modal */}
      <AlertDialog open={!!forumPostToDelete} onOpenChange={() => setForumPostToDelete(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Komentar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Komentar akan dihapus permanen beserta semua balasannya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => forumPostToDelete && handleDeleteForumPost(forumPostToDelete)} className="bg-red-600 hover:bg-red-700 text-white">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudentLayout>
  )
}

export default StudentClassChapters
