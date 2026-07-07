/**
 * Musai safety-check-index embeddable widget.
 *
 * Usage on any external site:
 *   <div class="musai-safety-widget"
 *        data-country="FR"
 *        data-region="파리"
 *        data-layout="card"
 *        data-api-base="https://your-musai-backend.example.com"></div>
 *   <script src="https://aidenbkhan.github.io/musai/musai-widget.js" async></script>
 *
 * `data-layout` is one of:
 *   - "card" (default) — compact, static, small circular mascot avatar
 *   - "bottomsheet" — full-width, anchored to the bottom of the viewport,
 *     with a dismiss button, matching the mobile mockup
 *   - "wide" — horizontal panel with the large mascot illustration, for a
 *     desktop sidebar placement (matches the desktop mockup)
 *   - "bubble" — a small fixed round button (mascot + score badge) anchored
 *     to a corner of the viewport, matching how a chat widget stays out of
 *     the way until the visitor wants it. Clicking it expands into the full
 *     bottomsheet view; the bottomsheet's close button collapses it back
 *     into the bubble instead of removing it.
 *   - "banner" — an inline CTA bar (mascot + score badge + "확인해 보세요")
 *     sitting in the host page's own content flow, matching the proposal's
 *     own [그림4] mockup (a strip under a booking-confirmation receipt).
 *     Clicking it expands into the bottomsheet the same way "bubble" does,
 *     and collapses back into the banner on close.
 *
 * `data-position` only applies to "bubble" and "banner":
 *   - "bubble": which viewport corner it's fixed to — "bottom-right"
 *     (default), "bottom-left", "top-right", "top-left".
 *   - "banner": "inline" (default) to sit wherever the host page puts the
 *     `<div>`, or "top"/"bottom" to instead stick as a full-width bar fixed
 *     to that edge of the viewport (like a cookie-consent bar).
 *
 * `data-size` also only applies to "bubble" and "banner" — "sm", "md"
 * (default), or "lg". Every dimension scales together from one factor, so
 * any size stays internally proportioned without clipping or overlap.
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

  // Larger, less-cropped version of the same mascot art for the "wide" layout.
  var MASCOT_WIDE_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAL4AAAD2CAMAAABfoc2uAAABSlBMVEXVXl/go5deVVCdYVddJhvVm1YxXpfv5+GcXCM1SGEjFyIhLEyrMTT31JvHiThzTyqmoIpXdZycsMabnW3GPEO7gThGPEhvkmbEMzrSvcJciKr1xHlvnMS4O0E0TTTEeSaHfIenwpbZeoA5ktOv1fLIyM3W1NfHurKwqaXm5OQrJym6s7Cqmo/n2dCyo5cXFRTQw7gKCQvJqY6alZLRtZWNeWqXhHLoyLAVFynv49moiW6ot8ltWE5LODKwlXduiaiKaVBPR0uRdFfNlk9peo9zFBeNiIpvaGp2ZFSJma3x1bKVpbixdzNPaImrKjAjHBg4MzNyhJi0hlDOpnJMWG2UIydrSDPPmIYqIhx5k7Dd3eDxyI0yNktPCAq9wclVQzp4dXPPiHbsualYc5TKmHCKWSxVZHfqqJOXZTHotm+NHSGYq8OGGRynek5qZp/pAAAAbnRSTlP//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////40H074AADTJSURBVHja3Z37X9rY0/ghgOAVa1u7993P53lIYggxQhIkJiEBSrhWbqIWWtgKLtTy///6nTkJFxUvre5+t8+8Wq/UvmfOzJyZc06Onsj3Jx+ncvTRE/me+b8n/I8fv2v8yCJ+5PvD/76d5/8MfuQ7x4985/hTLb5b/I/fN74j3zX+x+8R/+PC5PU9W/87zTyz4uc7tf7HmQLf7az7fyDz/IP4Xu8nL5FP3yF+0OuZyzMq8c/gf/J6Xnle/fBu44eNjVeuDp++F/xPaPofXr378uUdwv/www+E/8fvBB9M/wqY3737AYbgHbzzwEi8ehb7e/4Jeg+gIza+2Xj1aoN89uppA/DxH8L/BLZ+t/HuMxB//vz5BI0PCvyw4Sjw6d9ufa8H/ebkBOGBHvjxk3c4BBseT8D7r8d/t7Gx8YXAn5zgm3cnXz6fAD58+akR/Pfj//eHHzYg55x8Bg3efkH8z1++gA4bG78SB3qS//wD1odcD5yf3/rfvoW/J4T/8+cvYP1fiQM9hf+fcJ7fQ18A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';

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
      '.widget.wide{max-width:660px;display:flex;flex-direction:row;align-items:stretch;padding:0;overflow:hidden;}' +
      '.widget.wide .content{flex:1;min-width:0;padding:20px 22px;}' +
      '.mascot-big{width:210px;flex:none;align-self:stretch;height:auto;object-fit:contain;' +
      'background:#c8c9cd;display:block;}' +
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
      '.src{font-size:9.5px;color:#8a9793;margin:8px 0 0;}' +
      // "--s" is a scale factor set inline per-instance from data-size (see
      // sizeScale()); every bubble/banner dimension below is calc()-derived
      // from it so any size stays internally proportioned and never clips
      // or overlaps, instead of needing separate sm/md/lg rule sets.
      '.bubble{position:fixed;z-index:2147483000;width:calc(60px * var(--s,1));height:calc(60px * var(--s,1));' +
      'border-radius:50%;border:none;padding:0;cursor:pointer;background:#fff;' +
      'box-shadow:0 4px 16px rgba(0,0,0,.25);font-family:system-ui,-apple-system,sans-serif;}' +
      '.bubble-avatar{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover;}' +
      '.bubble-score{position:absolute;right:calc(-4px * var(--s,1));bottom:calc(-4px * var(--s,1));' +
      'min-width:calc(22px * var(--s,1));height:calc(22px * var(--s,1));padding:0 calc(4px * var(--s,1));' +
      'border-radius:999px;color:#fff;font-size:calc(11px * var(--s,1));font-weight:700;display:flex;' +
      'align-items:center;justify-content:center;border:calc(2px * var(--s,1)) solid #fff;' +
      'box-shadow:0 1px 3px rgba(0,0,0,.2);}' +
      '.banner{width:100%;max-width:calc(400px * var(--s,1));display:flex;align-items:center;' +
      'gap:calc(12px * var(--s,1));text-align:left;box-sizing:border-box;' +
      'font-family:system-ui,-apple-system,sans-serif;background:#fdf3ec;' +
      'border:1.5px solid #f6d9a8;border-radius:calc(16px * var(--s,1));' +
      'padding:calc(10px * var(--s,1)) calc(14px * var(--s,1));cursor:pointer;}' +
      '.banner.fixed-top,.banner.fixed-bottom{position:fixed;left:0;right:0;max-width:none;' +
      'width:100%;border-radius:0;border-left:none;border-right:none;z-index:2147483000;box-sizing:border-box;}' +
      '.banner.fixed-top{top:0;border-top:none;}' +
      '.banner.fixed-bottom{bottom:0;border-bottom:none;}' +
      '.banner-avatarwrap{position:relative;flex:none;width:calc(52px * var(--s,1));' +
      'height:calc(72px * var(--s,1));background:#c8c9cd;border-radius:calc(10px * var(--s,1));' +
      'overflow:hidden;}' +
      '.banner-avatar{width:100%;height:100%;display:block;object-fit:contain;object-position:center top;}' +
      '.banner-score{position:absolute;left:calc(-4px * var(--s,1));top:calc(-4px * var(--s,1));' +
      'min-width:calc(20px * var(--s,1));height:calc(20px * var(--s,1));padding:0 calc(4px * var(--s,1));' +
      'border-radius:999px;background:#f2921a;color:#fff;font-size:calc(10px * var(--s,1));font-weight:700;' +
      'display:flex;align-items:center;justify-content:center;border:calc(2px * var(--s,1)) solid #fdf3ec;}' +
      '.banner-textwrap{display:flex;flex-direction:column;gap:calc(3px * var(--s,1));min-width:0;flex:1;}' +
      '.banner-title{font-size:calc(13.5px * var(--s,1));font-weight:700;color:#182430;overflow:hidden;' +
      'text-overflow:ellipsis;white-space:nowrap;}' +
      '.banner-cta{font-size:calc(12px * var(--s,1));font-weight:600;color:#f2921a;display:flex;' +
      'align-items:center;gap:calc(4px * var(--s,1));white-space:nowrap;}' +
      '.banner-chevron{display:inline-flex;align-items:center;justify-content:center;' +
      'width:calc(16px * var(--s,1));height:calc(16px * var(--s,1));border-radius:50%;background:#f2921a;' +
      'color:#fff;font-size:calc(11px * var(--s,1));line-height:1;flex:none;}'
    );
  }

  function bubbleMarkup(data, color) {
    return (
      '<button class="bubble" aria-label="무사이 안전정보 열기 (안전지수 ' + data.score.toFixed(0) + '점)">' +
      '<img class="bubble-avatar" src="' + MASCOT_DATA_URI + '" alt="" />' +
      '<span class="bubble-score" style="background:' + color + '">' + data.score.toFixed(0) + '</span>' +
      '</button>'
    );
  }

  // Matches the proposal's own [그림4] mockup: an inline CTA banner sitting
  // in the host page's content flow (e.g. under a booking-confirmation
  // receipt), rather than a fixed floating icon like "bubble". Uses the same
  // full-body mascot art (on its matching studio-gray backdrop) as "wide",
  // not just the small round face crop, since a strip this size has room to
  // show the whole character.
  function bannerMarkup(data, location) {
    return (
      '<button class="banner" aria-label="무사이 안전정보 열기 (안전지수 ' + data.score.toFixed(0) + '점)">' +
      '<span class="banner-avatarwrap">' +
      '<img class="banner-avatar" src="' + MASCOT_WIDE_DATA_URI + '" alt="" />' +
      '<span class="banner-score">' + data.score.toFixed(0) + '</span>' +
      '</span>' +
      '<span class="banner-textwrap">' +
      '<span class="banner-title">' + location + ' 무사이 안전정보</span>' +
      '<span class="banner-cta">확인해 보세요 <span class="banner-chevron">›</span></span>' +
      '</span>' +
      '</button>'
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
    if (closeBtn) closeBtn.addEventListener('click', function () {
      if (el.__musaiCollapsedOrigin) {
        render(el, el.__musaiData, el.__musaiLocation, el.__musaiCollapsedOrigin, el.__musaiPosition, el.__musaiSize);
      } else {
        el.style.display = 'none';
      }
    });

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

  function bodyMarkup(data, location, layout) {
    var isSheet = layout === 'bottomsheet';
    var isWide = layout === 'wide';
    var color = STATUS_COLORS[data.status] || STATUS_COLORS.warning;
    var label = data.statusLabel || STATUS_LABELS[data.status] || data.status;
    var headline = location + (data.contextLabel ? ' ' + data.contextLabel : '') + ' 안전지수 ' + data.score.toFixed(0) + '점';
    var inner =
      '<div class="head">' +
      (isWide ? '' : '<img class="avatar" src="' + MASCOT_DATA_URI + '" alt="" />') +
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
      '<p class="src">' + data.sourceName + '</p>';

    if (isWide) {
      return '<div class="content">' + inner + '</div><img class="mascot-big" src="' + MASCOT_WIDE_DATA_URI + '" alt="" />';
    }
    return inner;
  }

  // data-position corners for "bubble" (a fixed viewport-anchored icon).
  var BUBBLE_POSITIONS = {
    'bottom-right': { bottom: '18px', right: '18px' },
    'bottom-left': { bottom: '18px', left: '18px' },
    'top-right': { top: '18px', right: '18px' },
    'top-left': { top: '18px', left: '18px' },
  };
  // data-size multipliers, consumed as the "--s" CSS variable so every
  // bubble/banner dimension scales together via calc() instead of needing
  // separate rule sets per size.
  var SIZE_SCALE = { sm: 0.8, md: 1, lg: 1.3 };

  function sizeScale(size) {
    return SIZE_SCALE[size] || SIZE_SCALE.md;
  }

  function render(el, data, location, layout, position, size) {
    var shadow = el.shadowRoot || el.attachShadow({ mode: 'open' });
    el.__musaiData = data;
    el.__musaiLocation = location;
    el.__musaiPosition = position;
    el.__musaiSize = size;

    if (layout === 'bubble' || layout === 'banner') {
      var color = STATUS_COLORS[data.status] || STATUS_COLORS.warning;
      var collapsedHtml = layout === 'bubble' ? bubbleMarkup(data, color) : bannerMarkup(data, location);
      shadow.innerHTML = '<style>' + css() + '</style>' + collapsedHtml;
      var collapsedBtn = shadow.querySelector(layout === 'bubble' ? '.bubble' : '.banner');
      if (collapsedBtn) {
        collapsedBtn.style.setProperty('--s', String(sizeScale(size)));
        if (layout === 'bubble') {
          var corner = BUBBLE_POSITIONS[position] || BUBBLE_POSITIONS['bottom-right'];
          for (var side in corner) collapsedBtn.style[side] = corner[side];
        } else if (position === 'top' || position === 'bottom') {
          collapsedBtn.classList.add('fixed-' + position);
        }
        collapsedBtn.addEventListener('click', function () {
          el.__musaiCollapsedOrigin = layout;
          render(el, data, location, 'bottomsheet', position, size);
        });
      }
      return;
    }

    var extraClass = layout === 'bottomsheet' ? ' sheet' : layout === 'wide' ? ' wide' : '';
    shadow.innerHTML =
      '<style>' + css() + '</style>' +
      '<div class="widget' + extraClass + '">' + bodyMarkup(data, location, layout) + '</div>';
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
    var VALID_LAYOUTS = { bottomsheet: 1, wide: 1, bubble: 1, banner: 1 };
    var layout = VALID_LAYOUTS[params.layout] ? params.layout : 'card';
    var position = BUBBLE_POSITIONS[params.position] ? params.position
      : (params.position === 'top' || params.position === 'bottom') ? params.position
      : undefined;
    var size = SIZE_SCALE[params.size] ? params.size : undefined;

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
      }, loc, layout, position, size);
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
        render(el, data, loc, layout, position, size);
      })
      .catch(showDemo);
  }

  function paramsFromAttributes(el) {
    return {
      countryCode: el.getAttribute('data-country'),
      regionName: el.getAttribute('data-region'),
      apiBase: el.getAttribute('data-api-base'),
      layout: el.getAttribute('data-layout'),
      position: el.getAttribute('data-position'),
      size: el.getAttribute('data-size'),
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
