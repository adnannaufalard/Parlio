import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'react-hot-toast'

export default function CreateClassModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    class_name: ''
  })
  const [loading, setLoading] = useState(false)

  // Generate kode unik 6 digit alfanumerik
  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.class_name.trim()) {
      toast.error('Nama kelas harus diisi')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Generate kode kelas unik
      let classCode = generateClassCode()
      let isUnique = false
      let attempts = 0
      
      // Cek apakah kode sudah ada, jika ada generate ulang
      while (!isUnique && attempts < 10) {
        const { data: existing, error } = await supabase
          .from('classes')
          .select('class_code')
          .eq('class_code', classCode)
          .maybeSingle()
        
        // Jika tidak ada data atau error PGRST116 (no rows), berarti kode unik
        if (!existing || (error && error.code === 'PGRST116')) {
          isUnique = true
        } else {
          classCode = generateClassCode()
          attempts++
        }
      }

      if (!isUnique) {
        toast.error('Gagal generate kode kelas, silakan coba lagi')
        setLoading(false)
        return
      }

      // Insert kelas baru (tanpa description karena kolom tidak ada di database)
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          class_name: formData.class_name.trim(),
          class_code: classCode,
          teacher_id: user.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Database error')
      }

      if (!data) {
        throw new Error('Kelas berhasil dibuat tapi tidak ada data yang dikembalikan')
      }

      toast.success(`Kelas berhasil dibuat! Kode: ${classCode}`)
      setFormData({ class_name: '' })
      onSuccess(data)
      onClose()
    } catch (error) {
      console.error('Error creating class:', error)
      
      let errorMessage = 'Gagal membuat kelas'
      
      if (error.message) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = 'Tabel classes belum dibuat di database. Silakan deploy schema terlebih dahulu.'
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Anda tidak memiliki akses untuk membuat kelas. Pastikan Anda login sebagai Guru.'
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Kode kelas sudah ada. Silakan coba lagi.'
        } else {
          errorMessage = `Gagal membuat kelas: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Buat Kelas Baru</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="class_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="class_name"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                placeholder="Contoh: Bahasa Prancis A1 - Kelas Pagi"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                  Kode kelas akan dibuat otomatis. Bagikan kode ini kepada siswa agar mereka bisa bergabung.
                </p>
              </div>
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Membuat...' : 'Buat Kelas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
