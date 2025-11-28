import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'

function SuperAdminAnnouncements() {
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'announcement',
    color_from: 'from-blue-500',
    color_to: 'to-blue-600',
    icon: '📢',
    is_active: true,
    display_order: 0,
    published_at: null,
    expires_at: null
  })

  // Predefined color options
  const colorOptions = [
    { name: 'Blue', from: 'from-blue-500', to: 'to-blue-600', preview: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { name: 'Purple', from: 'from-purple-500', to: 'to-purple-600', preview: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { name: 'Green', from: 'from-green-500', to: 'to-green-600', preview: 'bg-gradient-to-br from-green-500 to-green-600' },
    { name: 'Orange', from: 'from-orange-500', to: 'to-orange-600', preview: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { name: 'Pink', from: 'from-pink-500', to: 'to-pink-600', preview: 'bg-gradient-to-br from-pink-500 to-pink-600' },
    { name: 'Red', from: 'from-red-500', to: 'to-red-600', preview: 'bg-gradient-to-br from-red-500 to-red-600' },
    { name: 'Yellow', from: 'from-yellow-500', to: 'to-yellow-600', preview: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
    { name: 'Indigo', from: 'from-indigo-500', to: 'to-indigo-600', preview: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  ]

  // Icon options
  const iconOptions = ['📢', '📅', '💡', '🚀', '⭐', '🎉', '📚', '🏆', '🎯', '✨', '🔥', '💪']

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Gagal memuat announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditing(null)
    setFormData({
      title: '',
      description: '',
      type: 'announcement',
      color_from: 'from-blue-500',
      color_to: 'to-blue-600',
      icon: '📢',
      is_active: true,
      display_order: announcements.length + 1,
      published_at: null,
      expires_at: null
    })
    setModalOpen(true)
  }

  const handleEdit = (announcement) => {
    setEditing(announcement)
    setFormData({
      title: announcement.title,
      description: announcement.description || '',
      type: announcement.type,
      color_from: announcement.color_from,
      color_to: announcement.color_to,
      icon: announcement.icon || '📢',
      is_active: announcement.is_active,
      display_order: announcement.display_order,
      published_at: announcement.published_at ? new Date(announcement.published_at).toISOString().slice(0, 16) : '',
      expires_at: announcement.expires_at ? new Date(announcement.expires_at).toISOString().slice(0, 16) : ''
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const dataToSave = {
        ...formData,
        published_at: formData.published_at || null,
        expires_at: formData.expires_at || null,
        created_by: editing ? undefined : user.id
      }

      if (editing) {
        // Update
        const { error } = await supabase
          .from('announcements')
          .update(dataToSave)
          .eq('id', editing.id)

        if (error) throw error
        toast.success('Announcement berhasil diupdate!')
      } else {
        // Create
        const { error } = await supabase
          .from('announcements')
          .insert([dataToSave])

        if (error) throw error
        toast.success('Announcement berhasil dibuat!')
      }

      setModalOpen(false)
      fetchAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error('Gagal menyimpan announcement')
    }
  }

  const handleDelete = async (announcement) => {
    if (!confirm(`Hapus announcement "${announcement.title}"?`)) return

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id)

      if (error) throw error
      toast.success('Announcement berhasil dihapus!')
      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Gagal menghapus announcement')
    }
  }

  const toggleActive = async (announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id)

      if (error) throw error
      toast.success(`Announcement ${!announcement.is_active ? 'diaktifkan' : 'dinonaktifkan'}!`)
      fetchAnnouncements()
    } catch (error) {
      console.error('Error toggling active:', error)
      toast.error('Gagal mengubah status')
    }
  }

  const handleColorSelect = (colorOption) => {
    setFormData({
      ...formData,
      color_from: colorOption.from,
      color_to: colorOption.to
    })
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Announcements</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage announcement carousel yang tampil di dashboard siswa
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Announcement Baru
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📢</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total</p>
                <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
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
                  {announcements.filter(a => a.is_active).length}
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
                  {announcements.filter(a => !a.is_active).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Scheduled</p>
                <p className="text-2xl font-bold text-purple-600">
                  {announcements.filter(a => a.published_at && new Date(a.published_at) > new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada announcement</h3>
              <p className="text-gray-600 mb-6">
                Buat announcement pertama untuk ditampilkan di dashboard siswa
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
                      Preview
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Title & Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-gray-500">
                          #{announcement.display_order}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${announcement.color_from} ${announcement.color_to} flex items-center justify-center text-2xl shadow-md`}
                        >
                          {announcement.icon}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">
                            {announcement.title}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            announcement.type === 'announcement' ? 'bg-blue-100 text-blue-700' :
                            announcement.type === 'event' ? 'bg-purple-100 text-purple-700' :
                            announcement.type === 'tips' ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {announcement.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(announcement)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                            announcement.is_active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {announcement.is_active ? '✓ Aktif' : '✗ Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {announcement.published_at && (
                            <p className="text-gray-600">
                              📅 {new Date(announcement.published_at).toLocaleDateString('id-ID')}
                            </p>
                          )}
                          {announcement.expires_at && (
                            <p className="text-red-600 text-xs">
                              ⏰ Expires: {new Date(announcement.expires_at).toLocaleDateString('id-ID')}
                            </p>
                          )}
                          {!announcement.published_at && !announcement.expires_at && (
                            <p className="text-gray-400 text-xs">Always visible</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(announcement)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(announcement)}
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? 'Edit Announcement' : 'Buat Announcement Baru'}
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
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Selamat Datang di Parlio!"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Deskripsi lengkap announcement..."
                    />
                  </div>

                  {/* Type & Icon */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="announcement">Announcement</option>
                        <option value="event">Event</option>
                        <option value="tips">Tips</option>
                        <option value="news">News</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Icon
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {iconOptions.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon })}
                            className={`p-2 text-2xl rounded-lg border-2 transition ${
                              formData.icon === icon
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Gradient Color
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {colorOptions.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleColorSelect(color)}
                          className={`relative h-20 rounded-lg ${color.preview} transition-all ${
                            formData.color_from === color.from && formData.color_to === color.to
                              ? 'ring-4 ring-blue-500 ring-offset-2'
                              : 'hover:scale-105'
                          }`}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm bg-black bg-opacity-20 rounded-lg">
                            {color.name}
                          </span>
                          {formData.color_from === color.from && formData.color_to === color.to && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Preview
                    </label>
                    <div className={`bg-gradient-to-br ${formData.color_from} ${formData.color_to} rounded-2xl shadow-lg p-6 text-white`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                          {formData.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold">{formData.title || 'Title Preview'}</h3>
                          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                            {formData.type}
                          </span>
                        </div>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {formData.description || 'Description preview will appear here...'}
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
                      <p className="text-xs text-gray-500 mt-1">Lower number = higher priority</p>
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

                  {/* Schedule */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Published At (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.published_at}
                        onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for immediate publish</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Expires At (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to never expire</p>
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
                    {editing ? 'Update Announcement' : 'Buat Announcement'}
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

export default SuperAdminAnnouncements
