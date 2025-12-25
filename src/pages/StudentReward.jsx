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

import { useNavigate } from 'react-router-dom'
import StudentLayout from '../components/StudentLayout'
import { ComingSoon } from '../components/StateAnimations'

export default function StudentReward() {
  const navigate = useNavigate()

  return (
    <StudentLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-lg mx-auto px-4">
          <ComingSoon
            title="Boutique de Souvenirs"
            description="Toko Suvenir akan segera dibuka! Belanjakan Écus Anda untuk item eksklusif."
          />

          {/* Features Preview */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-left mt-6">
            <h3 className="font-semibold text-purple-900 mb-3">Produk yang akan tersedia:</h3>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Bingkai Avatar Premium</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Tema Profil Eksklusif</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Badge Khusus</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Efek Animasi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
