import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'

function SuperAdminMotivationalMessages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    message: '',
    is_active: true,
    display_order: 0
  })

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('motivational_messages')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Gagal memuat motivational messages')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditing(null)
    setFormData({
      message: '',
      is_active: true,
      display_order: messages.length + 1
    })
    setModalOpen(true)
  }

  const handleEdit = (message) => {
    setEditing(message)
    setFormData({
      message: message.message,
      is_active: message.is_active,
      display_order: message.display_order
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const dataToSave = {
        ...formData,
        created_by: editing ? undefined : user.id
      }

      if (editing) {
        // Update
        const { error } = await supabase
          .from('motivational_messages')
          .update(dataToSave)
          .eq('id', editing.id)

        if (error) throw error
        toast.success('Motivational message berhasil diupdate!')
      } else {
        // Create
        const { error } = await supabase
          .from('motivational_messages')
          .insert([dataToSave])

        if (error) throw error
        toast.success('Motivational message berhasil dibuat!')
      }

      setModalOpen(false)
      fetchMessages()
    } catch (error) {
      console.error('Error saving message:', error)
      toast.error('Gagal menyimpan motivational message')
    }
  }

  const handleDelete = async (message) => {
    if (!confirm(`Hapus motivational message "${message.message}"?`)) return

    try {
      const { error } = await supabase
        .from('motivational_messages')
        .delete()
        .eq('id', message.id)

      if (error) throw error
      toast.success('Motivational message berhasil dihapus!')
      fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Gagal menghapus motivational message')
    }
  }

  const toggleActive = async (message) => {
    try {
      const { error } = await supabase
        .from('motivational_messages')
        .update({ is_active: !message.is_active })
        .eq('id', message.id)

      if (error) throw error
      toast.success(`Message ${!message.is_active ? 'diaktifkan' : 'dinonaktifkan'}!`)
      fetchMessages()
    } catch (error) {
      console.error('Error toggling active:', error)
      toast.error('Gagal mengubah status')
    }
  }

  // Predefined motivational message suggestions
  const suggestions = [
    "Mari belajar bahasa Prancis dengan semangat hari ini! 🇫🇷",
    "Setiap kata baru adalah jendela ke dunia baru 🌍",
    "Konsistensi adalah kunci kesuksesan belajar bahasa 📚",
    "Jangan takut membuat kesalahan, itu bagian dari proses belajar ✨",
    "Ayo raih XP dan level up kemampuan bahasa Prancismu! 🚀",
    "Belajar bahasa adalah perjalanan, nikmati prosesnya! 🎯",
    "Practice makes perfect - latihan membawa kesempurnaan 💪",
    "Hari baru, semangat baru untuk belajar! ☀️",
    "Kamu bisa melakukannya! Terus semangat belajar! 🌟",
    "Setiap usaha kecil membawa perubahan besar 🎓"
  ]

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Motivational Messages</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage subtitle motivasi yang tampil di header dashboard siswa
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Message Baru
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Tentang Motivational Messages
              </h3>
              <p className="text-sm text-blue-700">
                Message yang aktif akan dipilih secara random dan ditampilkan sebagai subtitle di header dashboard siswa. 
                Pastikan minimal ada 1 message yang aktif.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Aktif</p>
                <p className="text-2xl font-bold text-green-600">
                  {messages.filter(m => m.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏸️</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Nonaktif</p>
                <p className="text-2xl font-bold text-gray-600">
                  {messages.filter(m => !m.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-4">
                <DotLottieReact
                  src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
                  loop
                  autoplay
                />
              </div>
              <p className="text-gray-500">Memuat messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-40 h-40 mx-auto mb-4">
                <DotLottieReact
                  src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                  loop
                  autoplay
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada motivational message</h3>
              <p className="text-gray-600 mb-6">
                Buat message pertama untuk ditampilkan di dashboard siswa
              </p>
              <button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Buat Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-gray-500">
                          #{message.display_order}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 line-clamp-2 max-w-2xl">
                          {message.message}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(message)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            message.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {message.is_active ? '✓ Aktif' : '✗ Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                          {new Date(message.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(message)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(message)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Form */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? 'Edit Motivational Message' : 'Buat Message Baru'}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Motivational Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Mari belajar bahasa Prancis dengan semangat hari ini!"
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.message.length}/200 karakter
                    </p>
                  </div>

                  {/* Suggestions */}
                  {!editing && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        💡 Saran Message
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setFormData({ ...formData, message: suggestion })}
                            className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-sm text-gray-700"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Preview (Header Dashboard)
                    </label>
                    <div className="bg-gradient-to-br from-[#1E258F] to-[#4450FF] rounded-2xl shadow-lg p-6 text-white">
                      <h1 className="text-2xl font-bold mb-2">
                        Bonjour <span className="font-extrabold">Ahmad</span>,
                      </h1>
                      <p className="text-white/90 text-sm font-medium">
                        {formData.message || 'Motivational message akan tampil di sini...'}
                      </p>
                    </div>
                  </div>

                  {/* Display Order & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.display_order}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Priority saat random selection</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {formData.is_active ? '✓ Active' : '✗ Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
                  >
                    {editing ? 'Update Message' : 'Buat Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default SuperAdminMotivationalMessages
