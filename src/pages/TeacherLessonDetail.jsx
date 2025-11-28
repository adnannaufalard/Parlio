import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import toast from 'react-hot-toast'

function TeacherLessonDetail() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [materials, setMaterials] = useState([])
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('materials')
  
  // Modals
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showQuestModal, setShowQuestModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editingQuest, setEditingQuest] = useState(null)

  useEffect(() => {
    fetchLesson()
    fetchMaterials()
    fetchQuests()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          chapter:chapters(*)
        `)
        .eq('id', lessonId)
        .single()

      if (error) throw error
      setLesson(data)
      setChapter(data.chapter)
    } catch (error) {
      console.error('Error fetching lesson:', error)
      toast.error('Gagal memuat lesson')
      navigate('/teacher/quest-builder')
    } finally {
      setLoading(false)
    }
  }

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('material_order', { ascending: true })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const fetchQuests = async () => {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          questions:quest_questions(count)
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuests(data || [])
    } catch (error) {
      console.error('Error fetching quests:', error)
    }
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Yakin ingin menghapus materi ini?')) return

    try {
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error
      toast.success('Materi berhasil dihapus')
      fetchMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Gagal menghapus materi')
    }
  }

  const handleDeleteQuest = async (questId) => {
    if (!confirm('Yakin ingin menghapus quest ini?')) return

    try {
      const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', questId)

      if (error) throw error
      toast.success('Quest berhasil dihapus')
      fetchQuests()
    } catch (error) {
      console.error('Error deleting quest:', error)
      toast.error('Gagal menghapus quest')
    }
  }

  if (loading || !lesson) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat lesson...</div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => navigate(`/teacher/quest-builder/chapter/${chapter.id}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke {chapter.title}
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-lg p-4 text-4xl">📖</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    Lesson {lesson.lesson_order}
                  </span>
                  {lesson.is_published ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✓ Published
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      Draft
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                <p className="text-gray-600 mt-1">{lesson.description || 'Tidak ada deskripsi'}</p>
                
                <div className="flex gap-4 mt-3 text-sm text-gray-600">
                  <span>📚 {materials.length} materials</span>
                  <span>⚔️ {quests.length} quests</span>
                  <span>⏱️ ~{lesson.estimated_duration} menit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { key: 'materials', label: 'Materi Pembelajaran', icon: '📚' },
                { key: 'quests', label: 'Quest & Tugas', icon: '⚔️' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Materi Pembelajaran</h2>
                  <button
                    onClick={() => {
                      setEditingMaterial(null)
                      setShowMaterialModal(true)
                    }}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Materi
                  </button>
                </div>

                {materials.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-3">📚</div>
                    <p className="text-gray-500 mb-4">Belum ada materi untuk lesson ini</p>
                    <button
                      onClick={() => {
                        setEditingMaterial(null)
                        setShowMaterialModal(true)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Tambah Materi Pertama
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materials.map((material) => (
                      <MaterialCard
                        key={material.id}
                        material={material}
                        onEdit={() => {
                          setEditingMaterial(material)
                          setShowMaterialModal(true)
                        }}
                        onDelete={() => handleDeleteMaterial(material.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quests Tab */}
            {activeTab === 'quests' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Quest & Tugas</h2>
                  <button
                    onClick={() => {
                      setEditingQuest(null)
                      setShowQuestModal(true)
                    }}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Quest
                  </button>
                </div>

                {quests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-3">⚔️</div>
                    <p className="text-gray-500 mb-4">Belum ada quest untuk lesson ini</p>
                    <button
                      onClick={() => {
                        setEditingQuest(null)
                        setShowQuestModal(true)
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Buat Quest Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {quests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        onEdit={() => {
                          setEditingQuest(quest)
                          setShowQuestModal(true)
                        }}
                        onDelete={() => handleDeleteQuest(quest.id)}
                        onManageQuestions={() => navigate(`/teacher/quest-builder/quest/${quest.id}/questions`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Material Modal */}
      {showMaterialModal && (
        <MaterialModal
          lessonId={lessonId}
          material={editingMaterial}
          onClose={() => {
            setShowMaterialModal(false)
            setEditingMaterial(null)
          }}
          onSuccess={() => {
            setShowMaterialModal(false)
            setEditingMaterial(null)
            fetchMaterials()
          }}
        />
      )}

      {/* Quest Modal */}
      {showQuestModal && (
        <QuestModal
          lessonId={lessonId}
          quest={editingQuest}
          onClose={() => {
            setShowQuestModal(false)
            setEditingQuest(null)
          }}
          onSuccess={() => {
            setShowQuestModal(false)
            setEditingQuest(null)
            fetchQuests()
          }}
        />
      )}
    </TeacherLayout>
  )
}

// Video Preview Component
function VideoPreview({ url }) {
  // Convert YouTube URL to embed
  const getEmbedUrl = (url) => {
    try {
      // YouTube patterns
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      const match = url.match(youtubeRegex)
      
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
      
      // If already embed or direct video URL
      if (url.includes('youtube.com/embed/') || url.includes('.mp4') || url.includes('.webm')) {
        return url
      }
      
      return url
    } catch (error) {
      return url
    }
  }

  const embedUrl = getEmbedUrl(url)
  const isYouTube = embedUrl.includes('youtube.com/embed/')

  return (
    <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
      {isYouTube ? (
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          src={embedUrl}
          controls
          className="absolute top-0 left-0 w-full h-full"
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  )
}

// Material Card Component
function MaterialCard({ material, onEdit, onDelete }) {
  const [showPreview, setShowPreview] = useState(false)
  
  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      case 'text': return '📝'
      default: return '📁'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="text-4xl">{getIcon(material.material_type)}</div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mb-2">
        {material.material_type}
      </span>
      
      <h4 className="font-semibold text-gray-900 mb-1">{material.title}</h4>
      
      {material.file_url && (
        <div className="space-y-2 mt-2">
          {material.material_type === 'video' && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showPreview ? 'Sembunyikan Video' : 'Putar Video'}
            </button>
          )}
          
          <a
            href={material.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Buka di Tab Baru
          </a>
        </div>
      )}
      
      {/* Video Preview Modal */}
      {showPreview && material.material_type === 'video' && material.file_url && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">{material.title}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <VideoPreview url={material.file_url} />
          </div>
        </div>
      )}
    </div>
  )
}

// Quest Card Component
function QuestCard({ quest, onEdit, onDelete, onManageQuestions }) {
  const questionCount = quest.questions?.[0]?.count || 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              {quest.quest_type}
            </span>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {quest.difficulty}
            </span>
            {quest.is_published ? (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Published
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                Draft
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-1">{quest.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{quest.description || 'Tidak ada deskripsi'}</p>
          
          {/* Rewards & Rules */}
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="bg-blue-50 rounded px-2 py-1.5">
              <div className="text-xs text-blue-600 font-medium">XP</div>
              <div className="font-bold text-blue-700">{quest.xp_reward}</div>
            </div>
            <div className="bg-yellow-50 rounded px-2 py-1.5">
              <div className="text-xs text-yellow-600 font-medium">Coins</div>
              <div className="font-bold text-yellow-700">{quest.coins_reward}</div>
            </div>
            <div className="bg-green-50 rounded px-2 py-1.5">
              <div className="text-xs text-green-600 font-medium">Min Score</div>
              <div className="font-bold text-green-700">{quest.min_score_to_pass}%</div>
            </div>
            <div className="bg-purple-50 rounded px-2 py-1.5">
              <div className="text-xs text-purple-600 font-medium">Questions</div>
              <div className="font-bold text-purple-700">{questionCount}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onManageQuestions}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
          >
            Kelola Soal
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Material Modal Component  
function MaterialModal({ lessonId, material, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    material_type: 'pdf',
    file_url: '',
    content: '',
    material_order: 0
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState('upload') // 'upload' or 'url'
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    if (material) {
      setForm({
        title: material.title || '',
        material_type: material.material_type || 'pdf',
        file_url: material.file_url || '',
        content: material.content || '',
        material_order: material.material_order || 0
      })
      // If editing and has file_url, set to URL mode
      if (material.file_url) {
        setUploadMethod('url')
      }
    }
  }, [material])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title if empty
      if (!form.title) {
        const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        setForm({ ...form, title: fileName })
      }
    }
  }

  const uploadFile = async (file) => {
    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `lesson-materials/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let fileUrl = form.file_url

      // If upload method and file selected, upload first
      if (uploadMethod === 'upload' && selectedFile && form.material_type !== 'text') {
        fileUrl = await uploadFile(selectedFile)
      }

      // Validate
      if (form.material_type === 'text' && !form.content) {
        toast.error('Konten text harus diisi')
        setLoading(false)
        return
      }

      if (form.material_type !== 'text' && !fileUrl) {
        toast.error('Silakan upload file atau masukkan URL')
        setLoading(false)
        return
      }

      const materialData = {
        ...form,
        file_url: form.material_type !== 'text' ? fileUrl : null
      }

      if (material) {
        // Update
        const { error } = await supabase
          .from('lesson_materials')
          .update(materialData)
          .eq('id', material.id)

        if (error) throw error
        toast.success('Materi berhasil diupdate')
      } else {
        // Create
        const { error } = await supabase
          .from('lesson_materials')
          .insert([{
            lesson_id: lessonId,
            ...materialData,
            created_by: user.id
          }])

        if (error) throw error
        toast.success('Materi berhasil ditambahkan')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving material:', error)
      toast.error(error.message || 'Gagal menyimpan materi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {material ? 'Edit Materi' : 'Tambah Materi Pembelajaran'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Materi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Video Pengantar Salutations"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Materi <span className="text-red-500">*</span>
            </label>
            <select
              value={form.material_type}
              onChange={(e) => setForm({ ...form, material_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black"
            >
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
              <option value="text">Text</option>
            </select>
          </div>

          {form.material_type !== 'text' ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                File Materi <span className="text-red-500">*</span>
              </label>
              
              {/* Upload Method Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUploadMethod('upload')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    uploadMethod === 'upload'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  📤 Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('url')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    uploadMethod === 'url'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  🔗 URL Eksternal
                </button>
              </div>

              {uploadMethod === 'upload' ? (
                <div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={
                      form.material_type === 'pdf' ? '.pdf' :
                      form.material_type === 'video' ? 'video/*' :
                      form.material_type === 'audio' ? 'audio/*' :
                      form.material_type === 'image' ? 'image/*' : '*'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black"
                    required={!material}
                  />
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ File dipilih: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  {uploading && (
                    <p className="text-sm text-blue-600 mt-2">
                      ⏳ Mengupload file...
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={form.file_url}
                    onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                    placeholder="https://... atau https://youtube.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gunakan URL eksternal (Google Drive, YouTube, dll)
                  </p>
                </div>
              )}

              {/* Preview */}
              {form.file_url && form.material_type === 'video' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview Video:</label>
                  <VideoPreview url={form.file_url} />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konten Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Tulis konten materi di sini..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : material ? 'Update Materi' : 'Tambah Materi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Quest Modal Component
function QuestModal({ lessonId, quest, onClose, onSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    quest_type: 'practice',
    question_type: 'multiple_choice', // BARU: jenis soal
    xp_reward: 50,
    coins_reward: 25,
    difficulty: 'medium',
    min_score_to_pass: 70,
    max_attempts: 3,
    time_limit_minutes: null,
    is_published: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (quest) {
      setForm({
        title: quest.title || '',
        description: quest.description || '',
        quest_type: quest.quest_type || 'practice',
        question_type: quest.question_type || 'multiple_choice',
        xp_reward: quest.xp_reward || 50,
        coins_reward: quest.coins_reward || 25,
        difficulty: quest.difficulty || 'medium',
        min_score_to_pass: quest.min_score_to_pass || 70,
        max_attempts: quest.max_attempts || 3,
        time_limit_minutes: quest.time_limit_minutes || null,
        is_published: quest.is_published || false
      })
    }
  }, [quest])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (quest) {
        // Update
        const { error } = await supabase
          .from('quests')
          .update({
            ...form,
            updated_at: new Date().toISOString()
          })
          .eq('id', quest.id)

        if (error) throw error
        toast.success('Quest berhasil diupdate')
        onSuccess()
      } else {
        // Create - dan langsung redirect ke halaman edit soal
        const { data: newQuest, error } = await supabase
          .from('quests')
          .insert([{
            lesson_id: lessonId,
            ...form,
            created_by: user.id
          }])
          .select()
          .single()

        if (error) throw error
        
        toast.success('Quest berhasil dibuat! Sekarang tambahkan soal-soal.')
        
        // REDIRECT langsung ke halaman kelola soal
        navigate(`/teacher/quest-builder/quest/${newQuest.id}/questions`)
      }
    } catch (error) {
      console.error('Error saving quest:', error)
      toast.error('Gagal menyimpan quest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {quest ? 'Edit Quest' : 'Buat Quest (Tantangan)'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Quest <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Quiz Salutations"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Quest
              </label>
              <select
                value={form.quest_type}
                onChange={(e) => setForm({ ...form, quest_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              >
                <option value="practice">Practice (Latihan)</option>
                <option value="daily_task">Daily Task</option>
                <option value="chapter_exam">Chapter Exam</option>
                <option value="boss_battle">Boss Battle</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Jelaskan quest ini..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
            />
          </div>

          {/* Jenis Soal - BARU */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">📝 Jenis Soal</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'multiple_choice', label: '✅ Pilihan Ganda', icon: '☑️' },
                { value: 'essay', label: '📝 Essay', icon: '✍️' },
                { value: 'matching', label: '🔗 Menjodohkan', icon: '🔀' },
                { value: 'arrange_sentence', label: '📋 Menyusun Kalimat', icon: '🔢' },
                { value: 'listening', label: '🎧 Latihan Mendengarkan', icon: '👂' }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, question_type: type.value })}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    form.question_type === type.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rewards & Rules */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">⚙️ Rules & Rewards</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  XP Reward (per soal) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.xp_reward}
                  onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">XP yang didapat per soal benar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coins Reward (per soal) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.coins_reward}
                  onChange={(e) => setForm({ ...form, coins_reward: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Coins yang didapat per soal benar</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Score to Pass (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.min_score_to_pass}
                  onChange={(e) => setForm({ ...form, min_score_to_pass: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_attempts}
                  onChange={(e) => setForm({ ...form, max_attempts: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (menit)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.time_limit_minutes || ''}
                  onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Kosongkan = unlimited"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Catatan:</strong> XP dan Coins dihitung per soal yang dijawab benar. Total reward = jumlah soal benar × nilai reward.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published_quest"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_published_quest" className="text-sm font-medium text-gray-700">
              Publish quest (siswa dapat melihat)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : quest ? 'Update Quest' : 'Buat Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherLessonDetail

