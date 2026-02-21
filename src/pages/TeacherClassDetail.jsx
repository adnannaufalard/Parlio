import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Users, Trophy, BookOpen, Megaphone } from 'lucide-react'

const TeacherClassDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chapters')
  const [classData, setClassData] = useState(null)
  const [students, setStudents] = useState([])
  const [chapters, setChapters] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [forumPosts, setForumPosts] = useState([])
  const [newComment, setNewComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const forumChannelRef = useRef(null)
  
  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [showAssignChapterModal, setShowAssignChapterModal] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState(null)
  const [announcementToDelete, setAnnouncementToDelete] = useState(null)

  useEffect(() => {
    fetchClassData()
    fetchStudents()
    fetchChapters()
  }, [id])

  useEffect(() => {
    if (activeTab === 'announcements') fetchAnnouncements()
    if (activeTab === 'leaderboard') fetchLeaderboard()
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
      ;(attempts || []).forEach(a => {
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

      const { error } = await supabase
        .from('class_forum_posts')
        .insert([{
          class_id: id,
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
              <h1 className="text-3xl font-bold text-gray-800">{classData.class_name}</h1>
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
                { key: 'students', label: 'Siswa', icon: <Users className="h-4 w-4" /> },
                { key: 'forum', label: 'Forum', icon: <MessageSquare className="h-4 w-4" /> }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.key
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
                  <div className="grid grid-cols-1 gap-4">
                    {chapters.map((item) => (
                      <div 
                        key={item.id} 
                        className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                        style={{ 
                          backgroundColor: item.chapter.bg_color ? `${item.chapter.bg_color}10` : '#f9fafb',
                          borderLeft: `4px solid ${item.chapter.bg_color || '#6366f1'}`
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="text-5xl">{item.chapter.icon || ''}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-800">{item.chapter.title}</h3>
                                {item.chapter.is_published ? (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    ✓ Published
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{item.chapter.description || 'Tidak ada deskripsi'}</p>
                              
                              {/* Stats */}
                              <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-1 text-gray-700">
                                  <span className="font-semibold">📚 {item.lesson_count}</span>
                                  <span className="text-gray-500">sub bab</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-700">
                                  <span className="font-semibold">⚔️ {item.quest_count}</span>
                                  <span className="text-gray-500">quests</span>
                                </div>
                              </div>

                              {/* Assigned Info */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>📅 Ditambahkan: {new Date(item.assigned_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => navigate(`/teacher/classes/${id}/chapter/${item.chapter.id}`)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Lihat Detail
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus pelajaran "${item.chapter.title}" dari kelas ini?`)) {
                                  handleRemoveChapter(item.id)
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Hapus
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
                        className={`border rounded-lg p-4 ${
                          announcement.is_pinned ? 'bg-yellow-50 border-yellow-300' : ''
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
                          <div className="w-16 h-16 mx-auto bg-gray-300 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2 border-4 border-gray-400">
                            {leaderboard[1]?.avatar_url ? (
                              <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              leaderboard[1]?.full_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="text-2xl">🥈</div>
                          <p className="font-semibold text-gray-800 text-sm truncate max-w-[100px]">{leaderboard[1]?.full_name}</p>
                          <p className="text-xs text-blue-600 font-bold">{leaderboard[1]?.avg_score || 0}%</p>
                        </div>
                        
                        {/* 1st Place */}
                        <div className="text-center -mt-4">
                          <div className="w-20 h-20 mx-auto bg-yellow-400 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-2 border-4 border-yellow-500 shadow-lg">
                            {leaderboard[0]?.avatar_url ? (
                              <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              leaderboard[0]?.full_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="text-3xl">🥇</div>
                          <p className="font-bold text-gray-800 truncate max-w-[120px]">{leaderboard[0]?.full_name}</p>
                          <p className="text-sm text-blue-600 font-bold">{leaderboard[0]?.avg_score || 0}%</p>
                        </div>
                        
                        {/* 3rd Place */}
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto bg-amber-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2 border-4 border-amber-700">
                            {leaderboard[2]?.avatar_url ? (
                              <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              leaderboard[2]?.full_name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="text-2xl">🥉</div>
                          <p className="font-semibold text-gray-800 text-sm truncate max-w-[100px]">{leaderboard[2]?.full_name}</p>
                          <p className="text-xs text-blue-600 font-bold">{leaderboard[2]?.avg_score || 0}%</p>
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quest</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {leaderboard.map((student, index) => (
                            <tr key={student.id} className={`hover:bg-gray-50 ${index < 3 ? 'bg-yellow-50' : ''}`}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  index === 0 ? 'bg-yellow-400 text-white' :
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
                                  📊 {student.avg_score || 0}%
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                                  {student.quest_count || 0} Quest
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
                    {forumPosts.map((post) => (
                      <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author?.avatar_url} alt={post.author?.full_name} />
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white font-semibold text-sm">
                              {post.author?.full_name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-gray-800">
                                {post.author?.full_name || 'Anonymous'}
                              </h4>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_at).toLocaleDateString('id-ID', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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

      {/* Delete Announcement Confirmation */}
      {announcementToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfirmasi Hapus Pengumuman</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus pengumuman <strong>"{announcementToDelete.title}"</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAnnouncementToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
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
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Confirmation */}
      {studentToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Konfirmasi Hapus Siswa</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus <strong>{studentToRemove.full_name}</strong> dari kelas ini?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStudentToRemove(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={() => handleRemoveStudent(studentToRemove.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
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
      const { data: { user } } = await supabase.auth.getUser()

      // Insert all selected chapters
      const inserts = selectedChapters.map(chapterId => ({
        class_id: classId,
        chapter_id: chapterId,
        assigned_by: user.id,
        is_active: true
      }))

      const { error } = await supabase
        .from('class_chapters')
        .insert(inserts)

      if (error) throw error

      toast.success(`${selectedChapters.length} pelajaran berhasil ditambahkan`)
      onSuccess()
    } catch (error) {
      console.error('Error assigning chapters:', error)
      toast.error('Gagal menambahkan pelajaran')
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
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedChapters.includes(chapter.id)
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

