// Pages Function: /api  (pengganti api.php)
// Backend: Cloudflare D1 (binding "DB"), tabel "events"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: CORS });

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  if (method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    if (method === 'GET') {
      const { results } = await env.DB
        .prepare('SELECT * FROM events ORDER BY date ASC')
        .all();
      return json(results);
    }

    if (method === 'POST') {
      const body = await request.json();
      if (!body || !body.id || !body.name || !body.date) {
        return json({ error: 'Data tidak lengkap' }, 400);
      }
      await env.DB
        .prepare('INSERT INTO events (id, name, date) VALUES (?, ?, ?)')
        .bind(body.id, body.name, body.date)
        .run();
      return json({ success: true, data: body });
    }

    if (method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id');
      if (!id) return json({ error: 'ID tidak ditemukan' }, 400);
      await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
      return json({ success: true });
    }

    return json({ error: 'Method tidak diizinkan' }, 405);
  } catch (e) {
    return json({ error: 'Koneksi database gagal: ' + e.message }, 500);
  }
}
