import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createCheckIn, getCheckIns, getAthleteCoachRelationship, uploadFile, getPublicUrl } from '../services/supabase';
import { 
  ClipboardCheck, Camera, Scale, Moon, Brain, Zap, Send, Loader2, Check, 
  ChevronDown, ChevronUp, MessageSquare, X, Sun, Heart, Dumbbell
} from 'lucide-react';

interface CheckInFormProps {
  onComplete?: () => void;
  compact?: boolean;
}

const CheckInForm: React.FC<CheckInFormProps> = ({ onComplete, compact = false }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  // Core daily ratings
  const [sleepRating, setSleepRating] = useState(0);
  const [energyRating, setEnergyRating] = useState(0);
  const [stressRating, setStressRating] = useState(0);
  const [moodRating, setMoodRating] = useState(0);
  const [muscleSoreness, setMuscleSoreness] = useState(0);

  // Extended fields (optional, expandable)
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [nutritionRating, setNutritionRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // Check if already submitted today
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);

  const getToday = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      checkExisting();
      loadCoach();
    }
  }, [user]);

  const checkExisting = async () => {
    if (!user) return;
    try {
      const checkIns = await getCheckIns(user.id);
      const today = getToday();
      const existing = checkIns.find((ci: any) => ci.date === today);
      if (existing) {
        setAlreadySubmitted(true);
        setLastCheckIn(existing);
      }
    } catch (e) {
      console.error('Error checking existing check-ins:', e);
    }
  };

  const loadCoach = async () => {
    if (!user) return;
    try {
      const rel = await getAthleteCoachRelationship(user.id);
      if (rel) setCoachId(rel.coach_id);
    } catch (e) { /* No coach assigned */ }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 4) { alert('Maximal 4 Fotos erlaubt.'); return; }
    setPhotos(prev => [...prev, ...files]);
    files.forEach(file => {
      setPhotoPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
  };

  const hasAnyRating = sleepRating > 0 || energyRating > 0 || stressRating > 0 || moodRating > 0 || muscleSoreness > 0;

  const handleSubmit = async () => {
    if (!user || !hasAnyRating) return;
    setSaving(true);
    try {
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const path = `check-ins/${user.id}/${Date.now()}-${photo.name}`;
        await uploadFile('check-in-photos', path, photo);
        photoUrls.push(getPublicUrl('check-in-photos', path));
      }

      await createCheckIn({
        athlete_id: user.id,
        coach_id: coachId || undefined,
        date: getToday(),
        sleep_rating: sleepRating || undefined,
        energy_rating: energyRating || undefined,
        stress_rating: stressRating || undefined,
        mood_rating: moodRating || undefined,
        muscle_soreness: muscleSoreness || undefined,
        nutrition_rating: nutritionRating || undefined,
        weight: weight ? parseFloat(weight) : undefined,
        body_fat: bodyFat ? parseFloat(bodyFat) : undefined,
        notes: notes.trim() || undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
      });

      setSubmitted(true);
      setAlreadySubmitted(true);
      onComplete?.();
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    } catch (e) {
      console.error('Error submitting check-in:', e);
      alert('Fehler beim Speichern des Check-Ins.');
    } finally {
      setSaving(false);
    }
  };

  // Compact emoji rating selector
  const EmojiRating: React.FC<{
    value: number;
    onChange: (v: number) => void;
    icon: React.ReactNode;
    label: string;
    colors: string[];
  }> = ({ value, onChange, icon, label, colors }) => (
    <div className="flex items-center gap-2">
      <div className="w-7 shrink-0 flex justify-center">{icon}</div>
      <span className="text-[10px] text-zinc-500 font-medium w-16 shrink-0">{label}</span>
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(value === v ? 0 : v)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              v <= value
                ? `${colors[Math.min(v - 1, colors.length - 1)]} text-black`
                : 'bg-zinc-800/80 text-zinc-600 hover:bg-zinc-700/80'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  const greenScale = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-[#00FF00]'];
  const reverseScale = ['bg-[#00FF00]', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

  // Already submitted today
  if (alreadySubmitted && !expanded) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center">
              <Sun size={20} className="text-[#00FF00]" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Täglicher Check-In</p>
              <p className="text-[#00FF00] text-xs flex items-center gap-1">
                <Check size={12} />
                {submitted ? 'Gerade eingereicht!' : 'Heute erledigt'}
                {lastCheckIn?.status === 'REVIEWED' && (
                  <span className="text-blue-400 ml-1 flex items-center gap-0.5">
                    <MessageSquare size={10} /> Coach hat geantwortet
                  </span>
                )}
              </p>
            </div>
          </div>
          <ChevronDown size={16} className="text-zinc-500" />
        </button>
        {lastCheckIn?.coach_response && (
          <div className="px-4 pb-3 border-t border-zinc-800">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mt-2">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Coach Feedback</p>
              <p className="text-zinc-300 text-sm">{lastCheckIn.coach_response}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alreadySubmitted ? 'bg-[#00FF00]/10' : 'bg-amber-500/10'}`}>
            <Sun size={20} className={alreadySubmitted ? 'text-[#00FF00]' : 'text-amber-400'} />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">Täglicher Check-In</p>
            <p className={`text-xs ${alreadySubmitted ? 'text-[#00FF00]' : 'text-amber-400'}`}>
              {alreadySubmitted ? '✓ Heute erledigt' : 'Wie fühlst du dich heute? (30 Sek.)'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>

      {/* Form */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-3">
          {/* Core Ratings — always visible, quick to fill */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Wellness-Check</p>
            <EmojiRating value={sleepRating} onChange={setSleepRating}
              icon={<Moon size={14} className="text-blue-400" />} label="Schlaf" colors={greenScale} />
            <EmojiRating value={energyRating} onChange={setEnergyRating}
              icon={<Zap size={14} className="text-yellow-400" />} label="Energie" colors={greenScale} />
            <EmojiRating value={moodRating} onChange={setMoodRating}
              icon={<Heart size={14} className="text-pink-400" />} label="Stimmung" colors={greenScale} />
            <EmojiRating value={stressRating} onChange={setStressRating}
              icon={<Brain size={14} className="text-red-400" />} label="Stress" colors={reverseScale} />
            <EmojiRating value={muscleSoreness} onChange={setMuscleSoreness}
              icon={<Dumbbell size={14} className="text-purple-400" />} label="Muskelkater" colors={reverseScale} />
          </div>

          {/* Expandable Extra Section */}
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1 flex items-center justify-center gap-1"
          >
            {showExtras ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showExtras ? 'Weniger anzeigen' : 'Körperdaten, Notizen & Fotos hinzufügen'}
          </button>

          {showExtras && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              {/* Body Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Gewicht (kg)</label>
                  <input type="text" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)}
                    placeholder="80.0" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:border-[#00FF00] outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Körperfett (%)</label>
                  <input type="text" inputMode="decimal" value={bodyFat} onChange={e => setBodyFat(e.target.value)}
                    placeholder="15.0" className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:border-[#00FF00] outline-none" />
                </div>
              </div>

              {/* Nutrition */}
              <EmojiRating value={nutritionRating} onChange={setNutritionRating}
                icon={<Scale size={14} className="text-green-400" />} label="Ernährung" colors={greenScale} />

              {/* Notes */}
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Notizen an Coach</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Wie fühlst du dich? Gibt es etwas, das dein Coach wissen sollte?"
                  rows={2} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-[#00FF00] outline-none resize-none" />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Fotos (optional, max. 4)</label>
                <div className="flex gap-2 flex-wrap">
                  {photoPreviewUrls.map((url, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-700">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 4 && (
                    <label className="w-14 h-14 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-[#00FF00] transition-colors">
                      <Camera size={16} className="text-zinc-500" />
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" multiple />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !hasAnyRating}
            className="w-full py-3 bg-[#00FF00] text-black rounded-xl font-bold text-sm hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Check-In speichern
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckInForm;
