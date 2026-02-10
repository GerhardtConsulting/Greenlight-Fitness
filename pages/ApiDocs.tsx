import React, { useState } from 'react';
import { 
  Book, Server, Shield, Key, Code, ChevronRight, ChevronDown, 
  Copy, Check, Zap, Database, CreditCard, Mail, Bell, Users,
  Lock, Globe, AlertTriangle, ArrowLeft, ExternalLink, Search
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  auth: 'none' | 'anon' | 'service_role' | 'stripe_webhook';
  requestBody?: Record<string, { type: string; required?: boolean; description: string }>;
  responseExample?: string;
  notes?: string[];
}

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  endpoints: Endpoint[];
}

// ─── Data ────────────────────────────────────────────────────
const API_BASE = 'https://greenlight-fitness-app.vercel.app';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  POST: 'bg-[#00FF00]/20 text-[#00FF00] border-[#00FF00]/30',
  PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const sections: Section[] = [
  {
    id: 'stripe-checkout',
    icon: <CreditCard size={20} />,
    title: 'Stripe Checkout',
    description: 'Erstelle Checkout-Sessions für Einmalzahlungen, Abonnements und kostenlose Produkte.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/create-checkout-session',
        title: 'Checkout Session erstellen',
        description: 'Erstellt eine Stripe Checkout Session. Unterstützt Einmalzahlungen, Abonnements (Monat/Jahr) und kostenlose Testzeiträume. Kostenlose Produkte (Preis = 0) werden ohne Stripe-Redirect verarbeitet.',
        auth: 'anon',
        requestBody: {
          productId: { type: 'string', required: true, description: 'Interne Produkt-ID' },
          productTitle: { type: 'string', description: 'Anzeigename des Produkts' },
          price: { type: 'number', required: true, description: 'Preis in EUR (0 = kostenlos)' },
          currency: { type: 'string', description: 'Währungscode (default: "eur")' },
          interval: { type: '"onetime" | "month" | "year"', description: 'Abrechnungsintervall' },
          stripePriceId: { type: 'string', description: 'Bestehende Stripe Price ID (optional)' },
          customerEmail: { type: 'string', description: 'Kunden-E-Mail für Stripe' },
          trialDays: { type: 'number', description: 'Kostenloser Testzeitraum in Tagen (nur Abos)' },
          successUrl: { type: 'string', description: 'Redirect nach Erfolg' },
          cancelUrl: { type: 'string', description: 'Redirect bei Abbruch' },
        },
        responseExample: `{
  "sessionId": "cs_test_a1b2c3...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
}`,
        notes: [
          'Bei price = 0 wird { free: true } zurückgegeben — kein Stripe-Redirect',
          'trialDays wird nur für mode: subscription angewendet',
          'allow_promotion_codes ist standardmäßig aktiviert',
        ],
      },
      {
        method: 'POST',
        path: '/api/create-portal-session',
        title: 'Kundenportal öffnen',
        description: 'Erstellt eine Stripe Billing Portal Session, über die Kunden ihre Abonnements, Zahlungsmethoden und Rechnungen verwalten können.',
        auth: 'anon',
        requestBody: {
          customerId: { type: 'string', required: true, description: 'Stripe Customer ID' },
          returnUrl: { type: 'string', description: 'Rückkehr-URL nach Portal-Besuch' },
        },
        responseExample: `{
  "url": "https://billing.stripe.com/p/session/..."
}`,
      },
      {
        method: 'POST',
        path: '/api/create-stripe-product',
        title: 'Stripe Produkt erstellen',
        description: 'Erstellt ein Produkt + Preis in Stripe. Kostenlose Produkte (Preis ≤ 0) werden übersprungen und erhalten keine Stripe-IDs.',
        auth: 'service_role',
        requestBody: {
          title: { type: 'string', required: true, description: 'Produktname' },
          description: { type: 'string', description: 'Produktbeschreibung' },
          price: { type: 'number', required: true, description: 'Preis in EUR (0 = kein Stripe-Produkt)' },
          currency: { type: 'string', description: 'Währungscode (default: "eur")' },
          interval: { type: '"onetime" | "month" | "year"', description: 'Abrechnungsintervall (default: "month")' },
          productId: { type: 'string', description: 'Interne Referenz-ID' },
          trialDays: { type: 'number', description: 'Testzeitraum in Tagen (nur Abos)' },
        },
        responseExample: `{
  "success": true,
  "stripe_product_id": "prod_Qx1234...",
  "stripe_price_id": "price_1Abc...",
  "trial_days": 14
}`,
        notes: [
          'Bei price ≤ 0: stripe_product_id und stripe_price_id sind null, free: true',
          'recurring wird automatisch aus interval abgeleitet',
        ],
      },
    ],
  },
  {
    id: 'stripe-data',
    icon: <Database size={20} />,
    title: 'Stripe Kundendaten',
    description: 'Abruf von Stripe-Kundendaten, Abonnements und Rechnungen.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/get-customer-data',
        title: 'Kundendaten abrufen',
        description: 'Gibt Stripe-Kundendaten zurück, inklusive aktiver Abonnements, Zahlungsmethoden und Metadaten.',
        auth: 'anon',
        requestBody: {
          customerId: { type: 'string', required: true, description: 'Stripe Customer ID (als Query-Param)' },
        },
        responseExample: `{
  "customer": { "id": "cus_...", "email": "...", "name": "..." },
  "subscriptions": [...],
  "paymentMethods": [...]
}`,
      },
      {
        method: 'GET',
        path: '/api/get-invoices',
        title: 'Rechnungen abrufen',
        description: 'Gibt alle Stripe-Rechnungen eines Kunden zurück.',
        auth: 'anon',
        requestBody: {
          customerId: { type: 'string', required: true, description: 'Stripe Customer ID (als Query-Param)' },
        },
        responseExample: `{
  "invoices": [
    { "id": "in_...", "amount_paid": 9900, "status": "paid", "created": 1707000000 }
  ]
}`,
      },
    ],
  },
  {
    id: 'webhooks',
    icon: <Zap size={20} />,
    title: 'Webhooks',
    description: 'Stripe Webhook-Handler für automatische Verarbeitung von Zahlungsereignissen.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/stripe-webhook',
        title: 'Stripe Webhook Handler',
        description: 'Verarbeitet Stripe-Events automatisch. Wird von Stripe aufgerufen, nicht manuell.',
        auth: 'stripe_webhook',
        requestBody: {
          'stripe-signature': { type: 'string (header)', required: true, description: 'Stripe Webhook Signatur' },
        },
        responseExample: `{ "received": true }`,
        notes: [
          'Verarbeitet: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed, invoice.paid',
          'Signatur wird mit STRIPE_WEBHOOK_SECRET verifiziert',
          'Bei checkout.session.completed: Kauf/Abo in DB anlegen',
          'Bei subscription.deleted: Abo-Status in DB aktualisieren + Kündigungs-E-Mail',
        ],
      },
    ],
  },
  {
    id: 'email',
    icon: <Mail size={20} />,
    title: 'E-Mail-System',
    description: 'Transaktions- und Benachrichtigungs-E-Mails über Resend.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/send-email',
        title: 'Transaktions-E-Mail senden',
        description: 'Sendet eine E-Mail basierend auf dem Template-Typ. Unterstützt: welcome, payment_success, payment_failed, price_change_notice, cancellation_confirmed u.v.m.',
        auth: 'service_role',
        requestBody: {
          type: { type: 'string', required: true, description: 'E-Mail-Template-ID (z.B. "welcome", "payment_success")' },
          to: { type: 'string', required: true, description: 'Empfänger-E-Mail' },
          data: { type: 'object', required: true, description: 'Template-Variablen (abhängig vom Typ)' },
        },
        responseExample: `{ "success": true, "id": "email_abc123..." }`,
        notes: [
          'Jede E-Mail enthält DSGVO-konformes Impressum, Datenschutz-Link und Kontaktmöglichkeit',
          'Templates: welcome, payment_success, payment_failed, price_change_notice, cancellation_right_notice, cancellation_confirmed, subscription_ended',
        ],
      },
      {
        method: 'POST',
        path: '/api/send-coaching-email',
        title: 'Coaching-E-Mail senden',
        description: 'Spezialisierte E-Mails für den Coaching-Workflow: Anfragen, Genehmigungen, Ablehnungen.',
        auth: 'service_role',
        requestBody: {
          type: { type: 'string', required: true, description: '"coaching_request_athlete" | "coaching_request_coach" | "coaching_approved" | "coaching_rejected" | "coaching_started"' },
          to: { type: 'string', required: true, description: 'Empfänger-E-Mail' },
          data: { type: 'object', required: true, description: 'Coaching-spezifische Daten' },
        },
        responseExample: `{ "success": true }`,
      },
      {
        method: 'POST',
        path: '/api/send-invitation-email',
        title: 'Einladungs-E-Mail senden',
        description: 'Sendet eine Einladung per E-Mail mit personalisierbarem Invite-Code und optionaler Nachricht.',
        auth: 'service_role',
        requestBody: {
          to: { type: 'string', required: true, description: 'Empfänger-E-Mail' },
          inviteCode: { type: 'string', required: true, description: 'Einladungscode' },
          senderName: { type: 'string', description: 'Name des Einladenden' },
          personalMessage: { type: 'string', description: 'Persönliche Nachricht' },
          role: { type: '"ATHLETE" | "COACH"', description: 'Eingeladene Rolle' },
        },
        responseExample: `{ "success": true }`,
      },
      {
        method: 'POST',
        path: '/api/send-gdpr-email',
        title: 'DSGVO-E-Mail senden',
        description: 'Sendet DSGVO-relevante E-Mails: Datenauskunft, Löschbestätigung, Einwilligungsnachweise.',
        auth: 'service_role',
        requestBody: {
          type: { type: 'string', required: true, description: '"data_export" | "deletion_confirmed" | "consent_receipt"' },
          to: { type: 'string', required: true, description: 'Empfänger-E-Mail' },
          data: { type: 'object', required: true, description: 'DSGVO-spezifische Daten' },
        },
        responseExample: `{ "success": true }`,
      },
    ],
  },
  {
    id: 'notifications',
    icon: <Bell size={20} />,
    title: 'Push Notifications',
    description: 'Web Push Notification-Registrierung und -Versand.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/push-subscription',
        title: 'Push-Subscription registrieren',
        description: 'Registriert eine Web Push Subscription für einen Benutzer.',
        auth: 'anon',
        requestBody: {
          userId: { type: 'string', required: true, description: 'User ID' },
          subscription: { type: 'PushSubscription', required: true, description: 'Web Push Subscription-Objekt' },
        },
        responseExample: `{ "success": true }`,
      },
    ],
  },
  {
    id: 'admin',
    icon: <Shield size={20} />,
    title: 'Admin & Database',
    description: 'Administrative Endpunkte für Schema-Management.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/deploy-tables',
        title: 'DB-Schema deployen',
        description: 'Führt SQL-Migrationen direkt gegen die Supabase-Datenbank aus. Nur für Administratoren.',
        auth: 'service_role',
        requestBody: {
          sql: { type: 'string', required: true, description: 'SQL-Statement(s) zum Ausführen' },
          serviceRoleKey: { type: 'string', required: true, description: 'Service Role Key zur Authentifizierung' },
        },
        responseExample: `{ "success": true, "message": "Migration applied successfully" }`,
        notes: [
          'ACHTUNG: Umgeht RLS! Nur für Schema-Änderungen verwenden',
          'Niemals User-Input direkt als SQL übergeben (SQL Injection)',
        ],
      },
    ],
  },
];

// ─── Supabase Tables Info ────────────────────────────────────
const supabaseTables = [
  { name: 'profiles', description: 'Benutzerprofile (Auth + Stammdaten)', rls: true },
  { name: 'exercises', description: 'Übungsbibliothek (700+)', rls: true },
  { name: 'plans', description: 'Trainingspläne (JSON-Struktur)', rls: true },
  { name: 'assigned_plans', description: 'Zugewiesene Pläne an Athleten', rls: true },
  { name: 'products', description: 'Shop-Produkte + Stripe-Referenzen', rls: true },
  { name: 'product_modules', description: 'Produkt ↔ Plan Verknüpfung', rls: true },
  { name: 'purchases', description: 'Einmal-Käufe', rls: true },
  { name: 'subscriptions', description: 'Abo-Verwaltung', rls: true },
  { name: 'coaching_relationships', description: 'Coach ↔ Athlet', rls: true },
  { name: 'coaching_approvals', description: 'Coaching-Genehmigungen', rls: true },
  { name: 'workout_logs', description: 'Trainings-Protokolle', rls: true },
  { name: 'body_measurements', description: 'Körperdaten über Zeit', rls: true },
  { name: 'daily_wellness', description: 'Tägliche Wellness-Werte', rls: true },
  { name: 'check_ins', description: 'Wöchentliche Check-Ins', rls: true },
  { name: 'coach_calendars', description: 'Kalender-Konfiguration', rls: true },
  { name: 'appointments', description: 'Termine + Buchungen', rls: true },
  { name: 'chat_rooms', description: 'Chat-Räume', rls: true },
  { name: 'chat_messages', description: 'Chat-Nachrichten', rls: true },
  { name: 'invitations', description: 'Einladungscodes', rls: true },
  { name: 'user_consents', description: 'DSGVO-Einwilligungen', rls: true },
  { name: 'audit_log', description: 'Audit Trail', rls: true },
];

// ─── Components ──────────────────────────────────────────────
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors" title="Kopieren">
      {copied ? <Check size={14} className="text-[#00FF00]" /> : <Copy size={14} className="text-zinc-500" />}
    </button>
  );
};

const EndpointCard: React.FC<{ endpoint: Endpoint }> = ({ endpoint }) => {
  const [expanded, setExpanded] = useState(false);
  
  const authLabels: Record<string, { label: string; color: string }> = {
    none: { label: 'Public', color: 'text-zinc-500' },
    anon: { label: 'Anon Key', color: 'text-blue-400' },
    service_role: { label: 'Service Role', color: 'text-red-400' },
    stripe_webhook: { label: 'Stripe Signature', color: 'text-purple-400' },
  };

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-900/50 transition-colors"
      >
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider border ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm text-zinc-300 font-mono flex-1">{endpoint.path}</code>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${authLabels[endpoint.auth].color}`}>
          {authLabels[endpoint.auth].label}
        </span>
        {expanded ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 p-5 space-y-4 bg-[#0A0A0A]">
          <p className="text-sm text-zinc-400 leading-relaxed">{endpoint.description}</p>

          {endpoint.requestBody && (
            <div>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Parameter</h4>
              <div className="bg-[#121212] rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Name</th>
                      <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Typ</th>
                      <th className="text-left p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Beschreibung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(endpoint.requestBody).map(([key, val]) => (
                      <tr key={key} className="border-b border-zinc-800/50 last:border-0">
                        <td className="p-3 font-mono text-[#00FF00] text-xs">
                          {key}
                          {val.required && <span className="text-red-400 ml-1">*</span>}
                        </td>
                        <td className="p-3 text-zinc-500 text-xs font-mono">{val.type}</td>
                        <td className="p-3 text-zinc-400 text-xs">{val.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {endpoint.responseExample && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Response</h4>
                <CopyButton text={endpoint.responseExample} />
              </div>
              <pre className="bg-[#121212] rounded-lg border border-zinc-800 p-4 text-xs text-zinc-300 font-mono overflow-x-auto whitespace-pre">
                {endpoint.responseExample}
              </pre>
            </div>
          )}

          {endpoint.notes && endpoint.notes.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Hinweise
              </h4>
              <ul className="space-y-1">
                {endpoint.notes.map((note, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">-</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
const ApiDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredSections = sections.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.endpoints.some(e => e.path.toLowerCase().includes(q) || e.title.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* noindex meta tag */}
      <meta name="robots" content="noindex, nofollow" />

      <div className="min-h-screen bg-[#0A0A0A] text-white">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center">
                <Book size={20} className="text-[#00FF00]" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight">
                  <span className="text-[#00FF00]">Greenlight</span> API
                </h1>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Documentation v1.0</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                Test Mode
              </span>
              <a 
                href="/" 
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                Zur App
              </a>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto flex">
          {/* Sidebar Navigation */}
          <aside className="w-64 border-r border-zinc-800 min-h-[calc(100vh-65px)] p-4 sticky top-[65px] self-start hidden lg:block">
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Endpunkt suchen..."
                className="w-full bg-[#121212] border border-zinc-800 text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:border-[#00FF00]/50 outline-none"
              />
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                  !activeSection ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Globe size={14} />
                Übersicht
              </button>
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                    activeSection === s.id ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {s.icon}
                  {s.title}
                  <span className="ml-auto text-zinc-600 text-[10px]">{s.endpoints.length}</span>
                </button>
              ))}
              <button
                onClick={() => setActiveSection('database')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                  activeSection === 'database' ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Database size={14} />
                Datenbank
                <span className="ml-auto text-zinc-600 text-[10px]">{supabaseTables.length}</span>
              </button>
              <button
                onClick={() => setActiveSection('auth')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                  activeSection === 'auth' ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Lock size={14} />
                Authentifizierung
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-10 max-w-4xl">
            {!activeSection && (
              <div className="space-y-8">
                {/* Hero */}
                <div className="space-y-4">
                  <h2 className="text-3xl font-black tracking-tight">
                    <span className="text-[#00FF00]">Greenlight Fitness</span> API Dokumentation
                  </h2>
                  <p className="text-zinc-400 leading-relaxed max-w-2xl">
                    Willkommen zur API-Dokumentation von Greenlight Fitness. Diese Seite beschreibt alle 
                    verfügbaren Serverless-Endpunkte (Vercel Functions), die Supabase-Datenbankstruktur 
                    und die Authentifizierungsmechanismen.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'API Endpunkte', value: '12', icon: <Server size={16} /> },
                    { label: 'DB Tabellen', value: '25+', icon: <Database size={16} /> },
                    { label: 'Auth Rollen', value: '3', icon: <Users size={16} /> },
                    { label: 'Webhooks', value: '5 Events', icon: <Zap size={16} /> },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center mb-2 text-[#00FF00]">{stat.icon}</div>
                      <div className="text-xl font-black text-white">{stat.value}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Base URL */}
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Base URL</h3>
                    <CopyButton text={API_BASE} />
                  </div>
                  <code className="text-[#00FF00] font-mono text-sm">{API_BASE}</code>
                </div>

                {/* Quick Navigation */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Endpunkt-Kategorien</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sections.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4 text-left hover:border-[#00FF00]/30 transition-all group"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-[#00FF00]">{s.icon}</div>
                          <span className="font-bold text-white group-hover:text-[#00FF00] transition-colors">{s.title}</span>
                          <span className="ml-auto text-zinc-600 text-xs">{s.endpoints.length} Endpunkte</span>
                        </div>
                        <p className="text-xs text-zinc-500 line-clamp-2">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Tech Stack</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {[
                      { label: 'Runtime', value: 'Vercel Serverless (Node.js)' },
                      { label: 'Database', value: 'Supabase PostgreSQL' },
                      { label: 'Auth', value: 'Supabase Auth + RLS' },
                      { label: 'Payments', value: 'Stripe API v2024' },
                      { label: 'E-Mail', value: 'Resend' },
                      { label: 'Storage', value: 'Supabase Storage' },
                      { label: 'AI', value: 'Google Gemini' },
                      { label: 'Protocol', value: 'HTTPS / REST' },
                    ].map((item, i) => (
                      <div key={i}>
                        <span className="text-zinc-500 block mb-0.5">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section Detail View */}
            {activeSection && activeSection !== 'database' && activeSection !== 'auth' && (
              <div className="space-y-6">
                {filteredSections
                  .filter(s => s.id === activeSection)
                  .map(section => (
                    <div key={section.id}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-[#00FF00]">{section.icon}</div>
                        <h2 className="text-2xl font-black">{section.title}</h2>
                      </div>
                      <p className="text-sm text-zinc-400 mb-6">{section.description}</p>
                      <div className="space-y-3">
                        {section.endpoints.map((ep, i) => (
                          <EndpointCard key={i} endpoint={ep} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Database Section */}
            {activeSection === 'database' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Database size={20} className="text-[#00FF00]" />
                  <h2 className="text-2xl font-black">Datenbank-Schema</h2>
                </div>
                <p className="text-sm text-zinc-400">
                  PostgreSQL via Supabase. Alle Tabellen sind mit Row Level Security (RLS) geschützt.
                  Zugriff erfolgt ausschließlich über die Supabase Client Library oder Service Role Key.
                </p>

                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tabelle</th>
                        <th className="text-left p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Beschreibung</th>
                        <th className="text-center p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">RLS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supabaseTables.map((t, i) => (
                        <tr key={t.name} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? 'bg-zinc-900/20' : ''}`}>
                          <td className="p-4 font-mono text-[#00FF00] text-xs">{t.name}</td>
                          <td className="p-4 text-zinc-400 text-xs">{t.description}</td>
                          <td className="p-4 text-center">
                            {t.rls ? (
                              <span className="text-[#00FF00] text-xs font-bold">✓</span>
                            ) : (
                              <span className="text-red-400 text-xs">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-zinc-400">
                    <strong className="text-blue-400">Hinweis:</strong> Das vollständige DDL-Schema liegt in{' '}
                    <code className="text-blue-400">supabase-schema.sql</code>. Migrationen befinden sich im{' '}
                    <code className="text-blue-400">scripts/</code> Ordner.
                  </p>
                </div>
              </div>
            )}

            {/* Auth Section */}
            {activeSection === 'auth' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Lock size={20} className="text-[#00FF00]" />
                  <h2 className="text-2xl font-black">Authentifizierung</h2>
                </div>
                <p className="text-sm text-zinc-400">
                  Greenlight Fitness nutzt Supabase Auth mit rollenbasierter Zugriffskontrolle (RBAC).
                  API-Endpunkte erfordern unterschiedliche Authentifizierungsstufen.
                </p>

                {/* Roles */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Benutzerrollen</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { role: 'ATHLETE', color: 'blue', desc: 'Normaler Nutzer — Eigene Daten, Training, Shop' },
                      { role: 'COACH', color: '[#00FF00]', desc: 'Trainer — Athleten-Management, Pläne, Kalender' },
                      { role: 'ADMIN', color: 'red', desc: 'Administrator — Vollzugriff, CRM, Produkte' },
                    ].map(r => (
                      <div key={r.role} className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
                        <div className={`text-${r.color}-400 font-black text-sm mb-1`}>{r.role}</div>
                        <p className="text-[10px] text-zinc-500">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auth Levels */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Authentifizierungsstufen</h3>
                  <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="text-left p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Level</th>
                          <th className="text-left p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Header</th>
                          <th className="text-left p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Verwendung</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-zinc-800/50">
                          <td className="p-4 text-blue-400 font-bold text-xs">Anon Key</td>
                          <td className="p-4 font-mono text-zinc-400 text-xs">apikey: VITE_SUPABASE_ANON_KEY</td>
                          <td className="p-4 text-zinc-400 text-xs">Frontend-Anfragen (RLS aktiv)</td>
                        </tr>
                        <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                          <td className="p-4 text-red-400 font-bold text-xs">Service Role</td>
                          <td className="p-4 font-mono text-zinc-400 text-xs">Authorization: Bearer SERVICE_ROLE_KEY</td>
                          <td className="p-4 text-zinc-400 text-xs">Server-Side (umgeht RLS!)</td>
                        </tr>
                        <tr>
                          <td className="p-4 text-purple-400 font-bold text-xs">Stripe Signature</td>
                          <td className="p-4 font-mono text-zinc-400 text-xs">stripe-signature: whsec_...</td>
                          <td className="p-4 text-zinc-400 text-xs">Webhook-Verifizierung</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <p className="text-xs text-zinc-400 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-red-400">Sicherheitshinweis:</strong> Der Service Role Key umgeht 
                      sämtliche RLS-Policies und darf <strong>NIEMALS</strong> im Frontend oder in clientseitigem 
                      Code verwendet werden. Nur in Vercel Serverless Functions (Environment Variables).
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Greenlight Fitness API Documentation v1.0</span>
                <span>Februar 2026</span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
};

export default ApiDocs;
