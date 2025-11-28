# PARLIO - Platform Gamifikasi Pembelajaran Bahasa Prancis

##  RINGKASAN PROJECT

**Nama Project:** Parlio  
**Visi:** Platform gamifikasi utama untuk pembelajaran bahasa Prancis di tingkat SMA  
**Konsep Gamifikasi:** "Menaklukkan Menara Eiffel" (La Conquête de la Tour Eiffel)  
**Tech Stack:** React 18 + Vite 7 + Tailwind CSS + Supabase  
**Database:** PostgreSQL (via Supabase)  
**Storage:** Supabase Storage  
**Authentication:** Supabase Auth

---

##  DATABASE SCHEMA

### 1. **profiles** (User Profiles)
```sql
- id: UUID (PK, references auth.users)
- email: VARCHAR
- full_name: VARCHAR
- role: VARCHAR (siswa, guru, admin)
- avatar_url: VARCHAR
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 2. **student_stats** (Student Gamification Stats)
```sql
- id: UUID (PK)
- student_id: UUID (FK -> profiles.id)
- xp: INT (Experience Points)
- level: INT (Player Level)
- coins: INT (Virtual Currency - Écus)
- current_streak: INT (Login Streak Days)
- longest_streak: INT
- last_login: DATE
- total_quests_completed: INT
- total_time_spent: INT (in minutes)
- accuracy_rate: DECIMAL
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 3. **classes** (Kelas yang dibuat Guru)
```sql
- id: UUID (PK)
- teacher_id: UUID (FK -> profiles.id)
- class_name: VARCHAR
- class_code: VARCHAR (UNIQUE, auto-generated)
- description: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 4. **class_members** (Siswa yang bergabung di Kelas)
```sql
- id: UUID (PK)
- class_id: UUID (FK -> classes.id)
- student_id: UUID (FK -> profiles.id)
- joined_at: TIMESTAMPTZ
```

### 5. **chapters** (Bab/Lantai Menara Eiffel)
```sql
- id: UUID (PK)
- teacher_id: UUID (FK -> profiles.id)
- title: VARCHAR
- description: TEXT
- order_index: INT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 6. **class_chapters** (Assignment Chapter ke Kelas)
```sql
- id: UUID (PK)
- class_id: UUID (FK -> classes.id)
- chapter_id: UUID (FK -> chapters.id)
- assigned_at: TIMESTAMPTZ
```

### 7. **lessons** (Sub-bab/Ruangan di Lantai)
```sql
- id: UUID (PK)
- chapter_id: UUID (FK -> chapters.id)
- title: VARCHAR
- content: TEXT (materi pembelajaran)
- order_index: INT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 8. **quests** (Kuis/Tantangan di Lesson)
```sql
- id: UUID (PK)
- lesson_id: UUID (FK -> lessons.id)
- title: VARCHAR
- description: TEXT
- xp_reward: INT
- coin_reward: INT
- passing_score: INT
- time_limit: INT (in seconds, nullable)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 9. **quest_questions** (Soal-soal di Quest)
```sql
- id: UUID (PK)
- quest_id: UUID (FK -> quests.id)
- question_text: TEXT
- question_type: VARCHAR (multiple_choice, essay, fill_blank, matching)
- options: JSONB (untuk pilihan ganda)
- correct_answer: TEXT
- points: INT
- order_index: INT
- created_at: TIMESTAMPTZ
```

### 10. **quest_attempts** (Percobaan siswa mengerjakan Quest)
```sql
- id: UUID (PK)
- quest_id: UUID (FK -> quests.id)
- student_id: UUID (FK -> profiles.id)
- score: INT
- total_questions: INT
- correct_answers: INT
- xp_earned: INT
- coins_earned: INT
- completed: BOOLEAN
- started_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
```

### 11. **quest_answers** (Jawaban siswa per soal)
```sql
- id: UUID (PK)
- attempt_id: UUID (FK -> quest_attempts.id)
- question_id: UUID (FK -> quest_questions.id)
- student_answer: TEXT
- is_correct: BOOLEAN
- points_earned: INT
- answered_at: TIMESTAMPTZ
```

### 12. **student_progress** (Progress siswa per Lesson)
```sql
- id: UUID (PK)
- student_id: UUID (FK -> profiles.id)
- lesson_id: UUID (FK -> lessons.id)
- completed: BOOLEAN
- completed_at: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

---

## 📁 STRUKTUR FILE PROJECT

```
Parlio/
├── public/
│   └── vite.svg
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Root component with routing
│   ├── index.css                   # Global Tailwind styles
│   │
│   ├── assets/
│   │   └── react.svg
│   │
│   ├── lib/
│   │   ├── supabaseClient.js       # Supabase initialization
│   │   ├── adminApi.js             # Admin CRUD functions
│   │   └── uploadHelper.js         # File upload utilities
│   │
│   ├── components/
│   │   ├── DashboardLayout.jsx     # Layout wrapper dengan sidebar
│   │   ├── ProtectedRoute.jsx      # Route guard by role
│   │   ├── CreateClassModal.jsx    # Modal buat kelas baru
│   │   ├── UserFormModal.jsx       # Modal add/edit user (admin)
│   │   └── UserTable.jsx           # Table user management
│   │
│   └── pages/
│       ├── LandingPage.jsx         # Public landing page
│       ├── LoginPage.jsx           # Login semua role
│       │
│       ├── SuperAdminDashboard.jsx # Admin dashboard
│       ├── AdminUsers.jsx          # User management (CRUD)
│       ├── AdminMonitoring.jsx     # Monitoring & logs
│       ├── AdminContent.jsx        # Content moderation
│       │
│       ├── TeacherDashboard.jsx    # Guru dashboard
│       ├── TeacherClasses.jsx      # Kelola kelas
│       ├── TeacherClassDetail.jsx  # Detail kelas + tabs
│       ├── TeacherQuestBuilder.jsx # List chapters
│       ├── TeacherChapterDetail.jsx# List lessons in chapter
│       ├── TeacherLessonDetail.jsx # Edit lesson + list quests
│       └── TeacherQuestQuestions.jsx # Edit quest questions
│       │
│       ├── StudentDashboard.jsx    # Siswa dashboard
│       └── StudentClasses.jsx      # Kelas siswa + join class
│
├── supabase/
│   ├── schema.sql                  # Main database schema
│   ├── schema_quest_system.sql     # Quest system tables
│   ├── storage_setup.sql           # Storage buckets setup
│   └── functions/
│       └── admin-users/
│           └── index.ts            # Edge function untuk admin
│
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## ✅ FITUR YANG SUDAH DIIMPLEMENTASI

### **Super Admin:**
- ✅ Dashboard dengan statistik (total users by role)
- ✅ User Management (CRUD siswa & guru)
- ✅ Tambah user manual (form)
- ✅ Edit user (nama, email, role)
- ✅ Reset password user
- ✅ Delete user
- ✅ Search & filter users
- ⚠️ Monitoring page (struktur ada, konten belum lengkap)

### **Guru:**
- ✅ **Custom TeacherLayout** - Layout khusus dengan sidebar navigation sesuai blueprint
- ✅ **Navigasi Sidebar** dengan menu:
  - Dashboard
  - Kelola Kelas
  - Quest Builder
  - Leaderboard (Coming Soon)
  - Reward (Coming Soon)
  - Laporan (Coming Soon)
  - Akun (Coming Soon)
- ✅ Dashboard dengan statistik:
  - Total kelas yang diajar
  - Total siswa di semua kelas
  - Total chapters dibuat
  - Total quests dibuat
  - Recent classes (5 terbaru)
  - Quick Actions (Kelola Kelas, Konten, Quest Builder, Monitoring)
  - Recent Activities
- ✅ Kelola Kelas:
  - List semua kelas
  - Buat kelas baru (auto-generate class_code)
  - Detail kelas (tab Siswa)
  - Lihat daftar siswa di kelas
  - Hapus kelas
- ✅ Quest Builder:
  - List chapters
  - Create chapter
  - Edit chapter (title, description)
  - Delete chapter
  - View lessons in chapter
  - Create lesson
  - Edit lesson
  - Delete lesson
  - Assign chapter to class
- ✅ Quest Questions:
  - List questions in quest
  - Add question (multiple choice, essay, fill blank, matching)
  - Edit question
  - Delete question
  - Set correct answer & points
- ✅ **Placeholder Pages** untuk fitur coming soon:
  - Leaderboard page
  - Reward page
  - Reports page
  - Account page

### **Siswa:**
- ✅ Dashboard:
  - XP, Level, Coins display
  - Current streak
  - Stats overview (quests completed, accuracy rate)
  - Recent quests
- ✅ Kelas:
  - Join kelas dengan class code
  - View enrolled classes
  - Leave class
  - Basic class info

### **Authentication:**
- ✅ Login semua role
-  Role-based routing
-  Protected routes
-  Logout

---

##  SISTEM GAMIFIKASI (SUDAH ADA)

### **XP (Experience Points):**
- Didapat dari menjawab soal dengan benar
- Digunakan untuk naik level
- Formula: `xp_needed = level * 100`

### **Level:**
- Naik otomatis saat XP mencapai threshold
- Display di profile siswa

### **Coins (Écus):**
- Mata uang virtual
- Didapat dari menyelesaikan quest
- **Belum ada**: Toko Suvenir untuk belanjakan coins

### **Streak:**
- Hitung hari login berturut-turut
- `current_streak` di student_stats
- **Belum ada**: Reward streak bonus

### **Leaderboard:**
- Database sudah support (query by XP)
- **Belum ada**: Halaman UI untuk siswa & guru

---

##  INSTALASI & MENJALANKAN PROJECT

### **Requirements:**
- Node.js v20 LTS (recommended, saat ini pakai v24 experimental)
- npm v10+
- Supabase account

### **Setup:**
```bash
# 1. Clone/Extract project
cd "d:\Personal Project\Parlio"

# 2. Install dependencies
npm install

# 3. Setup environment variables
# Buat file .env di root dengan:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. Run development server
npm run dev

# 5. Open browser
# http://localhost:5173
```

### **Database Setup:**
1. Buat project di Supabase
2. Jalankan SQL di `supabase/schema.sql`
3. Jalankan SQL di `supabase/schema_quest_system.sql`
4. Jalankan SQL di `supabase/storage_setup.sql`
5. Setup RLS policies sesuai kebutuhan

---

##  RECENT UPDATES (2025-01-24)

### ✅ **Fixed: Teacher Navigation Issue**
- **Problem**: Halaman guru menggunakan DashboardLayout yang tidak memiliki menu navigasi yang sesuai
- **Solution**: 
  - Created `TeacherLayout.jsx` - Layout khusus untuk guru dengan sidebar navigation
  - Updated semua halaman guru untuk menggunakan `TeacherLayout`
  - Menu navigasi sesuai blueprint: Dashboard, Kelola Kelas, Quest Builder, Leaderboard, Reward, Laporan, Akun
  - Mobile-responsive dengan hamburger menu
  - Added placeholder pages untuk fitur coming soon
  - Routes terintegrasi di App.jsx

### ✅ **Component Structure Improvement**
- All teacher pages now use consistent `TeacherLayout`
- Removed redundant `teacherMenuItems` arrays from individual pages
- Centralized navigation logic in `TeacherLayout` component
- Clean separation: `DashboardLayout` untuk Admin, `TeacherLayout` untuk Guru

##  KNOWN ISSUES

### **Bug yang Perlu Diperbaiki:**
1. **StudentClasses.jsx line 301**: `classItem.name` should be `classItem.class_name`
   - Impact: Leave class confirmation shows undefined
   - Fix: Single line replacement
   - Status: ⏳ Pending

### **Potential Issues:**
2. **Node.js v24.10.0**: Experimental version, may cause package conflicts
   - Recommendation: Downgrade to Node.js v20 LTS
   - Status: ⚠️ Monitor

---

##  TODO / FITUR YANG BELUM ADA

### **PRIORITAS TINGGI (Sesuai Blueprint):**

#### **Super Admin:**
- [ ] Kontrol Fitur (Feature Flags) - toggle fitur on/off
- [ ] Mode Maintenance - tutup akses sementara
- [ ] Grafik aktivitas server
- [ ] Unggah Massal User (CSV/Excel import)
- [ ] Real-time Activity Logs
- [ ] Security Logs (failed login attempts)

#### **Guru:**
- [ ] **Leaderboard Page** - lihat ranking XP (filter per kelas)
- [ ] **Reward Page** - berikan reward manual ke siswa
- [ ] **Laporan Page** - generate & export Excel
- [ ] Tab Statistik Performa di detail kelas
- [ ] Tab Penugasan (Assigned Chapters) di detail kelas
- [ ] Tab Pengumuman di detail kelas
- [ ] Feed Notifikasi di dashboard
- [ ] Widget "Siswa Perlu Perhatian"
- [ ] **Tab Materi** di Lesson (rich text editor + upload PDF/image/audio/video)
- [ ] **Tab Rules** di Lesson (set XP reward, coin reward, passing score)
- [ ] Bulk question import (CSV)
- [ ] Question bank/library

#### **Siswa:**
- [ ] **Visualisasi Menara Eiffel** (UI gamifikasi utama!)
- [ ] **Misi Harian** (daily missions + progress tracking)
- [ ] **Leaderboard Page** (filter: kelas saya / seluruh sekolah)
- [ ] **Toko Suvenir (Boutique de Souvenirs)** - belanjakan coins
- [ ] **Profile Page** (galeri badges, statistik personal, settings)
- [ ] **Lesson Viewer** (tab Materi + tab Quest)
- [ ] **Quest Taking Interface** (antarmuka interaktif kuis)
- [ ] Feed Pengumuman dari Guru
- [ ] Combat de Boss (quest khusus akhir chapter)
- [ ] Instant feedback saat jawab soal
- [ ] Progress bar per chapter

### **PRIORITAS MEDIUM:**

#### **Badges System:**
- [ ] Database table: `badges`, `student_badges`
- [ ] Define badges (Roi de la Conjugaison, etc.)
- [ ] Auto-award badges based on achievements
- [ ] Display badges di profile

#### **Daily Missions:**
- [ ] Database table: `daily_missions`, `student_missions`
- [ ] Mission templates (complete 3 quests, answer 10 questions, etc.)
- [ ] Daily reset mechanism
- [ ] Progress tracking
- [ ] Reward distribution

#### **Shop Items:**
- [ ] Database table: `shop_items`, `student_items`
- [ ] Avatar frames (bingkai avatar)
- [ ] Profile themes
- [ ] Purchase system
- [ ] Inventory management

#### **Announcements:**
- [ ] Database table: `announcements`
- [ ] Create announcement (guru)
- [ ] View announcements (siswa)
- [ ] Notification system

#### **Lesson Materials:**
- [ ] Database table: `lesson_materials`
- [ ] Rich text editor (TipTap / Quill)
- [ ] Upload PDF, image, audio, video to Supabase Storage
- [ ] Material viewer untuk siswa

### **PRIORITAS LOW:**

- [ ] Export laporan PDF
- [ ] Email notifications
- [ ] Push notifications
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Accessibility improvements
- [ ] Mobile app (React Native)

---

##  CODE CONVENTIONS & BEST PRACTICES

### **Naming Conventions:**
- **Components**: PascalCase (`DashboardLayout.jsx`)
- **Functions**: camelCase (`fetchDashboardData`)
- **Constants**: UPPER_SNAKE_CASE (`SUPABASE_URL`)
- **Files**: PascalCase for components, camelCase for utilities

### **Database:**
- Table names: lowercase plural (`classes`, `quests`)
- Column names: snake_case (`class_name`, `created_at`)
- Foreign keys: `{table}_id` (`teacher_id`, `student_id`)
- Primary keys: `id` (UUID)

### **React Patterns:**
- Functional components with hooks
- useState for local state
- useEffect for side effects
- useNavigate for routing
- Custom hooks in `/lib` if needed

### **Supabase Queries:**
- Use `select()` with specific columns
- Use `eq()`, `in()`, `order()` for filtering
- Use `single()` for single row
- Use `maybeSingle()` if row might not exist
- Always handle errors with try/catch

### **Styling:**
- Tailwind CSS utility classes
- Responsive design (mobile-first)
- Consistent color scheme:
  - Primary: Blue (`bg-blue-600`)
  - Success: Green (`bg-green-600`)
  - Warning: Yellow (`bg-yellow-600`)
  - Danger: Red (`bg-red-600`)

---

##  ENVIRONMENT VARIABLES

Create `.env` file di root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Access dalam code:
```javascript
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

---

##  REFERENSI & RESOURCES

### **Documentation:**
- React: https://react.dev
- Vite: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com
- Supabase: https://supabase.com/docs

### **Libraries Used:**
- `react` v18.3.1
- `react-dom` v18.3.1
- `react-router-dom` v7.1.1
- `@supabase/supabase-js` v2.49.2
- `tailwindcss` v4.0.0
- `vite` v7.1.12

### **Project Links:**
- Blueprint: `d:\Personal Project\Parlio\blueprint`
- Database Schema: `d:\Personal Project\Parlio\supabase/schema.sql`

---

##  PROJECT STATUS

**Current Phase:** Development  
**Completion:** ~45% (core features + teacher navigation implemented)  
**Next Priority:** 
1. ✅ Teacher Navigation (COMPLETED)
2. Implement remaining teacher features (Leaderboard, Reward, Reports)
3. Visualisasi Menara Eiffel untuk siswa
4. Lesson Viewer + Quest Taking Interface
5. Badges & Daily Missions System

**Last Updated:** 2025-01-24  
**Maintained by:** AI Assistant (GitHub Copilot)

---

** FOKUS UTAMA NEXT SPRINT:**
1. Visualisasi Menara Eiffel (student class view)
2. Lesson Viewer + Quest Taking Interface
3. Leaderboard untuk Guru & Siswa
4. Tab Materi di Lesson Builder
5. Badges & Daily Missions System

** Let's build Parlio!**
