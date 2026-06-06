/**
 * AG1 Open-Trigger - page snippet.
 *
 * Drop this on any hub/landing page. When a prospect genuinely opens the page
 * (stays >4s, tab visible), it beacons your Apps Script endpoint, which alerts you
 * to send the nudge. Fires once per session. Filters quick prefetch + link-preview bots.
 *
 * USE: set ENDPOINT (your deployed Apps Script web app URL) and keep TOKEN matching.
 * Identify the lead either by setting `window.AG_LEAD = 'omar';` before this script,
 * or it auto-derives from the first part of the URL path (the repo/folder name).
 */
(function () {
  // ===== CONFIG =====
  var ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
  var TOKEN = 'ag1-open-trigger';            // must match SHARED_TOKEN in the Apps Script
  var OPEN_DELAY_MS = 4000;                   // must stay this long for it to count as a real open
  var ENGAGED_SCROLL = 0.6;                   // 60% scroll depth = "engaged" (logged, no alert)

  var LEAD = (window.AG_LEAD) ||
             (location.pathname.replace(/^\/+/, '').split('/')[0]) ||
             'unknown';

  function send(event) {
    var u = ENDPOINT +
      '?token=' + encodeURIComponent(TOKEN) +
      '&lead='  + encodeURIComponent(LEAD) +
      '&event=' + encodeURIComponent(event) +
      '&page='  + encodeURIComponent(location.href) +
      '&ref='   + encodeURIComponent(document.referrer || '') +
      '&ua='    + encodeURIComponent(navigator.userAgent || '') +
      '&t='     + Date.now();
    try { if (navigator.sendBeacon && navigator.sendBeacon(u)) return; } catch (e) {}
    try { new Image().src = u; } catch (e) {}
  }

  // "open" once per session, after dwell + tab actually visible
  function maybeOpen() {
    try {
      if (sessionStorage.getItem('ag_open_' + LEAD)) return;
      if (document.visibilityState !== 'visible') return;
      sessionStorage.setItem('ag_open_' + LEAD, '1');
    } catch (e) {}
    send('open');
  }
  setTimeout(maybeOpen, OPEN_DELAY_MS);

  // "engaged" once on deep scroll
  var engaged = false;
  window.addEventListener('scroll', function () {
    if (engaged) return;
    var h = document.documentElement;
    var depth = (h.scrollTop + window.innerHeight) / h.scrollHeight;
    if (depth >= ENGAGED_SCROLL) {
      engaged = true;
      try {
        if (sessionStorage.getItem('ag_eng_' + LEAD)) return;
        sessionStorage.setItem('ag_eng_' + LEAD, '1');
      } catch (e) {}
      send('engaged');
    }
  }, { passive: true });
})();
