/**
 * StudentLeaderboard.jsx
 * Halaman Leaderboard untuk Siswa
 * Menampilkan peringkat berdasarkan Total XP (seluruh kelas)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trophy, Medal, Clock, Calendar, Info, X } from 'lucide-react'

// Badge images
import badge1 from '../assets/badge/peringkat1.png'
import badge2 from '../assets/badge/peringkat2.png'
import badge3 from '../assets/badge/peringkat3.png'

export default function StudentLeaderboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [myRank, setMyRank] = useState(null)
  const [activePeriod, setActivePeriod] = useState(null)
  const [showPeriodInfo, setShowPeriodInfo] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
    fetchActivePeriod()
  }, [])

  // Realtime countdown timer
  useEffect(() => {
    if (!activePeriod?.end_date) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const end = new Date(activePeriod.end_date)
      const diff = end - now

      if (diff <= 0) {
        setTimeRemaining(null)
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeRemaining(`${days}h ${hours}j ${minutes}m`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}j ${minutes}m ${seconds}d`)
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}d`)
      } else {
        setTimeRemaining(`${seconds} detik`)
      }
    }

    // Update immediately
    updateTimer()
    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [activePeriod])

  const fetchActivePeriod = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get global active leaderboard settings (class_id IS NULL)
      // Show both active periods and recently expired ones (within last 7 days)
      const { data: settings, error } = await supabase
        .from('leaderboard_settings')
        .select('*')
        .is('class_id', null)
        .eq('is_active', true)
        .order('end_date', { ascending: false })
        .limit(1)

      if (!error && settings?.length > 0) {
        setActivePeriod(settings[0])
      }
    } catch (error) {
      console.error('Error fetching active period:', error)
    }
  }

  const isPeriodExpired = () => {
    if (!activePeriod?.end_date) return false
    return new Date(activePeriod.end_date) < new Date()
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      setCurrentUserId(user.id)

      // Get all students who are in at least one class, with their class info
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select(`
          student_id,
          classes!inner(
            id,
            class_name
          )
        `)

      if (membersError) throw membersError

      // Get unique student IDs who are in classes
      const studentClassMap = {}
      ;(membersData || []).forEach(m => {
        if (!studentClassMap[m.student_id]) {
          studentClassMap[m.student_id] = []
        }
        studentClassMap[m.student_id].push(m.classes.class_name)
      })

      const studentIds = Object.keys(studentClassMap)
      if (studentIds.length === 0) {
        setLeaderboard([])
        setLoading(false)
        return
      }

      // Get student profiles who are in classes
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, xp_points, coins')
        .eq('role', 'siswa')
        .in('id', studentIds)
        .order('xp_points', { ascending: false })
        .limit(100)

      if (error) throw error

      const leaderboardData = (data || []).map((student, index) => ({
        ...student,
        rank: index + 1,
        level: Math.floor((student.xp_points || 0) / 100) + 1,
        classes: studentClassMap[student.id] || []
      }))

      setLeaderboard(leaderboardData)

      // Find current user's rank
      const userRankIndex = leaderboardData.findIndex(s => s.id === user.id)
      if (userRankIndex !== -1) {
        setMyRank(userRankIndex + 1)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </StudentLayout>
    )
  }

  const bgColors = [
    'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300',
    'bg-gradient-to-r from-gray-100 to-slate-200 border-gray-300',
    'bg-gradient-to-r from-orange-100 to-amber-200 border-orange-300'
  ]

  return (
    <StudentLayout>
      <div className="space-y-4 pb-6 relative">
        {/* Header - Golden Theme with Animation */}
        <Card className="border-0 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 p-6 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-75"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="h-7 w-7 drop-shadow-md" /> Leaderboard
                </h1>
                <p className="text-amber-100 text-sm mt-1">
                  Peringkat berdasarkan Total XP
                </p>
              </div>
              {myRank && (
                <div className="bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-center shadow-lg border border-white/30">
                  <p className="text-xs text-amber-100">Peringkat Anda</p>
                  <p className="text-2xl font-bold drop-shadow-sm">#{myRank}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <Card className="border-0 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <CardContent className="p-6">
              <h3 className="text-center text-sm font-medium text-gray-500 mb-4">TOP 3</h3>
              <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={leaderboard[1]?.avatar_url} alt={leaderboard[1]?.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-400 text-white text-xl font-bold">
                      {leaderboard[1]?.full_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-2 font-semibold text-gray-800 text-sm truncate max-w-[100px]">{leaderboard[1]?.full_name}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{leaderboard[1]?.classes?.[0] || ''}</p>
                  <p className="text-xs text-purple-600 font-bold">{leaderboard[1]?.xp_points || 0} XP</p>
                  <div className="mt-2 bg-gray-200 rounded-t-lg w-20 h-16 flex items-center justify-center">
                    <img src={badge2} alt="Peringkat 2" className="h-10 w-10 object-contain" />
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={leaderboard[0]?.avatar_url} alt={leaderboard[0]?.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-2xl font-bold">
                      {leaderboard[0]?.full_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-2 font-bold text-gray-800 truncate max-w-[120px]">{leaderboard[0]?.full_name}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{leaderboard[0]?.classes?.[0] || ''}</p>
                  <p className="text-sm text-purple-600 font-bold">{leaderboard[0]?.xp_points || 0} XP</p>
                  <div className="mt-2 bg-yellow-300 rounded-t-lg w-24 h-20 flex items-center justify-center">
                    <img src={badge1} alt="Peringkat 1" className="h-14 w-14 object-contain" />
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={leaderboard[2]?.avatar_url} alt={leaderboard[2]?.full_name} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-300 to-amber-400 text-white text-xl font-bold">
                      {leaderboard[2]?.full_name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mt-2 font-semibold text-gray-800 text-sm truncate max-w-[100px]">{leaderboard[2]?.full_name}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[100px]">{leaderboard[2]?.classes?.[0] || ''}</p>
                  <p className="text-xs text-purple-600 font-bold">{leaderboard[2]?.xp_points || 0} XP</p>
                  <div className="mt-2 bg-orange-200 rounded-t-lg w-20 h-12 flex items-center justify-center">
                    <img src={badge3} alt="Peringkat 3" className="h-8 w-8 object-contain" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Leaderboard List */}
        <Card className="border-0 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Semua Peringkat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-10">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Data</h3>
                <p className="text-sm text-gray-600">
                  Leaderboard akan muncul setelah ada aktivitas siswa
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((student) => {
                  const isTop3 = student.rank <= 3
                  const isCurrentUser = student.id === currentUserId

                  return (
                    <div 
                      key={student.id} 
                      className={`rounded-xl border p-3 transition-all ${
                        isCurrentUser 
                          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                          : isTop3 
                            ? bgColors[student.rank - 1] 
                            : 'bg-white border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                          isTop3 ? 'bg-white shadow-sm' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {student.rank === 1 && <img src={badge1} alt="1" className="h-7 w-7 object-contain" />}
                          {student.rank === 2 && <img src={badge2} alt="2" className="h-7 w-7 object-contain" />}
                          {student.rank === 3 && <img src={badge3} alt="3" className="h-7 w-7 object-contain" />}
                          {student.rank > 3 && student.rank}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatar_url} alt={student.full_name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {student.full_name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name & Level */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-semibold truncate ${isCurrentUser ? 'text-blue-900' : 'text-gray-800'}`}>
                            {student.full_name}
                            {isCurrentUser && <span className="text-xs ml-2 text-blue-600">(Anda)</span>}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {student.classes?.[0] || 'Tidak ada kelas'} • Level {student.level}
                          </p>
                        </div>

                        {/* XP */}
                        <Badge className="bg-yellow-400/80 text-yellow-900 hover:bg-yellow-400/80">
                          ⚡ {student.xp_points || 0}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating Period Info Button - Always Show */}
        <>
          {/* Info Button */}
          <button
            onClick={() => setShowPeriodInfo(true)}
            className={`fixed bottom-6 right-6 z-40 p-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-in fade-in zoom-in duration-300 ${
              !activePeriod 
                ? 'bg-gradient-to-r from-gray-500 to-gray-600'
                : isPeriodExpired() 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            title="Info Periode"
          >
            <Info className="h-5 w-5" />
          </button>

          {/* Period Info Modal */}
          {showPeriodInfo && (
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
                onClick={() => setShowPeriodInfo(false)}
              />
              
              {/* Modal Content */}
              <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm mx-4 mb-0 sm:mb-4 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl">
                <div className={`p-4 rounded-t-2xl sm:rounded-t-2xl ${
                  !activePeriod 
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600'
                    : isPeriodExpired() 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-white">
                        <h3 className="font-bold">
                          {activePeriod ? activePeriod.period_name : 'Tidak Ada Periode'}
                        </h3>
                        <p className="text-xs text-white/80">
                          {!activePeriod 
                            ? 'Leaderboard biasa' 
                            : isPeriodExpired() 
                              ? 'Periode berakhir' 
                              : 'Leaderboard Global'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPeriodInfo(false)}
                      className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {!activePeriod ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Info className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="font-bold text-gray-600">Tidak ada periode aktif</p>
                      </div>
                    </div>
                  ) : isPeriodExpired() ? (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                      <Clock className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="font-bold text-red-600">Periode telah berakhir</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-xs text-gray-500">Sisa Waktu</p>
                        <p className="font-bold text-amber-600 font-mono">{timeRemaining || 'Menghitung...'}</p>
                      </div>
                    </div>
                  )}
                  
                  {activePeriod && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">{isPeriodExpired() ? 'Berakhir pada' : 'Berakhir'}</p>
                        <p className="font-semibold text-gray-700">
                          {new Date(activePeriod.end_date).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl border border-amber-200">
                    <img src={badge1} alt="Badge 1" className="h-8 w-8" />
                    <img src={badge2} alt="Badge 2" className="h-7 w-7" />
                    <img src={badge3} alt="Badge 3" className="h-6 w-6" />
                    <span className="text-xs font-medium text-amber-700 ml-2">
                      {!activePeriod 
                        ? 'Badge tersedia saat periode aktif'
                        : isPeriodExpired() 
                          ? 'Badge akan dibagikan sebentar lagi!' 
                          : 'Top 3 mendapat badge!'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      </div>
    </StudentLayout>
  )
}
