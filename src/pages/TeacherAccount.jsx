/**
 * TeacherAccount.jsx
 * Halaman Akun untuk Guru
 * 
 * Fitur:
 * - Mengelola profil guru (nama, email, avatar)
 * - Ganti password
 * - Statistik mengajar
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'

function TeacherAccount() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    avatar_url: ''
  })
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalQuests: 0,
    totalChapters: 0
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile({
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        avatar_url: data.avatar_url || ''
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat profil')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get teacher's classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id)

      const classIds = classes?.map(c => c.id) || []

      // Get total students
      const { data: members } = await supabase
        .from('class_members')
        .select('student_id')
        .in('class_id', classIds)

      const uniqueStudents = [...new Set(members?.map(m => m.student_id) || [])]

      // Get chapters linked to classes
      const { data: classChapters } = await supabase
        .from('class_chapters')
        .select('chapter_id')
        .in('class_id', classIds)

      const chapterIds = [...new Set(classChapters?.map(cc => cc.chapter_id) || [])]

      // Get lessons from chapters
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('chapter_id', chapterIds)

      const lessonIds = lessons?.map(l => l.id) || []

      // Get quests
      const { data: quests } = await supabase
        .from('quests')
        .select('id')
        .in('lesson_id', lessonIds)

      setStats({
        totalClasses: classes?.length || 0,
        totalStudents: uniqueStudents.length,
        totalChapters: chapterIds.length,
        totalQuests: quests?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profil berhasil disimpan!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menyimpan profil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success('Foto profil berhasil diperbarui!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal upload foto')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('Password baru tidak cocok')
      return
    }

    if (passwords.new.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (error) throw error

      toast.success('Password berhasil diubah!')
      setShowPasswordModal(false)
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal mengubah password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-blue-800 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl"></span>
            <div>
              <h1 className="text-2xl font-bold">Pengaturan Akun</h1>
              <p className="text-indigo-100">Kelola profil dan pengaturan akun Anda</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">Profil Saya</h2>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-indigo-100 overflow-hidden border-4 border-indigo-200">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-indigo-600">
                        {profile.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Klik untuk ubah foto</p>
              </div>

              {/* Form */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Ubah Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-red-200">
          <div className="p-6 border-b bg-red-50">
            <h2 className="font-semibold text-red-800">⚠️ Zona Berbahaya</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <p className="text-red-600 font-medium mb-2">Hapus Akun Permanen</p>
              <p className="text-gray-600 text-sm mb-3">Menghapus akun akan menghilangkan semua data Anda secara permanen. Aksi ini tidak dapat dibatalkan.</p>
              <button
                onClick={() => {
                  toast((t) => (
                    <div className="flex flex-col gap-2">
                      <p className="font-medium text-red-600">⚠️ Hapus Akun?</p>
                      <p className="text-sm text-gray-600">Semua data akan dihapus permanen!</p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            toast.dismiss(t.id)
                            try {
                              const { data: { user } } = await supabase.auth.getUser()
                              if (!user) return
                              
                              // Delete user data (profile will cascade)
                              const { error } = await supabase.rpc('delete_user_account', { user_id: user.id })
                              
                              if (error) {
                                // If RPC doesn't exist, just sign out
                                console.error('Delete error:', error)
                                toast.error('Fitur hapus akun belum tersedia. Hubungi admin.')
                                return
                              }
                              
                              await supabase.auth.signOut()
                              toast.success('Akun berhasil dihapus')
                              navigate('/login')
                            } catch (err) {
                              console.error(err)
                              toast.error('Gagal menghapus akun')
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ), { duration: 15000 })
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔐 Ubah Password</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswords({ current: '', new: '', confirm: '' })
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !passwords.new || !passwords.confirm}
                className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                {changingPassword ? 'Mengubah...' : 'Ubah Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  )
}

export default TeacherAccount
