const TARGET_GAS_URL = process.env.BITLAB_GAS_URL || 'https://script.google.com/macros/s/AKfycbwD6QweAI0CHiQDWgHNoN0lARFxowqUIluVvEnT855HkyWWFgmEuU64AEyfgso7JIl6Xg/exec';

function toSearchParams(input) {
  const params = new URLSearchParams();
  if (!input) return params;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return toSearchParams(JSON.parse(trimmed));
      } catch (_err) {
        return new URLSearchParams(input);
      }
    }
    return new URLSearchParams(input);
  }

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
      return;
    }
    params.append(key, String(value));
  });

  return params;
}

function mergeIntoParams(params, input) {
  if (!input || typeof input !== 'object') return;
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method === 'GET') {
      const query = new URLSearchParams(req.query || {});
      if (!query.has('action')) {
        query.set('action', 'health');
      }

      const response = await fetch(`${TARGET_GAS_URL}?${query.toString()}`, {
        method: 'GET'
      });

      const text = await response.text();
      res.status(response.ok ? 200 : response.status).setHeader('Content-Type', 'application/json; charset=utf-8').send(text);
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', message: 'Method not allowed' });
      return;
    }

    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    let bodyParams;

    if (contentType.includes('application/json')) {
      bodyParams = toSearchParams(req.body || {});
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      bodyParams = toSearchParams(req.body || {});
    } else {
      bodyParams = toSearchParams(req.body || {});
    }

    mergeIntoParams(bodyParams, req.query || {});

    const response = await fetch(TARGET_GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: bodyParams.toString()
    });

    const text = await response.text();
    res.status(response.ok ? 200 : response.status).setHeader('Content-Type', 'application/json; charset=utf-8').send(text);
  } catch (error) {
    res.status(502).json({
      status: 'error',
      message: `Telemetry proxy failed: ${String(error && error.message ? error.message : error)}`
    });
  }
};
