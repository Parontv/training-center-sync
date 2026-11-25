const GARMIN_BASE = "https://personal.connectapi.garmin.com";
const TOKEN_PATH = "/personalapitoken-service/personal-api/personal-api-key/token";

export default {
  async scheduled(event, env, ctx) {
    if (event.cron === "*/3 * * * *") {
      ctx.waitUntil(runScheduledSync(env));
      return;
    }
    if (event.cron === "0 10,11 * * *") {
      ctx.waitUntil(runScheduledDailySync(event, env));
    }
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
      return new Response(`<!doctype html><html lang="it"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Training Center Sync</title><body style="font:16px system-ui;max-width:560px;margin:40px auto;padding:16px;background:#111;color:#eee"><h2>Training Center Sync</h2><p>Inserisci il tuo SYNC_BEARER_TOKEN configurato nei Secrets Cloudflare. Non è la chiave Garmin.</p><input id="token" type="password" autocomplete="off" placeholder="SYNC_BEARER_TOKEN" style="box-sizing:border-box;width:100%;padding:12px;margin:8px 0;background:#222;color:#fff;border:1px solid #555;border-radius:8px"><label style="display:block;margin:4px 0 12px;color:#ccc"><input id="remember" type="checkbox" checked> Ricorda il token su questo dispositivo</label><div id="feedback" role="status" style="padding:10px;margin:8px 0;background:#263238;border-radius:8px;color:#fff">Pagina caricata. Inserisci il token e scegli un’operazione.</div><button id="backfill" style="padding:12px 18px;margin-top:8px">Importa prossimo blocco (3 giorni)</button> <button id="status" style="padding:12px 18px;margin-top:8px">Stato agente</button> <button id="export" style="padding:12px 18px;margin-top:8px">Esporta tutti i dati D1</button> <button id="xlsx" style="padding:12px 18px;margin-top:8px">Genera Excel aggiornato</button> <button id="auditGrafana" style="padding:12px 18px;margin-top:8px">Audit schema Grafana</button><pre id="out" style="white-space:pre-wrap;overflow-wrap:anywhere;background:#222;padding:12px;border-radius:8px"></pre><script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
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
  $('backfill').addEventListener('click', () => request('/backfill', 'POST'));
  $('status').addEventListener('click', () => request('/status', 'GET'));
  $('auditGrafana').addEventListener('click', async () => {
    const value = getToken(); if (!value) return;
    const button = $('auditGrafana'); button.disabled = true;
    show('Audit schema read-only in corso…');
    try {
      const response = await fetch('/dashboard-schema', { headers: { Authorization: 'Bearer ' + value }, cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || !body || body.ok === false) throw new Error('HTTP ' + response.status + ': ' + JSON.stringify(body));
      const audit = { exportedAt: new Date().toISOString(), source: 'training-center-sync /dashboard-schema', warning: 'Schema audit only. Samples may contain personal Garmin data; keep this file private.', schema: body };
      const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = downloadUrl; link.download = 'training-center-live-schema-audit.json';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(downloadUrl);
      const g = Array.isArray(body.garmin_records) ? body.garmin_records.length : 0;
      const d = Array.isArray(body.daily_records) ? body.daily_records.length : 0;
      show('Audit completato: ' + g + ' campi garmin_records e ' + d + ' campi daily_records. JSON scaricato. Non contiene il token.');
    } catch (error) { show('Audit non riuscito: ' + String(error)); }
    finally { button.disabled = false; }
  });
  async function refreshStatus() {
    const value = token.value.trim();
    if (!value) return;
    try {
      const response = await fetch('/status', { headers: { Authorization: 'Bearer ' + value }, cache: 'no-store' });
      const body = await response.json();
      if (response.ok && body.ok) {
        feedback.textContent = 'Monitor automatico · ' + new Date().toLocaleTimeString() +
          ' · prossimo giorno storico: ' + (body.backfill?.nextDate || 'n/d') +
          ' · attività: ' + (body.counts?.activities ?? 'n/d') +
          ' · record Garmin: ' + (body.counts?.garmin_records ?? 'n/d');
        output.textContent = JSON.stringify(body, null, 2);
      } else {
        feedback.textContent = 'Monitor: HTTP ' + response.status;
      }
    } catch (error) {
      feedback.textContent = 'Monitor non raggiungibile: ' + String(error);
    }
  }
  refreshStatus();
  setInterval(refreshStatus, 30000);
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
    if (url.pathname === "/dashboard" && request.method === "GET") {
      return new Response(dashboardHtml(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (url.pathname === "/dashboard-browser" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) return json({ error: "unauthorized" }, 401);
      const source = (url.searchParams.get("source") || "garmin_records").trim();
      const category = (url.searchParams.get("category") || "").trim();
      const date = (url.searchParams.get("date") || "").trim();
      const search = (url.searchParams.get("search") || "").trim().slice(0, 100);
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
      const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
      const sources = {
        garmin_records: { from: "garmin_records", id: "dataset || ':' || record_key || ':' || COALESCE(record_date, '') || ':' || retrieved_at", date: "record_date", category: "dataset", label: "record_key", raw: "raw_json", retrieved: "retrieved_at", extra: "source_endpoint" },
        daily_records: { from: "daily_records", id: "dataset || ':' || record_date", date: "record_date", category: "dataset", label: "dataset", raw: "raw_json", retrieved: "updated_at", extra: "'daily_records'" },
        activities: { from: "activities", id: "activity_id", date: "start_time_local", category: "activity_type", label: "activity_name", raw: "raw_json", retrieved: "last_seen_at", extra: "activity_id" },
        activity_details: { from: "activity_details", id: "activity_id", date: "''", category: "source_endpoint", label: "activity_id", raw: "raw_json", retrieved: "retrieved_at", extra: "source_endpoint" },
        sync_runs: { from: "sync_runs", id: "CAST(id AS TEXT)", date: "started_at", category: "sync_type", label: "CAST(id AS TEXT)", raw: "json_object('id',id,'sync_type',sync_type,'status',status,'activities_seen',activities_seen,'daily_records_seen',daily_records_seen,'message',message)", retrieved: "finished_at", extra: "status" },
        sync_state: { from: "sync_state", id: "state_key", date: "updated_at", category: "'sync_state'", label: "state_key", raw: "json_object('state_key',state_key,'state_value',state_value,'updated_at',updated_at)", retrieved: "updated_at", extra: "state_key" },
        sync_locks: { from: "sync_locks", id: "lock_key", date: "updated_at", category: "'sync_locks'", label: "lock_key", raw: "json_object('lock_key',lock_key,'owner',owner,'lease_until',lease_until,'updated_at',updated_at)", retrieved: "updated_at", extra: "lock_key" }
      };
      const spec = sources[source];
      if (!spec) return json({ error: "Sorgente non supportata." }, 400);
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Data non valida." }, 400);
      try {
        const clauses = [], binds = [];
        if (category) { clauses.push(spec.category + "=?"); binds.push(category); }
        if (date) { clauses.push("substr(" + spec.date + ",1,10)=?"); binds.push(date); }
        if (search) { clauses.push("(" + spec.label + " LIKE ? OR " + spec.id + " LIKE ? OR " + spec.raw + " LIKE ?)"); binds.push("%"+search+"%", "%"+search+"%", "%"+search+"%"); }
        const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
        const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM " + spec.from + where).bind(...binds).first();
        const sql = "SELECT " + spec.id + " AS row_id, " + spec.date + " AS record_date, " + spec.category + " AS category, " + spec.label + " AS label, " + spec.raw + " AS raw_json, " + spec.retrieved + " AS retrieved_at, " + spec.extra + " AS source_info FROM " + spec.from + where + " ORDER BY " + spec.date + " DESC LIMIT ? OFFSET ?";
        const result = await env.DB.prepare(sql).bind(...binds, limit, offset).all();
        const categories = await env.DB.prepare("SELECT DISTINCT " + spec.category + " AS value FROM " + spec.from + " WHERE " + spec.category + " IS NOT NULL AND " + spec.category + " != '' ORDER BY value LIMIT 500").all();
        return json({ ok: true, source, total: Number(count?.total || 0), limit, offset, hasMore: offset + (result.results || []).length < Number(count?.total || 0), rows: result.results || [], categories: (categories.results || []).map(x => x.value) });
      } catch (error) { return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500); }
    }
    if (url.pathname === "/analytics-capabilities" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) return json({ error: "unauthorized" }, 401);
      try {
        const sample = '{"date":"2026-11-24","metrics":{"restingHeartRate":52,"steps":8432},"items":[{"value":1},{"value":2}]}';
        const scalar = await env.DB.prepare(
          "SELECT sqlite_version() AS sqlite_version, json_valid(?) AS json_valid, json_extract(?, '$.metrics.restingHeartRate') AS json_extract_value"
        ).bind(sample, sample).first();
        const tree = await env.DB.prepare(
          "SELECT COUNT(*) AS json_tree_nodes FROM json_tree(?)"
        ).bind(sample).first();
        const each = await env.DB.prepare(
          "SELECT COUNT(*) AS json_each_items FROM json_each(?, '$.items')"
        ).bind(sample).first();
        return json({
          ok: true,
          readOnly: true,
          database: "storico_garmin",
          sqlite_version: scalar?.sqlite_version || null,
          json_functions: {
            json_valid: Number(scalar?.json_valid) === 1,
            json_extract: scalar?.json_extract_value ?? null,
            json_tree: Number(tree?.json_tree_nodes || 0),
            json_each: Number(each?.json_each_items || 0)
          },
          note: "Test eseguito su JSON campione: nessuna tabella o riga D1 è stata modificata."
        });
      } catch (error) {
        return json({ ok: false, readOnly: true, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
        if (url.pathname === "/analytics-view-status" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) return json({ error: "unauthorized" }, 401);
      try {
        const expectedViews = ["vw_activities","vw_daily_records","vw_garmin_records","vw_activity_details","vw_json_scalar_fields","vw_json_field_catalog"];
        const placeholders = expectedViews.map(() => "?").join(",");
        const found = await env.DB.prepare(
          "SELECT name, type FROM sqlite_master WHERE type='view' AND name IN (" + placeholders + ") ORDER BY name"
        ).bind(...expectedViews).all();
        const present = (found.results || []).map(row => row.name);
        const missing = expectedViews.filter(name => !present.includes(name));
        return json({ ok: true, readOnly: true, database: "storico_garmin",
          installed: missing.length === 0, expected: expectedViews.length, present, missing,
          note: "Controllo sqlite_master in sola lettura: nessuna vista, tabella o riga è stata modificata." });
      } catch (error) {
        return json({ ok: false, readOnly: true, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
if (url.pathname === "/dashboard-schema" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) return json({ error: "unauthorized" }, 401);
      try {
        const [garmin, daily] = await Promise.all([
          env.DB.prepare(`
            SELECT g.dataset AS dataset, jt.fullkey AS field_path, jt.type AS value_type,
              COUNT(*) AS occurrences, COUNT(DISTINCT g.record_key) AS records_with_field,
              MIN(CASE WHEN jt.atom IS NOT NULL THEN substr(CAST(jt.atom AS TEXT),1,120) END) AS example
            FROM garmin_records g, json_tree(g.raw_json) jt
            WHERE json_valid(g.raw_json) AND jt.type NOT IN ('object','array')
            GROUP BY g.dataset, jt.fullkey, jt.type
            ORDER BY g.dataset, jt.fullkey, jt.type
          `).all(),
          env.DB.prepare(`
            SELECT d.dataset AS dataset, jt.fullkey AS field_path, jt.type AS value_type,
              COUNT(*) AS occurrences, COUNT(DISTINCT d.record_date) AS records_with_field,
              MIN(CASE WHEN jt.atom IS NOT NULL THEN substr(CAST(jt.atom AS TEXT),1,120) END) AS example
            FROM daily_records d, json_tree(d.raw_json) jt
            WHERE json_valid(d.raw_json) AND jt.type NOT IN ('object','array')
            GROUP BY d.dataset, jt.fullkey, jt.type
            ORDER BY d.dataset, jt.fullkey, jt.type
          `).all()
        ]);
        return json({ ok: true, generatedAt: new Date().toISOString(),
          garmin_records: garmin.results || [], daily_records: daily.results || [],
          totals: { garmin_fields: (garmin.results || []).length, daily_fields: (daily.results || []).length } });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
    if (url.pathname === "/dashboard-field-values" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) return json({ error: "unauthorized" }, 401);
      const source = (url.searchParams.get("source") || "").trim();
      const dataset = (url.searchParams.get("dataset") || "").trim();
      const fieldPath = (url.searchParams.get("field_path") || "").trim();
      const from = (url.searchParams.get("from") || "").trim();
      const to = (url.searchParams.get("to") || "").trim();
      const requestedLimit = Number(url.searchParams.get("limit") || 1000);
      const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? Math.trunc(requestedLimit) : 1000, 1), 5000);
      if (!["daily_records","garmin_records"].includes(source)) return json({error:"source non valido"},400);
      if (!dataset || dataset.length > 100 || !fieldPath || fieldPath.length > 500) return json({error:"dataset e field_path obbligatori"},400);
      if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) || (from && to && from > to)) return json({error:"intervallo date non valido"},400);
      try {
        const sql = "SELECT r.dataset, r.record_date, r.retrieved_at, jt.fullkey AS field_path, jt.type AS value_type, jt.atom AS value FROM " + source + " r, json_tree(r.raw_json) jt WHERE json_valid(r.raw_json) AND r.dataset=? AND jt.fullkey=? " + (from ? "AND r.record_date>=? " : "") + (to ? "AND r.record_date<=? " : "") + "ORDER BY r.record_date ASC, r.retrieved_at ASC LIMIT ?";
        const params = [dataset, fieldPath];
        if (from) params.push(from);
        if (to) params.push(to);
        params.push(limit);
        const result = await env.DB.prepare(sql).bind(...params).all();
        return json({ok:true,readOnly:true,source,dataset,field_path:fieldPath,from:from||null,to:to||null,count:(result.results||[]).length,rows:result.results||[],note:"Valori raw in sola lettura; normalizzazione/unità non dedotte."});
      } catch(error) { return json({ok:false,readOnly:true,error:String(error?.message||error).slice(0,300)},500); }
    }
    if (url.pathname === "/dashboard-metrics" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) return json({ error: "unauthorized" }, 401);
      const source = (url.searchParams.get("source") || "daily_records").trim();
      const dataset = (url.searchParams.get("dataset") || "").trim();
      const fieldPath = (url.searchParams.get("field_path") || "").trim();
      const from = (url.searchParams.get("from") || "").trim();
      const to = (url.searchParams.get("to") || "").trim();
      const aggregation = (url.searchParams.get("aggregation") || "avg").trim();
      const requestedLimit = Number(url.searchParams.get("limit") || 366);
      const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? Math.trunc(requestedLimit) : 366, 1), 2000);
      if (!["daily_records","garmin_records"].includes(source)) return json({error:"source non valido"},400);
      if (!dataset || dataset.length > 100 || !fieldPath || fieldPath.length > 500) return json({error:"dataset e field_path obbligatori"},400);
      if (!["avg","min","max","sum"].includes(aggregation)) return json({error:"aggregazione non valida"},400);
      if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) || (from && to && from > to)) return json({error:"intervallo date non valido"},400);
      try {
        const aggSql = aggregation.toUpperCase() + "(CAST(jt.atom AS REAL))";
        const sql = "SELECT r.record_date AS date, " + aggSql + " AS value, COUNT(*) AS samples FROM " + source + " r, json_tree(r.raw_json) jt WHERE json_valid(r.raw_json) AND r.dataset=? AND r.record_date IS NOT NULL AND jt.fullkey=? AND jt.type IN ('integer','real') " + (from ? "AND r.record_date>=? " : "") + (to ? "AND r.record_date<=? " : "") + "GROUP BY r.record_date ORDER BY r.record_date ASC LIMIT ?";
        const params = [dataset,fieldPath];if(from)params.push(from);if(to)params.push(to);params.push(limit);
        const result=await env.DB.prepare(sql).bind(...params).all();
        const rows=(result.results||[]).map(row=>({date:row.date,value:row.value,samples:Number(row.samples||0)}));
        return json({ok:true,readOnly:true,metric:dataset,field_path:fieldPath,source,aggregation,from:from||null,to:to||null,unit:null,count:rows.length,points:rows,coverage:{numeric_points:rows.length,samples:rows.reduce((n,x)=>n+x.samples,0)},note:"Aggregazione numerica generica; unità e significato devono essere verificati."});
      }catch(error){return json({ok:false,readOnly:true,error:String(error?.message||error).slice(0,300)},500);}
    }
    if (url.pathname === "/dashboard-record-dates" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) return json({ error: "unauthorized" }, 401);
      const dataset = (url.searchParams.get("dataset") || "").trim();
      if (!dataset || dataset.length > 100) return json({ error: "Seleziona un dataset valido." }, 400);
      try {
        const result = await env.DB.prepare("SELECT record_date, COUNT(*) AS records, MAX(retrieved_at) AS last_retrieved FROM garmin_records WHERE dataset=? AND record_date IS NOT NULL GROUP BY record_date ORDER BY record_date DESC LIMIT 1000").bind(dataset).all();
        return json({ ok: true, dataset, dates: result.results || [] });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
    if (url.pathname === "/dashboard-records" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) return json({ error: "unauthorized" }, 401);
      const dataset = (url.searchParams.get("dataset") || "").trim();
      const date = (url.searchParams.get("date") || "").trim();
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 200);
      if (!dataset || dataset.length > 100) return json({ error: "Seleziona un dataset valido." }, 400);
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Data non valida. Usa YYYY-MM-DD." }, 400);
      try {
        const sql = "SELECT dataset, record_key, record_date, source_endpoint, raw_json, retrieved_at FROM garmin_records WHERE dataset=? " + (date ? "AND record_date=? " : "") + "ORDER BY record_date DESC, retrieved_at DESC LIMIT ?";
        const stmt = env.DB.prepare(sql);
        const result = date ? await stmt.bind(dataset, date, limit).all() : await stmt.bind(dataset, limit).all();
        return json({ ok: true, dataset, date: date || null, count: (result.results || []).length, rows: result.results || [] });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
    if (url.pathname === "/dashboard-activity" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) return json({ error: "unauthorized" }, 401);
      const activityId = (url.searchParams.get("activityId") || "").trim();
      if (!activityId || activityId.length > 100) return json({ error: "ID attività non valido." }, 400);
      try {
        const [activity, detail, workouts] = await Promise.all([
          env.DB.prepare("SELECT * FROM activities WHERE activity_id=?").bind(activityId).first(),
          env.DB.prepare("SELECT source_endpoint, raw_json, retrieved_at FROM activity_details WHERE activity_id=?").bind(activityId).first(),
          env.DB.prepare("SELECT dataset, record_date, source_endpoint, raw_json, retrieved_at FROM garmin_records WHERE dataset='activity_workouts' AND record_key=? ORDER BY retrieved_at DESC").bind(activityId).all()
        ]);
        if (!activity) return json({ ok: false, error: "Attività non trovata." }, 404);
        return json({ ok: true, activity, detail: detail || null, workouts: workouts.results || [] });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
    if (url.pathname === "/dashboard-record" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) return json({ error: "unauthorized" }, 401);
      const date = url.searchParams.get("date") || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Data non valida. Usa YYYY-MM-DD." }, 400);
      try {
        const [steps, daily] = await Promise.all([
          env.DB.prepare("SELECT dataset, record_date, raw_json, retrieved_at FROM garmin_records WHERE dataset='steps' AND record_date=? ORDER BY retrieved_at DESC").bind(date).all(),
          env.DB.prepare("SELECT dataset, record_date, raw_json, updated_at FROM daily_records WHERE dataset='steps' AND record_date=?").bind(date).all()
        ]);
        return json({ ok: true, date, steps: steps.results || [], daily: daily.results || [] });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
    if (url.pathname === "/dashboard-audit" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) return json({ error: "unauthorized" }, 401);
      try {
        const runs = await env.DB.prepare("SELECT id, started_at, finished_at, status, sync_type, activities_seen, daily_records_seen, message FROM sync_runs ORDER BY id DESC LIMIT 30").all();
        const audit = [];
        for (const run of (runs.results || [])) {
          const datasets = await env.DB.prepare(`
            SELECT dataset, COUNT(*) AS records_written,
              SUM(CASE WHEN raw_json='[]' OR raw_json='{}' THEN 1 ELSE 0 END) AS empty_records,
              MIN(record_date) AS first_date, MAX(record_date) AS last_date
            FROM garmin_records
            WHERE retrieved_at >= datetime(?) AND retrieved_at <= datetime(?)
            GROUP BY dataset ORDER BY dataset
          `).bind(run.started_at, run.finished_at || run.started_at).all();
          audit.push({ ...run, datasets: datasets.results || [] });
        }
        return json({ ok: true, runs: audit });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
    }
    if (url.pathname === "/audit" && request.method === "GET") {
      const page = `<!doctype html><html lang="it"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111827"><title>Training Center · Audit</title><body style="margin:0;background:#0b1220;color:#e5e7eb;font:16px system-ui"><main style="max-width:760px;margin:auto;padding:20px"><h2>Training Center · Audit database</h2><p style="color:#9ca3af">Controllo in sola lettura di storico_garmin. Non modifica dati, sincronizzazione o backfill.</p><label for="token">SYNC_BEARER_TOKEN</label><input id="token" type="password" autocomplete="off" placeholder="Inserisci il token" style="box-sizing:border-box;width:100%;padding:14px;margin:8px 0;background:#111827;color:white;border:1px solid #475569;border-radius:9px"><label style="display:block;color:#cbd5e1;font-size:14px"><input id="remember" type="checkbox"> Ricorda su questo dispositivo</label><button id="run" style="width:100%;padding:15px;margin:14px 0;background:#2563eb;color:white;border:0;border-radius:9px;font-weight:700">Esegui audit</button><p id="status" style="color:#93c5fd">Pronto. L'analisi interroga D1 senza scrivere.</p><section id="results"></section><script>
(function(){
const $=id=>document.getElementById(id), token=$('token'), esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));
try{token.value=localStorage.getItem('training_center_sync_token')||'';if(token.value)$('remember').checked=true}catch(e){}
$('run').addEventListener('click',async()=>{
 const t=token.value.trim();if(!t){$('status').textContent='Inserisci il token.';return}
 try{if($('remember').checked)localStorage.setItem('training_center_sync_token',t);else localStorage.removeItem('training_center_sync_token')}catch(e){}
 $('run').disabled=true;$('status').textContent='Analisi in corso…';$('results').innerHTML='';
 try{
  const r=await fetch('/audit-data',{headers:{Authorization:'Bearer '+t},cache:'no-store'}),d=await r.json();
  if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
  const card=(label,value,detail)=>'<article style="background:#111827;border:1px solid #334155;border-radius:10px;padding:14px;margin:9px 0"><div style="color:#94a3b8;font-size:13px">'+esc(label)+'</div><strong style="font-size:24px">'+esc(value??'—')+'</strong><div style="color:#94a3b8;font-size:13px">'+esc(detail||'')+'</div></article>';
  const section=(title,body)=>'<h3 style="margin:22px 0 8px">'+title+'</h3>'+body;
  let html='<p style="color:#94a3b8">Generato: '+esc(new Date(d.generatedAt).toLocaleString('it-IT'))+' · DB: '+esc(d.database)</p>';
  html+=section('Volumi',Object.entries(d.counts).map(([k,v])=>card(k,Number(v).toLocaleString('it-IT'),'record presenti')).join(''));
  html+=section('Integrità',d.checks.map(x=>card(x.label,Number(x.value).toLocaleString('it-IT'),x.detail+' · '+(x.status==='ok'?'OK':x.status==='warning'?'Da verificare':'Informativo'))).join(''));
  html+=section('Dataset Garmin',d.datasets.map(x=>card(x.dataset,Number(x.records).toLocaleString('it-IT'),(x.first_date||'data iniziale n/d')+' → '+(x.last_date||'data finale n/d')+' · vuoti: '+x.empty_records)).join(''));
  html+=section('Ultime sincronizzazioni',d.recentRuns.map(x=>card('#'+esc(x.id)+' · '+esc(x.sync_type),esc(x.status),esc(x.started_at+' · attività '+x.activities_seen+' · record giornalieri '+x.daily_records_seen+' · '+(x.message||'')))).join('')||'<p>Nessuna esecuzione.</p>');
  if(d.warnings.length)html+=section('Avvisi',d.warnings.map(x=>card('Query non disponibile',x,'Tabella o colonna non presente')).join(''));
  $('results').innerHTML=html;$('status').textContent='Audit completato. Modalità esclusivamente lettura.';
 }catch(e){$('status').textContent='Audit non riuscito: '+e.message}
 finally{$('run').disabled=false}
});
})();
</script></main></body></html>`;
      return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (url.pathname === "/audit-data" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) return json({ error: "unauthorized" }, 401);
      if (!env.DB) return json({ ok: false, error: "D1 binding DB is missing" }, 503);
      const warnings = [];
      const safe = async (label, sql) => {
        try { return await env.DB.prepare(sql).all(); }
        catch (error) { warnings.push(label + ": " + String(error?.message || error).slice(0, 180)); return { results: [] }; }
      };
      try {
        const [countsResult, datasetsResult, activityQuality, garminQuality, dailyQuality, orphanDetails, recentRuns] = await Promise.all([
          safe("Conteggi", "SELECT 'activities' AS table_name, COUNT(*) AS records FROM activities UNION ALL SELECT 'activity_details', COUNT(*) FROM activity_details UNION ALL SELECT 'daily_records', COUNT(*) FROM daily_records UNION ALL SELECT 'garmin_records', COUNT(*) FROM garmin_records UNION ALL SELECT 'sync_runs', COUNT(*) FROM sync_runs"),
          safe("Dataset Garmin", "SELECT dataset, COUNT(*) AS records, MIN(record_date) AS first_date, MAX(record_date) AS last_date, SUM(CASE WHEN raw_json IS NULL OR TRIM(raw_json)='' OR raw_json IN ('[]','{}','null') THEN 1 ELSE 0 END) AS empty_records FROM garmin_records GROUP BY dataset ORDER BY dataset"),
          safe("Qualità attività", "SELECT COUNT(*) AS total, SUM(CASE WHEN activity_id IS NULL OR activity_id='' THEN 1 ELSE 0 END) AS missing_id, SUM(CASE WHEN start_time_local IS NULL OR start_time_local='' THEN 1 ELSE 0 END) AS missing_date, SUM(CASE WHEN activity_type IS NULL OR activity_type='' THEN 1 ELSE 0 END) AS missing_type, SUM(CASE WHEN json_valid(raw_json)=0 THEN 1 ELSE 0 END) AS invalid_json FROM activities"),
          safe("Qualità Garmin", "SELECT COUNT(*) AS total, SUM(CASE WHEN raw_json IS NULL OR TRIM(raw_json)='' OR raw_json IN ('[]','{}','null') THEN 1 ELSE 0 END) AS empty_payloads, SUM(CASE WHEN json_valid(raw_json)=0 THEN 1 ELSE 0 END) AS invalid_json, SUM(CASE WHEN record_date IS NULL OR record_date='' THEN 1 ELSE 0 END) AS missing_date FROM garmin_records"),
          safe("Qualità giornaliera", "SELECT COUNT(*) AS total, COUNT(DISTINCT record_date) AS distinct_dates, MIN(record_date) AS first_date, MAX(record_date) AS last_date, SUM(CASE WHEN json_valid(raw_json)=0 THEN 1 ELSE 0 END) AS invalid_json, SUM(CASE WHEN raw_json IS NULL OR TRIM(raw_json)='' OR raw_json IN ('[]','{}','null') THEN 1 ELSE 0 END) AS empty_payloads FROM daily_records"),
          safe("Dettagli orfani", "SELECT COUNT(*) AS total FROM activity_details d LEFT JOIN activities a ON a.activity_id=d.activity_id WHERE a.activity_id IS NULL"),
          safe("Ultime sincronizzazioni", "SELECT id, started_at, finished_at, status, sync_type, activities_seen, daily_records_seen, message FROM sync_runs ORDER BY id DESC LIMIT 10")
        ]);
        const countMap = Object.fromEntries((countsResult.results || []).map(x => [x.table_name, Number(x.records || 0)]));
        const aq = activityQuality.results?.[0] || {}, gq = garminQuality.results?.[0] || {}, dq = dailyQuality.results?.[0] || {};
        const orphan = Number(orphanDetails.results?.[0]?.total || 0);
        const checks = [
          { label: "Attività senza data", value: Number(aq.missing_date || 0), detail: "Campo data non valorizzato", status: Number(aq.missing_date || 0) ? "warning" : "ok" },
          { label: "Attività senza tipo", value: Number(aq.missing_type || 0), detail: "Campo tipo non valorizzato", status: Number(aq.missing_type || 0) ? "warning" : "ok" },
          { label: "JSON attività non validi", value: Number(aq.invalid_json || 0), detail: "Payload non interpretabile come JSON", status: Number(aq.invalid_json || 0) ? "warning" : "ok" },
          { label: "Record Garmin vuoti", value: Number(gq.empty_payloads || 0), detail: "Null, array/oggetto vuoto o stringa vuota; non equivale automaticamente a errore", status: Number(gq.empty_payloads || 0) ? "warning" : "ok" },
          { label: "JSON Garmin non validi", value: Number(gq.invalid_json || 0), detail: "Payload non interpretabile come JSON", status: Number(gq.invalid_json || 0) ? "warning" : "ok" },
          { label: "Record Garmin senza data", value: Number(gq.missing_date || 0), detail: "Record senza record_date", status: Number(gq.missing_date || 0) ? "warning" : "ok" },
          { label: "Dettagli attività senza attività madre", value: orphan, detail: "activity_details senza corrispondenza in activities", status: orphan ? "warning" : "ok" },
          { label: "JSON daily_records non validi", value: Number(dq.invalid_json || 0), detail: "Payload giornalieri non interpretabili", status: Number(dq.invalid_json || 0) ? "warning" : "ok" },
          { label: "Daily records vuoti", value: Number(dq.empty_payloads || 0), detail: "Da interpretare in base al dataset e al periodo", status: Number(dq.empty_payloads || 0) ? "warning" : "ok" }
        ];
        return json({ ok: true, generatedAt: new Date().toISOString(), database: "storico_garmin", counts: countMap, checks, datasets: datasetsResult.results || [], recentRuns: recentRuns.results || [], coverage: { dailyRecords: { total: Number(dq.total || 0), distinctDates: Number(dq.distinct_dates || 0), firstDate: dq.first_date || null, lastDate: dq.last_date || null } }, warnings });
      } catch (error) { return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500); }
    }
    if (url.pathname === "/dashboard-data" && request.method === "GET") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) return json({ error: "unauthorized" }, 401);
      try {
        await ensureCoreSchema(env.DB);
        const [counts, datasets, activities, daily, steps, activityQuality, recordQuality] = await Promise.all([
          env.DB.prepare("SELECT (SELECT COUNT(*) FROM activities) AS activities, (SELECT COUNT(*) FROM activity_details) AS activity_details, (SELECT COUNT(*) FROM daily_records) AS daily_records, (SELECT COUNT(*) FROM garmin_records) AS garmin_records, (SELECT COUNT(*) FROM sync_runs) AS sync_runs").first(),
          env.DB.prepare("SELECT dataset, COUNT(*) AS records, MIN(record_date) AS first_date, MAX(record_date) AS last_date, SUM(CASE WHEN raw_json='[]' OR raw_json='{}' THEN 1 ELSE 0 END) AS empty_records FROM garmin_records GROUP BY dataset ORDER BY dataset").all(),
          env.DB.prepare("SELECT activity_id, start_time_local, activity_type, activity_name, distance_m, duration_s, calories, average_hr, max_hr FROM activities ORDER BY start_time_local DESC LIMIT 500").all(),
          env.DB.prepare("SELECT record_date, dataset, updated_at FROM daily_records ORDER BY record_date DESC, dataset LIMIT 100").all(),
          env.DB.prepare("SELECT record_date, raw_json FROM garmin_records WHERE dataset='steps' ORDER BY record_date DESC LIMIT 500").all(),
          env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN start_time_local IS NULL OR start_time_local='' THEN 1 ELSE 0 END) AS missing_date, SUM(CASE WHEN activity_type IS NULL OR activity_type='' THEN 1 ELSE 0 END) AS missing_type, SUM(CASE WHEN distance_m IS NULL THEN 1 ELSE 0 END) AS missing_distance, SUM(CASE WHEN duration_s IS NULL THEN 1 ELSE 0 END) AS missing_duration, SUM(CASE WHEN average_hr IS NULL THEN 1 ELSE 0 END) AS missing_average_hr, SUM(CASE WHEN max_hr IS NULL THEN 1 ELSE 0 END) AS missing_max_hr, SUM(CASE WHEN json_valid(raw_json)=0 THEN 1 ELSE 0 END) AS invalid_json FROM activities").first(),
          env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN raw_json IS NULL OR TRIM(raw_json)='' OR raw_json IN ('[]','{}','null') THEN 1 ELSE 0 END) AS empty_payloads, SUM(CASE WHEN json_valid(raw_json)=0 THEN 1 ELSE 0 END) AS invalid_json FROM garmin_records").first()
        ]);
        return json({ ok: true, generatedAt: new Date().toISOString(), counts: counts || {}, datasets: datasets.results || [], activities: activities.results || [], recentDailyRecords: daily.results || [], steps: steps.results || [], quality: { activities: activityQuality || {}, garminRecords: recordQuality || {} } });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
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
      const countErrors = {};
      for (const table of ["activities", "activity_details", "daily_records", "garmin_records", "sync_runs"]) {
        try {
          const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM " + table).first();
          counts[table] = Number(row?.count || 0);
        } catch (error) {
          counts[table] = null;
          countErrors[table] = String(error?.message || error).slice(0, 250);
        }
      }
      const locks = await env.DB.prepare(
        "SELECT lock_key, owner, lease_until, updated_at FROM sync_locks WHERE lock_key IN ('garmin_backfill','garmin_daily') ORDER BY lock_key"
      ).all();
      return json({
        ok: true,
        counts,
        countErrors,
        database: { bindingPresent: Boolean(env.DB), countQueriesSuccessful: Object.keys(countErrors).length === 0 },
        agent: { backfillCron: "*/3 * * * *", dailyCron: "12:00 Europe/Rome", locks: locks.results || [] },
        mode: nextDate > today ? "historical_backfill_complete" : "historical_backfill",
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
    if (url.pathname === "/excel-export" && request.method === "GET") {
      // Dedicated read-only endpoint for the local Training Center Excel workbook.
      // Configure EXCEL_READ_TOKEN as a separate Cloudflare Worker secret.
      const expected = env.EXCEL_READ_TOKEN;
      if (!expected || request.headers.get("Authorization") !== "Bearer " + expected) {
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
      try {
        const result = await env.DB.prepare(allowed[dataset]).bind(limit + 1, offset).all();
        const rows = result.results || [];
        const hasMore = rows.length > limit;
        const page = hasMore ? rows.slice(0, limit) : rows;
        return json({ ok: true, dataset, count: page.length, limit, offset,
          nextOffset: hasMore ? offset + limit : null, rows: page });
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error).slice(0, 300) }, 500);
      }
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
      const result = await withSyncLock(env.DB, 'garmin_backfill', () => runBackfill(env));
      return json(result, result.busy ? 409 : result.ok ? 200 : 502);
    }
    if (url.pathname === "/sync" && request.method === "POST") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) {
        return json({ error: "unauthorized" }, 401);
      }
      const result = await withSyncLock(env.DB, 'garmin_daily', () => runSync(env, null, null, { syncType: "manual" }));
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

async function acquireSyncLock(db, lockKey, owner) {
  await ensureSyncLockSchema(db);
  const result = await db.prepare(`
    INSERT INTO sync_locks (lock_key, owner, lease_until, updated_at)
    VALUES (?, ?, datetime('now', '+20 minutes'), CURRENT_TIMESTAMP)
    ON CONFLICT(lock_key) DO UPDATE SET
      owner=excluded.owner,
      lease_until=excluded.lease_until,
      updated_at=CURRENT_TIMESTAMP
    WHERE sync_locks.lease_until < CURRENT_TIMESTAMP
  `).bind(lockKey, owner).run();
  return Number(result.meta?.changes || 0) > 0;
}

async function releaseSyncLock(db, lockKey, owner) {
  await db.prepare("DELETE FROM sync_locks WHERE lock_key=? AND owner=?").bind(lockKey, owner).run();
}

async function withSyncLock(db, lockKey, task) {
  if (!db) return { ok: false, error: "D1 binding DB is missing" };
  const owner = crypto.randomUUID();
  if (!await acquireSyncLock(db, lockKey, owner)) return { ok: false, busy: true, error: `A ${lockKey} run is already running. Check /status shortly.` };
  try { return await task(); }
  finally { await releaseSyncLock(db, lockKey, owner).catch(error => console.error(`Could not release ${lockKey} lock:`, error)); }
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

async function garminGet(path, token, options = {}) {
  const response = await fetch(GARMIN_BASE + path, {
    headers: { Authorization: `Bearer ${token}`, Accept: "*/*" }
  });
  if (response.status === 204) return null;
  // A 404 is an empty result only for explicitly optional Garmin datasets.
  // The main activity-search endpoint must fail the block instead of silently
  // advancing the historical cursor when its route is unavailable.
  if (response.status === 404 && options.allowNotFound === true) return null;
  if (!response.ok) throw new Error(`Garmin GET failed: HTTP ${response.status} for ${path.split("?")[0]}`);
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function hasPayload(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const collectionKeys = ["activities", "activityList", "activitySummaries", "activitySummariesDTO", "results", "dailySummaries", "summaries", "data", "items"];
    const collections = collectionKeys.filter(key => Array.isArray(value[key]));
    if (collections.length) return collections.some(key => value[key].length > 0);
    return Object.keys(value).length > 0;
  }
  return true;
}

function rowsFrom(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    for (const key of ["activities", "activityList", "activitySummaries", "activitySummariesDTO", "results", "dailySummaries", "summaries", "data", "items"]) {
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
    if (!await acquireSyncLock(env.DB, 'garmin_backfill', owner)) {
      console.log("Garmin backfill skipped: another backfill run holds its D1 lock.");
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
    // This scheduled agent is dedicated to historical recovery only.
    // Daily/current-data refresh is handled by the separate existing Garmin integration.
    const backfill = await runBackfill(env, token);
    return { ok: Boolean(backfill.ok), mode: "historical_backfill_only", backfill };
  } catch (error) {
    console.error("Scheduled Garmin sync failed:", error);
    return { ok: false, mode: "scheduled_sync", error: String(error?.message || error).slice(0, 500) };
  } finally {
    if (env.DB) await releaseSyncLock(env.DB, 'garmin_backfill', owner).catch(error => console.error("Could not release Garmin backfill lock:", error));
  }
}

async function runScheduledDailySync(event, env) {
  const romeHour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    hourCycle: "h23"
  }).format(new Date()));
  // Cloudflare Cron uses UTC. One combined trigger at 10:00 and 11:00 UTC
  // plus this Rome-time guard keeps one daily run at noon across CET and CEST.
  if (romeHour !== 12) {
    console.log("Daily Garmin sync skipped: this UTC trigger is outside 12:00 Europe/Rome.", { cron: event.cron, romeHour });
    return { ok: true, skipped: true, reason: "not_noon_in_europe_rome" };
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const todayRome = `${values.year}-${values.month}-${values.day}`;
  const yesterday = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) - 1))
    .toISOString().slice(0, 10);

  const owner = crypto.randomUUID();
  try {
    if (!env.DB) throw new Error("D1 binding DB is missing");
    if (!await acquireSyncLock(env.DB, 'garmin_daily', owner)) {
      console.log("Daily Garmin sync skipped: another daily run holds its D1 lock.");
      return { ok: true, skipped: true, reason: "sync_already_running", targetDate: yesterday };
    }
    if (!env.GARMIN_PERSONAL_API_KEY) throw new Error("Worker Secret GARMIN_PERSONAL_API_KEY is missing");
    const token = await getBearerToken(env.GARMIN_PERSONAL_API_KEY);
    const result = await runSync(env, { startDate: yesterday, endDate: yesterday }, token, { refreshDateScoped: true, syncType: "daily" });
    console.log("Daily Garmin previous-day sync completed.", { todayRome, targetDate: yesterday, result });
    return { ...result, mode: "daily_previous_day", targetDate: yesterday, todayRome };
  } catch (error) {
    console.error("Daily Garmin previous-day sync failed:", error);
    return { ok: false, mode: "daily_previous_day", targetDate: yesterday, error: String(error?.message || error).slice(0, 500) };
  } finally {
    if (env.DB) await releaseSyncLock(env.DB, 'garmin_daily', owner).catch(error => console.error("Could not release daily Garmin sync lock:", error));
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
    const result = await runSync(env, { startDate, endDate }, tokenOverride, { syncType: "backfill" });
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
    message TEXT,
    sync_type TEXT NOT NULL DEFAULT 'legacy'
  )`).run();
  const runColumns = await db.prepare("PRAGMA table_info(sync_runs)").all();
  if (!(runColumns.results || []).some(column => column.name === "sync_type")) {
    await db.prepare("ALTER TABLE sync_runs ADD COLUMN sync_type TEXT NOT NULL DEFAULT 'legacy'").run();
  }
}

async function runSync(env, rangeOverride = null, tokenOverride = null, options = {}) {
  const startedAt = new Date().toISOString();
  let runId;
  try {
    if (!env.DB) throw new Error("D1 binding DB is missing");
    if (!env.GARMIN_PERSONAL_API_KEY) throw new Error("Worker Secret GARMIN_PERSONAL_API_KEY is missing");
    await ensureCoreSchema(env.DB);
    const insertRun = await env.DB.prepare(
      "INSERT INTO sync_runs (started_at, status, sync_type) VALUES (?, 'running', ?)"
    ).bind(startedAt, options.syncType || "manual").run();
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
    let activitySearchDiagnostic = null;
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
      const activityPayload = await garminGet(
        `/activitylist-service/activities/search/activities?${params}`, token
      );
      const page = rowsFrom(activityPayload);
      if (!activitySearchDiagnostic) {
        activitySearchDiagnostic = {
          responseType: Array.isArray(activityPayload) ? "array" : activityPayload === null ? "null" : typeof activityPayload,
          responseKeys: activityPayload && typeof activityPayload === "object" && !Array.isArray(activityPayload) ? Object.keys(activityPayload).slice(0, 30) : [],
          extractedRows: page.length,
          firstRowKeys: page[0] && typeof page[0] === "object" ? Object.keys(page[0]).slice(0, 40) : [],
          firstActivityId: page[0]?.activityId ?? page[0]?.activity_id ?? page[0]?.id ?? null
        };
      }
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
                const detail = await garminGet(detailPath, token, { allowNotFound: true });
                if (hasPayload(detail)) await saveActivityDetail(env.DB, activityId, detail, detailPath);
              }
              const existingWorkouts = await env.DB.prepare(
                "SELECT 1 AS found FROM garmin_records WHERE dataset='activity_workouts' AND record_key=? LIMIT 1"
              ).bind(String(activityId)).first();
              if (!existingWorkouts) {
                if (existingDetail) activityDetailsProcessed++;
                const workoutsPath = `/activity-service/activity/${encodeURIComponent(String(activityId))}/workouts`;
                const workouts = await garminGet(workoutsPath, token, { allowNotFound: true });
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
          const result = await garminGet(path, token, { allowNotFound: true });
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
        const result = await garminGet(path, token, { allowNotFound: true });
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
          // Historical backfill skips dates already archived. The daily refresh deliberately
          // re-fetches its bounded target date so Garmin updates can replace earlier
          // empty or provisional payloads through saveDaily's existing UPSERT.
          if (existing && !options.refreshDateScoped) continue;
          const path = pathForDate(date);
          const result = await garminGet(path, token, { allowNotFound: true });
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
    return { ok: true, partial: datasetErrors.length > 0, startDate, endDate, activitiesSeen: activityCount, activitySearchDiagnostic, activityDetailsProcessed, pendingActivityDetails, dailyRecordsSeen: dailyCount, datasetErrors };
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


function dashboardHtml() {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Training Center · Archivio Garmin</title>
  <style>
  :root{color-scheme:dark;--bg:#0b1020;--panel:#141c2e;--line:#26344d;--muted:#91a0b8;--text:#edf3ff;--accent:#72a7ff}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px system-ui,-apple-system,Segoe UI,sans-serif}
  main{max-width:1220px;margin:auto;padding:24px 18px 60px}.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  h1{font-size:26px;margin:0}h2{font-size:17px;margin:0}.muted{color:var(--muted)}.panel,.metric{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:15px}
  .auth{display:flex;gap:8px;margin:18px 0}.auth input{flex:1;min-width:180px}input,select,button{background:#0e1729;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:11px;font:inherit}button{cursor:pointer;background:#244b83;border-color:#3769ad}button:disabled{opacity:.5}
  .grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:16px 0}.metric small{display:block;color:var(--muted)}.metric strong{display:block;font-size:25px;margin-top:5px}
  .scroll{overflow:auto;max-height:520px}table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:13px}th,td{text-align:left;padding:10px;border-bottom:1px solid var(--line)}th{color:var(--muted);position:sticky;top:0;background:var(--panel)}
  details.menu{border:1px solid var(--line);border-radius:12px;margin:10px 0;background:var(--panel);overflow:hidden}details.menu>summary{cursor:pointer;list-style:none;padding:15px;font-weight:700;display:flex;justify-content:space-between;align-items:center;gap:10px}details.menu>summary::-webkit-details-marker{display:none}details.menu>summary:after{content:"＋";color:var(--accent);font-size:18px}details.menu[open]>summary:after{content:"−"}details.menu .inside{padding:0 14px 14px}
  details.submenu{border:1px solid var(--line);border-radius:9px;margin:9px 0;background:#101a2d}details.submenu>summary{cursor:pointer;list-style:none;padding:12px;font-weight:650}details.submenu>summary::-webkit-details-marker{display:none}details.submenu>summary:after{content:"＋";float:right;color:var(--accent)}details.submenu[open]>summary:after{content:"−"}details.submenu .inside{padding:0 12px 12px}
  .status{margin:10px 0;color:var(--muted);font-size:13px}.pill{border:1px solid var(--line);border-radius:99px;padding:4px 8px;font-size:12px;color:#b8d1ff;white-space:nowrap}
  .bar{height:7px;background:#26344d;border-radius:8px;overflow:hidden;min-width:80px}.bar i{display:block;height:100%;background:var(--accent)}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;margin-top:10px}.valuecard{background:#0e1729;border:1px solid var(--line);border-radius:9px;padding:10px}.valuecard small{display:block;color:var(--muted);overflow-wrap:anywhere}.valuecard strong{display:block;font-size:20px;margin-top:4px;overflow-wrap:anywhere}.raw{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;background:#0a1221;border:1px solid var(--line);padding:10px;border-radius:8px;font-size:12px;color:#c5d5ef}
  .controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.controls input,.controls select{min-width:180px}.hint{font-size:13px;color:var(--muted);line-height:1.5}
  @media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}main{padding:16px 12px 40px}.metric strong{font-size:21px}.auth{flex-wrap:wrap}.auth input{width:100%}}
  </style></head><body><main>
  <div class="top"><div><h1>Training Center</h1><div class="muted">Archivio Garmin · consultazione diretta di Cloudflare D1</div></div><span class="pill">SOLA LETTURA</span></div>
  <div class="auth"><input id="token" type="password" placeholder="SYNC_BEARER_TOKEN" autocomplete="off"><button id="load">Aggiorna archivio</button></div>
  <div id="status" class="status">Inserisci il token già configurato per consultare D1. Questa dashboard non modifica i dati.</div>
  <section class="grid">
    <div class="metric"><small>Attività</small><strong id="activities">—</strong></div><div class="metric"><small>Dettagli attività</small><strong id="details">—</strong></div><div class="metric"><small>Record Garmin</small><strong id="records">—</strong></div><div class="metric"><small>Record giornalieri</small><strong id="daily">—</strong></div><div class="metric"><small>Esecuzioni import</small><strong id="runs">—</strong></div>
  </section>

  <details class="menu">
    <summary>Panoramica archivio <span class="pill">situazione generale</span></summary>
    <div class="inside"><p class="hint">Conteggi delle tabelle principali e categorie presenti in D1. I numeri indicano record archiviati, non giorni con misurazioni effettive.</p><div class="scroll"><table><thead><tr><th>Categoria</th><th>Record</th><th>Intervallo date</th><th>Record vuoti</th></tr></thead><tbody id="datasets"><tr><td colspan="4">In attesa dei dati</td></tr></tbody></table></div></div>
  </details>

  <details class="menu">
    <summary>Qualità e affidabilità dei dati <span class="pill">controlli automatici</span></summary>
    <div class="inside"><p class="hint">Controlli strutturali sui dati archiviati. Un campo mancante non significa automaticamente errore: alcuni parametri non sono disponibili per ogni attività o dispositivo.</p><div id="qualitySummary" class="cards"><div class="valuecard">In attesa dei controlli</div></div></div>
  </details>

  <details class="menu">
    <summary>Mappa completa dei campi Garmin <span class="pill">struttura JSON</span></summary>
    <div class="inside">
      <p class="hint">Analizza i JSON archiviati e mostra tutti i campi realmente presenti, il tipo di dato, quante volte compare e un esempio. Solo lettura.</p>
      <div class="controls"><button id="schemaLoad" type="button">Analizza tutti i campi</button><button id="analyticsCheck" type="button">Verifica funzioni JSON D1</button></div>
      <div id="schemaStatus" class="status">Mappa non ancora generata.</div>
      <div id="analyticsCheckStatus" class="status">Compatibilità SQL non ancora verificata.</div>
      <div class="controls"><button id="analyticsViewsCheck" type="button">Verifica viste analitiche</button></div>
      <div id="analyticsViewsStatus" class="status">Installazione delle viste non ancora verificata.</div>
      <div id="schemaResults"></div>
    </div>
  </details>

  <details class="menu">
    <summary>Esplora tutto il database D1 <span class="pill">navigazione completa</span></summary>
    <div class="inside">
      <p class="hint">Naviga tra tutte le tabelle, filtra per categoria, data o testo, apri qualsiasi riga e consulta i campi e il JSON originale. Usa Avanti/Indietro per scorrere l'intero archivio.</p>
      <div class="controls"><select id="browserSource"><option value="garmin_records">Garmin records</option><option value="daily_records">Daily records</option><option value="activities">Attività</option><option value="activity_details">Dettagli attività</option><option value="sync_runs">Esecuzioni sync</option><option value="sync_state">Stato backfill</option><option value="sync_locks">Lock sincronizzazione</option></select><select id="browserCategory"><option value="">Tutte le categorie</option></select><input id="browserDate" type="date"><input id="browserSearch" placeholder="Cerca ID, nome o testo"><button id="browserSearchButton">Cerca</button></div>
      <div id="browserStatus" class="status">Seleziona una tabella e premi Cerca.</div><div id="browserRows"></div>
      <div class="controls"><button id="browserPrev" disabled>← Indietro</button><span id="browserPage" class="hint">Pagina 1</span><button id="browserNext" disabled>Avanti →</button></div>
      <div id="browserDetail"></div>
    </div>
  </details>

  <details class="menu">
    <summary>Attività sportive <span id="activityCount" class="pill">—</span></summary>
    <div class="inside"><p class="hint">Ultime attività archiviate. Le distanze sono espresse in chilometri e la durata in ore e minuti.</p><div class="scroll"><table><thead><tr><th>Data</th><th>Attività</th><th>Distanza</th><th>Durata</th><th>Calorie</th><th>FC media</th><th>FC max</th></tr></thead><tbody id="allActivityRows"><tr><td colspan="7">In attesa dei dati</td></tr></tbody></table></div>
      <div class="panel" style="margin-top:12px"><h2>Apri una singola attività</h2><p class="hint">Seleziona un'attività dal menu per consultare riepilogo, dettagli Garmin, workout collegati e JSON originale.</p><div class="controls"><select id="activitySelect"><option value="">Seleziona attività…</option></select><button id="openActivity" type="button">Apri attività</button></div><div id="activityDetailStatus" class="status">Nessuna attività selezionata.</div><div id="activityDetail"></div></div>
    </div>
  </details>

  <details class="menu">
    <summary>Ultimi aggiornamenti giornalieri <span class="pill">daily records</span></summary>
    <div class="inside"><p class="hint">Elenco degli ultimi record giornalieri presenti nella tabella dedicata.</p><div class="scroll"><table><thead><tr><th>Data</th><th>Categoria</th><th>Ultimo aggiornamento</th></tr></thead><tbody id="dailyRows"><tr><td colspan="3">In attesa dei dati</td></tr></tbody></table></div></div>
  </details>

  <details class="menu">
    <summary>Controllo importazioni <span class="pill">solo verifica</span></summary>
    <div class="inside"><p class="hint">Sezione di controllo in sola lettura. Serve a verificare se le esecuzioni sono andate a buon fine e quali record risultano scritti. Non avvia importazioni e non modifica il backfill.</p><button id="auditLoad" type="button">Aggiorna controllo</button><div id="auditStatus" class="status">Controllo non ancora caricato.</div><div id="auditRows"></div></div>
  </details>
  <div class="status">Dashboard in sola lettura: nessuna modifica al Cron, al cursore storico o ai record originali.</div>
  </main><script>
  const $=id=>document.getElementById(id);const token=$('token');
  try{token.value=localStorage.getItem('training_center_sync_token')||''}catch(e){}
  const fmt=n=>Number(n||0).toLocaleString('it-IT'),date=s=>s?String(s).slice(0,10):'—';
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  const dist=n=>n==null?'—':(Number(n)/1000).toFixed(2)+' km';
  const dur=n=>{if(n==null)return'—';const m=Math.round(Number(n)/60);return Math.floor(m/60)+'h '+(m%60)+'m'};
  function flatten(v,path,out){
    if(v===null||v===undefined){out.push({key:path||'valore',value:'Non disponibile',empty:true});return}
    if(Array.isArray(v)){if(!v.length){out.push({key:path||'valore',value:'Array vuoto',empty:true});return}if(v.length>12){out.push({key:path||'elenco',value:'Elenco di '+v.length+' elementi',complex:true});return}v.forEach((x,i)=>flatten(x,path+'['+i+']',out));return}
    if(typeof v==='object'){const entries=Object.entries(v);if(!entries.length){out.push({key:path||'valore',value:'Oggetto vuoto',empty:true});return}entries.forEach(([k,x])=>flatten(x,path?path+'.'+k:k,out));return}
    out.push({key:path||'valore',value:typeof v==='number'?v.toLocaleString('it-IT'):String(v)});
  }
  function prettyRecord(row){
    let obj;try{obj=JSON.parse(row.raw_json||'null')}catch(e){obj=null}
    const fields=[];flatten(obj,'',fields);
    const useful=fields.filter(x=>!x.empty&&!x.complex);
    const cards=useful.slice(0,80).map(x=>'<div class="valuecard"><small>'+esc(x.key)+'</small><strong>'+esc(x.value)+'</strong></div>').join('');
    const notes=fields.filter(x=>x.empty||x.complex).slice(0,40).map(x=>'<div class="valuecard"><small>'+esc(x.key)+'</small><strong style="font-size:14px">'+esc(x.value)+'</strong></div>').join('');
    return '<div class="panel" style="margin:10px 0"><div class="top"><b>'+esc(row.dataset)+' · '+esc(row.record_date||'data non specificata')+'</b><span class="pill">letto da D1</span></div><div class="hint" style="margin-top:6px">Endpoint: '+esc(row.source_endpoint||'non specificato')+' · acquisito: '+esc(row.retrieved_at||'—')+'</div><div class="cards">'+(cards||'<p class="hint">Nessun valore semplice disponibile.</p>')+'</div>'+(notes?'<details class="submenu"><summary>Campi vuoti, elenchi e strutture complesse</summary><div class="inside"><div class="cards">'+notes+'</div></div></details>':'')+'<details class="submenu"><summary>JSON originale Garmin</summary><div class="inside"><pre class="raw">'+esc(JSON.stringify(obj,null,2))+'</pre></div></details></div>';
  }
  async function load(){
    const t=token.value.trim();if(!t){$('status').textContent='Inserisci il token di accesso.';return}
    $('load').disabled=true;$('status').textContent='Lettura dei dati da D1…';
    try{
      const r=await fetch('/dashboard-data',{headers:{Authorization:'Bearer '+t},cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
      try{localStorage.setItem('training_center_sync_token',t)}catch(e){}
      $('activities').textContent=fmt(d.counts.activities);$('details').textContent=fmt(d.counts.activity_details);$('records').textContent=fmt(d.counts.garmin_records);$('daily').textContent=fmt(d.counts.daily_records);$('runs').textContent=fmt(d.counts.sync_runs);
      $('datasets').innerHTML=d.datasets.map(x=>'<tr><td><b>'+esc(x.dataset)+'</b></td><td>'+fmt(x.records)+'</td><td>'+esc(date(x.first_date))+' → '+esc(date(x.last_date))+'</td><td>'+fmt(x.empty_records)+'</td></tr>').join('')||'<tr><td colspan="4">Nessun dataset</td></tr>';
      $('activityCount').textContent=fmt(d.counts.activities||d.activities.length)+' attività · '+d.activities.length+' mostrate';
      $('allActivityRows').innerHTML=d.activities.length?d.activities.map(a=>'<tr><td>'+esc(date(a.start_time_local))+'</td><td>'+esc(a.activity_name||a.activity_type||'Attività')+'</td><td>'+esc(dist(a.distance_m))+'</td><td>'+esc(dur(a.duration_s))+'</td><td>'+fmt(a.calories)+'</td><td>'+esc(a.average_hr==null?'—':fmt(a.average_hr)+' bpm')+'</td><td>'+esc(a.max_hr==null?'—':fmt(a.max_hr)+' bpm')+'</td></tr>').join(''):'<tr><td colspan="7">Nessuna attività archiviata.</td></tr>';
      const activitySelect=$('activitySelect'),previousActivity=activitySelect.value;
      activitySelect.innerHTML='<option value="">Seleziona attività…</option>'+d.activities.map(x=>'<option value="'+esc(x.activity_id)+'">'+esc(date(x.start_time_local))+' · '+esc(x.activity_name||x.activity_type||'Attività')+' · '+esc(dist(x.distance_m))+'</option>').join('');
      if(previousActivity)activitySelect.value=previousActivity;
      const q=d.quality||{},aq=q.activities||{},gq=q.garminRecords||{};
      $('qualitySummary').innerHTML=[
        ['Attività archiviate',aq.total,'Totale attività presenti in D1'],
        ['Date mancanti',aq.missing_date,'Attività senza data'],
        ['Tipo mancante',aq.missing_type,'Attività senza tipo'],
        ['Distanza mancante',aq.missing_distance,'Non sempre disponibile da Garmin'],
        ['Durata mancante',aq.missing_duration,'Non sempre disponibile da Garmin'],
        ['FC media mancante',aq.missing_average_hr,'Non sempre disponibile da Garmin'],
        ['FC max mancante',aq.missing_max_hr,'Non sempre disponibile da Garmin'],
        ['JSON attività non valido',aq.invalid_json,'Controllo struttura JSON'],
        ['Record Garmin vuoti',gq.empty_payloads,'Payload nulli, vuoti o senza contenuto'],
        ['JSON Garmin non valido',gq.invalid_json,'Controllo struttura JSON']
      ].map(x=>'<div class="valuecard"><small>'+esc(x[0])+'</small><strong>'+fmt(x[1])+'</strong><small>'+esc(x[2])+'</small></div>').join('');
      $('dailyRows').innerHTML=d.recentDailyRecords.map(x=>'<tr><td>'+esc(date(x.record_date))+'</td><td>'+esc(x.dataset)+'</td><td>'+esc(x.updated_at||'—')+'</td></tr>').join('')||'<tr><td colspan="3">Nessun record</td></tr>';
      $('status').textContent='Archivio aggiornato '+new Date(d.generatedAt).toLocaleString('it-IT')+' · dati letti direttamente da D1.';
    }catch(e){$('status').textContent='Errore: '+e.message}finally{$('load').disabled=false}
  }
  let browserOffset=0,browserTotal=0,browserRows=[];
  async function browseDatabase(reset=true){
    const t=token.value.trim();if(!t){$('browserStatus').textContent='Inserisci il token di accesso.';return}
    if(reset)browserOffset=0;
    const source=$('browserSource').value,category=$('browserCategory').value,day=$('browserDate').value,search=$('browserSearch').value.trim();
    $('browserSearchButton').disabled=true;$('browserStatus').textContent='Lettura archivio D1…';$('browserDetail').innerHTML='';
    try{
      const q=new URLSearchParams({source,limit:'50',offset:String(browserOffset)});if(category)q.set('category',category);if(day)q.set('date',day);if(search)q.set('search',search);
      const r=await fetch('/dashboard-browser?'+q.toString(),{headers:{Authorization:'Bearer '+t},cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
      browserRows=d.rows||[];browserTotal=d.total||0;
      const cat=$('browserCategory'),old=cat.value;cat.innerHTML='<option value="">Tutte le categorie</option>'+(d.categories||[]).map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');if(old)cat.value=old;
      $('browserStatus').textContent=fmt(browserTotal)+' record in '+source+' · visualizzati '+(browserOffset+1)+'–'+(browserOffset+browserRows.length);
      $('browserRows').innerHTML=browserRows.length?'<div class="scroll"><table><thead><tr><th>Data</th><th>Categoria</th><th>Nome / ID</th><th>Acquisito</th><th></th></tr></thead><tbody>'+browserRows.map((x,i)=>'<tr><td>'+esc(date(x.record_date))+'</td><td>'+esc(x.category||'—')+'</td><td>'+esc(x.label||x.row_id)+'</td><td>'+esc(x.retrieved_at||'—')+'</td><td><button type="button" class="browserOpen" data-index="'+i+'">Apri</button></td></tr>').join('')+'</tbody></table></div>':'<p class="hint">Nessun record trovato con questi filtri.</p>';
      $('browserPrev').disabled=browserOffset===0;$('browserNext').disabled=browserOffset+browserRows.length>=browserTotal;$('browserPage').textContent='Pagina '+(Math.floor(browserOffset/50)+1)+' · '+fmt(browserTotal)+' record';
    }catch(e){$('browserStatus').textContent='Errore: '+e.message}finally{$('browserSearchButton').disabled=false}
  }
  function openBrowserRow(index){
    const row=browserRows[index];if(!row)return;let parsed;try{parsed=JSON.parse(row.raw_json||'null')}catch(e){parsed=row.raw_json||'JSON non disponibile'}
    const fields=[];flatten(parsed,'',fields);
    const cards=fields.map(x=>'<div class="valuecard"><small>'+esc(x.key)+'</small><strong style="font-size:14px">'+esc(x.value)+'</strong></div>').join('');
    $('browserDetail').innerHTML='<div class="panel" style="margin-top:12px"><div class="top"><b>'+esc(row.category||'Record')+' · '+esc(row.label||row.row_id)+'</b><span class="pill">D1 · sola lettura</span></div><p class="hint">ID: '+esc(row.row_id)+' · data: '+esc(row.record_date||'—')+' · acquisito: '+esc(row.retrieved_at||'—')+' · fonte: '+esc(row.source_info||'—')+'</p><h3>Campi leggibili</h3><div class="cards">'+(cards||'<p class="hint">Nessun campo leggibile.</p>')+'</div><details class="submenu" open><summary>JSON originale completo</summary><div class="inside"><pre class="raw">'+esc(typeof parsed==='string'?parsed:JSON.stringify(parsed,null,2))+'</pre></div></details></div>';
    $('browserDetail').scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function openActivity(){
    const t=token.value.trim(),activityId=$('activitySelect').value;
    if(!t){$('activityDetailStatus').textContent='Inserisci il token di accesso.';return}
    if(!activityId){$('activityDetailStatus').textContent='Seleziona prima un’attività.';return}
    $('openActivity').disabled=true;$('activityDetailStatus').textContent='Lettura dell’attività da D1…';$('activityDetail').innerHTML='';
    try{
      const q=new URLSearchParams({activityId});
      const r=await fetch('/dashboard-activity?'+q.toString(),{headers:{Authorization:'Bearer '+t},cache:'no-store'});
      const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
      const a=d.activity;
      const summary=[['ID Garmin',a.activity_id],['Tipo',a.activity_type],['Data',a.start_time_local],['Distanza',dist(a.distance_m)],['Durata',dur(a.duration_s)],['Calorie',a.calories==null?'—':fmt(a.calories)],['FC media',a.average_hr==null?'—':fmt(a.average_hr)+' bpm'],['FC massima',a.max_hr==null?'—':fmt(a.max_hr)+' bpm'],['Primo inserimento',a.first_seen_at],['Ultimo aggiornamento',a.last_seen_at]];
      const cards=summary.map(x=>'<div class="valuecard"><small>'+esc(x[0])+'</small><strong style="font-size:15px">'+esc(x[1]??'—')+'</strong></div>').join('');
      const rawBlock=(title,raw,endpoint,when)=>{
        if(!raw)return '<p class="hint">'+esc(title)+': non disponibile in D1.</p>';
        let parsed;try{parsed=JSON.parse(raw)}catch(e){parsed=raw}
        return '<details class="submenu"><summary>'+esc(title)+'</summary><div class="inside"><p class="hint">Endpoint: '+esc(endpoint||'non registrato')+' · acquisito: '+esc(when||'—')+'</p><pre class="raw">'+esc(typeof parsed==='string'?parsed:JSON.stringify(parsed,null,2))+'</pre></div></details>';
      };
      $('activityDetail').innerHTML='<div class="cards">'+cards+'</div>'+rawBlock('JSON riepilogo attività Garmin',a.raw_json,'activities table',a.last_seen_at)+
        (d.detail?rawBlock('Dettaglio attività Garmin',d.detail.raw_json,d.detail.source_endpoint,d.detail.retrieved_at):'<p class="hint">Dettaglio esteso non ancora presente in activity_details.</p>')+
        (d.workouts.length?d.workouts.map((w,i)=>rawBlock('Workout collegato '+(i+1),w.raw_json,w.source_endpoint,w.retrieved_at)).join(''):'<p class="hint">Nessun workout collegato archiviato.</p>');
      $('activityDetailStatus').textContent='Attività caricata da D1 · ID '+a.activity_id;
    }catch(e){$('activityDetailStatus').textContent='Errore: '+e.message}
    finally{$('openActivity').disabled=false}
  }
  async function loadAudit(){
    const t=token.value.trim();if(!t){$('auditStatus').textContent='Inserisci il token di accesso.';return}
    $('auditLoad').disabled=true;$('auditStatus').textContent='Verifica delle ultime esecuzioni…';
    try{
      const r=await fetch('/dashboard-audit',{headers:{Authorization:'Bearer '+t},cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
      $('auditRows').innerHTML=(d.runs||[]).map(run=>{
        const ds=run.datasets||[],written=ds.reduce((n,x)=>n+Number(x.records_written||0),0);
        const rows=ds.length?'<div class="scroll"><table><thead><tr><th>Categoria</th><th>Record scritti/aggiornati</th><th>Vuoti</th><th>Intervallo date</th></tr></thead><tbody>'+ds.map(x=>'<tr><td>'+esc(x.dataset)+'</td><td>'+fmt(x.records_written)+'</td><td>'+fmt(x.empty_records)+'</td><td>'+esc(date(x.first_date))+' → '+esc(date(x.last_date))+'</td></tr>').join('')+'</tbody></table></div>':'<p class="hint">Nessun record Garmin attribuito a questa finestra temporale.</p>';
        return '<details class="submenu"><summary>Run #'+fmt(run.id)+' · '+esc(run.sync_type||'legacy')+' · '+esc(run.started_at)+' · '+esc(run.status)+' · '+fmt(written)+' record</summary><div class="inside"><p class="hint">Attività: '+fmt(run.activities_seen)+' · record giornalieri: '+fmt(run.daily_records_seen)+' · fine: '+esc(run.finished_at||'in corso')+'</p>'+rows+(run.message?'<pre class="raw">'+esc(run.message)+'</pre>':'')+'</div></details>';
      }).join('')||'<p class="hint">Nessuna esecuzione registrata.</p>';
      $('auditStatus').textContent='Controllate '+fmt(d.runs.length)+' esecuzioni recenti. Questo riepilogo attribuisce i record tramite il timestamp di acquisizione: è un controllo indicativo, non un log completo delle chiamate Garmin.';
    }catch(e){$('auditStatus').textContent='Errore nel controllo: '+e.message}finally{$('auditLoad').disabled=false}
  }
  $('load').addEventListener('click',load);
  async function loadSchema(){
    const t=token.value.trim();if(!t){$('schemaStatus').textContent='Inserisci il token di accesso.';return}
    $('schemaLoad').disabled=true;$('schemaStatus').textContent='Analisi di tutti i JSON in corso…';$('schemaResults').innerHTML='';
    try{
      const r=await fetch('/dashboard-schema',{headers:{Authorization:'Bearer '+t},cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
      const render=(title,rows)=>'<h3>'+title+' · '+rows.length+' campi</h3><div class="scroll"><table><thead><tr><th>Dataset</th><th>Percorso campo</th><th>Tipo</th><th>Occorrenze</th><th>Record</th><th>Esempio</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+esc(x.dataset)+'</td><td><code>'+esc(x.field_path)+'</code></td><td>'+esc(x.value_type)+'</td><td>'+fmt(x.occurrences)+'</td><td>'+fmt(x.records_with_field)+'</td><td>'+esc(x.example??'—')+'</td></tr>').join('')+'</tbody></table></div>';
      $('schemaResults').innerHTML=render('Garmin records',d.garmin_records||[])+render('Daily records',d.daily_records||[]);
      $('schemaStatus').textContent='Analisi completata · '+fmt(d.totals.garmin_fields)+' strutture campo nei Garmin records e '+fmt(d.totals.daily_fields)+' nei daily records. I record originali non sono stati modificati.';
    }catch(e){$('schemaStatus').textContent='Errore analisi: '+e.message}
    finally{$('schemaLoad').disabled=false}
  }
  $('schemaLoad').addEventListener('click',loadSchema);
  async function checkAnalyticsCapabilities(){
    const t=token.value.trim();if(!t){$('analyticsCheckStatus').textContent='Inserisci il token di accesso.';return}
    $('analyticsCheck').disabled=true;$('analyticsCheckStatus').textContent='Verifica funzioni JSON di SQLite/D1…';
    try{
      const r=await fetch('/analytics-capabilities',{headers:{Authorization:'Bearer '+t},cache:'no-store'});
      const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
      const j=d.json_functions||{};
      $('analyticsCheckStatus').textContent='D1 compatibile · SQLite '+(d.sqlite_version||'n/d')+' · json_valid: '+j.json_valid+' · json_extract: '+j.json_extract+' · json_tree nodi: '+j.json_tree+' · json_each elementi: '+j.json_each+'. Test in sola lettura.';
    }catch(e){$('analyticsCheckStatus').textContent='Verifica non riuscita: '+e.message}
    finally{$('analyticsCheck').disabled=false}
  }
  $('analyticsCheck').addEventListener('click',checkAnalyticsCapabilities);
  async function checkAnalyticsViews(){
    const t=token.value.trim();if(!t){$('analyticsViewsStatus').textContent='Inserisci il token di accesso.';return}
    $('analyticsViewsCheck').disabled=true;$('analyticsViewsStatus').textContent='Controllo delle viste installate in D1…';
    try{
      const r=await fetch('/analytics-view-status',{headers:{Authorization:'Bearer '+t},cache:'no-store'});
      const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||('HTTP '+r.status));
      $('analyticsViewsStatus').textContent=d.installed
        ? 'Viste analitiche installate · '+d.present.length+'/'+d.expected+'. Controllo in sola lettura.'
        : 'Viste non ancora complete · presenti '+d.present.length+'/'+d.expected+' · mancanti: '+(d.missing||[]).join(', ')+'. Nessuna modifica eseguita.';
    }catch(e){$('analyticsViewsStatus').textContent='Verifica non riuscita: '+e.message}
    finally{$('analyticsViewsCheck').disabled=false}
  }
  $('analyticsViewsCheck').addEventListener('click',checkAnalyticsViews);

  $('browserSearchButton').addEventListener('click',()=>browseDatabase(true));
  $('browserSource').addEventListener('change',()=>{$('browserCategory').innerHTML='<option value="">Tutte le categorie</option>';browseDatabase(true)});
  $('browserCategory').addEventListener('change',()=>browseDatabase(true));
  $('browserPrev').addEventListener('click',()=>{browserOffset=Math.max(0,browserOffset-50);browseDatabase(false)});
  $('browserNext').addEventListener('click',()=>{browserOffset+=50;browseDatabase(false)});
  $('browserRows').addEventListener('click',event=>{const b=event.target.closest('.browserOpen');if(b)openBrowserRow(Number(b.dataset.index))});
  $('browserSearch').addEventListener('keydown',event=>{if(event.key==='Enter')browseDatabase(true)});
  $('auditLoad').addEventListener('click',loadAudit);$('openActivity').addEventListener('click',openActivity);$('activitySelect').addEventListener('change',()=>{$('activityDetail').innerHTML='';$('activityDetailStatus').textContent='Premi “Apri attività” per caricare i dettagli.';});
  if(token.value){load();browseDatabase();}
  </script></body></html>`;
}
