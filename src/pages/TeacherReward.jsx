/**
 * TeacherReward.jsx
 * Halaman Reward untuk Guru
 * 
 * Fitur sesuai Blueprint:
 * - Memberikan reward manual ke siswa
 * - Contoh: Berikan coins/XP tambahan, lencana kustom
 * 
 * Status: 🚧 Coming Soon
 */

import { useNavigate } from 'react-router-dom'
import TeacherLayout from '../components/TeacherLayout'
import { ComingSoon } from '../components/StateAnimations'

function TeacherReward() {
  const navigate = useNavigate()

  return (
    <TeacherLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <ComingSoon
            title="Reward System"
            description="Fitur untuk memberikan reward manual kepada siswa akan segera hadir!"
            onBack={() => navigate('/teacher/dashboard')}
          />
          
          {/* Features Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-left mt-6">
            <h3 className="font-semibold text-purple-900 mb-3">Fitur yang akan tersedia:</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Berikan XP atau Coins tambahan ke siswa</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Berikan lencana (badges) kustom</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Reward untuk Top 3 Leaderboard Mingguan</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Riwayat reward yang telah diberikan</span>
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherReward
