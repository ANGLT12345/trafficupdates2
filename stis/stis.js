// STIS (Station Travel Information System) platform display.
//
// Usage:  /stis/?stop=CC15_A   (Circle Line, Bishan, Platform A)
//         /stis/?stop=TE9_B    (Thomson-East Coast Line, Caldecott, Platform B)
//         /stis/               (search for a platform)
//
// LTA does not publish live train arrival times, so arrivals are generated from
// an approximate headway timetable (see HEADWAYS). Times are estimates only.

(() => {
  'use strict';

  // ---- Display timing (same behaviour as the reference CCL STIS) ----
  const SHOW_BEFORE_SECONDS = 30;   // switch to "arriving" screen this long before arrival
  const HIDE_AFTER_SECONDS = 15;    // keep "arriving" screen this long after arrival
  const MAX_ETA_SECONDS = 15 * 60;  // only list trains arriving within 15 minutes

  // ---- Line colours ----
  const LINE_CLASS = { NS: 'ns', EW: 'ew', NE: 'ne', CC: 'cc', DT: 'dt', TE: 'te' };

  // ---- Network data ----
  // `codes` = all station codes shown on the caplet (own line first).
  // `open: false` = station not in service, skipped when generating trains.
  const LINES = {
    CC: {
      name: 'Circle Line',
      stations: [
        { n: 1, name: 'Dhoby Ghaut', abbr: 'DBG', codes: ['CC1', 'NS24', 'NE6'] },
        { n: 2, name: 'Bras Basah', abbr: 'BBS', codes: ['CC2'] },
        { n: 3, name: 'Esplanade', abbr: 'EPN', codes: ['CC3'] },
        { n: 4, name: 'Promenade', abbr: 'PMN', codes: ['CC4', 'DT15'] },
        { n: 5, name: 'Nicoll Highway', abbr: 'NCH', codes: ['CC5'] },
        { n: 6, name: 'Stadium', abbr: 'SDM', codes: ['CC6'] },
        { n: 7, name: 'Mountbatten', abbr: 'MBT', codes: ['CC7'] },
        { n: 8, name: 'Dakota', abbr: 'DKT', codes: ['CC8'] },
        { n: 9, name: 'Paya Lebar', abbr: 'PYL', codes: ['CC9', 'EW8'] },
        { n: 10, name: 'MacPherson', abbr: 'MPS', codes: ['CC10', 'DT26'] },
        { n: 11, name: 'Tai Seng', abbr: 'TSG', codes: ['CC11'] },
        { n: 12, name: 'Bartley', abbr: 'BLY', codes: ['CC12'] },
        { n: 13, name: 'Serangoon', abbr: 'SER', codes: ['CC13', 'NE12'] },
        { n: 14, name: 'Lorong Chuan', abbr: 'LRC', codes: ['CC14'] },
        { n: 15, name: 'Bishan', abbr: 'BSH', codes: ['CC15', 'NS17'] },
        { n: 16, name: 'Marymount', abbr: 'MRM', codes: ['CC16'] },
        { n: 17, name: 'Caldecott', abbr: 'CDT', codes: ['CC17', 'TE9'] },
        { n: 18, name: 'Bukit Brown', abbr: 'BKB', codes: ['CC18'], open: false },
        { n: 19, name: 'Botanic Gardens', abbr: 'BTN', codes: ['CC19', 'DT9'] },
        { n: 20, name: 'Farrer Road', abbr: 'FRR', codes: ['CC20'] },
        { n: 21, name: 'Holland Village', abbr: 'HLV', codes: ['CC21'] },
        { n: 22, name: 'Buona Vista', abbr: 'BNV', codes: ['CC22', 'EW21'] },
        { n: 23, name: 'one-north', abbr: 'ONH', codes: ['CC23'] },
        { n: 24, name: 'Kent Ridge', abbr: 'KRG', codes: ['CC24'] },
        { n: 25, name: 'Haw Par Villa', abbr: 'HPV', codes: ['CC25'] },
        { n: 26, name: 'Pasir Panjang', abbr: 'PPJ', codes: ['CC26'] },
        { n: 27, name: 'Labrador Park', abbr: 'LBD', codes: ['CC27'] },
        { n: 28, name: 'Telok Blangah', abbr: 'TLB', codes: ['CC28'] },
        { n: 29, name: 'HarbourFront', abbr: 'HBF', codes: ['CC29', 'NE1'] },
        { n: 30, name: 'Keppel', abbr: 'KPL', codes: ['CC30'] },
        { n: 31, name: 'Cantonment', abbr: 'CTM', codes: ['CC31'] },
        { n: 32, name: 'Prince Edward Road', abbr: 'PER', codes: ['CC32'] },
        { n: 33, name: 'Marina Bay', abbr: 'MRB', codes: ['CC33', 'NS27', 'TE20'] },
        { n: 34, name: 'Bayfront', abbr: 'BFT', codes: ['CC34', 'DT16'] }
      ]
    },
    TE: {
      name: 'Thomson-East Coast Line',
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


  // ---- Platform announcements ----
  // LTA's CCL wayfinding site (www.lta.gov.sg/cclwayfinding/) hosts the real
  // Circle Line pre-arrival announcements, e.g.
  //   PA/Pre-arrival_ACW_Loop/PLATFORM_A_ACW_LOOP_CDT dir.m4a   (loop, via Caldecott)
  //   PA/Pre-arrival_Turnaround/PLATFORM_B_CW_End_At_DBG.m4a    (ends at Dhoby Ghaut)
  // There is no TEL set.
  const PA_BASE = 'https://www.lta.gov.sg/cclwayfinding/PA/';
  const paUrl = (file) => PA_BASE + encodeURI(file);

  // ---- Approximate timetable ----
  // Service runs roughly 05:30 to 00:15. These are estimates, not LTA data.
  const SERVICE_START = 5 * 3600 + 30 * 60;
  const SERVICE_END = 24 * 3600 + 15 * 60;
  const RUN_SECONDS_PER_STATION = 120; // average travel + dwell between stations

  // Combined headway per platform on the busiest section.
  const HEADWAYS = {
    CC: { peak: 210, offpeak: 300, late: 420 },
    TE: { peak: 240, offpeak: 330, late: 420 }
  };

  // ---- Helpers ----
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const isInterchange = (s) => s.codes.length > 1;

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

  // ---- Services ----
  // Every platform is served by one or more services. Each service knows what
  // the screen shows for it (direction, "via"/"ends at", caplet station) and
  // which announcement to play.
  //
  // Circle Line (as modelled by LTA's CCL wayfinding site):
  //  - Loop services run round CC4–CC34 and show "via <next interchange>".
  //  - Turnaround services run Dhoby Ghaut CC1 <-> Prince Edward Road CC32 and
  //    show "ends at". Stations CC4–CC32 get both, alternating.
  //  - Marina Bay uses platforms C/D and Bayfront D/B for the loop.
  // TEL: one service each way, "via <next interchange>" or "ends at <terminus>".
  const STOPS = new Map(); // "CC15_A" -> stop

  function addService({ lineCode, ordered, loop, key, platFor, dirText, destMode, audioFor, mult, phase }) {
    const line = LINES[lineCode];
    ordered.forEach((station, i) => {
      const ahead = loop ? ordered.slice(i + 1).concat(ordered.slice(0, i)) : ordered.slice(i + 1);
      if (ahead.length === 0) return; // terminus: nothing departs this way

      let prefix;
      let dest;
      const next = ahead.find(isInterchange);
      const terminus = ahead[ahead.length - 1];
      if (destMode === 'via') {
        prefix = 'via';
        dest = next;
      } else if (destMode === 'ends') {
        prefix = 'ends at';
        dest = terminus;
      } else if (next && next !== terminus) {
        prefix = 'via';
        dest = next;
      } else {
        prefix = 'ends at';
        dest = terminus;
      }

      const plat = platFor(station);
      const id = `${lineCode}${station.n}_${plat}`;
      if (!STOPS.has(id)) STOPS.set(id, { id, lineCode, line, station, plat, services: [] });
      STOPS.get(id).services.push({
        key,
        dirText,
        prefix,
        dest,
        audio: audioFor ? audioFor(plat, dest) : null,
        offset: i * RUN_SECONDS_PER_STATION,
        mult,
        phase
      });
    });
  }

  function buildNetwork() {
    const ccOpen = LINES.CC.stations.filter(s => s.open !== false);
    const ring = ccOpen.filter(s => s.n >= 4);
    const branch = ccOpen.filter(s => s.n <= 32);

    const ccLoopPlat = (acw) => (s) => {
      if (s.n === 33) return acw ? 'C' : 'D';
      if (s.n === 34 && acw) return 'D';
      return acw ? 'A' : 'B';
    };
    const loopAudio = (acw) => (plat, dest) => paUrl(
      `Pre-arrival_${acw ? 'ACW' : 'CW'}_Loop/PLATFORM_${plat}_${acw ? 'ACW' : 'CW'}_LOOP_${dest.abbr} dir.m4a`);
    const turnAudio = (acw) => (plat, dest) => paUrl(
      `Pre-arrival_Turnaround/PLATFORM_${plat}_${acw ? 'ACW' : 'CW'}_End_At_${dest.abbr}.m4a`);
    const halfOffpeak = HEADWAYS.CC.offpeak;

    addService({ lineCode: 'CC', key: 'acwLoop', ordered: ring, loop: true, platFor: ccLoopPlat(true),
      dirText: 'Anticlockwise', destMode: 'via', audioFor: loopAudio(true), mult: 2, phase: 0 });
    addService({ lineCode: 'CC', key: 'cwLoop', ordered: [...ring].reverse(), loop: true, platFor: ccLoopPlat(false),
      dirText: 'Clockwise', destMode: 'via', audioFor: loopAudio(false), mult: 2, phase: 0 });
    addService({ lineCode: 'CC', key: 'acwTurn', ordered: branch, loop: false, platFor: () => 'A',
      dirText: 'Anticlockwise', destMode: 'ends', audioFor: turnAudio(true), mult: 2, phase: halfOffpeak });
    addService({ lineCode: 'CC', key: 'cwTurn', ordered: [...branch].reverse(), loop: false, platFor: () => 'B',
      dirText: 'Clockwise', destMode: 'ends', audioFor: turnAudio(false), mult: 2, phase: halfOffpeak });

    const teOpen = LINES.TE.stations.filter(s => s.open !== false);
    addService({ lineCode: 'TE', key: 'teA', ordered: teOpen, loop: false, platFor: () => 'A',
      dirText: 'Towards Bayshore', destMode: 'auto', audioFor: null, mult: 1, phase: 0 });
    addService({ lineCode: 'TE', key: 'teB', ordered: [...teOpen].reverse(), loop: false, platFor: () => 'B',
      dirText: 'Towards Woodlands North', destMode: 'auto', audioFor: null, mult: 1, phase: 0 });
  }

  function findStop(raw) {
    const m = /^(CC|TE)(\d{1,2})_?([A-D])$/i.exec(String(raw || '').trim());
    if (!m) return null;
    return STOPS.get(`${m[1].toUpperCase()}${parseInt(m[2], 10)}_${m[3].toUpperCase()}`) || null;
  }

  // The day's estimated arrivals at this platform, merged across services.
  function arrivalsFor(stop, dayOfWeek) {
    const out = [];
    stop.services.forEach(svc => {
      let t = SERVICE_START + svc.offset + svc.phase;
      while (t <= SERVICE_END) {
        out.push({ t, svc });
        t += headwayAt(stop.lineCode, t % 86400, dayOfWeek) * svc.mult;
      }
    });
    return out.sort((a, b) => a.t - b.t);
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
  let cache = { key: '', arrivals: [] };
  const lastRendered = {};
  const audioClips = new Map(); // url -> HTMLAudioElement
  let soundOn = false;
  let arrivingItem = null;

  function arrivalsForServiceDay(now) {
    // Before 03:00 counts as the previous service day (times beyond 24:00).
    const d = new Date(now);
    let secondsOfDay = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    if (d.getHours() < 3) {
      d.setDate(d.getDate() - 1);
      secondsOfDay += 86400;
    }
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (cache.key !== key) {
      cache = { key, arrivals: arrivalsFor(stop, d.getDay()) };
    }
    return { secondsOfDay, arrivals: cache.arrivals };
  }

  function renderRow(rowNum, item, secondsOfDay) {
    const dirEl = $(`train-${rowNum}-dir`);
    const prefixEl = $(`train-${rowNum}-prefix`);
    const capletEl = $(`train-${rowNum}-caplet`);
    const stationEl = $(`train-${rowNum}-station`);
    const etaEl = $(`train-${rowNum}-eta`);
    const unitEl = $(`train-${rowNum}-unit`);

    const svc = item ? item.svc : null;
    if (lastRendered[rowNum] !== svc) {
      dirEl.textContent = svc ? svc.dirText : '';
      prefixEl.textContent = svc ? svc.prefix : '';
      stationEl.textContent = svc ? svc.dest.name : '';
      buildCaplet(capletEl, svc ? svc.dest : null);
      lastRendered[rowNum] = svc;
    }

    if (!item) {
      etaEl.textContent = '';
      unitEl.textContent = '';
      return;
    }
    const mins = Math.max(1, Math.ceil((item.t - secondsOfDay) / 60));
    etaEl.textContent = mins;
    unitEl.textContent = mins === 1 ? 'min' : 'mins';
  }

  function renderArriving(svc) {
    $('arr-dir').textContent = svc.dirText;
    $('arr-prefix').textContent = svc.prefix;
    $('arr-station').textContent = svc.dest.name;
    buildCaplet($('arr-caplet'), svc.dest);
  }

  function playAnnouncement(svc) {
    if (!soundOn || !svc.audio) return;
    audioClips.forEach(a => a.pause());
    let clip = audioClips.get(svc.audio);
    if (!clip) {
      clip = new Audio(svc.audio);
      audioClips.set(svc.audio, clip);
    }
    clip.currentTime = 0;
    clip.play().catch(() => {});
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

    const { secondsOfDay, arrivals } = arrivalsForServiceDay(now);
    const upcoming = arrivals.filter(a => a.t - secondsOfDay >= -HIDE_AFTER_SECONDS);

    // Arriving screen: the next train is about to arrive, or has just arrived.
    const next = upcoming[0];
    const arriving = next !== undefined &&
      next.t - secondsOfDay <= SHOW_BEFORE_SECONDS &&
      next.t - secondsOfDay >= -HIDE_AFTER_SECONDS;

    if (arriving && arrivingItem !== next) {
      renderArriving(next.svc);
      playAnnouncement(next.svc);
    }
    arrivingItem = arriving ? next : null;

    $('view-arriving').classList.toggle('hidden', !arriving);
    $('view-schedule').classList.toggle('hidden', arriving);

    const listed = upcoming.filter(a => a.t - secondsOfDay >= 0 && a.t - secondsOfDay <= MAX_ETA_SECONDS);
    renderRow(1, listed[0] || null, secondsOfDay);
    renderRow(2, listed[1] || null, secondsOfDay);

    let note = '';
    if (upcoming.length === 0) note = 'Train service has ended';
    else if (arrivals[0].t - secondsOfDay > MAX_ETA_SECONDS) note = 'Train service has not started';
    $('service-note').textContent = note;
  }

  // Browsers block audio until the viewer interacts with the page, so sound
  // starts off and is turned on with the speaker button.
  function setupSound() {
    if (!stop.services.some(s => s.audio)) return;
    const btn = $('sound-toggle');
    btn.classList.remove('hidden');
    $('credit-audio').classList.remove('hidden');
    const update = () => {
      btn.textContent = soundOn ? '🔊' : '🔇';
      btn.title = soundOn ? 'Announcements on (click to mute)' : 'Click to enable platform announcements';
      btn.setAttribute('aria-pressed', String(soundOn));
    };
    btn.addEventListener('click', () => {
      soundOn = !soundOn;
      if (!soundOn) audioClips.forEach(a => a.pause());
      update();
    });
    update();
  }

  // ---- Picker: search box with a dropdown of platforms ----
  function stopSummary(s) {
    const dirs = [...new Set(s.services.map(v => v.dirText))];
    const dests = [...new Set(s.services.map(v => `${v.prefix} ${v.dest.name}`))];
    return dirs.length === 1
      ? `${dirs[0]} · ${dests.join(' / ')}`
      : s.services.map(v => `${v.dirText} · ${v.prefix} ${v.dest.name}`).join(' / ');
  }

  function showPicker(invalidId) {
    $('stis-screen').classList.add('hidden');
    $('picker').classList.remove('hidden');
    if (invalidId) {
      const err = $('picker-error');
      err.textContent = `Unknown stop "${invalidId}". Search for a platform below.`;
      err.classList.remove('hidden');
    }

    const entries = [...STOPS.values()]
      .sort((a, b) => a.lineCode.localeCompare(b.lineCode) || a.station.n - b.station.n || a.plat.localeCompare(b.plat))
      .map(s => ({
        stop: s,
        // Words to match against: each search term must start one of these words.
        words: [s.station.name, s.station.abbr || '', ...s.station.codes, s.line.name,
          `platform ${s.plat}`, `${s.lineCode}${s.station.n}${s.plat}`]
          .join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      }));

    const input = $('stop-search');
    const list = $('stop-results');
    let shown = [];
    let options = [];
    let active = -1;

    const go = (s) => { window.location.search = `?stop=${encodeURIComponent(s.id)}`; };

    const setActive = (i) => {
      active = i;
      options.forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
      if (i >= 0 && options[i]) {
        options[i].scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', options[i].id);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    };

    const close = () => {
      list.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      setActive(-1);
    };

    const render = () => {
      const terms = input.value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      shown = entries.filter(e => terms.every(t => e.words.some(w => w.startsWith(t)))).map(e => e.stop);
      list.replaceChildren();
      options = [];
      if (shown.length === 0) {
        const li = document.createElement('li');
        li.className = 'combo-empty';
        li.textContent = 'No matching platforms';
        list.appendChild(li);
      }
      let lastLine = '';
      shown.forEach((s, i) => {
        if (s.lineCode !== lastLine) {
          const group = document.createElement('li');
          group.className = 'combo-group';
          group.setAttribute('role', 'presentation');
          group.textContent = s.line.name;
          list.appendChild(group);
          lastLine = s.lineCode;
        }
        const li = document.createElement('li');
        li.id = `opt-${s.id}`;
        li.setAttribute('role', 'option');
        const cap = document.createElement('span');
        cap.className = 'caplet';
        buildCaplet(cap, s.station);
        const text = document.createElement('span');
        text.className = 'combo-text';
        const label = document.createElement('span');
        label.className = 'picker-label';
        label.textContent = `${s.station.name} · Platform ${s.plat}`;
        const sub = document.createElement('span');
        sub.className = 'picker-sub';
        sub.textContent = stopSummary(s);
        text.append(label, sub);
        li.append(cap, text);
        li.addEventListener('mousedown', (e) => e.preventDefault());
        li.addEventListener('click', () => go(s));
        li.addEventListener('mousemove', () => { if (active !== i) setActive(i); });
        list.appendChild(li);
        options.push(li);
      });
      list.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      setActive(terms.length && shown.length ? 0 : -1);
    };

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('blur', close);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (list.classList.contains('hidden')) render();
        if (!shown.length) return;
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        setActive((active + delta + shown.length) % shown.length);
      } else if (e.key === 'Enter') {
        if (active >= 0 && shown[active]) {
          e.preventDefault();
          go(shown[active]);
        }
      } else if (e.key === 'Escape') {
        close();
      }
    });

    input.focus();
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildNetwork();
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('stop') || params.get('stop_id');
    stop = findStop(raw);

    if (!stop) {
      showPicker(raw);
      return;
    }

    document.title = `${stop.station.name} Platform ${stop.plat} – ${stop.line.name} STIS`;
    $('platform-label').textContent = `Platform ${stop.plat}`;
    setupSound();
    tick();
    setInterval(tick, 1000);
  });
})();
