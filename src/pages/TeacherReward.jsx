/**
 * TeacherReward.jsx
 * Halaman Reward untuk Guru
 * 
 * Fitur:
 * - Memberikan reward manual ke siswa (XP, Coins)
 * - Melihat riwayat reward yang diberikan
 * - Quick reward untuk top performers
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'

function TeacherReward() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [rewardType, setRewardType] = useState('xp')
  const [rewardAmount, setRewardAmount] = useState(10)
  const [rewardReason, setRewardReason] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [giving, setGiving] = useState(false)
  const [rewardHistory, setRewardHistory] = useState([])

  useEffect(() => {
    fetchTeacherClasses()
    fetchRewardHistory()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchStudents()
    } else {
      setStudents([])
    }
  }, [selectedClass])

  const fetchTeacherClasses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name')
        .eq('teacher_id', user.id)
        .order('class_name')

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data: members, error } = await supabase
        .from('class_members')
        .select(`
          student_id,
          student:profiles!class_members_student_id_fkey(id, full_name, email, avatar_url, xp_points, coins)
        `)
        .eq('class_id', selectedClass)

      if (error) throw error
      setStudents(members?.map(m => m.student) || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchRewardHistory = async () => {
    // Fitur riwayat reward belum tersedia - tabel reward_history belum dibuat
    // Jika ingin mengaktifkan, buat tabel reward_history di Supabase terlebih dahulu
    setRewardHistory([])
  }

  const handleGiveReward = async () => {
    if (!selectedStudent || rewardAmount <= 0) {
      toast.error('Pilih siswa dan masukkan jumlah reward')
      return
    }

    setGiving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update student's XP or Coins
      const updateField = rewardType === 'xp' ? 'xp_points' : 'coins'
      const currentValue = selectedStudent[updateField] || 0

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: currentValue + rewardAmount })
        .eq('id', selectedStudent.id)

      if (updateError) throw updateError

      // Try to save reward history (table might not exist)
      try {
        await supabase
          .from('reward_history')
          .insert({
            teacher_id: user.id,
            student_id: selectedStudent.id,
            reward_type: rewardType,
            amount: rewardAmount,
            reason: rewardReason || 'Reward dari guru'
          })
      } catch (historyError) {
        console.log('Reward history table not available')
      }

      toast.success(`Berhasil memberikan ${rewardAmount} ${rewardType.toUpperCase()} ke ${selectedStudent.full_name}!`)
      
      // Reset form
      setShowModal(false)
      setSelectedStudent(null)
      setRewardAmount(10)
      setRewardReason('')
      
      // Refresh data
      fetchStudents()
      fetchRewardHistory()

    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memberikan reward')
    } finally {
      setGiving(false)
    }
  }

  const quickRewardPresets = [
    { label: 'Aktif di Kelas', xp: 10, coins: 5, icon: '🙋' },
    { label: 'Membantu Teman', xp: 15, coins: 10, icon: '🤝' },
    { label: 'Tugas Tepat Waktu', xp: 20, coins: 15, icon: '⏰' },
    { label: 'Nilai Sempurna', xp: 50, coins: 25, icon: '💯' },
    { label: 'Siswa Terbaik Minggu Ini', xp: 100, coins: 50, icon: '🌟' },
  ]

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl"></span>
            <div>
              <h1 className="text-2xl font-bold">Reward System</h1>
              <p className="text-purple-100">Berikan reward kepada siswa yang berprestasi</p>
            </div>
          </div>
        </div>

        {/* Quick Rewards */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">⚡ Quick Rewards</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickRewardPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setRewardType('xp')
                  setRewardAmount(preset.xp)
                  setRewardReason(preset.label)
                  setShowModal(true)
                }}
                className="p-4 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition text-center"
              >
                <div className="text-3xl mb-2">{preset.icon}</div>
                <p className="text-sm font-medium text-gray-800">{preset.label}</p>
                <div className="flex justify-center gap-2 mt-2 text-xs">
                  <span className="text-purple-600">+{preset.xp} XP</span>
                  <span className="text-yellow-600">+{preset.coins} 🪙</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Give Reward Form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🎯 Berikan Reward Manual</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left - Select Student */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>

              {students.length > 0 && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Siswa</label>
                  <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                    {students.map(student => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full p-3 text-left hover:bg-purple-50 transition ${
                          selectedStudent?.id === student.id ? 'bg-purple-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden flex-shrink-0">
                            {student.avatar_url ? (
                              <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-600 font-semibold">
                                {student.full_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{student.full_name}</p>
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span>⭐ {student.xp_points || 0} XP</span>
                              <span>🪙 {student.coins || 0}</span>
                            </div>
                          </div>
                          {selectedStudent?.id === student.id && (
                            <span className="text-purple-600">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right - Reward Details */}
            <div>
              {selectedStudent && (
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-600 font-medium">Siswa Terpilih:</p>
                  <p className="text-lg font-bold text-purple-900">{selectedStudent.full_name}</p>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Reward</label>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setRewardType('xp')}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    rewardType === 'xp'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⭐ XP
                </button>
                <button
                  onClick={() => setRewardType('coins')}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    rewardType === 'coins'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🪙 Coins
                </button>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah</label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2">Alasan (opsional)</label>
              <input
                type="text"
                value={rewardReason}
                onChange={(e) => setRewardReason(e.target.value)}
                placeholder="Contoh: Aktif di kelas"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
              />

              <button
                onClick={handleGiveReward}
                disabled={!selectedStudent || rewardAmount <= 0 || giving}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {giving ? 'Memberikan...' : `Berikan ${rewardAmount} ${rewardType.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>

        {/* Reward History */}
        {rewardHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-800">📜 Riwayat Reward</h2>
            </div>
            <div className="divide-y">
              {rewardHistory.map((reward) => (
                <div key={reward.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      reward.reward_type === 'xp' ? 'bg-purple-100' : 'bg-yellow-100'
                    }`}>
                      {reward.reward_type === 'xp' ? '⭐' : '🪙'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{reward.student?.full_name}</p>
                      <p className="text-sm text-gray-500">{reward.reason || 'Reward dari guru'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${reward.reward_type === 'xp' ? 'text-purple-600' : 'text-yellow-600'}`}>
                      +{reward.amount} {reward.reward_type.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(reward.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Quick Reward */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🎁 Berikan Reward</h3>
            
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-600">{rewardReason}</p>
              <p className="text-2xl font-bold text-purple-900">+{rewardAmount} XP</p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.class_name}</option>
              ))}
            </select>

            {students.length > 0 && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Siswa</label>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y mb-4">
                  {students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-3 text-left hover:bg-purple-50 transition ${
                        selectedStudent?.id === student.id ? 'bg-purple-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                          {student.full_name?.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{student.full_name}</span>
                        {selectedStudent?.id === student.id && (
                          <span className="ml-auto text-purple-600">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedStudent(null)
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleGiveReward}
                disabled={!selectedStudent || giving}
                className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {giving ? 'Memberikan...' : 'Berikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  )
}

export default TeacherReward
