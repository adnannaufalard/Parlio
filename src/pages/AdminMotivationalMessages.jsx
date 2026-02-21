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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MessageSquare, CheckCircle, XCircle, Clock, Plus, Pencil, Trash2 } from 'lucide-react'

function AdminMotivationalMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [formData, setFormData] = useState({ 
    message: '', 
    is_active: true, 
    display_order: 0,
    published_at: '',
    expires_at: ''
  })

  useEffect(() => { fetchMessages() }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.from('motivational_messages').select('*').order('display_order').order('created_at', { ascending: false })
      setMessages(data || [])
    } catch { toast({ title: 'Gagal', description: 'Gagal memuat messages', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const handleCreate = () => {
    setEditing(null)
    setFormData({ 
      message: '', 
      is_active: true, 
      display_order: messages.length + 1,
      published_at: '',
      expires_at: ''
    })
    setModalOpen(true)
  }

  const handleEdit = (m) => {
    setEditing(m)
    setFormData({ 
      message: m.message, 
      is_active: m.is_active, 
      display_order: m.display_order,
      published_at: m.published_at ? new Date(m.published_at).toISOString().slice(0, 16) : '',
      expires_at: m.expires_at ? new Date(m.expires_at).toISOString().slice(0, 16) : ''
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const dataToSave = {
        message: formData.message,
        is_active: formData.is_active,
        display_order: formData.display_order,
        published_at: formData.published_at || null,
        expires_at: formData.expires_at || null
      }
      if (editing) {
        await supabase.from('motivational_messages').update(dataToSave).eq('id', editing.id)
        toast({ title: 'Berhasil', description: 'Message telah diupdate' })
        ActivityLogger.updateMotivationalMessage(editing.id, formData.message)
      } else {
        await supabase.from('motivational_messages').insert([{ ...dataToSave, created_by: user.id }])
        toast({ title: 'Berhasil', description: 'Message telah dibuat' })
        ActivityLogger.createMotivationalMessage(formData.message)
      }
      setModalOpen(false)
      fetchMessages()
    } catch { toast({ title: 'Gagal', description: 'Gagal menyimpan', variant: 'destructive' }) }
  }

  const handleDeleteClick = (m) => { setItemToDelete(m); setDeleteDialogOpen(true) }
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    try {
      await supabase.from('motivational_messages').delete().eq('id', itemToDelete.id)
      toast({ title: 'Berhasil', description: 'Message telah dihapus' })
      ActivityLogger.deleteMotivationalMessage(itemToDelete.id)
      fetchMessages()
    } catch { toast({ title: 'Gagal', description: 'Gagal menghapus', variant: 'destructive' }) }
    finally { setDeleteDialogOpen(false); setItemToDelete(null) }
  }

  const toggleActive = async (m) => {
    try {
      await supabase.from('motivational_messages').update({ is_active: !m.is_active }).eq('id', m.id)
      toast({ title: 'Berhasil', description: `Status message diubah ke ${!m.is_active ? 'aktif' : 'nonaktif'}` })
      ActivityLogger.updateMotivationalMessage(m.id, m.message)
      fetchMessages()
    } catch { toast({ title: 'Gagal', description: 'Gagal mengubah status', variant: 'destructive' }) }
  }

  const suggestions = [
    "Mari belajar bahasa Prancis dengan semangat hari ini! 🇫🇷",
    "Setiap kata baru adalah jendela ke dunia baru 🌍",
    "Konsistensi adalah kunci kesuksesan belajar bahasa 📚",
    "Jangan takut membuat kesalahan, itu bagian dari proses belajar ✨",
    "Ayo raih XP dan level up kemampuan bahasa Prancismu! 🚀",
    "Belajar bahasa adalah perjalanan, nikmati prosesnya! 🎯"
  ]

  if (loading) {
    return <AdminLayout title="Motivational"><div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /></div></AdminLayout>
  }

  return (
    <AdminLayout title="Motivational">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{messages.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{messages.filter(m => m.is_active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nonaktif</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{messages.filter(m => !m.is_active).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-600">{messages.filter(m => m.published_at && new Date(m.published_at) > new Date()).length}</div></CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Motivational Messages</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Subtitle motivasi di header dashboard siswa</p>
            </div>
            <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" /> Tambah</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Belum ada message. Klik "Tambah" untuk membuat.</p>
          ) : (
            <div className="divide-y">
              {messages.map((m) => (
                <div key={m.id} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-8">#{m.display_order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{m.message}</p>
                    {(m.published_at || m.expires_at) && (
                      <div className="flex gap-2 mt-1">
                        {m.published_at && <span className="text-xs text-muted-foreground">Mulai: {new Date(m.published_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                        {m.expires_at && <span className="text-xs text-muted-foreground">Berakhir: {new Date(m.expires_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    )}
                  </div>
                  <Badge 
                    className={`cursor-pointer ${m.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
                    onClick={() => toggleActive(m)}
                  >
                    {m.is_active ? 'Aktif' : 'Off'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(m)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Message' : 'Tambah Message'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
              <Textarea id="message" required value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={3} maxLength={200} placeholder="Tulis motivational message..." />
              <p className="text-xs text-muted-foreground">{formData.message.length}/200</p>
            </div>
            
            {!editing && (
              <div className="space-y-2">
                <Label>Saran</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <Badge key={i} variant="outline" className="cursor-pointer hover:bg-accent" onClick={() => setFormData({ ...formData, message: s })}>
                      {s.substring(0, 30)}...
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input id="order" type="number" min="0" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <label className="flex items-center gap-2 h-10 px-3 border rounded-md cursor-pointer bg-white">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
                  <span className="text-sm">{formData.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="published_at">Mulai Tayang</Label>
                <Input id="published_at" type="datetime-local" value={formData.published_at} onChange={(e) => setFormData({ ...formData, published_at: e.target.value })} />
                <p className="text-xs text-muted-foreground">Kosongkan untuk tayang sekarang</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Berakhir</Label>
                <Input id="expires_at" type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })} />
                <p className="text-xs text-muted-foreground">Kosongkan untuk tayang selamanya</p>
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
            <AlertDialogTitle>Hapus Message</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus message ini? Aksi ini tidak dapat dibatalkan.
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

export default AdminMotivationalMessages
