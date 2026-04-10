// @ts-nocheck
// Supabase Edge Function: alert-high-usage
// Sends a lightweight email alert when a user reaches high usage.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization') || '';
  const expectedToken = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await req.json();
  const { userId, email, operation, current, limit } = payload;

  const subject = `Parlova high usage alert: ${operation}`;
  const html = `
    <h2>High usage alert</h2>
    <p>User reached >=80% of daily limit.</p>
    <ul>
      <li>User ID: ${userId}</li>
      <li>Email: ${email}</li>
      <li>Operation: ${operation}</li>
      <li>Usage: ${current}/${limit}</li>
    </ul>
  `;

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Parlova Alerts <alerts@parlova.app>',
      to: ['yuggajera2006@gmail.com'],
      subject,
      html,
    }),
  });

  if (!resendResp.ok) {
    const details = await resendResp.text();
    return new Response(JSON.stringify({ error: 'Email send failed', details }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
