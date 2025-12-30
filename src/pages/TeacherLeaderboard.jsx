/**
 * TeacherLeaderboard.jsx
 * Halaman Leaderboard untuk Guru
 * 
 * Fitur:
 * - Melihat papan peringkat XP global
 * - Filter untuk melihat peringkat per kelas atau semua siswa
 * - Statistik performa siswa (XP, Level, Coins)
 * - Ranking berdasarkan periode (harian, mingguan, bulanan, semua)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'

function TeacherLeaderboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('all')
  const [period, setPeriod] = useState('all')
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgXP: 0,
    avgCoins: 0,
    topPerformer: null
  })

  useEffect(() => {
    fetchTeacherClasses()
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedClass, period])

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
      console.error('Error fetching classes:', error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found')
        return
      }

      console.log('Current user:', user.id)

      // Get student IDs from teacher's classes
      let studentIds = []

      if (selectedClass === 'all') {
        // Get all students from all classes taught by this teacher
        const { data: teacherClasses, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', user.id)

        console.log('Teacher classes:', teacherClasses, 'Error:', classError)

        if (teacherClasses && teacherClasses.length > 0) {
          const classIds = teacherClasses.map(c => c.id)
          const { data: members, error: membersError } = await supabase
            .from('class_members')
            .select('student_id')
            .in('class_id', classIds)

          console.log('Class members:', members, 'Error:', membersError)

          studentIds = [...new Set(members?.map(m => m.student_id) || [])]
        }
      } else {
        // Get students from selected class
        const { data: members, error: membersError } = await supabase
          .from('class_members')
          .select('student_id')
          .eq('class_id', selectedClass)

        console.log('Selected class members:', members, 'Error:', membersError)

        studentIds = members?.map(m => m.student_id) || []
      }

      console.log('Student IDs:', studentIds)

      if (studentIds.length === 0) {
        setLeaderboard([])
        setStats({ totalStudents: 0, avgXP: 0, avgCoins: 0, topPerformer: null })
        setLoading(false)
        return
      }

      // Fetch student profiles with XP and coins (remove role filter as it might not be set)
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, xp_points, coins, role')
        .in('id', studentIds)
        .order('xp_points', { ascending: false })

      console.log('Students fetched:', students, 'Error:', error)

      if (error) throw error

      // Calculate level for each student
      const leaderboardData = (students || []).map((student, index) => ({
        ...student,
        rank: index + 1,
        level: Math.floor((student.xp_points || 0) / 100) + 1
      }))

      setLeaderboard(leaderboardData)

      // Calculate stats
      const totalXP = leaderboardData.reduce((sum, s) => sum + (s.xp_points || 0), 0)
      const totalCoins = leaderboardData.reduce((sum, s) => sum + (s.coins || 0), 0)

      setStats({
        totalStudents: leaderboardData.length,
        avgXP: leaderboardData.length > 0 ? Math.round(totalXP / leaderboardData.length) : 0,
        avgCoins: leaderboardData.length > 0 ? Math.round(totalCoins / leaderboardData.length) : 0,
        topPerformer: leaderboardData[0] || null
      })

    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      toast.error('Gagal memuat leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-yellow-400', text: 'text-yellow-900', icon: '🥇' }
    if (rank === 2) return { bg: 'bg-gray-300', text: 'text-gray-800', icon: '🥈' }
    if (rank === 3) return { bg: 'bg-amber-600', text: 'text-amber-100', icon: '🥉' }
    return { bg: 'bg-gray-100', text: 'text-gray-700', icon: null }
  }

  if (loading && classes.length === 0) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl"></span>
            <div>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-amber-100">Papan peringkat siswa berdasarkan XP</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="all">Semua Waktu</option>
                <option value="weekly">Minggu Ini</option>
                <option value="monthly">Bulan Ini</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-3xl mb-1">👥</div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500">Total Siswa</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-3xl mb-1">⭐</div>
            <p className="text-2xl font-bold text-purple-600">{stats.avgXP}</p>
            <p className="text-sm text-gray-500">Rata-rata XP</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-3xl mb-1">🪙</div>
            <p className="text-2xl font-bold text-yellow-600">{stats.avgCoins}</p>
            <p className="text-sm text-gray-500">Rata-rata Coins</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="text-3xl mb-1">🏆</div>
            <p className="text-lg font-bold text-amber-600 truncate">
              {stats.topPerformer?.full_name || '-'}
            </p>
            <p className="text-sm text-gray-500">Top Performer</p>
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">🏆 Top 3 Siswa</h2>
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-gray-200 border-4 border-gray-400 overflow-hidden">
                  {leaderboard[1]?.avatar_url ? (
                    <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-600">
                      {leaderboard[1]?.full_name?.charAt(0) || '?'
                      }
                    </div>
                  )}
                </div>
                <div className="text-4xl mb-1">🥈</div>
                <p className="font-semibold text-gray-800 truncate max-w-[100px]">{leaderboard[1]?.full_name}</p>
                <p className="text-sm text-purple-600 font-medium">{leaderboard[1]?.xp_points || 0} XP</p>
                <div className="h-24 w-20 bg-gray-300 rounded-t-lg mx-auto mt-2"></div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-2 rounded-full bg-yellow-100 border-4 border-yellow-400 overflow-hidden">
                  {leaderboard[0]?.avatar_url ? (
                    <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-yellow-600">
                      {leaderboard[0]?.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="text-5xl mb-1">🥇</div>
                <p className="font-bold text-gray-800 truncate max-w-[120px]">{leaderboard[0]?.full_name}</p>
                <p className="text-sm text-purple-600 font-bold">{leaderboard[0]?.xp_points || 0} XP</p>
                <div className="h-32 w-24 bg-yellow-400 rounded-t-lg mx-auto mt-2"></div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-amber-100 border-4 border-amber-600 overflow-hidden">
                  {leaderboard[2]?.avatar_url ? (
                    <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-amber-700">
                      {leaderboard[2]?.full_name?.charAt(0) || '?'
                      }
                    </div>
                  )}
                </div>
                <div className="text-4xl mb-1">🥉</div>
                <p className="font-semibold text-gray-800 truncate max-w-[100px]">{leaderboard[2]?.full_name}</p>
                <p className="text-sm text-purple-600 font-medium">{leaderboard[2]?.xp_points || 0} XP</p>
                <div className="h-16 w-20 bg-amber-600 rounded-t-lg mx-auto mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">Daftar Peringkat</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-gray-500">Belum ada data siswa</p>
              <p className="text-sm text-gray-400">Tambahkan siswa ke kelas untuk melihat leaderboard</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Siswa</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Level</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">XP</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Coins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((student) => {
                    const badge = getRankBadge(student.rank)
                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 ${student.rank <= 3 ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className={`w-10 h-10 rounded-full ${badge.bg} ${badge.text} flex items-center justify-center font-bold text-lg`}>
                            {badge.icon || student.rank}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex-shrink-0">
                              {student.avatar_url ? (
                                <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-blue-600 font-semibold">
                                  {student.full_name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{student.full_name}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold text-sm">
                            Lv. {student.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-purple-600">{student.xp_points || 0}</span>
                          <span className="text-gray-400 ml-1">XP</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-yellow-600">{student.coins || 0}</span>
                          <span className="text-gray-400 ml-1">🪙</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherLeaderboard
