import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'

function StudentTestingPanel() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleViewStats = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points, coins, full_name, role')
        .eq('id', user.id)
        .single()

      // Get all quest attempts
      const { data: attempts } = await supabase
        .from('student_quest_attempts')
        .select(`
          *,
          quest:quests(title)
        `)
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false })

      setStats({
        profile,
        attempts,
        totalAttempts: attempts?.length || 0,
        passedAttempts: attempts?.filter(a => a.passed).length || 0,
        totalXPEarned: attempts?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0,
        totalCoinsEarned: attempts?.reduce((sum, a) => sum + (a.coins_earned || 0), 0) || 0
      })

      console.log('=== USER STATS ===')
      console.log('Profile:', profile)
      console.log('Total Attempts:', attempts?.length)
      console.table(attempts)

      toast.success('Stats berhasil dimuat!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal load stats')
    } finally {
      setLoading(false)
    }
  }

  const handleResetAttempts = async () => {
    if (!window.confirm('⚠️ Reset SEMUA history attempt untuk SEMUA quest?\n\nXP dan Coins TIDAK akan direset (tetap).\n\nTidak bisa di-undo!')) return
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User tidak ditemukan')
        return
      }

      console.log('=== RESET ATTEMPTS START ===')
      console.log('User ID:', user.id)

      // Check current attempts
      const { data: beforeAttempts } = await supabase
        .from('student_quest_attempts')
        .select('id')
        .eq('student_id', user.id)

      console.log('Total attempts before:', beforeAttempts?.length || 0)

      // Delete all attempts
      const { data: deletedData, error } = await supabase
        .from('student_quest_attempts')
        .delete()
        .eq('student_id', user.id)
        .select()

      if (error) {
        console.error('❌ Error resetting attempts:', error)
        toast.error(`Gagal reset attempts: ${error.message}`)
        return
      }

      console.log('✅ Attempts deleted:', deletedData?.length || 0)

      // Verify deletion
      const { data: afterAttempts } = await supabase
        .from('student_quest_attempts')
        .select('id')
        .eq('student_id', user.id)

      console.log('Remaining attempts:', afterAttempts?.length || 0)
      console.log('=== RESET ATTEMPTS COMPLETE ===')

      toast.success(`✅ ${deletedData?.length || 0} history attempts berhasil dihapus!\n\nXP dan Coins tetap tidak berubah.`, {
        duration: 4000
      })
      setStats(null)

      // Refresh after 1.5 seconds
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('❌ Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleResetXPCoins = async () => {
    if (!window.confirm('⚠️ Reset XP dan Coins ke 0?\n\nHistory attempts TIDAK akan dihapus (tetap).\n\nTidak bisa di-undo!')) return
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User tidak ditemukan')
        return
      }

      console.log('=== RESET XP & COINS START ===')
      console.log('User ID:', user.id)

      // Get current values
      const { data: beforeProfile } = await supabase
        .from('profiles')
        .select('xp_points, coins')
        .eq('id', user.id)
        .single()

      console.log('Before reset:', beforeProfile)

      // Reset to 0
      const { error } = await supabase
        .from('profiles')
        .update({ xp_points: 0, coins: 0 })
        .eq('id', user.id)

      if (error) {
        console.error('❌ Error resetting XP/Coins:', error)
        toast.error(`Gagal reset XP/Coins: ${error.message}`)
        return
      }

      // Verify update
      const { data: afterProfile } = await supabase
        .from('profiles')
        .select('xp_points, coins')
        .eq('id', user.id)
        .single()

      console.log('After reset:', afterProfile)
      console.log('=== RESET XP & COINS COMPLETE ===')

      toast.success('✅ XP dan Coins berhasil di-reset ke 0!\n\nHistory attempts tetap tersimpan.', {
        duration: 4000
      })

      // Update stats display
      if (stats?.profile) {
        setStats({
          ...stats,
          profile: { ...stats.profile, xp_points: 0, coins: 0 }
        })
      }

      // Refresh after 1.5 seconds
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('❌ Error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleResetAllProgress = async () => {
    if (!window.confirm('⚠️⚠️⚠️ RESET SEMUA PROGRESS (history attempts + XP + coins)?\n\nTIDAK BISA DI-UNDO!\n\nSetelah reset, kamu akan mulai dari awal (0 XP, 0 Coins, 0 attempts).')) {
      return
    }

    const confirmation = window.prompt('Ketik "RESET" (huruf besar) untuk konfirmasi:')
    if (confirmation !== 'RESET') {
      toast.error('Reset dibatalkan')
      return
    }
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User tidak ditemukan')
        return
      }

      console.log('=== RESET ALL PROGRESS START ===')
      console.log('User ID:', user.id)

      // Step 1: Check current attempts
      const { data: beforeAttempts, error: checkError } = await supabase
        .from('student_quest_attempts')
        .select('id, quest_id, attempt_number, score')
        .eq('student_id', user.id)

      console.log('Current attempts before delete:', beforeAttempts?.length || 0)
      console.table(beforeAttempts)

      // Step 2: Delete all attempts
      const { data: deletedData, error: attemptsError } = await supabase
        .from('student_quest_attempts')
        .delete()
        .eq('student_id', user.id)
        .select()

      if (attemptsError) {
        console.error('❌ Error deleting attempts:', attemptsError)
        throw new Error(`Gagal hapus history: ${attemptsError.message}`)
      }

      console.log('✅ Attempts deleted:', deletedData?.length || 0)

      // Step 3: Verify deletion
      const { data: afterAttempts } = await supabase
        .from('student_quest_attempts')
        .select('id')
        .eq('student_id', user.id)

      console.log('Remaining attempts after delete:', afterAttempts?.length || 0)

      if (afterAttempts && afterAttempts.length > 0) {
        console.warn('⚠️ WARNING: Some attempts still exist!')
      }

      // Step 4: Reset XP and coins
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp_points: 0, coins: 0 })
        .eq('id', user.id)

      if (profileError) {
        console.error('❌ Error resetting profile:', profileError)
        throw new Error(`Gagal reset XP/Coins: ${profileError.message}`)
      }

      console.log('✅ XP and Coins reset to 0')

      // Step 5: Verify profile update
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('xp_points, coins')
        .eq('id', user.id)
        .single()

      console.log('Profile after reset:', updatedProfile)
      console.log('=== RESET ALL PROGRESS COMPLETE ===')

      toast.success('✅ Semua progress berhasil di-reset!\n\nHistory quest, XP, dan Coins sudah 0.', {
        duration: 5000
      })
      
      // Clear stats display
      setStats(null)

      // Refresh page after 2 seconds to ensure all data is updated
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('❌ Error:', error)
      toast.error(error.message || 'Gagal reset progress')
    } finally {
      setLoading(false)
    }
  }

  return (
    <StudentLayout showHeader={true} showBottomNav={true}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold font-['Poppins'] flex items-center gap-2">
              🧪 Testing Panel
            </h1>
            <button
              onClick={() => navigate(-1)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-white/90 font-['Poppins']">
            Alat untuk testing dan reset progress (Development Only)
          </p>
          <div className="mt-3 bg-yellow-600/30 border border-yellow-300/30 rounded-lg px-3 py-2">
            <p className="text-xs text-white font-['Poppins']">
              ⚠️ <strong>PERHATIAN:</strong> Semua aksi reset tidak bisa di-undo! Gunakan dengan hati-hati.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 font-['Poppins']">
            🎮 Testing Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleViewStats}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors font-['Poppins']"
            >
              <span>📊</span>
              <span>{loading ? 'Loading...' : 'View Stats'}</span>
            </button>

            <button
              onClick={handleResetAttempts}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors font-['Poppins']"
            >
              <span>🔄</span>
              <span>{loading ? 'Loading...' : 'Reset All Attempts'}</span>
            </button>

            <button
              onClick={handleResetXPCoins}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors font-['Poppins']"
            >
              <span>💎</span>
              <span>{loading ? 'Loading...' : 'Reset XP & Coins'}</span>
            </button>

            <button
              onClick={handleResetAllProgress}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors font-['Poppins']"
            >
              <span>⚠️</span>
              <span>{loading ? 'Loading...' : 'Reset ALL Progress'}</span>
            </button>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 font-['Poppins']">
              <strong>Keterangan:</strong><br/>
              • <strong>View Stats:</strong> Lihat statistik lengkap profile dan attempts<br/>
              • <strong>Reset All Attempts:</strong> Hapus SEMUA history quest attempts (XP/Coins TETAP)<br/>
              • <strong>Reset XP & Coins:</strong> Set XP dan Coins ke 0 (history attempts TETAP)<br/>
              • <strong>Reset ALL Progress:</strong> Hapus SEMUA (history attempts + XP + Coins) → Start from scratch!
            </p>
          </div>
        </div>

        {/* Stats Display */}
        {stats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 font-['Poppins']">
              📈 Statistics
            </h2>

            {/* Profile Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 font-['Poppins']">
                Profile Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">Name</div>
                  <div className="text-sm font-bold text-gray-800 font-['Poppins']">
                    {stats.profile?.full_name || '-'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">Role</div>
                  <div className="text-sm font-bold text-gray-800 font-['Poppins']">
                    {stats.profile?.role || '-'}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">XP Points</div>
                  <div className="text-sm font-bold text-blue-600 font-['Poppins']">
                    ⚡ {stats.profile?.xp_points || 0}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">Coins</div>
                  <div className="text-sm font-bold text-amber-600 font-['Poppins']">
                    🪙 {stats.profile?.coins || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Quest Stats */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 font-['Poppins']">
                Quest Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">Total Attempts</div>
                  <div className="text-sm font-bold text-gray-800 font-['Poppins']">
                    📝 {stats.totalAttempts}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">Passed</div>
                  <div className="text-sm font-bold text-green-600 font-['Poppins']">
                    ✅ {stats.passedAttempts}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">Total XP Earned</div>
                  <div className="text-sm font-bold text-blue-600 font-['Poppins']">
                    ⚡ {stats.totalXPEarned}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-['Poppins']">Total Coins Earned</div>
                  <div className="text-sm font-bold text-amber-600 font-['Poppins']">
                    🪙 {stats.totalCoinsEarned}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Attempts */}
            {stats.attempts && stats.attempts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 font-['Poppins']">
                  Recent Attempts (Latest 5)
                </h3>
                <div className="space-y-2">
                  {stats.attempts.slice(0, 5).map((attempt, index) => (
                    <div 
                      key={attempt.id}
                      className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800 font-['Poppins']">
                          {attempt.quest?.title || `Quest ID: ${attempt.quest_id}`}
                        </div>
                        <div className="text-xs text-gray-500 font-['Poppins']">
                          Attempt #{attempt.attempt_number} • 
                          Score: {attempt.score}/{attempt.max_score} ({attempt.percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attempt.passed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded font-['Poppins']">
                            LULUS
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded font-['Poppins']">
                            GAGAL
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <h3 className="text-sm font-bold text-blue-800 mb-2 font-['Poppins']">
            💡 Tips Penggunaan
          </h3>
          <ul className="text-xs text-blue-700 space-y-1 font-['Poppins']">
            <li>• Gunakan "View Stats" untuk melihat progress lengkap sebelum reset</li>
            <li>• "Reset All Attempts" berguna untuk testing ulang quest system</li>
            <li>• "Reset XP & Coins" untuk testing reward system tanpa hapus history</li>
            <li>• "Reset ALL Progress" untuk fresh start lengkap</li>
            <li>• Check browser console untuk log detail setiap operasi</li>
          </ul>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentTestingPanel
