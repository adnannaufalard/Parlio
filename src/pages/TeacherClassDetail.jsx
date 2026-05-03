import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ForumCommentItem } from '../components/ForumCommentItem'
import { logActivity } from '../lib/activityLogger'
import { NotificationService } from '../lib/notificationService'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts'
import { MessageSquare, Send, Users, Trophy, BookOpen, Megaphone, BarChart3 } from 'lucide-react'

const TeacherClassDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chapters')
  const [classData, setClassData] = useState(null)
  const [students, setStudents] = useState([])
  const [chapters, setChapters] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsChartData, setStatsChartData] = useState([])
  const [statsSeries, setStatsSeries] = useState([])
  const [statsSummary, setStatsSummary] = useState([])
  const [statsConfig, setStatsConfig] = useState({})
  const [forumPosts, setForumPosts] = useState([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const forumChannelRef = useRef(null)

  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [showAssignChapterModal, setShowAssignChapterModal] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState(null)
  const [announcementToDelete, setAnnouncementToDelete] = useState(null)
  const [chapterToRemove, setChapterToRemove] = useState(null)
  const [showChapterRemoveModal, setShowChapterRemoveModal] = useState(false)
  const [forumPostToDelete, setForumPostToDelete] = useState(null)

  useEffect(() => {
    fetchClassData()
    fetchStudents()
    fetchChapters()
  }, [id])

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard()
    if (activeTab === 'statistics') fetchStatistics()
    if (activeTab === 'forum') {
      fetchForumPosts()
      setupForumRealtime()
    }
    return () => {
      if (forumChannelRef.current) {
        supabase.removeChannel(forumChannelRef.current)
      }
    }
  }, [activeTab])

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

  const fetchClassData = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Verify ownership
      const { data: { user } } = await supabase.auth.getUser()
      if (data.teacher_id !== user.id) {
        toast.error('Anda tidak memiliki akses ke kelas ini')
        navigate('/teacher/classes')
        return
      }

      setCurrentUserId(user.id)
      setClassData(data)
    } catch (error) {
      console.error('Error fetching class:', error)
      toast.error('Gagal memuat data kelas')
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('class_members')
        .select(`
          student_id,
          student:profiles!class_members_student_id_fkey(
            id,
            full_name,
            email,
            avatar_url,
            xp_points,
            coins
          )
        `)
        .eq('class_id', id)

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchChapters = async () => {
    try {
      // Get chapters assigned to this class with details
      const { data, error } = await supabase
        .from('class_chapters')
        .select(`
          id,
          assigned_at,
          is_active,
          chapter:chapters (
            id,
            title,
            description,
            floor_number,
            icon,
            bg_color,
            is_published
          )
        `)
        .eq('class_id', id)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false })

      if (error) throw error

      // Get lesson and quest counts for each chapter
      const chaptersWithStats = await Promise.all(
        (data || []).map(async (item) => {
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id', { count: 'exact' })
            .eq('chapter_id', item.chapter.id)

          const { data: quests } = await supabase
            .from('quests')
            .select('id', { count: 'exact' })
            .in('lesson_id', lessons?.map(l => l.id) || [])

          return {
            ...item,
            lesson_count: lessons?.length || 0,
            quest_count: quests?.length || 0
          }
        })
      )

      setChapters(chaptersWithStats)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      toast.error('Gagal memuat pelajaran')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      // Get class members first
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select(`
          student_id,
          student:profiles!class_members_student_id_fkey (
            id,
            full_name,
            avatar_url,
            coins
          )
        `)
        .eq('class_id', id)

      if (membersError || !membersData || membersData.length === 0) {
        setLeaderboard([])
        return
      }

      // Get chapters assigned to this class
      const { data: classChapters } = await supabase
        .from('class_chapters')
        .select('chapter_id')
        .eq('class_id', id)
        .eq('is_active', true)

      if (!classChapters || classChapters.length === 0) {
        // No chapters, show members with 0 score
        const sorted = membersData.map(m => ({
          id: m.student.id,
          full_name: m.student.full_name,
          avatar_url: m.student.avatar_url,
          coins: m.student.coins || 0,
          total_score: 0,
          avg_score: 0,
          quest_count: 0
        })).sort((a, b) => a.full_name.localeCompare(b.full_name))
        setLeaderboard(sorted)
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
          id: m.student.id,
          full_name: m.student.full_name,
          avatar_url: m.student.avatar_url,
          coins: m.student.coins || 0,
          total_score: 0,
          avg_score: 0,
          quest_count: 0
        })).sort((a, b) => a.full_name.localeCompare(b.full_name))
        setLeaderboard(sorted)
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
          id: m.student.id,
          full_name: m.student.full_name,
          avatar_url: m.student.avatar_url,
          coins: m.student.coins || 0,
          total_score: 0,
          avg_score: 0,
          quest_count: 0
        })).sort((a, b) => a.full_name.localeCompare(b.full_name))
        setLeaderboard(sorted)
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

      // Calculate total score and average score per student
      const scoresByStudent = {}
        ; (attempts || []).forEach(a => {
          if (!scoresByStudent[a.student_id]) {
            scoresByStudent[a.student_id] = { total: 0, max: 0, count: 0 }
          }
          scoresByStudent[a.student_id].total += a.score || 0
          scoresByStudent[a.student_id].max += a.max_score || 0
          scoresByStudent[a.student_id].count += 1
        })

      // Build leaderboard with scores (nilai)
      const leaderboardWithScores = membersData.map(m => {
        const studentScores = scoresByStudent[m.student_id] || { total: 0, max: 0, count: 0 }
        const avgScore = studentScores.max > 0
          ? Math.round((studentScores.total / studentScores.max) * 100)
          : 0
        return {
          id: m.student.id,
          full_name: m.student.full_name,
          avatar_url: m.student.avatar_url,
          coins: m.student.coins || 0,
          total_score: studentScores.total,
          avg_score: avgScore,
          quest_count: studentScores.count
        }
      }).sort((a, b) => b.avg_score - a.avg_score || b.total_score - a.total_score)

      setLeaderboard(leaderboardWithScores)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true)

      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select(`
          student_id,
          student:profiles!class_members_student_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('class_id', id)

      if (membersError || !membersData || membersData.length === 0) {
        setStatsChartData([])
        setStatsSeries([])
        setStatsSummary([])
        setStatsConfig({})
        return
      }

      const { data: classChapters } = await supabase
        .from('class_chapters')
        .select('chapter_id')
        .eq('class_id', id)
        .eq('is_active', true)

      if (!classChapters || classChapters.length === 0) {
        setStatsChartData([])
        setStatsSeries([])
        setStatsSummary([])
        setStatsConfig({})
        return
      }

      const chapterIds = classChapters.map(c => c.chapter_id)

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('chapter_id', chapterIds)

      if (!lessons || lessons.length === 0) {
        setStatsChartData([])
        setStatsSeries([])
        setStatsSummary([])
        setStatsConfig({})
        return
      }

      const lessonIds = lessons.map(l => l.id)

      const { data: quests } = await supabase
        .from('quests')
        .select('id')
        .in('lesson_id', lessonIds)

      if (!quests || quests.length === 0) {
        setStatsChartData([])
        setStatsSeries([])
        setStatsSummary([])
        setStatsConfig({})
        return
      }

      const questIds = quests.map(q => q.id)
      const studentIds = membersData.map(m => m.student_id)

      const { data: attempts } = await supabase
        .from('student_quest_attempts')
        .select('student_id, score, max_score, completed_at')
        .in('quest_id', questIds)
        .in('student_id', studentIds)
        .order('completed_at', { ascending: true })

      const palette = [
        '#2563eb',
        '#f97316',
        '#10b981',
        '#ef4444',
        '#8b5cf6',
        '#14b8a6',
        '#f59e0b',
        '#0ea5e9',
        '#84cc16',
        '#ec4899'
      ]

      const studentsInfo = membersData.map((m, index) => {
        const dataKey = `student_${m.student_id.replace(/-/g, '')}`
        return {
          id: m.student_id,
          name: m.student?.full_name || 'Siswa',
          avatar_url: m.student?.avatar_url,
          dataKey,
          color: palette[index % palette.length]
        }
      })

      const attemptsByStudent = {}
      studentsInfo.forEach((student) => {
        attemptsByStudent[student.id] = {
          ...student,
          attempts: [],
          totalScore: 0,
          totalMax: 0
        }
      })

        ; (attempts || []).forEach((attempt) => {
          const student = attemptsByStudent[attempt.student_id]
          if (!student) return
          const percent = attempt.max_score > 0
            ? Math.round((attempt.score || 0) / attempt.max_score * 100)
            : 0
          student.attempts.push({
            percent,
            score: attempt.score || 0,
            maxScore: attempt.max_score || 0
          })
          student.totalScore += attempt.score || 0
          student.totalMax += attempt.max_score || 0
        })

      const maxAttempts = Math.max(
        0,
        ...Object.values(attemptsByStudent).map(student => student.attempts.length)
      )

      const chartData = Array.from({ length: maxAttempts }, (_, index) => ({
        attempt: index + 1
      }))

      Object.values(attemptsByStudent).forEach((student) => {
        student.attempts.forEach((attempt, index) => {
          chartData[index][student.dataKey] = attempt.percent
        })
      })

      chartData.forEach((point, index) => {
        const values = Object.values(attemptsByStudent)
          .map(student => student.attempts[index]?.percent)
          .filter((value) => value !== undefined)
        point.average = values.length > 0
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : 0
      })

      const series = Object.values(attemptsByStudent).map((student) => {
        const avgScore = student.totalMax > 0
          ? Math.round((student.totalScore / student.totalMax) * 100)
          : 0
        return {
          id: student.id,
          name: student.name,
          avatar_url: student.avatar_url,
          dataKey: student.dataKey,
          color: student.color,
          avg_score: avgScore,
          attempt_count: student.attempts.length
        }
      })

      const config = {
        average: {
          label: 'Rata-rata Kelas',
          color: '#0f172a'
        }
      }

      series.forEach((item) => {
        config[item.dataKey] = {
          label: item.name,
          color: item.color
        }
      })

      setStatsChartData(chartData)
      setStatsSeries(series)
      setStatsSummary([...series].sort((a, b) => b.avg_score - a.avg_score))
      setStatsConfig(config)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setStatsLoading(false)
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
        .eq('class_id', id)
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

  const setupForumRealtime = () => {
    if (forumChannelRef.current) {
      supabase.removeChannel(forumChannelRef.current)
    }

    const channel = supabase
      .channel(`forum-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_forum_posts',
          filter: `class_id=eq.${id}`
        },
        () => {
          fetchForumPosts()
        }
      )
      .subscribe()

    forumChannelRef.current = channel
  }

  const handlePostComment = async () => {
    if (!newComment.trim()) return

    setPostingComment(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: newPost, error } = await supabase
        .from('class_forum_posts')
        .insert([{
          class_id: id,
          user_id: user.id,
          content: newComment.trim()
        }])
        .select()
        .single()

      if (error) throw error

      // Notify all students in the class
      const { data: members } = await supabase.from('class_members').select('student_id').eq('class_id', id)
      if (members && members.length > 0) {
        for (const member of members) {
          await NotificationService.createNotification({
            userId: member.student_id,
            title: 'Diskusi Baru di Forum',
            message: `Guru telah membuat diskusi baru di forum kelas ${classData?.class_name}.`,
            type: 'forum',
            link: `/student/class/${id}?tab=forum#comment-${newPost.id}`
          })
        }
      }
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
      const { data: newPost, error } = await supabase
        .from('class_forum_posts')
        .insert([{
          class_id: id,
          user_id: currentUserId,
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
        
      if (parentPost && parentPost.user_id !== currentUserId) {
        const recipientRole = parentPost.profiles?.role
        const link = recipientRole === 'guru'
          ? `/teacher/classes/${id}?tab=forum#comment-${newPost.id}`
          : `/student/class/${id}?tab=forum#comment-${newPost.id}`
          
        await NotificationService.createNotification({
          userId: parentPost.user_id,
          title: 'Balasan Baru di Forum',
          message: `Guru membalas komentar Anda di forum kelas ${classData?.class_name}.`,
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

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('class_announcements')
        .select('*')
        .eq('class_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  const handleRemoveStudent = async (studentId) => {
    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', id)
        .eq('student_id', studentId)

      if (error) throw error

      toast.success('Siswa berhasil dihapus dari kelas')
      fetchStudents()
      setStudentToRemove(null)
    } catch (error) {
      console.error('Error removing student:', error)
      toast.error('Gagal menghapus siswa')
    }
  }

  const handleRemoveChapter = async (classChapterId) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('class_chapters')
        .update({ is_active: false })
        .eq('id', classChapterId)

      if (error) throw error

      toast.success('Pelajaran berhasil dihapus dari kelas')
      fetchChapters()
    } catch (error) {
      console.error('Error removing chapter:', error)
      toast.error('Gagal menghapus pelajaran')
    }
  }

  const handleCopyClassCode = () => {
    navigator.clipboard.writeText(classData.class_code)
    toast.success('Kode kelas berhasil disalin!')
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data kelas...</div>
        </div>
      </TeacherLayout>
    )
  }

  if (!classData) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Kelas tidak ditemukan</div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">{classData.class_name}</h1>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Kode Kelas: <span className="font-mono font-semibold text-blue-600">{classData.class_code}</span>
                </span>
                <button
                  onClick={handleCopyClassCode}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Salin Kode
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Kembali
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'chapters', label: 'Pelajaran', icon: <BookOpen className="h-4 w-4" /> },
                { key: 'announcements', label: 'Pengumuman', icon: <Megaphone className="h-4 w-4" /> },
                { key: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="h-4 w-4" /> },
                { key: 'statistics', label: 'Statistik', icon: <BarChart3 className="h-4 w-4" /> },
                { key: 'students', label: 'Siswa', icon: <Users className="h-4 w-4" /> },
                { key: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key)
                    navigate(`/teacher/classes/${id}?tab=${tab.key}`, { replace: true })
                  }}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Chapters Tab */}
            {activeTab === 'chapters' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Pelajaran yang Ditambahkan ({chapters.length})</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/teacher/quest-builder')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      + Buat Pelajaran Baru
                    </button>
                    <button
                      onClick={() => setShowAssignChapterModal(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      + Tambah Pelajaran
                    </button>
                  </div>
                </div>

                {chapters.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="w-40 h-40 mx-auto mb-4">
                      <DotLottieReact
                        src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <p className="text-gray-500 mb-4">Belum ada pelajaran yang ditambahkan ke kelas ini</p>
                    <p className="text-sm text-gray-400 mb-6">
                      Buat pelajaran baru atau tambahkan pelajaran yang sudah ada ke kelas ini
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chapters.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: item.chapter.bg_color || '#6366f1' }}></div>

                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm border border-gray-100 flex-shrink-0" style={{ backgroundColor: item.chapter.bg_color ? `${item.chapter.bg_color}15` : '#f3f4f6' }}>
                            {item.chapter.icon || '📚'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">{item.chapter.title}</h3>
                              {item.chapter.is_published ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Published</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">Draft</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.chapter.description || 'Tidak ada deskripsi'}</p>

                            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-gray-600">
                              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                <span>{item.lesson_count} Sub Bab</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                <span>{item.quest_count} Quests</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            Ditambahkan: {new Date(item.assigned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setChapterToRemove(item);
                                setShowChapterRemoveModal(true);
                              }}
                              className="px-3 py-1.5 text-sm font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => navigate(`/teacher/classes/${id}/chapter/${item.chapter.id}`)}
                              className="px-4 py-1.5 text-sm font-medium bg-[#1E258F] text-white rounded-lg hover:bg-[#161c6e] transition-colors"
                            >
                              Detail
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Daftar Siswa ({students.length})</h2>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-4 py-2 bg-[#1E258F] text-white rounded hover:bg-[#161c6e]"
                  >
                    + Tambah Siswa
                  </button>
                </div>

                {students.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="w-32 h-32 mx-auto mb-4">
                      <DotLottieReact
                        src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <p className="text-gray-500">Belum ada siswa di kelas ini</p>

                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((item) => (
                      <div key={item.student_id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={item.student.avatar_url} alt={item.student.full_name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                              {item.student.full_name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800 truncate">{item.student.full_name}</h4>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                Aktif
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{item.student.email}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                ⭐ {item.student.xp_points || 0} XP
                              </span>
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                🪙 {item.student.coins || 0}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setStudentToRemove(item.student)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title="Hapus siswa"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Pengumuman Kelas</h2>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    + Buat Pengumuman
                  </button>
                </div>

                {announcements.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="w-32 h-32 mx-auto mb-4">
                      <DotLottieReact
                        src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <p className="text-gray-500">Belum ada pengumuman untuk kelas ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={`border rounded-lg p-4 ${announcement.is_pinned ? 'bg-yellow-50 border-yellow-300' : ''
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {announcement.is_pinned && (
                              <span className="inline-block px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded mb-2">
                                📌 Disematkan
                              </span>
                            )}
                            <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                            <p className="text-sm text-gray-600 mt-2">{announcement.content}</p>
                            <div className="mt-3 text-xs text-gray-500">
                              {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setEditingAnnouncement(announcement)
                                setShowAnnouncementModal(true)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setAnnouncementToDelete(announcement)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Leaderboard Kelas</h2>
                  <button
                    onClick={fetchLeaderboard}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="w-32 h-32 mx-auto mb-4">
                      <DotLottieReact
                        src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <p className="text-gray-500">Belum ada siswa di kelas ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Top 3 Podium */}
                    {leaderboard.length >= 3 && (
                      <div className="flex justify-center items-end gap-4 py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl mb-6">
                        {/* 2nd Place */}
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-2 border-4 border-gray-400">
                            {leaderboard[1]?.avatar_url ? (
                              <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              leaderboard[1]?.full_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="text-2xl">🥈</div>
                          <p className="font-semibold text-gray-800 text-sm truncate max-w-[100px]">{leaderboard[1]?.full_name}</p>
                          <p className="text-xs text-blue-600 font-semibold">{leaderboard[1]?.avg_score || 0}</p>
                        </div>

                        {/* 1st Place */}
                        <div className="text-center -mt-4">
                          <div className="w-20 h-20 mx-auto bg-yellow-400 rounded-full flex items-center justify-center text-white text-3xl font-semibold mb-2 border-4 border-yellow-500 shadow-lg">
                            {leaderboard[0]?.avatar_url ? (
                              <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              leaderboard[0]?.full_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="text-3xl">🥇</div>
                          <p className="font-semibold text-gray-800 truncate max-w-[120px]">{leaderboard[0]?.full_name}</p>
                          <p className="text-sm text-blue-600 font-semibold">{leaderboard[0]?.avg_score || 0}</p>
                        </div>

                        {/* 3rd Place */}
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto bg-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold mb-2 border-4 border-amber-700">
                            {leaderboard[2]?.avatar_url ? (
                              <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              leaderboard[2]?.full_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="text-2xl">🥉</div>
                          <p className="font-semibold text-gray-800 text-sm truncate max-w-[100px]">{leaderboard[2]?.full_name}</p>
                          <p className="text-xs text-blue-600 font-semibold">{leaderboard[2]?.avg_score || 0}</p>
                        </div>
                      </div>
                    )}

                    {/* Full Leaderboard Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Siswa</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rata-rata Nilai</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {leaderboard.map((student, index) => (
                            <tr key={student.id} className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${index === 0 ? 'bg-yellow-400 text-white' :
                                  index === 1 ? 'bg-gray-300 text-gray-700' :
                                    index === 2 ? 'bg-amber-600 text-white' :
                                      'bg-gray-100 text-gray-600'
                                  }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                    {student.avatar_url ? (
                                      <img src={student.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      student.full_name?.charAt(0) || '?'
                                    )}
                                  </div>
                                  <span className="font-medium text-gray-800">{student.full_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {student.avg_score || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Statistik Tab */}
            {activeTab === 'statistics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Statistik Nilai Siswa</h2>
                    <p className="text-sm text-gray-500">Perubahan nilai setiap attempt dan rata-rata kelas</p>
                  </div>
                </div>

                {statsLoading ? (
                  <div className="flex items-center justify-center h-56">
                    <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : statsChartData.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="w-40 h-40 mx-auto mb-4">
                      <DotLottieReact
                        src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <p className="text-gray-500">Belum ada attempt untuk kelas ini</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <ChartContainer config={statsConfig} className="h-[320px]">
                        <LineChart data={statsChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="attempt" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line
                            type="monotone"
                            dataKey="average"
                            stroke="var(--color-average)"
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="6 4"
                          />
                          {statsSeries.map((series) => (
                            <Line
                              key={series.id}
                              type="monotone"
                              dataKey={series.dataKey}
                              stroke={`var(--color-${series.dataKey})`}
                              strokeWidth={2}
                              dot={false}
                            />
                          ))}
                        </LineChart>
                      </ChartContainer>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h3 className="text-base font-semibold text-gray-800 mb-4">Ringkasan Nilai Siswa</h3>
                      <div className="grid gap-3">
                        {statsSummary.map((student) => (
                          <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={student.avatar_url} alt={student.name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                                {student.name?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.attempt_count} attempt</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Rata-rata</span>
                              <span className="text-sm font-semibold text-blue-600">{student.avg_score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Forum Tab */}
            {activeTab === 'forum' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Forum Diskusi Kelas
                  </h2>
                </div>

                {/* Post Comment Form */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis komentar atau pertanyaan untuk siswa..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900"
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handlePostComment}
                      disabled={postingComment || !newComment.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
                    >
                      {postingComment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Kirim</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {forumPosts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="w-32 h-32 mx-auto mb-4">
                      <DotLottieReact
                        src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                        loop
                        autoplay
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Diskusi</h3>
                    <p className="text-sm text-gray-600">
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
                        isTeacher={true}
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
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddStudentModal
          classId={id}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={() => {
            fetchStudents()
          }}
        />
      )}

      {/* Assign Chapter Modal */}
      {showAssignChapterModal && (
        <AssignChapterModal
          classId={id}
          existingChapterIds={chapters.map(c => c.chapter.id)}
          onClose={() => setShowAssignChapterModal(false)}
          onSuccess={() => {
            fetchChapters()
            setShowAssignChapterModal(false)
          }}
        />
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <AnnouncementModal
          classId={id}
          announcement={editingAnnouncement}
          onClose={() => {
            setShowAnnouncementModal(false)
            setEditingAnnouncement(null)
          }}
          onSuccess={() => {
            fetchAnnouncements()
            setShowAnnouncementModal(false)
            setEditingAnnouncement(null)
          }}
        />
      )}

      {/* Remove Announcement Confirmation */}
      <AlertDialog open={!!announcementToDelete} onOpenChange={() => setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengumuman</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengumuman ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from('class_announcements')
                    .delete()
                    .eq('id', announcementToDelete.id)
                  if (error) throw error
                  toast.success('Pengumuman berhasil dihapus')
                  fetchAnnouncements()
                } catch (error) {
                  console.error('Error deleting announcement:', error)
                  toast.error('Gagal menghapus pengumuman')
                } finally {
                  setAnnouncementToDelete(null)
                }
              }}
              className="!bg-red-600 !text-white hover:!bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Student Confirmation */}
      <AlertDialog open={!!studentToRemove} onOpenChange={() => setStudentToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{studentToRemove?.full_name}</strong> dari kelas ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRemoveStudent(studentToRemove.id)} className="!bg-red-600 !text-white hover:!bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogAction onClick={handleDeleteForumPost} className="bg-red-600 hover:bg-red-700 text-white">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Chapter Confirmation */}
      <AlertDialog open={showChapterRemoveModal} onOpenChange={setShowChapterRemoveModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pelajaran</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus pelajaran "{chapterToRemove?.chapter?.title}" dari kelas ini?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleRemoveChapter(chapterToRemove?.id)
                setShowChapterRemoveModal(false)
                setChapterToRemove(null)
              }}
              className="!bg-red-600 !text-white hover:!bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TeacherLayout>
  )
}

// Assign Chapter Modal Component
const AssignChapterModal = ({ classId, existingChapterIds, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [availableChapters, setAvailableChapters] = useState([])
  const [selectedChapters, setSelectedChapters] = useState([])

  useEffect(() => {
    fetchAvailableChapters()
  }, [])

  const fetchAvailableChapters = async () => {
    try {
      // Get all available chapters
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .order('floor_number', { ascending: true })

      if (error) throw error

      // Filter out chapters already assigned to this class
      const filtered = (data || []).filter(ch => !existingChapterIds.includes(ch.id))

      setAvailableChapters(filtered)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      toast.error('Gagal memuat pelajaran')
    }
  }

  const handleToggleChapter = (chapterId) => {
    if (selectedChapters.includes(chapterId)) {
      setSelectedChapters(selectedChapters.filter(id => id !== chapterId))
    } else {
      setSelectedChapters([...selectedChapters, chapterId])
    }
  }

  const handleAssign = async () => {
    if (selectedChapters.length === 0) {
      toast.error('Pilih minimal 1 pelajaran')
      return
    }

    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError || new Error("User tidak terautentikasi")

      // First check for existing records
      const { data: existingRecords, error: fetchError } = await supabase
        .from('class_chapters')
        .select('id, chapter_id')
        .eq('class_id', classId)
        .in('chapter_id', selectedChapters)

      if (fetchError) throw fetchError

      const existingChapterIds = (existingRecords || []).map(r => r.chapter_id)
      const chaptersToInsert = selectedChapters.filter(id => !existingChapterIds.includes(id))

      // Update existing records to active
      if (existingRecords && existingRecords.length > 0) {
        const idsToUpdate = existingRecords.map(r => r.id)
        const { error: updateError } = await supabase
          .from('class_chapters')
          .update({ is_active: true, assigned_by: user.id })
          .in('id', idsToUpdate)

        if (updateError) throw updateError
      }

      // Insert new ones
      if (chaptersToInsert.length > 0) {
        const inserts = chaptersToInsert.map(chapterId => ({
          class_id: classId,
          chapter_id: chapterId,
          assigned_by: user.id,
          is_active: true
        }))

        const { error: insertError } = await supabase
          .from('class_chapters')
          .insert(inserts)

        if (insertError) throw insertError
      }

      toast.success(`${selectedChapters.length} pelajaran berhasil ditambahkan`)
      onSuccess()
    } catch (error) {
      console.error('Error assigning chapters:', error)
      toast.error('Gagal menambahkan pelajaran: ' + (error.message || 'Error internal'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Tambah Pelajaran ke Kelas</h3>
          <p className="text-sm text-gray-500 mt-1">Pilih pelajaran yang ingin ditambahkan ke kelas ini</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {availableChapters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3"></div>
              <p className="text-gray-500 mb-4">Tidak ada pelajaran yang tersedia</p>
              <p className="text-sm text-gray-400 mb-6">
                Buat pelajaran baru terlebih dahulu
              </p>
              <button
                onClick={() => {
                  onClose()
                  window.location.href = '/teacher/quest-builder'
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Buat Pelajaran
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {availableChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => handleToggleChapter(chapter.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedChapters.includes(chapter.id)
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedChapters.includes(chapter.id)}
                      onChange={() => handleToggleChapter(chapter.id)}
                      className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="text-3xl">{chapter.icon || ''}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{chapter.title}</h4>
                        {chapter.is_published && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Published
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{chapter.description || 'Tidak ada deskripsi'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedChapters.length > 0 && (
                <span className="font-semibold text-purple-600">
                  {selectedChapters.length} pelajaran dipilih
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={handleAssign}
                disabled={loading || selectedChapters.length === 0}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
              >
                {loading ? 'Menambahkan...' : `Tambah ${selectedChapters.length} Pelajaran`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add Student Modal Component
const AddStudentModal = ({ classId, onClose, onSuccess }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!email.trim()) return

    setSearching(true)
    try {
      // Search for student by email
      const { data: student, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.trim())
        .eq('role', 'siswa')
        .single()

      if (error || !student) {
        toast.error('Siswa tidak ditemukan')
        setSearchResults([])
        return
      }

      // Check if already in class
      const { data: existing } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', classId)
        .eq('student_id', student.id)
        .single()

      if (existing) {
        toast.error('Siswa sudah terdaftar di kelas ini')
        return
      }

      setSearchResults([student])
    } catch (error) {
      console.error('Error searching student:', error)
      toast.error('Gagal mencari siswa')
    } finally {
      setSearching(false)
    }
  }

  const handleAddStudent = async (studentId) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('class_members')
        .insert([{ class_id: classId, student_id: studentId }])

      if (error) throw error

      toast.success('Siswa berhasil ditambahkan ke kelas')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error adding student:', error)
      toast.error('Gagal menambahkan siswa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tambah Siswa ke Kelas</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Siswa
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siswa@email.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                {searching ? 'Mencari...' : 'Cari'}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              {searchResults.map((student) => (
                <div key={student.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-black">{student.full_name}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                  <button
                    onClick={() => handleAddStudent(student.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-300"
                  >
                    {loading ? 'Menambahkan...' : 'Tambah'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

// Announcement Modal Component
const AnnouncementModal = ({ classId, announcement, onClose, onSuccess }) => {
  const [title, setTitle] = useState(announcement?.title || '')
  const [content, setContent] = useState(announcement?.content || '')
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned || false)
  const [loading, setLoading] = useState(false)
  const isEditing = !!announcement

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Judul dan isi pengumuman harus diisi')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (isEditing) {
        const { error } = await supabase
          .from('class_announcements')
          .update({
            title: title.trim(),
            content: content.trim(),
            is_pinned: isPinned,
            updated_at: new Date().toISOString()
          })
          .eq('id', announcement.id)

        if (error) throw error
        toast.success('Pengumuman berhasil diperbarui')
      } else {
        const { error } = await supabase
          .from('class_announcements')
          .insert([{
            class_id: classId,
            teacher_id: user.id,
            title: title.trim(),
            content: content.trim(),
            is_pinned: isPinned
          }])

        if (error) throw error
        toast.success('Pengumuman berhasil dibuat')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error(isEditing ? 'Gagal memperbarui pengumuman' : 'Gagal membuat pengumuman')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEditing ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Pengumuman
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengumuman Ujian Tengah Semester"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Isi Pengumuman
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis isi pengumuman di sini..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-700">
              📌 Sematkan pengumuman ini
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Pengumuman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherClassDetail

