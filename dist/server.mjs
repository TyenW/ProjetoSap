import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8000;
const __dirname = path.resolve();
const publicDir = __dirname; // serve project root statically

const LB_PATH = path.join(publicDir, 'assets', 'data', 'leaderboard.json');

app.use(cors());
app.use(express.json());

// Static site
app.use(express.static(publicDir));

async function readLeaderboard() {
  try {
    const data = await fs.readFile(LB_PATH, 'utf8');
    const arr = JSON.parse(data);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch (e) {
    // If not exists, create empty
    if (e.code === 'ENOENT') {
      await fs.mkdir(path.dirname(LB_PATH), { recursive: true });
      await fs.writeFile(LB_PATH, '[]', 'utf8');
      return [];
    }
    console.error('readLeaderboard error:', e);
    return [];
  }
}

async function writeLeaderboard(list) {
  try {
    await fs.writeFile(LB_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('writeLeaderboard error:', e);
    return false;
  }
}

// GET: return current top 10
app.get('/api/leaderboard', async (req, res) => {
  const list = await readLeaderboard();
  // Always return sorted top 10
  const sorted = [...list].sort((a,b) => (b.score||0) - (a.score||0) || new Date(a.date) - new Date(b.date)).slice(0,10);
  res.json(sorted);
});

// POST: add entry { name, score }
app.post('/api/leaderboard', async (req, res) => {
  try {
    const { name, score } = req.body || {};
    if (!name || typeof name !== 'string' || name.trim().length === 0)
      return res.status(400).json({ error: 'Nome inválido' });
    const s = Number(score);
    if (!Number.isFinite(s) || s < 0) return res.status(400).json({ error: 'Score inválido' });

    const list = await readLeaderboard();
    const entry = { name: name.trim().slice(0, 32), score: Math.floor(s), date: new Date().toISOString() };
    list.push(entry);
    list.sort((a,b) => (b.score||0) - (a.score||0) || new Date(a.date) - new Date(b.date));
    const top = list.slice(0,10);
    await writeLeaderboard(top);
    res.json(top);
  } catch (e) {
    console.error('POST /api/leaderboard error:', e);
    res.status(500).json({ error: 'Falha ao salvar no leaderboard' });
  }
});

app.listen(PORT, () => {
  console.log(`SAP-1 server running at http://localhost:${PORT}`);
});
