/**
 * StudentProfile.jsx
 * Halaman Profile & Prestasi untuk Siswa
 * Menampilkan profil personal dan achievement sesuai blueprint Parlio
 * 
 * Features (Planned):
 * - Profil pribadi yang dapat dikustomisasi
 * - Galeri badges yang sudah didapat
 * - Statistik personal (total XP, waktu belajar, akurasi)
 * - Settings akun (ganti password)
 * 
 * Status: PLACEHOLDER - To be implemented
 */

import StudentLayout from '../components/StudentLayout'
import UserInfoHeader from '../components/UserInfoHeader'

export default function StudentProfile() {
  return (
    <StudentLayout>
      {/* User Info Header */}
      <UserInfoHeader />

      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            👤 Profil & Prestasi
          </h2>
          
          <p className="text-gray-600 mb-6">
            Halaman profil akan segera hadir! Lihat semua prestasi dan badge Anda.
          </p>

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-indigo-900 mb-2">Fitur yang akan datang:</p>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>✨ Profil yang dapat dikustomisasi</li>
              <li>✨ Galeri Badge & Lencana</li>
              <li>✨ Statistik pembelajaran</li>
              <li>✨ Pengaturan akun</li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
