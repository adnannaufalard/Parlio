/**
 * TeacherLeaderboard.jsx
 * Halaman Leaderboard untuk Guru
 * 
 * Fitur sesuai Blueprint:
 * - Melihat papan peringkat XP global
 * - Filter untuk melihat peringkat per kelas atau semua siswa
 * 
 * Status: 🚧 Coming Soon
 */

import { useNavigate } from 'react-router-dom'
import TeacherLayout from '../components/TeacherLayout'
import { ComingSoon } from '../components/StateAnimations'

function TeacherLeaderboard() {
  const navigate = useNavigate()

  return (
    <TeacherLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <ComingSoon
            title="Leaderboard"
            description="Fitur papan peringkat untuk melihat performa siswa berdasarkan XP akan segera hadir!"
            onBack={() => navigate('/teacher/dashboard')}
          />
          
          {/* Features Preview */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left mt-6">
            <h3 className="font-semibold text-amber-900 mb-3">Fitur yang akan tersedia:</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Papan peringkat XP global semua siswa</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Filter peringkat per kelas yang diajar</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Statistik performa siswa (XP, Level, Coins)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Ranking berdasarkan periode (harian, mingguan, bulanan)</span>
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherLeaderboard
