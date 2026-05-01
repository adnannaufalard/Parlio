import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { uploadQuestMedia, deleteQuestMedia, validateFile, getFileTypeFromMime } from '../lib/uploadHelper'
import TeacherLayout from '../components/TeacherLayout'
import MultiMediaManager from '../components/MultiMediaManager'
import MediaGallery, { mergeLegacyMedia, OptionMedia } from '../components/MediaGallery'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

function TeacherQuestQuestions() {
  const { questId } = useParams()
  const navigate = useNavigate()
  const [quest, setQuest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

  useEffect(() => {
    fetchQuest()
    fetchQuestions()
  }, [questId])

  const fetchQuest = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          lesson:lessons(
            *,
            chapter:chapters(*)
          )
        `)
        .eq('id', questId)
        .single()

      if (error) throw error
      setQuest(data)
    } catch (error) {
      console.error('Error fetching quest:', error)
      toast.error('Gagal memuat quest')
      navigate('/teacher/quest-builder')
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quest_questions')
        .select(`
          *,
          question:questions(*)
        `)
        .eq('quest_id', questId)
        .order('question_order', { ascending: true })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return

    try {
      const { error } = await supabase
        .from('quest_questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error
      toast.success('Soal berhasil dihapus')
      fetchQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Gagal menghapus soal')
    }
  }

  if (loading || !quest) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat quest...</div>
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
            onClick={() => navigate(`/teacher/quest-builder/lesson/${quest.lesson.id}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke {quest.lesson.title}
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-purple-100 rounded-lg p-4 text-4xl">⚔️</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                    {quest.quest_type}
                  </span>
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {quest.difficulty}
                  </span>
                  {quest.is_published ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✓ Published
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      Draft
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{quest.title}</h1>
                <p className="text-gray-600 mt-1">{quest.description || 'Tidak ada deskripsi'}</p>
                
                <div className="flex gap-4 mt-3 text-sm text-gray-600">
                  <span>💯 {quest.xp_reward} XP per soal</span>
                  <span>🪙 {quest.coins_reward} coins per soal</span>
                  <span>📝 {questions.length} soal</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Type Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {quest.question_type === 'multiple_choice' && '☑️'}
              {quest.question_type === 'essay' && '✍️'}
              {quest.question_type === 'matching' && '🔀'}
              {quest.question_type === 'arrange_sentence' && '🔢'}
              {quest.question_type === 'listening' && '👂'}
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">
                Jenis Soal: {
                  quest.question_type === 'multiple_choice' ? 'Pilihan Ganda' :
                  quest.question_type === 'essay' ? 'Essay' :
                  quest.question_type === 'matching' ? 'Menjodohkan' :
                  quest.question_type === 'arrange_sentence' ? 'Menyusun Kalimat' :
                  quest.question_type === 'listening' ? 'Latihan Mendengarkan' : 'Unknown'
                }
              </h3>
              <p className="text-sm text-purple-700">
                {quest.question_type === 'multiple_choice' && 'Siswa memilih satu jawaban dari beberapa pilihan'}
                {quest.question_type === 'essay' && 'Siswa menulis jawaban dalam bentuk teks panjang'}
                {quest.question_type === 'matching' && 'Siswa mencocokkan item dari dua kolom'}
                {quest.question_type === 'arrange_sentence' && 'Siswa menyusun kata/kalimat menjadi urutan yang benar'}
                {quest.question_type === 'listening' && 'Siswa mendengarkan audio dan menjawab pertanyaan'}
              </p>
            </div>
          </div>
        </div>

        {/* Quest Rules & Rewards */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎁</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Aturan & Reward Quest</h3>
              
              {/* Reward Info */}
              <div className="space-y-1 mb-3">
                <p className="text-sm text-blue-700">
                  🏆 Setiap soal yang dijawab benar: <strong>+{quest.xp_reward} XP</strong> dan <strong>+{quest.coins_reward} Coins</strong>
                </p>
                <p className="text-xs text-blue-600">
                  💡 Total reward = jumlah soal benar × ({quest.xp_reward} XP + {quest.coins_reward} Coins)
                </p>
              </div>

              {/* Quest Rules */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-700 border-t border-blue-200 pt-3">
                <div className="flex items-center gap-2">
                  <span>⏱️</span>
                  <span><strong>Waktu:</strong> {quest.time_limit_minutes ? `${quest.time_limit_minutes} menit` : 'Tidak dibatasi'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  <span><strong>Min. Score:</strong> {quest.min_score_to_pass}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔄</span>
                  <span><strong>Max. Percobaan:</strong> {quest.max_attempts}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Daftar Soal</h2>
            <button
              onClick={() => {
                setEditingQuestion(null)
                setShowQuestionModal(true)
              }}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Soal
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="w-40 h-40 mx-auto mb-4">
                <DotLottieReact
                  src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                  loop
                  autoplay
                />
              </div>
              <p className="text-gray-500 mb-4">Belum ada soal untuk quest ini</p>
              <button
                onClick={() => {
                  setEditingQuestion(null)
                  setShowQuestionModal(true)
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Tambah Soal Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((item, index) => (
                <QuestionCard
                  key={item.id}
                  question={item}
                  index={index}
                  questionType={quest.question_type}
                  onEdit={() => {
                    setEditingQuestion(item)
                    setShowQuestionModal(true)
                  }}
                  onDelete={() => handleDeleteQuestion(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <QuestionModal
          questId={questId}
          questionType={quest.question_type}
          question={editingQuestion}
          questionOrder={questions.length + 1}
          onClose={() => {
            setShowQuestionModal(false)
            setEditingQuestion(null)
          }}
          onSuccess={() => {
            setShowQuestionModal(false)
            setEditingQuestion(null)
            fetchQuestions()
          }}
        />
      )}
    </TeacherLayout>
  )
}

// Question Card Component
function QuestionCard({ question, index, questionType, onEdit, onDelete }) {
  // Merge legacy + media_files for display
  const q = question.question || {}
  const allMedia = mergeLegacyMedia(q, {
    question_image_url: 'question_image_url',
    question_audio_url: 'question_audio_url',
    question_video_url: 'question_video_url'
  })

  // Parse options
  let parsedOptions = []
  try {
    if (q.options) {
      parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }
  } catch {}

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              Soal #{index + 1}
            </span>
            {allMedia.length > 0 && (
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                📎 {allMedia.length} media
              </span>
            )}
          </div>
          
          <p className="text-gray-900 font-medium mb-2">{q.question_text || 'No question text'}</p>
          
          {/* Media Preview */}
          {allMedia.length > 0 && (
            <div className="mb-2">
              <MediaGallery mediaFiles={allMedia} compact />
            </div>
          )}
          
          {/* Preview based on question type */}
          {questionType === 'multiple_choice' && parsedOptions.length > 0 && (
            <div className="text-sm text-gray-600 space-y-1 mt-2">
              {parsedOptions.map((opt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={opt.is_correct ? 'text-green-600 font-medium' : ''}>
                    {String.fromCharCode(65 + i)}. {opt.text}
                    {opt.is_correct && ' ✓'}
                  </span>
                  {opt.media && opt.media.length > 0 && (
                    <OptionMedia mediaFiles={opt.media} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-4">
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

// Question Modal Component
function QuestionModal({ questId, questionType, question, questionOrder, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [form, setForm] = useState({
    question_text: '',
    // Multiple choice
    options: [
      { text: '', is_correct: false, media: [] },
      { text: '', is_correct: false, media: [] },
      { text: '', is_correct: false, media: [] },
      { text: '', is_correct: false, media: [] }
    ],
    // Essay
    essay_answer: '',
    // Matching
    pairs: [
      { left: '', right: '' },
      { left: '', right: '' }
    ],
    // Arrange sentence
    correct_order: [],
    scrambled_words: '',
    // Listening
    audio_url: '',
    listening_answer: ''
  })
  const [mediaFiles, setMediaFiles] = useState([])

  useEffect(() => {
    if (question?.question) {
      const q = question.question
      // Parse options with media support
      let parsedOptions = form.options
      if (q.options) {
        const rawOpts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        parsedOptions = rawOpts.map(o => ({ text: o.text || '', is_correct: o.is_correct || false, media: o.media || [] }))
      }
      setForm({
        question_text: q.question_text || '',
        options: parsedOptions,
        essay_answer: q.correct_answer || '',
        pairs: q.pairs ? JSON.parse(q.pairs) : form.pairs,
        correct_order: q.correct_order ? JSON.parse(q.correct_order) : [],
        scrambled_words: q.scrambled_words || '',
        audio_url: q.audio_url || '',
        listening_answer: q.correct_answer || ''
      })
      // Load media: merge legacy fields + media_files
      const existingMedia = []
      if (q.question_image_url) existingMedia.push({ type: 'image', url: q.question_image_url, name: 'Image', source: 'legacy' })
      if (q.question_audio_url) existingMedia.push({ type: 'audio', url: q.question_audio_url, name: 'Audio', source: 'legacy' })
      if (q.question_video_url) existingMedia.push({ type: 'video', url: q.question_video_url, name: 'Video', source: 'legacy' })
      const mf = Array.isArray(q.media_files) ? q.media_files : []
      const urls = new Set(existingMedia.map(m => m.url))
      mf.forEach(m => { if (!urls.has(m.url)) existingMedia.push(m) })
      setMediaFiles(existingMedia)
    }
  }, [question])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Prepare question data based on type
      let questionData = {
        question_text: form.question_text,
        question_type: questionType,
        // Legacy fields from mediaFiles for backward compat
        question_image_url: mediaFiles.find(m => m.type === 'image')?.url || null,
        question_audio_url: mediaFiles.find(m => m.type === 'audio')?.url || null,
        question_video_url: mediaFiles.find(m => m.type === 'video')?.url || null,
      }

      // Add type-specific data
      if (questionType === 'multiple_choice') {
        questionData.options = JSON.stringify(form.options)
        questionData.correct_answer = form.options.find(opt => opt.is_correct)?.text || ''
      } else if (questionType === 'essay') {
        questionData.correct_answer = form.essay_answer
      } else if (questionType === 'matching') {
        questionData.pairs = JSON.stringify(form.pairs)
      } else if (questionType === 'arrange_sentence') {
        questionData.correct_order = JSON.stringify(form.correct_order)
        questionData.scrambled_words = form.scrambled_words
      } else if (questionType === 'listening') {
        questionData.audio_url = form.audio_url
        questionData.correct_answer = form.listening_answer
      }

      // Save question with all fields including media_files
      questionData.media_files = mediaFiles

      if (question) {
        // Update existing question — do NOT send created_by (RLS blocks if different user)
        const { data: updated, error: qError } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', question.question_id)
          .select()

        if (qError) {
          console.error('Update error:', qError)
          throw qError
        }
        if (!updated || updated.length === 0) {
          console.warn('Update returned 0 rows — possible RLS issue')
          toast.error('Gagal update: kemungkinan tidak punya akses ke soal ini')
          return
        }
        toast.success('Soal berhasil diupdate')
      } else {
        // Create new question — include created_by only on insert
        questionData.created_by = user.id
        const { data: newQuestion, error: qError } = await supabase
          .from('questions')
          .insert([questionData])
          .select()
          .single()

        if (qError) {
          console.error('Insert error:', qError)
          throw qError
        }

        // Link to quest
        const { error: qqError } = await supabase
          .from('quest_questions')
          .insert([{
            quest_id: questId,
            question_id: newQuestion.id,
            question_order: questionOrder
          }])

        if (qqError) throw qqError

        toast.success('Soal berhasil ditambahkan')
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving question:', error)
      toast.error('Gagal menyimpan soal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {question ? 'Edit Soal' : 'Tambah Soal Baru'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pertanyaan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.question_text}
              onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              placeholder="Tulis pertanyaan di sini..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              required
            />
          </div>

          {/* Media Upload Section */}
          <div className="border-t pt-4">
            <MultiMediaManager
              mediaFiles={mediaFiles}
              onChange={setMediaFiles}
              maxFiles={5}
              bucket="quest-media"
              folder="images"
              label="Media Pendukung (Opsional)"
              acceptTypes="image/*,audio/*,video/*"
            />
          </div>



          {/* Type-specific fields */}
          {questionType === 'multiple_choice' && (
            <MultipleChoiceFields form={form} setForm={setForm} />
          )}

          {questionType === 'essay' && (
            <EssayFields form={form} setForm={setForm} />
          )}

          {questionType === 'matching' && (
            <MatchingFields form={form} setForm={setForm} />
          )}

          {questionType === 'arrange_sentence' && (
            <ArrangeSentenceFields form={form} setForm={setForm} />
          )}

          {questionType === 'listening' && (
            <ListeningFields form={form} setForm={setForm} />
          )}

          {/* Submit buttons */}
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
              {loading ? 'Menyimpan...' : question ? 'Update Soal' : 'Tambah Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Multiple Choice Fields Component
function MultipleChoiceFields({ form, setForm }) {
  const updateOption = (index, field, value) => {
    const newOptions = [...form.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    
    // If setting as correct, uncheck others
    if (field === 'is_correct' && value) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.is_correct = false
      })
    }
    
    setForm({ ...form, options: newOptions })
  }

  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Pilihan Jawaban</h3>
      <div className="space-y-3">
        {form.options.map((option, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 w-6">
                {String.fromCharCode(65 + index)}.
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(index, 'text', e.target.value)}
                placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={option.is_correct}
                  onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Benar</span>
              </label>
            </div>
            {/* Option media */}
            <MultiMediaManager
              mediaFiles={option.media || []}
              onChange={(newMedia) => updateOption(index, 'media', newMedia)}
              maxFiles={3}
              bucket="quest-media"
              folder="images"
              label=""
              acceptTypes="image/*,audio/*"
              compact
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        ✓ Centang satu pilihan sebagai jawaban yang benar. Bisa tambahkan gambar/audio per pilihan.
      </p>
    </div>
  )
}

// Essay Fields Component
function EssayFields({ form, setForm }) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Jawaban Essay</h3>
      <textarea
        value={form.essay_answer}
        onChange={(e) => setForm({ ...form, essay_answer: e.target.value })}
        placeholder="Tulis contoh jawaban yang benar (opsional, untuk referensi guru)"
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
      />
      <p className="text-xs text-gray-500 mt-2">
        💡 Essay akan dikoreksi manual oleh guru
      </p>
    </div>
  )
}

// Matching Fields Component
function MatchingFields({ form, setForm }) {
  const updatePair = (index, side, value) => {
    const newPairs = [...form.pairs]
    newPairs[index] = { ...newPairs[index], [side]: value }
    setForm({ ...form, pairs: newPairs })
  }

  const addPair = () => {
    setForm({ ...form, pairs: [...form.pairs, { left: '', right: '' }] })
  }

  const removePair = (index) => {
    const newPairs = form.pairs.filter((_, i) => i !== index)
    setForm({ ...form, pairs: newPairs })
  }

  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Pasangan yang Cocok</h3>
      <div className="space-y-3">
        {form.pairs.map((pair, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={pair.left}
              onChange={(e) => updatePair(index, 'left', e.target.value)}
              placeholder="Item Kiri"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              required
            />
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <input
              type="text"
              value={pair.right}
              onChange={(e) => updatePair(index, 'right', e.target.value)}
              placeholder="Item Kanan"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
              required
            />
            {form.pairs.length > 2 && (
              <button
                type="button"
                onClick={() => removePair(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addPair}
        className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
      >
        + Tambah Pasangan
      </button>
    </div>
  )
}

// Arrange Sentence Fields Component
function ArrangeSentenceFields({ form, setForm }) {
  const handleWordsChange = (e) => {
    const words = e.target.value
    setForm({ 
      ...form, 
      scrambled_words: words,
      correct_order: words.split(' ').map((word, index) => ({ word, order: index }))
    })
  }

  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-gray-900 mb-3">Kalimat yang Benar</h3>
      <textarea
        value={form.scrambled_words}
        onChange={handleWordsChange}
        placeholder="Tulis kalimat yang benar (kata-kata akan diacak otomatis)"
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
        required
      />
      <p className="text-xs text-gray-500 mt-2">
        💡 Siswa akan menyusun kata-kata yang diacak menjadi kalimat yang benar
      </p>
    </div>
  )
}

// Listening Fields Component
function ListeningFields({ form, setForm }) {
  return (
    <div className="border-t pt-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">File Audio</h3>
        <input
          type="url"
          value={form.audio_url}
          onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
          placeholder="https://... (URL audio MP3)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
          required
        />
        {form.audio_url && (
          <audio controls className="w-full mt-2">
            <source src={form.audio_url} type="audio/mpeg" />
          </audio>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Jawaban yang Benar</h3>
        <textarea
          value={form.listening_answer}
          onChange={(e) => setForm({ ...form, listening_answer: e.target.value })}
          placeholder="Tulis jawaban yang benar..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-black"
          required
        />
      </div>
    </div>
  )
}

export default TeacherQuestQuestions

