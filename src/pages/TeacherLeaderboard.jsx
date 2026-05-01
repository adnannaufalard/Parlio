/**
 * TeacherLeaderboard.jsx
 * Halaman Leaderboard untuk Guru
 * 
 * Fitur:
 * - Melihat papan peringkat XP global atau kelas
 * - Filter kelas dan mode XP (global/khusus kelas)
 * - Pengaturan periode leaderboard dengan tanggal berakhir
 * - Award badges untuk top 3 saat periode berakhir
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trophy, Settings, Calendar, Clock, Award, Users, Star, Coins, History, RotateCcw, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

// Badge images
import badge1 from '../assets/badge/peringkat1.png'
import badge2 from '../assets/badge/peringkat2.png'
import badge3 from '../assets/badge/peringkat3.png'

function TeacherLeaderboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('all')
  const [xpMode, setXpMode] = useState('global') // 'global' or 'class'
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgXP: 0,
    avgCoins: 0,
    topPerformer: null
  })
  
  // Period settings
  const [leaderboardSettings, setLeaderboardSettings] = useState(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [periodName, setPeriodName] = useState('Periode 1')
  const [endDate, setEndDate] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [autoEnding, setAutoEnding] = useState(false)
  
  // Period history
  const [periodHistory, setPeriodHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedPeriod, setExpandedPeriod] = useState(null)
  const [periodWinners, setPeriodWinners] = useState({})
  
  // Reset XP/Coins
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetClasses, setResetClasses] = useState([])
  const [resetXP, setResetXP] = useState(true)
  const [resetCoins, setResetCoins] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchTeacherClasses()
  }, [])

  useEffect(() => {
    fetchLeaderboard()
    // Only fetch settings for global mode
    if (xpMode === 'global') {
      fetchLeaderboardSettings()
    } else {
      setLeaderboardSettings(null)
    }
  }, [selectedClass, xpMode])

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

  const fetchLeaderboardSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch global leaderboard settings (class_id is NULL)
      const { data, error } = await supabase
        .from('leaderboard_settings')
        .select('*')
        .eq('teacher_id', user.id)
        .is('class_id', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error)
      }
      
      setLeaderboardSettings(data || null)
      if (data) {
        setPeriodName(data.period_name)
        setEndDate(data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '')
      }
    } catch (error) {
      setLeaderboardSettings(null)
    }
  }

  const fetchPeriodHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('leaderboard_settings')
        .select('*')
        .eq('teacher_id', user.id)
        .is('class_id', null)
        .eq('is_active', false)
        .order('end_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setPeriodHistory(data || [])
    } catch (error) {
      console.error('Error fetching period history:', error)
    }
  }

  const fetchPeriodWinners = async (periodId) => {
    if (periodWinners[periodId]) return  // Already fetched

    try {
      const { data, error } = await supabase
        .from('leaderboard_badges')
        .select(`
          *,
          student:profiles!leaderboard_badges_student_fkey(id, full_name, avatar_url)
        `)
        .eq('leaderboard_setting_id', periodId)
        .order('rank', { ascending: true })

      if (error) throw error
      setPeriodWinners(prev => ({ ...prev, [periodId]: data || [] }))
    } catch (error) {
      console.error('Error fetching period winners:', error)
    }
  }

  const handleResetXPCoins = async () => {
    if (resetClasses.length === 0) {
      toast.error('Pilih minimal satu kelas')
      return
    }

    if (!resetXP && !resetCoins) {
      toast.error('Pilih XP atau Coins untuk direset')
      return
    }

    const confirmMsg = `Reset ${resetXP ? 'XP' : ''}${resetXP && resetCoins ? ' dan ' : ''}${resetCoins ? 'Coins' : ''} untuk ${resetClasses.length} kelas?`
    if (!confirm(confirmMsg)) return

    setResetting(true)
    try {
      // Get all students in selected classes
      let studentIds = []
      
      if (resetClasses.includes('all')) {
        // All classes
        const { data: members } = await supabase
          .from('class_members')
          .select('student_id')
          .in('class_id', classes.map(c => c.id))

        studentIds = [...new Set(members?.map(m => m.student_id) || [])]
      } else {
        const { data: members } = await supabase
          .from('class_members')
          .select('student_id')
          .in('class_id', resetClasses.map(Number))

        studentIds = [...new Set(members?.map(m => m.student_id) || [])]
      }

      if (studentIds.length === 0) {
        toast.error('Tidak ada siswa yang ditemukan')
        setResetting(false)
        return
      }

      console.log('Resetting XP/Coins for students:', studentIds.length)
      console.log('Reset XP:', resetXP, 'Reset Coins:', resetCoins)

      // Use RPC function with SECURITY DEFINER to bypass RLS
      const { data, error } = await supabase.rpc('reset_student_xp_coins', {
        student_ids: studentIds,
        reset_xp: resetXP,
        reset_coins: resetCoins
      })

      if (error) {
        console.error('RPC Error:', error)
        
        // Fallback to direct update if RPC doesn't exist
        if (error.message.includes('function') || error.code === '42883') {
          console.log('RPC not found, trying direct update...')
          const updateData = {}
          if (resetXP) updateData.xp_points = 0
          if (resetCoins) updateData.coins = 0

          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .in('id', studentIds)

          if (updateError) throw updateError
        } else {
          throw error
        }
      } else {
        console.log('RPC Result:', data)
      }

      toast.success(`Berhasil reset ${studentIds.length} siswa`)
      setShowResetModal(false)
      setResetClasses([])
      fetchLeaderboard()
    } catch (error) {
      console.error('Error resetting:', error)
      toast.error('Gagal mereset')
    } finally {
      setResetting(false)
    }
  }

  const togglePeriodExpand = async (periodId) => {
    if (expandedPeriod === periodId) {
      setExpandedPeriod(null)
    } else {
      setExpandedPeriod(periodId)
      fetchPeriodWinners(periodId)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let studentIds = []
      let classIds = []

      if (selectedClass === 'all') {
        // Get all students from all classes taught by this teacher
        const { data: teacherClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', user.id)

        if (teacherClasses && teacherClasses.length > 0) {
          classIds = teacherClasses.map(c => c.id)
          const { data: members } = await supabase
            .from('class_members')
            .select('student_id')
            .in('class_id', classIds)

          studentIds = [...new Set(members?.map(m => m.student_id) || [])]
        }
      } else {
        classIds = [parseInt(selectedClass)]
        const { data: members } = await supabase
          .from('class_members')
          .select('student_id')
          .eq('class_id', selectedClass)

        studentIds = members?.map(m => m.student_id) || []
      }

      if (studentIds.length === 0) {
        setLeaderboard([])
        setStats({ totalStudents: 0, avgXP: 0, avgCoins: 0, topPerformer: null })
        setLoading(false)
        return
      }

      // Fetch student profiles
      const { data: students, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, xp_points, coins')
        .in('id', studentIds)

      if (error) throw error

      // Fetch attempts to calculate avg score
      const { data: allAttempts } = await supabase
        .from('student_quest_attempts')
        .select('student_id, score, max_score')
        .in('student_id', studentIds)

      const scoreStatsByStudent = {}
      ;(allAttempts || []).forEach(a => {
        if (!scoreStatsByStudent[a.student_id]) {
          scoreStatsByStudent[a.student_id] = { total: 0, max: 0 }
        }
        scoreStatsByStudent[a.student_id].total += a.score || 0
        scoreStatsByStudent[a.student_id].max += a.max_score || 0
      })

      const getStudentAvgScore = (sId) => {
        const stats = scoreStatsByStudent[sId] || { total: 0, max: 0 }
        return stats.max > 0 ? Math.round((stats.total / stats.max) * 100) : 0
      }

      let leaderboardData = []

      if (xpMode === 'global' || selectedClass === 'all') {
        // Use global XP from profiles
        leaderboardData = (students || [])
          .map((student, index) => ({
            ...student,
            level: Math.floor((student.xp_points || 0) / 100) + 1,
            avg_score: getStudentAvgScore(student.id)
          }))
          .sort((a, b) => (b.xp_points || 0) - (a.xp_points || 0))
          .map((student, index) => ({ ...student, rank: index + 1 }))
      } else {
        // Calculate class-specific XP from quest attempts
        // Get chapters assigned to this class
        const { data: classChapters } = await supabase
          .from('class_chapters')
          .select('chapter_id')
          .eq('class_id', selectedClass)
          .eq('is_active', true)

        if (!classChapters || classChapters.length === 0) {
          leaderboardData = (students || [])
            .map((student) => ({
              ...student,
              xp_points: 0,
              level: 1,
              rank: 0
            }))
            .sort((a, b) => a.full_name.localeCompare(b.full_name))
            .map((student, index) => ({ ...student, rank: index + 1 }))
        } else {
          const chapterIds = classChapters.map(c => c.chapter_id)

          // Get lessons in those chapters
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .in('chapter_id', chapterIds)

          if (!lessons || lessons.length === 0) {
            leaderboardData = (students || [])
              .map((student) => ({
                ...student,
                xp_points: 0,
                level: 1
              }))
              .sort((a, b) => a.full_name.localeCompare(b.full_name))
              .map((student, index) => ({ ...student, rank: index + 1 }))
          } else {
            const lessonIds = lessons.map(l => l.id)

            // Get quests in those lessons
            const { data: quests } = await supabase
              .from('quests')
              .select('id')
              .in('lesson_id', lessonIds)

            if (!quests || quests.length === 0) {
              leaderboardData = (students || [])
                .map((student) => ({
                  ...student,
                  xp_points: 0,
                  level: 1
                }))
                .sort((a, b) => a.full_name.localeCompare(b.full_name))
                .map((student, index) => ({ ...student, rank: index + 1 }))
            } else {
              const questIds = quests.map(q => q.id)

              // Get XP earned from quest attempts
              const { data: attempts } = await supabase
                .from('student_quest_attempts')
                .select('student_id, xp_earned')
                .in('quest_id', questIds)
                .in('student_id', studentIds)

              // Sum XP per student
              const xpByStudent = {}
              ;(attempts || []).forEach(a => {
                xpByStudent[a.student_id] = (xpByStudent[a.student_id] || 0) + (a.xp_earned || 0)
              })

              leaderboardData = (students || [])
                .map((student) => ({
                  ...student,
                  xp_points: xpByStudent[student.id] || 0,
                  level: Math.floor((xpByStudent[student.id] || 0) / 100) + 1,
                  avg_score: getStudentAvgScore(student.id)
                }))
                .sort((a, b) => b.xp_points - a.xp_points)
                .map((student, index) => ({ ...student, rank: index + 1 }))
            }
          }
        }
      }

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

  const handleSaveSettings = async () => {
    if (xpMode !== 'global') {
      toast.error('Pengaturan periode hanya untuk leaderboard global')
      return
    }

    if (!endDate) {
      toast.error('Tanggal berakhir harus diisi')
      return
    }

    setSavingSettings(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Deactivate existing global settings
      await supabase
        .from('leaderboard_settings')
        .update({ is_active: false })
        .eq('teacher_id', user.id)
        .is('class_id', null)
        .eq('is_active', true)

      // Create new global settings (class_id = null)
      const { data, error } = await supabase
        .from('leaderboard_settings')
        .insert([{
          class_id: null,
          teacher_id: user.id,
          period_name: periodName,
          end_date: new Date(endDate).toISOString(),
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      setLeaderboardSettings(data)
      toast.success('Pengaturan periode berhasil disimpan')
      setShowSettingsModal(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleEndPeriod = async () => {
    if (!leaderboardSettings) {
      toast.error('Tidak ada periode aktif')
      return
    }

    // Allow ending even with 0 students
    const studentsToAward = leaderboard.slice(0, 3).filter(s => s.xp_points > 0)
    
    const confirmMsg = studentsToAward.length > 0 
      ? `Akhiri periode dan berikan badge kepada ${studentsToAward.length} siswa terbaik?`
      : 'Akhiri periode? Tidak ada siswa yang akan mendapat badge.'
    
    if (!confirm(confirmMsg)) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const badgeTypes = ['gold', 'silver', 'bronze']

      // Award badges to available top students (could be 0, 1, 2, or 3)
      if (studentsToAward.length > 0) {
        const badges = studentsToAward.map((student, index) => ({
          leaderboard_setting_id: leaderboardSettings.id,
          student_id: student.id,
          class_id: null,
          rank: index + 1,
          badge_type: badgeTypes[index],
          xp_at_end: student.xp_points,
          period_name: leaderboardSettings.period_name
        }))

        const { error: badgeError } = await supabase
          .from('leaderboard_badges')
          .insert(badges)

        if (badgeError) throw badgeError
      }

      // Deactivate the period
      await supabase
        .from('leaderboard_settings')
        .update({ is_active: false })
        .eq('id', leaderboardSettings.id)

      if (studentsToAward.length > 0) {
        toast.success(`Periode berakhir! Badge telah diberikan kepada ${studentsToAward.length} siswa terbaik`)
      } else {
        toast.success('Periode berakhir!')
      }
      setLeaderboardSettings(null)
      fetchLeaderboard()
    } catch (error) {
      console.error('Error ending period:', error)
      toast.error('Gagal mengakhiri periode')
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-yellow-400', text: 'text-yellow-900', img: badge1 }
    if (rank === 2) return { bg: 'bg-gray-300', text: 'text-gray-800', img: badge2 }
    if (rank === 3) return { bg: 'bg-amber-600', text: 'text-amber-100', img: badge3 }
    return { bg: 'bg-gray-100', text: 'text-gray-700', img: null }
  }

  // Realtime countdown timer
  useEffect(() => {
    if (!leaderboardSettings?.end_date) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const end = new Date(leaderboardSettings.end_date)
      const now = new Date()
      const diff = end - now

      if (diff <= 0) {
        setTimeRemaining(null)
        // Auto-end period when time expires
        if (!autoEnding && leaderboardSettings.is_active) {
          handleAutoEndPeriod()
        }
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
  }, [leaderboardSettings, autoEnding])

  // Auto-end period function (called when timer expires)
  const handleAutoEndPeriod = async () => {
    if (autoEnding || !leaderboardSettings) return
    setAutoEnding(true)

    try {
      const studentsToAward = leaderboard.slice(0, 3).filter(s => s.xp_points > 0)
      const badgeTypes = ['gold', 'silver', 'bronze']

      // Award badges to available top students
      if (studentsToAward.length > 0) {
        const badges = studentsToAward.map((student, index) => ({
          leaderboard_setting_id: leaderboardSettings.id,
          student_id: student.id,
          class_id: null,
          rank: index + 1,
          badge_type: badgeTypes[index],
          xp_at_end: student.xp_points,
          period_name: leaderboardSettings.period_name
        }))

        await supabase.from('leaderboard_badges').insert(badges)
      }

      // Deactivate the period
      await supabase
        .from('leaderboard_settings')
        .update({ is_active: false })
        .eq('id', leaderboardSettings.id)

      toast.success(`Periode "${leaderboardSettings.period_name}" berakhir otomatis!`)
      setLeaderboardSettings(null)
      fetchLeaderboard()
    } catch (error) {
      console.error('Error auto-ending period:', error)
      toast.error('Gagal mengakhiri periode otomatis')
    } finally {
      setAutoEnding(false)
    }
  }

  const isPeriodExpired = () => {
    if (!leaderboardSettings?.end_date) return false
    return new Date(leaderboardSettings.end_date) < new Date()
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <p className="text-amber-100">Papan peringkat siswa berdasarkan XP</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {xpMode === 'global' && (
                <>
                  <Button 
                    variant="outline" 
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => {
                      setShowHistory(!showHistory)
                      if (!showHistory) fetchPeriodHistory()
                    }}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Riwayat
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Periode
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                className="bg-red-500/80 border-red-400 text-white hover:bg-red-600"
                onClick={() => setShowResetModal(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Period Info */}
        {leaderboardSettings && (
          <div className={`rounded-xl p-4 ${
            isPeriodExpired() 
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${isPeriodExpired() ? 'bg-red-100' : 'bg-purple-100'}`}>
                  <Calendar className={`h-6 w-6 ${isPeriodExpired() ? 'text-red-600' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isPeriodExpired() ? 'text-red-900' : 'text-purple-900'}`}>
                    {leaderboardSettings.period_name}
                    {isPeriodExpired() && <span className="ml-2 text-xs text-red-600">(Telah Berakhir)</span>}
                  </h3>
                  <p className={`text-sm flex items-center gap-2 ${isPeriodExpired() ? 'text-red-600' : 'text-purple-600'}`}>
                    <Clock className="h-4 w-4" />
                    {isPeriodExpired() ? 'Berakhir pada: ' : 'Berakhir: '}
                    {new Date(leaderboardSettings.end_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isPeriodExpired() ? (
                  <Badge className="bg-red-100 text-red-700 px-3 py-1">
                    ⚠️ Periode Berakhir
                  </Badge>
                ) : (
                  <Badge className="bg-purple-100 text-purple-700 px-3 py-1 font-mono">
                    ⏱️ {timeRemaining || 'Menghitung...'}
                  </Badge>
                )}
                <Button 
                  variant={isPeriodExpired() ? "default" : "destructive"}
                  size="sm"
                  onClick={handleEndPeriod}
                  disabled={autoEnding}
                  className={isPeriodExpired() ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  {autoEnding ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Mengakhiri...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      {isPeriodExpired() ? 'Selesaikan Periode' : 'Akhiri Periode'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Period History */}
        {showHistory && (
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              Riwayat Periode
            </h3>
            {periodHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada riwayat periode</p>
            ) : (
              <div className="space-y-3">
                {periodHistory.map((period) => (
                  <div 
                    key={period.id} 
                    className="border rounded-lg overflow-hidden"
                  >
                    <div 
                      className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => togglePeriodExpand(period.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">{period.period_name}</p>
                          <p className="text-xs text-gray-500">
                            Berakhir: {new Date(period.end_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-200 text-gray-700">Selesai</Badge>
                        {expandedPeriod === period.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Winners list */}
                    {expandedPeriod === period.id && (
                      <div className="p-3 border-t bg-white">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">🏆 Pemenang:</h4>
                        {periodWinners[period.id]?.length > 0 ? (
                          <div className="space-y-2">
                            {periodWinners[period.id].map((winner) => (
                              <div key={winner.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                                <img 
                                  src={winner.rank === 1 ? badge1 : winner.rank === 2 ? badge2 : badge3} 
                                  alt={`Rank ${winner.rank}`}
                                  className="h-8 w-8 object-contain"
                                />
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={winner.student?.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {winner.student?.full_name?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 text-sm">{winner.student?.full_name}</p>
                                  <p className="text-xs text-gray-500">XP: {winner.xp_at_end}</p>
                                </div>
                                <Badge className={
                                  winner.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                  winner.rank === 2 ? 'bg-gray-200 text-gray-700' :
                                  'bg-amber-100 text-amber-800'
                                }>
                                  #{winner.rank}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Tidak ada pemenang</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium text-gray-700 mb-1">Filter Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm font-medium text-gray-700 mb-1">Mode XP</Label>
              <Select value={xpMode} onValueChange={setXpMode} disabled={selectedClass === 'all'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">XP Global (Total)</SelectItem>
                  <SelectItem value="class">XP Khusus Kelas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedClass !== 'all' && xpMode === 'class' && (
            <p className="mt-2 text-xs text-gray-500">
              * XP Khusus Kelas dihitung dari quest yang dikerjakan siswa di kelas ini
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500">Total Siswa</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.avgXP}</p>
            <p className="text-sm text-gray-500">Rata-rata XP</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.avgCoins}</p>
            <p className="text-sm text-gray-500">Rata-rata Coins</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-lg font-bold text-amber-600 truncate">
              {stats.topPerformer?.full_name || '-'}
            </p>
            <p className="text-sm text-gray-500">Top Performer</p>
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top 3 Siswa
            </h2>
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2 ring-4 ring-gray-300">
                  <AvatarImage src={leaderboard[1]?.avatar_url} alt={leaderboard[1]?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-400 text-white text-xl font-bold">
                    {leaderboard[1]?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-1">
                  <img src={badge2} alt="Peringkat 2" className="h-12 w-12 mx-auto" />
                </div>
                <p className="font-semibold text-gray-800 truncate max-w-[100px]">{leaderboard[1]?.full_name}</p>
                <p className="text-sm text-purple-600 font-medium">{leaderboard[1]?.xp_points || 0} XP</p>
                <div className="h-24 w-20 bg-gray-300 rounded-t-lg mx-auto mt-2"></div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-2 ring-4 ring-yellow-400">
                  <AvatarImage src={leaderboard[0]?.avatar_url} alt={leaderboard[0]?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-2xl font-bold">
                    {leaderboard[0]?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-1">
                  <img src={badge1} alt="Peringkat 1" className="h-14 w-14 mx-auto" />
                </div>
                <p className="font-bold text-gray-800 truncate max-w-[120px]">{leaderboard[0]?.full_name}</p>
                <p className="text-sm text-purple-600 font-bold">{leaderboard[0]?.xp_points || 0} XP</p>
                <div className="h-32 w-24 bg-yellow-400 rounded-t-lg mx-auto mt-2"></div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2 ring-4 ring-amber-600">
                  <AvatarImage src={leaderboard[2]?.avatar_url} alt={leaderboard[2]?.full_name} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xl font-bold">
                    {leaderboard[2]?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-1">
                  <img src={badge3} alt="Peringkat 3" className="h-10 w-10 mx-auto" />
                </div>
                <p className="font-semibold text-gray-800 truncate max-w-[100px]">{leaderboard[2]?.full_name}</p>
                <p className="text-sm text-purple-600 font-medium">{leaderboard[2]?.xp_points || 0} XP</p>
                <div className="h-16 w-20 bg-amber-600 rounded-t-lg mx-auto mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b bg-white">
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
                <thead className="bg-white border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Siswa</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Rata-rata Nilai</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((student) => {
                    const badge = getRankBadge(student.rank)
                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 ${student.rank <= 3 ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className={`w-10 h-10 rounded-full ${badge.bg} ${badge.text} flex items-center justify-center font-bold text-lg`}>
                            {badge.img ? (
                              <img src={badge.img} alt={`Rank ${student.rank}`} className="h-8 w-8 object-contain" />
                            ) : (
                              student.rank
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={student.avatar_url} alt={student.full_name} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                {student.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-800">{student.full_name}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                            {student.avg_score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-purple-600">{student.xp_points || 0}</span>
                          <span className="text-gray-400 ml-1">XP</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Settings Modal */}
        <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pengaturan Periode Leaderboard
              </DialogTitle>
              <DialogDescription>
                Atur periode kompetisi untuk kelas ini. Top 3 akan mendapat badge saat periode berakhir.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="periodName">Nama Periode</Label>
                <Input
                  id="periodName"
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="contoh: Periode 1, Semester Ganjil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal & Waktu Berakhir</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveSettings} disabled={savingSettings}>
                {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset XP/Coins Modal */}
        <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <RotateCcw className="h-5 w-5" />
                Reset XP & Coins
              </DialogTitle>
              <DialogDescription>
                Pilih kelas dan jenis data yang ingin direset. Data akan dikembalikan ke 0.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Pilih Kelas</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="all-classes"
                      checked={resetClasses.includes('all')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setResetClasses(['all'])
                        } else {
                          setResetClasses([])
                        }
                      }}
                    />
                    <label htmlFor="all-classes" className="text-sm font-medium cursor-pointer">
                      Semua Kelas
                    </label>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    {classes.map(cls => (
                      <div key={cls.id} className="flex items-center space-x-2 py-1">
                        <Checkbox 
                          id={`class-${cls.id}`}
                          checked={resetClasses.includes(cls.id.toString())}
                          disabled={resetClasses.includes('all')}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setResetClasses(prev => [...prev.filter(c => c !== 'all'), cls.id.toString()])
                            } else {
                              setResetClasses(prev => prev.filter(c => c !== cls.id.toString()))
                            }
                          }}
                        />
                        <label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer">
                          {cls.class_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data yang akan direset</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reset-xp"
                      checked={resetXP}
                      onCheckedChange={setResetXP}
                    />
                    <label htmlFor="reset-xp" className="text-sm cursor-pointer flex items-center gap-1">
                      <Star className="h-4 w-4 text-purple-500" /> XP Points
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reset-coins"
                      checked={resetCoins}
                      onCheckedChange={setResetCoins}
                    />
                    <label htmlFor="reset-coins" className="text-sm cursor-pointer flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" /> Coins
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700">
                  ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan. Data XP dan Coins siswa akan direset ke 0.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowResetModal(false)
                setResetClasses([])
              }}>
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleResetXPCoins} 
                disabled={resetting || resetClasses.length === 0}
              >
                {resetting ? 'Mereset...' : 'Reset Data'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TeacherLayout>
  )
}

export default TeacherLeaderboard
