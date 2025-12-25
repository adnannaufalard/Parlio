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

import { useNavigate } from 'react-router-dom'
import StudentLayout from '../components/StudentLayout'
import { ComingSoon } from '../components/StateAnimations'

export default function StudentLeaderboard() {
  const navigate = useNavigate()

  return (
    <StudentLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg mx-auto px-4">
          <ComingSoon
            title="Leaderboard"
            description="Halaman peringkat akan segera hadir! Pantau posisi Anda di papan peringkat XP."
          />

          {/* Features Preview */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left mt-6">
            <h3 className="font-semibold text-amber-900 mb-3">Fitur yang akan datang:</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Peringkat berdasarkan XP</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Filter per kelas</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Ranking global sekolah</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Badge untuk Top 3</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
