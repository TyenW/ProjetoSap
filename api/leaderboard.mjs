import { kv } from '@vercel/kv';

// Helper: get current leaderboard (array)
async function getList() {
  try {
    const list = await kv.get('leaderboard:list');
    return Array.isArray(list) ? list : [];
  } catch (_) {
    return [];
  }
}

// Helper: save trimmed, sorted top-10
async function saveList(list) {
  const sorted = [...list].sort((a,b) => (b.score||0) - (a.score||0) || new Date(a.date) - new Date(b.date)).slice(0,10);
  await kv.set('leaderboard:list', sorted);
  return sorted;
}

export default async function handler(req, res) {
  // CORS headers to allow frontend hosted elsewhere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  try {
    if (req.method === 'GET') {
      const list = await getList();
      const top = [...list].sort((a,b) => (b.score||0) - (a.score||0) || new Date(a.date) - new Date(b.date)).slice(0,10);
      return res.status(200).json(top);
    }
    if (req.method === 'POST') {
      const { name, score } = req.body || {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Nome inválido' });
      }
      const s = Number(score);
      if (!Number.isFinite(s) || s < 0) {
        return res.status(400).json({ error: 'Score inválido' });
      }
      const list = await getList();
      list.push({ name: name.trim().slice(0,32), score: Math.floor(s), date: new Date().toISOString() });
      const top = await saveList(list);
      return res.status(200).json(top);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
