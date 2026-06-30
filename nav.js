/* =============================================================
   Exit Engine — shared top navigation
   Self-contained: injects its own styles + markup + behavior.
   Include with <script src="/nav.js" defer></script>.
   Active page (Home / ABM) is detected from the URL path.
   ============================================================= */
(function () {
  "use strict";

  var CALENDLY = "https://calendly.com/ryan_carlin/30min";
  var LOGO = "/logo.png"; // local transparent wordmark (no baked-in white background)

  // Ensure the Calendly popup widget is available, then run cb(ok).
  // Self-loads widget.js/widget.css if the host page didn't include them,
  // so the CTA opens the embed popup on any page.
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
    // Catch the case where the script is already mid-load (load may have fired).
    var tries = 0;
    var iv = setInterval(function () {
      if (window.Calendly && window.Calendly.initPopupWidget) { clearInterval(iv); ready(); }
      else if (++tries > 50) { clearInterval(iv); ready(); } // ~5s safety cap
    }, 100);
  }

  // ---- which page are we on? ----
  var path = location.pathname.replace(/\/index\.html$/, "/");
  var isAbm = /^\/abm(\/|$)/.test(path);
  var isHome = !isAbm; // default the homepage to active

  // ---- fonts (no-op if the page already loaded them) ----
  if (!document.querySelector('link[href*="Archivo+Black"]')) {
    var pre1 = document.createElement("link");
    pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
    var pre2 = document.createElement("link");
    pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "";
    var font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(pre1);
    document.head.appendChild(pre2);
    document.head.appendChild(font);
  }

  // ---- styles (scoped, hardcoded colors so no token dependency) ----
  var css = '\
.ee-nav{position:sticky;top:0;z-index:1000;view-transition-name:ee-nav;font-family:"Archivo",ui-sans-serif,system-ui,sans-serif;\
transition:background 200ms cubic-bezier(.2,.7,.2,1),border-color 200ms,box-shadow 200ms;\
background:rgba(255,255,255,0);border-bottom:1px solid transparent;}\
.ee-nav.ee-nav-scrolled{background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(20px);\
backdrop-filter:blur(20px);border-bottom:1px solid #E6E8EC;}\
.ee-nav-inner{max-width:1140px;margin:0 auto;padding:0 32px;height:64px;display:flex;align-items:center;\
justify-content:space-between;gap:32px;}\
.ee-nav-logo{display:flex;align-items:center;text-decoration:none;}\
.ee-nav-logo img{height:33px;width:auto;display:block;}\
.ee-nav-desktop{display:flex;align-items:center;gap:36px;}\
.ee-nav-links{display:flex;align-items:center;gap:32px;}\
.ee-navlink{position:relative;font-size:14px;font-weight:500;text-decoration:none;padding:4px 0;color:#5A616E;\
transition:color 120ms;}\
.ee-navlink:hover{color:#0E1116;}\
.ee-navlink.ee-active{color:#0E1116;}\
.ee-navlink::after{content:"";position:absolute;left:0;right:0;bottom:-21px;height:2px;background:#1E54F2;\
transform:scaleX(0);transform-origin:left;transition:transform 160ms cubic-bezier(.2,.7,.2,1);}\
.ee-navlink:hover::after,.ee-navlink.ee-active::after{transform:scaleX(1);}\
.ee-nav-cta{background:#1E54F2;color:#fff;font-weight:600;font-size:14px;padding:10px 16px;border-radius:8px;\
display:inline-flex;align-items:center;gap:7px;text-decoration:none;line-height:1;white-space:nowrap;\
transition:background 120ms cubic-bezier(.2,.7,.2,1),box-shadow 120ms,transform 120ms;}\
.ee-nav-cta:hover{background:#1A48D6;box-shadow:0 8px 24px rgba(30,84,242,.18);color:#fff;text-decoration:none;}\
.ee-nav-cta:active{background:#163CB5;transform:translateY(1px);}\
.ee-nav-cta span{font-size:13px;}\
.ee-burger{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;width:40px;\
height:40px;padding:0;background:transparent;border:1px solid #E6E8EC;border-radius:8px;cursor:pointer;}\
.ee-burger-line{display:block;width:18px;height:2px;background:#0E1116;border-radius:2px;\
transition:transform 200ms cubic-bezier(.2,.7,.2,1),opacity 160ms;}\
.ee-nav.ee-open .ee-burger-line:nth-child(1){transform:translateY(7px) rotate(45deg);}\
.ee-nav.ee-open .ee-burger-line:nth-child(2){opacity:0;}\
.ee-nav.ee-open .ee-burger-line:nth-child(3){transform:translateY(-7px) rotate(-45deg);}\
.ee-nav-mobile{overflow:hidden;max-height:0;transition:max-height 240ms cubic-bezier(.2,.7,.2,1),border-color 240ms;\
background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);\
border-bottom:1px solid transparent;}\
.ee-nav.ee-open .ee-nav-mobile{max-height:280px;border-bottom:1px solid #E6E8EC;}\
.ee-nav-mobile-inner{display:flex;flex-direction:column;padding:8px 24px 24px;}\
.ee-mlink{font-size:16px;font-weight:600;text-decoration:none;padding:14px 0;border-bottom:1px solid #E6E8EC;\
color:#0E1116;}\
.ee-mlink.ee-active{color:#1E54F2;}\
.ee-nav-mobile .ee-nav-cta{margin-top:16px;justify-content:center;font-size:15px;padding:13px 18px;}\
@media (max-width:720px){.ee-nav-desktop{display:none;}.ee-burger{display:flex;}}';

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- markup ----
  var homeA = isHome ? " ee-active" : "";
  var abmA = isAbm ? " ee-active" : "";
  var nav = document.createElement("nav");
  nav.className = "ee-nav";
  nav.innerHTML = '\
<div class="ee-nav-inner">\
<a href="/" class="ee-nav-logo" aria-label="Exit Engine — home"><img src="' + LOGO + '" alt="Exit Engine"></a>\
<div class="ee-nav-desktop">\
<div class="ee-nav-links">\
<a href="/" class="ee-navlink' + homeA + '">Home</a>\
<a href="/abm" class="ee-navlink' + abmA + '">ABM</a>\
</div>\
<a href="' + CALENDLY + '" class="ee-nav-cta" data-cal>Book a Strategy Call <span aria-hidden="true">↗</span></a>\
</div>\
<button class="ee-burger" type="button" aria-label="Menu" aria-expanded="false">\
<span class="ee-burger-line"></span><span class="ee-burger-line"></span><span class="ee-burger-line"></span>\
</button>\
</div>\
<div class="ee-nav-mobile"><div class="ee-nav-mobile-inner">\
<a href="/" class="ee-mlink' + homeA + '">Home</a>\
<a href="/abm" class="ee-mlink' + abmA + '">ABM</a>\
<a href="' + CALENDLY + '" class="ee-nav-cta" data-cal>Book a Strategy Call <span aria-hidden="true">↗</span></a>\
</div></div>';

  function mount() {
    document.body.insertBefore(nav, document.body.firstChild);

    // scroll settle
    var onScroll = function () {
      nav.classList.toggle("ee-nav-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // burger
    var burger = nav.querySelector(".ee-burger");
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("ee-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // CTA — open the Calendly embed popup (load the widget on demand if needed)
    nav.querySelectorAll("[data-cal]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        nav.classList.remove("ee-open");
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
