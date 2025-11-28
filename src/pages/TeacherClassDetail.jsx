import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'

const TeacherClassDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [classData, setClassData] = useState(null)
  const [students, setStudents] = useState([])
  const [chapters, setChapters] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalChapters: 0,
    totalLessons: 0,
    totalQuests: 0
  })
  
  // Modals
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [showAssignChapterModal, setShowAssignChapterModal] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState(null)

  useEffect(() => {
    fetchClassData()
    fetchStudents()
    fetchChapters()
    fetchStats()
  }, [id])

  useEffect(() => {
    if (activeTab === 'announcements') fetchAnnouncements()
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
      toast.error('Gagal memuat chapter')
    }
  }

  const fetchStats = async () => {
    try {
      // Calculate stats from chapters
      let totalLessons = 0
      let totalQuests = 0

      chapters.forEach(ch => {
        totalLessons += ch.lesson_count || 0
        totalQuests += ch.quest_count || 0
      })

      setStats({
        totalStudents: students.length,
        totalChapters: chapters.length,
        totalLessons,
        totalQuests
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
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
      fetchStats()
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

      toast.success('Chapter berhasil dihapus dari kelas')
      fetchChapters()
      fetchStats()
    } catch (error) {
      console.error('Error removing chapter:', error)
      toast.error('Gagal menghapus chapter')
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Siswa</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">{stats.totalStudents}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Total Chapter</div>
              <div className="text-2xl font-bold text-purple-700 mt-1">{stats.totalChapters}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Total Pelajaran</div>
              <div className="text-2xl font-bold text-green-700 mt-1">{stats.totalLessons}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium">Total Quest</div>
              <div className="text-2xl font-bold text-orange-700 mt-1">{stats.totalQuests}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'overview', label: 'Ringkasan', icon: '📊' },
                { key: 'students', label: 'Siswa', icon: '👥' },
                { key: 'chapters', label: 'Chapter', icon: '�' },
                { key: 'announcements', label: 'Pengumuman', icon: '📢' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Ringkasan Kelas</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Aktivitas Terbaru</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• {students.length} siswa terdaftar</p>
                      <p>• {chapters.length} chapter telah ditambahkan</p>
                      <p>• {stats.totalQuests} quest tersedia</p>
                      <p>• Kelas dibuat pada {new Date(classData.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Aksi Cepat</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveTab('students')}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        + Tambah Siswa
                      </button>
                      <button
                        onClick={() => setActiveTab('chapters')}
                        className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                      >
                        + Assign Chapter
                      </button>
                      <button
                        onClick={() => setShowAnnouncementModal(true)}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        + Buat Pengumuman
                      </button>
                      <button
                        onClick={() => navigate('/teacher/quest-builder')}
                        className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
                      >
                        🗼 Buat Chapter Baru
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chapter Overview */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Chapter yang Ditambahkan</h3>
                  {chapters.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded">
                      <p className="text-gray-500 mb-3">Belum ada chapter yang ditambahkan ke kelas ini</p>
                      <button
                        onClick={() => setActiveTab('chapters')}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                      >
                        Assign Chapter Sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {chapters.slice(0, 6).map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{item.chapter.icon || '🗼'}</span>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm text-gray-800">{item.chapter.title}</h4>
                              <p className="text-xs text-gray-500">Lantai {item.chapter.floor_number}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs text-gray-600">
                            <span>📚 {item.lesson_count} lessons</span>
                            <span>⚔️ {item.quest_count} quests</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {chapters.length > 6 && (
                    <button
                      onClick={() => setActiveTab('chapters')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Lihat semua {chapters.length} chapter →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Daftar Siswa ({students.length})</h2>
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    + Tambah Siswa
                  </button>
                </div>

                {students.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Belum ada siswa di kelas ini</p>
                    <button
                      onClick={() => setShowAddStudentModal(true)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Tambah Siswa Pertama
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coins</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-black">{item.student.full_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.student.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {item.student.xp_points} XP
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {item.student.coins} 💰
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => setStudentToRemove(item.student)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Chapters Tab */}
            {activeTab === 'chapters' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Chapter yang Ditambahkan ({chapters.length})</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/teacher/quest-builder')}
                      className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                      🗼 Buat Chapter Baru
                    </button>
                    <button
                      onClick={() => setShowAssignChapterModal(true)}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      + Assign Chapter
                    </button>
                  </div>
                </div>

                {chapters.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-6xl mb-4">🗼</div>
                    <p className="text-gray-500 mb-4">Belum ada chapter yang ditambahkan ke kelas ini</p>
                    <p className="text-sm text-gray-400 mb-6">
                      Buat chapter di Quest Builder, lalu assign ke kelas ini
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => navigate('/teacher/quest-builder')}
                        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                      >
                        Buat Chapter Baru
                      </button>
                      <button
                        onClick={() => setShowAssignChapterModal(true)}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                      >
                        Assign Chapter yang Sudah Ada
                      </button>
                    </div>
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
                            <div className="text-5xl">{item.chapter.icon || '🗼'}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-800">{item.chapter.title}</h3>
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                  Lantai {item.chapter.floor_number}
                                </span>
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
                                  <span className="text-gray-500">lessons</span>
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
                              onClick={() => navigate(`/teacher/quest-builder?chapter=${item.chapter.id}`)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Lihat Detail
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus chapter "${item.chapter.title}" dari kelas ini?`)) {
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
            fetchStats()
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
            fetchStats()
            setShowAssignChapterModal(false)
          }}
        />
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <AnnouncementModal
          classId={id}
          onClose={() => setShowAnnouncementModal(false)}
          onSuccess={() => {
            fetchAnnouncements()
            setShowAnnouncementModal(false)
          }}
        />
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
      const { data: { user } } = await supabase.auth.getUser()
      
      // Get chapters created by this teacher that are not already assigned
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('created_by', user.id)
        .order('floor_number', { ascending: true })

      if (error) throw error

      // Filter out chapters already assigned to this class
      const filtered = (data || []).filter(ch => !existingChapterIds.includes(ch.id))
      setAvailableChapters(filtered)
    } catch (error) {
      console.error('Error fetching chapters:', error)
      toast.error('Gagal memuat chapter')
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
      toast.error('Pilih minimal 1 chapter')
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

      toast.success(`${selectedChapters.length} chapter berhasil ditambahkan`)
      onSuccess()
    } catch (error) {
      console.error('Error assigning chapters:', error)
      toast.error('Gagal menambahkan chapter')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Chapter ke Kelas</h3>
          <p className="text-sm text-gray-500 mt-1">Pilih chapter yang ingin ditambahkan ke kelas ini</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {availableChapters.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🗼</div>
              <p className="text-gray-500 mb-4">Tidak ada chapter yang tersedia</p>
              <p className="text-sm text-gray-400 mb-6">
                Buat chapter baru di Quest Builder terlebih dahulu
              </p>
              <button
                onClick={() => {
                  onClose()
                  window.location.href = '/teacher/quest-builder'
                }}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Buka Quest Builder
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
                    <div className="text-3xl">{chapter.icon || '🗼'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{chapter.title}</h4>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          Lantai {chapter.floor_number}
                        </span>
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
                  {selectedChapters.length} chapter dipilih
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
                {loading ? 'Menambahkan...' : `Assign ${selectedChapters.length} Chapter`}
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
const AnnouncementModal = ({ classId, onClose, onSuccess }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      toast.error('Judul dan isi pengumuman harus diisi')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
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
      onSuccess()
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast.error('Gagal membuat pengumuman')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buat Pengumuman Baru</h3>
        
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
              {loading ? 'Menyimpan...' : 'Buat Pengumuman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherClassDetail

