(function () {
  'use strict';

  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  }

  var STORAGE_KEY = 'demandGenReport_v10';
  var INTRO_DISMISSED_KEY = 'demandGenIntroDismissed';
  /** Calendly URL for intro + header; change in one place to update booking links. */
  var DEMAND_GEN_CALENDLY_URL = 'https://calendly.com/ryan_carlin/30min';
  var PDF_EXPORT_FILENAME = 'exit-engine-demand-gen-report.pdf';

  /** Remove v1–v9 legacy keys once (current data lives in v10). */
  function removeLegacyDemandGenSessionKeys() {
    try {
      for (var si = 1; si <= 9; si += 1) {
        sessionStorage.removeItem('demandGenReport_v' + si);
      }
    } catch (e) {}
  }

  /** Clear all Demand Gen report keys including v10 (used by Clear Data). */
  function clearDemandGenReportSessionStorage() {
    try {
      for (var sj = 1; sj <= 10; sj += 1) {
        sessionStorage.removeItem('demandGenReport_v' + sj);
      }
    } catch (e) {}
  }

  removeLegacyDemandGenSessionKeys();
  var MAX_CHANNELS = 12;
  var GAUGE_MAX = 1.5;

  /** Distinct fills + borders for channel bubble chart (cycles if more points than entries). */
  var BUBBLE_POINT_COLORS = [
    { bg: 'rgba(79, 107, 244, 0.5)', border: '#3d5ae0' },
    { bg: 'rgba(14, 165, 233, 0.48)', border: '#0284c7' },
    { bg: 'rgba(16, 185, 129, 0.48)', border: '#059669' },
    { bg: 'rgba(245, 158, 11, 0.48)', border: '#d97706' },
    { bg: 'rgba(239, 68, 68, 0.48)', border: '#dc2626' },
    { bg: 'rgba(168, 85, 247, 0.48)', border: '#7c3aed' },
    { bg: 'rgba(236, 72, 153, 0.48)', border: '#db2777' },
    { bg: 'rgba(20, 184, 166, 0.48)', border: '#0d9488' },
    { bg: 'rgba(251, 146, 60, 0.48)', border: '#ea580c' },
    { bg: 'rgba(99, 102, 241, 0.48)', border: '#4f46e5' },
    { bg: 'rgba(34, 197, 94, 0.48)', border: '#16a34a' },
    { bg: 'rgba(234, 179, 8, 0.5)', border: '#a16207' }
  ];

  var chartInstances = [];
  var pdfExportChartInstances = [];

  function destroyCharts() {
    chartInstances.forEach(function (c) {
      try { c.destroy(); } catch (e) {}
    });
    chartInstances = [];
  }

  function dismissIntroShowWizard() {
    try {
      sessionStorage.setItem(INTRO_DISMISSED_KEY, '1');
    } catch (e) {}
    var intro = document.getElementById('intro-landing');
    var wiz = document.getElementById('wizard-view');
    if (intro) intro.classList.add('hidden');
    if (wiz) wiz.classList.remove('hidden');
    showSlide(1);
    var first = document.getElementById('totalSmSpend');
    if (first) {
      try {
        first.focus();
      } catch (e2) {}
    }
  }

  /** Wipe session, optional dashboard, and all wizard + calculator inputs; one blank channel row. */
  function clearAllWizardData() {
    clearDemandGenReportSessionStorage();
    destroyCharts();
    var dash = document.getElementById('dashboard-view');
    var wiz = document.getElementById('wizard-view');
    if (dash) dash.classList.add('hidden');
    if (wiz) wiz.classList.remove('hidden');
    document.querySelectorAll('#wizard-view input').forEach(function (inp) {
      inp.value = '';
    });
    ['calcAd', 'calcSalaries', 'calcSoftware', 'calcOverhead'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var cr = document.getElementById('channel-rows');
    if (cr) cr.innerHTML = '';
    addChannelRow(null, 0);
    syncRemoveButtons();
    clearFieldErrors();
    closeModal();
    showSlide(1);
    updateCalcSum();
    try {
      saveSession();
    } catch (e2) {}
  }

  function parseNum(el) {
    if (!el) return NaN;
    return parseFloat(String(el.value).replace(/,/g, ''), 10);
  }

  function fmtMoney(n) {
    if (n == null || !isFinite(n)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  function fmtMoney2(n) {
    if (n == null || !isFinite(n)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  }

  function fmtNum(n, d) {
    d = d == null ? 2 : d;
    if (n == null || !isFinite(n)) return '—';
    return Number(n).toFixed(d);
  }

  function safeDiv(a, b) {
    if (!isFinite(a) || !isFinite(b) || b === 0) return null;
    return a / b;
  }

  /** LTV:CAC = CLTV ÷ CAC (customer lifetime value ÷ acquisition cost per won customer). */
  function formatChannelLtvCacRatio(ltvPerCustomer, cacPerWon) {
    if (cacPerWon == null || !isFinite(cacPerWon) || cacPerWon <= 0) return '—';
    if (ltvPerCustomer == null || !isFinite(ltvPerCustomer)) return '—';
    var ratio = ltvPerCustomer / cacPerWon;
    if (!isFinite(ratio)) return '—';
    var r1 = Math.round(ratio * 10) / 10;
    if (Math.abs(r1 - Math.round(r1)) < 1e-9) return Math.round(r1) + ':1';
    return r1.toFixed(1) + ':1';
  }

  function velocityFrom(s) {
    var arpu = safeDiv(s.newArr, s.newCustomers);
    var win = s.winRate / 100;
    if (arpu == null || !isFinite(s.qualifiedOpps) || !isFinite(win) || s.salesCycle < 1) return null;
    return (s.qualifiedOpps * win * arpu) / s.salesCycle;
  }

  function collectFormState() {
    var channels = [];
    document.querySelectorAll('.channel-block').forEach(function (block) {
      var os = parseNum(block.querySelector('.ch-other'));
      var ltvInp = block.querySelector('.ch-ltv');
      var ltvStr = ltvInp && String(ltvInp.value).trim();
      var channelLtv = null;
      if (ltvStr !== '') {
        var ln = parseNum(ltvInp);
        channelLtv = isFinite(ln) && ln >= 0 ? ln : null;
      }
      channels.push({
        name: (block.querySelector('.ch-name') || {}).value.trim(),
        spend: parseNum(block.querySelector('.ch-spend')),
        otherSpend: isFinite(os) && os >= 0 ? os : 0,
        opps: parseNum(block.querySelector('.ch-opps')),
        channelLtv: channelLtv
      });
    });
    return {
      totalSmSpend: parseNum(document.getElementById('totalSmSpend')),
      newArr: parseNum(document.getElementById('newArr')),
      newCustomers: parseNum(document.getElementById('newCustomers')),
      grossMargin: parseNum(document.getElementById('grossMargin')),
      annualChurn: parseNum(document.getElementById('annualChurn')),
      revM2: parseNum(document.getElementById('revM2')),
      fcfM2: parseNum(document.getElementById('fcfM2')),
      revM1: parseNum(document.getElementById('revM1')),
      fcfM1: parseNum(document.getElementById('fcfM1')),
      revM0: parseNum(document.getElementById('revM0')),
      fcfM0: parseNum(document.getElementById('fcfM0')),
      qualifiedOpps: parseNum(document.getElementById('qualifiedOpps')),
      winRate: parseNum(document.getElementById('winRate')),
      salesCycle: parseNum(document.getElementById('salesCycle')),
      qualM1: parseNum(document.getElementById('qualM1')),
      winM1: parseNum(document.getElementById('winM1')),
      acvM1: parseNum(document.getElementById('acvM1')),
      cycleM1: parseNum(document.getElementById('cycleM1')),
      qualM2: parseNum(document.getElementById('qualM2')),
      winM2: parseNum(document.getElementById('winM2')),
      acvM2: parseNum(document.getElementById('acvM2')),
      cycleM2: parseNum(document.getElementById('cycleM2')),
      channels: channels
    };
  }

  function computeMetrics(s) {
    var N = s.newCustomers;
    var spend = s.totalSmSpend;
    var newArr = s.newArr;
    var gm = s.grossMargin / 100;
    var churnMonthlyTerm = (s.annualChurn / 100) / 12;

    var arpuAnnual = safeDiv(newArr, N);
    var ltv = null;
    if (arpuAnnual != null && churnMonthlyTerm > 0) ltv = (arpuAnnual * gm) / churnMonthlyTerm;

    var cac = safeDiv(spend, N);
    var monthlyGross = null;
    if (arpuAnnual != null && gm > 0) monthlyGross = (arpuAnnual / 12) * gm;
    var paybackMonths = safeDiv(cac, monthlyGross);

    /** Rule of 40 (standard): annual revenue growth % (YoY) + FCF margin % — both in percentage points (e.g. 25 + 15 = 40). */
    var rule40Current = (isFinite(s.revM0) && isFinite(s.fcfM0)) ? (s.revM0 + s.fcfM0) : null;
    var magic = safeDiv(newArr, spend);
    var ltvCac = (ltv != null && cac != null && cac > 0) ? (ltv / cac) : null;

    var pipeVel = velocityFrom(s);

    var winBlend = isFinite(s.winRate) ? s.winRate / 100 : null;

    var prelim = (s.channels || []).map(function (ch) {
      var ad = isFinite(ch.spend) ? Math.max(0, ch.spend) : 0;
      var other = isFinite(ch.otherSpend) ? Math.max(0, ch.otherSpend) : 0;
      var o = isFinite(ch.opps) ? ch.opps : 0;
      var totalCh = ad + other;
      var chLtv = ch.channelLtv;
      var ltvPerCustomer = (chLtv != null && isFinite(chLtv) && chLtv >= 0) ? chLtv : ltv;
      var estimatedWins = (winBlend != null && isFinite(o) && o >= 0) ? o * winBlend : null;
      var cacPerWon = (estimatedWins != null && estimatedWins > 0) ? safeDiv(totalCh, estimatedWins) : null;
      return {
        name: ch.name || '—',
        directSpend: ad,
        otherSpend: other,
        totalSpend: totalCh,
        opps: o,
        ltvPerCustomer: ltvPerCustomer,
        estimatedWins: estimatedWins,
        cacPerWon: cacPerWon
      };
    });

    var channelRows = prelim.map(function (r) {
      return {
        name: r.name,
        directSpend: r.directSpend,
        otherSpend: r.otherSpend,
        totalSpend: r.totalSpend,
        opps: r.opps,
        ltvPerCustomer: r.ltvPerCustomer,
        estimatedWins: r.estimatedWins,
        cacPerWon: r.cacPerWon
      };
    });

    var bubblePoints = channelRows.filter(function (r) {
      return r.cacPerWon != null && isFinite(r.cacPerWon) && r.cacPerWon > 0 &&
        r.ltvPerCustomer != null && isFinite(r.ltvPerCustomer) && r.opps > 0;
    });

    var paybackSeries = { labels: [], values: [], paybackIdx: null };
    if (cac != null && monthlyGross != null && monthlyGross > 0) {
      var cum = -cac;
      var i = 0;
      paybackSeries.values.push(cum);
      paybackSeries.labels.push('0');
      while (i < 48 && cum < 0) {
        i += 1;
        cum += monthlyGross;
        paybackSeries.values.push(cum);
        paybackSeries.labels.push(String(i));
        if (paybackSeries.paybackIdx == null && cum >= 0) paybackSeries.paybackIdx = i;
      }
      if (paybackSeries.paybackIdx == null) {
        paybackSeries.values.push(cum + monthlyGross);
        paybackSeries.labels.push(String(i + 1));
      }
      var cumEnd = paybackSeries.values[paybackSeries.values.length - 1];
      var monthEnd = parseInt(paybackSeries.labels[paybackSeries.labels.length - 1], 10);
      while (monthEnd < 18) {
        monthEnd += 1;
        cumEnd += monthlyGross;
        paybackSeries.values.push(cumEnd);
        paybackSeries.labels.push(String(monthEnd));
      }
    }

    function velAt(qual, wr, acv, cyc) {
      if (!isFinite(qual) || !isFinite(wr) || !isFinite(acv) || !isFinite(cyc) || cyc < 1) return null;
      return (qual * (wr / 100) * acv) / cyc;
    }

    var acv0 = arpuAnnual;
    var v0 = pipeVel;
    var v1 = velAt(s.qualM1, s.winM1, s.acvM1, s.cycleM1);
    var v2 = velAt(s.qualM2, s.winM2, s.acvM2, s.cycleM2);
    var velTrend = [
      v2 != null ? v2 : v0,
      v1 != null ? v1 : v0,
      v0
    ];

    function arrow(cur, prev) {
      if (!isFinite(cur) || !isFinite(prev)) return '—';
      if (cur > prev) return '↑';
      if (cur < prev) return '↓';
      return '→';
    }

    var acvForLever = acv0;
    var cycleArrow = '—';
    if (isFinite(s.cycleM1) && isFinite(s.salesCycle)) {
      cycleArrow = s.salesCycle < s.cycleM1 ? '↑' : (s.salesCycle > s.cycleM1 ? '↓' : '→');
    }
    var leverRows = [
      { k: 'Qual. ops', cur: s.qualifiedOpps, arrow: arrow(s.qualifiedOpps, s.qualM1) },
      { k: 'Win %', cur: s.winRate, arrow: arrow(s.winRate, s.winM1) },
      { k: 'ACV ($)', cur: acvForLever, arrow: arrow(acvForLever, s.acvM1) },
      { k: 'Cycle (days)', cur: s.salesCycle, arrow: cycleArrow }
    ];

    return {
      ltv: ltv,
      cac: cac,
      ltvCac: ltvCac,
      paybackMonths: paybackMonths,
      rule40: rule40Current,
      magic: magic,
      pipeVel: pipeVel,
      channelRows: channelRows,
      bubblePoints: bubblePoints,
      rule40RevYoy: [s.revM2, s.revM1, s.revM0],
      rule40FcfMargin: [s.fcfM2, s.fcfM1, s.fcfM0],
      paybackSeries: paybackSeries,
      monthlyGross: monthlyGross,
      velTrend: velTrend,
      leverRows: leverRows,
      state: s
    };
  }

  var currentStep = 1;

  function updateStepper() {
    document.querySelectorAll('.step-dot').forEach(function (dot) {
      var sn = parseInt(dot.getAttribute('data-step'), 10);
      dot.classList.remove('step-done', 'step-active', 'step-todo');
      if (sn < currentStep) dot.classList.add('step-done');
      else if (sn === currentStep) dot.classList.add('step-active');
      else dot.classList.add('step-todo');
    });
  }

  function showSlide(n) {
    currentStep = n;
    document.querySelectorAll('.slide').forEach(function (sl) {
      sl.classList.toggle('hidden', parseInt(sl.getAttribute('data-slide'), 10) !== n);
      sl.classList.toggle('block', parseInt(sl.getAttribute('data-slide'), 10) === n);
    });
    var back = document.getElementById('btnBack');
    var next = document.getElementById('btnNext');
    back.classList.toggle('invisible', n === 1);
    next.textContent = n === 3 ? 'Generate report' : 'Next';
    updateStepper();
  }

  function clearFieldErrors() {
    document.querySelectorAll('.field.has-error').forEach(function (f) { f.classList.remove('has-error'); });
    var ce = document.getElementById('channel-form-error');
    ce.textContent = '';
    ce.classList.add('hidden');
  }

  function validateSlide1() {
    var ok = true;
    function mark(id, cond) {
      if (!cond) { document.getElementById(id).classList.add('has-error'); ok = false; }
    }
    mark('field-totalSmSpend', parseNum(document.getElementById('totalSmSpend')) > 0);
    mark('field-newArr', parseNum(document.getElementById('newArr')) >= 0 && isFinite(parseNum(document.getElementById('newArr'))));
    mark('field-newCustomers', parseNum(document.getElementById('newCustomers')) > 0);
    var gm = parseNum(document.getElementById('grossMargin'));
    mark('field-grossMargin', gm >= 0 && gm <= 100);
    var ch = parseNum(document.getElementById('annualChurn'));
    mark('field-annualChurn', ch > 0 && ch <= 100);
    ['revM2', 'fcfM2', 'revM1', 'fcfM1', 'revM0', 'fcfM0'].forEach(function (id) {
      mark('field-' + id, isFinite(parseNum(document.getElementById(id))));
    });
    return ok;
  }

  function validateSlide2() {
    var ok = true;
    function mark(id, cond) {
      if (!cond) { document.getElementById(id).classList.add('has-error'); ok = false; }
    }
    mark('field-qualifiedOpps', parseNum(document.getElementById('qualifiedOpps')) >= 0);
    var wr = parseNum(document.getElementById('winRate'));
    mark('field-winRate', wr >= 0 && wr <= 100);
    mark('field-salesCycle', parseNum(document.getElementById('salesCycle')) >= 1);
    return ok;
  }

  function validateSlide3() {
    var err = document.getElementById('channel-form-error');
    var blocks = document.querySelectorAll('.channel-block');
    if (blocks.length < 1) {
      err.textContent = 'Add at least one channel.';
      err.classList.remove('hidden');
      return false;
    }
    var ok = true;
    blocks.forEach(function (block) {
      var name = block.querySelector('.ch-name');
      var spend = parseNum(block.querySelector('.ch-spend'));
      var otherEl = block.querySelector('.ch-other');
      var otherStr = otherEl && String(otherEl.value).trim() !== '' ? String(otherEl.value).trim() : '';
      var otherNum = otherStr !== '' && otherEl ? parseNum(otherEl) : 0;
      var opps = parseNum(block.querySelector('.ch-opps'));
      var ltvEl = block.querySelector('.ch-ltv');
      var ltvStr = ltvEl && String(ltvEl.value).trim();
      if (!name || !name.value.trim()) ok = false;
      if (!isFinite(spend) || spend < 0) ok = false;
      if (otherStr !== '' && (!isFinite(otherNum) || otherNum < 0)) ok = false;
      if (!isFinite(opps) || opps < 0 || opps !== Math.floor(opps)) ok = false;
      if (ltvStr !== '') {
        var ltn = parseNum(ltvEl);
        if (!isFinite(ltn) || ltn < 0) ok = false;
      }
    });
    if (!ok) {
      err.textContent = 'Each channel needs a name and valid numbers.';
      err.classList.remove('hidden');
    }
    return ok;
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function refreshChannelBlockSummary(block) {
    var nameEl = block.querySelector('.ch-name');
    var name = (nameEl && nameEl.value) ? nameEl.value.trim() : '';
    if (!name) name = 'Untitled channel';
    var deals = block.querySelector('.ch-opps') ? parseNum(block.querySelector('.ch-opps')) : NaN;
    var spEl = block.querySelector('.ch-spend');
    var sp = spEl ? parseNum(spEl) : NaN;
    var otEl = block.querySelector('.ch-other');
    var otStr = otEl && String(otEl.value).trim() !== '' ? String(otEl.value).trim() : '';
    var ot = otStr !== '' && otEl ? parseNum(otEl) : 0;
    if (!isFinite(ot)) ot = 0;
    var sp0 = isFinite(sp) && sp >= 0 ? sp : 0;
    var total = sp0 + ot;
    var sn = block.querySelector('.ch-summary-name');
    var sm = block.querySelector('.ch-summary-meta');
    if (sn) sn.textContent = name;
    if (sm) {
      var dPart = isFinite(deals) && deals >= 0 ? Math.round(deals) + ' deals' : '— deals';
      sm.textContent = '· ' + dPart + ' · ' + fmtMoney(total) + ' total spend';
    }
  }

  function syncChannelIndices() {
    document.querySelectorAll('.channel-block').forEach(function (b, i) {
      var el = b.querySelector('.ch-idx');
      if (el) el.textContent = 'Channel ' + (i + 1);
    });
  }

  function addChannelRow(data, index) {
    var wrap = document.createElement('div');
    wrap.className = 'channel-block relative border border-[#d1d5db] rounded-lg mb-3 bg-white overflow-hidden';
    var an = data && data.name ? escapeAttr(data.name) : '';
    var avs = data && isFinite(data.spend) ? data.spend : '';
    var otherRaw = data && isFinite(data.otherSpend) ? data.otherSpend : null;
    var avOther = otherRaw != null && otherRaw > 0 ? otherRaw : '';
    var avo = data && isFinite(data.opps) ? data.opps : '';
    var ltvRaw = data && isFinite(data.channelLtv) && data.channelLtv >= 0 ? data.channelLtv : null;
    var avLtv = ltvRaw != null ? String(ltvRaw) : '';
    wrap.innerHTML =
      '<div class="flex items-stretch">' +
      '<button type="button" class="ch-toggle flex-1 flex items-start gap-2.5 px-3 py-3 text-left hover:bg-gray-50/80 min-w-0 cursor-pointer border-0 bg-transparent font-inherit rounded-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-eeblue/40" aria-expanded="false">' +
      '<span class="ch-chevron" aria-hidden="true">▸</span>' +
      '<div class="min-w-0 flex-1">' +
      '<div class="text-xs text-[#888780] mb-0.5"><span class="ch-idx">Channel ' + (index + 1) + '</span></div>' +
      '<div class="text-sm font-semibold text-[#1a1a1a] truncate ch-summary-name"></div>' +
      '<div class="text-xs text-[#888780] ch-summary-meta mt-0.5"></div>' +
      '</div>' +
      '</button>' +
      '<button type="button" class="channel-remove shrink-0 px-3 py-3 text-sm font-semibold text-red-500 bg-transparent border-0 border-l border-gray-100 cursor-pointer hover:bg-red-50/50">Remove</button>' +
      '</div>' +
      '<div class="ch-body hidden px-3 pb-4 pt-3 border-t border-gray-100 bg-white">' +
      '<div class="field mb-3"><label class="block text-sm font-medium mb-1">Channel name</label><input type="text" class="ch-name w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="e.g. Paid search" value="' + an + '"></div>' +
      '<div class="field mb-3"><label class="block text-sm font-medium mb-1">Direct ad spend ($)</label><input type="number" class="ch-spend w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" min="0" step="0.01" value="' + avs + '"></div>' +
      '<div class="field mb-3"><label class="block text-sm font-medium mb-1">Other spend (optional, $)</label><input type="number" class="ch-other w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" min="0" step="0.01" placeholder="e.g. tools, contractors" value="' + avOther + '"></div>' +
      '<div class="field mb-3"><label class="block text-sm font-medium mb-1">Deals (count)</label><input type="number" class="ch-opps w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" min="0" step="1" value="' + avo + '"></div>' +
      '<div class="field mb-0"><label class="block text-sm font-medium mb-1">Channel CLTV (optional, $)</label><input type="number" class="ch-ltv w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" min="0" step="0.01" placeholder="Uses blended CLTV if blank" value="' + avLtv + '"><p class="text-[11px] text-[#888780] mt-1.5 leading-snug">Customer lifetime value for this channel. Leave blank to use blended CLTV from slide 1.</p></div>' +
      '</div>';

    var body = wrap.querySelector('.ch-body');
    var toggleBtn = wrap.querySelector('.ch-toggle');
    toggleBtn.addEventListener('click', function () {
      body.classList.toggle('hidden');
      var expanded = !body.classList.contains('hidden');
      wrap.classList.toggle('is-expanded', expanded);
      toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });

    wrap.querySelector('.channel-remove').addEventListener('click', function () {
      if (document.querySelectorAll('.channel-block').length <= 1) return;
      wrap.remove();
      syncRemoveButtons();
      saveSession();
    });
    wrap.querySelectorAll('.ch-body input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        refreshChannelBlockSummary(wrap);
        saveSession();
      });
    });
    document.getElementById('channel-rows').appendChild(wrap);
    refreshChannelBlockSummary(wrap);
    syncChannelIndices();
    syncRemoveButtons();
  }

  function syncRemoveButtons() {
    var blocks = document.querySelectorAll('.channel-block');
    blocks.forEach(function (b) {
      var rm = b.querySelector('.channel-remove');
      if (!rm) return;
      rm.disabled = blocks.length <= 1;
      rm.style.opacity = blocks.length <= 1 ? '0.35' : '1';
    });
    document.getElementById('addChannelBtn').disabled = blocks.length >= MAX_CHANNELS;
    syncChannelIndices();
  }

  function buildMagicGauge(magic) {
    var ctx = document.getElementById('chartMagic');
    if (!ctx) return;
    var v = magic != null && isFinite(magic) ? Math.min(Math.max(magic, 0), GAUGE_MAX) : 0;
    var magicNeedlePlugin = {
      id: 'magicNeedle',
      afterDraw: function (chart) {
        var meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length < 1) return;
        var arc0 = meta.data[0];
        var arcN = meta.data[meta.data.length - 1];
        var x = arc0.x;
        var y = arc0.y;
        var innerR = arc0.innerRadius;
        var outerR = arc0.outerRadius;
        if (!isFinite(x) || !isFinite(y) || !isFinite(innerR) || !isFinite(outerR)) return;
        var span = arcN.endAngle - arc0.startAngle;
        if (!isFinite(span) || span <= 0) return;
        var theta = arc0.startAngle + (v / GAUGE_MAX) * span;
        var c = chart.ctx;
        var band = outerR - innerR;
        c.save();
        c.strokeStyle = '#1a1a1a';
        c.lineWidth = Math.max(2, Math.min(4, band * 0.14));
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x + Math.cos(theta) * innerR, y + Math.sin(theta) * innerR);
        c.lineTo(x + Math.cos(theta) * outerR, y + Math.sin(theta) * outerR);
        c.stroke();
        c.restore();
      }
    };
    var ch = new Chart(ctx, {
      type: 'doughnut',
      plugins: [magicNeedlePlugin],
      data: {
        labels: ['Weak', 'Decent', 'Strong'],
        datasets: [{
          data: [0.75, 0.25, 0.5],
          backgroundColor: ['#fecaca', '#fde68a', '#bbf7d0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        rotation: -90,
        circumference: 180,
        animation: { duration: 0 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
    chartInstances.push(ch);
    document.getElementById('gaugeValue').textContent = magic != null && isFinite(magic) ? fmtNum(magic, 2) : '—';
    var z = document.getElementById('gaugeZones');
    if (z) z.innerHTML = '<span class="text-red-600">Weak 0–0.75</span> · <span class="text-amber-600">Decent 0.75–1.0</span> · <span class="text-green-700">Strong 1.0–1.5+</span>';
  }

  function buildRule40Chart(m) {
    var ctx = document.getElementById('chartRule40');
    if (!ctx) return;
    var labels = ['Month 1', 'Month 2', 'Current'];
    var ch = new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          { type: 'bar', label: 'YoY revenue growth', data: m.rule40RevYoy, backgroundColor: '#4f6bf4', stack: 's', order: 2 },
          { type: 'bar', label: 'FCF margin', data: m.rule40FcfMargin, backgroundColor: '#e24b4a', stack: 's', order: 2 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            grid: { color: '#e5e7eb' },
            ticks: {
              callback: function (val) {
                return val + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            align: 'center',
            labels: { boxWidth: 12, padding: 16 }
          }
        }
      }
    });
    chartInstances.push(ch);
  }

  function buildPaybackChart(m) {
    var ctx = document.getElementById('chartPayback');
    if (!ctx || !m.paybackSeries.values.length) return;
    var ps = m.paybackSeries;
    var vals = ps.values;
    var labs = ps.labels.map(function (lb) { return parseInt(lb, 10); });
    var p = -1;
    var i;
    for (i = 0; i < vals.length - 1; i++) {
      if (vals[i] < 0 && vals[i + 1] >= 0) {
        p = i;
        break;
      }
    }
    var redPts = [];
    var bluePts = [];
    var linePts = [];
    var xCross = null;
    if (vals[0] >= 0) {
      for (i = 0; i < vals.length; i++) {
        linePts.push({ x: labs[i], y: vals[i] });
        bluePts.push({ x: labs[i], y: vals[i] });
      }
    } else if (p === -1) {
      for (i = 0; i < vals.length; i++) {
        linePts.push({ x: labs[i], y: vals[i] });
        redPts.push({ x: labs[i], y: vals[i] });
      }
    } else {
      var denom = vals[p + 1] - vals[p];
      var t = Math.abs(denom) < 1e-9 ? 1 : (0 - vals[p]) / denom;
      xCross = labs[p] + t * (labs[p + 1] - labs[p]);
      for (i = 0; i <= p; i++) {
        redPts.push({ x: labs[i], y: vals[i] });
        linePts.push({ x: labs[i], y: vals[i] });
      }
      redPts.push({ x: xCross, y: 0 });
      linePts.push({ x: xCross, y: 0 });
      bluePts.push({ x: xCross, y: 0 });
      for (i = p + 1; i < vals.length; i++) {
        bluePts.push({ x: labs[i], y: vals[i] });
        linePts.push({ x: labs[i], y: vals[i] });
      }
    }
    var linePointRadius = linePts.map(function (pt) {
      return (xCross != null && Math.abs(pt.x - xCross) < 1e-4 && Math.abs(pt.y) < 1e-4) ? 8 : 0;
    });
    var fillBase = {
      borderWidth: 0,
      pointRadius: 0,
      tension: 0.2,
      fill: { target: 'origin' },
      order: 0
    };
    var lineDs = {
      label: 'Cumulative gross profit ($)',
      data: linePts,
      borderColor: '#4f6bf4',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.2,
      pointRadius: linePointRadius,
      order: 1
    };
    var datasets = [];
    if (redPts.length) {
      datasets.push(Object.assign({}, fillBase, {
        label: 'Before payback',
        data: redPts,
        backgroundColor: 'rgba(226, 75, 74, 0.15)'
      }));
    }
    if (bluePts.length) {
      datasets.push(Object.assign({}, fillBase, {
        label: 'After payback',
        data: bluePts,
        backgroundColor: 'rgba(79, 107, 244, 0.15)'
      }));
    }
    datasets.push(lineDs);
    var lineIdx = datasets.length - 1;
    var ch = new Chart(ctx, {
      type: 'line',
      data: { datasets: datasets },
      options: {
        parsing: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            min: 0,
            grid: { color: '#e5e7eb' },
            ticks: { stepSize: 1, maxTicksLimit: 24 }
          },
          y: {
            grid: { color: '#e5e7eb' },
            ticks: { callback: function (val) { return fmtMoney(val); } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: function (ti) { return ti.datasetIndex === lineIdx; },
            callbacks: {
              label: function (c) { return fmtMoney2(c.parsed.y); }
            }
          }
        }
      }
    });
    chartInstances.push(ch);
  }

  function buildVelocityChart(m) {
    var ctx = document.getElementById('chartVelocity');
    if (!ctx) return;
    var ch = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Month 1', 'Month 2', 'Current'],
        datasets: [{
          label: '$ / day',
          data: m.velTrend,
          borderColor: '#4f6bf4',
          backgroundColor: 'rgba(79,107,244,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { grid: { color: '#e5e7eb' } } },
        plugins: { legend: { display: false } }
      }
    });
    chartInstances.push(ch);
  }

  function buildBubbleChart(m) {
    var ctx = document.getElementById('chartBubble');
    if (!ctx) return;
    var pts = m.bubblePoints || [];
    if (!pts.length) return;
    var maxOp = Math.max.apply(null, pts.map(function (p) { return p.opps; })) || 1;
    var xs = pts.map(function (p) { return p.cacPerWon; });
    var ys = pts.map(function (p) { return p.ltvPerCustomer; });
    var maxX = Math.max.apply(null, xs);
    var maxY = Math.max.apply(null, ys);
    var xPad = Math.max(maxX * 0.12, maxX * 0.05 + 1, 500);
    var yPad = Math.max(maxY * 0.12, maxY * 0.05 + 1, 1000);
    var xMax = Math.max(maxX + xPad, 100);
    var yMax = Math.max(maxY + yPad, 100);
    var bubbleData = pts.map(function (p) {
      return {
        x: p.cacPerWon,
        y: p.ltvPerCustomer,
        r: 6 + (p.opps / maxOp) * 26,
        channelName: p.name,
        channelOpps: p.opps
      };
    });
    var bubbleBg = bubbleData.map(function (_, i) {
      return BUBBLE_POINT_COLORS[i % BUBBLE_POINT_COLORS.length].bg;
    });
    var bubbleBorder = bubbleData.map(function (_, i) {
      return BUBBLE_POINT_COLORS[i % BUBBLE_POINT_COLORS.length].border;
    });
    var bubbleDs = {
      type: 'bubble',
      label: 'Channels',
      data: bubbleData,
      backgroundColor: bubbleBg,
      borderColor: bubbleBorder,
      borderWidth: 2,
      order: 1
    };
    var ch = new Chart(ctx, {
      data: { datasets: [bubbleDs] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'CAC ($)' },
            min: 0,
            suggestedMax: xMax,
            grid: { color: '#e5e7eb' },
            ticks: { callback: function (v) { return fmtMoney(v); } }
          },
          y: {
            type: 'linear',
            title: { display: true, text: 'CLTV ($)' },
            min: 0,
            suggestedMax: yMax,
            grid: { color: '#e5e7eb' },
            ticks: { callback: function (v) { return fmtMoney(v); } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function () { return ''; },
              label: function (c) {
                var raw = c.raw;
                if (!raw || raw.channelName == null) return [];
                return [
                  raw.channelName,
                  'CAC: ' + fmtMoney2(raw.x),
                  'CLTV: ' + fmtMoney2(raw.y),
                  'Deals: ' + String(Math.round(raw.channelOpps || 0))
                ];
              }
            }
          }
        }
      }
    });
    chartInstances.push(ch);
  }

  function renderDashboard(m) {
    destroyCharts();
    buildMagicGauge(m.magic);
    buildRule40Chart(m);
    buildPaybackChart(m);
    document.getElementById('statCAC').textContent = m.cac != null ? fmtMoney(m.cac) : '—';
    document.getElementById('statMRR').textContent = m.state && m.state.newCustomers > 0 ? fmtMoney2(m.state.newArr / m.state.newCustomers / 12) : '—';
    document.getElementById('statGM').textContent = isFinite(m.state.grossMargin) ? fmtNum(m.state.grossMargin, 1) + '%' : '—';
    document.getElementById('statPB').textContent = m.paybackMonths != null ? fmtNum(m.paybackMonths, 1) + ' mo' : '—';

    document.getElementById('kpiSubMagic').textContent = 'New ARR ' + fmtMoney(m.state.newArr) + ' · S&M ' + fmtMoney(m.state.totalSmSpend);

    document.getElementById('heroVelocity').textContent = m.pipeVel != null ? fmtMoney2(m.pipeVel) + '/day' : '—';
    buildVelocityChart(m);

    var levers = document.getElementById('leverList');
    levers.innerHTML = '';
    m.leverRows.forEach(function (row) {
      var val = row.k.indexOf('ACV') >= 0 ? fmtMoney(row.cur) : (row.k.indexOf('Win') >= 0 ? fmtNum(row.cur, 1) + '%' : String(row.cur));
      var div = document.createElement('div');
      div.className = 'flex items-center justify-between rounded-lg border border-[#d1d5db] px-3 py-2 text-xs bg-white';
      div.innerHTML = '<span class="font-semibold text-[#1a1a1a]">' + escapeHtml(row.k) + '</span><span>' + escapeHtml(val) + ' <span class="text-[#4f6bf4]">' + escapeHtml(row.arrow) + '</span></span>';
      levers.appendChild(div);
    });

    buildBubbleChart(m);

    var tb = document.getElementById('channel-table-body');
    var tf = document.getElementById('channel-table-foot');
    tb.innerHTML = '';
    if (tf) tf.innerHTML = '';
    m.channelRows.forEach(function (row) {
      var dealsShown = isFinite(row.opps) && row.opps >= 0 ? String(Math.round(row.opps)) : '—';
      var cltv = row.ltvPerCustomer != null && isFinite(row.ltvPerCustomer) ? row.ltvPerCustomer : null;
      var cac = row.cacPerWon != null && isFinite(row.cacPerWon) ? row.cacPerWon : null;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="font-medium px-3 py-1 align-middle">' + escapeHtml(row.name) + '</td>' +
        '<td class="px-3 py-1 text-right tabular-nums align-middle">' + dealsShown + '</td>' +
        '<td class="px-3 py-1 text-right tabular-nums align-middle">' + (cltv != null ? fmtMoney(cltv) : '—') + '</td>' +
        '<td class="px-3 py-1 text-right tabular-nums align-middle">' + (cac != null ? fmtMoney(cac) : '—') + '</td>' +
        '<td class="px-3 py-1 text-right tabular-nums align-middle whitespace-nowrap">' + formatChannelLtvCacRatio(row.ltvPerCustomer, row.cacPerWon) + '</td>';
      tb.appendChild(tr);
    });
  }

  function persistToForm(state) {
    if (!state) return;
    function setv(id, v) {
      var el = document.getElementById(id);
      if (!el) return;
      if (v != null && v !== '' && (typeof v === 'string' || isFinite(v))) el.value = v;
    }
    setv('totalSmSpend', state.totalSmSpend);
    setv('newArr', state.newArr);
    setv('newCustomers', state.newCustomers);
    setv('grossMargin', state.grossMargin);
    setv('annualChurn', state.annualChurn);
    setv('revM2', state.revM2);
    setv('fcfM2', state.fcfM2);
    setv('revM1', state.revM1);
    setv('fcfM1', state.fcfM1);
    setv('revM0', state.revM0);
    setv('fcfM0', state.fcfM0);
    if (state.revenueGrowth != null && !isFinite(state.revM0)) setv('revM0', state.revenueGrowth);
    if (state.profitMargin != null && !isFinite(state.fcfM0)) setv('fcfM0', state.profitMargin);
    setv('qualifiedOpps', state.qualifiedOpps);
    setv('winRate', state.winRate);
    setv('salesCycle', state.salesCycle);
    setv('qualM1', state.qualM1);
    setv('winM1', state.winM1);
    setv('acvM1', state.acvM1);
    setv('cycleM1', state.cycleM1);
    setv('qualM2', state.qualM2);
    setv('winM2', state.winM2);
    setv('acvM2', state.acvM2);
    setv('cycleM2', state.cycleM2);
    document.getElementById('channel-rows').innerHTML = '';
    if (state.channels && state.channels.length) {
      state.channels.forEach(function (ch, i) {
        var migrated = {
          name: ch.name,
          spend: ch.spend,
          otherSpend: isFinite(ch.otherSpend) ? ch.otherSpend : 0,
          opps: ch.opps
        };
        if (ch.channelLtv != null && isFinite(ch.channelLtv) && ch.channelLtv >= 0) migrated.channelLtv = ch.channelLtv;
        addChannelRow(migrated, i);
      });
    } else addChannelRow(null, 0);
  }

  /** If session has fewer channel rows than the cap, append example rows so Slide 3 always illustrates a full set. */
  function mergeExampleChannelsToMax(state) {
    if (!state || !state.channels) return;
    if (state.channels.length >= MAX_CHANNELS) return;
    var demo = getDemoFormDefaults().channels;
    var i = state.channels.length;
    while (i < MAX_CHANNELS && i < demo.length) {
      var d = demo[i];
      var row = {
        name: d.name,
        spend: d.spend,
        otherSpend: isFinite(d.otherSpend) ? d.otherSpend : 0,
        opps: d.opps
      };
      if (d.channelLtv != null && isFinite(d.channelLtv) && d.channelLtv >= 0) row.channelLtv = d.channelLtv;
      state.channels.push(row);
      i++;
    }
  }

  /**
   * Illustrative B2B SaaS-style defaults. Slide 3: distinct channelLtv (CLTV) per row; total spend =
   * round(CLTV × deals × win% ÷ target LTV:CAC) at win% = 28%, so table metrics stay formula-driven.
   * Direct vs other split is cosmetic only.
   */
  function getDemoFormDefaults() {
    return {
      totalSmSpend: 225000,
      newArr: 380000,
      newCustomers: 15,
      grossMargin: 78,
      annualChurn: 55,
      revM2: 28,
      fcfM2: 6,
      revM1: 31,
      fcfM1: 8,
      revM0: 34,
      fcfM0: 9,
      qualifiedOpps: 96,
      winRate: 28,
      salesCycle: 74,
      qualM1: 88,
      winM1: 27.5,
      acvM1: 32500,
      cycleM1: 76,
      qualM2: 82,
      winM2: 29,
      acvM2: 31800,
      cycleM2: 79,
      channels: [
        { name: 'LinkedIn Ads', spend: 78000, otherSpend: 49045, opps: 20, channelLtv: 76000 },
        { name: 'Google Ads', spend: 48000, otherSpend: 30121, opps: 8, channelLtv: 46000 },
        { name: 'SEO / Content', spend: 40000, otherSpend: 26774, opps: 15, channelLtv: 74000 },
        { name: 'Paid Social', spend: 72000, otherSpend: 56211, opps: 18, channelLtv: 58000 },
        { name: 'Events & field', spend: 95000, otherSpend: 88273, opps: 15, channelLtv: 72000 },
        { name: 'ABM / intent', spend: 52000, otherSpend: 28971, opps: 9, channelLtv: 98000 },
        { name: 'Partner', spend: 42000, otherSpend: 27412, opps: 11, channelLtv: 115000 },
        { name: 'Virtual events', spend: 52000, otherSpend: 35317, opps: 10, channelLtv: 64000 },
        { name: 'Email & lifecycle', spend: 42000, otherSpend: 39553, opps: 17, channelLtv: 66000 },
        { name: 'Outbound SDR', spend: 50000, otherSpend: 32133, opps: 8, channelLtv: 88000 },
        { name: 'Review sites', spend: 26000, otherSpend: 15584, opps: 7, channelLtv: 52000 },
        { name: 'Sponsorships', spend: 34000, otherSpend: 19291, opps: 5, channelLtv: 60000 }
      ]
    };
  }

  function applyCalcModalDefaults() {
    function setcv(id, v) {
      var el = document.getElementById(id);
      if (!el || v == null || !isFinite(v)) return;
      el.value = String(v);
    }
    setcv('calcAd', 165000);
    setcv('calcSalaries', 150000);
    setcv('calcSoftware', 35000);
    setcv('calcOverhead', 30000);
    updateCalcSum();
  }

  /** Fill any blank wizard/calc inputs from demo so partial sessionStorage restores still show a full example. */
  function applyEmptyFieldDemoFallbacks() {
    var d = getDemoFormDefaults();
    function fill(id, val) {
      var el = document.getElementById(id);
      if (!el) return;
      if (String(el.value).trim() !== '') return;
      if (val == null || !isFinite(val)) return;
      el.value = String(val);
    }
    fill('totalSmSpend', d.totalSmSpend);
    fill('newArr', d.newArr);
    fill('newCustomers', d.newCustomers);
    fill('grossMargin', d.grossMargin);
    fill('annualChurn', d.annualChurn);
    fill('revM2', d.revM2);
    fill('fcfM2', d.fcfM2);
    fill('revM1', d.revM1);
    fill('fcfM1', d.fcfM1);
    fill('revM0', d.revM0);
    fill('fcfM0', d.fcfM0);
    fill('qualifiedOpps', d.qualifiedOpps);
    fill('winRate', d.winRate);
    fill('salesCycle', d.salesCycle);
    fill('qualM1', d.qualM1);
    fill('winM1', d.winM1);
    fill('acvM1', d.acvM1);
    fill('cycleM1', d.cycleM1);
    fill('qualM2', d.qualM2);
    fill('winM2', d.winM2);
    fill('acvM2', d.acvM2);
    fill('cycleM2', d.cycleM2);

    var calcPairs = [
      ['calcAd', 165000],
      ['calcSalaries', 150000],
      ['calcSoftware', 35000],
      ['calcOverhead', 30000]
    ];
    calcPairs.forEach(function (pair) {
      fill(pair[0], pair[1]);
    });
    updateCalcSum();

    var chDemo = d.channels || [];
    document.querySelectorAll('.channel-block').forEach(function (block, i) {
      var dem = chDemo[i];
      if (!dem) return;
      var nm = block.querySelector('.ch-name');
      var sp = block.querySelector('.ch-spend');
      var ot = block.querySelector('.ch-other');
      var op = block.querySelector('.ch-opps');
      if (nm && !String(nm.value).trim()) nm.value = dem.name;
      if (sp && String(sp.value).trim() === '' && isFinite(dem.spend)) sp.value = String(dem.spend);
      if (ot && String(ot.value).trim() === '' && isFinite(dem.otherSpend) && dem.otherSpend > 0) ot.value = String(dem.otherSpend);
      if (op && String(op.value).trim() === '' && isFinite(dem.opps)) op.value = String(Math.round(dem.opps));
      var ltvEl = block.querySelector('.ch-ltv');
      if (ltvEl && String(ltvEl.value).trim() === '' && dem.channelLtv != null && isFinite(dem.channelLtv)) {
        ltvEl.value = String(dem.channelLtv);
      }
    });
    document.querySelectorAll('.channel-block').forEach(function (block) {
      refreshChannelBlockSummary(block);
    });

    document.querySelectorAll('.channel-block').forEach(function (block) {
      var nm = block.querySelector('.ch-name');
      var op = block.querySelector('.ch-opps');
      if (!nm || !op) return;
      if (String(nm.value).trim() !== 'Google Ads') return;
      var v = parseNum(op);
      if (v === 536 || v === 535 || v === 35) {
        op.value = '8';
        refreshChannelBlockSummary(block);
      }
    });
  }

  function saveSession() {
    try {
      var st = collectFormState();
      st.step = currentStep;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(st));
    } catch (e) {}
  }

  function loadSession() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function activateDashboardTab(id) {
    document.querySelectorAll('.tab').forEach(function (t) {
      var on = t.getAttribute('data-tab') === id;
      t.classList.toggle('border-b-2', true);
      t.classList.toggle('border-eeblue', on);
      t.classList.toggle('border-transparent', !on);
      t.classList.toggle('text-eeblue', on);
      t.classList.toggle('text-eemuted', !on);
      t.classList.toggle('bg-eeblue/5', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.add('hidden'); p.classList.remove('block'); });
    var p = document.getElementById('panel-' + id);
    if (!p) return;
    p.classList.remove('hidden');
    p.classList.add('block');
  }

  function wireTabs() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var id = tab.getAttribute('data-tab');
        activateDashboardTab(id);
        setTimeout(function () {
          chartInstances.forEach(function (c) { try { c.resize(); } catch (e) {} });
        }, 80);
      });
    });
  }

  function updateCalcSum() {
    var sum = (parseNum(document.getElementById('calcAd')) || 0) +
      (parseNum(document.getElementById('calcSalaries')) || 0) +
      (parseNum(document.getElementById('calcSoftware')) || 0) +
      (parseNum(document.getElementById('calcOverhead')) || 0);
    document.getElementById('calcRunningSum').textContent = 'Sum: ' + fmtMoney2(sum);
  }

  function pdfDelay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function pdfWaitChartsResize() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        chartInstances.forEach(function (c) {
          try {
            c.resize();
          } catch (e) {}
        });
        setTimeout(resolve, 200);
      });
    });
  }

  function destroyPdfExportCharts() {
    pdfExportChartInstances.forEach(function (c) {
      try {
        c.destroy();
      } catch (e) {}
    });
    pdfExportChartInstances = [];
  }

  function beginPdfCaptureStacking() {
    var header = document.querySelector('header');
    var mainEl = document.querySelector('main');
    var stack = [];
    function push(el, key) {
      if (!el) return;
      stack.push({ el: el, key: key, prev: el.style[key] });
    }
    if (header) {
      push(header, 'position');
      push(header, 'zIndex');
      header.style.position = 'relative';
      header.style.zIndex = '50';
    }
    if (mainEl) {
      push(mainEl, 'position');
      push(mainEl, 'zIndex');
      mainEl.style.position = 'relative';
      mainEl.style.zIndex = '40';
    }
    return function restorePdfCaptureStacking() {
      stack.forEach(function (s) {
        if (s.el) s.el.style[s.key] = s.prev;
      });
    };
  }

  function pdfBuildMagicGaugeChart(canvas, magic) {
    var v = magic != null && isFinite(magic) ? Math.min(Math.max(magic, 0), GAUGE_MAX) : 0;
    var magicNeedlePlugin = {
      id: 'magicNeedlePdf',
      afterDraw: function (chart) {
        var meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || meta.data.length < 1) return;
        var arc0 = meta.data[0];
        var arcN = meta.data[meta.data.length - 1];
        var x = arc0.x;
        var y = arc0.y;
        var innerR = arc0.innerRadius;
        var outerR = arc0.outerRadius;
        if (!isFinite(x) || !isFinite(y) || !isFinite(innerR) || !isFinite(outerR)) return;
        var span = arcN.endAngle - arc0.startAngle;
        if (!isFinite(span) || span <= 0) return;
        var theta = arc0.startAngle + (v / GAUGE_MAX) * span;
        var c = chart.ctx;
        var band = outerR - innerR;
        c.save();
        c.strokeStyle = '#1a1a1a';
        c.lineWidth = Math.max(2, Math.min(4, band * 0.14));
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x + Math.cos(theta) * innerR, y + Math.sin(theta) * innerR);
        c.lineTo(x + Math.cos(theta) * outerR, y + Math.sin(theta) * outerR);
        c.stroke();
        c.restore();
      }
    };
    var ch = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      plugins: [magicNeedlePlugin],
      data: {
        labels: ['Weak', 'Decent', 'Strong'],
        datasets: [{
          data: [0.75, 0.25, 0.5],
          backgroundColor: ['#fecaca', '#fde68a', '#bbf7d0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        cutout: '70%',
        rotation: -90,
        circumference: 180,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
    pdfExportChartInstances.push(ch);
  }

  function pdfBuildRule40Chart(canvas, m) {
    var labels = ['Month 1', 'Month 2', 'Current'];
    var ch = new Chart(canvas.getContext('2d'), {
      data: {
        labels: labels,
        datasets: [
          { type: 'bar', label: 'YoY revenue growth', data: m.rule40RevYoy, backgroundColor: '#4f6bf4', stack: 's', order: 2 },
          { type: 'bar', label: 'FCF margin', data: m.rule40FcfMargin, backgroundColor: '#e24b4a', stack: 's', order: 2 }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            grid: { color: '#e5e7eb' },
            ticks: { callback: function (val) { return val + '%'; } }
          }
        },
        plugins: {
          legend: { position: 'bottom', align: 'center', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } }
        }
      }
    });
    pdfExportChartInstances.push(ch);
  }

  function pdfBuildPaybackChart(canvas, m) {
    if (!m.paybackSeries || !m.paybackSeries.values.length) {
      var emptyP = canvas.parentNode;
      var empty = document.createElement('div');
      empty.className = 'pdf-exp-empty';
      empty.textContent = 'No payback series data.';
      if (emptyP) emptyP.replaceChild(empty, canvas);
      return;
    }
    var ps = m.paybackSeries;
    var vals = ps.values;
    var labs = ps.labels.map(function (lb) { return parseInt(lb, 10); });
    var p = -1;
    var i;
    for (i = 0; i < vals.length - 1; i++) {
      if (vals[i] < 0 && vals[i + 1] >= 0) {
        p = i;
        break;
      }
    }
    var redPts = [];
    var bluePts = [];
    var linePts = [];
    var xCross = null;
    if (vals[0] >= 0) {
      for (i = 0; i < vals.length; i++) {
        linePts.push({ x: labs[i], y: vals[i] });
        bluePts.push({ x: labs[i], y: vals[i] });
      }
    } else if (p === -1) {
      for (i = 0; i < vals.length; i++) {
        linePts.push({ x: labs[i], y: vals[i] });
        redPts.push({ x: labs[i], y: vals[i] });
      }
    } else {
      var denom = vals[p + 1] - vals[p];
      var t = Math.abs(denom) < 1e-9 ? 1 : (0 - vals[p]) / denom;
      xCross = labs[p] + t * (labs[p + 1] - labs[p]);
      for (i = 0; i <= p; i++) {
        redPts.push({ x: labs[i], y: vals[i] });
        linePts.push({ x: labs[i], y: vals[i] });
      }
      redPts.push({ x: xCross, y: 0 });
      linePts.push({ x: xCross, y: 0 });
      bluePts.push({ x: xCross, y: 0 });
      for (i = p + 1; i < vals.length; i++) {
        bluePts.push({ x: labs[i], y: vals[i] });
        linePts.push({ x: labs[i], y: vals[i] });
      }
    }
    var linePointRadius = linePts.map(function (pt) {
      return (xCross != null && Math.abs(pt.x - xCross) < 1e-4 && Math.abs(pt.y) < 1e-4) ? 6 : 0;
    });
    var fillBase = {
      borderWidth: 0,
      pointRadius: 0,
      tension: 0.2,
      fill: { target: 'origin' },
      order: 0
    };
    var lineDs = {
      label: 'Cumulative gross profit ($)',
      data: linePts,
      borderColor: '#4f6bf4',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.2,
      pointRadius: linePointRadius,
      order: 1
    };
    var datasets = [];
    if (redPts.length) {
      datasets.push(Object.assign({}, fillBase, {
        label: 'Before payback',
        data: redPts,
        backgroundColor: 'rgba(226, 75, 74, 0.15)'
      }));
    }
    if (bluePts.length) {
      datasets.push(Object.assign({}, fillBase, {
        label: 'After payback',
        data: bluePts,
        backgroundColor: 'rgba(79, 107, 244, 0.15)'
      }));
    }
    datasets.push(lineDs);
    var lineIdx = datasets.length - 1;
    var ch = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { datasets: datasets },
      options: {
        parsing: false,
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: { type: 'linear', min: 0, grid: { color: '#e5e7eb' }, ticks: { stepSize: 1, maxTicksLimit: 24, font: { size: 9 } } },
          y: { grid: { color: '#e5e7eb' }, ticks: { callback: function (val) { return fmtMoney(val); }, font: { size: 9 } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: function (ti) { return ti.datasetIndex === lineIdx; },
            callbacks: { label: function (c) { return fmtMoney2(c.parsed.y); } }
          }
        }
      }
    });
    pdfExportChartInstances.push(ch);
  }

  function pdfBuildVelocityChart(canvas, m) {
    var ch = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Month 1', 'Month 2', 'Current'],
        datasets: [{
          label: '$ / day',
          data: m.velTrend,
          borderColor: '#4f6bf4',
          backgroundColor: 'rgba(79,107,244,0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: { grid: { color: '#e5e7eb' }, ticks: { font: { size: 9 } } },
          x: { ticks: { font: { size: 9 } } }
        },
        plugins: { legend: { display: false } }
      }
    });
    pdfExportChartInstances.push(ch);
  }

  function pdfBuildBubbleChart(canvas, m) {
    var pts = m.bubblePoints || [];
    if (!pts.length) {
      var emptyB = canvas.parentNode;
      var empty = document.createElement('div');
      empty.className = 'pdf-exp-empty';
      empty.textContent = 'No channel data for bubble chart.';
      if (emptyB) emptyB.replaceChild(empty, canvas);
      return;
    }
    var maxOp = Math.max.apply(null, pts.map(function (p) { return p.opps; })) || 1;
    var xs = pts.map(function (p) { return p.cacPerWon; });
    var ys = pts.map(function (p) { return p.ltvPerCustomer; });
    var maxX = Math.max.apply(null, xs);
    var maxY = Math.max.apply(null, ys);
    var xPad = Math.max(maxX * 0.12, maxX * 0.05 + 1, 500);
    var yPad = Math.max(maxY * 0.12, maxY * 0.05 + 1, 1000);
    var xMax = Math.max(maxX + xPad, 100);
    var yMax = Math.max(maxY + yPad, 100);
    var bubbleData = pts.map(function (p) {
      return {
        x: p.cacPerWon,
        y: p.ltvPerCustomer,
        r: 5 + (p.opps / maxOp) * 22,
        channelName: p.name,
        channelOpps: p.opps
      };
    });
    var bubbleBg = bubbleData.map(function (_, i) {
      return BUBBLE_POINT_COLORS[i % BUBBLE_POINT_COLORS.length].bg;
    });
    var bubbleBorder = bubbleData.map(function (_, i) {
      return BUBBLE_POINT_COLORS[i % BUBBLE_POINT_COLORS.length].border;
    });
    var ch = new Chart(canvas.getContext('2d'), {
      data: {
        datasets: [{
          type: 'bubble',
          label: 'Channels',
          data: bubbleData,
          backgroundColor: bubbleBg,
          borderColor: bubbleBorder,
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'CAC ($)', font: { size: 11 } },
            min: 0,
            suggestedMax: xMax,
            grid: { color: '#e5e7eb' },
            ticks: { callback: function (v) { return fmtMoney(v); }, font: { size: 9 } }
          },
          y: {
            type: 'linear',
            title: { display: true, text: 'CLTV ($)', font: { size: 11 } },
            min: 0,
            suggestedMax: yMax,
            grid: { color: '#e5e7eb' },
            ticks: { callback: function (v) { return fmtMoney(v); }, font: { size: 9 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function () { return ''; },
              label: function (c) {
                var raw = c.raw;
                if (!raw || raw.channelName == null) return [];
                return [
                  raw.channelName,
                  'CAC: ' + fmtMoney2(raw.x),
                  'CLTV: ' + fmtMoney2(raw.y),
                  'Deals: ' + String(Math.round(raw.channelOpps || 0))
                ];
              }
            }
          }
        }
      }
    });
    pdfExportChartInstances.push(ch);
  }

  function buildPdfChannelTable(m) {
    var wrap = document.createElement('div');
    wrap.className = 'pdf-exp-table-wrap';
    var tbl = document.createElement('table');
    tbl.className = 'pdf-exp-table';
    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Channel</th><th class="num">Deals</th><th class="num">CLTV</th><th class="num">CAC</th><th class="num">LTV:CAC</th></tr>';
    tbl.appendChild(thead);
    var tb = document.createElement('tbody');
    (m.channelRows || []).forEach(function (row) {
      var dealsShown = isFinite(row.opps) && row.opps >= 0 ? String(Math.round(row.opps)) : '—';
      var cltv = row.ltvPerCustomer != null && isFinite(row.ltvPerCustomer) ? row.ltvPerCustomer : null;
      var cac = row.cacPerWon != null && isFinite(row.cacPerWon) ? row.cacPerWon : null;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(row.name) + '</td>' +
        '<td class="num">' + dealsShown + '</td>' +
        '<td class="num">' + (cltv != null ? escapeHtml(fmtMoney(cltv)) : '—') + '</td>' +
        '<td class="num">' + (cac != null ? escapeHtml(fmtMoney(cac)) : '—') + '</td>' +
        '<td class="num">' + escapeHtml(formatChannelLtvCacRatio(row.ltvPerCustomer, row.cacPerWon)) + '</td>';
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    wrap.appendChild(tbl);
    return wrap;
  }

  function buildPdfStat(label, val) {
    var d = document.createElement('div');
    d.className = 'pdf-exp-stat';
    d.innerHTML = '<span class="pdf-exp-stat-label">' + escapeHtml(label) + '</span>' + escapeHtml(val);
    return d;
  }

  function buildPdfChannelsExportPage(m) {
    var page = document.createElement('div');
    page.className = 'pdf-export-page';
    var st = document.createElement('p');
    st.className = 'pdf-exp-section-title';
    st.textContent = 'Channel performance';
    page.appendChild(st);
    var grid = document.createElement('div');
    grid.className = 'pdf-exp-channels-grid';
    var left = document.createElement('div');
    left.className = 'pdf-exp-card';
    var lt = document.createElement('p');
    lt.className = 'pdf-exp-card-title';
    lt.textContent = 'CAC vs CLTV';
    left.appendChild(lt);
    var sub = document.createElement('p');
    sub.className = 'pdf-exp-card-sub';
    sub.innerHTML = 'X = CAC (channel spend ÷ (deals × win %)). Y = CLTV (slide 3 override or blended from slide 1). Bubble size = deals.';
    left.appendChild(sub);
    var slot = document.createElement('div');
    slot.className = 'pdf-exp-chart-slot';
    var cv = document.createElement('canvas');
    cv.width = 500;
    cv.height = 300;
    cv.style.width = '500px';
    cv.style.height = '300px';
    slot.appendChild(cv);
    left.appendChild(slot);
    grid.appendChild(left);
    var right = document.createElement('div');
    right.className = 'pdf-exp-card';
    right.appendChild(buildPdfChannelTable(m));
    var fn = document.createElement('p');
    fn.className = 'pdf-exp-footnote';
    fn.innerHTML = '<strong>Deals</strong> = pipeline opportunities for the channel (slide 3). <strong>CLTV</strong> = customer lifetime value per won customer (optional channel LTV on slide 3, otherwise blended CLTV from slide 1). <strong>CAC</strong> = customer acquisition cost per <em>won</em> customer: total channel spend ÷ (deals × win %), using blended win % from slide 2. <strong>LTV:CAC</strong> = CLTV ÷ CAC.';
    right.appendChild(fn);
    grid.appendChild(right);
    page.appendChild(grid);
    pdfBuildBubbleChart(cv, m);
    return page;
  }

  function buildPdfAcquisitionExportPage(m) {
    var page = document.createElement('div');
    page.className = 'pdf-export-page';
    var st = document.createElement('p');
    st.className = 'pdf-exp-section-title';
    st.textContent = 'Acquisition efficiency';
    page.appendChild(st);

    var row1 = document.createElement('div');
    row1.className = 'pdf-exp-acq-row2';
    var magicCard = document.createElement('div');
    magicCard.className = 'pdf-exp-card';
    var mt = document.createElement('p');
    mt.className = 'pdf-exp-card-title';
    mt.textContent = 'Magic number';
    magicCard.appendChild(mt);
    var magicWrap = document.createElement('div');
    magicWrap.className = 'pdf-exp-acq-magic-wrap';
    var mcv = document.createElement('canvas');
    mcv.width = 220;
    mcv.height = 130;
    mcv.style.width = '220px';
    mcv.style.height = '130px';
    magicWrap.appendChild(mcv);
    var gv = document.createElement('div');
    gv.className = 'pdf-exp-gauge-value';
    gv.textContent = m.magic != null && isFinite(m.magic) ? fmtNum(m.magic, 2) : '—';
    magicWrap.appendChild(gv);
    var gz = document.createElement('div');
    gz.className = 'pdf-exp-gauge-zones';
    gz.innerHTML = '<span style="color:#dc2626">Weak 0–0.75</span> · <span style="color:#d97706">Decent 0.75–1.0</span> · <span style="color:#15803d">Strong 1.0–1.5+</span>';
    magicWrap.appendChild(gz);
    magicCard.appendChild(magicWrap);
    row1.appendChild(magicCard);

    var r40Card = document.createElement('div');
    r40Card.className = 'pdf-exp-card';
    var r40t = document.createElement('p');
    r40t.className = 'pdf-exp-card-title';
    r40t.textContent = 'Rule of 40';
    r40Card.appendChild(r40t);
    var r40sub = document.createElement('p');
    r40sub.className = 'pdf-exp-card-sub';
    r40sub.textContent = 'YoY revenue growth + FCF margin (% points each)';
    r40Card.appendChild(r40sub);
    var r40slot = document.createElement('div');
    r40slot.className = 'pdf-exp-chart-slot';
    var r40cv = document.createElement('canvas');
    r40cv.width = 380;
    r40cv.height = 190;
    r40cv.style.width = '380px';
    r40cv.style.height = '190px';
    r40slot.appendChild(r40cv);
    r40Card.appendChild(r40slot);
    row1.appendChild(r40Card);
    page.appendChild(row1);
    pdfBuildMagicGaugeChart(mcv, m.magic);
    pdfBuildRule40Chart(r40cv, m);

    var subMagic = document.createElement('p');
    subMagic.className = 'pdf-exp-card-sub';
    subMagic.style.margin = '0 0 12px';
    subMagic.textContent = 'New ARR ' + fmtMoney(m.state.newArr) + ' · S&M ' + fmtMoney(m.state.totalSmSpend);
    page.appendChild(subMagic);

    var rowPay = document.createElement('div');
    rowPay.className = 'pdf-exp-acq-row-payback';
    var payCard = document.createElement('div');
    payCard.className = 'pdf-exp-card';
    var payT = document.createElement('p');
    payT.className = 'pdf-exp-card-title';
    payT.textContent = 'CAC payback — cumulative gross profit';
    payCard.appendChild(payT);
    var paySlot = document.createElement('div');
    paySlot.className = 'pdf-exp-chart-slot';
    var payCv = document.createElement('canvas');
    payCv.width = 540;
    payCv.height = 190;
    payCv.style.width = '540px';
    payCv.style.height = '190px';
    paySlot.appendChild(payCv);
    payCard.appendChild(paySlot);
    rowPay.appendChild(payCard);
    var statCol = document.createElement('div');
    statCol.className = 'pdf-exp-stat-grid';
    statCol.appendChild(buildPdfStat('CAC', m.cac != null ? fmtMoney(m.cac) : '—'));
    statCol.appendChild(buildPdfStat('MRR / customer', m.state && m.state.newCustomers > 0 ? fmtMoney2(m.state.newArr / m.state.newCustomers / 12) : '—'));
    statCol.appendChild(buildPdfStat('Gross margin', isFinite(m.state.grossMargin) ? fmtNum(m.state.grossMargin, 1) + '%' : '—'));
    statCol.appendChild(buildPdfStat('Payback', m.paybackMonths != null ? fmtNum(m.paybackMonths, 1) + ' mo' : '—'));
    rowPay.appendChild(statCol);
    page.appendChild(rowPay);
    pdfBuildPaybackChart(payCv, m);

    var rowVel = document.createElement('div');
    rowVel.className = 'pdf-exp-acq-row-vel';
    var velCard = document.createElement('div');
    velCard.className = 'pdf-exp-card';
    var vTitle = document.createElement('p');
    vTitle.className = 'pdf-exp-card-title';
    vTitle.textContent = 'Pipeline velocity';
    velCard.appendChild(vTitle);
    var vHero = document.createElement('p');
    vHero.className = 'pdf-exp-vel-hero';
    vHero.textContent = m.pipeVel != null ? fmtMoney2(m.pipeVel) + '/day' : '—';
    velCard.appendChild(vHero);
    var velSlot = document.createElement('div');
    velSlot.className = 'pdf-exp-chart-slot';
    var velCv = document.createElement('canvas');
    velCv.width = 450;
    velCv.height = 150;
    velCv.style.width = '450px';
    velCv.style.height = '150px';
    velSlot.appendChild(velCv);
    velCard.appendChild(velSlot);
    rowVel.appendChild(velCard);
    var levCard = document.createElement('div');
    levCard.className = 'pdf-exp-card';
    var levT = document.createElement('p');
    levT.className = 'pdf-exp-card-title';
    levT.textContent = 'Velocity levers';
    levCard.appendChild(levT);
    var levWrap = document.createElement('div');
    (m.leverRows || []).forEach(function (row) {
      var val = row.k.indexOf('ACV') >= 0 ? fmtMoney(row.cur) : (row.k.indexOf('Win') >= 0 ? fmtNum(row.cur, 1) + '%' : String(row.cur));
      var div = document.createElement('div');
      div.className = 'pdf-exp-lever-row';
      div.innerHTML = '<span style="font-weight:600">' + escapeHtml(row.k) + '</span><span>' + escapeHtml(val) + ' <span style="color:#4f6bf4">' + escapeHtml(row.arrow) + '</span></span>';
      levWrap.appendChild(div);
    });
    levCard.appendChild(levWrap);
    rowVel.appendChild(levCard);
    page.appendChild(rowVel);
    pdfBuildVelocityChart(velCv, m);

    return page;
  }

  function capturePdfPageToCanvas(pageEl) {
    return html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0
    });
  }

  function landscapePdfContentRectPt() {
    return { x: 36, y: 36, w: 792 - 72, h: 612 - 72 };
  }

  function addCanvasToLandscapePdf(pdf, canvas, isFirstPage) {
    var box = landscapePdfContentRectPt();
    var cw = canvas.width;
    var ch = canvas.height;
    if (!cw || !ch) return;
    var imgData = canvas.toDataURL('image/jpeg', 0.93);
    var r = Math.min(box.w / cw, box.h / ch);
    var iw = cw * r;
    var ih = ch * r;
    var ix = box.x + (box.w - iw) / 2;
    var iy = box.y + (box.h - ih) / 2;
    if (!isFirstPage) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', ix, iy, iw, ih);
  }

  window.downloadDemandPdf = function () {
    var dash = document.getElementById('dashboard-view');
    if (!dash || dash.classList.contains('hidden')) {
      alert('Generate the report first, then download the PDF.');
      return;
    }
    var jspdfRoot = window.jspdf;
    var JsPDF = (jspdfRoot && jspdfRoot.jsPDF) || (jspdfRoot && jspdfRoot.default);
    if (typeof html2canvas !== 'function' || typeof JsPDF !== 'function') {
      alert('PDF libraries failed to load. Try refreshing the page.');
      return;
    }

    var state = collectFormState();
    var m = computeMetrics(state);
    var bar = document.getElementById('pdfActionBar');
    var host = null;
    var restorePdfStacking = null;

    if (bar) bar.classList.add('hidden');

    var run = Promise.resolve()
      .then(function () {
        window.scrollTo(0, 0);
        destroyPdfExportCharts();
        host = document.createElement('div');
        host.id = 'pdf-export-host';
        host.setAttribute('aria-hidden', 'true');
        host.style.cssText =
          'position:fixed;left:-14000px;top:0;width:1056px;box-sizing:border-box;background:#fff;z-index:1;pointer-events:none;overflow:visible;';
        document.body.appendChild(host);
        host.appendChild(buildPdfChannelsExportPage(m));
        host.appendChild(buildPdfAcquisitionExportPage(m));
        return new Promise(function (resolve) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              setTimeout(resolve, 200);
            });
          });
        });
      })
      .then(function () {
        restorePdfStacking = beginPdfCaptureStacking();
        host.style.left = '0';
        host.style.top = '0';
        host.style.zIndex = '1';
        return new Promise(function (resolve) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              setTimeout(resolve, 120);
            });
          });
        });
      })
      .then(function () {
        var pageEls = host.querySelectorAll('.pdf-export-page');
        if (pageEls.length < 2) throw new Error('PDF export pages missing');
        return capturePdfPageToCanvas(pageEls[0]).then(function (canvas1) {
          return capturePdfPageToCanvas(pageEls[1]).then(function (canvas2) {
            var pdf = new JsPDF({ unit: 'pt', format: 'letter', orientation: 'landscape' });
            addCanvasToLandscapePdf(pdf, canvas1, true);
            addCanvasToLandscapePdf(pdf, canvas2, false);
            pdf.save(PDF_EXPORT_FILENAME);
          });
        });
      })
      .then(function () {
        destroyPdfExportCharts();
        if (restorePdfStacking) {
          restorePdfStacking();
          restorePdfStacking = null;
        }
        if (host && host.parentNode) host.parentNode.removeChild(host);
      })
      .catch(function (err) {
        console.error(err);
        destroyPdfExportCharts();
        if (restorePdfStacking) {
          restorePdfStacking();
          restorePdfStacking = null;
        }
        if (host && host.parentNode) host.parentNode.removeChild(host);
        alert('PDF export failed. Try again, or use your browser Print dialog and save as PDF.');
      })
      .then(function () {
        if (bar) bar.classList.remove('hidden');
      });

    return run;
  };

  function openModal() {
    document.getElementById('calcModal').classList.remove('hidden');
    document.getElementById('calcModal').classList.add('flex');
    updateCalcSum();
  }
  function closeModal() {
    document.getElementById('calcModal').classList.add('hidden');
    document.getElementById('calcModal').classList.remove('flex');
  }

  document.getElementById('btnClearData').addEventListener('click', clearAllWizardData);

  var btnStartReport = document.getElementById('btnStartReport');
  if (btnStartReport) btnStartReport.addEventListener('click', dismissIntroShowWizard);

  document.getElementById('openCalcModal').addEventListener('click', openModal);
  document.getElementById('closeCalcModal').addEventListener('click', closeModal);
  document.getElementById('calcModal').addEventListener('click', function (e) {
    if (e.target.id === 'calcModal') closeModal();
  });
  ['calcAd', 'calcSalaries', 'calcSoftware', 'calcOverhead'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalcSum);
  });
  document.getElementById('applyCalcSum').addEventListener('click', function () {
    var sum = (parseNum(document.getElementById('calcAd')) || 0) +
      (parseNum(document.getElementById('calcSalaries')) || 0) +
      (parseNum(document.getElementById('calcSoftware')) || 0) +
      (parseNum(document.getElementById('calcOverhead')) || 0);
    document.getElementById('totalSmSpend').value = sum ? String(Math.round(sum * 100) / 100) : '';
    saveSession();
    closeModal();
  });

  document.getElementById('btnBack').addEventListener('click', function () {
    if (currentStep > 1) {
      clearFieldErrors();
      showSlide(currentStep - 1);
      saveSession();
    }
  });

  document.getElementById('btnNext').addEventListener('click', function () {
    clearFieldErrors();
    if (currentStep === 1) {
      if (!validateSlide1()) return;
      showSlide(2);
    } else if (currentStep === 2) {
      if (!validateSlide2()) return;
      showSlide(3);
    } else {
      if (!validateSlide3()) return;
      var state = collectFormState();
      var m = computeMetrics(state);
      renderDashboard(m);
      document.getElementById('wizard-view').classList.add('hidden');
      document.getElementById('dashboard-view').classList.remove('hidden');
      activateDashboardTab('channels');
      saveSession();
      setTimeout(function () {
        chartInstances.forEach(function (c) { try { c.resize(); } catch (e) {} });
      }, 80);
    }
  });

  document.getElementById('btnEditInputs').addEventListener('click', function () {
    document.getElementById('wizard-view').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    destroyCharts();
    saveSession();
  });

  document.getElementById('addChannelBtn').addEventListener('click', function () {
    if (document.querySelectorAll('.channel-block').length >= MAX_CHANNELS) return;
    addChannelRow(null, document.querySelectorAll('.channel-block').length);
    saveSession();
  });

  document.querySelectorAll('#wizard-view input, #wizard-view select').forEach(function (inp) {
    inp.addEventListener('input', saveSession);
    inp.addEventListener('change', saveSession);
  });

  wireTabs();

  var restored = loadSession();
  if (!restored) restored = loadSessionV2Fallback();
  if (!restored) restored = loadSessionV1Fallback();
  if (restored && restored.channels && restored.channels.length) {
    mergeExampleChannelsToMax(restored);
    persistToForm(restored);
    if (restored.step >= 1 && restored.step <= 3) showSlide(restored.step);
  } else if (!restored) {
    persistToForm(getDemoFormDefaults());
    applyCalcModalDefaults();
    showSlide(1);
  } else {
    persistToForm(restored);
    if (restored.step >= 1 && restored.step <= 3) showSlide(restored.step);
  }

  applyEmptyFieldDemoFallbacks();
  try {
    saveSession();
  } catch (e) {}

  var introCal = document.getElementById('introCalendlyLink');
  if (introCal) introCal.href = DEMAND_GEN_CALENDLY_URL;
  var headerCal = document.querySelector('header a[href*="calendly"]');
  if (headerCal) headerCal.href = DEMAND_GEN_CALENDLY_URL;

  var introDismissed = false;
  try {
    introDismissed = sessionStorage.getItem(INTRO_DISMISSED_KEY) === '1';
  } catch (e3) {}
  var introEl = document.getElementById('intro-landing');
  var wizEl = document.getElementById('wizard-view');
  if (!introEl) {
    if (wizEl) wizEl.classList.remove('hidden');
  } else if (introDismissed) {
    if (introEl) introEl.classList.add('hidden');
    if (wizEl) wizEl.classList.remove('hidden');
  } else {
    if (introEl) introEl.classList.remove('hidden');
    if (wizEl) wizEl.classList.add('hidden');
  }

  function loadSessionV2Fallback() {
    try {
      var raw = sessionStorage.getItem('demandGenReport_v2');
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o.profitMargin != null && o.fcfM0 == null) o.fcfM0 = o.profitMargin;
      if (o.revenueGrowth != null && o.revM0 == null) o.revM0 = o.revenueGrowth;
      if (o.channels && o.channels.length) {
        o.channels = o.channels.map(function (ch) {
          var row = {
            name: ch.name,
            spend: ch.spend,
            otherSpend: isFinite(ch.otherSpend) ? ch.otherSpend : 0,
            opps: ch.opps
          };
          if (ch.channelLtv != null && isFinite(ch.channelLtv) && ch.channelLtv >= 0) row.channelLtv = ch.channelLtv;
          return row;
        });
      }
      return o;
    } catch (e) { return null; }
  }

  function loadSessionV1Fallback() {
    try {
      var raw = sessionStorage.getItem('demandGenReport_v1');
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o.profitMargin != null && o.fcfM0 == null) o.fcfM0 = o.profitMargin;
      if (o.revenueGrowth != null && o.revM0 == null) o.revM0 = o.revenueGrowth;
      if (o.channels && o.channels.length) {
        o.channels = o.channels.map(function (ch) {
          var row = {
            name: ch.name,
            spend: ch.spend,
            otherSpend: isFinite(ch.otherSpend) ? ch.otherSpend : 0,
            opps: ch.opps
          };
          if (ch.channelLtv != null && isFinite(ch.channelLtv) && ch.channelLtv >= 0) row.channelLtv = ch.channelLtv;
          return row;
        });
      }
      return o;
    } catch (e) { return null; }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
  window.addEventListener('resize', function () {
    chartInstances.forEach(function (c) { try { c.resize(); } catch (e) {} });
  });
})();
