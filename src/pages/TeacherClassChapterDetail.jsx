import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'

function TeacherClassChapterDetail() {
  const { id: classId, chapterId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [classData, setClassData] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [lessons, setLessons] = useState([])
  const [activeTab, setActiveTab] = useState('materials')
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [questStats, setQuestStats] = useState([])
  const [studentAttempts, setStudentAttempts] = useState([])
  const [questionStats, setQuestionStats] = useState([])
  const [studentBestScores, setStudentBestScores] = useState([])
  const [savingReport, setSavingReport] = useState(false)
  const [reportSaved, setReportSaved] = useState(false)

  useEffect(() => {
    fetchData()
  }, [classId, chapterId])

  useEffect(() => {
    if (selectedLesson) {
      fetchLessonDetails(selectedLesson.id)
      checkReportSaved(selectedLesson.id)
    }
  }, [selectedLesson])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch class data
      const { data: classInfo, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (classError) throw classError
      setClassData(classInfo)

      // Fetch chapter data
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single()

      if (chapterError) throw chapterError
      setChapter(chapterData)

      // Fetch lessons with materials and quests
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          materials:lesson_materials(id, title, material_type, file_url, description),
          quests:quests(id, title, xp_reward, coins_reward, min_points, max_attempts)
        `)
        .eq('chapter_id', chapterId)
        .order('lesson_order', { ascending: true })

      if (lessonsError) throw lessonsError
      setLessons(lessonsData || [])

      // Set first lesson as selected by default
      if (lessonsData && lessonsData.length > 0) {
        setSelectedLesson(lessonsData[0])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchLessonDetails = async (lessonId) => {
    try {
      // Get class members with student info
      const { data: classMembers, error: membersError } = await supabase
        .from('class_members')
        .select(`
          student_id,
          student:profiles!class_members_student_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq('class_id', classId)

      if (membersError) throw membersError

      const studentIds = classMembers.map(m => m.student_id)
      const studentsMap = {}
      classMembers.forEach(m => {
        studentsMap[m.student_id] = m.student
      })

      if (studentIds.length === 0) {
        setQuestStats([])
        setStudentAttempts([])
        setQuestionStats([])
        setStudentBestScores([])
        return
      }

      // Get quests for this lesson
      const { data: quests, error: questsError } = await supabase
        .from('quests')
        .select('id, title, xp_reward, coins_reward, min_points, max_attempts')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true })

      if (questsError) throw questsError

      if (!quests || quests.length === 0) {
        setQuestStats([])
        setStudentAttempts([])
        setQuestionStats([])
        setStudentBestScores([])
        return
      }

      const questIds = quests.map(q => q.id)

      // Get quest attempts from class students
      const { data: attempts, error: attemptsError } = await supabase
        .from('student_quest_attempts')
        .select(`
          *,
          student:profiles!student_quest_attempts_student_id_fkey(id, full_name, email, avatar_url),
          quest:quests(id, title, min_points)
        `)
        .in('quest_id', questIds)
        .in('student_id', studentIds)
        .order('completed_at', { ascending: false })

      if (attemptsError) throw attemptsError

      // Calculate quest stats
      const questStatsData = quests.map(quest => {
        const questAttempts = (attempts || []).filter(a => a.quest_id === quest.id)
        const completedStudents = [...new Set(questAttempts.map(a => a.student_id))]
        const passedAttempts = questAttempts.filter(a => a.passed)
        const passedStudents = [...new Set(passedAttempts.map(a => a.student_id))]
        
        const scores = questAttempts.map(a => a.percentage || 0)
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0

        return {
          ...quest,
          totalStudents: studentIds.length,
          completedStudents: completedStudents.length,
          passedStudents: passedStudents.length,
          failedStudents: completedStudents.length - passedStudents.length,
          avgScore: Math.round(avgScore),
          highestScore: Math.round(highestScore),
          lowestScore: Math.round(lowestScore),
          totalAttempts: questAttempts.length
        }
      })

      setQuestStats(questStatsData)
      setStudentAttempts(attempts || [])

      // Calculate best scores per student
      const bestScoresMap = {}
      studentIds.forEach(studentId => {
        bestScoresMap[studentId] = {
          student: studentsMap[studentId],
          quests: {}
        }
      })

      // For each quest, find best score per student
      quests.forEach(quest => {
        const questAttempts = (attempts || []).filter(a => a.quest_id === quest.id)
        
        studentIds.forEach(studentId => {
          const studentAttempts = questAttempts.filter(a => a.student_id === studentId)
          if (studentAttempts.length > 0) {
            // Find best attempt (highest percentage)
            const bestAttempt = studentAttempts.reduce((best, current) => 
              (current.percentage || 0) > (best.percentage || 0) ? current : best
            , studentAttempts[0])
            
            bestScoresMap[studentId].quests[quest.id] = {
              questTitle: quest.title,
              bestScore: Math.round(bestAttempt.percentage || 0),
              passed: bestAttempt.passed,
              attempts: studentAttempts.length,
              maxAttempts: quest.max_attempts,
              minPoints: quest.min_points
            }
          } else {
            bestScoresMap[studentId].quests[quest.id] = {
              questTitle: quest.title,
              bestScore: null,
              passed: false,
              attempts: 0,
              maxAttempts: quest.max_attempts,
              minPoints: quest.min_points
            }
          }
        })
      })

      // Convert to array for rendering
      const bestScoresArray = Object.values(bestScoresMap).map(item => ({
        ...item,
        questsArray: Object.entries(item.quests).map(([questId, data]) => ({
          questId,
          ...data
        }))
      }))

      // Sort by student name
      bestScoresArray.sort((a, b) => 
        (a.student?.full_name || '').localeCompare(b.student?.full_name || '')
      )

      setStudentBestScores(bestScoresArray)

      // Get question statistics - pass attempts so we can read user_answers
      await fetchQuestionStats(questIds, studentIds, quests, attempts)

    } catch (error) {
      console.error('Error fetching lesson details:', error)
    }
  }

  const fetchQuestionStats = async (questIds, studentIds, quests, attempts) => {
    try {
      // Get quest questions with correct_answer
      const { data: questQuestions, error: qqError } = await supabase
        .from('quest_questions')
        .select(`
          id,
          quest_id,
          question_id,
          question:questions(id, question_text, question_type, correct_answer, options)
        `)
        .in('quest_id', questIds)

      if (qqError) throw qqError

      if (!questQuestions || questQuestions.length === 0) {
        setQuestionStats([])
        return
      }

      console.log('Quest Questions:', questQuestions)
      console.log('Attempts with user_answers:', attempts?.map(a => ({ 
        id: a.id, 
        quest_id: a.quest_id, 
        user_answers: a.user_answers 
      })))

      // Group questions by quest
      const questQuestionStatsMap = {}
      
      questIds.forEach(questId => {
        const quest = quests.find(q => q.id === questId)
        questQuestionStatsMap[questId] = {
          questId,
          questTitle: quest?.title || 'Unknown Quest',
          questions: []
        }
      })

      // Calculate stats per question and group by quest
      // user_answers in student_quest_attempts is: { [quest_question_id]: 'A' or 'B' or answer_text }
      questQuestions.forEach(qq => {
        // Get attempts for this specific quest
        const questAttempts = (attempts || []).filter(a => a.quest_id === qq.quest_id)
        
        let totalAnswers = 0
        let correctCount = 0
        let wrongCount = 0
        const wrongAnswersList = []

        // Get correct answer from question
        let correctAnswer = qq.question?.correct_answer
        // Parse options if needed to find correct answer
        let options = qq.question?.options
        if (options && typeof options === 'string') {
          try { options = JSON.parse(options) } catch {}
        }
        
        // If correct_answer is not A/B/C/D, try to find it from options
        if (correctAnswer && !['A','B','C','D','E','F'].includes(correctAnswer)) {
          if (Array.isArray(options)) {
            const idx = options.findIndex(opt => opt.text === correctAnswer || opt.is_correct)
            if (idx !== -1) correctAnswer = ['A','B','C','D','E','F'][idx]
          } else if (typeof options === 'object') {
            const foundKey = Object.entries(options).find(([k, v]) => v === correctAnswer)?.[0]
            if (foundKey) correctAnswer = foundKey
          }
        }
        
        if (!correctAnswer && Array.isArray(options)) {
          const idx = options.findIndex(opt => opt.is_correct)
          if (idx !== -1) correctAnswer = ['A','B','C','D','E','F'][idx]
        }

        // Check each attempt's user_answers
        questAttempts.forEach(attempt => {
          const userAnswers = attempt.user_answers
          if (userAnswers && typeof userAnswers === 'object') {
            // user_answers key is quest_question id (qq.id)
            const userAnswer = userAnswers[qq.id]
            
            if (userAnswer !== undefined && userAnswer !== null) {
              totalAnswers++
              
              const isCorrect = qq.question?.question_type === 'short_answer'
                ? String(userAnswer).trim().toLowerCase() === String(correctAnswer || '').trim().toLowerCase()
                : userAnswer === correctAnswer
              
              if (isCorrect) {
                correctCount++
              } else {
                wrongCount++
                if (wrongAnswersList.length < 5 && userAnswer) {
                  wrongAnswersList.push(userAnswer)
                }
              }
            }
          }
        })

        const correctRate = totalAnswers > 0 
          ? (correctCount / totalAnswers) * 100 
          : 0

        const questionStat = {
          questionId: qq.question_id,
          questionText: qq.question?.question_text || 'Unknown',
          questionType: qq.question?.question_type || 'multiple_choice',
          totalAnswers,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          correctRate: Math.round(correctRate),
          wrongAnswersList
        }

        if (questQuestionStatsMap[qq.quest_id]) {
          questQuestionStatsMap[qq.quest_id].questions.push(questionStat)
        }
      })

      // Sort questions within each quest by correct rate (ascending) - most difficult first
      Object.values(questQuestionStatsMap).forEach(questGroup => {
        questGroup.questions.sort((a, b) => a.correctRate - b.correctRate)
      })

      // Convert to array
      const questionStatsArray = Object.values(questQuestionStatsMap).filter(
        group => group.questions.length > 0
      )

      setQuestionStats(questionStatsArray)

    } catch (error) {
      console.error('Error fetching question stats:', error)
    }
  }

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      case 'text': return '📝'
      default: return '📁'
    }
  }

  // Check if report has been saved for this lesson
  const checkReportSaved = async (lessonId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('saved_reports')
        .select('id')
        .eq('saved_by', user.id)
        .eq('class_id', classId)
        .eq('chapter_id', chapterId)
        .eq('lesson_id', lessonId)
        .single()

      setReportSaved(!!data && !error)
    } catch (error) {
      setReportSaved(false)
    }
  }

  // Save report to database
  const handleSaveReport = async () => {
    if (!selectedLesson || studentBestScores.length === 0) {
      toast.error('Tidak ada data untuk disimpan')
      return
    }

    setSavingReport(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Calculate overall stats
      const allStudentAvgScores = studentBestScores.map(item => {
        const scores = item.questsArray.filter(q => q.bestScore !== null).map(q => q.bestScore)
        return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      }).filter(s => s !== null)

      const avgScore = allStudentAvgScores.length > 0
        ? Math.round(allStudentAvgScores.reduce((a, b) => a + b, 0) / allStudentAvgScores.length)
        : 0
      const highestScore = allStudentAvgScores.length > 0 ? Math.max(...allStudentAvgScores) : 0
      const lowestScore = allStudentAvgScores.length > 0 ? Math.min(...allStudentAvgScores) : 0
      
      // Count passed students (students with avg >= 70)
      const passedCount = allStudentAvgScores.filter(s => s >= 70).length

      // Get quest titles for column headers
      const questColumns = questStats.map(q => ({
        id: q.id,
        title: q.title
      }))

      // Prepare report data with format: nama siswa, kelas, email, nilai quest a, nilai quest b, rata-rata, status
      const reportData = {
        lessonTitle: selectedLesson.title,
        chapterTitle: chapter?.title,
        className: classData?.class_name,
        questColumns: questColumns, // For table headers
        stats: {
          totalStudents: studentBestScores.length,
          avgScore: avgScore,
          highestScore: highestScore,
          lowestScore: lowestScore,
          passedCount: passedCount
        },
        students: studentBestScores.map(item => {
          const scores = item.questsArray.filter(q => q.bestScore !== null).map(q => q.bestScore)
          const studentAvg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
          const isPassed = studentAvg >= 70

          // Build quest scores object { questId: score }
          const questScores = {}
          item.questsArray.forEach(q => {
            questScores[q.questId] = q.bestScore
          })

          return {
            id: item.student?.id,
            name: item.student?.full_name || 'Unknown',
            className: classData?.class_name || '',
            email: item.student?.email || '',
            questScores: questScores, // { questId: score, questId2: score2, ... }
            score: studentAvg,
            passed: isPassed,
            status: isPassed ? 'Lulus' : 'Tidak Lulus'
          }
        }).sort((a, b) => b.score - a.score)
      }

      const reportName = `${chapter?.title} - ${selectedLesson.title}`

      // Insert new report
      const { error } = await supabase
        .from('saved_reports')
        .insert({
          saved_by: user.id,
          class_id: classId,
          chapter_id: chapterId,
          lesson_id: selectedLesson.id,
          report_name: reportName,
          report_data: reportData
        })

      if (error) throw error

      setReportSaved(true)
      toast.success('Laporan berhasil disimpan!')
    } catch (error) {
      console.error('Error saving report:', error)
      toast.error('Gagal menyimpan laporan')
    } finally {
      setSavingReport(false)
    }
  }

  if (loading) {
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

  if (!chapter || !classData) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Data tidak ditemukan</p>
          <button
            onClick={() => navigate(`/teacher/classes/${classId}`)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Kembali ke Kelas
          </button>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div 
            className="p-6 text-white"
            style={{ backgroundColor: chapter.bg_color || '#3B82F6' }}
          >
            <button
              onClick={() => navigate(`/teacher/classes/${classId}`)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Kembali ke {classData.class_name}</span>
            </button>

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{chapter.icon || '📚'}</span>
                  <div>
                    <h1 className="text-2xl font-bold">{chapter.title}</h1>
                    <p className="text-white/80 text-sm">{chapter.description || 'Tidak ada deskripsi'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{lessons.length}</p>
                <p className="text-xs text-white/80">Sub Bab</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">
                  {lessons.reduce((sum, l) => sum + (l.materials?.length || 0), 0)}
                </p>
                <p className="text-xs text-white/80">Materi</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">
                  {lessons.reduce((sum, l) => sum + (l.quests?.length || 0), 0)}
                </p>
                <p className="text-xs text-white/80">Quest</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Lessons Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Daftar Sub Bab</h3>
              <div className="space-y-2">
                {lessons.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada sub bab</p>
                ) : (
                  lessons.map((lesson, idx) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedLesson?.id === lesson.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          selectedLesson?.id === lesson.id ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            selectedLesson?.id === lesson.id ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {lesson.title}
                          </p>
                          <div className="flex gap-2 text-xs text-gray-500">
                            <span>📚 {lesson.materials?.length || 0}</span>
                            <span>🎯 {lesson.quests?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Lesson Detail Content */}
          <div className="col-span-12 lg:col-span-9">
            {selectedLesson ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Lesson Header */}
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="text-xl font-bold text-gray-800">{selectedLesson.title}</h2>
                  {selectedLesson.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedLesson.description}</p>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                      activeTab === 'materials'
                        ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    📚 Materi ({selectedLesson.materials?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('quests')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                      activeTab === 'quests'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    🎯 Quest & Hasil ({questStats.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                      activeTab === 'questions'
                        ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    📊 Analisis Soal
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Materials Tab */}
                  {activeTab === 'materials' && (
                    <div className="space-y-4">
                      {selectedLesson.materials?.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <div className="text-4xl mb-2">📚</div>
                          <p className="text-gray-500">Belum ada materi</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {selectedLesson.materials?.map((material) => (
                            <div 
                              key={material.id}
                              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                            >
                              <div className="text-3xl">{getMaterialIcon(material.material_type)}</div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{material.title}</h4>
                                {material.description && (
                                  <p className="text-sm text-gray-500 mt-1">{material.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">
                                    {material.material_type}
                                  </span>
                                </div>
                              </div>
                              {material.file_url && (
                                <a
                                  href={material.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                  Lihat
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quests Tab */}
                  {activeTab === 'quests' && (
                    <div className="space-y-6">
                      {questStats.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <div className="text-4xl mb-2">🎯</div>
                          <p className="text-gray-500">Belum ada quest</p>
                        </div>
                      ) : (
                        <>
                          {/* Quest Cards */}
                          <div className="grid gap-4">
                            {questStats.map((quest) => (
                              <div key={quest.id} className="border rounded-lg overflow-hidden">
                                <div className="p-4 bg-purple-50 border-b">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-bold text-gray-800">{quest.title}</h4>
                                      <div className="flex gap-3 text-xs text-gray-600 mt-1">
                                        <span>⭐ {quest.xp_reward} XP</span>
                                        <span>🪙 {quest.coins_reward} Coins</span>
                                        <span>📊 Min: {quest.min_points} poin</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4">
                                  {/* Stats Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-blue-600">{quest.completedStudents}/{quest.totalStudents}</p>
                                      <p className="text-xs text-gray-600">Sudah Mengerjakan</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-green-600">{quest.passedStudents}</p>
                                      <p className="text-xs text-gray-600">Lulus</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-red-600">{quest.failedStudents}</p>
                                      <p className="text-xs text-gray-600">Tidak Lulus</p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-yellow-600">{quest.avgScore}%</p>
                                      <p className="text-xs text-gray-600">Rata-rata</p>
                                    </div>
                                  </div>

                                  {/* Score Range */}
                                  <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Terendah</p>
                                      <p className="font-bold text-red-600">{quest.lowestScore}%</p>
                                    </div>
                                    <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                                        style={{ width: `${quest.avgScore}%` }}
                                      />
                                    </div>
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">Tertinggi</p>
                                      <p className="font-bold text-green-600">{quest.highestScore}%</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Student Best Scores Table */}
                          {studentBestScores.length > 0 && (
                            <div className="mt-6">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-800">Nilai Akhir Siswa (Best Score)</h3>
                                <button
                                  onClick={handleSaveReport}
                                  disabled={savingReport}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                    reportSaved
                                      ? 'bg-green-100 text-green-700 border border-green-300'
                                      : 'bg-blue-500 text-white hover:bg-blue-600'
                                  } disabled:opacity-50`}
                                >
                                  {savingReport ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Menyimpan...
                                    </>
                                  ) : reportSaved ? (
                                    <>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Tersimpan
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                      </svg>
                                      Simpan ke Laporan
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm border">
                                  <thead className="bg-blue-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">No</th>
                                      <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Siswa</th>
                                      {questStats.map((quest) => (
                                        <th key={quest.id} className="px-4 py-3 text-center font-medium text-gray-700 border-b min-w-[120px]">
                                          {quest.title}
                                        </th>
                                      ))}
                                      <th className="px-4 py-3 text-center font-medium text-gray-700 border-b bg-blue-100">Rata-rata</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {studentBestScores.map((item, idx) => {
                                      // Calculate average of all best scores
                                      const scores = item.questsArray
                                        .filter(q => q.bestScore !== null)
                                        .map(q => q.bestScore)
                                      const avgScore = scores.length > 0 
                                        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                                        : null

                                      return (
                                        <tr key={item.student?.id || idx} className="hover:bg-gray-50">
                                          <td className="px-4 py-3 text-gray-600 border-r">{idx + 1}</td>
                                          <td className="px-4 py-3 border-r">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold flex-shrink-0">
                                                {item.student?.avatar_url ? (
                                                  <img src={item.student.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                  item.student?.full_name?.charAt(0) || '?'
                                                )}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-medium text-gray-800 truncate">{item.student?.full_name}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.student?.email}</p>
                                              </div>
                                            </div>
                                          </td>
                                          {item.questsArray.map((quest) => (
                                            <td key={quest.questId} className="px-4 py-3 text-center border-r">
                                              {quest.bestScore !== null ? (
                                                <div>
                                                  <span className={`font-bold text-lg ${
                                                    quest.passed ? 'text-green-600' : 
                                                    quest.bestScore >= quest.minPoints ? 'text-green-600' : 'text-red-600'
                                                  }`}>
                                                    {quest.bestScore}
                                                  </span>
                                                  <div className="flex items-center justify-center gap-1 mt-1">
                                                    {quest.passed ? (
                                                      <span className="text-xs text-green-600">✓</span>
                                                    ) : (
                                                      <span className="text-xs text-red-500">✗</span>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                      ({quest.attempts}/{quest.maxAttempts})
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-gray-400 text-xs">Belum dikerjakan</span>
                                              )}
                                            </td>
                                          ))}
                                          <td className="px-4 py-3 text-center bg-blue-50">
                                            {avgScore !== null ? (
                                              <span className={`font-bold text-lg ${
                                                avgScore >= 70 ? 'text-green-600' : 
                                                avgScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                                              }`}>
                                                {avgScore}
                                              </span>
                                            ) : (
                                              <span className="text-gray-400 text-xs">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Student Attempts Table */}
                          {studentAttempts.length > 0 && (
                            <div className="mt-6">
                              <h3 className="font-semibold text-gray-800 mb-3">Riwayat Percobaan Siswa</h3>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-3 text-left font-medium text-gray-600">Siswa</th>
                                      <th className="px-4 py-3 text-left font-medium text-gray-600">Quest</th>
                                      <th className="px-4 py-3 text-center font-medium text-gray-600">Percobaan</th>
                                      <th className="px-4 py-3 text-center font-medium text-gray-600">Skor</th>
                                      <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                                      <th className="px-4 py-3 text-left font-medium text-gray-600">Waktu</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {studentAttempts.slice(0, 20).map((attempt) => (
                                      <tr key={attempt.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                                              {attempt.student?.avatar_url ? (
                                                <img src={attempt.student.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                              ) : (
                                                attempt.student?.full_name?.charAt(0) || '?'
                                              )}
                                            </div>
                                            <div>
                                              <p className="font-medium text-gray-800">{attempt.student?.full_name}</p>
                                              <p className="text-xs text-gray-500">{attempt.student?.email}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{attempt.quest?.title}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                                            {attempt.attempt_number}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`font-bold ${
                                            (attempt.percentage || 0) >= (attempt.quest?.min_points || 60) 
                                              ? 'text-green-600' 
                                              : 'text-red-600'
                                          }`}>
                                            {Math.round(attempt.percentage || 0)}%
                                          </span>
                                          <span className="text-gray-400 text-xs ml-1">
                                            ({attempt.score}/{attempt.max_score})
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {attempt.passed ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                              ✓ Lulus
                                            </span>
                                          ) : (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                              ✗ Tidak Lulus
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                          {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          }) : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {studentAttempts.length > 20 && (
                                  <p className="text-center text-sm text-gray-500 py-3">
                                    Menampilkan 20 dari {studentAttempts.length} percobaan
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Questions Analysis Tab */}
                  {activeTab === 'questions' && (
                    <div className="space-y-6">
                      {questionStats.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <div className="text-4xl mb-2">📊</div>
                          <p className="text-gray-500">Belum ada data analisis soal</p>
                          <p className="text-sm text-gray-400 mt-1">Data akan muncul setelah siswa mengerjakan quest</p>
                        </div>
                      ) : (
                        <>
                          
                          {/* Questions grouped by Quest */}
                          {questionStats.map((questGroup) => (
                            <div key={questGroup.questId} className="border rounded-lg overflow-hidden">
                              {/* Quest Header */}
                              <div className="p-4 bg-purple-100 border-b">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🎯</span>
                                    <h4 className="font-bold text-purple-900">{questGroup.questTitle}</h4>
                                  </div>
                                  <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                                    {questGroup.questions.length} Soal
                                  </span>
                                </div>
                                {/* Quest Summary Stats */}
                                {questGroup.questions.length > 0 && (
                                  <div className="mt-3 flex gap-4 text-sm">
                                    {(() => {
                                      const avgCorrectRate = Math.round(
                                        questGroup.questions.reduce((sum, q) => sum + q.correctRate, 0) / questGroup.questions.length
                                      )
                                      const difficultQuestions = questGroup.questions.filter(q => q.correctRate < 50).length
                                      return (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <span className="text-purple-700">Rata-rata tingkat benar:</span>
                                            <span className={`font-bold ${
                                              avgCorrectRate < 50 ? 'text-red-600' :
                                              avgCorrectRate < 70 ? 'text-yellow-600' :
                                              'text-green-600'
                                            }`}>{avgCorrectRate}%</span>
                                          </div>
                                          {difficultQuestions > 0 && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-red-600 font-medium">⚠️ {difficultQuestions} soal sulit</span>
                                            </div>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>

                              {/* Questions List */}
                              <div className="p-4 space-y-3">
                                {questGroup.questions.map((q, idx) => (
                                  <div 
                                    key={q.questionId}
                                    className={`border rounded-lg p-4 ${
                                      q.correctRate < 50 ? 'border-red-200 bg-red-50' :
                                      q.correctRate < 70 ? 'border-yellow-200 bg-yellow-50' :
                                      'border-green-200 bg-green-50'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                                            q.correctRate < 50 ? 'bg-red-200 text-red-800' :
                                            q.correctRate < 70 ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                          }`}>
                                            #{idx + 1}
                                          </span>
                                          <span className="text-xs text-gray-500 capitalize">
                                            {q.questionType.replace('_', ' ')}
                                          </span>
                                          {q.correctRate < 50 && (
                                            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                              Perlu Perhatian
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-gray-800 font-medium">{q.questionText}</p>
                                        
                                        <div className="flex gap-4 mt-3 text-sm">
                                          <div className="flex items-center gap-1">
                                            <span className="text-green-600 font-semibold">✓ {q.correctAnswers}</span>
                                            <span className="text-gray-500">benar</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="text-red-600 font-semibold">✗ {q.wrongAnswers}</span>
                                            <span className="text-gray-500">salah</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <span className="text-gray-600 font-semibold">{q.totalAnswers}</span>
                                            <span className="text-gray-500">total</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-center">
                                        <div className={`text-3xl font-bold ${
                                          q.correctRate < 50 ? 'text-red-600' :
                                          q.correctRate < 70 ? 'text-yellow-600' :
                                          'text-green-600'
                                        }`}>
                                          {q.correctRate}%
                                        </div>
                                        <p className="text-xs text-gray-500">tingkat benar</p>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all ${
                                          q.correctRate < 50 ? 'bg-red-500' :
                                          q.correctRate < 70 ? 'bg-yellow-500' :
                                          'bg-green-500'
                                        }`}
                                        style={{ width: `${q.correctRate}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="w-32 h-32 mx-auto mb-4">
                  <DotLottieReact
                    src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                    loop
                    autoplay
                  />
                </div>
                <p className="text-gray-500">Pilih sub bab untuk melihat detail</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherClassChapterDetail
