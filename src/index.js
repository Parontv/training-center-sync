const GARMIN_BASE = "https://personal.connectapi.garmin.com";
const TOKEN_PATH = "/personalapitoken-service/personal-api/personal-api-key/token";

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runSync(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "training-center-sync", storage: Boolean(env.DB) });
    }
    if (url.pathname === "/run" && request.method === "GET") {
      return new Response(`<!doctype html><html lang="it"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Training Center Sync</title><body style="font:16px system-ui;max-width:560px;margin:40px auto;padding:16px;background:#111;color:#eee"><h2>Training Center Sync</h2><p>Inserisci il tuo SYNC_BEARER_TOKEN configurato nei Secrets Cloudflare. Non è la chiave Garmin.</p><input id="token" type="password" autocomplete="off" placeholder="SYNC_BEARER_TOKEN" style="box-sizing:border-box;width:100%;padding:12px;margin:8px 0;background:#222;color:#fff;border:1px solid #555;border-radius:8px"><button id="go" style="padding:12px 18px">Avvia sincronizzazione</button><pre id="out" style="white-space:pre-wrap;overflow-wrap:anywhere;background:#222;padding:12px;border-radius:8px"></pre><script>document.getElementById('go').onclick=async()=>{const b=document.getElementById('go'),o=document.getElementById('out');b.disabled=true;o.textContent='Sincronizzazione in corso…';try{const r=await fetch('/sync',{method:'POST',headers:{Authorization:'Bearer '+document.getElementById('token').value}});o.textContent='HTTP '+r.status+'\\n'+JSON.stringify(await r.json(),null,2)}catch(e){o.textContent=String(e)}finally{b.disabled=false}};</script></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    if (url.pathname === "/sync" && request.method === "POST") {
      const expected = env.SYNC_BEARER_TOKEN;
      if (!expected || request.headers.get("Authorization") !== `Bearer ${expected}`) {
        return json({ error: "unauthorized" }, 401);
      }
      const result = await runSync(env);
      return json(result, result.ok ? 200 : 502);
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
  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Garmin GET failed: HTTP ${response.status} for ${path.split("?")[0]}`);
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
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

async function runSync(env) {
  const startedAt = new Date().toISOString();
  let runId;
  try {
    if (!env.DB) throw new Error("D1 binding DB is missing");
    if (!env.GARMIN_PERSONAL_API_KEY) throw new Error("Worker Secret GARMIN_PERSONAL_API_KEY is missing");
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

    const token = await getBearerToken(env.GARMIN_PERSONAL_API_KEY);
    const lookback = Math.min(Math.max(Number(env.SYNC_LOOKBACK_DAYS || 27), 3), 27);
    const startDate = isoDateDaysAgo(lookback);
    const endDate = new Date().toISOString().slice(0, 10);

    let activityCount = 0;
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
      for (const item of page) if (await saveActivity(env.DB, item)) activityCount++;
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
      ["wellness_activity_summaries", `/wellnessactivity-service/activity/summary/range/${startDate}/${endDate}`]
    ];

    let dailyCount = 0;
    const datasetErrors = [];
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
        } else if (result != null) {
          await saveDaily(env.DB, endDate, dataset, result, path);
          dailyCount++;
        }
      } catch (error) {
        datasetErrors.push({ dataset, error: String(error?.message || error).slice(0, 300) });
      }
    }
    const finalStatus = datasetErrors.length ? "partial" : "success";

    await env.DB.prepare(
      "UPDATE sync_runs SET finished_at=?, status=?, activities_seen=?, daily_records_seen=?, message=? WHERE id=?"
    ).bind(new Date().toISOString(), finalStatus, activityCount, dailyCount, datasetErrors.length ? JSON.stringify(datasetErrors) : null, runId).run();
    return { ok: true, partial: datasetErrors.length > 0, startDate, endDate, activitiesSeen: activityCount, dailyRecordsSeen: dailyCount, datasetErrors };
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
