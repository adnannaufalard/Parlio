import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminAnnouncements from './pages/SuperAdminAnnouncements'
import SuperAdminMotivationalMessages from './pages/SuperAdminMotivationalMessages'
import TeacherDashboard from './pages/TeacherDashboard'
import TeacherClasses from './pages/TeacherClasses'
import TeacherClassDetail from './pages/TeacherClassDetail'
import TeacherQuestBuilder from './pages/TeacherQuestBuilder'
import TeacherChapterDetail from './pages/TeacherChapterDetail'
import TeacherLessonDetail from './pages/TeacherLessonDetail'
import TeacherQuestQuestions from './pages/TeacherQuestQuestions'
import TeacherLeaderboard from './pages/TeacherLeaderboard'
import TeacherReward from './pages/TeacherReward'
import TeacherReports from './pages/TeacherReports'
import TeacherAccount from './pages/TeacherAccount'
import StudentDashboard from './pages/StudentDashboard'
import StudentClasses from './pages/StudentClasses'
import StudentClassChapters from './pages/StudentClassChapters'
import StudentChapterDetail from './pages/StudentChapterDetail'
import StudentLessonDetail from './pages/StudentLessonDetail'
import StudentQuestDetail from './pages/StudentQuestDetail'
import StudentQuestResult from './pages/StudentQuestResult'
import StudentQuestAnswersDetail from './pages/StudentQuestAnswersDetail'
import StudentLeaderboard from './pages/StudentLeaderboard'
import StudentReward from './pages/StudentReward'
import StudentProfile from './pages/StudentProfile'
import StudentTestingPanel from './pages/StudentTestingPanel'
import AdminUsers from './pages/AdminUsers'
import AdminContent from './pages/AdminContent'
import AdminMonitoring from './pages/AdminMonitoring'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminAnnouncements /></ProtectedRoute>} />
        <Route path="/admin/motivational-messages" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminMotivationalMessages /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminContent /></ProtectedRoute>} />
        <Route path="/admin/monitoring" element={<ProtectedRoute allowedRoles={['superadmin']}><AdminMonitoring /></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['guru']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['guru']}><TeacherClasses /></ProtectedRoute>} />
        <Route path="/teacher/classes/:id" element={<ProtectedRoute allowedRoles={['guru']}><TeacherClassDetail /></ProtectedRoute>} />
        <Route path="/teacher/quest-builder" element={<ProtectedRoute allowedRoles={['guru']}><TeacherQuestBuilder /></ProtectedRoute>} />
        <Route path="/teacher/quest-builder/chapter/:chapterId" element={<ProtectedRoute allowedRoles={['guru']}><TeacherChapterDetail /></ProtectedRoute>} />
        <Route path="/teacher/quest-builder/lesson/:lessonId" element={<ProtectedRoute allowedRoles={['guru']}><TeacherLessonDetail /></ProtectedRoute>} />
        <Route path="/teacher/quest-builder/quest/:questId/questions" element={<ProtectedRoute allowedRoles={['guru']}><TeacherQuestQuestions /></ProtectedRoute>} />
        <Route path="/teacher/leaderboard" element={<ProtectedRoute allowedRoles={['guru']}><TeacherLeaderboard /></ProtectedRoute>} />
        <Route path="/teacher/reward" element={<ProtectedRoute allowedRoles={['guru']}><TeacherReward /></ProtectedRoute>} />
        <Route path="/teacher/reports" element={<ProtectedRoute allowedRoles={['guru']}><TeacherReports /></ProtectedRoute>} />
        <Route path="/teacher/account" element={<ProtectedRoute allowedRoles={['guru']}><TeacherAccount /></ProtectedRoute>} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['siswa']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/chapters" element={<ProtectedRoute allowedRoles={['siswa']}><StudentClasses /></ProtectedRoute>} />
        <Route path="/student/class/:classId" element={<ProtectedRoute allowedRoles={['siswa']}><StudentClassChapters /></ProtectedRoute>} />
        <Route path="/student/chapters/:chapterId" element={<ProtectedRoute allowedRoles={['siswa']}><StudentChapterDetail /></ProtectedRoute>} />
        <Route path="/student/lesson/:lessonId" element={<ProtectedRoute allowedRoles={['siswa']}><StudentLessonDetail /></ProtectedRoute>} />
        <Route path="/student/quest/:questId" element={<ProtectedRoute allowedRoles={['siswa']}><StudentQuestDetail /></ProtectedRoute>} />
        <Route path="/student/quest-result" element={<ProtectedRoute allowedRoles={['siswa']}><StudentQuestResult /></ProtectedRoute>} />
        <Route path="/student/quest-answers/:attemptId" element={<ProtectedRoute allowedRoles={['siswa']}><StudentQuestAnswersDetail /></ProtectedRoute>} />
        <Route path="/student/leaderboard" element={<ProtectedRoute allowedRoles={['siswa']}><StudentLeaderboard /></ProtectedRoute>} />
        <Route path="/student/reward" element={<ProtectedRoute allowedRoles={['siswa']}><StudentReward /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['siswa']}><StudentProfile /></ProtectedRoute>} />
        <Route path="/student/testing" element={<ProtectedRoute allowedRoles={['siswa']}><StudentTestingPanel /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App
