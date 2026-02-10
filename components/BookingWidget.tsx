import React, { useState, useEffect, useMemo } from 'react';
import { getAvailableSlots, getDatesWithAvailability } from '../services/supabase';
import { ChevronLeft, ChevronRight, Clock, Calendar, Check, Loader2 } from 'lucide-react';

interface BookingWidgetProps {
  calendarId: string;
  calendarName?: string;
  slotDuration?: number;
  onSelectSlot: (date: string, time: string) => void;
  onCancel?: () => void;
}

const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const DAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const BookingWidget: React.FC<BookingWidgetProps> = ({ calendarId, calendarName, slotDuration = 30, onSelectSlot, onCancel }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch available dates for current month view
  useEffect(() => {
    const fetchDates = async () => {
      setLoadingDates(true);
      try {
        const startDate = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
        const endDate = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const dates = await getDatesWithAvailability(calendarId, startDate, endDate);
        setAvailableDates(new Set(dates));
      } catch (e) {
        console.error('Failed to fetch dates:', e);
      } finally {
        setLoadingDates(false);
      }
    };
    fetchDates();
  }, [calendarId, currentMonth]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate) { setSlots([]); return; }
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const available = await getAvailableSlots(calendarId, selectedDate);
        setSlots(available);
      } catch (e) {
        console.error('Failed to fetch slots:', e);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [calendarId, selectedDate]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
    const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
    
    // Adjust to start on Monday (0=Mon in our grid)
    let startDow = firstDay.getDay() - 1; // JS: 0=Sun, we want 0=Mon
    if (startDow < 0) startDow = 6;

    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; isAvailable: boolean; isPast: boolean }[] = [];
    
    // Previous month padding
    for (let i = 0; i < startDow; i++) {
      const d = new Date(currentMonth.year, currentMonth.month, -startDow + i + 1);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, day: d.getDate(), isCurrentMonth: false, isToday: false, isAvailable: false, isPast: true });
    }

    // Current month
    const today = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateStr < today;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        isToday: dateStr === today,
        isAvailable: !isPast && availableDates.has(dateStr),
        isPast,
      });
    }

    // Next month padding (fill to 42 = 6 rows)
    while (days.length < 42) {
      const d = new Date(currentMonth.year, currentMonth.month + 1, days.length - startDow - lastDay.getDate() + 1);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, day: d.getDate(), isCurrentMonth: false, isToday: false, isAvailable: false, isPast: false });
    }

    return days;
  }, [currentMonth, availableDates]);

  const navigateMonth = (dir: -1 | 1) => {
    setSelectedDate(null);
    setCurrentMonth(prev => {
      let m = prev.month + dir;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  };

  const canGoPrev = () => {
    const now = new Date();
    return currentMonth.year > now.getFullYear() || (currentMonth.year === now.getFullYear() && currentMonth.month > now.getMonth());
  };

  const handleConfirm = () => {
    if (selectedDate && selectedSlot) {
      onSelectSlot(selectedDate, selectedSlot);
    }
  };

  return (
    <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={18} className="text-[#00FF00]" />
          <h3 className="text-lg font-bold text-white">Termin buchen</h3>
        </div>
        {calendarName && <p className="text-sm text-zinc-400">{calendarName} &bull; {slotDuration} Min</p>}
      </div>

      <div className="flex flex-col md:flex-row">
        {/* === LEFT: Calendar === */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-zinc-800">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => canGoPrev() && navigateMonth(-1)}
              disabled={!canGoPrev()}
              className="p-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} className="text-zinc-400" />
            </button>
            <h4 className="text-sm font-bold text-white">
              {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
            </h4>
            <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <ChevronRight size={18} className="text-zinc-400" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-zinc-600 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loadingDates ? (
            <div className="flex items-center justify-center py-16 text-zinc-600">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const isSelected = day.date === selectedDate;
                return (
                  <button
                    key={i}
                    onClick={() => day.isAvailable && setSelectedDate(day.date)}
                    disabled={!day.isAvailable || !day.isCurrentMonth}
                    className={`
                      aspect-square rounded-xl text-sm font-medium transition-all relative flex items-center justify-center
                      ${!day.isCurrentMonth ? 'text-zinc-800 cursor-default' : ''}
                      ${day.isCurrentMonth && !day.isAvailable ? 'text-zinc-700 cursor-default' : ''}
                      ${day.isAvailable && !isSelected ? 'text-white hover:bg-[#00FF00]/20 hover:text-[#00FF00] cursor-pointer font-bold' : ''}
                      ${isSelected ? 'bg-[#00FF00] text-black font-bold shadow-[0_0_12px_rgba(0,255,0,0.4)]' : ''}
                      ${day.isToday && !isSelected ? 'ring-1 ring-[#00FF00]/40' : ''}
                    `}
                  >
                    {day.day}
                    {day.isAvailable && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00FF00]"></span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* === RIGHT: Time Slots === */}
        <div className="w-full md:w-[220px] p-6">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Clock size={32} className="text-zinc-700 mb-3" />
              <p className="text-zinc-600 text-sm">Wähle zuerst ein Datum aus.</p>
            </div>
          ) : loadingSlots ? (
            <div className="flex items-center justify-center py-16 text-zinc-600">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Calendar size={32} className="text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">Keine freien Slots an diesem Tag.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase mb-3">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {slots.map(slot => {
                  const isSelected = slot === selectedSlot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      className={`
                        w-full py-3 px-4 rounded-xl text-sm font-bold transition-all text-center
                        ${isSelected
                          ? 'bg-[#00FF00] text-black shadow-[0_0_12px_rgba(0,255,0,0.4)]'
                          : 'bg-zinc-900 border border-zinc-700 text-white hover:border-[#00FF00]/50 hover:bg-[#00FF00]/10'
                        }
                      `}
                    >
                      {isSelected && <Check size={14} className="inline mr-1" />}
                      {slot} Uhr
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800 flex justify-between items-center">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-zinc-500 hover:text-white transition-colors px-4 py-2">
            Abbrechen
          </button>
        )}
        <div className="flex-1" />
        {selectedDate && selectedSlot && (
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-[#00FF00] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#00FF00]/80 transition-colors shadow-[0_0_15px_rgba(0,255,0,0.3)]"
          >
            <Check size={16} />
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} um {selectedSlot} bestätigen
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingWidget;
