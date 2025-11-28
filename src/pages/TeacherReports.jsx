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

import TeacherLayout from '../components/TeacherLayout'

function TeacherReports() {
  return (
    <TeacherLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Laporan & Analitik
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Fitur untuk generate dan export laporan nilai siswa akan segera hadir!
          </p>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold mb-6">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Coming Soon
          </div>

          {/* Features Preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-green-900 mb-3">Fitur yang akan tersedia:</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Laporan nilai siswa per kelas</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
