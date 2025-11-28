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

import TeacherLayout from '../components/TeacherLayout'

function TeacherAccount() {
  return (
    <TeacherLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Pengaturan Akun
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Fitur untuk mengelola profil dan pengaturan akun Anda akan segera hadir!
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold mb-6">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Coming Soon
          </div>

          {/* Features Preview */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-indigo-900 mb-3">Fitur yang akan tersedia:</h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Edit profil (nama, email, foto profil)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
