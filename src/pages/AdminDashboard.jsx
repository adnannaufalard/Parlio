import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AdminLayout from '../components/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Users, GraduationCap, BookOpen, Megaphone, MessageSquare, Activity, TrendingUp } from 'lucide-react'

function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalUsers: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0, activeAnnouncements: 0, activeMotivationalMessages: 0 })
  const [recentActivities, setRecentActivities] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [usersByDate, setUsersByDate] = useState([])
  const [activitiesByType, setActivitiesByType] = useState([])
  const [lastActivity, setLastActivity] = useState({})

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [usersResult, classesResult, announcementsResult, messagesResult, activitiesResult, recentUsersResult, allUsersResult, allActivitiesResult, lastActivityResult] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('motivational_messages').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('activity_logs').select('*, profiles:user_id(avatar_url)').order('created_at', { ascending: false }).limit(6),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('created_at').order('created_at', { ascending: true }),
        supabase.from('activity_logs').select('action_type, created_at'),
        supabase.from('activity_logs').select('user_id, created_at').eq('action_type', 'auth').order('created_at', { ascending: false })
      ])

      const users = usersResult.data || []
      setStats({
        totalUsers: users.length,
        totalTeachers: users.filter(u => u.role === 'guru').length,
        totalStudents: users.filter(u => u.role === 'siswa').length,
        totalClasses: classesResult.count || 0,
        activeAnnouncements: announcementsResult.count || 0,
        activeMotivationalMessages: messagesResult.count || 0
      })
      setRecentActivities(activitiesResult.data || [])
      setRecentUsers(recentUsersResult.data || [])

      // Process last activity for badge status
      const activityData = lastActivityResult.data || []
      const activityMap = {}
      activityData.forEach(a => {
        if (!activityMap[a.user_id]) activityMap[a.user_id] = a.created_at
      })
      setLastActivity(activityMap)

      // Process users by date for chart (last 7 days)
      const allUsers = allUsersResult.data || []
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]
      })
      const userCountByDate = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
        users: allUsers.filter(u => u.created_at?.startsWith(date)).length,
        total: allUsers.filter(u => u.created_at?.split('T')[0] <= date).length
      }))
      setUsersByDate(userCountByDate)

      // Process activities by type for chart
      const activities = allActivitiesResult.data || []
      const typeCount = activities.reduce((acc, a) => { acc[a.action_type] = (acc[a.action_type] || 0) + 1; return acc }, {})
      setActivitiesByType(Object.entries(typeCount).map(([name, value]) => ({ name, value })))
    } catch (error) { console.error('Error:', error) }
    finally { setLoading(false) }
  }

  const isUserActive = (userId) => {
    const lastLogin = lastActivity[userId]
    if (!lastLogin) return false
    const hoursSinceLogin = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60)
    return hoursSinceLogin < 24
  }

  const formatTimeAgo = (d) => { const ms = new Date() - new Date(d); const m = Math.floor(ms / 60000); if (m < 1) return 'Baru saja'; if (m < 60) return `${m}m`; const h = Math.floor(ms / 3600000); if (h < 24) return `${h}j`; return `${Math.floor(ms / 86400000)}h` }

  const chartConfig = { users: { label: 'Users', color: 'hsl(222.2 47.4% 11.2%)' }, total: { label: 'Total', color: 'hsl(215.4 16.3% 46.9%)' } }
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  if (loading) {
    return <AdminLayout title="Dashboard"><div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div></AdminLayout>
  }

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.totalTeachers} guru, {stats.totalStudents} siswa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guru</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Pengajar aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siswa</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Pelajar terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Kelas aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Pertumbuhan User (7 Hari)
            </CardTitle>
            <CardDescription>Total kumulatif user terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={usersByDate} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(222.2 47.4% 11.2%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(222.2 47.4% 11.2%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="total" stroke="hsl(222.2 47.4% 11.2%)" fill="url(#fillTotal)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Activity by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" /> Aktivitas per Tipe
            </CardTitle>
            <CardDescription>Distribusi jenis aktivitas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={activitiesByType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {activitiesByType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAnnouncements}</div>
            <Link to="/admin/announcements" className="text-xs text-blue-600 hover:underline">Kelola →</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Motivational</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMotivationalMessages}</div>
            <Link to="/admin/motivational-messages" className="text-xs text-blue-600 hover:underline">Kelola →</Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Aktivitas Terbaru</CardTitle>
              <Link to="/admin/activity-logs" className="text-xs text-muted-foreground hover:text-foreground">Lihat Semua</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Belum ada aktivitas</p>
            ) : (
              recentActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={a.profiles?.avatar_url} alt={a.user_name} />
                    <AvatarFallback className="bg-slate-800 text-white text-sm font-medium">{a.user_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                    <AvatarBadge className={isUserActive(a.user_id) ? 'bg-green-500' : 'bg-gray-400'} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate"><span className="font-medium">{a.user_name}</span> {a.action}</p>
                  </div>
                  <Badge variant={a.action_type === 'create' ? 'default' : a.action_type === 'delete' ? 'destructive' : 'secondary'}>
                    {a.action_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(a.created_at)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">User Terbaru</CardTitle>
              <Link to="/admin/users" className="text-xs text-muted-foreground hover:text-foreground">Lihat Semua</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar_url} alt={user.full_name} />
                  <AvatarFallback className="bg-slate-800 text-white text-sm font-medium">{user.full_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                  <AvatarBadge className={isUserActive(user.id) ? 'bg-green-500' : 'bg-gray-400'} />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || 'No Name'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
