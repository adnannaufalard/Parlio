/**
 * StudentLeaderboard.jsx
 * Halaman Leaderboard untuk Siswa
 * Menampilkan peringkat berdasarkan XP sesuai blueprint Parlio
 * 
 * Features (Planned):
 * - Peringkat global (seluruh sekolah)
 * - Filter: Peringkat di kelas saya
 * - Display: Rank, Avatar, Name, XP, Level
 * 
 * Status: PLACEHOLDER - To be implemented
 */

import StudentLayout from '../components/StudentLayout'
import UserInfoHeader from '../components/UserInfoHeader'

export default function StudentLeaderboard() {
  return (
    <StudentLayout>
      {/* User Info Header */}
      <UserInfoHeader />

      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            🏆 Leaderboard
          </h2>
          
          <p className="text-gray-600 mb-6">
            Halaman peringkat akan segera hadir! Pantau posisi Anda di papan peringkat XP.
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-2">Fitur yang akan datang:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✨ Peringkat berdasarkan XP</li>
              <li>✨ Filter per kelas</li>
              <li>✨ Ranking global sekolah</li>
              <li>✨ Badge untuk Top 3</li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
