import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { Plus, Users, BookOpen, User, Loader2, LogOut, Info } from 'lucide-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

function StudentClasses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [myClasses, setMyClasses] = useState([])
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [joiningClass, setJoiningClass] = useState(false)
  const [leaveDialog, setLeaveDialog] = useState({ open: false, classId: null, className: '' })

  useEffect(() => {
    fetchMyClasses()
  }, [])

  const fetchMyClasses = async () => {
    try {
      // Use getSession for faster auth check (cached)
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setLoading(false)
        return
      }

      // Get student's classes
      const { data: classMemberships, error: classError } = await supabase
        .from('class_members')
        .select(`
          class_id,
          student_id,
          classes(
            id,
            class_name,
            class_code,
            teacher_id
          )
        `)
        .eq('student_id', user.id)

      if (classError) {
        console.error('Error fetching classes:', classError)
        toast.error('Gagal mengambil data kelas')
        setLoading(false)
        return
      }

      // Show data immediately
      setLoading(false)

      if (classMemberships) {
        // Get chapter count for each class
        const classesWithDetails = await Promise.all(
          classMemberships.map(async (membership) => {
            const classData = membership.classes

            // Get teacher data
            const { data: teacher } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', classData.teacher_id)
              .single()

            // Get chapter count
            const { count: chapterCount } = await supabase
              .from('class_chapters')
              .select('id', { count: 'exact', head: true })
              .eq('class_id', classData.id)
              .eq('is_active', true)

            // Get student count
            const { count: studentCount } = await supabase
              .from('class_members')
              .select('student_id', { count: 'exact', head: true })
              .eq('class_id', classData.id)

            return {
              ...classData,
              teacher: teacher,
              chapterCount: chapterCount || 0,
              studentCount: studentCount || 0
            }
          })
        )

        setMyClasses(classesWithDetails)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast({ title: 'Gagal', description: 'Gagal memuat kelas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      toast({ title: 'Gagal', description: 'Masukkan kode kelas', variant: 'destructive' })
      return
    }

    try {
      setJoiningClass(true)
      const { data: { user } } = await supabase.auth.getUser()

      // Find class by code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, class_name, teacher_id, class_code')
        .eq('class_code', classCode.toUpperCase().trim())
        .maybeSingle()

      if (classError) {
        console.error('Error finding class:', classError)
        
        // Check if it's a permissions/RLS error
        if (classError.code === 'PGRST116' || classError.message.includes('policy')) {
          toast({ title: 'Error', description: 'Tidak dapat mengakses data kelas. Hubungi administrator.', variant: 'destructive' })
          console.error('⚠️ RLS Policy Error: Table classes mungkin butuh policy untuk SELECT')
        } else if (classError.code === '42703') {
          toast({ title: 'Error', description: 'Column class_code tidak ditemukan di database', variant: 'destructive' })
          console.error('⚠️ Schema Error: Column class_code tidak ada di table classes')
        } else {
          toast({ title: 'Error', description: classError.message, variant: 'destructive' })
        }
        return
      }

      if (!classData) {
        toast({ title: 'Gagal', description: 'Kode kelas tidak ditemukan', variant: 'destructive' })
        return
      }

      // Check if already joined
      const { data: existingMember } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('class_id', classData.id)
        .eq('student_id', user.id)
        .maybeSingle()

      if (existingMember) {
        toast({ title: 'Info', description: 'Anda sudah bergabung di kelas ini' })
        setShowJoinModal(false)
        setClassCode('')
        return
      }

      // Join class
      const { error: joinError } = await supabase
        .from('class_members')
        .insert({
          class_id: classData.id,
          student_id: user.id
        })

      if (joinError) {
        console.error('Error joining class:', joinError)
        
        if (joinError.code === '42501' || joinError.message.includes('policy')) {
          toast({ title: 'Error', description: 'Tidak dapat bergabung ke kelas. Hubungi administrator.', variant: 'destructive' })
          console.error('⚠️ RLS Policy Error: Table class_members butuh policy untuk INSERT')
        } else if (joinError.code === '23505') {
          toast({ title: 'Info', description: 'Anda sudah bergabung di kelas ini' })
        } else {
          toast({ title: 'Gagal', description: joinError.message, variant: 'destructive' })
        }
        return
      }

      toast({ title: 'Berhasil', description: `Bergabung ke kelas "${classData.class_name}"` })
      setShowJoinModal(false)
      setClassCode('')
      
      // Navigate to class chapters page
      navigate(`/student/class/${classData.id}`)
    } catch (error) {
      console.error('Error joining class:', error)
      toast({ title: 'Gagal', description: 'Terjadi kesalahan', variant: 'destructive' })
    } finally {
      setJoiningClass(false)
    }
  }

  const handleLeaveClass = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', leaveDialog.classId)
        .eq('student_id', user.id)

      if (error) {
        toast({ title: 'Gagal', description: 'Gagal keluar dari kelas', variant: 'destructive' })
        return
      }

      toast({ title: 'Berhasil', description: 'Berhasil keluar dari kelas' })
      setLeaveDialog({ open: false, classId: null, className: '' })
      fetchMyClasses()
    } catch (error) {
      console.error('Error leaving class:', error)
      toast({ title: 'Gagal', description: 'Terjadi kesalahan', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <StudentLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-800">Daftar Kelas Saya</h1>
        <Button onClick={() => setShowJoinModal(true)} className="bg-green-500 text-white hover:bg-green-600">
          <Plus className="h-4 w-4 mr-2" />
          Gabung Kelas
        </Button>
      </div>

      {/* Main Content */}
      <div className="space-y-4 pb-6">
        {myClasses.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-48 h-48 mx-auto mb-4">
                <DotLottieReact
                  src="https://lottie.host/408beb9d-77b8-4033-bdbe-0d29b68cc833/vzZ2BVnm49.lottie"
                  loop
                  autoplay
                />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">Belum Ada Kelas</h3>
              <p className="text-sm text-gray-500">
                Klik tombol "Gabung Kelas" untuk bergabung dengan kelas menggunakan kode dari guru Anda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {myClasses.map((classItem) => (
              <Card key={classItem.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">{classItem.class_name}</h3>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span className="text-gray-600">{classItem.teacher?.full_name || 'Guru'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span className="text-gray-600">{classItem.studentCount} siswa</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-gray-600">{classItem.chapterCount} pelajaran</span>
                        </span>
                      </div>

                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        Kode: {classItem.class_code}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(`/student/class/${classItem.id}`)}
                        className="flex-1 sm:flex-none bg-[#1E258F] text-white hover:bg-blue-700"
                      >
                        Lihat Pelajaran
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setLeaveDialog({ open: true, classId: classItem.id, className: classItem.class_name })}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Join Class Dialog */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Gabung Kelas Baru</DialogTitle>
            <DialogDescription>
              Masukkan kode kelas yang diberikan oleh guru Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Tanyakan kode kelas ke guru Anda untuk bergabung
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kode Kelas</label>
              <Input
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="Contoh: ABC123XYZ"
                className="text-center text-lg font-medium tracking-wider uppercase"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinClass()}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setShowJoinModal(false); setClassCode('') }}
              disabled={joiningClass}
            >
              Batal
            </Button>
            <Button
              onClick={handleJoinClass}
              disabled={joiningClass || !classCode.trim()}
            >
              {joiningClass ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {joiningClass ? 'Bergabung...' : 'Gabung'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Class AlertDialog */}
      <AlertDialog open={leaveDialog.open} onOpenChange={(open) => setLeaveDialog({ ...leaveDialog, open })}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari Kelas?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari kelas "{leaveDialog.className}"? Progress Anda di kelas ini akan tetap tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveClass} className="!bg-red-600 hover:!bg-red-700">
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StudentLayout>
  )
}

export default StudentClasses
