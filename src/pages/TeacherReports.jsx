/**
 * TeacherReports.jsx
 * Halaman Laporan untuk Guru
 * 
 * Fitur sesuai Blueprint:
 * - Generate laporan nilai siswa
 * - Filter berdasarkan Kelas, Siswa, atau Rentang Waktu
 * - Export ke Excel
 * 
 * Status: 🚧 Coming Soon
 */

import { useNavigate } from 'react-router-dom'
import TeacherLayout from '../components/TeacherLayout'
import { ComingSoon } from '../components/StateAnimations'

function TeacherReports() {
  const navigate = useNavigate()

  return (
    <TeacherLayout>
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <ComingSoon
            title="Laporan & Analitik"
            description="Fitur untuk generate dan export laporan nilai siswa akan segera hadir!"
            onBack={() => navigate('/teacher/dashboard')}
          />
          
          {/* Features Preview */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-left mt-6">
            <h3 className="font-semibold text-green-900 mb-3">Fitur yang akan tersedia:</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Laporan nilai siswa per kelas</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Filter berdasarkan siswa atau rentang waktu</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Export laporan ke Excel (.xlsx)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Grafik visualisasi performa siswa</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Export laporan ke PDF</span>
              </li>
            </ul>
          </div>

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 text-green-600 hover:text-green-700 font-medium"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherReports
