# PARLIO - Platform Gamifikasi Pembelajaran Bahasa Prancis
**Last Updated:** 25 Desember 2025

---

##  RINGKASAN PROJECT

| Item | Detail |
|------|--------|
| **Nama Project** | Parlio |
| **Visi** | Platform gamifikasi pembelajaran bahasa Prancis tingkat SMA |
| **Konsep** | "Menaklukkan Menara Eiffel" (La Conquete de la Tour Eiffel) |
| **Tech Stack** | React 19 + Vite + Tailwind CSS + Supabase |
| **Database** | PostgreSQL (via Supabase) |
| **Storage** | Supabase Storage |
| **Auth** | Supabase Auth |

### Color Scheme
- **Primary:** `#1E258F` (Dark Blue)
- **Backgrounds:** Gray gradients (`bg-gray-50`, `bg-gray-100`)
- **Success:** Green (`bg-green-500`, `bg-green-600`)
- **Error:** Red (`bg-red-500`)
- **Warning:** Amber/Yellow (`bg-amber-500`, `bg-yellow-500`)

---

##  STRUKTUR FILE PROJECT

`
Parlio/
 .env                          # Environment variables (Supabase keys)
 .gitignore
 eslint.config.js
 index.html                    # Entry HTML
 install.ps1                   # PowerShell install script
 package.json
 postcss.config.js
 tailwind.config.js            # Tailwind configuration
 vite.config.js                # Vite configuration
 CURRENT_PROJECT_STRUCTURE.md  # This file
 blueprint/                    # Project blueprint/documentation

 public/
    vite.svg

 src/
    App.css
    App.jsx                   # Main App with React Router
    index.css                 # Global styles + Tailwind imports
    main.jsx                  # React entry point
   
    assets/
       react.svg
       logo/
           1.png             # Logo dark version
           2.png             # Logo light/white version
   
    components/
       CreateClassModal.jsx      # Modal for creating new class
       DashboardLayout.jsx       # Admin dashboard layout
       ProtectedRoute.jsx        # Route guard by role
       StudentLayout.jsx         # Student pages layout (sidebar + bottom nav)
       TeacherLayout.jsx         # Teacher pages layout
       UserFormModal.jsx         # User creation/edit modal
       UserInfoHeader.jsx        # User stats header (XP, coins) - NEW
       UserTable.jsx             # Admin user management table
   
    lib/
       adminApi.js               # Admin API functions
       supabaseClient.js         # Supabase client initialization
       teacherMenuItems.js       # Teacher sidebar menu config
       uploadHelper.js           # File upload utilities
   
    pages/
       
        # Auth & Landing
        LandingPage.jsx           # Public landing page
        LoginPage.jsx             # Login page
       
        # Admin Pages
        DashboardPage.jsx         # Admin main dashboard
        AdminContent.jsx          # Content management
        AdminMonitoring.jsx       # System monitoring
        AdminUsers.jsx            # User management
       
        # Super Admin Pages
        SuperAdminDashboard.jsx           # Super admin dashboard
        SuperAdminAnnouncements.jsx       # Global announcements
        SuperAdminMotivationalMessages.jsx # Motivational messages
       
        # Teacher Pages (11 files)
        TeacherDashboard.jsx      # Teacher main dashboard
        TeacherClasses.jsx        # Teacher's class list
        TeacherClassDetail.jsx    # Class detail (students, chapters)
        TeacherChapterDetail.jsx  # Chapter detail (lessons)
        TeacherLessonDetail.jsx   # Lesson detail (materials, quests)
        TeacherQuestBuilder.jsx   # Quest builder (create/edit quest)
        TeacherQuestQuestions.jsx # Quest questions management
        TeacherLeaderboard.jsx    # Class leaderboard
        TeacherReports.jsx        # Reports & analytics
        TeacherReward.jsx         # Reward management
        TeacherAccount.jsx        # Teacher profile settings
       
        # Student Pages (13 files)
        StudentDashboard.jsx          # Student main dashboard
        StudentClasses.jsx            # Student's joined classes
        StudentClassChapters.jsx      # Class detail (5 tabs)
        StudentChapterDetail.jsx      # Chapter detail (lessons list)
        StudentLessonDetail.jsx       # Lesson detail (materials + quest)
        StudentQuestDetail.jsx        # Quest taking UI (sidebar timer)
        StudentQuestResult.jsx        # Quest result page
        StudentQuestAnswersDetail.jsx # Quest answer review
        StudentLeaderboard.jsx        # Global leaderboard
        StudentProfile.jsx            # Profile & achievements
        StudentReward.jsx             # Reward shop
        StudentTestingPanel.jsx       # Dev testing panel

 supabase/
     update_new_schema.sql                           # Main database schema
     migration_add_material_id_to_quests.sql         # Quest-material relation
     migration_class_forum.sql                       # Class forum feature
     migration_quest_points_and_material_description.sql # Quest points & material desc
    
     functions/
         admin-users/
             index.ts              # Edge function for admin user management
`

---

##  DATABASE SCHEMA

### Core Tables
| Table | Kolom Utama | Deskripsi |
|-------|-------------|-----------|
| `profiles` | id, full_name, email, role, avatar_url, xp_points, coins | User profiles |
| `classes` | id, teacher_id, class_name, class_code, description | Kelas guru |
| `class_members` | class_id, student_id, joined_at | Siswa-kelas relationship |
| `chapters` | id, teacher_id, title, description, order_index | Bab pembelajaran |
| `class_chapters` | class_id, chapter_id, assigned_at | Assignment chapter ke kelas |
| `lessons` | id, chapter_id, title, order_index | Sub-bab/lesson |
| `lesson_materials` | id, lesson_id, title, type, content, description | Materi (video/pdf/text/link) |

### Quest System
| Table | Kolom Utama | Deskripsi |
|-------|-------------|-----------|
| `quests` | id, material_id, title, xp_reward, coin_reward, time_limit, points_per_question | Quest definition |
| `quest_questions` | id, quest_id, question_text, question_type, options, correct_answer | Soal quest |
| `student_quest_attempts` | id, quest_id, student_id, score, xp_earned, coins_earned, completed_at | Attempt record |
| `user_answers` | id, attempt_id, question_id, user_answer, is_correct, points_earned | Jawaban siswa |

### Progress & Social
| Table | Kolom Utama | Deskripsi |
|-------|-------------|-----------|
| `student_chapter_progress` | student_id, chapter_id, completed | Progress chapter |
| `student_lesson_progress` | student_id, lesson_id, completed | Progress lesson |
| `class_announcements` | id, class_id, title, content, is_pinned | Pengumuman kelas |
| `class_forum_posts` | id, class_id, author_id, content, parent_id | Forum diskusi |

### Admin/System
| Table | Kolom Utama | Deskripsi |
|-------|-------------|-----------|
| `announcements` | id, title, content, is_active, start_date, end_date | Pengumuman global |
| `motivational_messages` | id, message, author, is_active | Pesan motivasi carousel |

---

##  ROUTES (App.jsx)

### Public Routes
| Path | Component | Deskripsi |
|------|-----------|-----------|
| `/` | LandingPage | Public landing page |
| `/login` | LoginPage | Login semua role |

### Admin Routes (`/admin/*`)
| Path | Component | Deskripsi |
|------|-----------|-----------|
| `/admin/dashboard` | DashboardPage | Admin dashboard |
| `/admin/users` | AdminUsers | User management |
| `/admin/content` | AdminContent | Content management |
| `/admin/monitoring` | AdminMonitoring | System monitoring |

### Super Admin Routes (`/superadmin/*`)
| Path | Component | Deskripsi |
|------|-----------|-----------|
| `/superadmin/dashboard` | SuperAdminDashboard | Super admin dashboard |
| `/superadmin/announcements` | SuperAdminAnnouncements | Pengumuman global |
| `/superadmin/motivational` | SuperAdminMotivationalMessages | Pesan motivasi |

### Teacher Routes (`/teacher/*`)
| Path | Component | Deskripsi |
|------|-----------|-----------|
| `/teacher/dashboard` | TeacherDashboard | Teacher dashboard |
| `/teacher/classes` | TeacherClasses | Daftar kelas |
| `/teacher/class/:classId` | TeacherClassDetail | Detail kelas |
| `/teacher/chapter/:chapterId` | TeacherChapterDetail | Detail chapter |
| `/teacher/lesson/:lessonId` | TeacherLessonDetail | Detail lesson |
| `/teacher/quest/:questId` | TeacherQuestBuilder | Quest builder |
| `/teacher/quest/:questId/questions` | TeacherQuestQuestions | Kelola soal |
| `/teacher/leaderboard` | TeacherLeaderboard | Leaderboard |
| `/teacher/reports` | TeacherReports | Laporan |
| `/teacher/reward` | TeacherReward | Reward |
| `/teacher/account` | TeacherAccount | Akun |

### Student Routes (`/student/*`)
| Path | Component | Deskripsi |
|------|-----------|-----------|
| `/student/dashboard` | StudentDashboard | Student dashboard |
| `/student/chapters` | StudentClasses | Daftar kelas siswa |
| `/student/class/:classId` | StudentClassChapters | Detail kelas (5 tabs) |
| `/student/chapters/:chapterId` | StudentChapterDetail | Detail chapter |
| `/student/lesson/:lessonId` | StudentLessonDetail | Detail lesson + materi |
| `/student/quest/:questId` | StudentQuestDetail | Mengerjakan quest |
| `/student/quest-result` | StudentQuestResult | Hasil quest |
| `/student/leaderboard` | StudentLeaderboard | Leaderboard global |
| `/student/reward` | StudentReward | Reward shop |
| `/student/profile` | StudentProfile | Profil siswa |
| `/student/testing` | StudentTestingPanel | Testing panel (dev) |

---

##  STUDENT QUEST FLOW

`
StudentClasses (Daftar Kelas)
        UserInfoHeader (XP, Coins)
    
StudentClassChapters (Detail Kelas)
     Tab: Pelajaran (chapters list)
     Tab: Pengumuman (pinned  first)
     Tab: Anggota (class members)
     Tab: Leaderboard (class ranking)
     Tab: Forum (discussions)
    
StudentChapterDetail (Daftar Lessons)
    
StudentLessonDetail (Materi)
        Material List
        MaterialPreviewModal
            Description
            Preview (video/pdf/text)
            "Kerjakan Quest" button
    
QuestConfirmModal (Konfirmasi)
     Quest Info (soal, waktu, reward)
     Attempt History (collapsible)
     "Kerjakan" button
    
StudentQuestDetail (Mengerjakan Quest)
     Desktop: Sidebar (timer + question nav)
     Mobile: Fixed header timer + bottom nav
     One question per page
    
StudentQuestResult (Hasil Quest)
     User Info (glassmorphism)
     Score & Status (LULUS/GAGAL)
     Reward Status (XP/Coins atau alasan)
     Answer Details (toggle)
     Action buttons
`

---

##  FITUR YANG SUDAH DIIMPLEMENTASI

### Super Admin
-  Dashboard statistik
-  User Management (CRUD)
-  Global Announcements (carousel)
-  Motivational Messages

### Guru
-  TeacherLayout (sidebar navigation)
-  Dashboard dengan statistik
-  Kelola Kelas (create, delete, class code)
-  Class Detail (students, chapters)
-  Quest Builder (chapters  lessons  materials  quests)
-  Quest Questions (CRUD, multiple types)
-  Material Management (video, pdf, text, link + description)
-  Quest Point System (per question points)

### Siswa
-  StudentLayout (sidebar + bottom nav)
-  UserInfoHeader (XP, coins, avatar)
-  Dashboard (stats, recent activities)
-  Join class dengan code
-  Class Detail (5 tabs)
-  Material Preview Modal dengan description
-  Quest Confirmation Modal + History
-  Quest Taking (sidebar timer, one question per page)
-  Quest Result (score, rewards, answer review)
-  Pinned Announcements
-  Navigation unlocked (Leaderboard, Reward, Profile)

---

##  RECENT UPDATES (25 Desember 2025)

1. **UserInfoHeader Component** - Komponen reusable untuk header user (avatar, XP, coins)
2. **Quest Attempt History** - Dipindahkan ke QuestConfirmModal untuk UX lebih baik
3. **Navigation Fixes** - Back navigation proper menggunakan location state
4. **Pinned Announcements** - Visual indicator  untuk pengumuman disematkan
5. **Unlocked Menus** - Semua menu student navigation sudah aktif
6. **Glassmorphism UI** - `bg-white/10 backdrop-blur-sm` di quest result
7. **Route Path Fixes** - Konsisten `/student/chapters/:id` paths

---

##  INSTALASI & MENJALANKAN

### Requirements
- Node.js v20+ LTS
- npm v10+
- Supabase account

### Setup
`bash
# 1. Clone/Extract project
cd "d:\Project Adnan\Parlio"

# 2. Install dependencies
npm install

# 3. Setup .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. Run dev server
npm run dev

# 5. Open http://localhost:5173
`

---

##  TODO / FITUR MENDATANG

### Prioritas Tinggi
- [ ] Visualisasi Menara Eiffel (gamifikasi UI)
- [ ] Misi Harian (daily missions)
- [ ] Toko Suvenir (spend coins)
- [ ] Badges System
- [ ] Export laporan Excel

### Prioritas Medium
- [ ] Profile achievements gallery
- [ ] Push notifications
- [ ] Combat de Boss (chapter final quest)
- [ ] Question bank/library
- [ ] Bulk question import

### Prioritas Low
- [ ] Dark mode
- [ ] Multi-language
- [ ] Mobile app (React Native)

---

**Status:** Development (~65% complete)  
**Maintained by:** AI Assistant (GitHub Copilot)  
** Let's build Parlio!**
