const GARMIN_BASE = "https://personal.connectapi.garmin.com";
const TOKEN_PATH = "/personalapitoken-service/personal-api/personal-api-key/token";

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runScheduledSync(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      if (!env.DB) return json({ ok: false, service: "training-center-sync", storage: false, error: "D1 binding DB is missing" }, 503);
      try {
        await env.DB.prepare("SELECT 1 AS connected").first();
        return json({ ok: true, service: "training-center-sync", storage: true, database: "reachable" });
      } catch (error) {
        return json({ ok: false, service: "training-center-sync", storage: false, error: String(error?.message || error).slice(0, 300) }, 503);
      }
    }
    if (url.pathname === "/run" && request.method === "GET") {
      return new Response(`<!doctype html><html lang="it"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Training Center Sync</title><body style="font:16px system-ui;max-width:560px;margin:40px auto;padding:16px;background:#111;color:#eee"><h2>Training Center Sync</h2><p>Inserisci il tuo SYNC_BEARER_TOKEN configurato nei Secrets Cloudflare. Non è la chiave Garmin.</p><input id="token" type="password" autocomplete="off" placeholder="SYNC_BEARER_TOKEN" style="box-sizing:border-box;width:100%;padding:12px;margin:8px 0;background:#222;color:#fff;border:1px solid #555;border-radius:8px"><label style="display:block;margin:4px 0 12px;color:#ccc"><input id="remember" type="checkbox" checked> Ricorda il token su questo dispositivo</label><div id="feedback" role="status" style="padding:10px;margin:8px 0;background:#263238;border-radius:8px;color:#fff">Pagina caricata. Inserisci il token e scegli un’operazione.</div><button id="go" style="padding:12px 18px">Sincronizza ultimi giorni</button> <button id="backfill" style="padding:12px 18px;margin-top:8px">Importa prossimo blocco (3 giorni)</button> <button id="status" style="padding:12px 18px;margin-top:8px">Stato agente</button> <button id="export" style="padding:12px 18px;margin-top:8px">Esporta tutti i dati D1</button> <button id="xlsx" style="padding:12px 18px;margin-top:8px">Genera Excel aggiornato</button><pre id="out" style="white-space:pre-wrap;overflow-wrap:anywhere;background:#222;padding:12px;border-radius:8px"></pre><script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
<script>
(function () {
  const $ = id => document.getElementById(id);
  const token = $('token'), remember = $('remember'), feedback = $('feedback'), output = $('out');
  function show(message) { feedback.textContent = message; output.textContent = message; }
  function getToken() {
    const value = token.value.trim();
    if (!value) { show('Inserisci il SYNC_BEARER_TOKEN.'); token.focus(); return null; }
    return value;
  }
  try {
    const saved = localStorage.getItem('training_center_sync_token');
    if (saved) { token.value = saved; show('Token recuperato. Pagina pronta.'); }
  } catch (e) { show('Memoria locale non disponibile. Il token va inserito manualmente.'); }
  token.addEventListener('change', saveToken);
  token.addEventListener('blur', saveToken);
  remember.addEventListener('change', saveToken);
  function saveToken() {
    try {
      if (remember.checked && token.value.trim()) {
        localStorage.setItem('training_center_sync_token', token.value.trim());
        feedback.textContent = 'Token salvato su questo dispositivo.';
      } else {
        localStorage.removeItem('training_center_sync_token');
        feedback.textContent = 'Token non memorizzato.';
      }
    } catch (e) { feedback.textContent = 'Impossibile salvare il token in questo browser.'; }
  }
  async function request(path, method) {
    const value = getToken(); if (!value) return;
    const button = path === '/sync' ? $('go') : path === '/backfill' ? $('backfill') : $('status');
    button.disabled = true; show('Operazione in corso…');
    try {
      const response = await fetch(path, { method: method || 'GET', headers: { Authorization: 'Bearer ' + value }, cache: 'no-store' });
      const body = await response.text();
      let data; try { data = JSON.parse(body); } catch (_) { data = body; }
      show('HTTP ' + response.status + '\\n' + (typeof data === 'string' ? data : JSON.stringify(data, null, 2)));
    } catch (error) { show('Errore di connessione: ' + String(error)); }
    finally { button.disabled = false; }
  }
  $('go').addEventListener('click', () => request('/sync', 'POST'));
  $('backfill').addEventListener('click', () => request('/backfill', 'POST'));
  $('status').addEventListener('click', () => request('/status', 'GET'));
  $('xlsx').addEventListener('click', async () => {
    const value = getToken(); if (!value) return;
    const button = $('xlsx'); button.disabled = true;
    const datasets = [
      ['garmin_records', 'Garmin records'],
      ['activities', 'Attivita'],
      ['activity_details', 'Dettagli attivita'],
      ['daily_records', 'Daily records']
    ];
    try {
      if (!window.XLSX) throw new Error('Libreria Excel non caricata. Controlla la connessione e ricarica la pagina.');
      const wb = XLSX.utils.book_new();
      const summary = [['Archivio Training Center'], ['Generato il', new Date().toISOString()], ['Fonte', 'Cloudflare D1'], ['Nota', 'Dati originali esportati senza trasformazioni. raw_json conservato come testo.']];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'LEGGIMI');
      for (const [dataset, sheetName] of datasets) {
        show('Lettura D1: ' + sheetName + '…');
        let offset = 0, rows = [], pages = 0;
        while (true) {
          const response = await fetch('/export?dataset=' + encodeURIComponent(dataset) + '&limit=500&offset=' + offset, { headers: { Authorization: 'Bearer ' + value }, cache: 'no-store' });
          const body = await response.json();
          if (!response.ok || !body.ok) throw new Error(dataset + ': HTTP ' + response.status + ' ' + JSON.stringify(body));
          if (!Array.isArray(body.rows)) throw new Error(dataset + ': risposta non valida');
          rows = rows.concat(body.rows); pages++;
          if (body.nextOffset === null) break;
          offset = body.nextOffset;
          if (pages > 100000) throw new Error('Numero pagine anomalo');
        }
        const ws = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([['Nessun record']]);
        ws['!cols'] = rows.length ? Object.keys(rows[0]).map(k => ({ wch: Math.min(42, Math.max(14, k.length + 2)) })) : [{wch:20}];
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        show('Caricati ' + rows.length + ' record: ' + sheetName);
      }
      XLSX.writeFile(wb, 'Archivio_Dati_Allenamento_Garmin_Storico.xlsx', { compression: true });
      show('Excel generato e inviato al download. Salvalo sul telefono. Dati provenienti direttamente da D1.');
    } catch (error) { show('Excel non generato: ' + String(error)); }
    finally { button.disabled = false; }
  });
  $('export').addEventListener('click', async () => {
    const value = getToken(); if (!value) return;
    const button = $('export'); button.disabled = true;
    const datasets = ['garmin_records', 'activities', 'activity_details', 'daily_records'];
    const archive = { format: 'training-center-d1-export-v1', exportedAt: new Date().toISOString(), source: 'training-center-sync /export', datasets: {} };
    try {
      for (const dataset of datasets) {
        show('Esportazione ' + dataset + '…');
        let offset = 0, rows = [], pages = 0;
        while (true) {
          const response = await fetch('/export?dataset=' + encodeURIComponent(dataset) + '&limit=500&offset=' + offset, { headers: { Authorization: 'Bearer ' + value }, cache: 'no-store' });
          const body = await response.json();
          if (!response.ok || !body.ok) throw new Error(dataset + ': HTTP ' + response.status + ' ' + JSON.stringify(body));
          if (!Array.isArray(body.rows)) throw new Error(dataset + ': risposta non valida');
          rows = rows.concat(body.rows); pages++;
          if (body.nextOffset === null) break;
          offset = body.nextOffset;
          if (pages > 100000) throw new Error('Numero pagine anomalo');
        }
        archive.datasets[dataset] = { count: rows.length, pages: pages, rows: rows };
      }
      const blob = new Blob([JSON.stringify(archive)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'training-center-d1-export-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      show('Esportazione completata. ' + datasets.map(d => d + ': ' + archive.datasets[d].count).join(' | ') + ' righe. File scaricato.');
    } catch (error) { show('Esportazione non riuscita: ' + String(error)); }
    finally { button.disabled = false; }
  });
  window.addEventListener('error', event => show('Errore nella pagina: ' + event.message));
})();
</script></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (url.pathname === "/status" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) {
        return json({ error: "unauthorized" }, 401);
      }
      await ensureCoreSchema(env.DB);
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS sync_state (
          state_key TEXT PRIMARY KEY,
          state_value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      const today = new Date().toISOString().slice(0, 10);
      const configuredStart = env.BACKFILL_START_DATE || "2015-01-01";
      const state = await env.DB.prepare(
        "SELECT state_value, updated_at FROM sync_state WHERE state_key='backfill_next_date'"
      ).first();
      const nextDate = state?.state_value || configuredStart;
      const dayMs = 86400000;
      const totalDays = Math.max(0, Math.floor((Date.parse(today + "T00:00:00Z") - Date.parse(configuredStart + "T00:00:00Z")) / dayMs) + 1);
      const completedDays = Math.max(0, Math.min(totalDays, Math.floor((Date.parse(nextDate + "T00:00:00Z") - Date.parse(configuredStart + "T00:00:00Z")) / dayMs)));
      const latest = await env.DB.prepare(
        "SELECT started_at, finished_at, status, activities_seen, daily_records_seen, message FROM sync_runs ORDER BY id DESC LIMIT 1"
      ).first();
      await ensureSyncLockSchema(env.DB);
      const counts = {};
      for (const table of ["activities", "activity_details", "daily_records", "garmin_records", "sync_runs"]) {
        try {
          const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM " + table).first();
          counts[table] = Number(row?.count || 0);
        } catch { counts[table] = 0; }
      }
      const lock = await env.DB.prepare(
        "SELECT lease_until FROM sync_locks WHERE lock_key='garmin_sync'"
      ).first();
      return json({
        ok: true,
        counts,
        agent: { cronConfiguredInRepository: "*/15 * * * *", lockUntil: lock?.lease_until || null },
        mode: nextDate > today ? "daily_sync" : "historical_backfill",
        backfill: {
          startDate: configuredStart,
          nextDate,
          today,
          complete: nextDate > today,
          completedDays,
          totalDays,
          percent: totalDays ? Math.round((completedDays / totalDays) * 1000) / 10 : 100,
          cursorUpdatedAt: state?.updated_at || null
        },
        latestRun: latest || null
      });
    }
    if (url.pathname === "/export" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) {
        return json({ error: "unauthorized" }, 401);
      }
      const dataset = url.searchParams.get("dataset") || "garmin_records";
      const allowed = {
        garmin_records: "SELECT dataset, record_key, record_date, source_endpoint, raw_json, retrieved_at FROM garmin_records ORDER BY record_date, dataset, record_key LIMIT ? OFFSET ?",
        activities: "SELECT activity_id, start_time_local, activity_type, activity_name, distance_m, duration_s, calories, average_hr, max_hr, raw_json, first_seen_at, last_seen_at FROM activities ORDER BY start_time_local, activity_id LIMIT ? OFFSET ?",
        activity_details: "SELECT activity_id, source_endpoint, raw_json, retrieved_at FROM activity_details ORDER BY activity_id LIMIT ? OFFSET ?",
        daily_records: "SELECT record_date, dataset, raw_json, updated_at FROM daily_records ORDER BY record_date, dataset LIMIT ? OFFSET ?"
      };
      if (!Object.prototype.hasOwnProperty.call(allowed, dataset)) {
        return json({ error: "unsupported_dataset", allowed: Object.keys(allowed) }, 400);
      }
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 250), 1), 500);
      const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
      if (!Number.isSafeInteger(limit) || !Number.isSafeInteger(offset)) {
        return json({ error: "invalid_pagination" }, 400);
      }
      const result = await env.DB.prepare(allowed[dataset]).bind(limit + 1, offset).all();
      const rows = result.results || [];
      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      return json({
        ok: true, dataset, count: page.length, limit, offset,
        nextOffset: hasMore ? offset + limit : null,
        rows: page
      });
    }
    if (url.pathname === "/backfill" && request.method === "POST") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) {
        return json({ error: "unauthorized" }, 401);
      }
      const result = await withSyncLock(env.DB, () => runBackfill(env));
      return json(result, result.busy ? 409 : result.ok ? 200 : 502);
    }
    if (url.pathname === "/sync" && request.method === "POST") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) {
        return json({ error: "unauthorized" }, 401);
      }
      const result = await withSyncLock(env.DB, () => runSync(env));
      return json(result, result.busy ? 409 : result.ok ? 200 : 502);
    }
    return json({ error: "not_found" }, 404);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

async function ensureSyncLockSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sync_locks (
      lock_key TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      lease_until TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function acquireSyncLock(db, owner) {
  await ensureSyncLockSchema(db);
  const result = await db.prepare(`
    INSERT INTO sync_locks (lock_key, owner, lease_until, updated_at)
    VALUES ('garmin_sync', ?, datetime('now', '+20 minutes'), CURRENT_TIMESTAMP)
    ON CONFLICT(lock_key) DO UPDATE SET
      owner=excluded.owner,
      lease_until=excluded.lease_until,
      updated_at=CURRENT_TIMESTAMP
    WHERE sync_locks.lease_until < CURRENT_TIMESTAMP
  `).bind(owner).run();
  return Number(result.meta?.changes || 0) > 0;
}

async function releaseSyncLock(db, owner) {
  await db.prepare("DELETE FROM sync_locks WHERE lock_key='garmin_sync' AND owner=?").bind(owner).run();
}

async function withSyncLock(db, task) {
  if (!db) return { ok: false, error: "D1 binding DB is missing" };
  const owner = crypto.randomUUID();
  if (!await acquireSyncLock(db, owner)) return { ok: false, busy: true, error: "A Garmin sync is already running. Check /status shortly." };
  try { return await task(); }
  finally { await releaseSyncLock(db, owner).catch(error => console.error("Could not release manual sync lock:", error)); }
}

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function getBearerToken(apiKey) {
  const response = await fetch(GARMIN_BASE + TOKEN_PATH, {
    method: "POST",
    headers: { Authorization: `ApiKey ${apiKey}`, Accept: "*/*" }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Garmin token exchange failed: HTTP ${response.status}`);
  const token = body.trim().replace(/^"|"$/g, "");
  if (!token || token.split(".").length !== 3) throw new Error("Garmin returned an unexpected token response");
  return token;
}

async function garminGet(path, token) {
  const response = await fetch(GARMIN_BASE + path, {
    headers: { Authorization: `Bearer ${token}`, Accept: "*/*" }
  });
  // Garmin may return 404 when an optional dataset/date has no record.
  // Treat it like an empty response; auth/server errors remain fatal.
  if (response.status === 204 || response.status === 404) return null;
  if (!response.ok) throw new Error(`Garmin GET failed: HTTP ${response.status} for ${path.split("?")[0]}`);
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function hasPayload(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const collectionKeys = ["activities", "dailySummaries", "summaries", "data", "items"];
    const collections = collectionKeys.filter(key => Array.isArray(value[key]));
    if (collections.length) return collections.some(key => value[key].length > 0);
    return Object.keys(value).length > 0;
  }
  return true;
}

function rowsFrom(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    for (const key of ["activities", "dailySummaries", "summaries", "data", "items"]) {
      if (Array.isArray(value[key])) return value[key];
    }
    return [value];
  }
  return [];
}

async function saveActivity(db, item) {
  const id = item.activityId ?? item.activity_id ?? item.id;
  if (id == null) return false;
  const type = item.activityType?.typeKey ?? item.activityType ?? item.activity_type ?? null;
  await db.prepare(`
    INSERT INTO activities
      (activity_id, start_time_local, activity_type, activity_name, distance_m, duration_s,
       calories, average_hr, max_hr, raw_json, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(activity_id) DO UPDATE SET
      start_time_local=excluded.start_time_local,
      activity_type=excluded.activity_type,
      activity_name=excluded.activity_name,
      distance_m=excluded.distance_m,
      duration_s=excluded.duration_s,
      calories=excluded.calories,
      average_hr=excluded.average_hr,
      max_hr=excluded.max_hr,
      raw_json=excluded.raw_json,
      last_seen_at=CURRENT_TIMESTAMP
  `).bind(
    String(id),
    item.startTimeLocal ?? item.startTimeGMT ?? null,
    typeof type === "string" ? type : JSON.stringify(type),
    item.activityName ?? item.name ?? null,
    item.distance ?? null,
    item.duration ?? item.elapsedDuration ?? null,
    item.calories ?? null,
    item.averageHR ?? item.avgHr ?? null,
    item.maxHR ?? item.maxHr ?? null,
    JSON.stringify(item)
  ).run();
  return true;
}

async function saveActivityDetail(db, activityId, detail, endpoint) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS activity_details (
      activity_id TEXT PRIMARY KEY,
      source_endpoint TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare(`
    INSERT INTO activity_details (activity_id, source_endpoint, raw_json, retrieved_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(activity_id) DO UPDATE SET
      source_endpoint=excluded.source_endpoint,
      raw_json=excluded.raw_json,
      retrieved_at=CURRENT_TIMESTAMP
  `).bind(String(activityId), endpoint, JSON.stringify(detail)).run();
}

function normalizeGarminDate(value, fallbackDate) {
  if (value == null) return fallbackDate;
  if (typeof value === "number" || (typeof value === "string" && /^\d{12,}$/.test(value))) {
    const n = Number(value);
    const d = new Date(n);
    return Number.isNaN(d.getTime()) ? fallbackDate : d.toISOString().slice(0, 10);
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  return fallbackDate;
}

function recordKey(dataset, row, fallbackDate) {
  if (row && typeof row === "object" && !Array.isArray(row)) {
    const direct = row.activityId ?? row.activity_id ?? row.id ?? row.uuid?.uuid ?? row.uuid;
    if (direct != null) return String(direct);
    const time = row.timestamp ?? row.createTimestamp ?? row.persistedTimestampGMT ??
      row.startTimeGMT ?? row.startTimeLocal ?? row.calendarDate ?? row.date;
    const device = row.deviceId ?? row.deviceID ?? "";
    if (time != null) return `${String(time)}:${String(device)}`;
  }
  return `${fallbackDate}:${JSON.stringify(row)}`;
}

async function saveDaily(db, date, dataset, value, endpoint = null) {
  const raw = JSON.stringify(value);
  await db.prepare(`
    INSERT INTO daily_records (record_date, dataset, raw_json, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(record_date, dataset) DO UPDATE SET
      raw_json=excluded.raw_json, updated_at=CURRENT_TIMESTAMP
  `).bind(date, dataset, raw).run();

  const rows = rowsFrom(value);
  const items = rows.length ? rows : (value == null ? [] : [value]);
  for (const item of items) {
    const key = recordKey(dataset, item, date);
    await db.prepare(`
      INSERT INTO garmin_records (dataset, record_key, record_date, source_endpoint, raw_json, retrieved_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(dataset, record_key) DO UPDATE SET
        record_date=excluded.record_date,
        source_endpoint=excluded.source_endpoint,
        raw_json=excluded.raw_json,
        retrieved_at=CURRENT_TIMESTAMP
    `).bind(dataset, key, date, endpoint, JSON.stringify(item)).run();
  }
}

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function runScheduledSync(env) {
  // Keep new Garmin data fresh while the historical archive advances.
  // Reuse one 24-hour bearer token for both bounded sync operations.
  const owner = crypto.randomUUID();
  try {
    if (!env.DB) throw new Error("D1 binding DB is missing");
    if (!await acquireSyncLock(env.DB, owner)) {
      console.log("Garmin sync skipped: another run holds the D1 lock.");
      return { ok: true, skipped: true, reason: "sync_already_running" };
    }
    if (!env.GARMIN_PERSONAL_API_KEY) throw new Error("Worker Secret GARMIN_PERSONAL_API_KEY is missing");
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sync_state (
        state_key TEXT PRIMARY KEY,
        state_value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const token = await getBearerToken(env.GARMIN_PERSONAL_API_KEY);
    const recent = await runSync(env, null, token);
    if (!recent.ok) return { ok: false, mode: "scheduled_sync", recent, backfill: null };

    const backfill = await runBackfill(env, token);
    return { ok: Boolean(backfill.ok), mode: "scheduled_sync", recent, backfill };
  } catch (error) {
    console.error("Scheduled Garmin sync failed:", error);
    return { ok: false, mode: "scheduled_sync", error: String(error?.message || error).slice(0, 500) };
  } finally {
    if (env.DB) await releaseSyncLock(env.DB, owner).catch(error => console.error("Could not release Garmin sync lock:", error));
  }
}

async function runBackfill(env, tokenOverride = null) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS sync_state (
        state_key TEXT PRIMARY KEY,
        state_value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const today = new Date().toISOString().slice(0, 10);
    const configuredStart = env.BACKFILL_START_DATE || "2015-01-01";
    let state = await env.DB.prepare(
      "SELECT state_value FROM sync_state WHERE state_key='backfill_next_date'"
    ).first();
    const startDate = state?.state_value || configuredStart;
    if (startDate > today) return { ok: true, complete: true, nextDate: startDate };
    const proposedEnd = addDays(startDate, 2);
    const endDate = proposedEnd > today ? today : proposedEnd;
    const result = await runSync(env, { startDate, endDate }, tokenOverride);
    if (!result.ok || result.partial) {
      return { ...result, backfill: true, cursorAdvanced: false, nextDate: startDate };
    }
    const nextDate = addDays(endDate, 1);
    await env.DB.prepare(`
      INSERT INTO sync_state (state_key, state_value, updated_at)
      VALUES ('backfill_next_date', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(state_key) DO UPDATE SET
        state_value=excluded.state_value, updated_at=CURRENT_TIMESTAMP
    `).bind(nextDate).run();
    return { ...result, backfill: true, cursorAdvanced: true, nextDate, complete: nextDate > today };
  } catch (error) {
    return { ok: false, backfill: true, error: String(error?.message || error).slice(0, 500) };
  }
}

async function ensureCoreSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS activities (
    activity_id TEXT PRIMARY KEY,
    start_time_local TEXT,
    activity_type TEXT,
    activity_name TEXT,
    distance_m REAL,
    duration_s REAL,
    calories REAL,
    average_hr REAL,
    max_hr REAL,
    raw_json TEXT NOT NULL,
    first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time_local)").run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS daily_records (
    record_date TEXT NOT NULL,
    dataset TEXT NOT NULL,
    raw_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (record_date, dataset)
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    activities_seen INTEGER NOT NULL DEFAULT 0,
    daily_records_seen INTEGER NOT NULL DEFAULT 0,
    message TEXT
  )`).run();
}

async function runSync(env, rangeOverride = null, tokenOverride = null) {
  const startedAt = new Date().toISOString();
  let runId;
  try {
    if (!env.DB) throw new Error("D1 binding DB is missing");
    if (!env.GARMIN_PERSONAL_API_KEY) throw new Error("Worker Secret GARMIN_PERSONAL_API_KEY is missing");
    await ensureCoreSchema(env.DB);
    const insertRun = await env.DB.prepare(
      "INSERT INTO sync_runs (started_at, status) VALUES (?, 'running')"
    ).bind(startedAt).run();
    runId = insertRun.meta.last_row_id;

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS garmin_records (
        dataset TEXT NOT NULL,
        record_key TEXT NOT NULL,
        record_date TEXT,
        source_endpoint TEXT,
        raw_json TEXT NOT NULL,
        retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (dataset, record_key)
      )
    `).run();
    await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_garmin_records_date ON garmin_records(record_date, dataset)").run();
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS activity_details (
        activity_id TEXT PRIMARY KEY,
        source_endpoint TEXT NOT NULL,
        raw_json TEXT NOT NULL,
        retrieved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const token = tokenOverride || await getBearerToken(env.GARMIN_PERSONAL_API_KEY);
    const lookback = 3;
    const startDate = rangeOverride?.startDate || isoDateDaysAgo(lookback);
    const endDate = rangeOverride?.endDate || new Date().toISOString().slice(0, 10);

    let activityCount = 0;
    let dailyCount = 0;
    let activityDetailsProcessed = 0;
    const activityDetailsPerRun = 3;
    const datasetErrors = [];
    let offset = 0;
    const pageSize = 100;
    while (true) {
      const params = new URLSearchParams({
        start: String(offset), limit: String(pageSize),
        startDate, endDate
      });
      const page = rowsFrom(await garminGet(
        `/activitylist-service/activities/search/activities?${params}`, token
      ));
      for (const item of page) {
        if (await saveActivity(env.DB, item)) {
          activityCount++;
          const activityId = item.activityId ?? item.activity_id ?? item.id;
          if (activityId != null && activityDetailsProcessed < activityDetailsPerRun) {
            try {
              const existingDetail = await env.DB.prepare(
                "SELECT activity_id FROM activity_details WHERE activity_id=?"
              ).bind(String(activityId)).first();
              if (!existingDetail) {
                activityDetailsProcessed++;
                const detailPath = `/activity-service/activity/${encodeURIComponent(String(activityId))}`;
                const detail = await garminGet(detailPath, token);
                if (hasPayload(detail)) await saveActivityDetail(env.DB, activityId, detail, detailPath);
              }
              const existingWorkouts = await env.DB.prepare(
                "SELECT 1 AS found FROM garmin_records WHERE dataset='activity_workouts' AND record_key=? LIMIT 1"
              ).bind(String(activityId)).first();
              if (!existingWorkouts) {
                if (existingDetail) activityDetailsProcessed++;
                const workoutsPath = `/activity-service/activity/${encodeURIComponent(String(activityId))}/workouts`;
                const workouts = await garminGet(workoutsPath, token);
                if (hasPayload(workouts)) {
                  const activityDate = normalizeGarminDate(item.startTimeLocal ?? item.startTimeGMT, endDate);
                  await saveDaily(env.DB, activityDate, "activity_workouts", { activityId: String(activityId), workouts }, workoutsPath);
                  dailyCount++;
                }
              }
            } catch (error) {
              datasetErrors.push({ dataset: "activity_details", activityId: String(activityId), error: String(error?.message || error).slice(0, 200) });
            }
          }
        }
      }
      if (page.length < pageSize) break;
      offset += pageSize;
      if (offset >= 2000) break;
    }

    const datasets = [
      ["daily_summaries", `/usersummary-service/v2/dailysummaries?startDate=${startDate}&endDate=${endDate}`],
      ["steps", `/usersummary-service/stats/steps/daily/${startDate}/${endDate}`],
      ["stress", `/usersummary-service/stats/stress/daily/${startDate}/${endDate}`],
      ["sleep", `/sleep-service/sleep/dailySleepSummariesByDate?startDate=${startDate}&endDate=${endDate}`],
      ["hrv", `/hrv-service/hrv/daily/${startDate}/${endDate}`],
      ["body_battery", `/wellness-service/wellness/bodyBattery/reports/daily?startDate=${startDate}&endDate=${endDate}`],
      ["weight", `/weight-service/weight/range/${startDate}/${endDate}?includeAll=true`],
      ["hydration", `/usersummary-service/stats/hydration/daily/${startDate}/${endDate}`],
      ["vo2_max", `/metrics-service/metrics/maxmet/daily/${startDate}/${endDate}`],
      ["wellness_activity_summaries", `/wellnessactivity-service/activity/summary/range/${startDate}/${endDate}`],
      ["effective_weight_goals", `/goal-service/goal/user/effective/weightgoal/${startDate}/${endDate}`]
    ];

    const singletonDatasets = [
      ["profile_settings", "/userprofile-service/userprofile/settings"],
      ["heart_rate_zones", "/biometric-service/heartRateZones/v2"],
      ["activity_types", "/activity-service/activity/activityTypes/simple"]
    ];
    for (const [dataset, path] of singletonDatasets) {
      try {
        const existing = await env.DB.prepare(
          "SELECT 1 AS found FROM garmin_records WHERE dataset=? LIMIT 1"
        ).bind(dataset).first();
        if (!existing) {
          const result = await garminGet(path, token);
          if (hasPayload(result)) {
            await saveDaily(env.DB, endDate, dataset, result, path);
            dailyCount++;
          }
        }
      } catch (error) {
        datasetErrors.push({ dataset, error: String(error?.message || error).slice(0, 250) });
      }
    }

    for (const [dataset, path] of datasets) {
      try {
        const result = await garminGet(path, token);
        const rows = rowsFrom(result);
        if (rows.length) {
          for (const row of rows) {
            const date = normalizeGarminDate(row.calendarDate ?? row.date ?? row.startDate, endDate);
            await saveDaily(env.DB, date, dataset, row, path);
            dailyCount++;
          }
        } else if (hasPayload(result)) {
          await saveDaily(env.DB, endDate, dataset, result, path);
          dailyCount++;
        }
      } catch (error) {
        datasetErrors.push({ dataset, error: String(error?.message || error).slice(0, 300) });
      }
    }

    // Date-scoped Garmin datasets: fetch only dates not already archived.
    const dateScopedDatasets = [
      ["daily_heart_rate", date => `/wellness-service/wellness/dailyHeartRate?date=${date}`],
      ["fitness_age", date => `/fitnessage-service/fitnessage/v2/${date}`],
      ["spo2_acclimation", date => `/wellness-service/wellness/daily/spo2acclimation/${date}`],
      ["daily_hrv_detail", date => `/hrv-service/hrv/${date}`],
      ["daily_sleep_detail", date => `/sleep-service/sleep/dailySleep?date=${date}`],
      ["food_logs", date => `/nutrition-service/food/logs/${date}`]
    ];
    for (const [dataset, pathForDate] of dateScopedDatasets) {
      for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
        try {
          const existing = await env.DB.prepare(
            "SELECT 1 AS found FROM garmin_records WHERE dataset=? AND record_date=? LIMIT 1"
          ).bind(dataset, date).first();
          if (existing) continue;
          const path = pathForDate(date);
          const result = await garminGet(path, token);
          if (hasPayload(result)) {
            await saveDaily(env.DB, date, dataset, result, path);
            dailyCount++;
          }
        } catch (error) {
          datasetErrors.push({ dataset, date, error: String(error?.message || error).slice(0, 250) });
        }
      }
    }

    const pendingDetails = await env.DB.prepare("SELECT COUNT(*) AS count FROM activities a LEFT JOIN activity_details d ON d.activity_id = a.activity_id LEFT JOIN garmin_records w ON w.dataset = 'activity_workouts' AND w.record_key = a.activity_id WHERE (d.activity_id IS NULL OR w.record_key IS NULL) AND a.start_time_local >= ? AND a.start_time_local < ?").bind(startDate, addDays(endDate, 1)).first();
    const pendingActivityDetails = Number(pendingDetails?.count || 0);
    // Pending detail/workout rows are a resumable queue, not a failed sync.
    // Missing optional Garmin payloads must not hold the historical cursor forever.
    const finalStatus = datasetErrors.length ? "partial" : "success";

    await env.DB.prepare(
      "UPDATE sync_runs SET finished_at=?, status=?, activities_seen=?, daily_records_seen=?, message=? WHERE id=?"
    ).bind(new Date().toISOString(), finalStatus, activityCount, dailyCount, datasetErrors.length ? JSON.stringify(datasetErrors) : null, runId).run();
    return { ok: true, partial: datasetErrors.length > 0, startDate, endDate, activitiesSeen: activityCount, activityDetailsProcessed, pendingActivityDetails, dailyRecordsSeen: dailyCount, datasetErrors };
  } catch (error) {
    const message = String(error?.message || error).slice(0, 500);
    if (runId) {
      await env.DB.prepare(
        "UPDATE sync_runs SET finished_at=?, status='error', message=? WHERE id=?"
      ).bind(new Date().toISOString(), message, runId).run().catch(() => {});
    }
    return { ok: false, error: message };
  }
}
