// STIS (Station Travel Information System) platform display.
//
// Usage:  /stis/?stop=CC15_A   (Circle Line, Bishan, Platform A)
//         /stis/?stop=TE9_B    (Thomson-East Coast Line, Caldecott, Platform B)
//
// LTA does not publish live train arrival times, so arrivals are generated from
// an approximate headway timetable (see HEADWAYS). Times are estimates only.

(() => {
  'use strict';

  // ---- Display timing (same behaviour as the reference CCL STIS) ----
  const SHOW_BEFORE_SECONDS = 30;   // switch to "arriving" screen this long before arrival
  const HIDE_AFTER_SECONDS = 15;    // keep "arriving" screen this long after arrival
  const MAX_ETA_SECONDS = 7 * 60;   // only list trains arriving within 7 minutes

  // ---- Line colours ----
  const LINE_CLASS = { NS: 'ns', EW: 'ew', NE: 'ne', CC: 'cc', DT: 'dt', TE: 'te' };

  // ---- Network data ----
  // `codes` = all station codes shown on the caplet (own line first).
  // `open: false` = station not in service, skipped when generating trains.
  const LINES = {
    CC: {
      name: 'Circle Line',
      loop: true,
      // Platform A runs with increasing station numbers, B with decreasing.
      directions: { A: 'Anticlockwise', B: 'Clockwise' },
      stations: [
        { n: 4, name: 'Promenade', codes: ['CC4', 'DT15'] },
        { n: 5, name: 'Nicoll Highway', codes: ['CC5'] },
        { n: 6, name: 'Stadium', codes: ['CC6'] },
        { n: 7, name: 'Mountbatten', codes: ['CC7'] },
        { n: 8, name: 'Dakota', codes: ['CC8'] },
        { n: 9, name: 'Paya Lebar', codes: ['CC9', 'EW8'] },
        { n: 10, name: 'MacPherson', codes: ['CC10', 'DT26'] },
        { n: 11, name: 'Tai Seng', codes: ['CC11'] },
        { n: 12, name: 'Bartley', codes: ['CC12'] },
        { n: 13, name: 'Serangoon', codes: ['CC13', 'NE12'] },
        { n: 14, name: 'Lorong Chuan', codes: ['CC14'] },
        { n: 15, name: 'Bishan', codes: ['CC15', 'NS17'] },
        { n: 16, name: 'Marymount', codes: ['CC16'] },
        { n: 17, name: 'Caldecott', codes: ['CC17', 'TE9'] },
        { n: 18, name: 'Bukit Brown', codes: ['CC18'], open: false },
        { n: 19, name: 'Botanic Gardens', codes: ['CC19', 'DT9'] },
        { n: 20, name: 'Farrer Road', codes: ['CC20'] },
        { n: 21, name: 'Holland Village', codes: ['CC21'] },
        { n: 22, name: 'Buona Vista', codes: ['CC22', 'EW21'] },
        { n: 23, name: 'one-north', codes: ['CC23'] },
        { n: 24, name: 'Kent Ridge', codes: ['CC24'] },
        { n: 25, name: 'Haw Par Villa', codes: ['CC25'] },
        { n: 26, name: 'Pasir Panjang', codes: ['CC26'] },
        { n: 27, name: 'Labrador Park', codes: ['CC27'] },
        { n: 28, name: 'Telok Blangah', codes: ['CC28'] },
        { n: 29, name: 'HarbourFront', codes: ['CC29', 'NE1'] },
        { n: 30, name: 'Keppel', codes: ['CC30'] },
        { n: 31, name: 'Cantonment', codes: ['CC31'] },
        { n: 32, name: 'Prince Edward Road', codes: ['CC32'] },
        { n: 33, name: 'Marina Bay', codes: ['CC33', 'NS27', 'TE20'] },
        { n: 34, name: 'Bayfront', codes: ['CC34', 'DT16'] }
      ]
    },
    TE: {
      name: 'Thomson-East Coast Line',
      loop: false,
      // Platform A runs with increasing station numbers (towards Bayshore),
      // B with decreasing numbers (towards Woodlands North).
      directions: { A: 'Towards Bayshore', B: 'Towards Woodlands North' },
      stations: [
        { n: 1, name: 'Woodlands North', codes: ['TE1'] },
        { n: 2, name: 'Woodlands', codes: ['TE2', 'NS9'] },
        { n: 3, name: 'Woodlands South', codes: ['TE3'] },
        { n: 4, name: 'Springleaf', codes: ['TE4'] },
        { n: 5, name: 'Lentor', codes: ['TE5'] },
        { n: 6, name: 'Mayflower', codes: ['TE6'] },
        { n: 7, name: 'Bright Hill', codes: ['TE7'] },
        { n: 8, name: 'Upper Thomson', codes: ['TE8'] },
        { n: 9, name: 'Caldecott', codes: ['TE9', 'CC17'] },
        { n: 10, name: 'Mount Pleasant', codes: ['TE10'], open: false },
        { n: 11, name: 'Stevens', codes: ['TE11', 'DT10'] },
        { n: 12, name: 'Napier', codes: ['TE12'] },
        { n: 13, name: 'Orchard Boulevard', codes: ['TE13'] },
        { n: 14, name: 'Orchard', codes: ['TE14', 'NS22'] },
        { n: 15, name: 'Great World', codes: ['TE15'] },
        { n: 16, name: 'Havelock', codes: ['TE16'] },
        { n: 17, name: 'Outram Park', codes: ['TE17', 'EW16', 'NE3'] },
        { n: 18, name: 'Maxwell', codes: ['TE18'] },
        { n: 19, name: 'Shenton Way', codes: ['TE19'] },
        { n: 20, name: 'Marina Bay', codes: ['TE20', 'NS27', 'CC33'] },
        { n: 21, name: 'Marina South', codes: ['TE21'], open: false },
        { n: 22, name: 'Gardens by the Bay', codes: ['TE22'] },
        { n: 23, name: 'Tanjong Rhu', codes: ['TE23'] },
        { n: 24, name: 'Katong Park', codes: ['TE24'] },
        { n: 25, name: 'Tanjong Katong', codes: ['TE25'] },
        { n: 26, name: 'Marine Parade', codes: ['TE26'] },
        { n: 27, name: 'Marine Terrace', codes: ['TE27'] },
        { n: 28, name: 'Siglap', codes: ['TE28'] },
        { n: 29, name: 'Bayshore', codes: ['TE29'] }
      ]
    }
  };

  // Stations offered on the picker screen.
  const FEATURED = [
    { title: 'Circle Line', stops: ['CC15_A', 'CC15_B', 'CC17_A', 'CC17_B'] },
    {
      title: 'Thomson-East Coast Line',
      stops: LINES.TE.stations.filter(s => s.open !== false)
        .flatMap(s => [`TE${s.n}_A`, `TE${s.n}_B`])
    }
  ];

  // ---- Approximate headways (seconds) ----
  // Service runs roughly 05:30 to 00:15. These are estimates, not LTA data.
  const SERVICE_START = 5 * 3600 + 30 * 60;
  const SERVICE_END = 24 * 3600 + 15 * 60;
  const RUN_SECONDS_PER_STATION = 120; // average travel + dwell between stations

  const HEADWAYS = {
    CC: { peak: 210, offpeak: 300, late: 420 },
    TE: { peak: 240, offpeak: 330, late: 420 }
  };

  // ---- Helpers ----
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');

  function isPeak(secondsOfDay, dayOfWeek) {
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const h = secondsOfDay / 3600;
    return (h >= 7 && h < 9.5) || (h >= 17.5 && h < 20);
  }

  function headwayAt(lineCode, secondsOfDay, dayOfWeek) {
    const hw = HEADWAYS[lineCode];
    if (secondsOfDay >= 23 * 3600) return hw.late;
    return isPeak(secondsOfDay, dayOfWeek) ? hw.peak : hw.offpeak;
  }

  function parseStop(raw) {
    const m = /^(CC|TE)(\d{1,2})_?([AB])$/i.exec(String(raw || '').trim());
    if (!m) return null;
    const lineCode = m[1].toUpperCase();
    const line = LINES[lineCode];
    const num = parseInt(m[2], 10);
    const plat = m[3].toUpperCase();
    const station = line.stations.find(s => s.n === num);
    if (!station || station.open === false) return null;
    // A terminus has no trains departing towards itself.
    if (!line.loop && stationsAhead(line, station, plat).length === 0) return null;
    return { lineCode, line, station, plat, id: `${lineCode}${num}_${plat}` };
  }

  // Stations in travel order for the given platform, starting after `station`.
  function stationsAhead(line, station, plat) {
    const open = line.stations.filter(s => s.open !== false);
    const idx = open.indexOf(station);
    const step = plat === 'A' ? 1 : -1;
    const out = [];
    for (let i = 1; i < open.length; i++) {
      let j = idx + step * i;
      if (line.loop) j = (j + open.length) % open.length;
      else if (j < 0 || j >= open.length) break;
      out.push(open[j]);
    }
    return out;
  }

  // Number of open stations between the start of the line (for this direction)
  // and this station. Used to stagger train times between stations.
  function stationOffset(line, station, plat) {
    const open = line.stations.filter(s => s.open !== false);
    const idx = open.indexOf(station);
    return plat === 'A' ? idx : open.length - 1 - idx;
  }

  // What to show after the prefix: next interchange ("via"), or the terminus ("ends at").
  function destinationFor(stop) {
    const ahead = stationsAhead(stop.line, stop.station, stop.plat);
    const nextInterchange = ahead.find(s => s.codes.length > 1);
    if (stop.line.loop) {
      return nextInterchange ? { prefix: 'via', station: nextInterchange } : { prefix: '', station: null };
    }
    const terminus = ahead[ahead.length - 1];
    if (nextInterchange && nextInterchange !== terminus) {
      return { prefix: 'via', station: nextInterchange };
    }
    return { prefix: 'ends at', station: terminus };
  }

  // Generate the day's estimated arrival times (seconds since midnight of service day).
  function arrivalsFor(stop, dayOfWeek) {
    const offset = stationOffset(stop.line, stop.station, stop.plat) * RUN_SECONDS_PER_STATION;
    const first = SERVICE_START + offset;
    const last = SERVICE_END;
    const times = [];
    let t = first;
    while (t <= last) {
      times.push(t);
      t += headwayAt(stop.lineCode, t % 86400, dayOfWeek);
    }
    return times;
  }

  function buildCaplet(el, station) {
    el.replaceChildren();
    if (!station) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    station.codes.forEach(code => {
      const seg = document.createElement('span');
      const cls = LINE_CLASS[code.slice(0, 2)] || 'cc';
      seg.className = `caplet-seg line-${cls}`;
      seg.textContent = code;
      el.appendChild(seg);
    });
  }

  // ---- Screen state ----
  let stop = null;
  let dest = null;
  let cache = { key: '', times: [] };
  const lastRendered = {};

  function timesForServiceDay(now) {
    // Before 03:00 counts as the previous service day (times beyond 24:00).
    const d = new Date(now);
    let secondsOfDay = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    if (d.getHours() < 3) {
      d.setDate(d.getDate() - 1);
      secondsOfDay += 86400;
    }
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (cache.key !== key) {
      cache = { key, times: arrivalsFor(stop, d.getDay()) };
    }
    return { secondsOfDay, times: cache.times };
  }

  function renderRow(rowNum, etaSeconds) {
    const key = `${rowNum}`;
    const dirEl = $(`train-${rowNum}-dir`);
    const prefixEl = $(`train-${rowNum}-prefix`);
    const capletEl = $(`train-${rowNum}-caplet`);
    const stationEl = $(`train-${rowNum}-station`);
    const etaEl = $(`train-${rowNum}-eta`);
    const unitEl = $(`train-${rowNum}-unit`);

    if (etaSeconds === null) {
      if (lastRendered[key] !== 'empty') {
        dirEl.textContent = '';
        prefixEl.textContent = '';
        stationEl.textContent = '';
        etaEl.textContent = '';
        unitEl.textContent = '';
        buildCaplet(capletEl, null);
        lastRendered[key] = 'empty';
      }
      return;
    }

    const mins = Math.max(1, Math.ceil(etaSeconds / 60));
    etaEl.textContent = mins;
    unitEl.textContent = mins === 1 ? 'min' : 'mins';

    if (lastRendered[key] !== 'train') {
      dirEl.textContent = stop.line.directions[stop.plat];
      prefixEl.textContent = dest.prefix;
      stationEl.textContent = dest.station ? dest.station.name : '';
      buildCaplet(capletEl, dest.station);
      lastRendered[key] = 'train';
    }
  }

  function renderClock(now) {
    const d = new Date(now);
    $('system-clock').textContent = Math.floor(now / 4000) % 2 === 0
      ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function tick() {
    const now = Date.now();
    renderClock(now);

    const { secondsOfDay, times } = timesForServiceDay(now);
    const upcoming = times.filter(t => t - secondsOfDay >= -HIDE_AFTER_SECONDS);

    // Arriving screen: the next train is about to arrive, or has just arrived.
    const next = upcoming[0];
    const arriving = next !== undefined &&
      next - secondsOfDay <= SHOW_BEFORE_SECONDS &&
      next - secondsOfDay >= -HIDE_AFTER_SECONDS;

    $('view-arriving').classList.toggle('hidden', !arriving);
    $('view-schedule').classList.toggle('hidden', arriving);

    const listed = upcoming.filter(t => t - secondsOfDay >= 0 && t - secondsOfDay <= MAX_ETA_SECONDS);
    renderRow(1, listed.length > 0 ? listed[0] - secondsOfDay : null);
    renderRow(2, listed.length > 1 ? listed[1] - secondsOfDay : null);

    let note = '';
    if (upcoming.length === 0) note = 'Train service has ended';
    else if (times[0] - secondsOfDay > MAX_ETA_SECONDS) note = 'Train service has not started';
    $('service-note').textContent = note;
  }

  function setupArrivingView() {
    $('arr-dir').textContent = stop.line.directions[stop.plat];
    $('arr-prefix').textContent = dest.prefix;
    $('arr-station').textContent = dest.station ? dest.station.name : '';
    buildCaplet($('arr-caplet'), dest.station);
  }

  function showPicker(invalidId) {
    $('stis-screen').classList.add('hidden');
    const picker = $('picker');
    picker.classList.remove('hidden');
    if (invalidId) {
      const p = document.createElement('p');
      p.className = 'picker-error';
      p.textContent = `Unknown stop "${invalidId}". Pick a platform below.`;
      picker.insertBefore(p, picker.children[1]);
    }
    const list = $('picker-list');
    FEATURED.forEach(group => {
      const h = document.createElement('h2');
      h.textContent = group.title;
      list.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'picker-grid';
      group.stops.forEach(id => {
        const s = parseStop(id);
        if (!s) return;
        const a = document.createElement('a');
        a.href = `?stop=${encodeURIComponent(s.id)}`;
        const cap = document.createElement('span');
        cap.className = 'caplet';
        buildCaplet(cap, s.station);
        const label = document.createElement('span');
        label.className = 'picker-label';
        label.textContent = `${s.station.name} · Platform ${s.plat}`;
        const sub = document.createElement('span');
        sub.className = 'picker-sub';
        sub.textContent = s.line.directions[s.plat];
        a.append(cap, label, sub);
        grid.appendChild(a);
      });
      list.appendChild(grid);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('stop') || params.get('stop_id');
    stop = parseStop(raw);

    if (!stop) {
      showPicker(raw);
      return;
    }

    dest = destinationFor(stop);
    document.title = `${stop.station.name} Platform ${stop.plat} – ${stop.line.name} STIS`;
    $('platform-label').textContent = `Platform ${stop.plat}`;
    setupArrivingView();
    tick();
    setInterval(tick, 1000);
  });
})();
