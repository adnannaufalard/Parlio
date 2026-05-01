/**
 * StudentProfile.jsx
 * Halaman Profile & Prestasi untuk Siswa
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { toast } from '@/hooks/use-toast'
import { Lock, Camera, Save, Loader2, Award, Settings, LogOut, Crop, X, BarChart3, ChevronRight } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

// Badge images
import badge1 from '../assets/badge/peringkat1.png'
import badge2 from '../assets/badge/peringkat2.png'
import badge3 from '../assets/badge/peringkat3.png'
import uniteOne from '../assets/badge/unite-one.png'
import uniteTwo from '../assets/badge/unite-two.png'
import uniteThree from '../assets/badge/unite-three.png'
import uniteFour from '../assets/badge/unite-four.png'
import uniteFive from '../assets/badge/unite-five.png'

export default function StudentProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    xp: 0,
    coins: 0,
    level: 1,
    completedLessons: 0,
    completedQuests: 0,
    totalClasses: 0,
    accuracy: 0
  })
  const [questAttempts, setQuestAttempts] = useState([])
  const [leaderboardBadges, setLeaderboardBadges] = useState([])
  const [achievementBadges, setAchievementBadges] = useState([])
  const [activeSection, setActiveSection] = useState('statistik')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  })
  const fileInputRef = useRef(null)
  
  // Crop states
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState(null)
  const imgRef = useRef(null)

  const centerAspectCrop = (mediaWidth, mediaHeight, aspect) => {
    return centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
      mediaWidth,
      mediaHeight
    )
  }

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1))
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setFormData(prev => ({
        ...prev,
        fullName: profileData?.full_name || '',
        email: user.email || ''
      }))

      // Get stats
      const xp = profileData?.xp_points || 0
      const coins = profileData?.coins || 0
      const level = Math.floor(xp / 100) + 1

      // Get class count
      const { count: classCount } = await supabase
        .from('class_members')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id)

      // Get completed lessons count
      const { count: lessonCount } = await supabase
        .from('student_lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('is_completed', true)

      // Get quest attempts with quest details
      const { data: attempts } = await supabase
        .from('student_quest_attempts')
        .select(`
          id,
          score,
          max_score,
          passed,
          completed_at,
          quest_id,
          quests (
            id,
            title,
            lesson_id
          )
        `)
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10)

      const completedQuests = attempts?.filter(a => a.passed).length || 0
      const totalScore = attempts?.reduce((sum, a) => sum + (a.score || 0), 0) || 0
      const totalMaxScore = attempts?.reduce((sum, a) => sum + (a.max_score || 0), 0) || 0
      const accuracy = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0

      // Get lesson IDs from attempts
      const lessonIds = [...new Set(attempts?.map(a => a.quests?.lesson_id).filter(Boolean) || [])]
      
      // Fetch lessons with chapter info
      let lessonsMap = {}
      let chaptersMap = {}
      
      if (lessonIds.length > 0) {
        // First get lessons
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id, title, chapter_id')
          .in('id', lessonIds)
        
        // Get unique chapter IDs
        const chapterIds = [...new Set(lessonsData?.map(l => l.chapter_id).filter(Boolean) || [])]
        
        // Fetch chapters
        if (chapterIds.length > 0) {
          const { data: chaptersData } = await supabase
            .from('chapters')
            .select('id, title')
            .in('id', chapterIds)
          
          chaptersData?.forEach(c => {
            chaptersMap[c.id] = c.title
          })
        }
        
        // Build lessons map with chapter titles
        lessonsData?.forEach(l => {
          lessonsMap[l.id] = {
            title: l.title,
            chapterTitle: chaptersMap[l.chapter_id] || '-'
          }
        })
      }

      // Format quest attempts for chart
      const formattedAttempts = attempts?.map(a => {
        const lessonInfo = lessonsMap[a.quests?.lesson_id] || {}
        return {
          name: a.quests?.title?.length > 12 ? a.quests?.title?.substring(0, 12) + '...' : a.quests?.title || 'Quest',
          questName: a.quests?.title || '-',
          lessonName: lessonInfo.title || '-',
          chapterName: lessonInfo.chapterTitle || '-',
          score: a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0,
          rawScore: a.score,
          maxScore: a.max_score,
          passed: a.passed,
          date: a.completed_at ? new Date(a.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
        }
      }).reverse() || []

      setQuestAttempts(formattedAttempts)

      // Fetch leaderboard badges
      const { data: badgesData } = await supabase
        .from('leaderboard_badges')
        .select('*, leaderboard_settings(period_name, class_id)')
        .eq('student_id', user.id)
        .order('awarded_at', { ascending: false })

      setLeaderboardBadges(badgesData || [])

      // Fetch achievement badges (chapter completion)
      const { data: achievementBadgesData } = await supabase
        .from('student_achievement_badges')
        .select(`
          *,
          chapter:chapters(id, title, floor_number)
        `)
        .eq('student_id', user.id)
        .order('badge_level', { ascending: true })

      setAchievementBadges(achievementBadgesData || [])

      setStats({
        xp,
        coins,
        level,
        completedLessons: lessonCount || 0,
        completedQuests,
        totalClasses: classCount || 0,
        accuracy
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: formData.fullName })
        .eq('id', user.id)
      
      if (profileError) throw profileError

      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: formData.email })
        if (emailError) throw emailError
      }

      toast({ title: 'Berhasil', description: 'Profil berhasil diperbarui' })
      fetchProfile()
    } catch (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: 'Gagal', description: 'Password baru tidak cocok', variant: 'destructive' })
      return
    }

    if (formData.newPassword.length < 6) {
      toast({ title: 'Gagal', description: 'Password minimal 6 karakter', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: formData.newPassword })
      if (error) throw error

      toast({ title: 'Berhasil', description: 'Password berhasil diperbarui' })
      setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }))
    } catch (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Gagal', description: 'Format file harus JPG, PNG, atau WebP', variant: 'destructive' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Gagal', description: 'Ukuran file maksimal 5MB', variant: 'destructive' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result)
      setCropDialogOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const getCroppedImg = async () => {
    if (!imgRef.current || !completedCrop) return null

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    const pixelRatio = window.devicePixelRatio || 1
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY
    
    canvas.width = cropWidth * pixelRatio
    canvas.height = cropHeight * pixelRatio
    
    const ctx = canvas.getContext('2d')
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })
  }

  const handleCropAndUpload = async () => {
    setUploading(true)
    try {
      const croppedBlob = await getCroppedImg()
      if (!croppedBlob) {
        toast({ title: 'Gagal', description: 'Gagal memproses gambar', variant: 'destructive' })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const fileName = `${user.id}/avatar.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const avatarUrl = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast({ title: 'Berhasil', description: 'Avatar berhasil diupload' })
      setCropDialogOpen(false)
      setImageSrc('')
      setCompletedCrop(null)
      fetchProfile()
    } catch (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
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

  const menuItems = [
    { id: 'statistik', label: 'Statistik', icon: BarChart3 },
    { id: 'pencapaian', label: 'Pencapaian', icon: Award },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings }
  ]

  // Chart data
  const chartConfig = {
    score: { label: 'Nilai', color: '#6366f1' }
  }

  // Helper function to get badge image based on rank
  const getBadgeImg = (rank) => {
    if (rank === 1) return badge1
    if (rank === 2) return badge2
    return badge3
  }

  // Helper function to get rank colors
  const getRankStyle = (rank) => {
    if (rank === 1) return {
      bg: 'bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      shadow: 'shadow-yellow-200/50'
    }
    if (rank === 2) return {
      bg: 'bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-600',
      shadow: 'shadow-gray-200/50'
    }
    return {
      bg: 'bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-700',
      shadow: 'shadow-orange-200/50'
    }
  }

  return (
    <StudentLayout>
      <div className="pb-8">
        {/* Profile Header - Compact */}
        <div className="flex items-center gap-4 mb-6 bg-[#1E258F] rounded-2xl p-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-500 text-white text-xl font-bold">
                {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white text-slate-900 rounded-full hover:bg-gray-100 transition shadow"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{profile?.full_name}</h1>
            <p className="text-sm text-white/60 truncate">{profile?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{stats.level}</p>
                <p className="text-[10px] text-white/50 uppercase">Level</p>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{stats.xp}</p>
                <p className="text-[10px] text-white/50 uppercase">XP</p>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{stats.coins}</p>
                <p className="text-[10px] text-white/50 uppercase">Coins</p>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/30" />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === item.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Statistik Section */}
        {activeSection === 'statistik' && (
          <div className="space-y-6">
            {/* Progress Level */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Progress Level</h3>
                <span className="text-xs text-gray-500">Level {stats.level} → {stats.level + 1}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all" 
                  style={{ width: `${(stats.xp % 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">{stats.xp % 100}/100 XP ({100 - (stats.xp % 100)} XP lagi)</p>
            </div>

            {/* Grafik Daftar Nilai - Area Chart */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Grafik Daftar Nilai Quest</h3>
                <p className="text-xs text-gray-500">Menampilkan {questAttempts.length} nilai terakhir</p>
              </div>
              <div className="p-4">
                {questAttempts.length > 0 ? (
                  <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <AreaChart data={questAttempts} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        tick={{ fontSize: 11 }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-white border rounded-lg shadow-lg p-3 max-w-[250px]">
                                <p className="text-xs text-gray-500 mb-1">{data.date}</p>
                                <div className="space-y-1.5">
                                  <div>
                                    <p className="text-[10px] text-gray-400 uppercase">Bab</p>
                                    <p className="text-xs font-medium text-gray-900">{data.chapterName}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-400 uppercase">Materi</p>
                                    <p className="text-xs font-medium text-gray-900">{data.lessonName}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-400 uppercase">Quest</p>
                                    <p className="text-xs font-medium text-gray-900">{data.questName}</p>
                                  </div>
                                  <div className="pt-1.5 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600">Nilai</span>
                                      <span className="text-sm font-bold text-gray-900">{data.rawScore}/{data.maxScore}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span className="text-xs text-gray-600">Persentase</span>
                                      <span className={`text-sm font-bold ${
                                        data.score >= 75 ? 'text-emerald-600' :
                                        data.score >= 50 ? 'text-amber-600' : 'text-red-600'
                                      }`}>
                                        {data.score}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area
                        dataKey="score"
                        type="monotone"
                        fill="url(#fillScore)"
                        stroke="#6366f1"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-10">
                    <BarChart3 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Belum ada data nilai</p>
                    <p className="text-xs text-gray-400 mt-1">Selesaikan quest untuk melihat grafik nilai!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pencapaian Section */}
        {activeSection === 'pencapaian' && (
          <div className="space-y-6">
            {/* Achievement Badges Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900">Badge Penyelesaian Bab</h2>
              </div>

              {achievementBadges && achievementBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {achievementBadges.map((badge) => {
                    const badgeImages = [
                      null,
                      uniteOne,
                      uniteTwo,
                      uniteThree,
                      uniteFour,
                      uniteFive
                    ]
                    const badgeImage = badgeImages[badge.badge_level] || uniteOne
                    const chapterName = badge.chapter?.title || `Bab ${badge.badge_level}`
                    
                    return (
                      <div 
                        key={badge.id}
                        className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all"
                        title={chapterName}
                      >
                        <img 
                          src={badgeImage} 
                          alt={chapterName}
                          className="h-16 w-16 object-contain drop-shadow-md"
                        />
                        <div className="text-center">
                          <p className="text-xs font-semibold text-blue-900 line-clamp-2">{chapterName}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            {new Date(badge.awarded_at).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 text-center border border-blue-200">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Belum Ada Badge</h3>
                  <p className="text-xs text-blue-700">
                    Selesaikan semua sub bab pada setiap bab untuk mendapatkan badge!
                  </p>
                </div>
              )}
            </div>

            {/* Leaderboard Badges Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">Pencapaian Periode</h2>
              </div>

              {leaderboardBadges.length > 0 ? (
                <div className="space-y-3">
                  {leaderboardBadges.map((badge) => {
                    const style = getRankStyle(badge.rank)
                    const rankText = badge.rank === 1 ? 'Juara 1' : badge.rank === 2 ? 'Juara 2' : 'Juara 3'
                    const scopeText = badge.leaderboard_settings?.class_id ? 'Leaderboard Kelas' : 'Leaderboard Global'
                    
                    return (
                      <div 
                        key={badge.id} 
                        className={`${style.bg} ${style.border} border rounded-2xl p-4 shadow-md ${style.shadow} transition-all hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Badge Image */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-white/50 rounded-full blur-sm"></div>
                            <img 
                              src={getBadgeImg(badge.rank)} 
                              alt={rankText} 
                              className="h-16 w-16 object-contain relative z-10 drop-shadow-md" 
                            />
                          </div>
                          
                          {/* Badge Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-lg font-bold ${style.text}`}>{rankText}</h3>
                              {badge.rank === 1 && <span className="text-yellow-500">👑</span>}
                            </div>
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {badge.leaderboard_settings?.period_name || 'Periode'}
                            </p>
                            <p className="text-xs text-gray-500">{scopeText}</p>
                          </div>
                          
                          {/* Date & XP */}
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-600">
                              {new Date(badge.awarded_at).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </p>
                            {badge.xp_at_end > 0 && (
                              <p className="text-xs text-purple-600 font-semibold mt-1">
                                {badge.xp_at_end} XP
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Empty State */
                <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-8 text-center border border-gray-200">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse"></div>
                    <Award className="h-12 w-12 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Pencapaian</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Pencapaian akan muncul setelah kamu meraih peringkat di leaderboard saat periode berakhir.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-white rounded-xl border border-gray-200">
                    <img src={badge1} alt="Badge 1" className="h-8 w-8 opacity-40" />
                    <img src={badge2} alt="Badge 2" className="h-7 w-7 opacity-40" />
                    <img src={badge3} alt="Badge 3" className="h-6 w-6 opacity-40" />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Raih Top 3 di leaderboard untuk mendapatkan badge!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pengaturan Section */}
        {activeSection === 'pengaturan' && (
          <div className="space-y-4">
            {/* Edit Profile */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi Profil</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs text-gray-500">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-10"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-gray-500">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-10"
                    required
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Simpan Perubahan
                </Button>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Ubah Password</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs text-gray-500">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="h-10"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-gray-500">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Ulangi password baru"
                    className="h-10"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Ubah Password
                </Button>
              </form>
            </div>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-red-600 hover:text-red-700 text-sm font-medium transition"
            >
              <LogOut className="h-4 w-4" />
              Keluar dari Akun
            </button>
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="h-5 w-5" /> Crop Foto Profil
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {imageSrc && (
              <div className="max-h-[400px] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Geser dan sesuaikan area crop untuk foto profil
            </p>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setCropDialogOpen(false); setImageSrc(''); setCompletedCrop(null) }} disabled={uploading}>
              <X className="h-4 w-4 mr-2" /> Batal
            </Button>
            <Button onClick={handleCropAndUpload} disabled={uploading || !completedCrop}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  )
}
