-- ============================================
-- Migration: Fix exercises table + RLS policies
-- Date: 2026-02-18
-- Bugs: #2 (author_id/tracking_type missing), #3 (RLS admin access)
-- ============================================

-- BUG 2: Ensure exercises table has all required columns
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS tracking_type TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS sequence_url TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS default_sets JSONB;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS default_visible_metrics TEXT[];

-- Create index on author_id if not exists
CREATE INDEX IF NOT EXISTS idx_exercises_author ON public.exercises(author_id);

-- BUG 3: Fix RLS policies to allow admin access for plans/weeks/sessions

-- Helper: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- SESSIONS: Drop old + new policy, recreate with admin access
DROP POLICY IF EXISTS "Coaches can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Coaches and admins can manage sessions" ON public.sessions;
CREATE POLICY "Coaches and admins can manage sessions" ON public.sessions FOR ALL USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.weeks 
    JOIN public.plans ON plans.id = weeks.plan_id 
    WHERE weeks.id = sessions.week_id AND plans.coach_id = auth.uid()
  )
);

-- WEEKS: Drop old + new policy, recreate with admin access
DROP POLICY IF EXISTS "Coaches can manage weeks" ON public.weeks;
DROP POLICY IF EXISTS "Coaches and admins can manage weeks" ON public.weeks;
CREATE POLICY "Coaches and admins can manage weeks" ON public.weeks FOR ALL USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.plans 
    WHERE plans.id = weeks.plan_id AND plans.coach_id = auth.uid()
  )
);

-- PLANS: Add admin write access
DROP POLICY IF EXISTS "Coaches can create plans" ON public.plans;
DROP POLICY IF EXISTS "Coaches and admins can create plans" ON public.plans;
CREATE POLICY "Coaches and admins can create plans" ON public.plans FOR INSERT WITH CHECK (
  auth.uid() = coach_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Coaches can update plans" ON public.plans;
DROP POLICY IF EXISTS "Coaches and admins can update plans" ON public.plans;
CREATE POLICY "Coaches and admins can update plans" ON public.plans FOR UPDATE USING (
  auth.uid() = coach_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Coaches can delete plans" ON public.plans;
DROP POLICY IF EXISTS "Coaches and admins can delete plans" ON public.plans;
CREATE POLICY "Coaches and admins can delete plans" ON public.plans FOR DELETE USING (
  auth.uid() = coach_id OR public.is_admin()
);

-- EXERCISES: Allow admin to create/update/delete any exercise
DROP POLICY IF EXISTS "Coaches can create exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches and admins can create exercises" ON public.exercises;
CREATE POLICY "Coaches and admins can create exercises" ON public.exercises FOR INSERT WITH CHECK (
  auth.uid() = author_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Authors can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authors and admins can update exercises" ON public.exercises;
CREATE POLICY "Authors and admins can update exercises" ON public.exercises FOR UPDATE USING (
  auth.uid() = author_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Authors can delete exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authors and admins can delete exercises" ON public.exercises;
CREATE POLICY "Authors and admins can delete exercises" ON public.exercises FOR DELETE USING (
  auth.uid() = author_id OR public.is_admin()
);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
