import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import logo2 from '../assets/logo/2.png' // Logo putih untuk header

function StudentDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const carouselRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(location.state?.classId || null)
  const [motivationalMessage, setMotivationalMessage] = useState('hari baru semangat baru lagi dong!')
  const [stats, setStats] = useState({
    xp: 0,
    coins: 0,
    level: 1,
    completedLessons: 0,
    totalLessons: 0,
    completedQuests: 0,
    totalQuests: 0
  })
  const [chapters, setChapters] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [classList, setClassList] = useState([])
  const [activeInfoSlide, setActiveInfoSlide] = useState(0)
  const [informationCards, setInformationCards] = useState([])

  useEffect(() => {
    fetchStudentData()
    fetchMotivationalMessage()
    fetchAnnouncements()
  }, [selectedClassId])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase.rpc('get_active_announcements')
      
      if (error) throw error
      
      if (data && data.length > 0) {
        // Transform database data to component format
        const cards = data.map(ann => ({
          id: ann.id,
          title: ann.title,
          description: ann.description || '',
          type: ann.type,
          color: `${ann.color_from} ${ann.color_to}`,
          icon: ann.icon || '📢'
        }))
        setInformationCards(cards)
      } else {
        // Fallback to placeholder if no announcements
        setInformationCards([
          {
            id: 1,
            title: 'Pengumuman Penting',
            description: 'Ini adalah contoh pengumuman yang akan diisi oleh super admin',
            type: 'announcement',
            color: 'from-blue-500 to-blue-600',
            icon: '📢'
          },
          {
            id: 2,
            title: 'Event Mendatang',
            description: 'Informasi tentang event atau kegiatan yang akan datang',
            type: 'event',
            color: 'from-purple-500 to-purple-600',
            icon: '📅'
          },
          {
            id: 3,
            title: 'Tips Belajar',
            description: 'Tips dan trik untuk meningkatkan kemampuan bahasa Prancis',
            type: 'tips',
            color: 'from-green-500 to-green-600',
            icon: '💡'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      // Use fallback data on error
      setInformationCards([
        {
          id: 1,
          title: 'Pengumuman Penting',
          description: 'Ini adalah contoh pengumuman yang akan diisi oleh super admin',
          type: 'announcement',
          color: 'from-blue-500 to-blue-600',
          icon: '📢'
        }
      ])
    }
  }

  const fetchMotivationalMessage = async () => {
    try {
      // Try to call the PostgreSQL function to get random message
      const { data, error } = await supabase.rpc('get_random_motivational_message')
      
      if (!error && data) {
        setMotivationalMessage(data)
      } else {
        // Fallback: fetch from table directly
        const { data: messages } = await supabase
          .from('motivational_messages')
          .select('message')
          .eq('is_active', true)
          .order('display_order')
        
        if (messages && messages.length > 0) {
          // Pick random message from active messages
          const randomIndex = Math.floor(Math.random() * messages.length)
          setMotivationalMessage(messages[randomIndex].message)
        }
      }
    } catch (error) {
      console.error('Error fetching motivational message:', error)
      // Keep default message
    }
  }

  const fetchStudentData = async () => {
    try {
      // Use getSession for faster auth check (cached)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setLoading(false)
        return
      }

      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        toast.error('Gagal memuat profil')
        setLoading(false)
        return
      }

      setProfile(profileData)
      // Set loading false early so UI shows faster
      setLoading(false)

      // Set basic stats from profile
      const xp = profileData?.xp_points || 0
      const level = Math.floor(xp / 100) + 1
      const coins = profileData?.coins || 0

      // Get student's classes
      const { data: myClasses } = await supabase
        .from('class_members')
        .select('class_id, classes(id, class_name)')
        .eq('student_id', user.id)

      setClassList(myClasses || [])

      // Use selectedClassId or first class
      const currentClassId = selectedClassId || myClasses?.[0]?.class_id
      if (!currentClassId) {
        setLoading(false)
        return
      }

      if (currentClassId) {
        // Get assigned chapters
        const { data: assignedChapters } = await supabase
          .from('class_chapters')
          .select(`
            chapter:chapters(
              id,
              title,
              description,
              floor_number,
              icon,
              bg_color,
              unlock_xp_required
            )
          `)
          .eq('class_id', currentClassId)
          .eq('is_active', true)

        // Get student progress for each chapter
        const chaptersWithProgress = await Promise.all(
          (assignedChapters || []).map(async (ac) => {
            const chapter = ac.chapter
            
            // Get chapter progress
            const { data: progress } = await supabase
              .from('student_chapter_progress')
              .select('*')
              .eq('student_id', user.id)
              .eq('chapter_id', chapter.id)
              .maybeSingle()

            // Get lessons count
            const { count: lessonsCount } = await supabase
              .from('lessons')
              .select('id', { count: 'exact', head: true })
              .eq('chapter_id', chapter.id)

            // Get completed lessons count
            const { count: completedCount } = await supabase
              .from('student_lesson_progress')
              .select('id', { count: 'exact', head: true })
              .eq('student_id', user.id)
              .eq('is_completed', true)
              .in('lesson_id', 
                (await supabase.from('lessons').select('id').eq('chapter_id', chapter.id)).data?.map(l => l.id) || []
              )

            return {
              ...chapter,
              progress: progress || { is_unlocked: false, is_completed: false },
              // Chapter pertama (floor 1) selalu unlocked, yang lain tergantung progress
              isLocked: chapter.floor_number === 1 ? false : !(progress?.is_unlocked ?? false),
              totalLessons: lessonsCount || 0,
              completedLessons: completedCount || 0,
              percentage: lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0
            }
          })
        )

        setChapters(chaptersWithProgress.sort((a, b) => a.floor_number - b.floor_number))

        // Calculate total stats
        const totalLessons = chaptersWithProgress.reduce((sum, c) => sum + c.totalLessons, 0)
        const completedLessons = chaptersWithProgress.reduce((sum, c) => sum + c.completedLessons, 0)

        // Get quest attempts
        const { data: attempts } = await supabase
          .from('student_quest_attempts')
          .select('id, passed')
          .eq('student_id', user.id)

        const completedQuests = attempts?.filter(a => a.passed).length || 0

        setStats({
          xp,
          coins,
          level,
          completedLessons,
          totalLessons,
          completedQuests,
          totalQuests: attempts?.length || 0
        })

        // Get recent activities
        const { data: recentAttempts } = await supabase
          .from('student_quest_attempts')
          .select(`
            id,
            score,
            percentage,
            passed,
            xp_earned,
            coins_earned,
            completed_at,
            quest:quests(
              title,
              lesson:lessons(
                title,
                chapter:chapters(title)
              )
            )
          `)
          .eq('student_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5)

        setRecentActivities(recentAttempts || [])
      } else {
        // No class membership, set default stats
        setStats({
          xp,
          coins,
          level,
          completedLessons: 0,
          totalLessons: 0,
          completedQuests: 0,
          totalQuests: 0
        })
      }

      // Get leaderboard (top 5 students from same class)
      if (currentClassId) {
        const { data: classMembers, error: leaderboardError } = await supabase
          .from('class_members')
          .select('student_id')
          .eq('class_id', currentClassId)

        if (leaderboardError) {
          console.error('Error fetching class members:', leaderboardError)
          setLeaderboard([])
        } else if (classMembers && classMembers.length > 0) {
          // Get profiles for all students in the class
          const studentIds = classMembers.map(cm => cm.student_id)
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, xp_points')
            .in('id', studentIds)

          if (profileError) {
            console.error('Error fetching profiles:', profileError)
            setLeaderboard([])
          } else {
            const topStudents = profiles?.map(p => ({
              id: p.id,
              full_name: p.full_name,
              xp_points: p.xp_points || 0
            })) || []

            // Sort by XP and take top 5
            topStudents.sort((a, b) => b.xp_points - a.xp_points)
            setLeaderboard(topStudents.slice(0, 5))
          }
        } else {
          setLeaderboard([])
        }
      } else {
        setLeaderboard([])
      }

    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateLevelProgress = () => {
    const currentLevelXP = (stats.level - 1) * 100
    const nextLevelXP = stats.level * 100
    const progressXP = stats.xp - currentLevelXP
    const neededXP = nextLevelXP - currentLevelXP
    return Math.round((progressXP / neededXP) * 100)
  }

  if (loading) {
    return (
      <StudentLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-24 h-24">
            <DotLottieReact
              src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
              loop
              autoplay
            />
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout showHeader={false} showBottomNav={true}>
      {/* Mobile: Custom Header with Gradient */}
      <div className="lg:hidden -mx-4 -mt-6 mb-6">
        <div 
          className="px-6 pt-8 pb-24"
          style={{
            background: 'linear-gradient(135deg, #1E258F 0%, #4450FF 100%)'
          }}
        >
          {/* Top Bar: Logo, Bell, Avatar */}
          <div className="flex items-center justify-between mb-8">
            {/* Logo */}
            <img src={logo2} alt="Parlio" className="h-8" />
            
            {/* Right: Bell & Avatar */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button className="relative p-2 hover:bg-white/10 rounded-full transition">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                {/* Red dot indicator - only shown when there are notifications */}
                {false && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>}
              </button>
              
              {/* Avatar */}
              <Link to="/student/profile" className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg ring-2 ring-white/30">
                  <span className="text-white font-bold text-sm">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </Link>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-white text-2xl mb-1">
              <span className="font-normal">Bonjour </span>
              <span className="font-bold">{profile?.full_name?.split(' ')[0] || 'Ahmad'}</span>,
            </h1>
            <p className="text-white/90 text-sm font-medium">
              {motivationalMessage}
            </p>
          </div>

          {/* Stats Card (Glassmorphism, floating) */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-4 -mb-10 border border-white/20">
            <div className="flex items-center justify-between gap-1">
              {/* Total XP */}
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-600 text-[9px] font-medium leading-tight">Total XP</p>
                  <p className="text-blue-600 text-lg font-bold leading-none">{stats.xp}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-9 bg-gray-200/50"></div>

              {/* Total Poin */}
              <div className="flex items-center gap-1.5 flex-1">
                <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-gray-600 text-[9px] font-medium leading-tight">Total Coin</p>
                  <p className="text-yellow-500 text-lg font-bold leading-none">{stats.coins}</p>
                </div>
              </div>

              {/* Button Lihat Peringkat */}
              <Link 
                to="/student/leaderboard"
                className="bg-[#1E258F] hover:bg-[#161d6f] text-white px-3.5 py-2 rounded-xl font-bold text-[11px] shadow-lg transition flex-shrink-0 whitespace-nowrap"
              >
                Peringkat Saya
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Keep existing header */}
      <div className="hidden lg:block -mx-4 -mt-6 mb-8">
        <div 
          className="px-8 pt-10 pb-24"
          style={{
            background: 'linear-gradient(135deg, #1E258F 0%, #4450FF 100%)'
          }}
        >
          {/* Top Bar: Logo, Bell, Avatar */}
          <div className="flex items-center justify-between mb-10">
            {/* Logo */}
            <img src={logo2} alt="Parlio" className="h-10" />
            
            {/* Right: Bell & Avatar */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <button className="relative p-2.5 hover:bg-white/10 rounded-full transition">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
                {/* Red dot indicator - only shown when there are notifications */}
                {false && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>}
              </button>
              
              {/* Avatar */}
              <Link to="/student/profile" className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg ring-2 ring-white/30">
                  <span className="text-white font-bold text-base">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></div>
              </Link>
            </div>
          </div>

          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-white text-3xl mb-2">
              <span className="font-normal">Bonjour </span>
              <span className="font-bold">{profile?.full_name?.split(' ')[0] || 'Ahmad'}</span>,
            </h1>
            <p className="text-white/90 text-base font-medium">
              {motivationalMessage}
            </p>
          </div>

          {/* Stats Card (Glassmorphism, floating, wider for desktop) */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-5 -mb-8 border border-white/20">
            <div className="flex items-center justify-between gap-6">
              {/* Total XP */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-medium leading-tight">Total XP</p>
                  <p className="text-blue-600 text-2xl font-bold leading-none">{stats.xp}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-12 bg-gray-200/50"></div>

              {/* Total Coin */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-medium leading-tight">Total Coin</p>
                  <p className="text-yellow-600 text-2xl font-bold leading-none">{stats.coins}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-12 bg-gray-200/50"></div>

              {/* Button Lihat Peringkat */}
              <Link 
                to="/student/leaderboard"
                className="bg-[#1E258F] hover:bg-[#161d6f] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition flex-shrink-0"
              >
                Peringkat Saya
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress Card - With gap from stats card on desktop */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-6 lg:mt-0 -mt-16 relative z-10">
        {/* Header with blue soft background */}
        <div className="flex items-center justify-between mb-5">
          <div className="bg-blue-50 px-3 py-1.5 rounded-lg">
            <h2 className="text-[#1E258F] text-sm font-semibold">Level Kamu Sekarang</h2>
          </div>
          <img src={logo2} alt="Parlio" className="h-4" style={{ filter: 'brightness(0) saturate(100%) invert(37%) sepia(95%) saturate(2664%) hue-rotate(226deg) brightness(101%) contrast(104%)' }} />
        </div>

        {/* Level Badge & Info */}
        <div className="flex items-center gap-4 mb-4">
          {/* Badge Icon - Changed to blue */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4450FF] to-[#1E258F] flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Level Info */}
          <div className="flex-1">
            <h3 className="text-[#4450FF] text-3xl font-bold mb-1">Level {stats.level}</h3>
            <p className="text-orange-600 text-sm font-semibold">{stats.xp} / {stats.level * 100} XP</p>
          </div>

          {/* Progress Percentage */}
          <div className="text-right">
            <p className="text-gray-400 text-sm font-medium">{100 - calculateLevelProgress()}% lagi</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-[#4450FF] h-full rounded-full transition-all duration-700"
            style={{ width: `${calculateLevelProgress()}%` }}
          />
        </div>
      </div>

      {/* Chapter Kamu Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-900 text-xl font-semibold">Pelajaran Kamu</h2>
          <Link 
            to="/student/chapters" 
            className="text-[#4450FF] text-sm font-semibold hover:underline flex items-center gap-1"
          >
            Lihat Semua
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Chapter Cards - Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-3 pb-2">
            {chapters.slice(0, 2).map((chapter, index) => (
              <div 
                key={chapter.id}
                className={`bg-white rounded-xl shadow-md border border-gray-100 p-4 flex-shrink-0 w-[280px] ${
                  chapter.isLocked ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'
                } transition`}
                onClick={() => !chapter.isLocked && navigate(`/student/chapters/${chapter.id}`)}
              >
                {/* Icon & Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl ${
                    chapter.isLocked 
                      ? 'bg-gray-200' 
                      : 'bg-lime-500'
                  } flex items-center justify-center shadow-md flex-shrink-0 text-xl`}>
                    {chapter.isLocked ? '🔒' : '📗'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm mb-0.5 ${chapter.isLocked ? 'text-gray-400' : 'text-gray-900'} line-clamp-2`}>
                      {chapter.title || 'Chapter Title'}
                    </h3>
                    {chapter.isLocked && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
                        <span>Terkunci</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lesson Count */}
                <p className="text-gray-500 text-xs mb-2">
                  {chapter.totalLessons || 0} Lesson
                </p>

                {/* Progress Bar */}
                <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${chapter.isLocked ? 'bg-gray-300' : 'bg-blue-500'}`}
                    style={{ width: `${chapter.percentage || 0}%` }}
                  />
                </div>
                <p className="text-gray-400 text-[10px] text-right mt-1">{chapter.percentage || 0}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Informasi Section - Carousel */}
      <div className="mb-6">
        <h2 className="text-gray-900 text-xl font-semibold mb-4">Informasi</h2>
        
        {/* Carousel Container */}
        <div className="relative">
          {/* Cards Wrapper with horizontal scroll */}
          <div 
            ref={carouselRef}
            className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            onScroll={(e) => {
              const scrollLeft = e.target.scrollLeft
              const cardWidth = e.target.scrollWidth / informationCards.length
              const newIndex = Math.round(scrollLeft / cardWidth)
              setActiveInfoSlide(newIndex)
            }}
          >
            <div className="flex gap-4 pb-2">
              {informationCards.map((card, index) => (
                <div 
                  key={card.id}
                  className="flex-shrink-0 w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] snap-start"
                >
                  <div className={`bg-gradient-to-br ${card.color} rounded-2xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-all duration-300`}>
                    {/* Icon - using emoji from card */}
                    <div className="mb-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                        {card.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {card.description}
                    </p>

                    {/* Badge */}
                    <div className="mt-4">
                      <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                        {card.type === 'announcement' && '📢 Pengumuman'}
                        {card.type === 'event' && '📅 Event'}
                        {card.type === 'tips' && '💡 Tips'}
                        {card.type === 'news' && '📰 Berita'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {informationCards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (carouselRef.current) {
                    const cardWidth = carouselRef.current.scrollWidth / informationCards.length
                    carouselRef.current.scrollTo({
                      left: cardWidth * index,
                      behavior: 'smooth'
                    })
                  }
                }}
                className={`transition-all duration-300 rounded-full ${
                  activeInfoSlide === index 
                    ? 'w-8 h-2 bg-[#4450FF]' 
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows (Desktop only) */}
          <div className="hidden lg:flex items-center justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none">
            <button
              onClick={() => {
                if (carouselRef.current) {
                  const newIndex = activeInfoSlide === 0 ? informationCards.length - 1 : activeInfoSlide - 1
                  const cardWidth = carouselRef.current.scrollWidth / informationCards.length
                  carouselRef.current.scrollTo({
                    left: cardWidth * newIndex,
                    behavior: 'smooth'
                  })
                }
              }}
              className="pointer-events-auto -ml-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (carouselRef.current) {
                  const newIndex = activeInfoSlide === informationCards.length - 1 ? 0 : activeInfoSlide + 1
                  const cardWidth = carouselRef.current.scrollWidth / informationCards.length
                  carouselRef.current.scrollTo({
                    left: cardWidth * newIndex,
                    behavior: 'smooth'
                  })
                }
              }}
              className="pointer-events-auto -mr-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}

export default StudentDashboard