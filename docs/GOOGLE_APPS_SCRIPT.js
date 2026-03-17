/**
 * Google Apps Script - Receptor de Telemetria BitLab (v3)
 *
 * Objetivos:
 * - Idempotência por eventId (sem duplicação)
 * - Verificação de integridade por checksum
 * - Armazenamento em duas abas: Raw + Structured
 * - Endpoints de import/export para backup e reprocessamento
 *
 * Passos rápidos:
 * 1) Ajuste SPREADSHEET_ID
 * 2) Faça Deploy > New deployment > Web app
 * 3) Execute como: você; acesso: Anyone
 */

const CONFIG = {
  SPREADSHEET_ID: '1ineYu9yqYnGO3m_wlvhSXw0mKgyEvyPzRZHOG8fMLmM',
  RAW_SHEET: 'Raw_Events',
  STRUCT_SHEET: 'Structured_Events',
  MAX_IMPORT_BATCH: 500,
  CACHE_TTL_SECONDS: 60 * 60 * 6
};

const RAW_HEADERS = [
  'ingestedAt',
  'eventId',
  'timestamp',
  'sessionId',
  'studentId',
  'installationId',
  'nickname',
  'topic',
  'metricType',
  'value',
  'sequence',
  'isRepeating',
  'checksum',
  'checksumValid',
  'source',
  'userAgent',
  'viewport',
  'language',
  'platform',
  'retryCount',
  'userJourneyJson',
  'additionalDataJson',
  'rawJson'
];

const STRUCT_HEADERS = [
  'ingestedAt',
  'eventId',
  'timestamp',
  'date',
  'hour',
  'sessionId',
  'studentId',
  'installationId',
  'nickname',
  'topic',
  'metricType',
  'value',
  'sequence',
  'isRepeating',
  'checksumValid',
  'page',
  'duration',
  'questionId',
  'difficulty',
  'correct',
  'timeMs',
  'errorMessage',
  'queueSize',
  'connection',
  'additionalDataFlat',
  'rawJson'
];

function doPost(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ingest';

    if (action === 'import') {
      return importEvents_(e);
    }

    const payload = parseRequestPayload_(e);
    const ingest = ingestSingleEvent_(payload, 'webapp');

    return jsonResponse_({
      status: ingest.duplicate ? 'duplicate' : 'success',
      duplicate: ingest.duplicate,
      eventId: ingest.eventId,
      checksumValid: ingest.checksumValid
    });
  } catch (error) {
    return jsonResponse_({ status: 'error', message: String(error && error.message ? error.message : error) });
  }
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'health';

    if (action === 'export') {
      return exportEvents_(e);
    }

    if (action === 'health') {
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      return jsonResponse_({
        status: 'ok',
        spreadsheet: spreadsheet.getName(),
        rawSheet: CONFIG.RAW_SHEET,
        structuredSheet: CONFIG.STRUCT_SHEET,
        now: new Date().toISOString()
      });
    }

    return jsonResponse_({ status: 'error', message: 'Ação inválida. Use health ou export.' });
  } catch (error) {
    return jsonResponse_({ status: 'error', message: String(error && error.message ? error.message : error) });
  }
}

function ingestSingleEvent_(inputPayload, source) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const rawSheet = getOrCreateSheet_(spreadsheet, CONFIG.RAW_SHEET, RAW_HEADERS);
  const structuredSheet = getOrCreateSheet_(spreadsheet, CONFIG.STRUCT_SHEET, STRUCT_HEADERS);

  const normalized = normalizePayload_(inputPayload);
  const eventId = normalized.eventId;

  if (!eventId) {
    throw new Error('eventId ausente após normalização.');
  }

  const alreadyExists = eventExists_(rawSheet, eventId);
  if (alreadyExists) {
    return { eventId, duplicate: true, checksumValid: normalized.checksumValid };
  }

  const rawRow = buildRawRow_(normalized, source || 'webapp');
  const structRow = buildStructuredRow_(normalized);

  rawSheet.appendRow(rawRow);
  structuredSheet.appendRow(structRow);

  cacheEventId_(eventId);

  return { eventId, duplicate: false, checksumValid: normalized.checksumValid };
}

function normalizePayload_(payload) {
  const nowIso = new Date().toISOString();
  const timestamp = coerceIsoDate_(payload.timestamp) || nowIso;
  const metricType = String(payload.metricType || payload.type || '').trim().toUpperCase();
  const topic = String(payload.topic || 'GENERAL').trim().toUpperCase();

  const sessionId = String(payload.sessionId || '').trim();
  const studentId = String(payload.studentId || '').trim();
  const installationId = String(payload.installationId || '').trim();
  const nickname = String(payload.nickname || '').trim().substring(0, 60);

  const sequence = toInteger_(payload.sequence, 0);
  const value = payload.value !== undefined && payload.value !== null ? String(payload.value) : '';
  const isRepeating = String(payload.isRepeating || '').toLowerCase() === 'true' ? 'true' : 'false';

  const additionalData = parseJsonSafe_(payload.additionalData, {});
  const userJourney = parseJsonSafe_(payload.userJourney, []);

  let eventId = String(payload.eventId || '').trim();
  if (!eventId) {
    const base = [timestamp, sessionId, studentId, metricType, sequence, value].join('|');
    eventId = 'fallback_' + hashString_(base);
  }

  const checksum = String(payload.checksum || '').trim();
  const computedChecksum = computeChecksum_({
    eventId,
    timestamp,
    sessionId,
    studentId,
    metricType,
    topic,
    value,
    additionalData: JSON.stringify(additionalData),
    sequence,
    installationId,
    nickname
  });

  const checksumValid = checksum ? (checksum === computedChecksum) : false;

  return {
    ingestedAt: nowIso,
    eventId,
    timestamp,
    sessionId,
    studentId,
    installationId,
    nickname,
    topic,
    metricType,
    value,
    sequence,
    isRepeating,
    checksum,
    checksumValid,
    userAgent: String(payload.userAgent || '').substring(0, 250),
    viewport: String(payload.viewport || ''),
    language: String(payload.language || ''),
    platform: String(payload.platform || ''),
    retryCount: toInteger_(payload.retryCount, 0),
    userJourney,
    additionalData,
    rawPayload: payload
  };
}

function buildRawRow_(normalized, source) {
  return [
    normalized.ingestedAt,
    normalized.eventId,
    normalized.timestamp,
    normalized.sessionId,
    normalized.studentId,
    normalized.installationId,
    normalized.nickname,
    normalized.topic,
    normalized.metricType,
    normalized.value,
    normalized.sequence,
    normalized.isRepeating,
    normalized.checksum,
    normalized.checksumValid ? 'true' : 'false',
    source,
    normalized.userAgent,
    normalized.viewport,
    normalized.language,
    normalized.platform,
    normalized.retryCount,
    JSON.stringify(normalized.userJourney),
    JSON.stringify(normalized.additionalData),
    JSON.stringify(normalized.rawPayload)
  ];
}

function buildStructuredRow_(normalized) {
  const dt = new Date(normalized.timestamp);
  const date = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const hour = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'HH');

  const ad = normalized.additionalData || {};

  return [
    normalized.ingestedAt,
    normalized.eventId,
    normalized.timestamp,
    date,
    hour,
    normalized.sessionId,
    normalized.studentId,
    normalized.installationId,
    normalized.nickname,
    normalized.topic,
    normalized.metricType,
    normalized.value,
    normalized.sequence,
    normalized.isRepeating,
    normalized.checksumValid ? 'true' : 'false',
    toFlatValue_(ad.page),
    toFlatValue_(ad.duration || ad.sessionDuration),
    toFlatValue_(ad.questionId),
    toFlatValue_(ad.difficulty),
    toFlatValue_(ad.correct),
    toFlatValue_(ad.timeMs || ad.responseTime),
    toFlatValue_(ad.message || ad.errorReason),
    toFlatValue_(ad.queueSize),
    toFlatValue_(ad.connection),
    flattenObject_(ad),
    JSON.stringify(normalized.rawPayload)
  ];
}

function importEvents_(e) {
  const payload = parseRequestPayload_(e);
  const records = Array.isArray(payload.records) ? payload.records : [];

  if (records.length === 0) {
    return jsonResponse_({ status: 'error', message: 'records vazio no import.' });
  }

  if (records.length > CONFIG.MAX_IMPORT_BATCH) {
    return jsonResponse_({
      status: 'error',
      message: 'Lote excede limite.',
      maxBatch: CONFIG.MAX_IMPORT_BATCH
    });
  }

  let inserted = 0;
  let duplicates = 0;
  let checksumInvalid = 0;
  const errors = [];

  records.forEach(function(record, index) {
    try {
      const result = ingestSingleEvent_(record, 'import');
      if (result.duplicate) {
        duplicates += 1;
      } else {
        inserted += 1;
      }
      if (!result.checksumValid) {
        checksumInvalid += 1;
      }
    } catch (err) {
      errors.push({ index, message: String(err && err.message ? err.message : err) });
    }
  });

  return jsonResponse_({
    status: errors.length ? 'partial' : 'success',
    inserted,
    duplicates,
    checksumInvalid,
    errors
  });
}

function exportEvents_(e) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const rawSheet = getOrCreateSheet_(spreadsheet, CONFIG.RAW_SHEET, RAW_HEADERS);

  const limit = Math.max(1, Math.min(toInteger_((e && e.parameter && e.parameter.limit) || 1000, 1000), 5000));
  const includeDuplicates = String((e && e.parameter && e.parameter.includeDuplicates) || 'true') === 'true';

  const values = rawSheet.getDataRange().getValues();
  if (values.length <= 1) {
    return jsonResponse_({ status: 'success', count: 0, records: [] });
  }

  const headers = values[0];
  const rows = values.slice(1);
  const sliced = rows.slice(Math.max(0, rows.length - limit));

  const records = sliced
    .map(function(row) {
      const item = {};
      headers.forEach(function(header, idx) {
        item[header] = row[idx];
      });
      return item;
    })
    .filter(function(item) {
      return includeDuplicates || item.source !== 'duplicate';
    });

  return jsonResponse_({ status: 'success', count: records.length, records });
}

function parseRequestPayload_(e) {
  const parameter = (e && e.parameter) ? e.parameter : {};

  if (e && e.postData && e.postData.contents) {
    const contents = e.postData.contents;
    const type = String(e.postData.type || '').toLowerCase();

    if (type.indexOf('application/json') >= 0) {
      const parsed = parseJsonSafe_(contents, null);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  }

  return parameter;
}

function eventExists_(sheet, eventId) {
  if (!eventId) return false;
  const cacheKey = 'evt_' + eventId;
  const cache = CacheService.getScriptCache();

  if (cache.get(cacheKey)) {
    return true;
  }

  const dataRows = sheet.getLastRow() - 1;
  if (dataRows <= 0) {
    return false;
  }

  const finder = sheet.getRange(2, 2, dataRows, 1).createTextFinder(eventId).matchEntireCell(true);
  const found = finder.findNext();
  const exists = !!found;

  if (exists) {
    cache.put(cacheKey, '1', CONFIG.CACHE_TTL_SECONDS);
  }

  return exists;
}

function cacheEventId_(eventId) {
  if (!eventId) return;
  CacheService.getScriptCache().put('evt_' + eventId, '1', CONFIG.CACHE_TTL_SECONDS);
}

function getOrCreateSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1f4e79');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseJsonSafe_(value, fallbackValue) {
  if (value === null || value === undefined || value === '') return fallbackValue;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch (_error) {
    return fallbackValue;
  }
}

function toInteger_(value, defaultValue) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : defaultValue;
}

function coerceIsoDate_(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
}

function toFlatValue_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function flattenObject_(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const keys = Object.keys(obj).sort();
  return keys
    .map(function(key) {
      return key + '=' + toFlatValue_(obj[key]);
    })
    .join('; ');
}

function computeChecksum_(payloadCore) {
  return hashString_(JSON.stringify(payloadCore));
}

function hashString_(value) {
  const str = String(value || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function setupInitialSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  getOrCreateSheet_(spreadsheet, CONFIG.RAW_SHEET, RAW_HEADERS);
  getOrCreateSheet_(spreadsheet, CONFIG.STRUCT_SHEET, STRUCT_HEADERS);
}
