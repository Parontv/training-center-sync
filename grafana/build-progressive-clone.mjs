#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const sourcePath = 'grafana/dashboards/garmin-original-clone.json';
const outputPath = 'grafana/dashboards/garmin-stats-d1-progressive.json';
const baseRaw = process.env.WORKER_BASE_URL || 'https://training-center-sync.listaconcerti.workers.dev';
const base = baseRaw.replace(/\/+$/, '');
const uid = 'training-center-d1';
const datasource = { type: 'yesoreyeram-infinity-datasource', uid };
const connectedIds = new Set([38, 41, 48, 53, 54]);

function target(refId, columns) {
  return {
    refId,
    datasource,
    type: 'json',
    source: 'url',
    url: base + '/dashboard-data',
    parser: 'backend',
    format: 'table',
    root_selector: 'activities',
    columns
  };
}
const time = { selector: 'start_time_local', text: 'Time', type: 'time' };
const activityType = { selector: 'activity_type', text: 'Activity Type', type: 'string' };
const activityName = { selector: 'activity_name', text: 'Activity', type: 'string' };
const duration = { selector: 'duration_s', text: 'Duration', type: 'number' };
const distance = { selector: 'distance_m', text: 'Distance', type: 'number' };
const averageHr = { selector: 'average_hr', text: 'avgHR', type: 'number' };
const maxHr = { selector: 'max_hr', text: 'maxHR', type: 'number' };
const calories = { selector: 'calories', text: 'Calories', type: 'number' };

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const dash = JSON.parse(JSON.stringify(source));
dash.id = null;
dash.uid = 'garmin-stats-d1-progressive';
dash.title = 'Garmin Stats · D1 Progressive';
dash.version = 1;
dash.description = 'Progressive D1 conversion of the preserved 62-panel Garmin Stats reference. Five activity panels are wired to the authenticated Worker /dashboard-data endpoint. The response is limited to the most recent 500 activities and is not server-filtered by the Grafana time picker. Remaining panels are preserved visually but query-inert pending verified mappings.';
dash.tags = [...new Set([...(dash.tags || []), 'garmin', 'cloudflare-d1', 'progressive-conversion'])];
delete dash.__inputs;
dash.__requires = (dash.__requires || []).filter(x => !(x.type === 'datasource' && x.id === 'influxdb'));
if (!dash.__requires.some(x => x.type === 'datasource' && x.id === 'yesoreyeram-infinity-datasource')) {
  dash.__requires.push({ type: 'datasource', id: 'yesoreyeram-infinity-datasource', name: 'Infinity', version: '' });
}
if (dash.templating && Array.isArray(dash.templating.list)) {
  dash.templating.list = dash.templating.list.filter(v => {
    if (v.type === 'datasource' && v.pluginId === 'influxdb') return false;
    if (v.datasource && v.datasource.type === 'influxdb') return false;
    if (v.query && typeof v.query === 'object' && String(v.query.query || '').includes('SHOW TAG VALUES FROM')) return false;
    return true;
  });
}

for (const p of dash.panels || []) {
  const originalTargetCount = (p.targets || []).length;
  if (!connectedIds.has(p.id)) {
    if (originalTargetCount) {
      p.targets = [];
      p.datasource = datasource;
      p.transformations = [];
      p.description = 'PENDING D1 MAPPING: source panel layout/style preserved; no query is enabled until its Garmin field and semantics are verified.';
    }
    continue;
  }
  p.datasource = datasource;
  if (p.id === 38) {
    p.targets = [target('A', [time, activityType, activityName, duration, distance, averageHr, maxHr, calories])];
    p.transformations = [];
    if (p.options) p.options.frameIndex = 0;
    p.description = 'Connected to Worker activities. Shows recent records (Worker limit: 500); the Grafana time picker does not filter this response.';
  } else if (p.id === 41) {
    p.targets = [target('A', [time, { selector: 'activity_type', text: 'Activity Timeline', type: 'string' }])];
    p.description = 'Connected to Worker activities. Recent 500 records; no server-side time picker filtering.';
  } else if (p.id === 48) {
    p.targets = [target('A', [time, averageHr, maxHr])];
    p.description = 'Connected to average and maximum heart rate fields in Worker activities. The preserved transformation calculates maxHR minus avgHR.';
  } else if (p.id === 53) {
    p.targets = [target('A', [time, distance])];
    p.transformations = [];
    p.description = 'Connected to distance_m in Worker activities (recent 500 records).';
  } else if (p.id === 54) {
    p.targets = [target('A', [time, duration])];
    p.transformations = [];
    p.description = 'Connected to duration_s in Worker activities (recent 500 records).';
  }
}
dash.refresh = '15m';
dash.time = dash.time || { from: 'now-90d', to: 'now' };
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(dash, null, 2) + '\n');
const connected = (dash.panels || []).filter(p => connectedIds.has(p.id)).length;
const queryTargets = (dash.panels || []).reduce((n, p) => n + (p.targets || []).length, 0);
console.log('Built ' + outputPath + ': panels=' + (dash.panels || []).length + ', connectedPanels=' + connected + ', activeTargets=' + queryTargets + '.');
