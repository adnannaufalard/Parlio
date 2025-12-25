/**
 * StudentReward.jsx
 * Halaman Boutique de Souvenirs (Toko Suvenir) untuk Siswa
 * Tempat membelanjakan Écus (Coins) sesuai blueprint Parlio
 * 
 * Features (Planned):
 * - Belanja item kosmetik dengan coins
 * - Avatar frames (bingkai avatar)
 * - Profile themes (tema profil)
 * - Inventory management
 * 
 * Status: PLACEHOLDER - To be implemented
 */

import StudentLayout from '../components/StudentLayout'
import UserInfoHeader from '../components/UserInfoHeader'

export default function StudentReward() {
  return (
    <StudentLayout>
      {/* User Info Header */}
      <UserInfoHeader />

      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            🎁 Boutique de Souvenirs
          </h2>
          
          <p className="text-gray-600 mb-6">
            Toko Suvenir akan segera dibuka! Belanjakan Écus Anda untuk item eksklusif.
          </p>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-purple-900 mb-2">Produk yang akan tersedia:</p>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>✨ Bingkai Avatar Premium</li>
              <li>✨ Tema Profil Eksklusif</li>
              <li>✨ Badge Khusus</li>
              <li>✨ Efek Animasi</li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
