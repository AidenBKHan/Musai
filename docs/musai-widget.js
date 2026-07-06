/**
 * Synced copy of web-widget/musai-widget.js for the GitHub Pages demo
 * (docs/ is served as its own web root, so it can't reference ../web-widget).
 * Keep this in sync with the canonical source until a build step exists.
 *
 * Musai safety-check-index embeddable widget.
 *
 * Usage on any external site:
 *   <div class="musai-safety-widget"
 *        data-country="FR"
 *        data-region="파리"
 *        data-layout="card"
 *        data-api-base="https://your-musai-backend.example.com"></div>
 *   <script src="https://your-cdn.example.com/musai-widget.js" async></script>
 *
 * `data-layout` is "card" (default, compact) or "bottomsheet" (full-width,
 * anchored to the bottom of the viewport, matching the mobile/tablet
 * booking-confirmation mockups) — intended for insertion into a voucher
 * confirmation / pre-departure notice / post-insurance-signup screen.
 *
 * `data-api-base` is optional — without it (or if the request fails/times
 * out) the widget falls back to clearly-labeled demo data instead of
 * breaking the host page.
 *
 * Host pages that need to re-render a widget on demand (e.g. after a user
 * picks a different destination) can call `window.MusaiWidget.renderInto(el, {
 * countryCode, regionName, apiBase, layout })` directly instead of relying
 * on the one-time data-attribute scan.
 */
(function () {
  var STATUS_LABELS = { safe: '안전', caution: '유의 필요', warning: '위험', avoid: '여행 자제 권고' };
  var STATUS_COLORS = { safe: '#2e7d32', caution: '#b8860b', warning: '#d9730d', avoid: '#c62828' };

  // Mirrors the proposal's own MVP destinations & scores exactly (see the
  // comment above DESTINATIONS in backend/src/sources/kr/dataGoKrSource.ts
  // for the per-component breakdown these were derived from), so demo mode
  // tells the same story as the real backend once it's deployed.
  var DEMO_DESTINATIONS = {
    FR: { countryName: '프랑스', regionName: '파리', score: 72, status: 'caution',
      safeHowTips: [
        '주요 관광지·대중교통 이용 시 소매치기에 유의하세요.',
        '여권·휴대폰 분실에 대비해 사본을 별도로 보관하세요.',
        '군중이 밀집한 시위·집회 지역은 피해서 이동하세요.',
      ] },
    JP: { countryName: '일본', regionName: '오사카', score: 84, status: 'caution',
      safeHowTips: [
        '처방전이 필요한 의약품은 반입 규정을 출국 전 확인하세요.',
        '세관 신고 대상 품목을 미리 확인하세요.',
        '여권·수하물 분실·도난에 대비해 사본을 보관하세요.',
      ] },
    KH: { countryName: '캄보디아', regionName: '프놈펜', score: 52, status: 'warning',
      safeHowTips: [
        '고수익 해외 취업 제안은 사실 확인 없이 응하지 마세요.',
        '여권은 본인이 직접 보관하고 타인에게 맡기지 마세요.',
        '출국 전 재외공관 연락처를 미리 확인해두세요.',
      ] },
  };

  function statusFor(score) {
    if (score >= 85) return 'safe';
    if (score >= 65) return 'caution';
    if (score >= 40) return 'warning';
    return 'avoid';
  }

  function demoDataFor(countryCode, regionName) {
    var known = DEMO_DESTINATIONS[countryCode.toUpperCase()];
    if (known) return known;
    var hash = 7;
    for (var i = 0; i < countryCode.length; i++) hash = (hash * 31 + countryCode.charCodeAt(i)) % 997;
    var score = 50 + (hash % 46);
    return {
      countryName: countryCode.toUpperCase(),
      regionName: regionName,
      score: score,
      status: statusFor(score),
      safeHowTips: ['실제 데이터 연동 전 표시되는 샘플 안내입니다.'],
    };
  }

  function fetchIndex(apiBase, countryCode) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 3000);
    return fetch(apiBase.replace(/\/$/, '') + '/v1/safety-index/' + countryCode, { signal: controller.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('musai-widget: bad response ' + res.status);
        return res.json();
      })
      .finally(function () { clearTimeout(timeoutId); });
  }

  function cardCss() {
    return (
      '.card{font-family:system-ui,-apple-system,sans-serif;background:#00796B;color:#fff;' +
      'border-radius:14px;padding:16px 18px;max-width:280px;box-sizing:border-box;}' +
      '.title{font-size:11px;letter-spacing:.02em;opacity:.85;margin:0 0 6px;text-transform:uppercase;}' +
      '.loc{font-size:14px;font-weight:600;margin:0 0 8px;}' +
      '.scorerow{display:flex;align-items:baseline;gap:8px;margin:0 0 8px;}' +
      '.score{font-size:32px;font-weight:700;line-height:1;}' +
      '.pill{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;color:#fff;white-space:nowrap;}' +
      '.tips{margin:0 0 8px;padding:0;list-style:none;}' +
      '.tips li{font-size:12.5px;line-height:1.4;opacity:.95;padding-left:14px;position:relative;margin-bottom:3px;}' +
      '.tips li::before{content:"·";position:absolute;left:2px;}' +
      '.src{font-size:10px;opacity:.7;margin:0;}'
    );
  }

  function bottomSheetCss() {
    return (
      cardCss() +
      '.sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;' +
      'background:#00796B;color:#fff;font-family:system-ui,-apple-system,sans-serif;' +
      'border-radius:16px 16px 0 0;padding:18px 20px 22px;box-shadow:0 -6px 24px rgba(0,0,0,.25);' +
      'box-sizing:border-box;max-width:640px;margin:0 auto;}' +
      '.sheet .title{display:flex;justify-content:space-between;align-items:center;}' +
      '.close{background:none;border:none;color:#fff;opacity:.75;font-size:18px;line-height:1;cursor:pointer;padding:0 0 0 12px;}'
    );
  }

  function tipsMarkup(tips) {
    return '<ul class="tips">' + tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  }

  function renderMarkup(data, location) {
    var color = STATUS_COLORS[data.status] || STATUS_COLORS.warning;
    var label = data.statusLabel || STATUS_LABELS[data.status] || data.status;
    return (
      '<p class="title">무사이 안전정보</p>' +
      '<p class="loc">' + location + '</p>' +
      '<div class="scorerow">' +
      '<span class="score">' + data.score.toFixed(1) + '</span>' +
      '<span class="pill" style="background:' + color + '">' + label + '</span>' +
      '</div>' +
      tipsMarkup(data.safeHowTips) +
      '<p class="src">' + data.sourceName + '</p>'
    );
  }

  function render(el, data, location, layout) {
    var shadow = el.shadowRoot || el.attachShadow({ mode: 'open' });
    if (layout === 'bottomsheet') {
      shadow.innerHTML =
        '<style>' + bottomSheetCss() + '</style>' +
        '<div class="sheet">' +
        '<div class="title" style="text-transform:none;font-size:13px;opacity:1;">' +
        '<span>무사이 안전정보</span><button class="close" aria-label="닫기">✕</button>' +
        '</div>' +
        '<p class="loc">' + location + '</p>' +
        '<div class="scorerow">' +
        '<span class="score">' + data.score.toFixed(1) + '</span>' +
        '<span class="pill" style="background:' + (STATUS_COLORS[data.status] || STATUS_COLORS.warning) + '">' +
        (data.statusLabel || STATUS_LABELS[data.status] || data.status) + '</span>' +
        '</div>' +
        tipsMarkup(data.safeHowTips) +
        '<p class="src">' + data.sourceName + '</p>' +
        '</div>';
      var closeBtn = shadow.querySelector('.close');
      if (closeBtn) closeBtn.addEventListener('click', function () { el.style.display = 'none'; });
    } else {
      shadow.innerHTML = '<style>' + cardCss() + '</style><div class="card">' + renderMarkup(data, location) + '</div>';
    }
  }

  /** Renders (or re-renders) one widget element with an explicit param set. */
  function renderInto(el, params) {
    var countryCode = params && params.countryCode;
    if (!countryCode) {
      console.warn('musai-widget: renderInto requires countryCode', el);
      return;
    }
    var regionName = params.regionName;
    var apiBase = params.apiBase;
    var layout = params.layout === 'bottomsheet' ? 'bottomsheet' : 'card';

    var showDemo = function () {
      var demo = demoDataFor(countryCode, regionName);
      var loc = (regionName || demo.regionName)
        ? (regionName || demo.regionName) + ', ' + countryCode.toUpperCase()
        : countryCode.toUpperCase();
      render(el, {
        score: demo.score,
        status: demo.status,
        statusLabel: STATUS_LABELS[demo.status],
        safeHowTips: demo.safeHowTips,
        sourceName: '데모 모드 (실시간 API 미연결)',
      }, loc, layout);
    };

    if (!apiBase) {
      showDemo();
      return Promise.resolve();
    }

    return fetchIndex(apiBase, countryCode)
      .then(function (data) {
        var loc = (regionName || data.regionName)
          ? (regionName || data.regionName) + ', ' + countryCode.toUpperCase()
          : countryCode.toUpperCase();
        render(el, data, loc, layout);
      })
      .catch(showDemo);
  }

  function paramsFromAttributes(el) {
    return {
      countryCode: el.getAttribute('data-country'),
      regionName: el.getAttribute('data-region'),
      apiBase: el.getAttribute('data-api-base'),
      layout: el.getAttribute('data-layout'),
    };
  }

  function scan() {
    var elements = document.querySelectorAll('.musai-safety-widget:not([data-musai-initialized])');
    for (var i = 0; i < elements.length; i++) {
      elements[i].setAttribute('data-musai-initialized', 'true');
      renderInto(elements[i], paramsFromAttributes(elements[i]));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }

  window.MusaiWidget = { renderInto: renderInto, rescan: scan };
})();
