import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createUser, updateUser, deleteUser } from '../lib/adminApi'
import { toast } from '@/hooks/use-toast'
import AdminLayout from '../components/AdminLayout'
import { ActivityLogger, logActivity } from '../lib/activityLogger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from '@/components/ui/avatar'
import { Users, GraduationCap, BookOpen, Pencil, Trash2, Plus, RotateCcw } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [lastActivity, setLastActivity] = useState({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', role: 'siswa' })
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [userToReset, setUserToReset] = useState(null)
  const pageSize = 10

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) { toast.error('Gagal memuat data') } else { setUsers(data || []) }
    
    // Fetch last login activity for each user
    const { data: activityData } = await supabase
      .from('activity_logs')
      .select('user_id, created_at')
      .eq('action_type', 'auth')
      .order('created_at', { ascending: false })
    
    if (activityData) {
      const activityMap = {}
      activityData.forEach(a => {
        if (!activityMap[a.user_id]) activityMap[a.user_id] = a.created_at
      })
      setLastActivity(activityMap)
    }
    setLoading(false)
  }

  const isUserActive = (userId) => {
    const lastLogin = lastActivity[userId]
    if (!lastLogin) return false
    const hoursSinceLogin = (Date.now() - new Date(lastLogin).getTime()) / (1000 * 60 * 60)
    return hoursSinceLogin < 24
  }

  const filteredUsers = useMemo(() => users.filter(u => {
    const match = searchQuery === '' || u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    return match && (roleFilter === 'all' || u.role === roleFilter)
  }), [users, searchQuery, roleFilter])

  const paginatedUsers = useMemo(() => filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredUsers, currentPage])
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const stats = useMemo(() => ({ total: users.length, guru: users.filter(u => u.role === 'guru').length, siswa: users.filter(u => u.role === 'siswa').length }), [users])

  const handleCreate = () => { setEditing(null); setFormData({ fullName: '', email: '', password: '', role: 'siswa' }); setModalOpen(true) }
  const handleEdit = (u) => { setEditing(u); setFormData({ fullName: u.full_name || '', email: u.email || '', password: '', role: u.role || 'siswa' }); setModalOpen(true) }
  const handleDeleteClick = (u) => { setUserToDelete(u); setDeleteDialogOpen(true) }
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    try {
      await deleteUser({ id: userToDelete.id })
      toast({ title: 'Berhasil', description: `User "${userToDelete.full_name}" telah dihapus` })
      ActivityLogger.deleteUser(userToDelete.id, userToDelete.full_name)
      fetchUsers()
    } catch (e) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleResetClick = (u) => { setUserToReset(u); setResetDialogOpen(true) }
  const handleResetConfirm = async () => {
    if (!userToReset) return
    setSaving(true)
    try {
      const { data, error } = await supabase.rpc('admin_reset_student_progress', { p_student_id: userToReset.id })
      if (error) {
        if (error.message.includes('function') || error.code === '42883') {
          throw new Error('RPC function belum dibuat. Jalankan migration fix_activity_logs_and_reset.sql')
        }
        throw error
      }
      toast({ title: 'Berhasil', description: `Progress siswa "${userToReset.full_name}" telah di-reset` })
      logActivity({ action: `Reset progress siswa: ${userToReset.full_name}`, actionType: 'update', resourceType: 'user', resourceId: userToReset.id })
    } catch (e) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
      setResetDialogOpen(false)
      setUserToReset(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editing) {
        await updateUser({ id: editing.id, full_name: formData.fullName, email: formData.email, role: formData.role })
        toast({ title: 'Berhasil', description: `User "${formData.fullName}" telah diperbarui` })
        ActivityLogger.updateUser(editing.id, formData.fullName, { role: formData.role })
      } else {
        await createUser({ full_name: formData.fullName, email: formData.email, password: formData.password, role: formData.role })
        toast({ title: 'Berhasil', description: `User "${formData.fullName}" telah dibuat` })
        ActivityLogger.createUser(formData.fullName, formData.role)
      }
      setModalOpen(false); fetchUsers()
    } catch (e) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  if (loading) {
    return <AdminLayout title="Users"><div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div></AdminLayout>
  }

  return (
    <AdminLayout title="Users">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siswa</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.siswa}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guru</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.guru}</div></CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-1 gap-2">
              <Input placeholder="Cari nama atau email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} className="max-w-xs" />
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="siswa">Siswa</SelectItem>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Tambah User</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Tidak ada pengguna</TableCell></TableRow>
              ) : paginatedUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url} alt={u.full_name} />
                        <AvatarFallback className="bg-slate-800 text-white text-sm font-medium">{u.full_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                        <AvatarBadge className={isUserActive(u.id) ? 'bg-green-500' : 'bg-gray-400'} />
                      </Avatar>
                      <div><p className="font-medium">{u.full_name || 'No Name'}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'guru' ? 'default' : u.role === 'admin' ? 'secondary' : 'outline'}>{u.role}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {u.role === 'siswa' && (
                      <Button variant="ghost" size="icon" onClick={() => handleResetClick(u)} title="Reset Progress Siswa"><RotateCcw className="h-4 w-4 text-orange-500" /></Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(u)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredUsers.length)} dari {filteredUsers.length}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                <span className="px-3 py-1 text-sm">{currentPage}/{totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Tambah User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama</Label>
              <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!!editing} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {editing && <span className="text-muted-foreground">(kosongkan jika tidak diubah)</span>}</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editing} minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="siswa">Siswa</SelectItem>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Batal</Button>
              <Button type="submit" disabled={saving}>{saving ? '...' : editing ? 'Update' : 'Tambah'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user "{userToDelete?.full_name}"? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="!bg-red-600 !text-white hover:!bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Progress Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Progress Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin me-reset SEMUA progress untuk siswa "{userToReset?.full_name}"? 
              <br/><br/>
              <strong>Peringatan:</strong> Aksi ini akan menghapus semua history attempt, XP, dan Coins siswa tersebut menjadi 0. Aksi ini tidak dapat dibatalkan!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} disabled={saving} className="!bg-orange-500 !text-white hover:!bg-orange-600">
              {saving ? 'Memproses...' : 'Reset Progress'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
