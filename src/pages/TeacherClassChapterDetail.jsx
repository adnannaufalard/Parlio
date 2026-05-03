import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import TeacherLayout from '../components/TeacherLayout'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import toast from 'react-hot-toast'
import {
  BookOpen, Target, BarChart2,
  FileText, Video, Music, Image, File,
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  Save, Check, Loader2, Users, Layout, Award, TrendingUp,
  Clock, PlayCircle, FileQuestion, BookMarked
} from 'lucide-react'

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
          quests:quests(id, title, xp_reward, coins_reward, min_points, min_score_to_pass, max_attempts)
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
        .select('id, title, xp_reward, coins_reward, min_points, min_score_to_pass, max_attempts')
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
              minPoints: quest.min_points,
              minScoreToPass: quest.min_score_to_pass
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
          try { options = JSON.parse(options) } catch { }
        }

        // If correct_answer is not A/B/C/D, try to find it from options
        if (correctAnswer && !['A', 'B', 'C', 'D', 'E', 'F'].includes(correctAnswer)) {
          if (Array.isArray(options)) {
            const idx = options.findIndex(opt => opt.text === correctAnswer || opt.is_correct)
            if (idx !== -1) correctAnswer = ['A', 'B', 'C', 'D', 'E', 'F'][idx]
          } else if (typeof options === 'object') {
            const foundKey = Object.entries(options).find(([k, v]) => v === correctAnswer)?.[0]
            if (foundKey) correctAnswer = foundKey
          }
        }

        if (!correctAnswer && Array.isArray(options)) {
          const idx = options.findIndex(opt => opt.is_correct)
          if (idx !== -1) correctAnswer = ['A', 'B', 'C', 'D', 'E', 'F'][idx]
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
      case 'pdf': return <FileText className="w-8 h-8 text-blue-500" />
      case 'video': return <Video className="w-8 h-8 text-indigo-500" />
      case 'audio': return <Music className="w-8 h-8 text-purple-500" />
      case 'image': return <Image className="w-8 h-8 text-green-500" />
      case 'text': return <FileText className="w-8 h-8 text-orange-500" />
      default: return <File className="w-8 h-8 text-gray-500" />
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-2">
              <DotLottieReact
                src="https://lottie.host/a97ee9dd-77be-40cd-b148-8577e6cd6356/P6C2DoJ7EW.lottie"
                loop
                autoplay
              />
            </div>
            <p className="text-gray-500 font-['Poppins']">Memuat data sub bab...</p>
          </div>
        </div>
      </TeacherLayout>
    )
  }

  if (!chapter || !classData) {
    return (
      <TeacherLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-48 h-48 mb-4">
            <DotLottieReact
              src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
              loop
              autoplay
            />
          </div>
          <p className="text-gray-600 font-['Poppins'] mb-4 text-lg">Data tidak ditemukan</p>
          <button
            onClick={() => navigate(`/teacher/classes/${classId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-medium font-['Poppins'] shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Kelas
          </button>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 sm:p-8 relative">
            {/* Background Accent */}
            <div
              className="absolute top-0 right-0 w-64 h-64 opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"
              style={{ backgroundColor: chapter.bg_color || '#3B82F6' }}
            />

            <button
              onClick={() => navigate(`/teacher/classes/${classId}`)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-['Poppins'] text-sm font-medium w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Kelas</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: chapter.bg_color || '#3B82F6' }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-['Poppins']">
                    {chapter.title}
                  </h1>
                </div>
                <p className="text-gray-500 font-['Poppins'] text-sm  max-w-2xl">
                  {chapter.description || 'Tidak ada deskripsi'}
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-[100px]">
                  <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                    <p className="text-xs font-semibold font-['Poppins']">Sub Bab</p>
                  </div>
                  <p className="text-2xl flex items-center justify-center font-semibold text-gray-900 font-['Poppins']">{lessons.length}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-[100px]">
                  <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                    <p className="text-xs font-semibold font-['Poppins']">Materi</p>
                  </div>
                  <p className="text-2xl flex items-center justify-center font-semibold text-gray-900 font-['Poppins']">
                    {lessons.reduce((sum, l) => sum + (l.materials?.length || 0), 0)}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-w-[100px]">
                  <div className="flex items-center justify-center gap-2 text-gray-500 mb-1">
                    <p className="text-xs font-semibold font-['Poppins']">Quest</p>
                  </div>
                  <p className="text-2xl flex items-center justify-center font-semibold text-gray-900 font-['Poppins']">
                    {lessons.reduce((sum, l) => sum + (l.quests?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Lessons Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4 font-['Poppins'] flex items-center gap-2">
                <Layout className="w-5 h-5 text-gray-400" />
                Daftar Sub Bab
              </h3>
              <div className="space-y-1">
                {lessons.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 font-['Poppins']">Belum ada sub bab</p>
                  </div>
                ) : (
                  lessons.map((lesson, idx) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`w-full text-left p-3 rounded-xl transition-all font-['Poppins'] relative group ${selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-600'
                        }`}
                    >
                      {selectedLesson?.id === lesson.id && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full" />
                      )}
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${selectedLesson?.id === lesson.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm group-hover:text-gray-900'
                          }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">
                            {lesson.title}
                          </p>
                          <div className="flex gap-3 text-xs opacity-70 mt-0.5">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> {lesson.materials?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" /> {lesson.quests?.length || 0}
                            </span>
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
          <div className="lg:col-span-9">
            {selectedLesson ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
                {/* Lesson Header */}
                <div className="p-6 border-b border-gray-100 bg-white">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 font-['Poppins']">
                    {selectedLesson.title}
                  </h2>
                  {selectedLesson.description && (
                    <p className="text-sm text-gray-500 mt-2 font-['Poppins'] leading-relaxed max-w-3xl">
                      {selectedLesson.description}
                    </p>
                  )}
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 px-2 pt-2 scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all font-['Poppins'] border-b-2 rounded-t-lg ${activeTab === 'materials'
                      ? 'text-blue-600 border-blue-600 bg-white shadow-sm'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100/50'
                      }`}
                  >
                    <BookMarked className="w-4 h-4" />
                    <span>Materi ({selectedLesson.materials?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('quests')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all font-['Poppins'] border-b-2 rounded-t-lg ${activeTab === 'quests'
                      ? 'text-blue-600 border-blue-600 bg-white shadow-sm'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100/50'
                      }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Quest & Hasil ({questStats.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('questions')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all font-['Poppins'] border-b-2 rounded-t-lg ${activeTab === 'questions'
                      ? 'text-blue-600 border-blue-600 bg-white shadow-sm'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100/50'
                      }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Analisis Soal</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Materials Tab */}
                  {activeTab === 'materials' && (
                    <div className="space-y-4">
                      {selectedLesson.materials?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                          <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-gray-500 font-['Poppins']">Belum ada materi untuk sub bab ini</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {selectedLesson.materials?.map((material) => (
                            <div
                              key={material.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all group"
                            >
                              <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors shrink-0 w-fit">
                                {getMaterialIcon(material.material_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 font-['Poppins'] text-base truncate">
                                  {material.title}
                                </h4>
                                {material.description && (
                                  <p className="text-sm text-gray-500 mt-1 font-['Poppins'] line-clamp-2">
                                    {material.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-3">
                                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 capitalize font-['Poppins']">
                                    {material.material_type}
                                  </span>
                                </div>
                              </div>
                              {material.file_url && (
                                <a
                                  href={material.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-colors font-['Poppins'] sm:w-auto w-full mt-4 sm:mt-0 shrink-0"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span>Buka Materi</span>
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
                    <div className="space-y-8">
                      {questStats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                          <Target className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-gray-500 font-['Poppins']">Belum ada quest untuk sub bab ini</p>
                        </div>
                      ) : (
                        <>
                          {/* Quest Cards */}
                          <div className="grid gap-6">
                            {questStats.map((quest) => (
                              <div key={quest.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600">
                                      <Target className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900 font-['Poppins'] text-lg">{quest.title}</h4>
                                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 font-['Poppins']">
                                        <Award className="w-4 h-4" />
                                        <span>Min Nilai Lulus: <strong className="text-gray-700">{quest.min_score_to_pass || quest.min_points || 60}%</strong></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-6">
                                  {/* Stats Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
                                      <p className="text-3xl font-semibold text-blue-600 font-['Poppins'] mb-1">
                                        {quest.completedStudents}<span className="text-lg text-blue-400">/{quest.totalStudents}</span>
                                      </p>
                                      <p className="text-xs font-medium text-blue-800 uppercase tracking-wide font-['Poppins']">Mengerjakan</p>
                                    </div>
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
                                      <p className="text-3xl font-semibold text-emerald-600 font-['Poppins'] mb-1">{quest.passedStudents}</p>
                                      <p className="text-xs font-medium text-emerald-800 uppercase tracking-wide font-['Poppins']">Lulus</p>
                                    </div>
                                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-center">
                                      <p className="text-3xl font-semibold text-rose-600 font-['Poppins'] mb-1">{quest.failedStudents}</p>
                                      <p className="text-xs font-medium text-rose-800 uppercase tracking-wide font-['Poppins']">Tidak Lulus</p>
                                    </div>
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center">
                                      <p className="text-3xl font-semibold text-amber-600 font-['Poppins'] mb-1">{quest.avgScore}%</p>
                                      <p className="text-xs font-medium text-amber-800 uppercase tracking-wide font-['Poppins']">Rata-rata</p>
                                    </div>
                                  </div>

                                  {/* Score Range */}
                                  <div className="flex items-center justify-between text-sm bg-gray-50 border border-gray-100 rounded-xl p-4">
                                    <div className="text-center w-20">
                                      <p className="text-xs text-gray-500 font-['Poppins'] mb-1">Terendah</p>
                                      <p className="font-semibold text-rose-600 text-lg font-['Poppins']">{quest.lowestScore}%</p>
                                    </div>
                                    <div className="flex-1 mx-6">
                                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                                        <div
                                          className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 transition-all duration-1000 relative"
                                          style={{ width: `${quest.avgScore}%` }}
                                        >
                                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50" />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-center w-20">
                                      <p className="text-xs text-gray-500 font-['Poppins'] mb-1">Tertinggi</p>
                                      <p className="font-semibold text-emerald-600 text-lg font-['Poppins']">{quest.highestScore}%</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Student Best Scores Table */}
                          {studentBestScores.length > 0 && (
                            <div className="mt-8">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h3 className="font-semibold text-gray-900 font-['Poppins'] flex items-center gap-2">
                                  <Award className="w-5 h-5 text-gray-400" />
                                  Nilai Akhir Siswa (Best Score)
                                </h3>
                                <button
                                  onClick={handleSaveReport}
                                  disabled={savingReport}
                                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium font-['Poppins'] text-sm transition-all shadow-sm ${reportSaved
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md border border-transparent'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {savingReport ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Menyimpan...
                                    </>
                                  ) : reportSaved ? (
                                    <>
                                      <Check className="w-4 h-4" />
                                      Tersimpan
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4" />
                                      Simpan ke Laporan
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 font-['Poppins'] text-gray-600">
                                      <tr>
                                        <th className="px-6 py-4 font-semibold text-center w-16">No</th>
                                        <th className="px-6 py-4 font-semibold">Siswa</th>
                                        {questStats.map((quest) => (
                                          <th key={quest.id} className="px-6 py-4 font-semibold text-center min-w-[140px]">
                                            {quest.title}
                                          </th>
                                        ))}
                                        <th className="px-6 py-4 font-semibold text-center bg-blue-50/50 border-l border-gray-100">Rata-rata</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-['Poppins']">
                                      {studentBestScores.map((item, idx) => {
                                        // Calculate average of all best scores
                                        const scores = item.questsArray
                                          .filter(q => q.bestScore !== null)
                                          .map(q => q.bestScore)
                                        const avgScore = scores.length > 0
                                          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                                          : null

                                        return (
                                          <tr key={item.student?.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center text-gray-500 font-medium">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                              <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0 shadow-sm border border-blue-200/50">
                                                  {item.student?.avatar_url ? (
                                                    <img src={item.student.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                  ) : (
                                                    item.student?.full_name?.charAt(0) || '?'
                                                  )}
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="font-semibold text-gray-900 truncate">{item.student?.full_name}</p>
                                                  <p className="text-xs text-gray-500 truncate">{item.student?.email}</p>
                                                </div>
                                              </div>
                                            </td>
                                            {item.questsArray.map((quest) => (
                                              <td key={quest.questId} className="px-6 py-4 text-center">
                                                {quest.bestScore !== null ? (
                                                  <div className="flex flex-col items-center justify-center">
                                                    <span className={`font-semibold text-lg ${quest.passed || quest.bestScore >= quest.minPoints ? 'text-emerald-600' : 'text-rose-600'
                                                      }`}>
                                                      {quest.bestScore}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                      {quest.passed || quest.bestScore >= quest.minPoints ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                      ) : (
                                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                                      )}
                                                      <span className="text-xs text-gray-400 font-medium">
                                                        ({quest.attempts}/{quest.maxAttempts})
                                                      </span>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <span className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 text-xs font-medium">
                                                    Belum dikerjakan
                                                  </span>
                                                )}
                                              </td>
                                            ))}
                                            <td className="px-6 py-4 text-center bg-blue-50/30 border-l border-gray-100">
                                              {avgScore !== null ? (
                                                <span className={`font-semibold text-lg ${avgScore >= 70 ? 'text-emerald-600' :
                                                  avgScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                                                  }`}>
                                                  {avgScore}
                                                </span>
                                              ) : (
                                                <span className="text-gray-300 font-semibold">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Student Attempts Table */}
                          {studentAttempts.length > 0 && (
                            <div className="mt-8">
                              <h3 className="font-semibold text-gray-900 font-['Poppins'] flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-gray-400" />
                                Riwayat Percobaan Siswa
                              </h3>
                              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 font-['Poppins'] text-gray-600">
                                      <tr>
                                        <th className="px-6 py-4 font-semibold">Siswa</th>
                                        <th className="px-6 py-4 font-semibold">Quest</th>
                                        <th className="px-6 py-4 font-semibold text-center">Percobaan</th>
                                        <th className="px-6 py-4 font-semibold text-center">Skor</th>
                                        <th className="px-6 py-4 font-semibold text-center">Status</th>
                                        <th className="px-6 py-4 font-semibold">Waktu</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-['Poppins']">
                                      {studentAttempts.slice(0, 20).map((attempt) => (
                                        <tr key={attempt.id} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold shadow-sm border border-blue-200/50">
                                                {attempt.student?.avatar_url ? (
                                                  <img src={attempt.student.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                  attempt.student?.full_name?.charAt(0) || '?'
                                                )}
                                              </div>
                                              <div>
                                                <p className="font-semibold text-gray-900">{attempt.student?.full_name}</p>
                                                <p className="text-xs text-gray-500">{attempt.student?.email}</p>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-gray-700 font-medium">
                                            <div className="flex items-center gap-2">
                                              <Target className="w-4 h-4 text-gray-400" />
                                              {attempt.quest?.title}
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium text-xs">
                                              {attempt.attempt_number}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                              <span className={`font-semibold text-base ${(attempt.percentage || 0) >= (attempt.quest?.min_points || 60)
                                                ? 'text-emerald-600'
                                                : 'text-rose-600'
                                                }`}>
                                                {Math.round(attempt.percentage || 0)}%
                                              </span>
                                              <span className="text-gray-400 text-xs font-medium mt-0.5">
                                                ({attempt.score}/{attempt.max_score})
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            {attempt.passed ? (
                                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Lulus
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                                                <XCircle className="w-3.5 h-3.5" />
                                                Tidak Lulus
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
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
                                </div>
                                {studentAttempts.length > 20 && (
                                  <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
                                    <p className="text-sm text-gray-500 font-['Poppins']">
                                      Menampilkan 20 dari {studentAttempts.length} percobaan terakhir
                                    </p>
                                  </div>
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
                    <div className="space-y-8">
                      {questionStats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                          <BarChart2 className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-gray-500 font-['Poppins']">Belum ada data analisis soal</p>
                          <p className="text-sm text-gray-400 mt-2 font-['Poppins']">Data akan muncul setelah siswa mengerjakan quest</p>
                        </div>
                      ) : (
                        <>
                          {/* Questions grouped by Quest */}
                          {questionStats.map((questGroup) => (
                            <div key={questGroup.questId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                              {/* Quest Header */}
                              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-blue-600">
                                      <FileQuestion className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-semibold text-gray-900 font-['Poppins'] text-lg">{questGroup.questTitle}</h4>
                                  </div>
                                  <span className="px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold shadow-sm font-['Poppins'] whitespace-nowrap">
                                    {questGroup.questions.length} Soal
                                  </span>
                                </div>

                                {/* Quest Summary Stats */}
                                {questGroup.questions.length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-4 text-sm font-['Poppins'] bg-white p-3 rounded-xl border border-gray-100">
                                    {(() => {
                                      const avgCorrectRate = Math.round(
                                        questGroup.questions.reduce((sum, q) => sum + q.correctRate, 0) / questGroup.questions.length
                                      )
                                      const difficultQuestions = questGroup.questions.filter(q => q.correctRate < 50).length
                                      return (
                                        <>
                                          <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Rata-rata tingkat benar:</span>
                                            <span className={`font-semibold ${avgCorrectRate < 50 ? 'text-rose-600' :
                                              avgCorrectRate < 70 ? 'text-amber-600' :
                                                'text-emerald-600'
                                              }`}>{avgCorrectRate}%</span>
                                          </div>
                                          {difficultQuestions > 0 && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-100">
                                              <AlertTriangle className="w-3.5 h-3.5" />
                                              <span className="font-medium">{difficultQuestions} soal sulit</span>
                                            </div>
                                          )}
                                        </>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>

                              {/* Questions List */}
                              <div className="p-5 space-y-4">
                                {questGroup.questions.map((q, idx) => (
                                  <div
                                    key={q.questionId}
                                    className={`border rounded-2xl p-5 bg-white transition-all hover:shadow-sm ${q.correctRate < 50 ? 'border-rose-200 hover:border-rose-300' :
                                      q.correctRate < 70 ? 'border-amber-200 hover:border-amber-300' :
                                        'border-emerald-200 hover:border-emerald-300'
                                      }`}
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg font-['Poppins'] ${q.correctRate < 50 ? 'bg-rose-100 text-rose-800' :
                                            q.correctRate < 70 ? 'bg-amber-100 text-amber-800' :
                                              'bg-emerald-100 text-emerald-800'
                                            }`}>
                                            Soal #{idx + 1}
                                          </span>
                                          <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg capitalize font-['Poppins']">
                                            {q.questionType.replace('_', ' ')}
                                          </span>
                                          {q.correctRate < 50 && (
                                            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 rounded-lg font-['Poppins']">
                                              <AlertTriangle className="w-3 h-3" />
                                              Perlu Perhatian
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-gray-900 font-medium font-['Poppins'] text-base leading-relaxed">{q.questionText}</p>

                                        <div className="flex flex-wrap gap-4 mt-4 text-sm font-['Poppins']">
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            <span className="font-semibold text-emerald-700">{q.correctAnswers}</span>
                                            <span className="text-emerald-600/80 text-xs uppercase tracking-wider font-semibold">Benar</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50/50 border border-rose-100 rounded-lg">
                                            <XCircle className="w-4 h-4 text-rose-600" />
                                            <span className="font-semibold text-rose-700">{q.wrongAnswers}</span>
                                            <span className="text-rose-600/80 text-xs uppercase tracking-wider font-semibold">Salah</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg">
                                            <Users className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold text-gray-700">{q.totalAnswers}</span>
                                            <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Total</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex flex-col items-center justify-center sm:w-28 shrink-0 py-2 sm:py-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 mt-2 sm:mt-0">
                                        <div className={`text-4xl font-semibold font-['Poppins'] mb-1 ${q.correctRate < 50 ? 'text-rose-600' :
                                          q.correctRate < 70 ? 'text-amber-600' :
                                            'text-emerald-600'
                                          }`}>
                                          {q.correctRate}%
                                        </div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-['Poppins'] text-center">Tingkat Benar</p>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-5 h-2.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                                      <div
                                        className={`h-full transition-all duration-1000 relative ${q.correctRate < 50 ? 'bg-rose-500' :
                                          q.correctRate < 70 ? 'bg-amber-500' :
                                            'bg-emerald-500'
                                          }`}
                                        style={{ width: `${q.correctRate}%` }}
                                      >
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50" />
                                      </div>
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
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[600px] h-full">
                <div className="w-48 h-48 mb-6 opacity-80">
                  <DotLottieReact
                    src="https://lottie.host/f1a7d875-709f-46b2-9fe9-c0eb48511099/bE5mdZ6leU.lottie"
                    loop
                    autoplay
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 font-['Poppins'] mb-2">Belum Ada Sub Bab yang Dipilih</h3>
                <p className="text-gray-500 font-['Poppins'] max-w-md mx-auto">
                  Pilih salah satu sub bab dari daftar di samping kiri untuk melihat materi, quest, dan analisis nilai siswa.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  )
}

export default TeacherClassChapterDetail
