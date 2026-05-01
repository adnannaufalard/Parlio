import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import MultiMediaManager from '../components/MultiMediaManager'
import MediaGallery, { mergeLegacyMedia } from '../components/MediaGallery'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

function TeacherLessonDetail() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [materials, setMaterials] = useState([])
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(true)

  // Tab state
  const [activeTab, setActiveTab] = useState('materi')

  // Modals
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showQuestModal, setShowQuestModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [editingQuest, setEditingQuest] = useState(null)

  useEffect(() => {
    fetchLessonData()
  }, [lessonId])

  const fetchLessonData = async () => {
    try {
      setLoading(true)

      // Fetch lesson with chapter
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          chapter:chapters(*)
        `)
        .eq('id', lessonId)
        .single()

      if (lessonError) throw lessonError
      setLesson(lessonData)
      setChapter(lessonData.chapter)

      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('material_order', { ascending: true })

      if (materialsError) throw materialsError
      setMaterials(materialsData || [])

      // Fetch quests for this lesson with material info and question count
      const { data: questsData, error: questsError } = await supabase
        .from('quests')
        .select(`
          *,
          questions:quest_questions(count),
          material:lesson_materials(id, title, material_type)
        `)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true })

      if (questsError) throw questsError
      setQuests(questsData || [])

    } catch (error) {
      console.error('Error fetching lesson data:', error)
      toast.error('Gagal memuat data')
      navigate('/teacher/quest-builder')
    } finally {
      setLoading(false)
    }
  }

  // Material Handlers
  const handleCreateMaterial = () => {
    setEditingMaterial(null)
    setShowMaterialModal(true)
  }

  const handleEditMaterial = (material) => {
    setEditingMaterial(material)
    setShowMaterialModal(true)
  }

  const handleDeleteMaterial = async (materialId) => {
    // Check if any quest uses this material
    const questsUsingMaterial = quests.filter(q => q.material_id === materialId)
    if (questsUsingMaterial.length > 0) {
      toast.error(`Tidak bisa hapus! Ada ${questsUsingMaterial.length} quest yang menggunakan materi ini.`)
      return
    }

    if (!confirm('Yakin ingin menghapus materi ini?')) return

    try {
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error
      toast.success('Materi berhasil dihapus')
      fetchLessonData()
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Gagal menghapus materi')
    }
  }

  // Quest Handlers
  const handleCreateQuest = () => {
    if (materials.length === 0) {
      toast.error('Buat materi terlebih dahulu sebelum membuat quest!')
      setActiveTab('materi')
      return
    }
    setEditingQuest(null)
    setShowQuestModal(true)
  }

  const handleEditQuest = (quest) => {
    setEditingQuest(quest)
    setShowQuestModal(true)
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
      fetchLessonData()
    } catch (error) {
      console.error('Error deleting quest:', error)
      toast.error('Gagal menghapus quest')
    }
  }

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

  if (loading || !lesson) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-24 h-24">
            <DotLottieReact
              src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
              loop
              autoplay
            />
          </div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header Back & Breadcrumbs */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/teacher/quest-builder/chapter/${chapter.id}`)}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wide text-gray-400 font-['Poppins']">
              <span>Quest Builder</span>
              <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span>Bab {chapter.floor_number}</span>
              <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-[#4f46e5] truncate max-w-[150px]">Sub Bab {lesson.lesson_order}</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 font-['Poppins'] mb-3 tracking-tight leading-tight">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-xs sm:text-sm text-gray-600 font-['Poppins'] leading-relaxed max-w-4xl">
                {lesson.description}
              </p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('materi')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${activeTab === 'materi'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">📚</span>
                <span className="font-semibold font-['Poppins'] text-sm">Materi</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === 'materi' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {materials.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('quest')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${activeTab === 'quest'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="font-semibold font-['Poppins'] text-sm">Quest</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${activeTab === 'quest' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {quests.length}
                </span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'materi' ? (
              <MaterialsTab
                materials={materials}
                quests={quests}
                onAdd={handleCreateMaterial}
                onEdit={handleEditMaterial}
                onDelete={handleDeleteMaterial}
                getIcon={getIcon}
              />
            ) : (
              <QuestsTab
                quests={quests}
                materials={materials}
                onAdd={handleCreateQuest}
                onEdit={handleEditQuest}
                onDelete={handleDeleteQuest}
                getIcon={getIcon}
                navigate={navigate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Material Modal */}
      {showMaterialModal && (
        <MaterialModal
          lessonId={lessonId}
          material={editingMaterial}
          materialsCount={materials.length}
          onClose={() => {
            setShowMaterialModal(false)
            setEditingMaterial(null)
          }}
          onSuccess={() => {
            setShowMaterialModal(false)
            setEditingMaterial(null)
            fetchLessonData()
          }}
        />
      )}

      {/* Quest Modal */}
      {showQuestModal && (
        <QuestModal
          lessonId={lessonId}
          materials={materials}
          quest={editingQuest}
          onClose={() => {
            setShowQuestModal(false)
            setEditingQuest(null)
          }}
          onSuccess={() => {
            setShowQuestModal(false)
            setEditingQuest(null)
            fetchLessonData()
          }}
        />
      )}
    </TeacherLayout>
  )
}

// Material Preview Modal Component
function MaterialPreviewModal({ material, onClose, getIcon }) {
  if (!material) return null

  // Merge legacy file_url + media_files for display
  const allMedia = mergeLegacyMedia(material, { file_url: 'file_url' })

  // For text type, also show content
  const isText = material.material_type === 'text'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
              {getIcon(material.material_type)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{material.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase">{material.material_type}</span>
                {allMedia.length > 1 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    📎 {allMedia.length} file
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
          {/* Description */}
          {material.description && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Penjelasan Guru
              </h3>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">{material.description}</p>
            </div>
          )}

          {/* Text content */}
          {isText && material.content && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Konten Materi</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {material.content}
                </div>
              </div>
            </div>
          )}

          {/* Media Preview - using MediaGallery */}
          {allMedia.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {isText ? 'Media Pendukung' : 'Preview Materi'}
                {allMedia.length > 1 && ` (${allMedia.length} file)`}
              </h3>
              <MediaGallery mediaFiles={allMedia} />
            </div>
          )}

          {/* Fallback if no content */}
          {!isText && allMedia.length === 0 && (
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <div className="text-5xl mb-3">{getIcon(material.material_type)}</div>
              <p className="text-gray-600 text-sm">Tidak ada preview tersedia</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

// Materials Tab Component
function MaterialsTab({ materials, quests, onAdd, onEdit, onDelete, getIcon }) {
  const [previewMaterial, setPreviewMaterial] = useState(null)

  // Get quest count for each material
  const getQuestCount = (materialId) => {
    return quests.filter(q => q.material_id === materialId).length
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1 mb-2">
        <h2 className="text-base font-semibold text-gray-900 font-['Poppins']">Daftar Materi</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-xs font-semibold font-['Poppins']"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Materi
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-200">
          <div className="w-40 h-40 mx-auto mb-4">
            <DotLottieReact
              src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
              loop
              autoplay
            />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Materi</h4>
          <p className="text-gray-600 mb-4">Buat materi pertama untuk sub bab ini</p>
          <button
            onClick={onAdd}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Tambah Materi Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material, idx) => (
            <div
              key={material.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition hover:border-indigo-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-semibold text-lg flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 pr-4">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 font-['Poppins'] truncate">{material.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 font-['Poppins'] flex-wrap">
                      <span className="text-[10px] font-semibold tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                        {material.material_type}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500 font-medium">
                        {getQuestCount(material.id)} Quest
                      </span>
                      <button
                        onClick={() => setPreviewMaterial(material)}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Lihat Materi
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(material)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Materi"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(material.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Hapus Materi"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewMaterial && (
        <MaterialPreviewModal
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          getIcon={getIcon}
        />
      )}
    </div>
  )
}

// Quests Tab Component
function QuestsTab({ quests, materials, onAdd, onEdit, onDelete, getIcon, navigate }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1 mb-2">
        <h2 className="text-base font-semibold text-gray-900 font-['Poppins']">Daftar Quest</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-[#4f46e5] text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-xs font-semibold font-['Poppins']"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Quest
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h4 className="font-semibold text-yellow-800 mb-2">Buat Materi Terlebih Dahulu</h4>
          <p className="text-sm text-yellow-700">
            Anda harus membuat minimal 1 materi sebelum bisa membuat quest.
          </p>
        </div>
      ) : quests.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-200">
          <div className="w-40 h-40 mx-auto mb-4">
            <DotLottieReact
              src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
              loop
              autoplay
            />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Quest</h4>
          <p className="text-gray-600 mb-4">Buat quest pertama untuk sub bab ini</p>
          <button
            onClick={onAdd}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Tambah Quest Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {quests.map((quest, idx) => (
            <div
              key={quest.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition hover:border-indigo-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-semibold text-lg flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-2 font-['Poppins']">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{quest.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${quest.is_published
                        ? 'bg-green-50 text-green-600'
                        : 'bg-yellow-50 text-yellow-600'
                        }`}>
                        {quest.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-gray-500 font-['Poppins']">
                      {/* Material Info */}
                      {quest.material && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 flex items-center gap-1 uppercase tracking-wide font-semibold">
                          {getIcon(quest.material.material_type)} {quest.material.title}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-600 uppercase tracking-wide font-semibold">{quest.quest_type}</span>
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 uppercase tracking-wide font-semibold">{quest.difficulty}</span>
                      <span className="flex items-center gap-1 text-amber-600 font-semibold ml-1">+{quest.xp_reward} XP</span>
                      <span className="flex items-center gap-1 text-yellow-600 font-semibold ml-1">+{quest.coins_reward} 🪙</span>
                      <span className="flex items-center gap-1 text-gray-600 font-semibold ml-1">{quest.questions?.[0]?.count || 0} soal</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/teacher/quest-builder/quest/${quest.id}/questions`)}
                    className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition"
                  >
                    Kelola Soal
                  </button>
                  <button
                    onClick={() => onEdit(quest)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Quest"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(quest.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Hapus Quest"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Video Preview Component
function VideoPreview({ url }) {
  const getEmbedUrl = (url) => {
    try {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      const match = url.match(youtubeRegex)

      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }

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

// Material Modal Component  
function MaterialModal({ lessonId, material, materialsCount, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    material_type: 'video',
    content: '',
    material_order: materialsCount + 1
  })
  const [mediaFiles, setMediaFiles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (material) {
      setForm({
        title: material.title || '',
        description: material.description || '',
        material_type: material.material_type || 'video',
        content: material.content || '',
        material_order: material.material_order || 1
      })
      // Load existing media: merge legacy file_url + media_files
      const existing = []
      if (material.file_url) {
        existing.push({
          type: material.material_type || 'link',
          url: material.file_url,
          name: material.title || 'Media',
          source: 'legacy'
        })
      }
      const mf = Array.isArray(material.media_files) ? material.media_files : []
      const existingUrls = new Set(existing.map(m => m.url))
      mf.forEach(m => { if (!existingUrls.has(m.url)) existing.push(m) })
      setMediaFiles(existing)
    }
  }, [material])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (form.material_type === 'text' && !form.content) {
        toast.error('Konten text harus diisi')
        setLoading(false)
        return
      }

      if (form.material_type !== 'text' && mediaFiles.length === 0) {
        toast.error('Tambahkan minimal 1 file media')
        setLoading(false)
        return
      }

      // Use first media file as legacy file_url for backward compatibility
      const legacyFileUrl = form.material_type !== 'text' && mediaFiles.length > 0
        ? mediaFiles[0].url
        : null

      const materialData = {
        title: form.title,
        description: form.description,
        material_type: form.material_type,
        content: form.content,
        material_order: form.material_order,
        file_url: legacyFileUrl,
        media_files: mediaFiles
      }

      if (material) {
        const { error } = await supabase
          .from('lesson_materials')
          .update(materialData)
          .eq('id', material.id)

        if (error) {
          console.error('Material update error:', error)
          throw error
        }
        toast.success('Materi berhasil diupdate')
      } else {
        const { error } = await supabase
          .from('lesson_materials')
          .insert([{
            lesson_id: lessonId,
            ...materialData,
            created_by: user.id
          }])

        if (error) {
          console.error('Material insert error:', error)
          throw error
        }
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
          <h2 className="text-xl font-bold text-gray-900">
            {material ? 'Edit Materi' : 'Tambah Materi'}
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
              placeholder="Contoh: Video Pengenalan Vocabulary"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi / Penjelasan Guru
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tulis penjelasan atau instruksi untuk siswa tentang materi ini..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black"
            />
            <p className="text-xs text-gray-500 mt-1">Opsional. Bisa berisi instruksi, penjelasan tambahan, atau catatan untuk siswa.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Materi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'video', icon: '🎥', label: 'Video' },
                { value: 'pdf', icon: '📄', label: 'PDF' },
                { value: 'audio', icon: '🎵', label: 'Audio' },
                { value: 'image', icon: '🖼️', label: 'Image' },
                { value: 'text', icon: '📝', label: 'Text' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, material_type: type.value })}
                  className={`p-3 rounded-lg border-2 text-center transition ${form.material_type === type.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                    }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {form.material_type !== 'text' ? (
            <MultiMediaManager
              mediaFiles={mediaFiles}
              onChange={setMediaFiles}
              maxFiles={10}
              bucket="materials"
              folder="lesson-materials"
              label={`File Materi (${form.material_type})`}
              acceptTypes={
                form.material_type === 'pdf' ? '.pdf' :
                  form.material_type === 'video' ? 'video/*' :
                    form.material_type === 'audio' ? 'audio/*' :
                      form.material_type === 'image' ? 'image/*' :
                        'image/*,audio/*,video/*,.pdf'
              }
            />
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

          {/* Optional: additional media for text type too */}
          {form.material_type === 'text' && (
            <MultiMediaManager
              mediaFiles={mediaFiles}
              onChange={setMediaFiles}
              maxFiles={10}
              bucket="materials"
              folder="lesson-materials"
              label="Media Pendukung (Opsional)"
              acceptTypes="image/*,audio/*,video/*,.pdf"
            />
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
              {loading ? 'Menyimpan...' : material ? 'Update' : 'Tambah Materi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Quest Modal Component
function QuestModal({ lessonId, materials, quest, onClose, onSuccess }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    material_id: materials.length > 0 ? materials[0].id : null,
    quest_type: 'practice',
    question_type: 'multiple_choice',
    xp_reward: 10,
    coins_reward: 5,
    poin_per_soal: 10,
    difficulty: 'easy',
    min_score_to_pass: 60,
    max_attempts: 0,
    time_limit_minutes: null,
    is_published: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (quest) {
      setForm({
        title: quest.title || '',
        description: quest.description || '',
        material_id: quest.material_id || (materials.length > 0 ? materials[0].id : null),
        quest_type: quest.quest_type || 'practice',
        question_type: quest.question_type || 'multiple_choice',
        xp_reward: quest.xp_reward || 10,
        coins_reward: quest.coins_reward || 5,
        poin_per_soal: quest.poin_per_soal || 10,
        difficulty: quest.difficulty || 'easy',
        min_score_to_pass: quest.min_score_to_pass || 60,
        max_attempts: quest.max_attempts ?? 0,
        time_limit_minutes: quest.time_limit_minutes || null,
        is_published: quest.is_published || false
      })
    }
  }, [quest, materials])

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.material_id) {
      toast.error('Pilih materi untuk quest ini!')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (quest) {
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

        toast.success('Quest berhasil dibuat!')
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {quest ? 'Edit Quest' : 'Buat Quest Baru'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Material Selection - NEW */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Materi <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Quest ini akan dikaitkan dengan materi yang dipilih. Siswa harus menyelesaikan materi sebelum mengerjakan quest.
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              {materials.map((material) => (
                <label
                  key={material.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${form.material_id === material.id
                    ? 'bg-green-50 border-2 border-green-500'
                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="material_id"
                    value={material.id}
                    checked={form.material_id === material.id}
                    onChange={(e) => setForm({ ...form, material_id: parseInt(e.target.value) })}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xl">{getIcon(material.material_type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{material.title}</p>
                    <p className="text-xs text-gray-500 uppercase">{material.material_type}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Quest <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Quiz Vocabulary Dasar"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              required
            />
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

          {/* Quest Type & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Quest</label>
              <select
                value={form.quest_type}
                onChange={(e) => setForm({ ...form, quest_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              >
                <option value="practice">Practice</option>
                <option value="daily_task">Daily Task</option>
                <option value="chapter_exam">Chapter Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
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

          {/* Rewards */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">XP per Soal Benar</label>
              <input
                type="number"
                min="1"
                value={form.xp_reward}
                onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Coins per Soal Benar</label>
              <input
                type="number"
                min="1"
                value={form.coins_reward}
                onChange={(e) => setForm({ ...form, coins_reward: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              />
            </div>
          </div>

          {/* Rules */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poin per Soal</label>
              <input
                type="number"
                min="1"
                value={form.poin_per_soal}
                onChange={(e) => setForm({ ...form, poin_per_soal: parseInt(e.target.value) || 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Nilai = benar × poin</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimal Nilai Lulus (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.min_score_to_pass}
                onChange={(e) => setForm({ ...form, min_score_to_pass: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              />
              <p className="text-xs text-gray-500 mt-1">Persentase nilai untuk lulus (0-100)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max. Percobaan</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.max_attempts === 0}
                    onChange={(e) => setForm({ ...form, max_attempts: e.target.checked ? 0 : 3 })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600">Tidak dibatasi (unlimited)</span>
                </label>
                {form.max_attempts !== 0 && (
                  <input
                    type="number"
                    min="1"
                    value={form.max_attempts}
                    onChange={(e) => setForm({ ...form, max_attempts: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                  />
                )}
                <p className="text-xs text-gray-500">
                  {form.max_attempts === 0
                    ? 'Siswa bisa mengulang quest terus-menerus. Nilai terbaik yang diambil.'
                    : `Siswa bisa mengerjakan maksimal ${form.max_attempts}x. Nilai terbaik yang diambil.`}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batas Waktu (menit)</label>
              <input
                type="number"
                min="1"
                value={form.time_limit_minutes || ''}
                onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Tanpa batas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              />
            </div>
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
              {loading ? 'Menyimpan...' : quest ? 'Update Quest' : 'Buat & Tambah Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeacherLessonDetail
