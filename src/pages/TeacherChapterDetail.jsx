import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

// Color palette matching Quest Builder
const bgColors = [
  'from-blue-500 to-indigo-600',
  'from-green-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-600',
  'from-cyan-500 to-blue-600',
]

function TeacherChapterDetail() {
  const { chapterId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get color index from navigation state, default to 0
  const colorIndex = location.state?.colorIndex || 0
  const bgColor = bgColors[colorIndex % bgColors.length]
  
  const [chapter, setChapter] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
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

      // Fetch lessons with materials and quests details
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          quests:quests(id, title, xp_reward),
          materials:lesson_materials(id, title, material_type)
        `)
        .eq('chapter_id', chapterId)
        .order('lesson_order', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

    } catch (error) {
      console.error('Error fetching chapter data:', error)
      toast.error('Gagal memuat data pelajaran')
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
    if (!confirm('Yakin ingin menghapus sub bab ini? Semua quest dan materi akan terhapus.')) return

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)

      if (error) throw error
      toast.success('Sub bab berhasil dihapus')
      fetchChapterData()
    } catch (error) {
      console.error('Error deleting lesson:', error)
      toast.error('Gagal menghapus sub bab')
    }
  }

  const goToLessonDetail = (lessonId) => {
    navigate(`/teacher/quest-builder/lesson/${lessonId}`, {
      state: { colorIndex }
    })
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-24 h-24">
            <DotLottieReact
              src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
              loop
              autoplay
            />
          </div>
        </div>
      </TeacherLayout>
    )
  }

  if (!chapter) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Pelajaran tidak ditemukan</p>
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

  const totalMaterials = lessons.reduce((sum, l) => sum + (l.materials?.length || 0), 0)
  const totalQuests = lessons.reduce((sum, l) => sum + (l.quests?.length || 0), 0)

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header Card with Dynamic Gradient Color */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className={`bg-gradient-to-r ${bgColor} p-6 text-white`}>
            {/* Back Button */}
            <button
              onClick={() => navigate('/teacher/quest-builder')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Kembali</span>
            </button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {chapter.is_published ? (
                    <span className="text-xs bg-green-500 px-2 py-1 rounded-full">Published</span>
                  ) : (
                    <span className="text-xs bg-yellow-500 px-2 py-1 rounded-full">Draft</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-2">{chapter.title}</h1>
                <p className="text-white/90 text-sm">{chapter.description || 'Tidak ada deskripsi'}</p>
              </div>
              <div className="text-4xl ml-4"></div>
            </div>

            {/* Stats Row */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{lessons.length}</p>
                <p className="text-xs text-white/80">Sub Bab</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{totalMaterials}</p>
                <p className="text-xs text-white/80">Materi</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{totalQuests}</p>
                <p className="text-xs text-white/80">Quest</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Bab List - Simplified */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Sub Bab</h2>
            <button
              onClick={handleCreateLesson}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Sub Bab
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="w-40 h-40 mx-auto mb-4">
                <DotLottieReact
                  src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                  loop
                  autoplay
                />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Sub Bab</h4>
              <p className="text-gray-600 mb-4">Buat sub bab pertama untuk pelajaran ini</p>
              <button
                onClick={handleCreateLesson}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Buat Sub Bab Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, idx) => (
                <div 
                  key={lesson.id} 
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer border border-transparent hover:border-blue-200"
                  onClick={() => goToLessonDetail(lesson.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${bgColor} flex items-center justify-center text-white font-bold text-lg`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{lesson.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <span className="text-green-600">📚</span> {lesson.materials?.length || 0} Materi
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-purple-600">🎯</span> {lesson.quests?.length || 0} Quest
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-blue-600">⏱️</span> {lesson.estimated_duration} mnt
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {lesson.is_published ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Published</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Draft</span>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditLesson(lesson) }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Sub Bab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id) }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus Sub Bab"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box - Learning Flow */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Alur Pembelajaran Siswa</h4>
              <p className="text-sm text-blue-700">
                Siswa akan <strong>membaca materi terlebih dahulu</strong>, kemudian setelah selesai baru bisa <strong>mengerjakan quest/tugas</strong>. 
                Pastikan materi sudah lengkap sebelum menambahkan quest.
              </p>
            </div>
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
        toast.success('Sub bab berhasil diupdate')
      } else {
        // Create
        const { error } = await supabase
          .from('lessons')
          .insert([{
            ...form,
            chapter_id: chapterId
          }])

        if (error) throw error
        toast.success('Sub bab berhasil dibuat')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving lesson:', error)
      toast.error('Gagal menyimpan sub bab')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {lesson ? 'Edit Sub Bab' : 'Buat Sub Bab Baru'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutan <span className="text-red-500">*</span>
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
              Judul Sub Bab <span className="text-red-500">*</span>
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
              Publish sub bab (siswa dapat mengakses)
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
              {loading ? 'Menyimpan...' : lesson ? 'Update Sub Bab' : 'Buat Sub Bab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherChapterDetail

