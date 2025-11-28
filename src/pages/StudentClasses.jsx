import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import toast from 'react-hot-toast'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

function StudentClasses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [myClasses, setMyClasses] = useState([])
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [joiningClass, setJoiningClass] = useState(false)

  useEffect(() => {
    fetchMyClasses()
  }, [])

  const fetchMyClasses = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

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
      toast.error('Gagal memuat kelas')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      toast.error('Masukkan kode kelas')
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
          toast.error('Tidak dapat mengakses data kelas. Hubungi administrator.')
          console.error('⚠️ RLS Policy Error: Table classes mungkin butuh policy untuk SELECT')
        } else if (classError.code === '42703') {
          toast.error('Column class_code tidak ditemukan di database')
          console.error('⚠️ Schema Error: Column class_code tidak ada di table classes')
        } else {
          toast.error(`Error: ${classError.message}`)
        }
        return
      }

      if (!classData) {
        toast.error('Kode kelas tidak ditemukan')
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
        toast.error('Anda sudah bergabung di kelas ini')
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
          toast.error('Tidak dapat bergabung ke kelas. Hubungi administrator.')
          console.error('⚠️ RLS Policy Error: Table class_members butuh policy untuk INSERT')
        } else if (joinError.code === '23505') {
          toast.error('Anda sudah bergabung di kelas ini')
        } else {
          toast.error(`Gagal bergabung: ${joinError.message}`)
        }
        return
      }

      toast.success(`Berhasil bergabung ke kelas "${classData.class_name}"! 🎉`)
      setShowJoinModal(false)
      setClassCode('')
      
      // Navigate to class chapters page
      navigate(`/student/class/${classData.id}`)
    } catch (error) {
      console.error('Error joining class:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setJoiningClass(false)
    }
  }

  const handleLeaveClass = async (classId, className) => {
    if (!confirm(`Apakah Anda yakin ingin keluar dari kelas "${className}"?`)) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', user.id)

      if (error) {
        toast.error('Gagal keluar dari kelas')
        return
      }

      toast.success('Berhasil keluar dari kelas')
      fetchMyClasses()
    } catch (error) {
      console.error('Error leaving class:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <StudentLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Memuat kelas...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 via-white to-red-500 rounded-2xl shadow-sm p-[2px] mb-6">
        <div className="bg-white rounded-[14px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-1 font-['Poppins']">Kelas Saya 📚</h1>
              <p className="text-sm text-gray-500 font-['Poppins']">Kelola kelas bahasa Prancis Anda</p>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm hover:shadow-md px-4 py-2.5 flex items-center gap-2 transition-all duration-200 font-['Poppins']"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium text-sm">Gabung Kelas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-5">
        {/* My Classes */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-800 px-1 font-['Poppins']">Daftar Kelas ({myClasses.length})</h2>
          
          {myClasses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <div className="w-64 h-64 mx-auto mb-4">
                <DotLottieReact
                  src="https://lottie.host/408beb9d-77b8-4033-bdbe-0d29b68cc833/vzZ2BVnm49.lottie"
                  loop
                  autoplay
                />
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-2 font-['Poppins']">Belum Ada Kelas</h3>
              <p className="text-sm text-gray-500 font-['Poppins']">
                Klik tombol "Gabung Kelas Baru" di atas untuk bergabung dengan kelas menggunakan kode dari guru Anda
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClasses.map((classItem) => (
                <div 
                  key={classItem.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 font-['Poppins']">{classItem.class_name}</h3>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-['Poppins']">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-600">{classItem.teacher?.full_name || 'Guru'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-gray-600">{classItem.studentCount} siswa</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-gray-600">{classItem.chapterCount} chapter</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium font-['Poppins'] border border-blue-100">
                          Kode: {classItem.class_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => navigate(`/student/class/${classItem.id}`)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors font-['Poppins']"
                    >
                      Lihat Chapter
                    </button>
                    <button
                      onClick={() => handleLeaveClass(classItem.id, classItem.class_name)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors border border-red-100 font-['Poppins']"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-800 font-['Poppins']">Gabung Kelas Baru</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false)
                  setClassCode('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-700 font-['Poppins']">
                    Masukkan kode kelas yang diberikan oleh guru Anda untuk bergabung ke kelas
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2 font-['Poppins']">
                Kode Kelas
              </label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="Contoh: ABC123XYZ"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-medium tracking-wider uppercase font-['Poppins'] transition-all"
                maxLength={20}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinClass()
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-2 font-['Poppins']">
                Kode kelas biasanya terdiri dari kombinasi huruf dan angka
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(false)
                  setClassCode('')
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition-colors font-['Poppins']"
                disabled={joiningClass}
              >
                Batal
              </button>
              <button
                onClick={handleJoinClass}
                disabled={joiningClass || !classCode.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-['Poppins']"
              >
                {joiningClass ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Bergabung...
                  </span>
                ) : (
                  'Gabung Sekarang'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  )
}

export default StudentClasses
