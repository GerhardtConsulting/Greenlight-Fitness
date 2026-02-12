import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCoachCalendars, createCoachCalendar, updateCoachCalendar, deleteCoachCalendar,
  getCalendarAvailability, setCalendarAvailability,
  getCoachBlockedTimes, addCoachBlockedTime, deleteCoachBlockedTime,
  updateBookingSlug, getCoachAppointments, confirmAppointment, cancelAppointment,
  supabase,
} from '../services/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import {
  Calendar, Plus, Trash2, Save, Clock, ChevronLeft, ChevronRight, Settings, X,
  CalendarX, Loader2, Check, AlertCircle, Link2,
  ExternalLink, CheckCircle2, XCircle, Eye,
  ToggleLeft, ToggleRight, Zap, User, CalendarDays, CalendarRange
} from 'lucide-react';

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_LABELS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00
const HOUR_HEIGHT = 60; // px per hour — Google Calendar uses ~60px
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

// Color palette for calendars (Google-style)
const CAL_COLORS = ['#4285f4', '#0b8043', '#8e24aa', '#d50000', '#f4511e', '#f6bf26', '#33b679', '#039be5', '#7986cb', '#616161'];

type ViewMode = 'calendar' | 'availability' | 'settings';
type CalView = 'week' | 'day';

interface AvailSlot { day_of_week: number; start_time: string; end_time: string; }

// ─── Mini Calendar (Google-style) ───────────────────────────────────
const MiniCalendar: React.FC<{
  selectedDate: Date; onSelectDate: (d: Date) => void; appointments: any[];
}> = ({ selectedDate, onSelectDate, appointments }) => {
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const days = useMemo(() => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    let startDow = first.getDay() - 1; if (startDow < 0) startDow = 6;
    const r: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < startDow; i++) r.push({ date: new Date(y, m, -startDow + i + 1), inMonth: false });
    for (let d = 1; d <= last.getDate(); d++) r.push({ date: new Date(y, m, d), inMonth: true });
    while (r.length < 42) { const d = r.length - startDow - last.getDate() + 1; r.push({ date: new Date(y, m + 1, d), inMonth: false }); }
    return r;
  }, [viewMonth]);
  const todayStr = new Date().toISOString().split('T')[0];
  const selStr = selectedDate.toISOString().split('T')[0];
  const apptDates = useMemo(() => { const s = new Set<string>(); appointments.forEach(a => s.add(a.date)); return s; }, [appointments]);
  const MO = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} className="p-1 hover:bg-white/5 rounded-full"><ChevronLeft size={16} className="text-zinc-400" /></button>
        <span className="text-sm font-medium text-zinc-200">{MO[viewMonth.getMonth()]} {viewMonth.getFullYear()}</span>
        <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} className="p-1 hover:bg-white/5 rounded-full"><ChevronRight size={16} className="text-zinc-400" /></button>
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => <div key={d} className="text-[10px] font-medium text-zinc-500 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 text-center">
        {days.map(({ date, inMonth }, i) => {
          const ds = date.toISOString().split('T')[0];
          const isToday = ds === todayStr, isSel = ds === selStr, hasA = apptDates.has(ds);
          return (
            <button key={i} onClick={() => onSelectDate(date)}
              className={`w-8 h-8 mx-auto rounded-full text-xs flex items-center justify-center transition-all relative ${
                !inMonth ? 'text-zinc-700 hover:bg-white/5' :
                isSel ? 'bg-[#4285f4] text-white font-bold shadow-lg shadow-blue-500/20' :
                isToday ? 'bg-[#4285f4]/20 text-[#4285f4] font-bold' :
                'text-zinc-300 hover:bg-white/10'
              }`}>
              {date.getDate()}
              {hasA && !isSel && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#4285f4]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────
const CoachCalendarSetup: React.FC = () => {
  const { user, userProfile } = useAuth();
  const gridRef = useRef<HTMLDivElement>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);
  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calView, setCalView] = useState<CalView>(() => typeof window !== 'undefined' && window.innerWidth < 768 ? 'day' : 'week');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const now = new Date(); const day = now.getDay();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (day === 0 ? -6 : 1));
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalDesc, setNewCalDesc] = useState('');
  const [newCalDuration, setNewCalDuration] = useState(30);
  const [newCalBuffer, setNewCalBuffer] = useState(0);
  const [newCalAdvance, setNewCalAdvance] = useState(60);
  const [newCalNotice, setNewCalNotice] = useState(24);
  const [blockDate, setBlockDate] = useState('');
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('17:00');
  const [blockReason, setBlockReason] = useState('');
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', slot_duration_minutes: 30, buffer_minutes: 0, max_advance_days: 60, min_notice_hours: 24 });
  const [bookingSlug, setBookingSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [currentTime, setCurrentTime] = useState(new Date());

  // Current time indicator update
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (user) { fetchCalendars(); fetchSlug(); fetchBookings(); }
  }, [user]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(null); setSuccess(null); }, 4000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  // Scroll to current time on mount
  useEffect(() => {
    if (gridRef.current && viewMode === 'calendar') {
      const now = new Date();
      const scrollTo = (now.getHours() - 7) * HOUR_HEIGHT;
      gridRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [viewMode]);

  // Enable all calendars by default
  useEffect(() => {
    if (calendars.length > 0 && enabledCalendarIds.size === 0) {
      setEnabledCalendarIds(new Set(calendars.map(c => c.id)));
    }
  }, [calendars]);

  const fetchCalendars = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCoachCalendars(user.id);
      setCalendars(data);
      if (data.length > 0 && !selectedCalendar) setSelectedCalendar(data[0]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchSlug = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('booking_slug').eq('id', user.id).single();
    if (data?.booking_slug) { setBookingSlug(data.booking_slug); setSlugInput(data.booking_slug); }
  };

  const fetchBookings = async () => {
    if (!user) return;
    try { const data = await getCoachAppointments(user.id); setBookings(data); }
    catch (e: any) { setError(e.message); }
  };

  const handleSaveSlug = async () => {
    if (!user || !slugInput.trim()) return;
    const clean = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setSlugSaving(true);
    try {
      await updateBookingSlug(user.id, clean);
      setBookingSlug(clean); setSlugInput(clean); setSuccess('Booking-Link gespeichert!');
    } catch (e: any) { setError(e.message?.includes('duplicate') ? 'Dieser Link ist bereits vergeben.' : e.message); }
    finally { setSlugSaving(false); }
  };

  const copyBookingLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${bookingSlug}`);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleConfirmBooking = async (id: string) => {
    try { await confirmAppointment(id); setSuccess('Termin bestätigt!'); await fetchBookings(); } catch (e: any) { setError(e.message); }
  };
  const handleCancelBooking = async (id: string) => {
    const reason = prompt('Grund für die Absage (optional):');
    try { await cancelAppointment(id, reason || undefined); setSuccess('Termin abgesagt.'); await fetchBookings(); setSelectedBooking(null); } catch (e: any) { setError(e.message); }
  };

  const handleCreateCalendar = async () => {
    if (!user || !newCalName.trim()) return;
    setSaving(true);
    try {
      const cal = await createCoachCalendar({ coach_id: user.id, name: newCalName.trim(), description: newCalDesc.trim() || undefined, slot_duration_minutes: newCalDuration, buffer_minutes: newCalBuffer, max_advance_days: newCalAdvance, min_notice_hours: newCalNotice });
      setSuccess('Kalender erstellt!'); setShowCreateForm(false);
      setNewCalName(''); setNewCalDesc(''); setNewCalDuration(30); setNewCalBuffer(0); setNewCalAdvance(60); setNewCalNotice(24);
      await fetchCalendars();
      if (cal) { setSelectedCalendar(cal); setEnabledCalendarIds(prev => new Set([...prev, cal.id])); }
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm('Kalender wirklich löschen?')) return;
    try {
      await deleteCoachCalendar(id); setSuccess('Kalender gelöscht.');
      if (selectedCalendar?.id === id) setSelectedCalendar(calendars.find(c => c.id !== id) || null);
      await fetchCalendars();
    } catch (e: any) { setError(e.message); }
  };

  const handleTogglePublic = async (calId: string, currentValue: boolean) => {
    try { await updateCoachCalendar(calId, { is_public: !currentValue }); await fetchCalendars(); setSuccess(!currentValue ? 'Kalender öffentlich.' : 'Kalender privat.'); } catch (e: any) { setError(e.message); }
  };

  // --- Availability ---
  const loadAvailability = async (calId: string) => {
    try {
      const avail = await getCalendarAvailability(calId);
      setAvailability(avail.map((a: any) => ({ day_of_week: a.day_of_week, start_time: a.start_time, end_time: a.end_time })));
      if (user) { const blocked = await getCoachBlockedTimes(user.id); setBlockedTimes(blocked); }
    } catch (e: any) { setError(e.message); }
  };
  const toggleDayAvailability = (day: number) => {
    if (availability.filter(s => s.day_of_week === day).length > 0) setAvailability(prev => prev.filter(s => s.day_of_week !== day));
    else setAvailability(prev => [...prev, { day_of_week: day, start_time: '09:00', end_time: '17:00' }]);
  };
  const addAvailSlot = (day: number) => setAvailability(prev => [...prev, { day_of_week: day, start_time: '09:00', end_time: '17:00' }]);
  const updateAvailSlot = (index: number, field: keyof AvailSlot, value: any) => setAvailability(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  const removeAvailSlot = (index: number) => setAvailability(prev => prev.filter((_, i) => i !== index));
  const handleSaveAvailability = async () => {
    if (!selectedCalendar) return; setSaving(true);
    try { await setCalendarAvailability(selectedCalendar.id, availability); setSuccess('Verfügbarkeit gespeichert!'); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const handleSaveSettings = async () => {
    if (!selectedCalendar) return; setSaving(true);
    try { const updated = await updateCoachCalendar(selectedCalendar.id, settingsForm); setSelectedCalendar(updated); setSuccess('Einstellungen gespeichert!'); await fetchCalendars(); }
    catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const handleAddBlockedTime = async () => {
    if (!user || !blockDate) return; setSaving(true);
    try {
      await addCoachBlockedTime({ coach_id: user.id, blocked_date: blockDate, all_day: blockAllDay, start_time: blockAllDay ? undefined : blockStart, end_time: blockAllDay ? undefined : blockEnd, reason: blockReason || undefined });
      setBlockDate(''); setBlockReason(''); setBlockAllDay(true);
      const blocked = await getCoachBlockedTimes(user.id); setBlockedTimes(blocked); setSuccess('Blockzeit hinzugefügt.');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };
  const handleDeleteBlocked = async (id: string) => {
    try { await deleteCoachBlockedTime(id); if (user) { const blocked = await getCoachBlockedTimes(user.id); setBlockedTimes(blocked); } }
    catch (e: any) { setError(e.message); }
  };

  // --- Week View ---
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  }), [weekStart]);

  const navigateWeek = (dir: 'prev' | 'next') => {
    if (calView === 'day') {
      setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + (dir === 'next' ? 1 : -1)); return d; });
    } else {
      setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + (dir === 'next' ? 7 : -7)); return d; });
    }
  };

  const goToToday = () => {
    const now = new Date(); const day = now.getDay();
    setWeekStart(new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + (day === 0 ? -6 : 1)));
    setSelectedDate(now);
  };

  const visibleDates = calView === 'day' ? [selectedDate] : weekDates;

  const weekBookings = useMemo(() => {
    const dates = visibleDates.map(d => d.toISOString().split('T')[0]);
    return bookings.filter(b => dates.includes(b.date) && b.status !== 'CANCELLED');
  }, [bookings, visibleDates]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calendar color mapping
  const calColorMap = useMemo(() => {
    const map = new Map<string, string>();
    calendars.forEach((cal, i) => map.set(cal.id, CAL_COLORS[i % CAL_COLORS.length]));
    return map;
  }, [calendars]);

  const getBookingColor = useCallback((booking: any) => {
    if (booking.calendar_id && calColorMap.has(booking.calendar_id)) return calColorMap.get(booking.calendar_id)!;
    return CAL_COLORS[0];
  }, [calColorMap]);

  // Current time position
  const currentTimeTop = useMemo(() => {
    const h = currentTime.getHours(), m = currentTime.getMinutes();
    return (h - HOURS[0]) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
  }, [currentTime]);

  const isCurrentTimeVisible = currentTime.getHours() >= HOURS[0] && currentTime.getHours() <= HOURS[HOURS.length - 1];

  // Header date label
  const headerLabel = useMemo(() => {
    if (calView === 'day') {
      return selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const m1 = weekDates[0].getMonth(), m2 = weekDates[6].getMonth();
    if (m1 === m2) return `${weekDates[0].toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;
    return `${weekDates[0].toLocaleDateString('de-DE', { month: 'short' })} – ${weekDates[6].toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}`;
  }, [calView, selectedDate, weekDates]);

  useEffect(() => { if (viewMode === 'availability' && selectedCalendar) loadAvailability(selectedCalendar.id); }, [viewMode, selectedCalendar?.id]);
  useEffect(() => {
    if (viewMode === 'settings' && selectedCalendar) {
      setSettingsForm({ name: selectedCalendar.name, description: selectedCalendar.description || '', slot_duration_minutes: selectedCalendar.slot_duration_minutes, buffer_minutes: selectedCalendar.buffer_minutes, max_advance_days: selectedCalendar.max_advance_days, min_notice_hours: selectedCalendar.min_notice_hours });
    }
  }, [viewMode, selectedCalendar?.id]);

  const toggleCalendarEnabled = (id: string) => {
    setEnabledCalendarIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-zinc-500"><Loader2 className="animate-spin mr-2" size={20} /> Laden...</div>;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="animate-in fade-in h-[calc(100vh-80px)] flex flex-col">
      {/* Status toasts */}
      {error && <div className="absolute top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2"><AlertCircle size={14} /> {error}</div>}
      {success && <div className="absolute top-4 right-4 z-50 bg-emerald-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2"><Check size={14} /> {success}</div>}

      {/* ═══ GOOGLE-STYLE TOP BAR ═══ */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-zinc-800/50 shrink-0">
        {/* Row 1: Hamburger, logo, today, nav, date */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>

        <div className="flex items-center gap-1 hidden sm:flex">
          <Calendar size={22} className="text-[#4285f4]" />
          <span className="text-lg font-medium text-white">Kalender</span>
        </div>

        <button onClick={goToToday} className="px-3 sm:px-4 py-1.5 border border-zinc-700 rounded-lg text-xs sm:text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors">
          Heute
        </button>

        <div className="flex items-center">
          <button onClick={() => navigateWeek('prev')} className="p-1 sm:p-1.5 hover:bg-white/5 rounded-full transition-colors"><ChevronLeft size={18} className="text-zinc-400" /></button>
          <button onClick={() => navigateWeek('next')} className="p-1 sm:p-1.5 hover:bg-white/5 rounded-full transition-colors"><ChevronRight size={18} className="text-zinc-400" /></button>
        </div>

        <h1 className="text-sm sm:text-xl font-normal text-white truncate max-w-[140px] sm:max-w-none">{headerLabel}</h1>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Day / Week Toggle — hidden on very small screens since mobile defaults to day */}
          <div className="hidden sm:flex border border-zinc-700 rounded-lg overflow-hidden">
            <button onClick={() => setCalView('day')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${calView === 'day' ? 'bg-[#4285f4]/20 text-[#4285f4]' : 'text-zinc-400 hover:bg-white/5'}`}>
              <CalendarDays size={14} className="inline mr-1" />Tag
            </button>
            <button onClick={() => setCalView('week')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${calView === 'week' ? 'bg-[#4285f4]/20 text-[#4285f4]' : 'text-zinc-400 hover:bg-white/5'}`}>
              <CalendarRange size={14} className="inline mr-1" />Woche
            </button>
          </div>

          {/* View mode tabs */}
          <div className="flex border border-zinc-700 rounded-lg overflow-hidden">
            {([['calendar', 'Kalender'], ['availability', 'Zeiten'], ['settings', 'Einst.']] as [ViewMode, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setViewMode(key)}
                className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium transition-colors ${viewMode === key ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >{label}</button>
            ))}
          </div>

          <button onClick={() => setShowCreateForm(true)} className="p-1.5 sm:p-2 bg-[#4285f4] text-white rounded-full hover:bg-[#4285f4]/80 transition-colors shadow-lg shadow-blue-500/20">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="flex flex-1 overflow-hidden mt-2">
        {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
        {sidebarOpen && isMobile && (
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className={`shrink-0 transition-all duration-300 overflow-y-auto
          ${isMobile
            ? `fixed top-0 left-0 z-50 h-full bg-[#1a1a1a] border-r border-zinc-800 ${sidebarOpen ? 'w-72 p-4' : 'w-0 p-0 overflow-hidden'}`
            : `${sidebarOpen ? 'w-60 pr-4' : 'w-0 overflow-hidden'}`
          }`}>
          {/* Mobile close button */}
          {isMobile && sidebarOpen && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={20} className="text-[#4285f4]" />
                <span className="text-base font-medium text-white">Kalender</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full"><X size={18} className="text-zinc-400" /></button>
            </div>
          )}
          <div className="space-y-5 pt-1">
            {/* Mini Calendar */}
            <MiniCalendar selectedDate={selectedDate} onSelectDate={(d) => {
              setSelectedDate(d);
              const day = d.getDay();
              setWeekStart(new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + (day === 0 ? -6 : 1)));
            }} appointments={bookings} />

            {/* My Calendars - Google style with checkboxes */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2 flex items-center justify-between">
                Meine Kalender
                <button onClick={() => setShowCreateForm(true)} className="hover:bg-white/5 rounded-full p-0.5"><Plus size={14} className="text-zinc-500" /></button>
              </p>
              <div className="space-y-0.5">
                {calendars.map((cal, ci) => {
                  const color = CAL_COLORS[ci % CAL_COLORS.length];
                  const enabled = enabledCalendarIds.has(cal.id);
                  return (
                    <div key={cal.id} className="flex items-center gap-2.5 py-2 sm:py-1.5 px-1 rounded-md hover:bg-white/5 cursor-pointer group" onClick={() => toggleCalendarEnabled(cal.id)}>
                      <div className={`w-5 h-5 sm:w-4 sm:h-4 rounded flex items-center justify-center border-2 transition-colors`} style={{ borderColor: color, backgroundColor: enabled ? color : 'transparent' }}>
                        {enabled && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-sm flex-1 truncate ${enabled ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>{cal.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedCalendar(cal); setViewMode('settings'); if (isMobile) setSidebarOpen(false); }}
                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity p-1 sm:p-0.5 hover:bg-white/10 rounded">
                        <Settings size={14} className="text-zinc-500 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Booking Link */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2">Buchungslink</p>
              <div className="flex gap-1">
                <div className="flex-1 flex items-center bg-zinc-900/50 border border-zinc-800 rounded-md overflow-hidden">
                  <span className="text-zinc-600 text-[10px] pl-2 shrink-0">/book/</span>
                  <input value={slugInput} onChange={e => setSlugInput(e.target.value)} placeholder="dein-slug" className="flex-1 bg-transparent text-zinc-200 text-xs py-1.5 pr-1 outline-none w-0" />
                </div>
                <button onClick={handleSaveSlug} disabled={slugSaving} className="px-2 py-1.5 bg-[#4285f4] text-white rounded-md text-[10px] font-bold hover:bg-[#4285f4]/80 disabled:opacity-50">
                  {slugSaving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                </button>
              </div>
              {bookingSlug && (
                <div className="flex items-center gap-2 mt-1.5">
                  <button onClick={copyBookingLink} className="text-[10px] text-[#4285f4] hover:underline flex items-center gap-1">
                    {linkCopied ? <><Check size={8} /> Kopiert!</> : <><Link2 size={8} /> Link kopieren</>}
                  </button>
                  <a href={`/book/${bookingSlug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5">
                    <ExternalLink size={8} /> Vorschau
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {viewMode === 'calendar' ? (
            <div className="h-full flex flex-col bg-[#1a1a1a] rounded-xl border border-zinc-800/50 overflow-hidden">
              {/* Day column headers */}
              <div className={`grid shrink-0 border-b border-zinc-800/50`}
                style={{ gridTemplateColumns: `40px repeat(${visibleDates.length}, 1fr)` }}>
                <div className="border-r border-zinc-800/30" />
                {visibleDates.map((d, i) => {
                  const ds = d.toISOString().split('T')[0];
                  const isToday = ds === todayStr;
                  return (
                    <div key={i} className={`py-2 sm:py-3 text-center border-r border-zinc-800/30 last:border-r-0`}>
                      <p className={`text-[10px] sm:text-[11px] font-medium uppercase ${isToday ? 'text-[#4285f4]' : 'text-zinc-500'}`}>{DAY_LABELS[d.getDay()]}</p>
                      <button onClick={() => { setSelectedDate(d); if (calView === 'week') setCalView('day'); }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-base sm:text-xl font-medium mt-0.5 transition-colors ${
                          isToday ? 'bg-[#4285f4] text-white' : 'text-zinc-200 hover:bg-white/5'
                        }`}>
                        {d.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Scrollable time grid */}
              <div ref={gridRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                  {/* Hour rows */}
                  {HOURS.map((hour, hi) => (
                    <div key={hour} className="absolute w-full flex" style={{ top: `${hi * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                      <div className="w-10 sm:w-14 shrink-0 pr-1 sm:pr-2 -mt-2 text-right">
                        <span className="text-[9px] sm:text-[10px] text-zinc-600">{String(hour).padStart(2, '0')}:00</span>
                      </div>
                      <div className="flex-1 border-t border-zinc-800/40" />
                    </div>
                  ))}
                  {/* Half-hour lines */}
                  {HOURS.map((hour, hi) => (
                    <div key={`half-${hour}`} className="absolute w-full flex" style={{ top: `${hi * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}>
                      <div className="w-10 sm:w-14 shrink-0" />
                      <div className="flex-1 border-t border-zinc-800/20 border-dashed" />
                    </div>
                  ))}

                  {/* Day columns */}
                  <div className="absolute top-0 left-10 sm:left-14 right-0 bottom-0" style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleDates.length}, 1fr)` }}>
                    {visibleDates.map((d, di) => {
                      const ds = d.toISOString().split('T')[0];
                      const isToday = ds === todayStr;
                      const dayBookings = weekBookings.filter(b => b.date === ds);
                      return (
                        <div key={di} className={`relative border-r border-zinc-800/30 last:border-r-0 ${isToday ? 'bg-[#4285f4]/[0.03]' : ''}`}>
                          {/* Appointment blocks */}
                          {dayBookings.map(b => {
                            const [bh, bm] = (b.time || '00:00').split(':').map(Number);
                            const top = (bh - HOURS[0]) * HOUR_HEIGHT + (bm / 60) * HOUR_HEIGHT;
                            const height = Math.max(((b.duration_minutes || 30) / 60) * HOUR_HEIGHT, 22);
                            const color = getBookingColor(b);
                            const isPending = b.status === 'PENDING';
                            return (
                              <button key={b.id} onClick={() => setSelectedBooking(b)}
                                className="absolute left-1 right-1 rounded-lg px-2 py-1 text-left transition-all hover:brightness-110 hover:shadow-lg cursor-pointer overflow-hidden z-10"
                                style={{
                                  top: `${top}px`, height: `${height}px`,
                                  backgroundColor: isPending ? `${color}30` : `${color}cc`,
                                  borderLeft: `3px solid ${color}`,
                                  color: isPending ? color : '#fff',
                                }}>
                                <p className="text-[11px] font-semibold truncate leading-tight">{b.booker_name || b.athlete_name || 'Termin'}</p>
                                {height > 30 && <p className="text-[10px] opacity-80 leading-tight">{b.time} · {b.duration_minutes}min</p>}
                                {isPending && height > 44 && <p className="text-[9px] opacity-60 mt-0.5">Ausstehend</p>}
                              </button>
                            );
                          })}

                          {/* Current time indicator */}
                          {isToday && isCurrentTimeVisible && (
                            <>
                              <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${currentTimeTop}px` }}>
                                <div className="h-[2px] bg-red-500 w-full" />
                              </div>
                              <div className="absolute z-20 pointer-events-none" style={{ top: `${currentTimeTop - 4}px`, left: '-5px' }}>
                                <div className="w-3 h-3 bg-red-500 rounded-full" />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'availability' ? (
            selectedCalendar ? (
              <div className="space-y-4 overflow-y-auto max-h-full pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">{selectedCalendar.name}</h2>
                    <p className="text-zinc-500 text-xs">Wöchentliche Verfügbarkeit festlegen</p>
                  </div>
                  <Button onClick={handleSaveAvailability} disabled={saving}><Save size={14} className="mr-1" /> {saving ? 'Speichern...' : 'Speichern'}</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAvailability([1,2,3,4,5].map(d => ({ day_of_week: d, start_time: '09:00', end_time: '17:00' })))} className="text-xs bg-zinc-800/50 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-1"><Zap size={10} /> Mo–Fr 9–17</button>
                  <button onClick={() => setAvailability([1,2,3,4,5].flatMap(d => [{ day_of_week: d, start_time: '09:00', end_time: '12:00' }, { day_of_week: d, start_time: '14:00', end_time: '18:00' }]))} className="text-xs bg-zinc-800/50 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-1"><Zap size={10} /> Split</button>
                  <button onClick={() => setAvailability([])} className="text-xs bg-zinc-800/50 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors">Reset</button>
                </div>
                <div className="bg-[#1a1a1a] border border-zinc-800/50 rounded-xl divide-y divide-zinc-800/50">
                  {[1,2,3,4,5,6,0].map(day => {
                    const daySlots = availability.filter(s => s.day_of_week === day);
                    const has = daySlots.length > 0;
                    return (
                      <div key={day} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button onClick={() => toggleDayAvailability(day)} className="text-zinc-400 hover:text-[#4285f4]">
                              {has ? <ToggleRight size={22} className="text-[#4285f4]" /> : <ToggleLeft size={22} />}
                            </button>
                            <span className={`text-sm font-medium w-28 ${has ? 'text-white' : 'text-zinc-500'}`}>{DAY_LABELS_FULL[day]}</span>
                            {!has && <span className="text-xs text-zinc-600">Nicht verfügbar</span>}
                          </div>
                          {has && <button onClick={() => addAvailSlot(day)} className="text-xs text-zinc-500 hover:text-[#4285f4] flex items-center gap-1"><Plus size={12} /> Slot</button>}
                        </div>
                        {has && <div className="mt-2 ml-8 sm:ml-[52px] space-y-2">
                          {availability.map((slot, idx) => slot.day_of_week !== day ? null : (
                            <div key={idx} className="flex items-center gap-2">
                              <select value={slot.start_time} onChange={e => updateAvailSlot(idx, 'start_time', e.target.value)} className="bg-zinc-900/50 border border-zinc-700 rounded-md px-2 py-1.5 text-white text-xs outline-none focus:border-[#4285f4]">{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                              <span className="text-zinc-600 text-xs">–</span>
                              <select value={slot.end_time} onChange={e => updateAvailSlot(idx, 'end_time', e.target.value)} className="bg-zinc-900/50 border border-zinc-700 rounded-md px-2 py-1.5 text-white text-xs outline-none focus:border-[#4285f4]">{TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select>
                              <button onClick={() => removeAvailSlot(idx)} className="p-1 text-zinc-600 hover:text-red-400"><Trash2 size={12} /></button>
                            </div>
                          ))}
                        </div>}
                      </div>
                    );
                  })}
                </div>
                {/* Blocked Times */}
                <div className="bg-[#1a1a1a] border border-zinc-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><CalendarX size={14} className="text-red-400" /> Blockzeiten</h3>
                  <div className="flex flex-wrap gap-2 mb-3 items-end">
                    <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} className="bg-zinc-900/50 border border-zinc-700 rounded-md px-2 py-1.5 text-white text-xs outline-none [color-scheme:dark]" />
                    <label className="flex items-center gap-1 text-xs text-zinc-400"><input type="checkbox" checked={blockAllDay} onChange={e => setBlockAllDay(e.target.checked)} className="accent-[#4285f4]" /> Ganzer Tag</label>
                    {!blockAllDay && <>
                      <select value={blockStart} onChange={e => setBlockStart(e.target.value)} className="bg-zinc-900/50 border border-zinc-700 rounded-md px-2 py-1.5 text-white text-xs">{TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
                      <span className="text-zinc-600 text-xs">–</span>
                      <select value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="bg-zinc-900/50 border border-zinc-700 rounded-md px-2 py-1.5 text-white text-xs">{TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}</select>
                    </>}
                    <input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Grund" className="flex-1 min-w-[100px] bg-zinc-900/50 border border-zinc-700 rounded-md px-2 py-1.5 text-white text-xs outline-none" />
                    <button onClick={handleAddBlockedTime} disabled={!blockDate || saving} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-md text-xs font-bold hover:bg-red-500/30 disabled:opacity-50">Sperren</button>
                  </div>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {blockedTimes.filter(b => b.blocked_date >= todayStr).map(bt => (
                      <div key={bt.id} className="flex items-center justify-between bg-zinc-900/30 rounded-md px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <CalendarX size={10} className="text-red-400" />
                          <span className="text-zinc-300">{new Date(bt.blocked_date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                          {bt.all_day ? <span className="text-red-400 text-[10px]">Ganzer Tag</span> : <span className="text-zinc-500">{bt.start_time}–{bt.end_time}</span>}
                          {bt.reason && <span className="text-zinc-600">({bt.reason})</span>}
                        </div>
                        <button onClick={() => handleDeleteBlocked(bt.id)} className="text-zinc-600 hover:text-red-400"><Trash2 size={10} /></button>
                      </div>
                    ))}
                    {blockedTimes.filter(b => b.blocked_date >= todayStr).length === 0 && <p className="text-zinc-600 text-xs">Keine Blockzeiten.</p>}
                  </div>
                </div>
              </div>
            ) : <div className="text-center py-20 text-zinc-600"><Calendar size={40} className="mx-auto mb-3 opacity-30" /><p>Wähle einen Kalender in der Sidebar aus.</p></div>
          ) : (
            selectedCalendar ? (
              <div className="space-y-4 overflow-y-auto max-h-full pb-8">
                <h2 className="text-lg font-medium text-white">Einstellungen – {selectedCalendar.name}</h2>
                <div className="bg-[#1a1a1a] border border-zinc-800/50 rounded-xl p-5 space-y-4">
                  <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Name</label><Input value={settingsForm.name} onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Beschreibung</label><Input value={settingsForm.description} onChange={e => setSettingsForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" /></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Slot-Dauer</label><select value={settingsForm.slot_duration_minutes} onChange={e => setSettingsForm(p => ({ ...p, slot_duration_minutes: Number(e.target.value) }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white text-sm">{[15,30,45,60,90].map(v => <option key={v} value={v}>{v} Min</option>)}</select></div>
                    <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Puffer</label><select value={settingsForm.buffer_minutes} onChange={e => setSettingsForm(p => ({ ...p, buffer_minutes: Number(e.target.value) }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white text-sm">{[0,5,10,15,30].map(v => <option key={v} value={v}>{v} Min</option>)}</select></div>
                    <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Max. Vorlauf</label><Input type="number" value={settingsForm.max_advance_days} onChange={e => setSettingsForm(p => ({ ...p, max_advance_days: Number(e.target.value) }))} /></div>
                    <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Min. Vorlauf (Std)</label><Input type="number" value={settingsForm.min_notice_hours} onChange={e => setSettingsForm(p => ({ ...p, min_notice_hours: Number(e.target.value) }))} /></div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                    <button onClick={() => handleTogglePublic(selectedCalendar.id, selectedCalendar.is_public !== false)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
                      {selectedCalendar.is_public !== false ? <ToggleRight size={20} className="text-[#4285f4]" /> : <ToggleLeft size={20} />}
                      {selectedCalendar.is_public !== false ? 'Öffentlich' : 'Privat'}
                    </button>
                    <button onClick={() => handleDeleteCalendar(selectedCalendar.id)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={12} /> Löschen</button>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={saving} fullWidth>{saving ? 'Speichern...' : 'Einstellungen speichern'}</Button>
                </div>
              </div>
            ) : <div className="text-center py-20 text-zinc-600"><Settings size={40} className="mx-auto mb-3 opacity-30" /><p>Wähle einen Kalender aus.</p></div>
          )}
        </div>
      </div>

      {/* ═══ BOOKING DETAIL MODAL ═══ */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-start justify-center sm:pt-[10vh]" onClick={() => setSelectedBooking(null)}>
          <div className="bg-[#2a2a2a] border border-zinc-700 rounded-t-2xl sm:rounded-xl w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mt-2 sm:hidden" />
            <div className="flex items-start justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  selectedBooking.status === 'CONFIRMED' ? 'text-white' : 'text-yellow-200'
                }`} style={{ backgroundColor: getBookingColor(selectedBooking) }}>
                  {(selectedBooking.booker_name || selectedBooking.athlete_name || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedBooking.booker_name || selectedBooking.athlete_name || 'Unbekannt'}</p>
                  {selectedBooking.booker_email && <p className="text-zinc-500 text-xs">{selectedBooking.booker_email}</p>}
                </div>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-zinc-500 hover:text-white p-1"><X size={18} /></button>
            </div>
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Clock size={14} className="text-zinc-500" />
                {new Date(selectedBooking.date + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })} · {selectedBooking.time} Uhr · {selectedBooking.duration_minutes} Min
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  selectedBooking.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' :
                  selectedBooking.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                }`}>{selectedBooking.status === 'CONFIRMED' ? 'Bestätigt' : selectedBooking.status === 'PENDING' ? 'Ausstehend' : 'Abgesagt'}</span>
              </div>
              {selectedBooking.notes && <p className="text-zinc-400 text-sm bg-zinc-900/50 rounded-lg p-2">{selectedBooking.notes}</p>}
              {selectedBooking.status !== 'CANCELLED' && (
                <div className="flex gap-2 pt-1">
                  {selectedBooking.status === 'PENDING' && (
                    <button onClick={() => { handleConfirmBooking(selectedBooking.id); setSelectedBooking(null); }}
                      className="flex-1 py-2 bg-[#4285f4] text-white rounded-lg text-sm font-medium hover:bg-[#4285f4]/80 flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> Bestätigen
                    </button>
                  )}
                  <button onClick={() => handleCancelBooking(selectedBooking.id)}
                    className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 flex items-center justify-center gap-1">
                    <XCircle size={14} /> Absagen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE CALENDAR MODAL ═══ */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-start justify-center sm:pt-[10vh]">
          <div className="bg-[#2a2a2a] border border-zinc-700 rounded-t-2xl sm:rounded-xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-3 sm:hidden" />
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-white">Neuer Kalender</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Name *</label><Input value={newCalName} onChange={e => setNewCalName(e.target.value)} placeholder="z.B. Erstgespräch" /></div>
              <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Beschreibung</label><Input value={newCalDesc} onChange={e => setNewCalDesc(e.target.value)} placeholder="Optional" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Slot-Dauer</label><select value={newCalDuration} onChange={e => setNewCalDuration(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white text-sm">{[15,30,45,60,90].map(v => <option key={v} value={v}>{v} Min</option>)}</select></div>
                <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Puffer</label><select value={newCalBuffer} onChange={e => setNewCalBuffer(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white text-sm">{[0,5,10,15,30].map(v => <option key={v} value={v}>{v} Min</option>)}</select></div>
                <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Max. Vorlauf (Tage)</label><Input type="number" value={newCalAdvance} onChange={e => setNewCalAdvance(Number(e.target.value))} /></div>
                <div><label className="text-xs font-medium text-zinc-500 mb-1 block">Min. Vorlauf (Std)</label><Input type="number" value={newCalNotice} onChange={e => setNewCalNotice(Number(e.target.value))} /></div>
              </div>
              <Button onClick={handleCreateCalendar} disabled={!newCalName.trim() || saving} fullWidth>{saving ? 'Erstelle...' : 'Kalender erstellen'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachCalendarSetup;
