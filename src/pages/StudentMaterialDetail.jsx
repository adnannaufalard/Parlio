import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StudentLayout from '../components/StudentLayout'
import MediaGallery, { mergeLegacyMedia } from '../components/MediaGallery'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

const TYPE_ICONS = { video: '🎥', audio: '🎵', image: '🖼️', pdf: '📄', link: '🔗', text: '📝' }
const TYPE_LABELS = { video: 'Video', audio: 'Audio', image: 'Gambar', pdf: 'PDF', link: 'Link', text: 'Teks' }

/* ── Simple Quest Confirm Modal ── */
function QuestConfirmModal({ quest, onClose, onStart }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xs w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeUp .25s ease-out' }}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">🎯</div>
          <h3 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-1">{quest.title}</h3>
          <p className="text-sm text-gray-500 font-['Poppins'] mb-5">Apakah kamu sudah siap mengerjakan quest ini?</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition font-['Poppins'] text-sm">Belum</button>
            <button onClick={onStart} className="flex-1 py-2.5 bg-[#1E258F] hover:bg-[#161d6f] text-white font-semibold rounded-xl transition font-['Poppins'] text-sm">Siap!</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Compact media thumbnail ── */
function MediaThumb({ media }) {
  if (media.type === 'image') {
    return (
      <a href={media.url} target="_blank" rel="noopener noreferrer"
        className="block w-full aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:shadow-md hover:border-indigo-200 transition group relative"
      >
        <img src={media.url} alt={media.name || ''} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition bg-white/90 rounded-lg p-1.5 shadow">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </a>
    )
  }
  if (media.type === 'video') {
    const isYouTube = media.url.includes('youtube.com') || media.url.includes('youtu.be')
    let embedUrl = media.url
    if (isYouTube) {
      const match = media.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
      if (match && match[1]) embedUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` // Use thumbnail for youtube
    }
    return (
      <a href={media.url} target="_blank" rel="noopener noreferrer"
        className="block w-full aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-900 hover:shadow-md hover:border-indigo-200 transition relative group"
      >
        {isYouTube ? (
          <img src={embedUrl} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
        ) : (
          <video src={media.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" preload="metadata" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
            <span className="text-xl translate-x-0.5">▶️</span>
          </div>
        </div>
      </a>
    )
  }
  if (media.type === 'audio') {
    return (
      <div className="w-full aspect-square rounded-xl border border-gray-100 bg-gradient-to-br from-purple-50 to-indigo-50 flex flex-col items-center justify-center p-2 hover:shadow-md hover:border-indigo-200 transition">
        <span className="text-2xl mb-1">🎵</span>
        <span className="text-[10px] text-gray-500 font-['Poppins'] truncate w-full text-center px-1">{media.name || 'Audio'}</span>
        <audio controls className="w-full mt-1.5" style={{ height: 24, maxWidth: '100%' }}><source src={media.url} /></audio>
      </div>
    )
  }
  if (media.type === 'pdf') {
    return (
      <a href={media.url} target="_blank" rel="noopener noreferrer"
        className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border border-gray-100 bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-md hover:border-red-200 transition text-center p-2 group"
      >
        <span className="text-2xl mb-1">📄</span>
        <span className="text-[10px] text-gray-500 font-['Poppins'] truncate w-full px-1 group-hover:text-gray-700 transition">{media.name || 'PDF'}</span>
      </a>
    )
  }
  return (
    <a href={media.url} target="_blank" rel="noopener noreferrer"
      className="flex flex-col items-center justify-center w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 hover:shadow-md hover:border-blue-200 transition text-center p-2 group"
    >
      <span className="text-2xl mb-1">🔗</span>
      <span className="text-[10px] text-gray-500 font-['Poppins'] truncate w-full px-1 group-hover:text-blue-600 transition">{media.name || 'Link'}</span>
    </a>
  )
}

/* ── Main Page ── */
export default function StudentMaterialDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { materialId } = useParams()
  const [loading, setLoading] = useState(true)
  const [material, setMaterial] = useState(null)
  const [quest, setQuest] = useState(null)
  const [questCompleted, setQuestCompleted] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [attemptHistory, setAttemptHistory] = useState([])
  const [showQuestConfirm, setShowQuestConfirm] = useState(false)
  const [bestScore, setBestScore] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState({ className: '', chapterTitle: '', lessonTitle: '' })

  useEffect(() => { if (materialId) fetchAll() }, [materialId])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const { data: mat, error: matErr } = await supabase
        .from('lesson_materials')
        .select(`
          *, 
          lesson:lessons(
            id, 
            title, 
            chapter_id,
            chapter:chapters(id, title)
          )
        `)
        .eq('id', materialId)
        .single()
      if (matErr || !mat) { toast.error('Materi tidak ditemukan'); navigate(-1); return }
      setMaterial(mat)

      let className = ''
      if (location.state?.classId) {
        const { data: classData } = await supabase
          .from('classes')
          .select('class_name')
          .eq('id', location.state.classId)
          .single()
        className = classData?.class_name || ''
      }

      setBreadcrumbs({
        className,
        chapterTitle: mat.lesson?.chapter?.title || '',
        lessonTitle: mat.lesson?.title || ''
      })

      const { data: quests } = await supabase
        .from('quests')
        .select('*, quest_questions(count)')
        .eq('lesson_id', mat.lesson_id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (quests?.length > 0) {
        const q = quests[0]
        q.questionCount = q.quest_questions?.[0]?.count || 0
        setQuest(q)

        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: attempts } = await supabase
            .from('student_quest_attempts')
            .select('id, score, max_score, percentage, passed, xp_earned, coins_earned, completed_at, time_spent_seconds')
            .eq('quest_id', q.id)
            .eq('student_id', session.user.id)
            .order('completed_at', { ascending: false })
          if (attempts) {
            setAttemptCount(attempts.length)
            setAttemptHistory(attempts)
            setQuestCompleted(attempts.some(a => a.passed))
            if (attempts.length > 0) setBestScore(Math.max(...attempts.map(a => Math.round(a.percentage || 0))))
          }
        }
      }
    } catch (err) { console.error(err); toast.error('Gagal memuat') }
    finally { setLoading(false) }
  }

  const allMedia = material ? mergeLegacyMedia(material, { file_url: 'file_url' }) : []
  const handleStartQuest = () => { if (quest) { setShowQuestConfirm(false); navigate(`/student/quest/${quest.id}`, { state: location.state }) } }
  const handleBack = () => {
    if (location.state?.lessonId) navigate(`/student/lesson/${location.state.lessonId}`, { state: location.state })
    else if (material?.lesson_id) navigate(`/student/lesson/${material.lesson_id}`)
    else navigate(-1)
  }

  if (loading) {
    return (
      <StudentLayout showHeader={true} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-28 h-28 mx-auto mb-4"><DotLottieReact src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie" loop autoplay /></div>
            <p className="text-gray-400 font-['Poppins'] text-sm">Memuat materi...</p>
          </div>
        </div>
      </StudentLayout>
    )
  }
  if (!material) return null

  const qCount = quest?.questionCount || 0
  const xpPerSoal = qCount > 0 ? Math.round((quest?.xp_reward || 0) / qCount) : 0
  const coinPerSoal = qCount > 0 ? Math.round((quest?.coins_reward || 0) / qCount) : 0
  const poinPerSoal = quest?.poin_per_soal || 10
  const isUnlimited = !quest?.max_attempts || quest.max_attempts === 0
  const maxAttempts = quest?.max_attempts || 0
  const canAttempt = isUnlimited || attemptCount < maxAttempts

  return (
    <StudentLayout showHeader={true} showBottomNav={false}>
      {/* Header Back & Breadcrumbs */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-semibold tracking-wide text-gray-400 font-['Poppins']">
            {breadcrumbs.className && (
              <>
                <span>{breadcrumbs.className}</span>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </>
            )}
            {breadcrumbs.chapterTitle && (
              <>
                <span>{breadcrumbs.chapterTitle}</span>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </>
            )}
            {breadcrumbs.lessonTitle && (
              <>
                <span>{breadcrumbs.lessonTitle}</span>
                <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </>
            )}
            <span className="text-[#4f46e5] truncate max-w-[200px]">{material.title}</span>
          </div>
        </div>
      </div>

      {/* Two-column */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 font-['Poppins'] leading-tight tracking-tight">
              {material.title}
            </h1>
          </div>

          {/* Teacher note */}
          {material.description && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-200 bg-white">
                <span className="text-sm">💡</span>
                <h3 className="text-sm font-semibold text-gray-800 font-['Poppins']">Catatan Guru</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600 leading-relaxed font-['Poppins'] whitespace-pre-wrap">{material.description}</p>
              </div>
            </div>
          )}

          {/* Text content */}
          {material.material_type === 'text' && material.content && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-200 bg-white">
                <span className="text-sm">📝</span>
                <h3 className="text-sm font-semibold text-gray-800 font-['Poppins']">Konten Materi</h3>
              </div>
              <div className="p-5">
                <div className="text-gray-700 leading-relaxed font-['Poppins'] whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: material.content }} />
              </div>
            </div>
          )}

          {/* Media — single container, small grid */}
          {allMedia.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📂</span>
                  <h3 className="text-sm font-semibold text-gray-800 font-['Poppins']">File Media</h3>
                </div>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-['Poppins']">{allMedia.length} file</span>
              </div>
              <div className="p-4">
                <div className={`grid gap-3 ${
                  allMedia.length === 1 ? 'grid-cols-1 max-w-xs' :
                  allMedia.length === 2 ? 'grid-cols-2' :
                  allMedia.length === 3 ? 'grid-cols-3' :
                  'grid-cols-3 sm:grid-cols-4'
                }`}>
                  {allMedia.map((media, idx) => (
                    <MediaThumb key={idx} media={media} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!material.content && allMedia.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm text-gray-400 font-['Poppins']">Tidak ada konten untuk ditampilkan</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-80 xl:w-[340px] flex-shrink-0">
          <div className="lg:sticky lg:top-4 space-y-4">

            {quest ? (
              <>
                {/* Quest info */}
                <div className="bg-white rounded-2xl border-2 border-indigo-500 shadow-lg shadow-indigo-100 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${questCompleted ? 'bg-green-100' : 'bg-indigo-100'}`}>
                        {questCompleted ? '✅' : '🎯'}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 font-['Poppins'] line-clamp-2">{quest.title}</h3>
                        {questCompleted && <span className="text-[11px] text-green-600 font-semibold font-['Poppins']">Sudah diselesaikan</span>}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="space-y-2">
                      {[
                        { icon: '📋', label: 'Tipe Quest', val: quest.quest_type === 'practice' ? 'Latihan' : quest.quest_type === 'daily_task' ? 'Tugas Harian' : quest.quest_type === 'chapter_exam' ? 'Ujian Bab' : quest.quest_type || 'Latihan' },
                        { icon: '📈', label: 'Tingkat Kesulitan', val: quest.difficulty === 'easy' ? 'Mudah' : quest.difficulty === 'medium' ? 'Sedang' : quest.difficulty === 'hard' ? 'Sulit' : quest.difficulty || 'Sedang' },
                        { icon: '📝', label: 'Jumlah Soal', val: `${qCount} soal` },
                        { icon: '⏰', label: 'Waktu', val: quest.time_limit_minutes ? `${quest.time_limit_minutes} menit` : 'Tidak dibatasi' },
                        { icon: '🎯', label: 'Nilai Minimal', val: `${quest.min_score_to_pass || quest.min_points || 60}` },
                        { icon: '🔄', label: 'Percobaan', val: isUnlimited ? `${attemptCount}x (unlimited)` : `${attemptCount} / ${maxAttempts}` },
                        { icon: '⭐', label: 'XP per Soal', val: `+${xpPerSoal} XP` },
                        { icon: '🪙', label: 'Coin per Soal', val: `+${coinPerSoal} coin` },
                        { icon: '💎', label: 'Poin per Soal', val: `${poinPerSoal} poin` },
                      ].map(s => (
                        <div key={s.label} className="flex items-center justify-between py-1.5 px-1">
                          <span className="text-xs text-gray-500 font-['Poppins'] flex items-center gap-2">
                            <span className="text-sm">{s.icon}</span> {s.label}
                          </span>
                          <span className="text-xs font-semibold text-gray-800 font-['Poppins']">{s.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    {canAttempt ? (
                      <button
                        onClick={() => setShowQuestConfirm(true)}
                        className={`w-full mt-4 py-3 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 font-['Poppins'] text-sm shadow-sm active:scale-[0.97] ${
                          questCompleted
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-200'
                            : 'bg-gradient-to-r from-[#1E258F] to-[#3b44c2] hover:from-[#161d6f] hover:to-[#2a32a8] text-white shadow-indigo-200'
                        }`}
                      >
                        <span className="text-base">{questCompleted ? '🔄' : '⚡'}</span>
                        <span>{questCompleted ? 'Kerjakan Lagi' : 'Kerjakan Quest'}</span>
                      </button>
                    ) : (
                      <div className="mt-4 py-3 px-4 bg-gray-100 rounded-xl text-center">
                        <p className="text-xs text-red-500 font-semibold font-['Poppins']">Percobaan sudah habis</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attempt history */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📊</span>
                      <h4 className="text-xs font-semibold text-gray-700 font-['Poppins']">Riwayat Pengerjaan</h4>
                    </div>
                    {attemptHistory.length > 0 && (
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-['Poppins']">{attemptHistory.length}x</span>
                    )}
                  </div>
                  <div className="p-4">
                    {attemptHistory.length > 0 ? (
                      <div className="space-y-3">
                        {/* Best score highlight */}
                        {bestScore !== null && (
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🏆</span>
                              <span className="text-xs font-semibold text-amber-800 font-['Poppins']">Nilai Terbaik</span>
                            </div>
                            <span className="text-base font-semibold text-amber-700 font-['Poppins']">{bestScore}</span>
                          </div>
                        )}

                        {/* History list */}
                        {attemptHistory.map((a, i) => {
                          const mins = a.time_spent_seconds ? Math.floor(a.time_spent_seconds / 60) : null
                          const secs = a.time_spent_seconds ? a.time_spent_seconds % 60 : null
                          const attemptPercentage = Math.round(a.percentage || 0)
                          const isBest = attemptPercentage === bestScore
                          return (
                            <div key={a.id} className={`rounded-xl border p-3 ${a.passed ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-gray-400 font-['Poppins']">#{i + 1}</span>
                                  {isBest && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold font-['Poppins']">Best</span>}
                                </div>
                                <span className={`text-[11px] font-semibold font-['Poppins'] px-2 py-0.5 rounded-full ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                                  {a.passed ? 'Lulus ✓' : 'Belum Lulus'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs font-['Poppins']">
                                <span className="font-semibold text-gray-800 text-sm">{attemptPercentage}</span>
                                <span className="text-gray-300">|</span>
                                {a.xp_earned > 0 && <span className="text-amber-600 font-semibold">+{a.xp_earned} XP</span>}
                                {a.coins_earned > 0 && <span className="text-yellow-600 font-semibold">+{a.coins_earned} 🪙</span>}
                                {mins !== null && <span className="text-gray-400 ml-auto">{mins}m {secs}s</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-2xl mb-2">🕐</div>
                        <p className="text-xs text-gray-400 font-['Poppins']">Belum pernah mengerjakan</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-xl flex items-center justify-center text-2xl">📝</div>
                <p className="text-sm font-medium text-gray-500 font-['Poppins']">Belum ada quest</p>
                <p className="text-xs text-gray-400 font-['Poppins'] mt-1">Quest belum ditambahkan untuk materi ini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuestConfirm && quest && (
        <QuestConfirmModal quest={quest} onClose={() => setShowQuestConfirm(false)} onStart={handleStartQuest} />
      )}

      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </StudentLayout>
  )
}
