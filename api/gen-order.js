const ADMIN_EMAIL = process.env.GEN_ADMIN_EMAIL || 'oxkraraya364@gmail.com';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bqrwcmrpzvtjoebmqiji.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_XK4dh9Ch_7MebSMO7JJm7Q_8CXu2Qa8';

function clean(value, max = 20000) {
  return String(value || '').replace(/\0/g, '').slice(0, max);
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método no permitido.' });
  if (!process.env.RESEND_API_KEY) return response.status(503).json({ error: 'Falta configurar RESEND_API_KEY en Vercel.' });

  const authorization = request.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return response.status(401).json({ error: 'Sesión requerida.' });

  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!authResponse.ok) return response.status(401).json({ error: 'Sesión inválida o vencida.' });

  const { storyId, order } = request.body || {};
  const subject = clean(order?.notification?.subject, 240);
  const body = clean(order?.notification?.body);
  if (!storyId || order?.status !== 'pending' || !subject || !body) {
    return response.status(400).json({ error: 'La orden visual está incompleta.' });
  }

  const mailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.GEN_FROM_EMAIL || 'Umbral Editores <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject,
      text: `${body}\n\nID INTERNO DE LA OBRA: ${clean(storyId, 120)}`
    })
  });
  const result = await mailResponse.json().catch(() => ({}));
  if (!mailResponse.ok) return response.status(502).json({ error: result.message || 'El proveedor de correo rechazó el envío.' });
  return response.status(200).json({ sent: true, recipient: ADMIN_EMAIL, messageId: result.id });
};
