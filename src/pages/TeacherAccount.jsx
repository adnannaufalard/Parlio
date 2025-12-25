/**
 * TeacherAccount.jsx
 * Halaman Akun untuk Guru
 * 
 * Fitur sesuai Blueprint:
 * - Mengelola profil guru (nama, email, avatar)
 * - Ganti password
 * - Pengaturan notifikasi
 * 
 * Status: 🚧 Coming Soon
 */

import { useNavigate } from 'react-router-dom'
import TeacherLayout from '../components/TeacherLayout'
import { ComingSoon } from '../components/StateAnimations'

function TeacherAccount() {
  const navigate = useNavigate()

  return (
    <TeacherLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <ComingSoon
            title="Pengaturan Akun"
            description="Fitur untuk mengelola profil dan pengaturan akun Anda akan segera hadir!"
            onBack={() => navigate('/teacher/dashboard')}
          />
          
          {/* Features Preview */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-left mt-6">
            <h3 className="font-semibold text-indigo-900 mb-3">Fitur yang akan tersedia:</h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Edit profil (nama, email, foto profil)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Ganti password</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Pengaturan notifikasi</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Preferensi bahasa dan tema</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Riwayat aktivitas</span>
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherAccount
