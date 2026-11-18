// STIS (Station Travel Information System) platform display.
//
// Usage:  /stis/?stop=CC15_A   (Circle Line, Bishan, Platform A)
//         /stis/?stop=TE9_B    (Thomson-East Coast Line, Caldecott, Platform B)
//         /stis/?stop=NS9_A    (any MRT line: NS, EW, CG, NE, CC, DT, TE)
//         /stis/?station=TE9   (station board: next 10 trains, all platforms)
//         /stis/               (search for a platform or station)
//
// LTA does not publish live train arrival times, so arrivals are generated from
// an approximate headway timetable (see HEADWAYS). Times are estimates only.

(() => {
  'use strict';

  // ---- Display timing (same behaviour as the reference CCL STIS) ----
  const SHOW_BEFORE_SECONDS = 30;   // switch to "arriving" screen this long before arrival
  const HIDE_AFTER_SECONDS = 15;    // keep "arriving" screen this long after arrival
  const MAX_ETA_SECONDS = 15 * 60;  // only list trains arriving within 15 minutes
  const BOARD_ROWS = 10;            // trains listed on the station board
  const BOARD_MAX_ETA_SECONDS = 60 * 60;

  // ---- Line colours ----
  const LINE_CLASS = {
    NS: 'ns', EW: 'ew', CG: 'ew', NE: 'ne', CC: 'cc', DT: 'dt', TE: 'te',
    BP: 'lrt', ST: 'lrt', PT: 'lrt'
  };
  const LINE_ORDER = ['NS', 'EW', 'NE', 'CC', 'DT', 'TE'];

  // ---- Network data ----
  // `codes` = all station codes shown on the caplet (own line first).
  // `open: false` = station not in service, skipped when generating trains.
  const LINES = {
    NS: {
      name: 'North-South Line',
      stations: [
        { n: 1, name: 'Jurong East', codes: ['NS1', 'EW24'] },
        { n: 2, name: 'Bukit Batok', codes: ['NS2'] },
        { n: 3, name: 'Bukit Gombak', codes: ['NS3'] },
        { n: 4, name: 'Choa Chu Kang', codes: ['NS4', 'BP1'] },
        { n: 5, name: 'Yew Tee', codes: ['NS5'] },
        { n: 7, name: 'Kranji', codes: ['NS7'] },
        { n: 8, name: 'Marsiling', codes: ['NS8'] },
        { n: 9, name: 'Woodlands', codes: ['NS9', 'TE2'] },
        { n: 10, name: 'Admiralty', codes: ['NS10'] },
        { n: 11, name: 'Sembawang', codes: ['NS11'] },
        { n: 12, name: 'Canberra', codes: ['NS12'] },
        { n: 13, name: 'Yishun', codes: ['NS13'] },
        { n: 14, name: 'Khatib', codes: ['NS14'] },
        { n: 15, name: 'Yio Chu Kang', codes: ['NS15'] },
        { n: 16, name: 'Ang Mo Kio', codes: ['NS16'] },
        { n: 17, name: 'Bishan', codes: ['NS17', 'CC15'] },
        { n: 18, name: 'Braddell', codes: ['NS18'] },
        { n: 19, name: 'Toa Payoh', codes: ['NS19'] },
        { n: 20, name: 'Novena', codes: ['NS20'] },
        { n: 21, name: 'Newton', codes: ['NS21', 'DT11'] },
        { n: 22, name: 'Orchard', codes: ['NS22', 'TE14'] },
        { n: 23, name: 'Somerset', codes: ['NS23'] },
        { n: 24, name: 'Dhoby Ghaut', codes: ['NS24', 'NE6', 'CC1'] },
        { n: 25, name: 'City Hall', codes: ['NS25', 'EW13'] },
        { n: 26, name: 'Raffles Place', codes: ['NS26', 'EW14'] },
        { n: 27, name: 'Marina Bay', codes: ['NS27', 'CC33', 'TE20'] },
        { n: 28, name: 'Marina South Pier', codes: ['NS28'] }
      ]
    },
    EW: {
      name: 'East-West Line',
      stations: [
        { n: 1, name: 'Pasir Ris', codes: ['EW1'] },
        { n: 2, name: 'Tampines', codes: ['EW2', 'DT32'] },
        { n: 3, name: 'Simei', codes: ['EW3'] },
        { n: 4, name: 'Tanah Merah', codes: ['EW4'] },
        { n: 5, name: 'Bedok', codes: ['EW5'] },
        { n: 6, name: 'Kembangan', codes: ['EW6'] },
        { n: 7, name: 'Eunos', codes: ['EW7'] },
        { n: 8, name: 'Paya Lebar', codes: ['EW8', 'CC9'] },
        { n: 9, name: 'Aljunied', codes: ['EW9'] },
        { n: 10, name: 'Kallang', codes: ['EW10'] },
        { n: 11, name: 'Lavender', codes: ['EW11'] },
        { n: 12, name: 'Bugis', codes: ['EW12', 'DT14'] },
        { n: 13, name: 'City Hall', codes: ['EW13', 'NS25'] },
        { n: 14, name: 'Raffles Place', codes: ['EW14', 'NS26'] },
        { n: 15, name: 'Tanjong Pagar', codes: ['EW15'] },
        { n: 16, name: 'Outram Park', codes: ['EW16', 'NE3', 'TE17'] },
        { n: 17, name: 'Tiong Bahru', codes: ['EW17'] },
        { n: 18, name: 'Redhill', codes: ['EW18'] },
        { n: 19, name: 'Queenstown', codes: ['EW19'] },
        { n: 20, name: 'Commonwealth', codes: ['EW20'] },
        { n: 21, name: 'Buona Vista', codes: ['EW21', 'CC22'] },
        { n: 22, name: 'Dover', codes: ['EW22'] },
        { n: 23, name: 'Clementi', codes: ['EW23'] },
        { n: 24, name: 'Jurong East', codes: ['EW24', 'NS1'] },
        { n: 25, name: 'Chinese Garden', codes: ['EW25'] },
        { n: 26, name: 'Lakeside', codes: ['EW26'] },
        { n: 27, name: 'Boon Lay', codes: ['EW27'] },
        { n: 28, name: 'Pioneer', codes: ['EW28'] },
        { n: 29, name: 'Joo Koon', codes: ['EW29'] },
        { n: 30, name: 'Gul Circle', codes: ['EW30'] },
        { n: 31, name: 'Tuas Crescent', codes: ['EW31'] },
        { n: 32, name: 'Tuas West Road', codes: ['EW32'] },
        { n: 33, name: 'Tuas Link', codes: ['EW33'] },
        // Changi Airport branch (shuttle from Tanah Merah)
        { n: 1, name: 'Expo', codes: ['CG1', 'DT35'] },
        { n: 2, name: 'Changi Airport', codes: ['CG2'] }
      ]
    },
    NE: {
      name: 'North East Line',
      stations: [
        { n: 1, name: 'HarbourFront', codes: ['NE1', 'CC29'] },
        { n: 3, name: 'Outram Park', codes: ['NE3', 'EW16', 'TE17'] },
        { n: 4, name: 'Chinatown', codes: ['NE4', 'DT19'] },
        { n: 5, name: 'Clarke Quay', codes: ['NE5'] },
        { n: 6, name: 'Dhoby Ghaut', codes: ['NE6', 'NS24', 'CC1'] },
        { n: 7, name: 'Little India', codes: ['NE7', 'DT12'] },
        { n: 8, name: 'Farrer Park', codes: ['NE8'] },
        { n: 9, name: 'Boon Keng', codes: ['NE9'] },
        { n: 10, name: 'Potong Pasir', codes: ['NE10'] },
        { n: 11, name: 'Woodleigh', codes: ['NE11'] },
        { n: 12, name: 'Serangoon', codes: ['NE12', 'CC13'] },
        { n: 13, name: 'Kovan', codes: ['NE13'] },
        { n: 14, name: 'Hougang', codes: ['NE14'] },
        { n: 15, name: 'Buangkok', codes: ['NE15'] },
        { n: 16, name: 'Sengkang', codes: ['NE16', 'STC'] },
        { n: 17, name: 'Punggol', codes: ['NE17', 'PTC'] },
        { n: 18, name: 'Punggol Coast', codes: ['NE18'] }
      ]
    },
    DT: {
      name: 'Downtown Line',
      stations: [
        { n: 1, name: 'Bukit Panjang', codes: ['DT1', 'BP6'] },
        { n: 2, name: 'Cashew', codes: ['DT2'] },
        { n: 3, name: 'Hillview', codes: ['DT3'] },
        { n: 4, name: 'Hume', codes: ['DT4'] },
        { n: 5, name: 'Beauty World', codes: ['DT5'] },
        { n: 6, name: 'King Albert Park', codes: ['DT6'] },
        { n: 7, name: 'Sixth Avenue', codes: ['DT7'] },
        { n: 8, name: 'Tan Kah Kee', codes: ['DT8'] },
        { n: 9, name: 'Botanic Gardens', codes: ['DT9', 'CC19'] },
        { n: 10, name: 'Stevens', codes: ['DT10', 'TE11'] },
        { n: 11, name: 'Newton', codes: ['DT11', 'NS21'] },
        { n: 12, name: 'Little India', codes: ['DT12', 'NE7'] },
        { n: 13, name: 'Rochor', codes: ['DT13'] },
        { n: 14, name: 'Bugis', codes: ['DT14', 'EW12'] },
        { n: 15, name: 'Promenade', codes: ['DT15', 'CC4'] },
        { n: 16, name: 'Bayfront', codes: ['DT16', 'CC34'] },
        { n: 17, name: 'Downtown', codes: ['DT17'] },
        { n: 18, name: 'Telok Ayer', codes: ['DT18'] },
        { n: 19, name: 'Chinatown', codes: ['DT19', 'NE4'] },
        { n: 20, name: 'Fort Canning', codes: ['DT20'] },
        { n: 21, name: 'Bencoolen', codes: ['DT21'] },
        { n: 22, name: 'Jalan Besar', codes: ['DT22'] },
        { n: 23, name: 'Bendemeer', codes: ['DT23'] },
        { n: 24, name: 'Geylang Bahru', codes: ['DT24'] },
        { n: 25, name: 'Mattar', codes: ['DT25'] },
        { n: 26, name: 'MacPherson', codes: ['DT26', 'CC10'] },
        { n: 27, name: 'Ubi', codes: ['DT27'] },
        { n: 28, name: 'Kaki Bukit', codes: ['DT28'] },
        { n: 29, name: 'Bedok North', codes: ['DT29'] },
        { n: 30, name: 'Bedok Reservoir', codes: ['DT30'] },
        { n: 31, name: 'Tampines West', codes: ['DT31'] },
        { n: 32, name: 'Tampines', codes: ['DT32', 'EW2'] },
        { n: 33, name: 'Tampines East', codes: ['DT33'] },
        { n: 34, name: 'Upper Changi', codes: ['DT34'] },
        { n: 35, name: 'Expo', codes: ['DT35', 'CG1'] },
        { n: 36, name: 'Xilin', codes: ['DT36'], open: false },
        { n: 37, name: 'Sungei Bedok', codes: ['DT37', 'TE31'], open: false }
      ]
    },
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
    NS: { peak: 150, offpeak: 300, late: 420 },
    EW: { peak: 150, offpeak: 300, late: 420 },
    CG: { peak: 360, offpeak: 420, late: 600 },
    NE: { peak: 180, offpeak: 300, late: 420 },
    DT: { peak: 180, offpeak: 300, late: 420 },
    CC: { peak: 210, offpeak: 300, late: 420 },
    TE: { peak: 240, offpeak: 330, late: 420 }
  };

  // ---- Helpers ----
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  // An MRT interchange: another MRT line's code on the caplet (LRT links don't count).
  const LRT_PREFIXES = new Set(['BP', 'ST', 'PT']);
  const isInterchange = (s) => s.codes.slice(1).some(c => !LRT_PREFIXES.has(c.slice(0, 2)));

  function isPeak(secondsOfDay, dayOfWeek) {
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const h = secondsOfDay / 3600;
    return (h >= 7 && h < 9.5) || (h >= 17.5 && h < 20);
  }

  function headwayAt(hwKey, secondsOfDay, dayOfWeek) {
    const hw = HEADWAYS[hwKey];
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
  // Other lines: one service each way, "via <next interchange>" or
  // "ends at <terminus>". Platform A runs towards higher station numbers.
  // EWL also has the Tanah Merah <-> Changi Airport branch (platform C at
  // Tanah Merah).
  //
  // A stop's id is its own-line station code plus platform, e.g. "CG1_A".
  const STOPS = new Map(); // "CC15_A" -> stop
  const stationId = (station) => station.codes[0];

  function addService({ lineCode, ordered, loop, key, platFor, dirText, destMode, audioFor, mult, phase, hw }) {
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
      const id = `${stationId(station)}_${plat}`;
      if (!STOPS.has(id)) STOPS.set(id, { id, lineCode, line, station, plat, services: [] });
      STOPS.get(id).services.push({
        key,
        dirText,
        prefix,
        dest,
        audio: audioFor ? audioFor(plat, dest) : null,
        offset: i * RUN_SECONDS_PER_STATION,
        mult,
        phase,
        hw: hw || lineCode
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

    // Straight lines: platform A towards the higher-numbered end, B back.
    const linear = (lineCode, stations, platA, platB, hw) => {
      const first = stations[0].name;
      const last = stations[stations.length - 1].name;
      addService({ lineCode, key: `${lineCode}-A`, ordered: stations, loop: false, platFor: () => platA,
        dirText: `Towards ${last}`, destMode: 'auto', audioFor: null, mult: 1, phase: 0, hw });
      addService({ lineCode, key: `${lineCode}-B`, ordered: [...stations].reverse(), loop: false,
        platFor: () => platB, dirText: `Towards ${first}`, destMode: 'auto', audioFor: null, mult: 1, phase: 0, hw });
    };
    const openOf = (lineCode, prefix) => LINES[lineCode].stations
      .filter(s => s.open !== false && stationId(s).startsWith(prefix));

    linear('NS', openOf('NS', 'NS'), 'A', 'B');
    linear('EW', openOf('EW', 'EW'), 'A', 'B');
    // Changi Airport branch: Tanah Merah (platform C) <-> Expo <-> Changi Airport.
    const tanahMerah = LINES.EW.stations.find(s => stationId(s) === 'EW4');
    const cgBranch = [tanahMerah, ...openOf('EW', 'CG')];
    addService({ lineCode: 'EW', key: 'CG-A', ordered: cgBranch, loop: false,
      platFor: (s) => (s === tanahMerah ? 'C' : 'A'), dirText: 'Towards Changi Airport', destMode: 'ends',
      audioFor: null, mult: 1, phase: 0, hw: 'CG' });
    addService({ lineCode: 'EW', key: 'CG-B', ordered: [...cgBranch].reverse(), loop: false, platFor: () => 'B',
      dirText: 'Towards Tanah Merah', destMode: 'ends', audioFor: null, mult: 1, phase: 0, hw: 'CG' });
    linear('NE', openOf('NE', 'NE'), 'A', 'B');
    linear('DT', openOf('DT', 'DT'), 'A', 'B');
    linear('TE', openOf('TE', 'TE'), 'A', 'B');

    // Order for sorting in the picker.
    LINE_ORDER.forEach((lc, li) => LINES[lc].stations.forEach((s, si) => { s.order = li * 1000 + si; }));
  }

  function findStop(raw) {
    const m = /^([A-Z]{2})(\d{1,2})_?([A-D])$/i.exec(String(raw || '').trim());
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
        t += headwayAt(svc.hw, t % 86400, dayOfWeek) * svc.mult;
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
  let dismissedItem = null; // arrival whose arriving screen was skipped with Enter

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
      cache = { key, arrivals: stop.isBoard ? boardArrivals(stop, d.getDay()) : arrivalsFor(stop, d.getDay()) };
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

  // ---- Announcement player ----
  // Announcements play one at a time. If another train arrives while one is
  // playing, its announcement waits in a queue. Enter skips to the next one.
  const announcementQueue = [];
  let nowPlaying = null;

  function clipFor(url) {
    let clip = audioClips.get(url);
    if (!clip) {
      clip = new Audio(url);
      clip.addEventListener('ended', () => { if (nowPlaying === clip) playNext(); });
      clip.addEventListener('error', () => { if (nowPlaying === clip) playNext(); });
      audioClips.set(url, clip);
    }
    return clip;
  }

  function playNext() {
    nowPlaying = null;
    const url = announcementQueue.shift();
    if (!url) return;
    const clip = clipFor(url);
    nowPlaying = clip;
    clip.currentTime = 0;
    clip.play().catch(() => playNext());
  }

  function playAnnouncement(svc) {
    if (!soundOn || !svc.audio) return;
    announcementQueue.push(svc.audio);
    if (!nowPlaying) playNext();
  }

  function stopAnnouncements() {
    announcementQueue.length = 0;
    if (nowPlaying) nowPlaying.pause();
    nowPlaying = null;
  }

  // Enter: skip the announcement that is playing (the next queued one starts).
  function skipAnnouncement() {
    if (!nowPlaying) return false;
    nowPlaying.pause();
    playNext();
    return true;
  }

  function renderClock(now, id = 'system-clock') {
    const d = new Date(now);
    $(id).textContent = Math.floor(now / 4000) % 2 === 0
      ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ---- Station board: next trains from every platform of one station ----
  // A board is a pseudo-stop whose arrivals are the merge of its platforms.
  function findBoard(raw) {
    const m = /^([A-Z]{2})(\d{1,2})$/i.exec(String(raw || '').trim());
    if (!m) return null;
    const id = `${m[1].toUpperCase()}${parseInt(m[2], 10)}`;
    const stop = [...STOPS.values()].find(s => stationId(s.station) === id);
    return stop ? boardFor(stop.station) : null;
  }

  function boardFor(station) {
    const platforms = [...STOPS.values()]
      .filter(s => s.station === station)
      .sort((a, b) => a.plat.localeCompare(b.plat));
    if (platforms.length === 0) return null;
    const { line, lineCode } = platforms[0];
    return { id: stationId(station), isBoard: true, lineCode, line, station, platforms,
      services: platforms.flatMap(p => p.services) };
  }

  function boardArrivals(board, dayOfWeek) {
    return board.platforms
      .flatMap(p => arrivalsFor(p, dayOfWeek).map(a => ({ ...a, plat: p.plat })))
      .sort((a, b) => a.t - b.t);
  }

  const boardRows = [];
  const announced = new WeakSet(); // board arrivals whose announcement has played

  function setupBoard(board) {
    $('stis-screen').classList.add('board-mode');
    $('view-schedule').classList.add('hidden');
    $('view-board').classList.remove('hidden');
    buildCaplet($('board-caplet'), board.station);
    $('board-station').textContent = board.station.name;
    const list = $('board-rows');
    for (let i = 0; i < BOARD_ROWS; i++) {
      const li = document.createElement('li');
      li.className = 'board-row';
      const plat = document.createElement('span');
      plat.className = 'board-plat';
      const dir = document.createElement('span');
      dir.className = 'board-dir';
      const dest = document.createElement('span');
      dest.className = 'board-dest';
      const prefix = document.createElement('span');
      prefix.className = 'board-prefix';
      const cap = document.createElement('span');
      cap.className = 'caplet board-caplet hidden';
      const name = document.createElement('span');
      name.className = 'board-name';
      dest.append(prefix, cap, name);
      const eta = document.createElement('span');
      eta.className = 'board-eta';
      li.append(plat, dir, dest, eta);
      list.appendChild(li);
      boardRows.push({ li, plat, dir, prefix, cap, name, eta, shown: undefined });
    }
  }

  function boardTick() {
    const now = Date.now();
    renderClock(now, 'board-clock');
    const { secondsOfDay, arrivals } = arrivalsForServiceDay(now);
    const upcoming = arrivals.filter(a =>
      a.t - secondsOfDay >= -HIDE_AFTER_SECONDS && a.t - secondsOfDay <= BOARD_MAX_ETA_SECONDS);

    boardRows.forEach((row, i) => {
      const item = upcoming[i] || null;
      if (row.shown !== item) {
        row.plat.textContent = item ? item.plat : '';
        row.dir.textContent = item ? item.svc.dirText : '';
        row.prefix.textContent = item ? item.svc.prefix : '';
        row.name.textContent = item ? item.svc.dest.name : '';
        buildCaplet(row.cap, item ? item.svc.dest : null);
        row.li.classList.toggle('board-row-empty', !item);
        row.shown = item;
      }
      if (!item) {
        row.eta.textContent = '';
        return;
      }
      const secs = item.t - secondsOfDay;
      const arriving = secs <= SHOW_BEFORE_SECONDS;
      row.li.classList.toggle('board-row-arriving', arriving);
      if (arriving && !announced.has(item)) {
        announced.add(item);
        playAnnouncement(item.svc);
      }
      if (arriving) {
        row.eta.textContent = 'Arriving';
      } else {
        const mins = Math.ceil(secs / 60);
        row.eta.textContent = `${mins} ${mins === 1 ? 'min' : 'mins'}`;
      }
    });

    let note = '';
    if (!arrivals.some(a => a.t - secondsOfDay >= -HIDE_AFTER_SECONDS)) note = 'Train service has ended';
    else if (upcoming.length === 0) note = 'Train service has not started';
    $('board-note').textContent = note;
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

    // Enter closes the arriving screen early for this train.
    const showArriving = arriving && dismissedItem !== next;
    $('view-arriving').classList.toggle('hidden', !showArriving);
    $('view-schedule').classList.toggle('hidden', showArriving);

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
  function setupSound(btnId = 'sound-toggle') {
    if (!stop.services.some(s => s.audio)) return;
    const btn = $(btnId);
    btn.classList.remove('hidden');
    $('credit-audio').classList.remove('hidden');
    const update = () => {
      btn.textContent = soundOn ? '🔊' : '🔇';
      btn.title = soundOn
        ? 'Announcements on (click to mute, Enter skips the current one)'
        : 'Click to enable platform announcements';
      btn.setAttribute('aria-pressed', String(soundOn));
    };
    btn.addEventListener('click', () => {
      soundOn = !soundOn;
      if (!soundOn) stopAnnouncements();
      update();
      btn.blur(); // so a following Enter skips announcements instead of toggling sound
    });
    update();
  }

  // Enter: skip the playing announcement; on a platform screen also close the
  // full-screen arriving view. Ignored while a button or link has focus, so
  // Enter still works on them.
  function setupEnterKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.repeat) return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT') return;
      const skipped = skipAnnouncement();
      if (!stop.isBoard && arrivingItem && dismissedItem !== arrivingItem) {
        dismissedItem = arrivingItem;
        tick();
        e.preventDefault();
      } else if (skipped) {
        e.preventDefault();
      }
    });
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

    const boards = new Map();
    STOPS.forEach(s => {
      if (!boards.has(s.station)) boards.set(s.station, boardFor(s.station));
    });
    const entries = [...boards.values(), ...STOPS.values()]
      .sort((a, b) => a.station.order - b.station.order ||
        (a.isBoard ? -1 : b.isBoard ? 1 : a.plat.localeCompare(b.plat)))
      .map(s => ({
        stop: s,
        // Words to match against: each search term must start one of these words.
        words: [s.station.name, s.station.abbr || '', ...s.station.codes, s.line.name,
          s.isBoard ? 'all platforms station board home next trains' : `platform ${s.plat}`,
          s.id.replace('_', '')]
          .join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      }));

    const input = $('stop-search');
    const list = $('stop-results');
    let shown = [];
    let options = [];
    let active = -1;

    const go = (s) => {
      window.location.search = `?${s.isBoard ? 'station' : 'stop'}=${encodeURIComponent(s.id)}`;
    };

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
        label.textContent = s.isBoard
          ? `${s.station.name} · Station board`
          : `${s.station.name} · Platform ${s.plat}`;
        const sub = document.createElement('span');
        sub.className = 'picker-sub';
        sub.textContent = s.isBoard
          ? `Next ${BOARD_ROWS} trains from all platforms`
          : stopSummary(s);
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
    const rawStation = params.get('station');
    if (rawStation) {
      stop = findBoard(rawStation);
      if (!stop) {
        showPicker(rawStation);
        return;
      }
      document.title = `${stop.station.name} – ${stop.line.name} station board`;
      setupBoard(stop);
      setupSound('board-sound');
      setupEnterKey();
      boardTick();
      setInterval(boardTick, 1000);
      return;
    }

    const raw = params.get('stop') || params.get('stop_id');
    stop = findStop(raw);

    if (!stop) {
      showPicker(raw);
      return;
    }

    document.title = `${stop.station.name} Platform ${stop.plat} – ${stop.line.name} STIS`;
    $('platform-label').textContent = `Platform ${stop.plat}`;
    setupSound();
    setupEnterKey();
    tick();
    setInterval(tick, 1000);
  });
})();
