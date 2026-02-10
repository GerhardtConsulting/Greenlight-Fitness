# GREENLIGHT FITNESS — Projekt-Handover & Changelog

> **Erstellt:** 11. Februar 2026  
> **Projekt:** Greenlight Fitness — PWA für professionelles Fitness-Coaching  
> **Status:** Production-ready (Vercel), Stripe TEST MODE  
> **Live-URL:** https://greenlight-fitness-app.vercel.app

---

## 1. Executive Summary

Greenlight Fitness ist eine Progressive Web App (PWA) für professionelles Fitness-Coaching im Stil von TrainHeroic. Die Plattform verbindet Coaches mit Athleten und ermöglicht Trainingsplanung, Workout-Tracking, Produkt-Verkauf (Stripe), Chat, Terminbuchung und umfangreiche Admin-Verwaltung.

### Eckdaten

| Metrik | Wert |
|--------|------|
| **Gesamte Codezeilen** | ~35.340 (TypeScript/TSX) |
| **Seiten (Pages)** | 22 |
| **Komponenten** | 44 |
| **API-Endpunkte (Serverless)** | 12 |
| **Service-Layer** | 2.514 Zeilen (`supabase.ts`) |
| **Type Definitions** | 501 Zeilen (`types.ts`) |
| **DB-Tabellen** | 25+ (PostgreSQL via Supabase) |
| **Git-Commits** | 60+ |
| **Entwicklungszeitraum** | 02.02.2026 – 11.02.2026 |

---

## 2. Tech Stack

| Schicht | Technologie | Version |
|---------|-------------|---------|
| **Frontend** | React + TypeScript | 19.2 / 5.8 |
| **Bundler** | Vite | 6.2+ |
| **Styling** | Tailwind CSS (CDN) | 3.x |
| **Icons** | Lucide React | 0.562+ |
| **Backend/DB** | Supabase (Auth, PostgreSQL, Storage, RLS) | 2.93+ |
| **Payments** | Stripe (Checkout, Subscriptions, Webhooks) | 20.3+ |
| **E-Mail** | Resend | 6.9+ |
| **AI** | Google Gemini (@google/genai) | 1.37+ |
| **Hosting** | Vercel (SSG + Serverless Functions) | — |
| **PWA** | Service Worker + Manifest | — |

---

## 3. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER (PWA)                     │
│  React 19 · TypeScript · Tailwind · Lucide          │
├─────────────┬───────────────────┬───────────────────┤
│   Pages     │   Components      │   Context          │
│  (22 Views) │  (44 Widgets)     │  Auth + Language   │
├─────────────┴───────────────────┴───────────────────┤
│              services/supabase.ts                     │
│          (2.500+ LOC — CRUD, RPC, Storage)           │
├──────────────────────────────────────────────────────┤
│            Vercel Serverless API (/api/)              │
│  Stripe · Resend · Webhooks · Push Notifications     │
├──────────────────────────────────────────────────────┤
│                  SUPABASE                             │
│  PostgreSQL · Auth · Storage · RLS · Realtime         │
└──────────────────────────────────────────────────────┘
```

---

## 4. Feature-Katalog (vollständig)

### 4.1 Authentifizierung & Onboarding
| Feature | Status | Details |
|---------|--------|---------|
| Registrierung / Login | ✅ | Supabase Auth (E-Mail/Passwort) |
| Passwort-Reset | ✅ | E-Mail-basiert |
| E-Mail-Verifizierung | ✅ | Supabase Confirmation |
| Rollenbasierter Zugang | ✅ | ATHLETE, COACH, ADMIN |
| Dual-Role Switching | ✅ | Coach kann als Athlet agieren |
| Athlete Onboarding | ✅ | Profilwizard (Name, Körperdaten) |
| Coach Onboarding | ✅ | 5-Step (Legal, Profil, Bio, Booking, Preview) |
| Admin Onboarding | ✅ | 3-Step (Legal, Profil, Capabilities) |
| Einladungssystem | ✅ | Invite-Codes mit Auto-Assign |

### 4.2 Trainingsplanung (Planner)
| Feature | Status | Details |
|---------|--------|---------|
| Plan CRUD | ✅ | Erstellen, Bearbeiten, Löschen, Duplizieren |
| Wochen-Management | ✅ | Wochen hinzufügen, bearbeiten, kopieren |
| Session Builder | ✅ | Drag & Drop, Übungsauswahl, Sets/Reps |
| Übungsbibliothek | ✅ | 700+ Übungen, Custom-Übungen, Kategorien |
| Plan-Zuweisung | ✅ | Coach weist Plan an Athleten zu |
| Multi-Modul-Produkte | ✅ | Produkt mit mehreren Plänen |
| Deep Copy | ✅ | Plan → Wochen → Sessions komplett kopieren |
| Versionierung | ✅ | Plan-Snapshots bei Zuweisung |

### 4.3 Workout-Tracking (Athlet)
| Feature | Status | Details |
|---------|--------|---------|
| Tages-Workout-Ansicht | ✅ | Block-basiert, Timer, Rest-Timer |
| Set-Logging | ✅ | Gewicht, Reps, RPE, Notizen |
| Workout-History | ✅ | Kalender + Listenansicht |
| Volume-Tracking | ✅ | Automatische Berechnung |
| PR-Erkennung | ✅ | Personal Records hervorheben |
| Athleten-Dashboard | ✅ | Übersicht, nächstes Workout, Statistiken |
| Körperdaten-Tracking | ✅ | Gewicht, Körperfett, Umfänge, Diagramme |
| Check-Ins | ✅ | Wöchentliche Wellness-Check-Ins |
| Tages-Wellness | ✅ | Stimmung, Schlaf, Stress, Energie |

### 4.4 Coach-Dashboard
| Feature | Status | Details |
|---------|--------|---------|
| Athleten-Übersicht | ✅ | Alle zugeordneten Athleten |
| Compliance-Dashboard | ✅ | Trainings-Compliance pro Athlet |
| Workout-Review | ✅ | Coach prüft Athleten-Workouts |
| Coach-Notizen | ✅ | Notizen pro Athlet |
| Athleten-Profil-Modal | ✅ | Detailansicht mit Statistiken |
| Activity Feed | ✅ | Live-Aktivitäten des Teams |
| Revenue Widget | ✅ | Umsatz-Übersicht |
| Attention-System | ✅ | Tickets (Verletzungen, Feedback) |

### 4.5 Shop & Payments (Stripe)
| Feature | Status | Details |
|---------|--------|---------|
| Produkt-CRUD | ✅ | Admin erstellt Produkte mit Stripe-Sync |
| Einmalzahlung | ✅ | Stripe Checkout (mode: payment) |
| Abonnements (Monat/Jahr) | ✅ | Stripe Checkout (mode: subscription) |
| Kostenlose Produkte | ✅ | Preis = 0, kein Stripe-Checkout nötig |
| Kostenloser Testzeitraum | ✅ | trial_period_days für Abos |
| Stripe Webhooks | ✅ | checkout.completed, subscription.*, invoice.* |
| Kundenportal | ✅ | Stripe Customer Portal |
| Rechnungen | ✅ | Stripe Invoices API |
| Preisänderungs-Warnung | ✅ | Checkliste bei signifikanten Änderungen |
| Produkt-Deaktivierung | ✅ | Confirmation-Modal mit Stripe-Warnungen |

### 4.6 Kalender & Terminbuchung
| Feature | Status | Details |
|---------|--------|---------|
| Coach-Kalender-Setup | ✅ | Verfügbarkeiten, Zeitslots, Pausen |
| Öffentliche Buchungsseite | ✅ | `/book/:slug` (wie Calendly) |
| Termin-Management | ✅ | Buchungen, Absagen, Bestätigungen |
| Geblockte Zeiten | ✅ | Coach kann Zeiten sperren |

### 4.7 Chat-System
| Feature | Status | Details |
|---------|--------|---------|
| Athlet ↔ Coach Chat | ✅ | Echtzeit-Nachrichten |
| Coach Chat-Übersicht | ✅ | Alle Athleten-Konversationen |
| Chat-Zugang per Produkt | ✅ | `has_chat_access` Flag |

### 4.8 Admin-Verwaltung
| Feature | Status | Details |
|---------|--------|---------|
| User-Management | ✅ | Rollen ändern, Suche, Filter |
| CRM | ✅ | Coach-Zuweisungen, Käufe, Pläne verwalten |
| Produkt-Verwaltung | ✅ | CRUD + Stripe + Deaktivierung |
| Confirmation-Modals | ✅ | Checklisten für alle kritischen Aktionen |
| Double-Confirmation | ✅ | Text-Eingabe für besonders sensible Aktionen |
| Einladungen | ✅ | Invite-Codes generieren und verwalten |

### 4.9 Sonstiges
| Feature | Status | Details |
|---------|--------|---------|
| PWA (Installierbar) | ✅ | Service Worker, Manifest, Install-Prompt |
| i18n (DE/EN) | ✅ | Zweisprachig |
| Dark Mode Design | ✅ | #121212 Basis, #00FF00 Accent |
| DSGVO/Legal | ✅ | Datenschutz, AGB, Impressum, Consent-Tracking |
| AI-Integration | ✅ | Google Gemini für Trainingsvorschläge |
| Rechner (Calculators) | ✅ | FFMI, Wilks, 1RM, Volume |
| Push Notifications | ✅ | Web Push via Service Worker |
| Profil mit Avatar | ✅ | Foto-Upload via Supabase Storage |
| robots.txt / noindex | ✅ | Dev-Subdomain wird nicht indexiert |

---

## 5. Datenbankschema (25+ Tabellen)

| Tabelle | Zweck | RLS |
|---------|-------|-----|
| `profiles` | User-Profile (erweitert auth.users) | ✅ |
| `exercises` | Übungsbibliothek (700+) | ✅ |
| `plans` | Trainingspläne (JSON-Struktur) | ✅ |
| `assigned_plans` | Zugewiesene Pläne an Athleten | ✅ |
| `products` | Shop-Produkte (Stripe-Integration) | ✅ |
| `product_modules` | Produkt ↔ Plan Verknüpfung | ✅ |
| `purchases` | Einmal-Käufe | ✅ |
| `subscriptions` | Abo-Verwaltung | ✅ |
| `coaching_relationships` | Coach ↔ Athlet | ✅ |
| `coaching_approvals` | Coaching-Genehmigungen | ✅ |
| `attentions` | Ticket-System | ✅ |
| `activities` | Activity Feed | ✅ |
| `appointments` | Termine | ✅ |
| `athlete_schedule` | Athleten-Zeitpläne | ✅ |
| `workout_logs` | Trainings-Protokolle | ✅ |
| `body_measurements` | Körperdaten | ✅ |
| `daily_wellness` | Tägliche Wellness-Werte | ✅ |
| `coach_notes` | Coach-Notizen | ✅ |
| `workout_feedback` | Coach-Feedback auf Workouts | ✅ |
| `check_ins` | Wöchentliche Check-Ins | ✅ |
| `coach_calendars` | Kalender-Konfiguration | ✅ |
| `calendar_availability` | Zeitslots | ✅ |
| `coach_blocked_times` | Geblockte Zeiten | ✅ |
| `invitations` | Einladungscodes | ✅ |
| `chat_rooms` / `chat_messages` | Chat-System | ✅ |
| `user_consents` | DSGVO-Einwilligungen | ✅ |
| `audit_log` | Audit Trail | ✅ |
| `push_subscriptions` | Web Push | ✅ |
| `goals` / `goal_milestones` | Ziel-Tracking | ✅ |

---

## 6. API-Endpunkte (Vercel Serverless)

| Endpunkt | Methode | Zweck |
|----------|---------|-------|
| `/api/create-checkout-session` | POST | Stripe Checkout starten (Einmal + Abo + Trial) |
| `/api/create-portal-session` | POST | Stripe Customer Portal |
| `/api/create-stripe-product` | POST | Produkt + Preis in Stripe anlegen |
| `/api/stripe-webhook` | POST | Stripe Event-Verarbeitung |
| `/api/get-customer-data` | GET | Stripe Kundendaten |
| `/api/get-invoices` | GET | Stripe Rechnungen |
| `/api/send-email` | POST | Transaktions-E-Mails (Resend) |
| `/api/send-coaching-email` | POST | Coaching-spezifische E-Mails |
| `/api/send-gdpr-email` | POST | DSGVO-E-Mails |
| `/api/send-invitation-email` | POST | Einladungs-E-Mails |
| `/api/push-subscription` | POST | Push-Notification-Registrierung |
| `/api/deploy-tables` | POST | DB-Schema-Deployment (Admin) |

---

## 7. Changelog (chronologisch)

### 02.02.2026 — Initiales Setup & Supabase-Migration
- Vollständige Migration von Firebase zu Supabase
- DSGVO-Compliance (Datenschutz, AGB, Impressum, Consent-Tracking)
- Onboarding-Loop-Fix
- Legal-Page-Navigation
- Role Switching für Dual-Role Users

### 03.02.2026 — Dashboard & Coaching
- Coach-Dashboard mit Compliance-Metriken
- Athleten-Dashboard mit Trainings-Übersicht
- Activity Feed (Live-Team-Aktivitäten)
- Attention-System (Verletzungs-/Feedback-Tickets)
- Coaching-Relationship-Management

### 04.02.2026 — Planner & Exercises
- Übungsbibliothek (700+ Übungen, CRUD, Archivierung)
- Plan-Builder (Wochen, Sessions, Drag & Drop)
- Deep-Copy (Plan → Wochen → Sessions)
- Session-Builder mit Block-System
- Exercise-Selector mit Supabase-Migration

### 05.02.2026 — Shop & Stripe
- Produkt-CRUD (Admin)
- Stripe Checkout (Einmalzahlung + Abonnements)
- Stripe Webhooks (checkout.completed, subscription.*)
- Kundenportal-Integration
- Produkt-Kategorien & Features

### 06.02.2026 — Workout-Tracking
- AthleteTrainingView (Block-basiertes Workout-Tracking)
- Set-Logging (Gewicht, Reps, RPE, Notizen)
- Volume-Berechnung & PR-Erkennung
- Workout-History (Kalender + Liste)
- Körperdaten-Tracking (Gewicht, Fett, Umfänge)

### 07.02.2026 — Chat & Kalender
- Chat-System (Athlet ↔ Coach, Echtzeit)
- Coach-Kalender-Setup (Verfügbarkeiten, Zeitslots)
- Öffentliche Buchungsseite (/book/:slug)
- Termin-Management

### 08.02.2026 — E-Mail-System & Einladungen
- Resend-Integration (Transaktions-E-Mails)
- Coaching-Request-E-Mails
- DSGVO-E-Mails
- Einladungssystem (Invite-Codes)
- E-Mail-Templates (HTML, responsiv)

### 09.02.2026 — Admin-Tools & CRM
- AdminCRM (User-Management, Coach-Zuweisungen)
- AdminUsers (Rollen-Verwaltung)
- Revenue-Widget
- Profil-System mit Avatar-Upload
- Coach/Admin-spezifische Onboarding-Flows

### 10.02.2026 — Sicherheit & UX
- Confirmation-Modals mit Checklisten für alle kritischen Admin-Aktionen
- Produkt-Deaktivierung mit Stripe-Warnungen
- Preisänderungs-Checklist
- Double-Confirmation für sensible Aktionen
- isActive-Fix für ältere Produkte (NULL → true)

### 11.02.2026 — Kostenlose Produkte & Cleanup
- Kostenlose Produkte (Preis = 0, kein Stripe-Checkout)
- Kostenloser Testzeitraum (trial_period_days für Abos)
- Zahlungsart-Selector (Einmalzahlung / Monatsabo / Jahresabo)
- Firebase-Dependency entfernt (cleanup)
- 12 redundante Dateien entfernt
- Handover-Dokumentation
- API-Dokumentationsseite

---

## 8. Realistische Entwicklungszeiten (1-Mann-Entwickler)

### Zusammenfassung

| Bereich | Geschätzte Stunden | Komplexität |
|---------|-------------------|-------------|
| **Projekt-Setup & Architektur** | 8h | Mittel |
| **Auth & Onboarding (3 Flows)** | 16h | Hoch |
| **Supabase Schema & RLS (25+ Tabellen)** | 20h | Hoch |
| **Service Layer (2.500 LOC)** | 24h | Hoch |
| **Trainingsplaner (Planner)** | 32h | Sehr Hoch |
| **Übungsbibliothek** | 12h | Mittel |
| **Workout-Tracking & History** | 24h | Hoch |
| **Shop & Stripe-Integration** | 28h | Sehr Hoch |
| **Coach-Dashboard & CRM** | 20h | Hoch |
| **Athleten-Dashboard** | 12h | Mittel |
| **Chat-System** | 16h | Hoch |
| **Kalender & Buchungssystem** | 20h | Hoch |
| **E-Mail-System (6 Templates)** | 12h | Mittel |
| **Admin-Tools & Confirmation-Modals** | 16h | Hoch |
| **Einladungssystem** | 8h | Mittel |
| **PWA (Service Worker, Manifest)** | 4h | Niedrig |
| **i18n (DE/EN)** | 8h | Mittel |
| **DSGVO / Legal Pages** | 8h | Mittel |
| **AI-Integration (Gemini)** | 6h | Mittel |
| **Rechner (FFMI, Wilks, etc.)** | 4h | Niedrig |
| **Profil-System mit Avatar** | 6h | Mittel |
| **TypeScript-Typen & Interfaces** | 8h | Mittel |
| **UI/UX Design (Dark Mode, Responsive)** | 24h | Hoch |
| **Testing, Debugging, Refactoring** | 24h | Fortlaufend |
| **Deployment & DevOps (Vercel, CI)** | 6h | Mittel |
| **Dokumentation** | 8h | Mittel |
| **Firebase → Supabase Migration** | 16h | Sehr Hoch |
| **Code Review & Qualitätssicherung** | 12h | Fortlaufend |

### **Gesamtaufwand: ~422 Stunden**

### Stundenbasierte Kalkulation

| Szenario | Stundensatz | Gesamtkosten |
|----------|-------------|--------------|
| Junior Developer | 65 €/h | 27.430 € |
| Mid-Level Developer | 95 €/h | 40.090 € |
| Senior Developer | 130 €/h | 54.860 € |
| Agentur (Durchschnitt) | 150 €/h | 63.300 € |

> **Hinweis:** Diese Schätzungen basieren auf einem erfahrenen Full-Stack-Entwickler, der alle Bereiche (Frontend, Backend, DB, DevOps, Design) allein abdeckt. In einer realen Agentur-Situation mit Projektmanagement, QA und Design-Team wären die Kosten 2-3x höher.

### Detaillierte Aufschlüsselung

#### Trainingsplaner (32h) — Komplexestes Feature
```
Plan-CRUD & Datenmodell:           6h
Wochen-Management:                 4h  
Session-Builder (Blocks, Sets):    8h
Drag & Drop:                       4h
Deep-Copy-Logik:                   4h
Plan-Zuweisung & Snapshots:        4h
Multi-Modul-Produkte:              2h
```

#### Stripe-Integration (28h) — Höchstes Risiko
```
Stripe SDK Setup & Config:         2h
Checkout Session API:              4h
Subscription-Management:           6h
Webhook-Handler:                   6h
Kundenportal:                      2h
Kostenlose Produkte + Trial:       3h
Preisänderungs-Workflow:           3h
Testing (Test-Modus):             2h
```

#### Service Layer (24h) — Herzstück
```
Supabase Client Setup:             2h
Auth-Funktionen:                   3h
CRUD für 25+ Tabellen:            12h
Storage (Avatar, Thumbnails):      2h
RPC/Complex Queries:               3h
Error Handling:                    2h
```

---

## 9. Verzeichnisstruktur (bereinigt)

```
/Greenlight-Fitness-main/
├── App.tsx                         # Routing + Onboarding Gate
├── index.tsx                       # Entry Point
├── index.html                      # HTML + Tailwind CDN
├── types.ts                        # 500+ Zeilen TypeScript Interfaces
├── vite.config.ts                  # Vite Config (Port 3000)
├── vercel.json                     # Vercel Rewrites
├── supabase-schema.sql             # Komplettes DB-Schema (DDL)
├── CASCADE_REFERENCE.md            # Credentials + Befehle
├── HANDOVER.md                     # ← DIESES DOKUMENT
│
├── api/                            # 12 Vercel Serverless Functions
│   ├── create-checkout-session.ts  # Stripe Checkout (Einmal + Abo + Trial)
│   ├── create-portal-session.ts    # Stripe Customer Portal
│   ├── create-stripe-product.ts    # Stripe Produkt + Preis erstellen
│   ├── stripe-webhook.ts           # Stripe Webhook Handler
│   ├── get-customer-data.ts        # Stripe Kundendaten
│   ├── get-invoices.ts             # Stripe Rechnungen
│   ├── send-email.ts               # Transaktions-E-Mails
│   ├── send-coaching-email.ts      # Coaching-E-Mails
│   ├── send-gdpr-email.ts          # DSGVO-E-Mails
│   ├── send-invitation-email.ts    # Einladungs-E-Mails
│   ├── push-subscription.ts        # Web Push
│   └── deploy-tables.ts            # DB-Schema-Deployment
│
├── components/                     # 44 React-Komponenten
├── pages/                          # 22 Seiten
├── context/                        # AuthContext + LanguageContext
├── services/                       # supabase.ts (2.514 LOC) + notifications.ts
├── utils/                          # formulas.ts + translations.ts
├── scripts/                        # SQL-Migrations + Utilities
├── docs/                           # Zusätzliche Dokumentation
└── public/                         # PWA Manifest, Icons, SW
```

---

## 10. Bekannte Einschränkungen & TODOs

### Offen
- [ ] Stripe ist im **TEST-Modus** — vor Go-Live auf Live-Keys umstellen
- [ ] `trial_days` DB-Migration ausführen: `scripts/migrate-trial-days.sql`
- [ ] Account-Löschung (DSGVO Art. 17) — Backend-Logik implementieren
- [ ] Preisänderungs-Bestätigung an Kunden automatisieren
- [ ] Rate Limiting für API-Endpunkte
- [ ] E2E-Tests (Playwright o.ä.)
- [ ] Lazy Loading / Code Splitting (Bundle > 1.3 MB)

### Technische Schulden
- Bundle-Größe: 1.364 KB (sollte via Code-Splitting reduziert werden)
- Tailwind via CDN statt PostCSS-Build (Performance-Overhead)
- Einige `any`-Types in Services könnten strenger typisiert werden

---

## 11. Deployment-Anleitung

```bash
# 1. TypeScript prüfen (muss 0 Fehler sein)
npx tsc --noEmit --pretty

# 2. Build testen
npm run build

# 3. Commit & Push (triggert Vercel Auto-Deploy)
git add -A
git commit -m "feat/fix: Beschreibung"
git push origin main

# 4. GitHub-Account wechseln (falls nötig)
gh auth switch --user Greenlightfitness
```

### Umgebungsvariablen (Vercel Dashboard)

| Variable | Typ | Wo |
|----------|-----|-----|
| `VITE_SUPABASE_URL` | Public | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Public | Frontend |
| `VITE_GEMINI_API_KEY` | Public | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server only |
| `STRIPE_SECRET_KEY` | Secret | Server only |
| `STRIPE_WEBHOOK_SECRET` | Secret | Server only |
| `RESEND_API_KEY` | Secret | Server only |

---

**Ende des Handover-Dokuments** | Greenlight Fitness 2026
