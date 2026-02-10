import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getCoachCalendars, createCoachCalendar, updateCoachCalendar, deleteCoachCalendar,
  getCalendarAvailability, setCalendarAvailability,
  getCoachBlockedTimes, addCoachBlockedTime, deleteCoachBlockedTime,
} from '../services/supabase';
import Button from '../components/Button';
import Input from '../components/Input';
import {
  Calendar, Plus, Trash2, Save, Clock, ChevronLeft, Settings, X,
  CalendarX, Shield, Eye, Loader2, Check, AlertCircle
} from 'lucide-react';

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_LABELS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

type ViewMode = 'list' | 'edit';

interface AvailSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const CoachCalendarSetup: React.FC = () => {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create Calendar Form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCalName, setNewCalName] = useState('');
  const [newCalDesc, setNewCalDesc] = useState('');
  const [newCalDuration, setNewCalDuration] = useState(30);
  const [newCalBuffer, setNewCalBuffer] = useState(0);
  const [newCalAdvance, setNewCalAdvance] = useState(60);
  const [newCalNotice, setNewCalNotice] = useState(24);

  // Blocked time form
  const [blockDate, setBlockDate] = useState('');
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('17:00');
  const [blockReason, setBlockReason] = useState('');

  // Settings edit
  const [editSettings, setEditSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', slot_duration_minutes: 30, buffer_minutes: 0, max_advance_days: 60, min_notice_hours: 24 });

  useEffect(() => {
    if (user) fetchCalendars();
  }, [user]);

  useEffect(() => {
    if (error || success) {
      const t = setTimeout(() => { setError(null); setSuccess(null); }, 4000);
      return () => clearTimeout(t);
    }
  }, [error, success]);

  const fetchCalendars = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCoachCalendars(user.id);
      setCalendars(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalendar = async () => {
    if (!user || !newCalName.trim()) return;
    setSaving(true);
    try {
      await createCoachCalendar({
        coach_id: user.id,
        name: newCalName.trim(),
        description: newCalDesc.trim() || undefined,
        slot_duration_minutes: newCalDuration,
        buffer_minutes: newCalBuffer,
        max_advance_days: newCalAdvance,
        min_notice_hours: newCalNotice,
      });
      setSuccess('Kalender erstellt!');
      setShowCreateForm(false);
      setNewCalName(''); setNewCalDesc(''); setNewCalDuration(30); setNewCalBuffer(0); setNewCalAdvance(60); setNewCalNotice(24);
      await fetchCalendars();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCalendar = async (cal: any) => {
    setSelectedCalendar(cal);
    setViewMode('edit');
    setEditSettings(false);
    setSettingsForm({
      name: cal.name, description: cal.description || '',
      slot_duration_minutes: cal.slot_duration_minutes, buffer_minutes: cal.buffer_minutes,
      max_advance_days: cal.max_advance_days, min_notice_hours: cal.min_notice_hours,
    });
    try {
      const avail = await getCalendarAvailability(cal.id);
      setAvailability(avail.map((a: any) => ({ day_of_week: a.day_of_week, start_time: a.start_time, end_time: a.end_time })));
      if (user) {
        const blocked = await getCoachBlockedTimes(user.id);
        setBlockedTimes(blocked);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!confirm('Kalender wirklich löschen? Alle Verfügbarkeiten gehen verloren.')) return;
    try {
      await deleteCoachCalendar(id);
      setSuccess('Kalender gelöscht.');
      if (selectedCalendar?.id === id) { setSelectedCalendar(null); setViewMode('list'); }
      await fetchCalendars();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // --- Availability ---
  const addAvailSlot = (day: number) => {
    setAvailability(prev => [...prev, { day_of_week: day, start_time: '09:00', end_time: '17:00' }]);
  };

  const updateAvailSlot = (index: number, field: keyof AvailSlot, value: any) => {
    setAvailability(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeAvailSlot = (index: number) => {
    setAvailability(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = async () => {
    if (!selectedCalendar) return;
    setSaving(true);
    try {
      await setCalendarAvailability(selectedCalendar.id, availability);
      setSuccess('Verfügbarkeit gespeichert!');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedCalendar) return;
    setSaving(true);
    try {
      const updated = await updateCoachCalendar(selectedCalendar.id, settingsForm);
      setSelectedCalendar(updated);
      setSuccess('Einstellungen gespeichert!');
      setEditSettings(false);
      await fetchCalendars();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // --- Blocked Times ---
  const handleAddBlockedTime = async () => {
    if (!user || !blockDate) return;
    setSaving(true);
    try {
      await addCoachBlockedTime({
        coach_id: user.id,
        blocked_date: blockDate,
        all_day: blockAllDay,
        start_time: blockAllDay ? undefined : blockStart,
        end_time: blockAllDay ? undefined : blockEnd,
        reason: blockReason || undefined,
      });
      setBlockDate(''); setBlockReason(''); setBlockAllDay(true);
      const blocked = await getCoachBlockedTimes(user.id);
      setBlockedTimes(blocked);
      setSuccess('Blockzeit hinzugefügt.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlocked = async (id: string) => {
    try {
      await deleteCoachBlockedTime(id);
      if (user) {
        const blocked = await getCoachBlockedTimes(user.id);
        setBlockedTimes(blocked);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-zinc-500">
        <Loader2 className="animate-spin mr-2" size={20} /> Laden...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 pb-20">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] p-4 rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check size={16} /> {success}
        </div>
      )}

      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Terminkalender <span className="text-[#00FF00]">.</span>
              </h1>
              <p className="text-zinc-500 text-sm mt-1">Erstelle Kalender für deine Coaching-Termine wie bei Calendly.</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-[#00FF00] text-black font-bold px-5 py-3 rounded-xl hover:bg-[#00FF00]/80 transition-colors"
            >
              <Plus size={18} /> Neuer Kalender
            </button>
          </div>

          {/* Create Form Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-lg w-full animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Neuen Kalender erstellen</h2>
                  <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Name *</label>
                    <Input value={newCalName} onChange={e => setNewCalName(e.target.value)} placeholder="z.B. Erstgespräch, 1:1 Check-in" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Beschreibung</label>
                    <Input value={newCalDesc} onChange={e => setNewCalDesc(e.target.value)} placeholder="Optional" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Slot-Dauer (Min)</label>
                      <select value={newCalDuration} onChange={e => setNewCalDuration(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white">
                        <option value={15}>15 Min</option>
                        <option value={30}>30 Min</option>
                        <option value={45}>45 Min</option>
                        <option value={60}>60 Min</option>
                        <option value={90}>90 Min</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Puffer (Min)</label>
                      <select value={newCalBuffer} onChange={e => setNewCalBuffer(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white">
                        <option value={0}>Kein</option>
                        <option value={5}>5 Min</option>
                        <option value={10}>10 Min</option>
                        <option value={15}>15 Min</option>
                        <option value={30}>30 Min</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Max. Vorlauf (Tage)</label>
                      <Input type="number" value={newCalAdvance} onChange={e => setNewCalAdvance(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Min. Vorlauf (Std)</label>
                      <Input type="number" value={newCalNotice} onChange={e => setNewCalNotice(Number(e.target.value))} />
                    </div>
                  </div>

                  <Button onClick={handleCreateCalendar} disabled={!newCalName.trim() || saving} fullWidth className="mt-4">
                    {saving ? 'Erstelle...' : 'Kalender erstellen'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Cards */}
          {calendars.length === 0 ? (
            <div className="text-center py-20 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Noch keine Kalender erstellt.</p>
              <p className="text-sm text-zinc-700">Erstelle deinen ersten Kalender, um Termine zu verwalten.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {calendars.map(cal => (
                <div
                  key={cal.id}
                  onClick={() => handleSelectCalendar(cal)}
                  className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 hover:border-[#00FF00]/50 transition-all cursor-pointer group relative"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCalendar(cal.id); }}
                    className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-[#00FF00]/10 rounded-xl">
                      <Calendar size={20} className="text-[#00FF00]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-[#00FF00] transition-colors">{cal.name}</h3>
                      {cal.description && <p className="text-xs text-zinc-500">{cal.description}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{cal.slot_duration_minutes} Min</span>
                    {cal.buffer_minutes > 0 && <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded">+{cal.buffer_minutes} Puffer</span>}
                    <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{cal.max_advance_days}d Vorlauf</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* === BLOCKED TIMES SECTION === */}
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CalendarX size={18} className="text-red-400" /> Blockzeiten
            </h3>
            <p className="text-zinc-500 text-sm mb-4">Urlaub, Feiertage oder bestimmte Zeiten sperren — gilt für alle Kalender.</p>

            <div className="flex flex-wrap gap-3 mb-4 items-end">
              <div>
                <label className="text-xs font-bold text-zinc-500 mb-1 block">Datum</label>
                <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="blockAllDay" checked={blockAllDay} onChange={e => setBlockAllDay(e.target.checked)}
                  className="accent-[#00FF00]" />
                <label htmlFor="blockAllDay" className="text-sm text-zinc-400">Ganzer Tag</label>
              </div>

              {!blockAllDay && (
                <>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Von</label>
                    <select value={blockStart} onChange={e => setBlockStart(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm">
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 mb-1 block">Bis</label>
                    <select value={blockEnd} onChange={e => setBlockEnd(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm">
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-zinc-500 mb-1 block">Grund</label>
                <Input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Optional" />
              </div>

              <Button onClick={handleAddBlockedTime} disabled={!blockDate || saving} className="shrink-0">
                <Plus size={16} className="mr-1" /> Sperren
              </Button>
            </div>

            {/* Blocked list */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {blockedTimes.filter(b => new Date(b.blocked_date) >= new Date(new Date().toISOString().split('T')[0])).map(bt => (
                <div key={bt.id} className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CalendarX size={14} className="text-red-400" />
                    <span className="text-white font-medium">{new Date(bt.blocked_date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                    {bt.all_day ? (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Ganzer Tag</span>
                    ) : (
                      <span className="text-xs text-zinc-400">{bt.start_time} – {bt.end_time}</span>
                    )}
                    {bt.reason && <span className="text-xs text-zinc-600">({bt.reason})</span>}
                  </div>
                  <button onClick={() => handleDeleteBlocked(bt.id)} className="text-zinc-600 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {blockedTimes.filter(b => new Date(b.blocked_date) >= new Date(new Date().toISOString().split('T')[0])).length === 0 && (
                <p className="text-zinc-600 text-sm italic">Keine Blockzeiten eingetragen.</p>
              )}
            </div>
          </div>
        </>
      ) : selectedCalendar && (
        <>
          {/* === EDIT CALENDAR VIEW === */}
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => { setViewMode('list'); setSelectedCalendar(null); }} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-[#00FF00] transition-colors">
              <ChevronLeft size={20} className="text-zinc-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{selectedCalendar.name}</h1>
              <p className="text-zinc-500 text-sm">{selectedCalendar.description || 'Verfügbarkeiten bearbeiten'}</p>
            </div>
            <button onClick={() => setEditSettings(!editSettings)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-[#00FF00] transition-colors">
              <Settings size={18} className="text-zinc-400" />
            </button>
          </div>

          {/* Settings Panel */}
          {editSettings && (
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-top-2">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings size={16} /> Kalender-Einstellungen</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-3">
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Name</label>
                  <Input value={settingsForm.name} onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Slot-Dauer</label>
                  <select value={settingsForm.slot_duration_minutes} onChange={e => setSettingsForm(p => ({ ...p, slot_duration_minutes: Number(e.target.value) }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white">
                    {[15,30,45,60,90].map(v => <option key={v} value={v}>{v} Min</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Puffer</label>
                  <select value={settingsForm.buffer_minutes} onChange={e => setSettingsForm(p => ({ ...p, buffer_minutes: Number(e.target.value) }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white">
                    {[0,5,10,15,30].map(v => <option key={v} value={v}>{v} Min</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-1 block">Max. Vorlauf</label>
                  <Input type="number" value={settingsForm.max_advance_days} onChange={e => setSettingsForm(p => ({ ...p, max_advance_days: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveSettings} disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</Button>
                <button onClick={() => setEditSettings(false)} className="px-4 py-2 text-zinc-500 hover:text-white">Abbrechen</button>
              </div>
            </div>
          )}

          {/* === WEEKLY AVAILABILITY GRID === */}
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-[#00FF00]" /> Wöchentliche Verfügbarkeit
              </h3>
              <Button onClick={handleSaveAvailability} disabled={saving}>
                <Save size={16} className="mr-1" /> {saving ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 0].map(day => {
                const daySlots = availability.filter(s => s.day_of_week === day);
                const hasSlots = daySlots.length > 0;

                return (
                  <div key={day} className={`border rounded-xl p-4 transition-colors ${hasSlots ? 'border-[#00FF00]/30 bg-[#00FF00]/5' : 'border-zinc-800 bg-zinc-900/30'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold w-24 ${hasSlots ? 'text-[#00FF00]' : 'text-zinc-500'}`}>
                          {DAY_LABELS_FULL[day]}
                        </span>
                        {!hasSlots && <span className="text-xs text-zinc-600">Nicht verfügbar</span>}
                      </div>
                      <button
                        onClick={() => addAvailSlot(day)}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-[#00FF00] transition-colors px-2 py-1 rounded-lg hover:bg-[#00FF00]/10"
                      >
                        <Plus size={12} /> Zeitfenster
                      </button>
                    </div>

                    {daySlots.length > 0 && (
                      <div className="space-y-2 ml-0 md:ml-[108px]">
                        {availability.map((slot, idx) => {
                          if (slot.day_of_week !== day) return null;
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <select
                                value={slot.start_time}
                                onChange={e => updateAvailSlot(idx, 'start_time', e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-sm focus:border-[#00FF00] outline-none"
                              >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <span className="text-zinc-600">–</span>
                              <select
                                value={slot.end_time}
                                onChange={e => updateAvailSlot(idx, 'end_time', e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white text-sm focus:border-[#00FF00] outline-none"
                              >
                                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <button onClick={() => removeAvailSlot(idx)} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Schnellvorlagen</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const preset: AvailSlot[] = [1,2,3,4,5].map(d => ({ day_of_week: d, start_time: '09:00', end_time: '17:00' }));
                    setAvailability(preset);
                  }}
                  className="text-xs bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Mo–Fr 9–17 Uhr
                </button>
                <button
                  onClick={() => {
                    const preset: AvailSlot[] = [1,2,3,4,5].flatMap(d => [
                      { day_of_week: d, start_time: '09:00', end_time: '12:00' },
                      { day_of_week: d, start_time: '14:00', end_time: '18:00' },
                    ]);
                    setAvailability(preset);
                  }}
                  className="text-xs bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Mo–Fr 9–12 + 14–18 Uhr
                </button>
                <button
                  onClick={() => setAvailability([])}
                  className="text-xs bg-zinc-800 text-zinc-400 px-3 py-2 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Alles löschen
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoachCalendarSetup;
