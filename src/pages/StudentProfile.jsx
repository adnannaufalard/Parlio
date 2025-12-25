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

import { useNavigate } from 'react-router-dom'
import StudentLayout from '../components/StudentLayout'
import { ComingSoon } from '../components/StateAnimations'

export default function StudentProfile() {
  const navigate = useNavigate()

  return (
    <StudentLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg mx-auto px-4">
          <ComingSoon
            title="Profil & Prestasi"
            description="Halaman profil akan segera hadir! Lihat semua prestasi dan badge Anda."
          />

          {/* Features Preview */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-left mt-6">
            <h3 className="font-semibold text-indigo-900 mb-3">Fitur yang akan datang:</h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Profil yang dapat dikustomisasi</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Galeri Badge & Lencana</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Statistik pembelajaran</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Pengaturan akun</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
