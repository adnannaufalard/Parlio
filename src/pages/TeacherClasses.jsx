import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import CreateClassModal from '../components/CreateClassModal'
import { toast } from 'react-hot-toast'

export default function TeacherClasses() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_members (count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Gagal memuat kelas')
    }
    setLoading(false)
  }

  const handleCreateSuccess = (newClass) => {
    fetchClasses()
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Kode kelas berhasil disalin!')
  }

  const handleDeleteClass = async (classId) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
      
      if (error) throw error
      
      toast.success('Kelas berhasil dihapus')
      fetchClasses()
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Gagal menghapus kelas: ' + error.message)
    }
  }

  const getStudentCount = (cls) => {
    return cls.class_members?.[0]?.count || 0
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header dengan tombol buat kelas */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kelola Kelas</h2>
            <p className="text-gray-600 mt-1">Buat dan kelola kelas pembelajaran Anda</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Kelas Baru
          </button>
        </div>

        {/* Daftar Kelas */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Kelas</h3>
            <p className="text-gray-600 mb-6">Mulai dengan membuat kelas pertama Anda</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Buat Kelas Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{cls.class_name}</h3>
                    </div>
                  </div>
                </div>

                {/* Body Card */}
                <div className="p-4">
                  {/* Kode Kelas */}
                  <div className="mb-4">
                    <label className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                      Kode Kelas
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 px-3 py-2 rounded-md">
                        <span className="font-mono font-bold text-lg text-gray-900">
                          {cls.class_code}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(cls.class_code)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition"
                        title="Salin kode"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>{getStudentCount(cls)} Siswa</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(cls.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/teacher/classes/${cls.id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium text-center"
                    >
                      Kelola
                    </Link>
                    <button
                      onClick={() => setShowDeleteConfirm(cls.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition"
                      title="Hapus kelas"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Modal Buat Kelas */}
      <CreateClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Modal Konfirmasi Hapus */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Hapus Kelas?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tindakan ini tidak dapat dibatalkan. Semua data siswa, tugas, dan materi akan dihapus.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteClass(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  )
}

