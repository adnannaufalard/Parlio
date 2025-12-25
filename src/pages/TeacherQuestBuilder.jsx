import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

function TeacherQuestBuilder() {
  const navigate = useNavigate()
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  const [assigningChapter, setAssigningChapter] = useState(null)

  useEffect(() => {
    fetchChapters()
  }, [])

  const fetchChapters = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chapters')
        .select(`
          *,
          lessons:lessons(count)
        `)
        .order('floor_number', { ascending: true })

      if (error) throw error
      setChapters(data || [])
    } catch (error) {
      console.error('Error fetching chapters:', error)
      toast.error('Gagal memuat pelajaran')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChapter = () => {
    setEditingChapter(null)
    setShowCreateModal(true)
  }

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter)
    setShowCreateModal(true)
  }

  const handleDeleteChapter = async (chapterId) => {
    if (!confirm('Yakin ingin menghapus pelajaran ini? Semua materi dan quest akan terhapus.')) return

    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId)

      if (error) throw error
      toast.success('Pelajaran berhasil dihapus')
      fetchChapters()
    } catch (error) {
      console.error('Error deleting chapter:', error)
      toast.error('Gagal menghapus pelajaran')
    }
  }

  const handleAssignToClass = (chapter) => {
    setAssigningChapter(chapter)
    setShowAssignModal(true)
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quest Builder</h1>
            <p className="text-gray-600 mt-1">Bangun perjalanan pembelajaran Bahasa Prancis 🇫🇷</p>
          </div>
          <button
            onClick={handleCreateChapter}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Pelajaran Baru
          </button>
        </div>

        {/* Chapters List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4">
              <DotLottieReact
                src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
                loop
                autoplay
              />
            </div>
            <p className="text-gray-600 mt-2">Memuat pelajaran...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-40 h-40 mx-auto mb-4">
              <DotLottieReact
                src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                loop
                autoplay
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pelajaran</h3>
            <p className="text-gray-600 mb-6">Mulai bangun perjalanan pembelajaran dengan membuat pelajaran pertama!</p>
            <button
              onClick={handleCreateChapter}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Buat Pelajaran Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter, idx) => (
              <ChapterCard
                key={chapter.id}
                chapter={{
                  ...chapter,
                  onAssignToClass: () => handleAssignToClass(chapter)
                }}
                index={idx}
                onEdit={() => handleEditChapter(chapter)}
                onDelete={() => handleDeleteChapter(chapter.id)}
                onViewDetails={() => navigate(`/teacher/quest-builder/chapter/${chapter.id}`, { state: { colorIndex: idx } })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <ChapterModal
          chapter={editingChapter}
          onClose={() => {
            setShowCreateModal(false)
            setEditingChapter(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingChapter(null)
            fetchChapters()
          }}
        />
      )}

      {/* Assign to Class Modal */}
      {showAssignModal && assigningChapter && (
        <AssignChapterModal
          chapter={assigningChapter}
          onClose={() => {
            setShowAssignModal(false)
            setAssigningChapter(null)
          }}
          onSuccess={() => {
            setShowAssignModal(false)
            setAssigningChapter(null)
            toast.success('Pelajaran berhasil di-assign ke kelas')
          }}
        />
      )}
    </TeacherLayout>
  )
}

// Chapter Card Component
function ChapterCard({ chapter, index, onEdit, onDelete, onViewDetails }) {
  const bgColors = [
    'from-blue-500 to-indigo-600',
    'from-green-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
  ]
  const bgColor = bgColors[index % bgColors.length]

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className={`bg-gradient-to-r ${bgColor} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {chapter.is_published ? (
                <span className="text-xs bg-green-500 px-2 py-1 rounded-full">Published</span>
              ) : (
                <span className="text-xs bg-yellow-500 px-2 py-1 rounded-full">Draft</span>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">{chapter.title}</h3>
            <p className="text-white/90 text-sm">{chapter.description || 'Tidak ada deskripsi'}</p>
          </div>
          <div className="text-4xl ml-4">📚</div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{chapter.lessons?.[0]?.count || 0} Sub Bab</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>XP Min: {chapter.unlock_xp_required}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Kelola Sub Bab & Quest
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={chapter.onAssignToClass}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition"
            title="Assign ke Kelas"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
            title="Edit Pelajaran"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
            title="Hapus Pelajaran"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Chapter Modal Component
function ChapterModal({ chapter, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    floor_number: 1,
    unlock_xp_required: 0,
    bg_color: '#3B82F6',
    is_published: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (chapter) {
      setForm({
        title: chapter.title || '',
        description: chapter.description || '',
        floor_number: chapter.floor_number || 1,
        unlock_xp_required: chapter.unlock_xp_required || 0,
        bg_color: chapter.bg_color || '#3B82F6',
        is_published: chapter.is_published || false
      })
    }
  }, [chapter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (chapter) {
        // Update existing chapter
        const { error } = await supabase
          .from('chapters')
          .update({
            ...form,
            updated_at: new Date().toISOString()
          })
          .eq('id', chapter.id)

        if (error) throw error
        toast.success('Pelajaran berhasil diupdate')
      } else {
        // Create new chapter
        const { error } = await supabase
          .from('chapters')
          .insert([form])

        if (error) throw error
        toast.success('Pelajaran berhasil dibuat')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving chapter:', error)
      toast.error('Gagal menyimpan pelajaran')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {chapter ? 'Edit Pelajaran' : 'Buat Pelajaran Baru'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Pelajaran <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Les Bases - Dasar-dasar Bahasa Prancis"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
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
              placeholder="Jelaskan apa yang akan dipelajari di pelajaran ini..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
              Publish pelajaran (siswa dapat melihat)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : chapter ? 'Update Pelajaran' : 'Buat Pelajaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Assign Chapter to Class Modal Component
function AssignChapterModal({ chapter, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [selectedClasses, setSelectedClasses] = useState([])
  const [assignedClasses, setAssignedClasses] = useState([])

  useEffect(() => {
    fetchClasses()
    fetchAssignedClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Gagal memuat kelas')
    }
  }

  const fetchAssignedClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('class_chapters')
        .select('class_id')
        .eq('chapter_id', chapter.id)
        .eq('is_active', true)

      if (error) {
        // If table doesn't exist (404), just continue with empty array
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.warn('Table class_chapters not found. Please deploy schema_quest_system.sql first.')
          setAssignedClasses([])
          return
        }
        throw error
      }
      setAssignedClasses((data || []).map(item => item.class_id))
    } catch (error) {
      console.error('Error fetching assigned classes:', error)
    }
  }

  const handleToggleClass = (classId) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId))
    } else {
      setSelectedClasses([...selectedClasses, classId])
    }
  }

  const handleAssign = async () => {
    if (selectedClasses.length === 0) {
      toast.error('Pilih minimal 1 kelas')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Insert selected classes
      const inserts = selectedClasses.map(classId => ({
        class_id: classId,
        chapter_id: chapter.id,
        assigned_by: user.id,
        is_active: true
      }))

      const { error } = await supabase
        .from('class_chapters')
        .upsert(inserts, { onConflict: 'class_id,chapter_id' })

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          toast.error('❌ Table class_chapters belum ada! Deploy schema_quest_system.sql terlebih dahulu.')
          console.error('Deploy schema_quest_system.sql first:', error)
        } else {
          toast.error(`Gagal assign chapter: ${error.message}`)
          console.error('Error details:', error)
        }
        throw error
      }

      onSuccess()
    } catch (error) {
      console.error('Error assigning chapter:', error)
      // Error already handled above with specific messages
    } finally {
      setLoading(false)
    }
  }

  const availableClasses = classes.filter(cls => !assignedClasses.includes(cls.id))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Pelajaran ke Kelas</h3>
          <p className="text-sm text-gray-500 mt-1">
            Pelajaran: <strong>{chapter.title}</strong>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Already Assigned Classes */}
          {assignedClasses.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">✅ Sudah Di-assign ke:</h4>
              <div className="space-y-2">
                {classes
                  .filter(cls => assignedClasses.includes(cls.id))
                  .map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-800">{cls.class_name}</div>
                        <div className="text-xs text-gray-500">Kode: {cls.class_code}</div>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-600 text-white">
                        Active
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Available Classes */}
          {availableClasses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-gray-500">Semua kelas sudah di-assign pelajaran ini</p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Pilih Kelas Baru:</h4>
              <div className="space-y-2">
                {availableClasses.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => handleToggleClass(cls.id)}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedClasses.includes(cls.id)
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls.id)}
                      onChange={() => handleToggleClass(cls.id)}
                      className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{cls.class_name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">Kode: {cls.class_code}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedClasses.length > 0 && (
                <span className="font-semibold text-purple-600">
                  {selectedClasses.length} kelas dipilih
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Tutup
              </button>
              {availableClasses.length > 0 && (
                <button
                  onClick={handleAssign}
                  disabled={loading || selectedClasses.length === 0}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300"
                >
                  {loading ? 'Mengassign...' : `Assign ${selectedClasses.length > 0 ? selectedClasses.length : ''} Pelajaran`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherQuestBuilder

