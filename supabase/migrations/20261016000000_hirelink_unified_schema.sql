/*
  # HireLink - unified schema

  Replaces the 7 earlier migrations, which defined conflicting versions of the
  same tables. This one is a superset so every page in the app works:

  - roles: candidate | seeker | employer | admin   (candidate/seeker = job seeker)
  - applications: candidate_id / seeker_id / applicant_id are kept in sync, and
    candidate_name / candidate_email / rating / department support the employer dashboard
  - jobs: status (pending/approved/active/...) and is_active, is_remote/remote_ok,
    employer_id/posted_by, salary_min/max and salary_range, type/job_type are kept in sync
  - messages / notifications: read and is_read are kept in sync
  - email log table renamed to email_notifications (notifications = in-app feed)
*/

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ TABLES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate','seeker','employer','admin')),
  company_name text,
  headline text,
  bio text,
  location text,
  phone text,
  avatar_url text,
  experience_level text DEFAULT 'entry',
  skills text[] DEFAULT '{}',
  current_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Company',
  slug text UNIQUE,
  description text DEFAULT '',
  logo_url text,
  website text,
  industry text,
  company_size text,
  size text,
  location text,
  founded_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employer_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  posted_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  company text,
  department text,
  category text,
  job_type text NOT NULL DEFAULT 'full-time',
  type text,
  experience_level text NOT NULL DEFAULT 'entry',
  location text NOT NULL DEFAULT '',
  is_remote boolean DEFAULT false,
  remote_ok boolean DEFAULT false,
  salary_min numeric,
  salary_max numeric,
  salary_currency text DEFAULT 'USD',
  salary_range text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','pending','approved','active','closed','rejected','removed')),
  is_active boolean DEFAULT true,
  featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seeker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_name text,
  candidate_email text,
  candidate_phone text,
  cover_letter text,
  resume_url text,
  resume_data jsonb,
  status text NOT NULL DEFAULT 'Applied',   -- app uses several vocabularies; not constrained
  rating integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS applications_job_candidate_uniq
  ON public.applications (job_id, candidate_id) WHERE candidate_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (job_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- durable log of status emails (written by the send-notification edge function, service role only)
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  candidate_email text NOT NULL,
  candidate_name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL,
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'career-advice'
    CHECK (category IN ('career-advice','interview-tips','industry-news','company')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  seeker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text NOT NULL,
  content text,
  is_current_employee boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'My Resume',
  full_name text, email text, phone text, location text, summary text,
  skills text[] DEFAULT '{}',
  experience jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  search_query text, category text, location text, job_type text, experience_level text,
  salary_min integer,
  is_active boolean DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score integer NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  match_reasons jsonb DEFAULT '[]'::jsonb,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, job_id)
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_apps_job ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_apps_candidate ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============ SYNC TRIGGERS (keep alias columns consistent) ============
CREATE OR REPLACE FUNCTION public.sync_companies() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.company_size := COALESCE(NEW.company_size, NEW.size);
  NEW.size := COALESCE(NEW.size, NEW.company_size);
  IF TG_OP = 'UPDATE' THEN
    IF NEW.size IS DISTINCT FROM OLD.size AND NEW.company_size IS NOT DISTINCT FROM OLD.company_size THEN
      NEW.company_size := NEW.size;
    ELSIF NEW.company_size IS DISTINCT FROM OLD.company_size THEN
      NEW.size := NEW.company_size;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_jobs() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- owner
  NEW.employer_id := COALESCE(NEW.employer_id, NEW.posted_by);
  NEW.posted_by := COALESCE(NEW.posted_by, NEW.employer_id);
  -- remote flag
  IF TG_OP = 'UPDATE' AND NEW.remote_ok IS DISTINCT FROM OLD.remote_ok AND NEW.is_remote IS NOT DISTINCT FROM OLD.is_remote THEN
    NEW.is_remote := NEW.remote_ok;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_remote IS DISTINCT FROM OLD.is_remote THEN
    NEW.remote_ok := NEW.is_remote;
  ELSE
    NEW.is_remote := COALESCE(NEW.is_remote, NEW.remote_ok, false);
    NEW.remote_ok := COALESCE(NEW.remote_ok, NEW.is_remote, false);
  END IF;
  -- type alias
  NEW.type := COALESCE(NEW.type, NEW.job_type);
  -- company name for pages that read jobs.company
  IF NEW.company IS NULL AND NEW.company_id IS NOT NULL THEN
    SELECT name INTO NEW.company FROM public.companies WHERE id = NEW.company_id;
  END IF;
  -- salary_range text from min/max when not given
  IF NEW.salary_range IS NULL AND NEW.salary_min IS NOT NULL AND NEW.salary_max IS NOT NULL THEN
    NEW.salary_range := NEW.salary_currency || ' ' || NEW.salary_min::bigint || ' - ' || NEW.salary_max::bigint;
  END IF;
  -- is_active follows status unless it was changed explicitly
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('draft','pending','closed','rejected','removed') THEN NEW.is_active := false;
    ELSE NEW.is_active := COALESCE(NEW.is_active, true); END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active THEN
    NEW.is_active := NEW.status IN ('active','approved');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_applications() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE uid uuid;
BEGIN
  uid := COALESCE(NEW.candidate_id, NEW.seeker_id, NEW.applicant_id);
  -- employer-entered applicants (name/email only) have no user account
  IF uid IS NULL AND NEW.candidate_email IS NULL THEN uid := auth.uid(); END IF;
  NEW.candidate_id := uid; NEW.seeker_id := uid; NEW.applicant_id := uid;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sync_read_flag() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_read IS DISTINCT FROM OLD.is_read AND NEW.read IS NOT DISTINCT FROM OLD.read THEN
    NEW.read := NEW.is_read;
  ELSE
    NEW.is_read := NEW.read;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_companies_sync ON public.companies;
CREATE TRIGGER trg_companies_sync BEFORE INSERT OR UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.sync_companies();
DROP TRIGGER IF EXISTS trg_jobs_sync ON public.jobs;
CREATE TRIGGER trg_jobs_sync BEFORE INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.sync_jobs();
DROP TRIGGER IF EXISTS trg_applications_sync ON public.applications;
CREATE TRIGGER trg_applications_sync BEFORE INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.sync_applications();
DROP TRIGGER IF EXISTS trg_messages_sync ON public.messages;
CREATE TRIGGER trg_messages_sync BEFORE INSERT OR UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.sync_read_flag();
DROP TRIGGER IF EXISTS trg_notifications_sync ON public.notifications;
CREATE TRIGGER trg_notifications_sync BEFORE INSERT OR UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.sync_read_flag();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','companies','jobs','applications','blog_posts','resumes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated ON public.%1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.update_updated_at()', t);
  END LOOP;
END $$;

-- ============ NEW-USER PROFILE ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r text;
BEGIN
  r := COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'user_type', 'candidate');
  IF r = 'job_seeker' THEN r := 'candidate'; END IF;
  -- never let a client self-assign admin through signup metadata
  IF r NOT IN ('candidate','seeker','employer') THEN r := 'candidate'; END IF;
  INSERT INTO public.profiles (id, email, full_name, role, company_name)
  VALUES (NEW.id, COALESCE(NEW.email,''), COALESCE(NEW.raw_user_meta_data->>'full_name',''), r,
          NEW.raw_user_meta_data->>'company_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','companies','jobs','applications','saved_jobs','messages','notifications',
    'email_notifications','blog_posts','reviews','resumes','job_alerts','recommendations'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- profiles (users cannot change their own role)
CREATE POLICY "profiles readable by signed-in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role IN ('candidate','seeker','employer'));
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (public.is_admin() OR (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())));
CREATE POLICY "profiles delete admin" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

-- companies
CREATE POLICY "companies public read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies insert own" ON public.companies FOR INSERT TO authenticated WITH CHECK (employer_id = auth.uid());
CREATE POLICY "companies update own" ON public.companies FOR UPDATE TO authenticated
  USING (employer_id = auth.uid() OR public.is_admin()) WITH CHECK (employer_id = auth.uid() OR public.is_admin());
CREATE POLICY "companies delete own" ON public.companies FOR DELETE TO authenticated
  USING (employer_id = auth.uid() OR public.is_admin());

-- jobs
CREATE POLICY "jobs public read live" ON public.jobs FOR SELECT
  USING (is_active OR status IN ('active','approved') OR employer_id = auth.uid() OR public.is_admin());
CREATE POLICY "jobs insert own" ON public.jobs FOR INSERT TO authenticated WITH CHECK (employer_id = auth.uid());
CREATE POLICY "jobs update own" ON public.jobs FOR UPDATE TO authenticated
  USING (employer_id = auth.uid() OR public.is_admin()) WITH CHECK (employer_id = auth.uid() OR public.is_admin());
CREATE POLICY "jobs delete own" ON public.jobs FOR DELETE TO authenticated
  USING (employer_id = auth.uid() OR public.is_admin());

-- applications
CREATE POLICY "apps read" ON public.applications FOR SELECT TO authenticated USING (
  candidate_id = auth.uid() OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.employer_id = auth.uid()));
CREATE POLICY "apps insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (
  COALESCE(candidate_id, seeker_id, applicant_id, auth.uid()) = auth.uid()
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.employer_id = auth.uid()));
CREATE POLICY "apps update by job owner" ON public.applications FOR UPDATE TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.employer_id = auth.uid()));
CREATE POLICY "apps delete own" ON public.applications FOR DELETE TO authenticated
  USING (candidate_id = auth.uid() OR public.is_admin());

-- messages
CREATE POLICY "messages read own" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages send" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages mark read" ON public.messages FOR UPDATE TO authenticated USING (receiver_id = auth.uid());
CREATE POLICY "messages delete own" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- notifications (in-app); email_notifications has no policies = service role only
CREATE POLICY "notifications own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- blog
CREATE POLICY "blog read" ON public.blog_posts FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR public.is_admin());
CREATE POLICY "blog write own" ON public.blog_posts FOR ALL TO authenticated
  USING (author_id = auth.uid() OR public.is_admin()) WITH CHECK (author_id = auth.uid() OR public.is_admin());

-- reviews
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews write own" ON public.reviews FOR ALL TO authenticated
  USING (seeker_id = auth.uid()) WITH CHECK (seeker_id = auth.uid());

-- per-user tables
CREATE POLICY "saved_jobs own" ON public.saved_jobs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "resumes own" ON public.resumes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "job_alerts own" ON public.job_alerts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "recommendations own" ON public.recommendations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
