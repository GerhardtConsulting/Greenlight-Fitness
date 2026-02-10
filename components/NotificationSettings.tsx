import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Mail, MailX, Smartphone, Clock, Shield, Loader2, Check, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { 
  getNotificationStatus, 
  requestNotificationPermission, 
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush
} from '../services/notifications';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from '../services/supabase';

interface NotificationSettingsProps {
  compact?: boolean;
}

// Toggle component
const Toggle: React.FC<{
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ enabled, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
    } ${enabled ? 'bg-[#00FF00]' : 'bg-zinc-700'}`}
  >
    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
      enabled ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </button>
);

// Preference row
const PrefRow: React.FC<{
  icon: string;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  tag?: { text: string; color: string };
}> = ({ icon, label, description, enabled, onChange, disabled, tag }) => (
  <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-40' : ''}`}>
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <span className="text-lg mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium">{label}</p>
          {tag && (
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${tag.color}`}>{tag.text}</span>
          )}
        </div>
        <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
      </div>
    </div>
    <div className="shrink-0 ml-3">
      <Toggle enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  </div>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ compact = false }) => {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role;

  const [pushStatus, setPushStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    pushSupported: boolean;
  }>({ supported: false, permission: 'default', pushSupported: false });
  
  const [pushLoading, setPushLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load push status + DB preferences
  useEffect(() => {
    const init = async () => {
      const currentStatus = getNotificationStatus();
      setPushStatus(currentStatus);
      
      if (currentStatus.permission === 'granted' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setSubscribed(!!subscription);
        } catch { /* ignore */ }
      }

      if (user?.id) {
        try {
          const p = await getNotificationPreferences(user.id);
          setPrefs(p);
        } catch (e) {
          console.error('Error loading notification preferences:', e);
        }
      }
      setPrefsLoading(false);
    };
    
    init();
  }, [user?.id]);

  // Save a preference change with debounce feedback
  const updatePref = useCallback(async (key: string, value: boolean | number | string) => {
    if (!user?.id || !prefs) return;
    
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);

    try {
      await saveNotificationPreferences(user.id, { [key]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Error saving preference:', e);
      // Revert
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  }, [user?.id, prefs]);

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setPushStatus(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        const registration = await registerServiceWorker();
        if (registration) {
          const subscription = await subscribeToPush(registration);
          setSubscribed(!!subscription);
          if (subscription && user?.id) {
            await saveNotificationPreferences(user.id, { push_enabled: true });
            if (prefs) setPrefs({ ...prefs, push_enabled: true });
          }
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      if (user?.id) {
        await saveNotificationPreferences(user.id, { push_enabled: false });
        if (prefs) setPrefs({ ...prefs, push_enabled: false });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
    } finally {
      setPushLoading(false);
    }
  };

  // Compact mode: just a toggle button
  if (compact) {
    if (!pushStatus.supported) return null;
    return (
      <button
        onClick={subscribed ? handleDisablePush : handleEnablePush}
        disabled={pushLoading || pushStatus.permission === 'denied'}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
          subscribed 
            ? 'bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/20' 
            : 'bg-zinc-800 text-zinc-400 hover:text-white'
        } disabled:opacity-50`}
      >
        {pushLoading ? <Loader2 size={18} className="animate-spin" /> : subscribed ? <Bell size={18} /> : <BellOff size={18} />}
        <span className="text-sm font-medium">{pushLoading ? '...' : subscribed ? 'Aktiv' : 'Aktivieren'}</span>
      </button>
    );
  }

  const isAthlete = role === UserRole.ATHLETE;
  const isCoach = role === UserRole.COACH;
  const isAdmin = role === UserRole.ADMIN;
  const emailEnabled = prefs?.email_enabled ?? true;

  return (
    <div id="notifications" className="space-y-4">
      {/* ===== PUSH NOTIFICATIONS ===== */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                subscribed ? 'bg-[#00FF00]/10' : 'bg-zinc-800'
              }`}>
                <Smartphone size={20} className={subscribed ? 'text-[#00FF00]' : 'text-zinc-500'} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Push-Benachrichtigungen</h3>
                <p className="text-zinc-500 text-xs">
                  {pushStatus.permission === 'denied' ? 'Im Browser blockiert' : subscribed ? 'Aktiv — du wirst benachrichtigt' : 'Erhalte sofortige Updates'}
                </p>
              </div>
            </div>
            {pushStatus.supported && pushStatus.permission !== 'denied' && (
              <button
                onClick={subscribed ? handleDisablePush : handleEnablePush}
                disabled={pushLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  subscribed ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-[#00FF00] text-black'
                } disabled:opacity-50`}
              >
                {pushLoading ? <Loader2 size={14} className="animate-spin" /> : subscribed ? 'Deaktivieren' : 'Aktivieren'}
              </button>
            )}
          </div>
        </div>

        {pushStatus.permission === 'denied' && (
          <div className="p-3 bg-red-500/5">
            <p className="text-red-400 text-xs text-center">
              Push wurde im Browser blockiert. Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen.
            </p>
          </div>
        )}
      </div>

      {/* ===== E-MAIL NOTIFICATIONS ===== */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                emailEnabled ? 'bg-[#00FF00]/10' : 'bg-zinc-800'
              }`}>
                {emailEnabled ? <Mail size={20} className="text-[#00FF00]" /> : <MailX size={20} className="text-zinc-500" />}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">E-Mail-Benachrichtigungen</h3>
                <p className="text-zinc-500 text-xs">
                  {emailEnabled ? 'Aktiv — du erhältst E-Mails' : 'Deaktiviert — keine E-Mails'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin text-zinc-500" />}
              {saved && <Check size={14} className="text-[#00FF00]" />}
              <Toggle
                enabled={emailEnabled}
                onChange={(v) => updatePref('email_enabled', v)}
                disabled={prefsLoading}
              />
            </div>
          </div>
        </div>

        {/* Per-type toggles */}
        {prefs && (
          <div className="px-4 divide-y divide-zinc-800/50">
            {/* ---- ATHLETE SECTION ---- */}
            {(isAthlete || isAdmin) && (
              <>
                <div className="pt-3 pb-1">
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    {isAdmin ? 'Athleten-Benachrichtigungen' : 'Training & Fortschritt'}
                  </p>
                </div>
                <PrefRow
                  icon="💪"
                  label="Trainings-Erinnerungen"
                  description="Tägliche Erinnerung an geplante Sessions"
                  enabled={prefs.training_reminders}
                  onChange={(v) => updatePref('training_reminders', v)}
                  disabled={!emailEnabled}
                />
                <PrefRow
                  icon="☀️"
                  label="Check-In-Erinnerungen"
                  description="Tägliche Erinnerung an deinen Wellness Check-In"
                  enabled={prefs.checkin_reminders}
                  onChange={(v) => updatePref('checkin_reminders', v)}
                  disabled={!emailEnabled}
                />
                <PrefRow
                  icon="�"
                  label="Wöchentlicher Fortschritt"
                  description="Wochen-Report mit KPIs, Trainingserfüllung & Streaks"
                  enabled={prefs.weekly_progress}
                  onChange={(v) => updatePref('weekly_progress', v)}
                  disabled={!emailEnabled}
                />
                <PrefRow
                  icon="👋"
                  label="Inaktivitäts-Erinnerungen"
                  description="Sanfte Erinnerung, wenn du länger nicht aktiv warst"
                  enabled={prefs.inactivity_alerts}
                  onChange={(v) => updatePref('inactivity_alerts', v)}
                  disabled={!emailEnabled}
                  tag={{ text: 'Abwählbar', color: 'bg-blue-500/20 text-blue-400' }}
                />
              </>
            )}

            {/* ---- COACH SECTION ---- */}
            {(isCoach || isAdmin) && (
              <>
                <div className="pt-4 pb-1">
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Coach-Reports</p>
                </div>
                <PrefRow
                  icon="📈"
                  label="Wöchentlicher Athleten-Report"
                  description="KPIs: Aktivität, Check-In-Rate, Top-Performer, Risiken"
                  enabled={prefs.athlete_summary}
                  onChange={(v) => updatePref('athlete_summary', v)}
                  disabled={!emailEnabled}
                />
                <PrefRow
                  icon="⚠️"
                  label="Churn-Risiko-Alerts"
                  description="Sofortige Warnung bei Athleten mit Abwanderungsrisiko"
                  enabled={prefs.churn_risk_alerts}
                  onChange={(v) => updatePref('churn_risk_alerts', v)}
                  disabled={!emailEnabled}
                  tag={{ text: 'Empfohlen', color: 'bg-amber-500/20 text-amber-400' }}
                />
              </>
            )}

            {/* ---- ADMIN SECTION ---- */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-1">
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Admin-Reports</p>
                </div>
                <PrefRow
                  icon="📊"
                  label="Wöchentlicher Business-Report"
                  description="Umsatz, Abos, Churn-Rate, Conversion, Coach-Performance"
                  enabled={prefs.business_reports}
                  onChange={(v) => updatePref('business_reports', v)}
                  disabled={!emailEnabled}
                />
                <PrefRow
                  icon="🚨"
                  label="Churn-Alerts"
                  description="Sofortige Warnung bei erhöhter Kündigungsrate"
                  enabled={prefs.churn_alerts}
                  onChange={(v) => updatePref('churn_alerts', v)}
                  disabled={!emailEnabled}
                  tag={{ text: 'Empfohlen', color: 'bg-red-500/20 text-red-400' }}
                />
              </>
            )}

            {/* ---- SEND TIME ---- */}
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🕐</span>
                  <div>
                    <p className="text-white text-sm font-medium">Bevorzugte Sendezeit</p>
                    <p className="text-zinc-500 text-xs">Tägliche E-Mails werden um diese Uhrzeit gesendet</p>
                  </div>
                </div>
                <select
                  value={prefs.preferred_send_hour}
                  onChange={(e) => updatePref('preferred_send_hour', parseInt(e.target.value))}
                  disabled={!emailEnabled}
                  className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:border-[#00FF00] focus:outline-none disabled:opacity-40"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, '0')}:00 Uhr</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {prefsLoading && (
          <div className="p-6 flex justify-center">
            <Loader2 size={20} className="animate-spin text-zinc-500" />
          </div>
        )}
      </div>

      {/* ===== DSGVO INFO ===== */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-zinc-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-zinc-500 text-xs leading-relaxed">
              <strong className="text-zinc-400">Datenschutz (DSGVO):</strong> Du kannst jede Benachrichtigung jederzeit abschalten.
              Transaktions-E-Mails (Kaufbestätigungen, Kündigungen, Passwort-Reset) sind gesetzlich vorgeschrieben und können nicht deaktiviert werden.
              Marketing- und Reattention-Mails werden nur mit deiner Einwilligung versendet.
              {' '}<a href="https://greenlight-fitness.de/datenschutz" className="text-zinc-400 underline hover:text-white">Datenschutzerklärung →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
