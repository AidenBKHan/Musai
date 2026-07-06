/**
 * Synced copy of web-widget/musai-widget.js for the GitHub Pages demo
 * (docs/ is served as its own web root, so it can't reference ../web-widget).
 * Keep this in sync with the canonical source until a build step exists.
 *
 * Musai safety-index embeddable widget.
 *
 * Usage on any external site:
 *   <div class="musai-safety-widget"
 *        data-country="KR"
 *        data-region="Seoul"
 *        data-api-base="https://your-musai-backend.example.com"></div>
 *   <script src="https://your-cdn.example.com/musai-widget.js" async></script>
 *
 * `data-api-base` is optional — without it (or if the request fails/times
 * out) the widget falls back to clearly-labeled demo data instead of
 * breaking the host page.
 *
 * Host pages that need to re-render a widget on demand (e.g. after a user
 * picks a different country) can call `window.MusaiWidget.renderInto(el, {
 * countryCode, regionName, apiBase })` directly instead of relying on the
 * one-time data-attribute scan.
 */
(function () {
  var DEMO_SCORES = {
    KR: { name: '대한민국', score: 78.4 },
    US: { name: 'United States', score: 61.0 },
    FR: { name: 'France', score: 64.2 },
    GB: { name: 'United Kingdom', score: 70.5 },
    JP: { name: 'Japan', score: 88.1 },
  };

  function demoScoreFor(countryCode) {
    var known = DEMO_SCORES[countryCode.toUpperCase()];
    if (known) return known;
    var hash = 7;
    for (var i = 0; i < countryCode.length; i++) {
      hash = (hash * 31 + countryCode.charCodeAt(i)) % 997;
    }
    return { name: countryCode.toUpperCase(), score: 50 + (hash % 46) };
  }

  function fetchIndex(apiBase, countryCode) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, 3000);

    return fetch(apiBase.replace(/\/$/, '') + '/v1/safety-index/' + countryCode, {
      signal: controller.signal,
    })
      .then(function (res) {
        if (!res.ok) throw new Error('musai-widget: bad response ' + res.status);
        return res.json();
      })
      .finally(function () {
        clearTimeout(timeoutId);
      });
  }

  function render(el, score, sourceName, location) {
    var shadow = el.shadowRoot || el.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<style>' +
      '.card{font-family:system-ui,-apple-system,sans-serif;background:#00796B;color:#fff;' +
      'border-radius:12px;padding:14px 16px;max-width:220px;box-sizing:border-box;}' +
      '.loc{font-size:12px;opacity:.9;margin:0 0 4px;}' +
      '.score{font-size:30px;font-weight:700;margin:0;line-height:1.1;}' +
      '.src{font-size:10px;opacity:.75;margin-top:6px;}' +
      '</style>' +
      '<div class="card">' +
      '<p class="loc">' + location + '</p>' +
      '<p class="score">' + score.toFixed(1) + '</p>' +
      '<p class="src">' + sourceName + '</p>' +
      '</div>';
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
    var location = regionName ? regionName + ', ' + countryCode.toUpperCase() : countryCode.toUpperCase();

    var showDemo = function () {
      var demo = demoScoreFor(countryCode);
      render(el, demo.score, '데모 모드 (실시간 API 미연결)', location);
    };

    if (!apiBase) {
      showDemo();
      return Promise.resolve();
    }

    return fetchIndex(apiBase, countryCode)
      .then(function (data) {
        render(el, data.score, data.sourceName, location);
      })
      .catch(showDemo);
  }

  function paramsFromAttributes(el) {
    return {
      countryCode: el.getAttribute('data-country'),
      regionName: el.getAttribute('data-region'),
      apiBase: el.getAttribute('data-api-base'),
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
