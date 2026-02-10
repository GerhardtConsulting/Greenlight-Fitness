-- ============================================
-- GREENLIGHT FITNESS - Calendar System Migration
-- Calendly-style Scheduling for Coaches
-- ============================================

-- 1. Coach Calendars (named calendars linked to products)
CREATE TABLE IF NOT EXISTS public.coach_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 0,
  max_advance_days INTEGER DEFAULT 60,
  min_notice_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Coach Availability (recurring weekly time windows)
CREATE TABLE IF NOT EXISTS public.coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES public.coach_calendars(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coach Blocked Times (vacation, holidays, specific blocks)
CREATE TABLE IF NOT EXISTS public.coach_blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  all_day BOOLEAN DEFAULT TRUE,
  start_time TEXT,
  end_time TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add calendar_id to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS calendar_id UUID REFERENCES public.coach_calendars(id);

-- 5. Add calendar_id + duration to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS calendar_id UUID REFERENCES public.coach_calendars(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_coach_calendars_coach ON public.coach_calendars(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_calendar ON public.coach_availability(calendar_id);
CREATE INDEX IF NOT EXISTS idx_coach_availability_day ON public.coach_availability(calendar_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_coach_blocked_times_coach ON public.coach_blocked_times(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_blocked_times_date ON public.coach_blocked_times(coach_id, blocked_date);
CREATE INDEX IF NOT EXISTS idx_appointments_calendar ON public.appointments(calendar_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(date, status);

-- 7. RLS
ALTER TABLE public.coach_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_blocked_times ENABLE ROW LEVEL SECURITY;

-- Coach Calendars: Public read, coach manage
CREATE POLICY "Calendars viewable by everyone" ON public.coach_calendars FOR SELECT USING (true);
CREATE POLICY "Coaches manage own calendars" ON public.coach_calendars FOR ALL USING (auth.uid() = coach_id);

-- Coach Availability: Public read (needed for booking), coach manage
CREATE POLICY "Availability viewable by everyone" ON public.coach_availability FOR SELECT USING (true);
CREATE POLICY "Coaches manage availability" ON public.coach_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.coach_calendars WHERE id = coach_availability.calendar_id AND coach_id = auth.uid())
);

-- Blocked Times: Coach manage, public read for booking calc
CREATE POLICY "Blocked times viewable by everyone" ON public.coach_blocked_times FOR SELECT USING (true);
CREATE POLICY "Coaches manage own blocked times" ON public.coach_blocked_times FOR ALL USING (auth.uid() = coach_id);

-- Update appointments policy to allow athletes to create
CREATE POLICY "Athletes can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = athlete_id);
