# 🔑 CASCADE REFERENZ – GREENLIGHT FITNESS

> **Letzte Aktualisierung**: 11. Februar 2026  
> Diese Datei enthält ALLE wichtigen Credentials, Befehle und Kontexte für neue Cascade-Sessions.  
> **TSC-Status**: ✅ 0 Fehler | **Firebase**: ❌ Komplett entfernt (Supabase only)

---

## 📝 COPY-PASTE FÜR NEUE CASCADE-SESSION

Kopiere diesen Block am Anfang einer neuen Session:

```
Ich arbeite an Greenlight Fitness, einer PWA für Fitness-Coaching.
Bitte lies zuerst CASCADE_REFERENCE.md — dort stehen ALLE Credentials, Befehle und Projektinfos.

PROJEKT-PFAD: /Users/dev/Downloads/Greenlight-Fitness-main

TECH STACK:
- React 19.2 + TypeScript 5.8 + Vite 6.2
- Supabase (Auth, PostgreSQL, Storage, RLS)
- Tailwind CSS (via CDN in index.html)
- Lucide Icons
- Stripe (Payments, TEST MODE)
- Vercel (Hosting + Serverless API Routes)
- Resend (E-Mails)
- Google Gemini AI

GIT:
- Repo: https://github.com/Greenlightfitness/greenlight-fitness-app.git
- Branch: main
- Push-Befehl: git push origin main

SUPABASE:
- Project ID: lfpcyhrccefbeowsgojv
- URL: https://lfpcyhrccefbeowsgojv.supabase.co

WICHTIGE DATEIEN:
- CASCADE_REFERENCE.md → Alle Keys + Befehle
- WINDSURF_GUIDE.md → Vollständige Doku
- supabase-schema.sql → DB-Schema (DDL)
- services/supabase.ts → Client + CRUD-Funktionen (~2500 Zeilen)
- types.ts → Alle TypeScript Interfaces
- App.tsx → Routing + Onboarding Gate

REGELN:
- TSC muss clean bleiben: npx tsc --noEmit --pretty
- Supabase: .maybeSingle() statt .single() bei optionalen Abfragen
- User-Objekt: user.id (NICHT user.uid — Firebase ist weg)
- AuthContext exportiert: user, userProfile, loading, refreshProfile, activeRole, setActiveRole, canSwitchRole
- Premium-Check: getActiveSubscription(userId) || getCoachingRelationship(athleteId)
```

---

## ⚡ SUPABASE KONFIGURATION

### Projekt-Info
| Key | Value |
|-----|-------|
| **Project Ref / ID** | `lfpcyhrccefbeowsgojv` |
| **Project URL** | `https://lfpcyhrccefbeowsgojv.supabase.co` |
| **Region** | Frankfurt (eu-central-1) |
| **Dashboard** | https://supabase.com/dashboard/project/lfpcyhrccefbeowsgojv |

### API Keys
```env
# Frontend (öffentlich, kann im Browser verwendet werden)
VITE_SUPABASE_URL=https://lfpcyhrccefbeowsgojv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTg1NTksImV4cCI6MjA4NTE3NDU1OX0.dD0HLt0fqzVNMOdDykjn8Bs60LfqpPFwlG1hkaYfov8
```

### Service Role Key (NUR für DB-Operationen/Server-Side!)
```env
# ⚠️ NIEMALS im Frontend verwenden! Umgeht RLS!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5ODU1OSwiZXhwIjoyMDg1MTc0NTU5fQ.PcKcY12wubbHmUxRVW2B-2JRMuZ_9G3RqEY8WUdCclU
```

### Datenbank-Direktverbindung (PostgreSQL)
```bash
# Verbindungs-String
postgresql://postgres:GreenlightFitnessSupaBase1!@db.lfpcyhrccefbeowsgojv.supabase.co:5432/postgres

# SQL direkt ausführen
PGPASSWORD='GreenlightFitnessSupaBase1!' psql -h db.lfpcyhrccefbeowsgojv.supabase.co -p 5432 -U postgres -d postgres -c "SQL_HIER"

# Schema-Datei deployen
PGPASSWORD='GreenlightFitnessSupaBase1!' psql -h db.lfpcyhrccefbeowsgojv.supabase.co -p 5432 -U postgres -d postgres -f supabase-schema.sql
```

---

## 🔐 WEITERE API KEYS

### Google AI (Gemini)
```env
VITE_GEMINI_API_KEY=AIzaSyDPNlS0yMNjdxOvzWZK_0a1Kj77nN80jnE
```

### Resend (E-Mail)
```env
RESEND_API_KEY=re_UKW8EaYn_KWDciwQGRLuF3uqxLJPAAQ2e
```

### Stripe (Payment) – TEST MODE!
```env
# ⚠️ NUR TEST-KEYS! Niemals sk_live_ ohne doppelte Bestätigung!
STRIPE_SECRET_KEY=sk_test_51RTbZ0PxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## � GIT & DEPLOYMENT

### GitHub
```bash
# Repository
REPO=https://github.com/Greenlightfitness/greenlight-fitness-app.git

# Git User
# Name: MaximilianGerhardt
# Email: maximiliangerhardtofficial@gmail.com

# Push mit PAT (falls origin nicht konfiguriert)
# Den PAT findest du in scripts/credentials.md (gitignored) oder im GitHub Settings
git push https://oauth2:<DEIN_GITHUB_PAT>@github.com/Greenlightfitness/greenlight-fitness-app.git main

# Standard-Push (wenn origin gesetzt)
git push origin main
```

### Vercel (Hosting)
- **Framework**: Vite (React)
- **Config**: `vercel.json` — rewrites `/api/*` zu Serverless Functions, alles andere zu `index.html`
- **API Routes**: `/api/` Ordner mit Vercel Serverless Functions (Node.js)
- **Auto-Deploy**: Verbunden mit GitHub `main` Branch → Push = Deploy
- **Env Vars**: In Vercel Dashboard konfiguriert (VITE_* = nicht sensitive, Rest = sensitive)

### Deploy-Workflow (Standardablauf)
```bash
# 1. TypeScript prüfen
npx tsc --noEmit --pretty

# 2. Build testen
npm run build

# 3. Commit & Push (triggert Vercel Auto-Deploy)
git add -A
git commit -m "feat/fix: Beschreibung"
git push origin main
```

---

## 📁 PROJEKTSTRUKTUR

```
/Users/dev/Downloads/Greenlight-Fitness-main/
├── App.tsx                    # Routing + Onboarding Gate
├── index.tsx                  # Entry Point
├── index.html                 # HTML + Tailwind CDN
├── types.ts                   # Alle TypeScript Interfaces
├── vite.config.ts             # Vite Config (Port 3000)
├── vercel.json                # Vercel Rewrites
├── supabase-schema.sql        # Komplettes DB-Schema (DDL)
├── CASCADE_REFERENCE.md       # ← DIESE DATEI
├── WINDSURF_GUIDE.md          # Vollständige Projektdoku
│
├── api/                       # Vercel Serverless Functions
│   ├── create-checkout.ts     # Stripe Checkout Session
│   ├── create-stripe-product.ts
│   ├── get-customer-data.ts   # Stripe Kundendaten
│   ├── send-email.ts          # Resend E-Mails
│   ├── stripe-webhook.ts      # Stripe Webhooks
│   └── ...
│
├── components/                # React Komponenten
│   ├── Layout.tsx             # Navigation (Sidebar desktop, Bottom tabs mobile)
│   ├── AthleteTrainingView.tsx # Workout-Ausführung (Blocks, Sets, Timer)
│   ├── AthleteProfileModal.tsx # Coach-Sicht auf Athleten
│   ├── ErrorBoundary.tsx
│   ├── MyCoach.tsx            # Athlet sieht seinen Coach
│   ├── GoalWidget.tsx
│   ├── BodyTracker.tsx        # Körperdaten-Tracking
│   ├── CheckInForm.tsx        # Wöchentliche Check-Ins
│   ├── CoachNotesPanel.tsx    # Coach-Notizen pro Athlet
│   ├── WorkoutReview.tsx      # Coach reviewed Workouts
│   ├── ComplianceDashboard.tsx
│   ├── RevenueWidget.tsx
│   ├── ConfirmActionModal.tsx # Bestätigungsdialoge mit Checklisten
│   ├── CoachOnboarding.tsx
│   ├── AdminOnboarding.tsx
│   ├── ProfileSetupWizard.tsx
│   ├── ExerciseEditorModal.tsx
│   ├── planner/
│   │   ├── PlanEditor.tsx
│   │   ├── SessionBuilder.tsx
│   │   ├── ExerciseSelector.tsx  # ✅ Supabase
│   │   └── LibrarySelector.tsx   # ✅ Supabase
│   └── ...
│
├── pages/                     # Seiten (Routen)
│   ├── Dashboard.tsx          # Coach/Admin Dashboard
│   ├── AthleteDashboard.tsx   # Athleten Dashboard
│   ├── Exercises.tsx          # Übungsbibliothek
│   ├── Planner.tsx            # Trainingsplan-Verwaltung
│   ├── Shop.tsx               # Produkt-Shop
│   ├── AdminProducts.tsx      # Produkt-CRUD (Admin)
│   ├── AdminCRM.tsx           # User-Management (Admin)
│   ├── CoachCalendarSetup.tsx # Kalender-Setup + Buchungslink + Bookings
│   ├── WorkoutHistory.tsx     # Trainingshistorie
│   ├── PublicBooking.tsx      # Öffentliche Terminbuchung (/book/:slug)
│   ├── Chat.tsx
│   ├── Profile.tsx
│   └── ...
│
├── context/
│   ├── AuthContext.tsx         # user, userProfile, activeRole, refreshProfile
│   └── LanguageContext.tsx     # i18n (DE/EN)
│
├── services/
│   ├── supabase.ts            # Supabase Client + ALLE CRUD-Funktionen (~2500 Zeilen)
│   ├── notifications.ts       # Push + Local Notifications
│   └── firebase.ts            # ⚠️ Legacy — wird NICHT mehr importiert
│
├── utils/
│   ├── formulas.ts            # FFMI, Wilks, Volume-Berechnungen
│   └── planParser.ts
│
├── scripts/                   # SQL-Migrations + Datenbank-Scripts
│   ├── migrate-*.sql
│   └── ...
│
└── docs/                      # Zusätzliche Dokumentation
```

---

## 🏗️ AKTUELLE DB-TABELLEN

| Tabelle | Zweck |
|---------|-------|
| `profiles` | User-Profile (auth.users erweitert) — inkl. booking_slug, avatarUrl |
| `exercises` | Übungsbibliothek (inkl. tracking_type, default_visible_metrics) |
| `plans` | Trainingspläne (structure als JSON: weeks→sessions→workoutData) |
| `assigned_plans` | Zugewiesene Pläne an Athleten (inkl. progress_percentage) |
| `products` | Shop-Produkte (Stripe-Integration, trial_days, has_chat_access) |
| `product_modules` | Verknüpfung Produkt ↔ Plan |
| `purchases` | Käufe (one-time) |
| `subscriptions` | Abo-Verwaltung |
| `coaching_relationships` | Coach ↔ Athlet Beziehungen |
| `coaching_approvals` | Freischaltungen für Coaching-Produkte |
| `attentions` | Ticket-System (Verletzungen, Feedback) |
| `activities` | Activity Feed |
| `appointments` | Termine (inkl. Buchungssystem) |
| `athlete_schedule` | Eigene + Plan-basierte Workouts der Athleten |
| `workout_logs` | Trainings-Protokolle (Sets, Volume, PRs) |
| `body_measurements` | Körperdaten über Zeit (Gewicht, Fett, Umfänge) |
| `coach_notes` | Coach-Notizen pro Athlet |
| `workout_feedback` | Coach-Kommentare auf Workout-Logs |
| `check_ins` | Wöchentliche Athleten Check-Ins |
| `coach_calendars` | Kalender-Konfiguration (Verfügbarkeiten) |
| `calendar_availability` | Zeitslots pro Kalender |
| `coach_blocked_times` | Geblockte Zeiten |
| `invitations` | Einladungscodes |
| `chat_rooms` / `chat_messages` | Chat-System |
| `user_consents` | DSGVO-Einwilligungen |
| `audit_log` | Audit Trail |

---

## 🔧 WICHTIGE PATTERNS & KONVENTIONEN

### AuthContext Destructuring
```tsx
const { user, userProfile, loading, refreshProfile, activeRole } = useAuth();
// NICHT: const { user, profile } = useAuth(); // ❌ "profile" existiert nicht
```

### Premium-Check
```tsx
const [hasPremium, setHasPremium] = useState(false);
useEffect(() => {
  const check = async () => {
    if (!user) return;
    const [sub, coaching] = await Promise.all([
      getActiveSubscription(user.id).catch(() => null),
      getCoachingRelationship(user.id).catch(() => null),
    ]);
    setHasPremium(!!(sub || coaching));
  };
  check();
}, [user]);
```

### Supabase Queries (Optional Results)
```tsx
// ✅ Richtig: maybeSingle() für optionale Ergebnisse
const { data, error } = await supabase.from('table').select('*').eq('id', x).maybeSingle();
// ❌ Falsch: single() wirft Fehler wenn 0 Zeilen
```

### User ID
```tsx
user.id   // ✅ Supabase
user.uid  // ❌ Firebase (entfernt!)
```

---

## �️ HÄUFIGE BEFEHLE

```bash
# Dev Server starten (Port 3000)
npm run dev

# TypeScript Check (muss 0 Fehler haben!)
npx tsc --noEmit --pretty

# Production Build
npm run build

# Git: Commit + Push (triggert Vercel Deploy)
git add -A && git commit -m "feat: Beschreibung" && git push origin main

# SQL direkt in Supabase ausführen
PGPASSWORD='GreenlightFitnessSupaBase1!' psql -h db.lfpcyhrccefbeowsgojv.supabase.co -p 5432 -U postgres -d postgres -c "SELECT COUNT(*) FROM profiles;"
```

---

## ⚠️ SICHERHEITS-HINWEISE

1. **Stripe**: NUR `sk_test_` Keys verwenden! Niemals `sk_live_` ohne doppelte Bestätigung!
2. **Service Role Key**: Nur für Server-Side/DB-Operationen, NIEMALS im Frontend!
3. **GitHub PAT**: Nur für Push verwenden, nicht im Code committen
4. **Vercel Env Vars**: `VITE_*` = öffentlich (Browser), Rest = secret (Server only)

---

**Ende der Referenz** | Greenlight Fitness 2026
