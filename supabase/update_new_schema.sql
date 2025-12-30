-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'announcement'::text,
  color_from text DEFAULT 'from-blue-500'::text,
  color_to text DEFAULT 'to-blue-600'::text,
  icon text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  published_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.assignment_submissions (
  id bigint NOT NULL DEFAULT nextval('assignment_submissions_id_seq'::regclass),
  assignment_id integer,
  student_id uuid,
  content text,
  file_url text,
  points_earned integer DEFAULT 0,
  feedback text,
  status text DEFAULT 'submitted'::text,
  submitted_at timestamp with time zone DEFAULT now(),
  graded_at timestamp with time zone,
  graded_by uuid,
  CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.assignments (
  id integer NOT NULL DEFAULT nextval('assignments_id_seq'::regclass),
  class_id integer,
  module_id integer,
  title text NOT NULL,
  description text,
  type text DEFAULT 'essay'::text,
  max_points integer DEFAULT 100,
  due_date timestamp with time zone,
  is_published boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT assignments_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.badges (
  id integer NOT NULL DEFAULT nextval('badges_id_seq'::regclass),
  badge_name text NOT NULL,
  badge_description text,
  badge_icon_url text,
  badge_type text DEFAULT 'quest'::text,
  requirement_text text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chapters (
  id integer NOT NULL DEFAULT nextval('chapters_id_seq'::regclass),
  title text NOT NULL,
  description text,
  floor_number integer NOT NULL,
  icon text,
  bg_color text DEFAULT '#3B82F6'::text,
  is_published boolean DEFAULT false,
  unlock_xp_required integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chapters_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.class_announcements (
  id integer NOT NULL DEFAULT nextval('class_announcements_id_seq'::regclass),
  class_id integer,
  teacher_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_announcements_pkey PRIMARY KEY (id),
  CONSTRAINT class_announcements_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_announcements_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.class_chapters (
  id integer NOT NULL DEFAULT nextval('class_chapters_id_seq'::regclass),
  class_id integer,
  chapter_id integer,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT class_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT class_chapters_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_chapters_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT class_chapters_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.class_materials (
  id integer NOT NULL DEFAULT nextval('class_materials_id_seq'::regclass),
  class_id integer,
  module_id integer,
  title text NOT NULL,
  description text,
  material_type text,
  file_url text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT class_materials_pkey PRIMARY KEY (id),
  CONSTRAINT class_materials_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_materials_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT class_materials_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.class_members (
  class_id integer NOT NULL,
  student_id uuid NOT NULL,
  CONSTRAINT class_members_pkey PRIMARY KEY (class_id, student_id),
  CONSTRAINT class_members_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT class_members_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.classes (
  id integer NOT NULL DEFAULT nextval('classes_id_seq'::regclass),
  class_name text NOT NULL,
  teacher_id uuid,
  class_code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.lesson_materials (
  id integer NOT NULL DEFAULT nextval('lesson_materials_id_seq'::regclass),
  lesson_id integer,
  title text NOT NULL,
  material_type text NOT NULL,
  file_url text,
  content text,
  material_order integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  CONSTRAINT lesson_materials_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_materials_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT lesson_materials_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.lessons (
  id integer NOT NULL DEFAULT nextval('lessons_id_seq'::regclass),
  chapter_id integer,
  title text NOT NULL,
  description text,
  lesson_order integer NOT NULL,
  content_type text DEFAULT 'mixed'::text,
  estimated_duration integer DEFAULT 30,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  order_number integer DEFAULT 0,
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
);
CREATE TABLE public.modules (
  id integer NOT NULL DEFAULT nextval('modules_id_seq'::regclass),
  title text NOT NULL,
  description text,
  level integer NOT NULL,
  CONSTRAINT modules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.motivational_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT motivational_messages_pkey PRIMARY KEY (id),
  CONSTRAINT motivational_messages_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'siswa'::text,
  xp_points integer DEFAULT 0,
  coins integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  email text,
  avatar_url text,
  level integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.quest_questions (
  id integer NOT NULL DEFAULT nextval('quest_questions_id_seq'::regclass),
  quest_id integer,
  question_id integer,
  question_order integer NOT NULL,
  points_override integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quest_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quest_questions_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id),
  CONSTRAINT quest_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.question_templates (
  id integer NOT NULL DEFAULT nextval('question_templates_id_seq'::regclass),
  template_name text NOT NULL,
  template_type text NOT NULL,
  description text,
  default_points integer DEFAULT 10,
  created_by uuid,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_templates_pkey PRIMARY KEY (id),
  CONSTRAINT question_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.questions (
  id integer NOT NULL DEFAULT nextval('questions_id_seq'::regclass),
  quiz_id integer,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice'::text,
  options jsonb,
  correct_answer text NOT NULL,
  lesson_id integer,
  template_id integer,
  question_audio_url text,
  question_image_url text,
  matching_pairs jsonb,
  difficulty text DEFAULT 'easy'::text,
  topic_tags ARRAY,
  points integer DEFAULT 10,
  explanation text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pairs jsonb,
  correct_order jsonb,
  scrambled_words text,
  audio_url text,
  question_video_url text,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT questions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT questions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.question_templates(id),
  CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.quests (
  id integer NOT NULL DEFAULT nextval('quests_id_seq'::regclass),
  lesson_id integer,
  title text NOT NULL,
  description text,
  quest_type text DEFAULT 'practice'::text,
  xp_reward integer DEFAULT 50,
  coins_reward integer DEFAULT 25,
  badge_id integer,
  difficulty text DEFAULT 'medium'::text,
  min_score_to_pass integer DEFAULT 60,
  max_attempts integer DEFAULT 3,
  time_limit_minutes integer,
  is_published boolean DEFAULT false,
  unlock_previous_required boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  question_type text DEFAULT 'multiple_choice'::text,
  material_id integer,
  poin_per_soal integer DEFAULT 10,
  min_points integer DEFAULT 60,
  CONSTRAINT quests_pkey PRIMARY KEY (id),
  CONSTRAINT quests_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT quests_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT quests_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.lesson_materials(id)
);
CREATE TABLE public.quizzes (
  id integer NOT NULL DEFAULT nextval('quizzes_id_seq'::regclass),
  module_id integer,
  title text NOT NULL,
  created_by uuid,
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT quizzes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.saved_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  saved_by uuid NOT NULL,
  class_id integer NOT NULL,
  chapter_id integer,
  lesson_id integer,
  report_name text NOT NULL,
  report_data jsonb NOT NULL,
  notes text,
  saved_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT saved_reports_pkey PRIMARY KEY (id),
  CONSTRAINT saved_reports_saved_by_fkey FOREIGN KEY (saved_by) REFERENCES public.profiles(id),
  CONSTRAINT saved_reports_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT saved_reports_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT saved_reports_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.student_answers (
  id bigint NOT NULL DEFAULT nextval('student_answers_id_seq'::regclass),
  student_id uuid,
  question_id integer,
  is_correct boolean NOT NULL,
  answered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_answers_pkey PRIMARY KEY (id),
  CONSTRAINT student_answers_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.student_badges (
  id bigint NOT NULL DEFAULT nextval('student_badges_id_seq'::regclass),
  student_id uuid,
  badge_id integer,
  earned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_badges_pkey PRIMARY KEY (id),
  CONSTRAINT student_badges_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);
CREATE TABLE public.student_chapter_progress (
  id bigint NOT NULL DEFAULT nextval('student_chapter_progress_id_seq'::regclass),
  student_id uuid,
  chapter_id integer,
  is_unlocked boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  current_lesson_id integer,
  total_xp_earned integer DEFAULT 0,
  total_coins_earned integer DEFAULT 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT student_chapter_progress_pkey PRIMARY KEY (id),
  CONSTRAINT student_chapter_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_chapter_progress_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT student_chapter_progress_current_lesson_id_fkey FOREIGN KEY (current_lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.student_lesson_progress (
  id bigint NOT NULL DEFAULT nextval('student_lesson_progress_id_seq'::regclass),
  student_id uuid,
  lesson_id integer,
  is_unlocked boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  materials_viewed integer DEFAULT 0,
  total_materials integer DEFAULT 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT student_lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT student_lesson_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.student_quest_answers (
  id bigint NOT NULL DEFAULT nextval('student_quest_answers_id_seq'::regclass),
  attempt_id bigint,
  question_id integer,
  answer_text text,
  answer_audio_url text,
  is_correct boolean DEFAULT false,
  points_earned integer DEFAULT 0,
  feedback text,
  answered_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_quest_answers_pkey PRIMARY KEY (id),
  CONSTRAINT student_quest_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.student_quest_attempts(id),
  CONSTRAINT student_quest_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.student_quest_attempts (
  id bigint NOT NULL DEFAULT nextval('student_quest_attempts_id_seq'::regclass),
  student_id uuid,
  quest_id integer,
  attempt_number integer DEFAULT 1,
  score integer DEFAULT 0,
  max_score integer NOT NULL,
  percentage numeric DEFAULT 0,
  passed boolean DEFAULT false,
  xp_earned integer DEFAULT 0,
  coins_earned integer DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  time_spent_seconds integer,
  user_answers jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT student_quest_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT student_quest_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_quest_attempts_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id)
);
CREATE TABLE public.student_quiz_attempts (
  id bigint NOT NULL DEFAULT nextval('student_quiz_attempts_id_seq'::regclass),
  student_id uuid,
  quiz_id integer,
  score integer DEFAULT 0,
  max_score integer DEFAULT 0,
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT student_quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);