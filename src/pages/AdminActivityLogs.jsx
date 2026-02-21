import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import AdminLayout from '../components/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, Calendar, Search, RefreshCw } from 'lucide-react'

function AdminActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionTypeFilter, setActionTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.from('activity_logs').select('*, profiles:user_id(avatar_url)').order('created_at', { ascending: false }).limit(500)
      setLogs(data || [])
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }

  const filteredLogs = useMemo(() => logs.filter(l => {
    const match = searchQuery === '' || l.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.action?.toLowerCase().includes(searchQuery.toLowerCase())
    return match && (actionTypeFilter === 'all' || l.action_type === actionTypeFilter)
  }), [logs, searchQuery, actionTypeFilter])

  const paginatedLogs = useMemo(() => filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredLogs, currentPage])
  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const actionTypes = useMemo(() => [...new Set(logs.map(l => l.action_type).filter(Boolean))], [logs])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayLogs = logs.filter(l => new Date(l.created_at) >= today).length

  const formatTime = (d) => { const ms = new Date() - new Date(d); const m = Math.floor(ms / 60000); if (m < 1) return 'Baru saja'; if (m < 60) return `${m}m`; const h = Math.floor(ms / 3600000); if (h < 24) return `${h}j`; return `${Math.floor(ms / 86400000)}h` }

  if (loading) {
    return <AdminLayout title="Activity Logs"><div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div></AdminLayout>
  }

  return (
    <AdminLayout title="Activity Logs">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{logs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{todayLogs}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hasil Filter</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{filteredLogs.length}</div></CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-1 gap-2">
              <Input placeholder="Cari aktivitas..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} className="max-w-xs" />
              <Select value={actionTypeFilter} onValueChange={(v) => { setActionTypeFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Tipe" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {actionTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchLogs}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {paginatedLogs.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">{logs.length === 0 ? 'Belum ada aktivitas log' : 'Tidak ada log yang sesuai'}</p>
            ) : paginatedLogs.map((l) => (
              <div key={l.id} className="px-6 py-3 flex items-center gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={l.profiles?.avatar_url} alt={l.user_name} />
                  <AvatarFallback className="bg-slate-800 text-white text-sm font-medium">{l.user_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                  <AvatarBadge className="bg-green-500" />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate"><span className="font-medium">{l.user_name}</span> {l.action}</p>
                </div>
                <Badge variant={l.action_type === 'create' ? 'default' : l.action_type === 'delete' ? 'destructive' : l.action_type === 'auth' ? 'secondary' : 'outline'}>
                  {l.action_type}
                </Badge>
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(l.created_at)}</span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredLogs.length)} dari {filteredLogs.length}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                <span className="px-3 py-1 text-sm">{currentPage}/{totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default AdminActivityLogs
