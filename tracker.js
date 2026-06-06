/**
 * AG1 Open-Trigger - page snippet (robust v2).
 *
 * Drop this on any hub/landing page. Fires ONCE per session when the prospect has
 * had the page actually visible for ~4s total (time is accumulated, so opening in a
 * background tab, switching tabs, or a mobile in-app browser still counts once it
 * comes to the foreground). Beacons the Apps Script endpoint, which alerts Andrei.
 * Filters quick prefetch + link-preview bots (they never linger 4s visible).
 *
 * USE: set ENDPOINT (deployed Apps Script web app URL), keep TOKEN matching.
 * Identify the lead via `window.AG_LEAD = 'slug';` before this script, or it
 * auto-derives from the first part of the URL path (the repo/folder name).
 */
(function () {
  // ===== CONFIG =====
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzAog92HV-MccnPd3C6p_JnTTdgsveBHMK1OHuGXc_D9rnJ6qtiybL0gUhH5ew0XJKp/exec';
  var TOKEN = 'ag1-open-trigger';            // must match SHARED_TOKEN in the Apps Script
  var OPEN_DELAY_MS = 4000;                  // total VISIBLE time before it counts as a real open
  var ENGAGED_SCROLL = 0.6;                  // 60% scroll depth = "engaged" (logged, no alert)

  var LEAD = (window.AG_LEAD) ||
             (location.pathname.replace(/^\/+/, '').split('/')[0]) ||
             'unknown';

  function now() { return (new Date()).getTime(); }

  function send(event) {
    var u = ENDPOINT +
      '?token=' + encodeURIComponent(TOKEN) +
      '&lead='  + encodeURIComponent(LEAD) +
      '&event=' + encodeURIComponent(event) +
      '&page='  + encodeURIComponent(location.href) +
      '&ref='   + encodeURIComponent(document.referrer || '') +
      '&ua='    + encodeURIComponent(navigator.userAgent || '') +
      '&t='     + now();
    try { if (navigator.sendBeacon && navigator.sendBeacon(u)) return; } catch (e) {}
    try { new Image().src = u; } catch (e) {}
  }

  // ---- OPEN: accumulate visible time, fire once at the threshold ----
  var openFired = false;
  try { if (sessionStorage.getItem('ag_open_' + LEAD)) openFired = true; } catch (e) {}

  function markOpen() {
    if (openFired) return;
    openFired = true;
    try { sessionStorage.setItem('ag_open_' + LEAD, '1'); } catch (e) {}
    send('open');
  }

  var visibleMs = 0, lastTick = null;
  function tickVisible() {
    if (openFired) { if (openTimer) { clearInterval(openTimer); openTimer = null; } return; }
    if (document.visibilityState === 'visible') {
      var t = now();
      if (lastTick !== null) visibleMs += t - lastTick;
      lastTick = t;
      if (visibleMs >= OPEN_DELAY_MS) markOpen();
    } else {
      lastTick = null; // pause accumulation while hidden
    }
  }
  var openTimer = setInterval(tickVisible, 1000);
  document.addEventListener('visibilitychange', tickVisible);
  tickVisible(); // start counting immediately if already visible

  // ---- ENGAGED: deep scroll (logged only, no alert) ----
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
