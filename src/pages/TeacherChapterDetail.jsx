import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'

function TeacherChapterDetail() {
  const { chapterId } = useParams()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('lessons') // 'lessons' or 'settings'
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)

  useEffect(() => {
    fetchChapterData()
  }, [chapterId])

  const fetchChapterData = async () => {
    try {
      setLoading(true)
      
      // Fetch chapter info
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single()

      if (chapterError) throw chapterError
      setChapter(chapterData)

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          quests:quests(count),
          materials:lesson_materials(count)
        `)
        .eq('chapter_id', chapterId)
        .order('lesson_order', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

    } catch (error) {
      console.error('Error fetching chapter data:', error)
      toast.error('Gagal memuat data chapter')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLesson = () => {
    setEditingLesson(null)
    setShowLessonModal(true)
  }

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setShowLessonModal(true)
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Yakin ingin menghapus lesson ini? Semua quests dan materials akan terhapus.')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error
      toast.success('Lesson berhasil dihapus')
      fetchChapterData()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      toast.error('Gagal menghapus lesson')
    }
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TeacherLayout>
    )
  }

  if (!chapter) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Chapter tidak ditemukan</p>
          <button
            onClick={() => navigate('/teacher/quest-builder')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Kembali ke Quest Builder
          </button>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/quest-builder')}
            className="p-2 hover:bg-gray-100 rounded-md transition"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Lantai {chapter.floor_number}: {chapter.title}</h1>
            <p className="text-gray-600 mt-1">{chapter.description || 'Tidak ada deskripsi'}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{lessons.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons.reduce((sum, l) => sum + (l.quests?.[0]?.count || 0), 0)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lessons.reduce((sum, l) => sum + (l.materials?.[0]?.count || 0), 0)}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'lessons'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lessons & Quests
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'lessons' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Daftar Lessons</h3>
                  <button
                    onClick={handleCreateLesson}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Lesson
                  </button>
                </div>

                {lessons.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-4">📚</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Lesson</h4>
                    <p className="text-gray-600 mb-4">Mulai buat lesson pertama untuk chapter ini</p>
                    <button
                      onClick={handleCreateLesson}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                    >
                      Buat Lesson Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onEdit={() => handleEditLesson(lesson)}
                        onDelete={() => handleDeleteLesson(lesson.id)}
                        onManageQuests={() => navigate(`/teacher/quest-builder/lesson/${lesson.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Chapter Settings</h3>
                <p className="text-gray-600">Settings untuk chapter akan ditampilkan di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Modal */}
      {showLessonModal && (
        <LessonModal
          chapterId={chapterId}
          lesson={editingLesson}
          lessonCount={lessons.length}
          onClose={() => {
            setShowLessonModal(false)
            setEditingLesson(null)
          }}
          onSuccess={() => {
            setShowLessonModal(false)
            setEditingLesson(null)
            fetchChapterData()
          }}
        />
      )}
    </TeacherLayout>
  )
}

// Lesson Card Component
function LessonCard({ lesson, onEdit, onDelete, onManageQuests }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Lesson {lesson.lesson_order}
            </span>
            {lesson.is_published ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Published</span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Draft</span>
            )}
            <span className="text-xs text-gray-500">~{lesson.estimated_duration} menit</span>
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-1">{lesson.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{lesson.description || 'Tidak ada deskripsi'}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {lesson.quests?.[0]?.count || 0} Quests
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {lesson.materials?.[0]?.count || 0} Materials
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onManageQuests}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            Kelola
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Lesson Modal Component
function LessonModal({ chapterId, lesson, lessonCount, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    lesson_order: lessonCount + 1,
    content_type: 'mixed',
    estimated_duration: 30,
    is_published: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title || '',
        description: lesson.description || '',
        lesson_order: lesson.lesson_order || 1,
        content_type: lesson.content_type || 'mixed',
        estimated_duration: lesson.estimated_duration || 30,
        is_published: lesson.is_published || false
      })
    }
  }, [lesson])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (lesson) {
        // Update
        const { error } = await supabase
          .from('lessons')
          .update({
            ...form,
            updated_at: new Date().toISOString()
          })
          .eq('id', lesson.id)

        if (error) throw error
        toast.success('Lesson berhasil diupdate')
      } else {
        // Create
        const { error } = await supabase
          .from('lessons')
          .insert([{
            ...form,
            chapter_id: chapterId
          }])

        if (error) throw error
        toast.success('Lesson berhasil dibuat')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving lesson:', error)
      toast.error('Gagal menyimpan lesson')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {lesson ? 'Edit Lesson' : 'Buat Lesson Baru'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutan Lesson <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.lesson_order}
                onChange={(e) => setForm({ ...form, lesson_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimasi Durasi (menit)
              </label>
              <input
                type="number"
                min="1"
                value={form.estimated_duration}
                onChange={(e) => setForm({ ...form, estimated_duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Lesson <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Pengenalan Alfabet Prancis"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Jelaskan apa yang akan dipelajari..."
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Konten
            </label>
            <select
              value={form.content_type}
              onChange={(e) => setForm({ ...form, content_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-black"
            >
              <option value="mixed">Mixed (Text, Audio, Video)</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
              Publish lesson (siswa dapat mengakses)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50 transition"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : lesson ? 'Update Lesson' : 'Buat Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherChapterDetail

