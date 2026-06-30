/* =============================================================
   Exit Engine — shared site footer
   Self-contained: injects its own styles + markup + behavior.
   Include with <script src="/footer.js" defer></script>.
   Section links resolve per page (Home / ABM) from the URL path.
   ============================================================= */
(function () {
  "use strict";

  var CALENDLY = "https://calendly.com/ryan_carlin/30min";
  var LOGO = "/logo.png";

  // Ensure the Calendly popup widget is available, then run cb(ok).
  // Self-loads widget.js/widget.css if the host page didn't include them,
  // so "Book a call" opens the embed popup on any page.
  function ensureCalendly(cb) {
    if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") { cb(true); return; }
    if (!document.querySelector('link[href*="assets.calendly.com/assets/external/widget.css"]')) {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(l);
    }
    var s = document.querySelector('script[src*="assets.calendly.com/assets/external/widget.js"]');
    if (!s) {
      s = document.createElement("script");
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      document.head.appendChild(s);
    }
    var done = false;
    function ready() {
      if (done) return; done = true;
      cb(!!(window.Calendly && window.Calendly.initPopupWidget));
    }
    s.addEventListener("load", ready, { once: true });
    s.addEventListener("error", ready, { once: true });
    var tries = 0;
    var iv = setInterval(function () {
      if (window.Calendly && window.Calendly.initPopupWidget) { clearInterval(iv); ready(); }
      else if (++tries > 50) { clearInterval(iv); ready(); }
    }, 100);
  }

  // ---- which page are we on? ----
  var path = location.pathname.replace(/\/index\.html$/, "/");
  var isAbm = /^\/abm(\/|$)/.test(path);

  // ---- page-aware hrefs: local section where it exists, else canonical /abm ----
  var hSystem  = isAbm ? "#system"  : "#approach";    // The Audit / Build / Handover
  var hProblem = isAbm ? "#problem" : "#problem";
  var hProof   = isAbm ? "#proof"   : "/abm#proof";   // no proof section on home
  var hFaq     = isAbm ? "#faq"     : "#faq";

  // ---- styles (scoped ee-ft-*, hardcoded colors so no token dependency) ----
  var css = '\
.ee-ft{background:#0E1116;color:rgba(255,255,255,.7);padding:80px 0 32px;border-top:2px solid #1E54F2;\
view-transition-name:ee-ft;font-family:"Archivo",ui-sans-serif,system-ui,sans-serif;}\
.ee-ft-wrap{max-width:1140px;margin:0 auto;padding:0 32px;}\
.ee-ft a{color:rgba(255,255,255,.7);text-decoration:none;display:block;padding:4px 0;font-size:14px;\
transition:color 120ms;cursor:pointer;}\
.ee-ft a:hover{color:#fff;}\
.ee-ft-inner{display:grid;grid-template-columns:1fr 2fr;gap:64px;padding-bottom:56px;\
border-bottom:1px solid rgba(255,255,255,.1);}\
.ee-ft-brand img{height:28px;width:auto;display:block;filter:invert(1) hue-rotate(180deg) saturate(1.4);\
margin-bottom:16px;}\
.ee-ft-brand p{font-size:14px;line-height:1.55;max-width:28ch;color:rgba(255,255,255,.55);margin:0;}\
.ee-ft-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;}\
.ee-ft-title{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;color:#fff;\
text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;font-weight:600;}\
.ee-ft-base{display:flex;justify-content:space-between;gap:16px;padding-top:24px;\
font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;color:rgba(255,255,255,.45);\
text-transform:uppercase;letter-spacing:.08em;}\
.ee-ft-accent{color:#1E54F2;}\
@media (max-width:720px){\
.ee-ft-inner{grid-template-columns:1fr;gap:40px;}\
.ee-ft-cols{grid-template-columns:1fr;gap:28px;}\
.ee-ft-base{flex-direction:column;gap:8px;white-space:normal;}}';

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- markup ----
  var footer = document.createElement("footer");
  footer.className = "ee-ft";
  footer.innerHTML = '\
<div class="ee-ft-wrap ee-ft-inner">\
<div class="ee-ft-brand">\
<a href="/" aria-label="Exit Engine — home"><img src="' + LOGO + '" alt="Exit Engine"></a>\
<p>Growth systems that survive due diligence. Built inside software companies, now available to you.</p>\
</div>\
<div class="ee-ft-cols">\
<div>\
<div class="ee-ft-title">The system</div>\
<a href="' + hSystem + '">The Audit</a>\
<a href="' + hSystem + '">The Build</a>\
<a href="' + hSystem + '">The Handover</a>\
</div>\
<div>\
<div class="ee-ft-title">Index</div>\
<a href="' + hProblem + '">The problem</a>\
<a href="' + hProof + '">Proof</a>\
<a href="' + hFaq + '">FAQ</a>\
</div>\
<div>\
<div class="ee-ft-title">Reach</div>\
<a href="mailto:ryan@exitengine.us">ryan@exitengine.us</a>\
<a href="' + CALENDLY + '" data-cal>Book a call</a>\
<a href="#">LinkedIn</a>\
</div>\
</div>\
</div>\
<div class="ee-ft-wrap ee-ft-base">\
<span>© 2026 Exit Engine · exitengine.us</span>\
<span>Coverage before spend. <span class="ee-ft-accent">↗</span></span>\
</div>';

  function mount() {
    document.body.appendChild(footer);

    // Book a call — open the Calendly embed popup (load the widget on demand if needed)
    footer.querySelectorAll("[data-cal]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        ensureCalendly(function (ok) {
          if (ok && window.Calendly && window.Calendly.initPopupWidget) {
            window.Calendly.initPopupWidget({ url: CALENDLY });
          } else {
            window.open(CALENDLY, "_blank", "noopener");
          }
        });
      });
    });
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
