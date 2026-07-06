/**
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
 * `data-layout` is "card" (default, static) or "bottomsheet" (full-width,
 * anchored to the bottom of the viewport, with a dismiss button) — matching
 * the proposal's tablet/desktop/mobile mockups for a voucher confirmation /
 * pre-departure notice / post-insurance-signup screen.
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
  var STATUS_COLORS = { safe: '#2e7d32', caution: '#c9930f', warning: '#d9730d', avoid: '#c62828' };

  // Small circular crop of the proposal's own "무사(MUSA)" mascot artwork.
  var MASCOT_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAqFBMVEVlYWSanqWTblvRlWuqjHLnsJ3y0aZziaP06uJidY8vMkqdZTJiSDSZrcQhHyvUbGhcMB81ZqEzR2ZCPEm2wtKdMTL6x3S7gT7EgzVemsefPkI9lNWHe4MAAADLy88rJygXFRQJCQrq2M3KqJDox7DPuKqymonW09S4pJSpuMoVFyjz5NgiHBnVw7evqqrUtJk4MzJsWE1JODInIR3OmYaImKzqqJNPSExkQ7ykAAAAOHRSTlP//////////////////////////////////////wD//////////////////////////////////9gBaMoAAAweSURBVHjarZpnY+q4EoZHsmzcIIQkZ8u9axlcKe5w/P//2c5ItkNNOLs7HwihvI+mSBrZwF9PmySr5Wo+c0P59LfgqU/1fl0rfXmQkARlHap//htAnLdaXyEgDbK9XTSy00D5bwFxUVVNPY6/Y1mQmKaZ2WzQl139LwCmYcZx3MhRX/ZZZr+g/cxsCGXYUaTCNor+GeB4PCLBAjlZCJvMfHmZzXhgs3VIRq/2wvN+HWAcyYyfXJ5Zu9nPZ7P/vTqbrJ4A6IPnPUQ8AhgK8NO80Jch22d//PHqsNGBMFxQabWcPyLAA3kFMO1UXgLAzjbBO2YCCHBQiAO+0Qjucf40ID5qQMw6XZyHw4HKtAv7YrPZbxK7DNeI06YK1udkTwI2caQAU3xApA3H4uG5ZVnGEfPMeVpYOWBo2iETLQGMZwBBoAE/j1iJNX2P2ZZpkj7JE+jj4yO2KkNQxb6AyHm90ATjtmLhVj/I8MuGwVspiggVUIsC/LFsBDR+C0u0htPTP/HFZRRHlkBxGS4JEH0DCMjiKjKahif7ivNl27TjPFPBCCeTCyqhuvV9zABGDaSIUvHxJUDpY4wqAZw3rRwncdd1h0P4lR3qhteQiuj48QWA1LNgm3Po23GtCZ+09XqNOet5+fLxEIDqWcCgnwLyUOrKzhih7GH5AICDL1lfq4gcvpF8CFHJaR8ASgBK6OHXlO8h7gJKVG9p0o7pXP+y3SF8AlLKK017HZ71PzOqp44q4waA4x+2we5G/6lEf35UyXTXABjrUqXgRv0w2negUPswbdYjgE36VEHn30DRrjt78wZzi+jO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';

  // Mirrors the proposal's own MVP destinations & scores exactly — see the
  // comment above DESTINATIONS in backend/src/sources/kr/dataGoKrSource.ts
  // for the risk-component breakdown, and the .hwp's own mockup images
  // ([그림2]/[그림3]/[그림4]) for the tags/tips (Paris and Phnom Penh copy is
  // taken directly from the mockup screenshots where legible).
  var DEMO_DESTINATIONS = {
    FR: {
      countryName: '프랑스', regionName: '파리', contextLabel: '관광지', score: 72, status: 'caution',
      riskTags: ['소매치기', '여권 분실', '관광지 주변 범죄'],
      safeHowTips: [
        { icon: '🎒', text: '백팩은 앞으로 메고 지퍼를 잠그세요.' },
        { icon: '⚠️', text: '야외 테이블 위에 스마트폰과 지갑을 올려두지 마세요.' },
        { icon: '📔', text: '여권 원본과 사본을 분리해 보관하세요.' },
      ],
    },
    JP: {
      countryName: '일본', regionName: '오사카', contextLabel: '입국 전', score: 84, status: 'caution',
      riskTags: ['의약품 반입', '입국 유의', '여권 분실'],
      safeHowTips: [
        { icon: '💊', text: '처방전이 필요한 의약품은 반입 규정을 출국 전 확인하세요.' },
        { icon: '🛃', text: '세관 신고 대상 품목을 미리 확인하세요.' },
        { icon: '📔', text: '여권·수하물 분실·도난에 대비해 사본을 보관하세요.' },
      ],
    },
    KH: {
      countryName: '캄보디아', regionName: '프놈펜', contextLabel: '출장·장기체류', score: 52, status: 'warning',
      riskTags: ['고수익 취업제안', '여권 보관 요구', '최신 공지 5건', '긴급 연락처'],
      safeHowTips: [
        { icon: '📄', text: '출국 전 회사·계약서·사업자 정보를 반드시 확인하세요.' },
        { icon: '🔒', text: '여권 원본을 타인에게 맡기지 말고, 본인이 직접 보관하세요.' },
        { icon: '⚠️', text: '위험 상황 발생 시 재외공관 공식 연락처로 우선 연락하세요.' },
      ],
    },
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
      contextLabel: '',
      score: score,
      status: statusFor(score),
      riskTags: [],
      safeHowTips: [{ icon: 'ℹ️', text: '실제 데이터 연동 전 표시되는 샘플 안내입니다.' }],
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

  /** score/100 ring drawn with a plain SVG circle + stroke-dasharray. */
  function gaugeSvg(score, color) {
    var r = 30;
    var c = 2 * Math.PI * r;
    var offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
    return (
      '<svg width="76" height="76" viewBox="0 0 76 76" class="gauge">' +
      '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="7"/>' +
      '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="7" ' +
      'stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + offset.toFixed(1) + '" ' +
      'transform="rotate(-90 38 38)"/>' +
      '<text x="38" y="35" text-anchor="middle" font-size="20" font-weight="700" fill="#14231f">' + score.toFixed(0) + '</text>' +
      '<text x="38" y="50" text-anchor="middle" font-size="9" fill="#6b7a75">/100</text>' +
      '</svg>'
    );
  }

  function css() {
    return (
      '*{box-sizing:border-box;}' +
      '.widget{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#14231f;' +
      'border-radius:16px;padding:16px 18px;max-width:300px;box-shadow:0 2px 16px rgba(0,0,0,.12);}' +
      '.widget.sheet{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;max-width:640px;' +
      'margin:0 auto;border-radius:18px 18px 0 0;padding:18px 20px 22px;box-shadow:0 -6px 24px rgba(0,0,0,.25);}' +
      '.head{display:flex;align-items:center;gap:10px;margin-bottom:12px;}' +
      '.avatar{width:34px;height:34px;border-radius:50%;flex:none;}' +
      '.headtext{flex:1;min-width:0;}' +
      '.title{font-size:13px;font-weight:700;margin:0;}' +
      '.subtitle{font-size:11px;color:#6b7a75;margin:0;}' +
      '.close{background:none;border:none;color:#6b7a75;font-size:16px;line-height:1;cursor:pointer;flex:none;padding:4px;}' +
      '.scorebox{display:flex;align-items:center;gap:12px;margin-bottom:10px;}' +
      '.scoretext{flex:1;min-width:0;}' +
      '.headline{font-size:13.5px;font-weight:700;margin:0 0 4px;}' +
      '.pill{display:inline-block;font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;color:#fff;}' +
      '.tags{margin:8px 0 12px;display:flex;flex-wrap:wrap;gap:6px;}' +
      '.tag{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:#fde8e8;color:#c0392b;}' +
      '.section-title{font-size:12px;font-weight:700;margin:0 0 8px;}' +
      '.tips{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:7px;}' +
      '.tips li{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;line-height:1.4;}' +
      '.num{flex:none;width:18px;height:18px;border-radius:50%;background:#2563eb;color:#fff;' +
      'font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;}' +
      '.icon{flex:none;}' +
      '.utilrow{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px;}' +
      '.utilbtn{font:inherit;font-size:10.5px;text-align:center;padding:8px 4px;border-radius:10px;' +
      'border:1px solid #e2e8e6;background:#f7faf9;color:#14231f;cursor:pointer;line-height:1.3;}' +
      '.utilbtn:active{background:#eef3f1;}' +
      '.feedback{display:flex;align-items:center;justify-content:space-between;gap:8px;' +
      'border-top:1px solid #eef1f0;padding-top:10px;}' +
      '.feedback span{font-size:11.5px;color:#6b7a75;}' +
      '.feedback .btns{display:flex;gap:6px;}' +
      '.fbtn{width:26px;height:26px;border-radius:50%;border:1px solid #e2e8e6;background:#fff;cursor:pointer;font-size:12px;}' +
      '.src{font-size:9.5px;color:#8a9793;margin:8px 0 0;}'
    );
  }

  function tagsMarkup(tags) {
    if (!tags || !tags.length) return '';
    return '<div class="tags">' + tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>';
  }

  function tipsMarkup(tips) {
    return '<ol class="tips">' + tips.map(function (t, i) {
      return '<li><span class="num">' + (i + 1) + '</span><span class="icon">' + (t.icon || '') + '</span><span>' + t.text + '</span></li>';
    }).join('') + '</ol>';
  }

  function bindInteractiveBits(root, el) {
    var closeBtn = root.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', function () { el.style.display = 'none'; });

    var fbtns = root.querySelectorAll('.fbtn');
    for (var i = 0; i < fbtns.length; i++) {
      fbtns[i].addEventListener('click', function (ev) {
        var span = root.querySelector('.feedback span');
        if (span) span.textContent = '피드백을 보내주셔서 감사합니다 (데모)';
        ev.currentTarget.style.background = '#e6f4ea';
      });
    }

    var utilBtns = root.querySelectorAll('.utilbtn');
    for (var j = 0; j < utilBtns.length; j++) {
      utilBtns[j].addEventListener('click', function (ev) {
        ev.currentTarget.textContent = ev.currentTarget.getAttribute('data-label') + ' (데모)';
      });
    }
  }

  function bodyMarkup(data, location, isSheet) {
    var color = STATUS_COLORS[data.status] || STATUS_COLORS.warning;
    var label = data.statusLabel || STATUS_LABELS[data.status] || data.status;
    var headline = location + (data.contextLabel ? ' ' + data.contextLabel : '') + ' 안전지수 ' + data.score.toFixed(0) + '점';
    return (
      '<div class="head">' +
      '<img class="avatar" src="' + MASCOT_DATA_URI + '" alt="" />' +
      '<div class="headtext"><p class="title">무사이 안전정보</p><p class="subtitle">여행지의 안전을 함께 지켜요</p></div>' +
      (isSheet ? '<button class="close" aria-label="닫기">✕</button>' : '') +
      '</div>' +
      '<div class="scorebox">' +
      gaugeSvg(data.score, color) +
      '<div class="scoretext"><p class="headline">' + headline + '</p>' +
      '<span class="pill" style="background:' + color + '">' + label + '</span></div>' +
      '</div>' +
      tagsMarkup(data.riskTags) +
      '<p class="section-title">✅ Safe-How 행동가이드</p>' +
      tipsMarkup(data.safeHowTips) +
      '<div class="utilrow">' +
      '<button class="utilbtn" data-label="🏛 공관 연락처 보기">🏛<br/>공관 연락처 보기</button>' +
      '<button class="utilbtn" data-label="📞 긴급번호 저장">📞<br/>긴급번호 저장</button>' +
      '<button class="utilbtn" data-label="📄 원문 출처 확인">📄<br/>원문 출처 확인</button>' +
      '</div>' +
      '<div class="feedback"><span>💬 이 정보가 도움이 되었나요?</span>' +
      '<div class="btns"><button class="fbtn" aria-label="도움이 됨">👍</button><button class="fbtn" aria-label="도움이 안 됨">👎</button></div></div>' +
      '<p class="src">' + data.sourceName + '</p>'
    );
  }

  function render(el, data, location, layout) {
    var shadow = el.shadowRoot || el.attachShadow({ mode: 'open' });
    var isSheet = layout === 'bottomsheet';
    shadow.innerHTML =
      '<style>' + css() + '</style>' +
      '<div class="widget' + (isSheet ? ' sheet' : '') + '">' + bodyMarkup(data, location, isSheet) + '</div>';
    bindInteractiveBits(shadow, el);
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
        contextLabel: demo.contextLabel,
        riskTags: demo.riskTags,
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
