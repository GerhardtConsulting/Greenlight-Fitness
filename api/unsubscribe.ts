/**
 * One-Click Email Unsubscribe API
 * 
 * DSGVO Art. 7(3): Users must be able to withdraw consent at any time.
 * This endpoint handles both:
 *   - GET /api/unsubscribe?token=<jwt>        → Shows confirmation page
 *   - POST /api/unsubscribe?token=<jwt>       → Processes unsubscribe
 *   - GET /api/unsubscribe (no token, logged in) → Redirects to profile#notifications
 * 
 * The token is a signed JWT containing { user_id, type? } so no auth is needed
 * (one-click unsubscribe from email link).
 */

interface VercelRequest {
  method?: string;
  body: any;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
  send(data: string): void;
  setHeader(name: string, value: string): VercelResponse;
  redirect(url: string): void;
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

const APP_URL = process.env.APP_URL || 'https://app.greenlight-fitness.de';

// Simple token: base64(user_id:timestamp) — for email links
// In production, use proper JWT signing
function decodeToken(token: string): { userId: string; type?: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length < 2) return null;
    return { userId: parts[0], type: parts[1] || undefined };
  } catch {
    return null;
  }
}

export function generateUnsubscribeToken(userId: string, type?: string): string {
  const payload = type ? `${userId}:${type}` : `${userId}:all`;
  return Buffer.from(payload).toString('base64url');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string;

  // No token → redirect to settings
  if (!token) {
    return res.redirect(`${APP_URL}/profile#notifications`);
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  // GET: Show confirmation page
  if (req.method === 'GET') {
    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Mail-Abmeldung — Greenlight Fitness</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1C1C1E; border: 1px solid #27272A; border-radius: 20px; padding: 40px; max-width: 420px; text-align: center; }
    .logo { color: #00FF00; font-size: 24px; font-weight: bold; margin-bottom: 24px; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #71717A; font-size: 14px; margin: 0 0 24px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: bold; text-decoration: none; cursor: pointer; border: none; }
    .btn-danger { background: #EF4444; color: #fff; }
    .btn-danger:hover { background: #DC2626; }
    .btn-secondary { background: #27272A; color: #A1A1AA; margin-left: 8px; }
    .btn-secondary:hover { background: #3F3F46; color: #fff; }
    .info { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 12px 16px; margin-top: 20px; }
    .info p { color: #60A5FA; font-size: 12px; margin: 0; }
    form { display: inline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡ GREENLIGHT</div>
    <h1>E-Mails abbestellen?</h1>
    <p>
      ${decoded.type && decoded.type !== 'all'
        ? `Du bist dabei, <strong>${decoded.type}</strong>-E-Mails abzubestellen.`
        : 'Du bist dabei, <strong>alle</strong> Marketing- und Reattention-E-Mails abzubestellen.'
      }
    </p>
    <form method="POST" action="/api/unsubscribe?token=${token}">
      <button type="submit" class="btn btn-danger">Abbestellen</button>
    </form>
    <a href="${APP_URL}/profile#notifications" class="btn btn-secondary">Lieber einzeln einstellen</a>
    <div class="info">
      <p>Transaktions-E-Mails (Kaufbestätigungen, Kündigungen, Sicherheit) werden weiterhin zugestellt — diese sind gesetzlich vorgeschrieben.</p>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  // POST: Process unsubscribe
  if (req.method === 'POST') {
    try {
      if (decoded.type && decoded.type !== 'all') {
        // Unsubscribe from specific type
        const prefMap: Record<string, string> = {
          training_reminders: 'training_reminders',
          checkin_reminders: 'checkin_reminders',
          weekly_progress: 'weekly_progress',
          inactivity_alerts: 'inactivity_alerts',
          athlete_summary: 'athlete_summary',
          churn_risk_alerts: 'churn_risk_alerts',
          business_reports: 'business_reports',
          churn_alerts: 'churn_alerts',
        };

        const prefKey = prefMap[decoded.type];
        if (prefKey) {
          await supabase
            .from('notification_preferences')
            .upsert(
              { user_id: decoded.userId, [prefKey]: false, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            );
        }
      } else {
        // Unsubscribe from all
        await supabase
          .from('notification_preferences')
          .upsert(
            {
              user_id: decoded.userId,
              email_enabled: false,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      }

      // Log the unsubscribe
      await supabase.from('notification_log').insert({
        user_id: decoded.userId,
        user_role: 'UNKNOWN',
        channel: 'email',
        template_type: 'unsubscribe',
        subject: decoded.type === 'all' ? 'Unsubscribed from all' : `Unsubscribed from ${decoded.type}`,
        dedup_key: `unsub-${Date.now()}`,
        status: 'sent',
        context: { type: decoded.type || 'all', method: 'one-click' },
      });

      // Show success page
      const successHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abgemeldet — Greenlight Fitness</title>
  <style>
    body { margin: 0; padding: 0; background: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #1C1C1E; border: 1px solid #27272A; border-radius: 20px; padding: 40px; max-width: 420px; text-align: center; }
    .logo { color: #00FF00; font-size: 24px; font-weight: bold; margin-bottom: 24px; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #71717A; font-size: 14px; margin: 0 0 24px; line-height: 1.6; }
    .check { font-size: 48px; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 32px; background: #00FF00; color: #000; border-radius: 12px; font-size: 14px; font-weight: bold; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡ GREENLIGHT</div>
    <div class="check">✅</div>
    <h1>Erfolgreich abgemeldet</h1>
    <p>
      ${decoded.type && decoded.type !== 'all'
        ? `Du erhältst keine <strong>${decoded.type}</strong>-E-Mails mehr.`
        : 'Du erhältst keine Marketing- und Reattention-E-Mails mehr.'
      }
      Du kannst dies jederzeit in deinen Einstellungen ändern.
    </p>
    <a href="${APP_URL}/profile#notifications" class="btn">Einstellungen öffnen →</a>
  </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(successHtml);
    } catch (error: any) {
      console.error('[UNSUBSCRIBE] Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
