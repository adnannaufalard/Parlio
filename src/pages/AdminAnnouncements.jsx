import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toast } from '@/hooks/use-toast'
import { ActivityLogger } from '../lib/activityLogger'
import AdminLayout from '../components/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Megaphone, CheckCircle, XCircle, Calendar, Plus, Pencil, Trash2 } from 'lucide-react'

const colorOptions = [
  { name: 'Blue', from: 'from-blue-500', to: 'to-blue-600' },
  { name: 'Purple', from: 'from-purple-500', to: 'to-purple-600' },
  { name: 'Green', from: 'from-green-500', to: 'to-green-600' },
  { name: 'Orange', from: 'from-orange-500', to: 'to-orange-600' },
  { name: 'Pink', from: 'from-pink-500', to: 'to-pink-600' },
  { name: 'Red', from: 'from-red-500', to: 'to-red-600' },
]

const iconOptions = ['📢', '📅', '💡', '🚀', '⭐', '🎉', '📚', '🏆', '🎯', '✨']

function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'announcement',
    color_from: 'from-blue-500', color_to: 'to-blue-600',
    icon: '📢', is_active: true, display_order: 0,
    published_at: '', expires_at: ''
  })

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.from('announcements').select('*').order('display_order').order('created_at', { ascending: false })
      setAnnouncements(data || [])
    } catch { toast({ title: 'Gagal', description: 'Gagal memuat announcements', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const handleCreate = () => {
    setEditing(null)
    setFormData({
      title: '', description: '', type: 'announcement',
      color_from: 'from-blue-500', color_to: 'to-blue-600',
      icon: '📢', is_active: true, display_order: announcements.length + 1,
      published_at: '', expires_at: ''
    })
    setModalOpen(true)
  }

  const handleEdit = (a) => {
    setEditing(a)
    setFormData({
      title: a.title, description: a.description || '', type: a.type,
      color_from: a.color_from, color_to: a.color_to, icon: a.icon || '📢',
      is_active: a.is_active, display_order: a.display_order,
      published_at: a.published_at ? new Date(a.published_at).toISOString().slice(0, 16) : '',
      expires_at: a.expires_at ? new Date(a.expires_at).toISOString().slice(0, 16) : ''
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const dataToSave = { ...formData, published_at: formData.published_at || null, expires_at: formData.expires_at || null }
      if (editing) {
        await supabase.from('announcements').update(dataToSave).eq('id', editing.id)
        toast({ title: 'Berhasil', description: `Announcement "${formData.title}" telah diupdate` })
        ActivityLogger.updateAnnouncement(editing.id, formData.title)
      } else {
        await supabase.from('announcements').insert([{ ...dataToSave, created_by: user.id }])
        toast({ title: 'Berhasil', description: `Announcement "${formData.title}" telah dibuat` })
        ActivityLogger.createAnnouncement(formData.title)
      }
      setModalOpen(false)
      fetchAnnouncements()
    } catch { toast({ title: 'Gagal', description: 'Gagal menyimpan', variant: 'destructive' }) }
  }

  const handleDeleteClick = (a) => { setItemToDelete(a); setDeleteDialogOpen(true) }
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    try {
      await supabase.from('announcements').delete().eq('id', itemToDelete.id)
      toast({ title: 'Berhasil', description: `Announcement "${itemToDelete.title}" telah dihapus` })
      ActivityLogger.deleteAnnouncement(itemToDelete.id, itemToDelete.title)
      fetchAnnouncements()
    } catch { toast({ title: 'Gagal', description: 'Gagal menghapus', variant: 'destructive' }) }
    finally { setDeleteDialogOpen(false); setItemToDelete(null) }
  }

  const toggleActive = async (a) => {
    try {
      await supabase.from('announcements').update({ is_active: !a.is_active }).eq('id', a.id)
      toast({ title: 'Berhasil', description: `Status announcement diubah ke ${!a.is_active ? 'aktif' : 'nonaktif'}` })
      ActivityLogger.updateAnnouncement(a.id, a.title)
      fetchAnnouncements()
    } catch { toast({ title: 'Gagal', description: 'Gagal mengubah status', variant: 'destructive' }) }
  }

  if (loading) {
    return <AdminLayout title="Announcements"><div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div></AdminLayout>
  }

  return (
    <AdminLayout title="Announcements">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{announcements.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{announcements.filter(a => a.is_active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nonaktif</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{announcements.filter(a => !a.is_active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-600">{announcements.filter(a => a.published_at && new Date(a.published_at) > new Date()).length}</div></CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Announcements</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Carousel di dashboard siswa</p>
            </div>
            <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Tambah</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {announcements.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Belum ada announcement. Klik "Tambah" untuk membuat.</p>
          ) : (
            <div className="divide-y">
              {announcements.map((a) => (
                <div key={a.id} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-8">#{a.display_order}</span>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color_from} ${a.color_to} flex items-center justify-center text-lg flex-shrink-0`}>{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                  </div>
                  <Badge 
                    className={`cursor-pointer ${a.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                    onClick={() => toggleActive(a)}
                  >
                    {a.is_active ? 'Aktif' : 'Off'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(a)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Announcement' : 'Tambah Announcement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Judul announcement" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Deskripsi..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="tips">Tips</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-1">
                  {iconOptions.map((icon) => (
                    <button key={icon} type="button" onClick={() => setFormData({ ...formData, icon })} className={`w-9 h-9 rounded border text-lg transition-colors ${formData.icon === icon ? 'border-primary bg-accent' : 'border-input hover:bg-accent'}`}>{icon}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colorOptions.map((c) => (
                  <button key={c.name} type="button" onClick={() => setFormData({ ...formData, color_from: c.from, color_to: c.to })} 
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.from} ${c.to} transition-all ${formData.color_from === c.from ? 'ring-2 ring-offset-2 ring-primary' : ''}`} title={c.name} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className={`bg-gradient-to-br ${formData.color_from} ${formData.color_to} rounded-lg p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl">{formData.icon}</div>
                  <div>
                    <p className="font-semibold">{formData.title || 'Title'}</p>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{formData.type}</span>
                  </div>
                </div>
                {formData.description && <p className="text-sm text-white/90 mt-2">{formData.description}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input id="order" type="number" min="0" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <label className="flex items-center gap-2 h-10 px-3 border rounded-md cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">{formData.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="published_at">Published At</Label>
                <Input id="published_at" type="datetime-local" value={formData.published_at} onChange={(e) => setFormData({ ...formData, published_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At</Label>
                <Input id="expires_at" type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="submit">{editing ? 'Update' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus announcement "{itemToDelete?.title}"? Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="!bg-red-600 !text-white hover:!bg-red-700">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}

export default AdminAnnouncements
