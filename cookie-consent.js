/**
 * cookie-consent.js — Basic Consent Mode
 * GA4 НЕ завантажується до надання згоди.
 */

(function () {
  'use strict';

  var STORAGE_KEY = 'cy_consent';
  var GA_ID = 'G-2SRK641MZY';

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }
  function saveConsent(val) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: val, ts: Date.now() }));
  }

  /* ── динамічне завантаження GA4 (лише після згоди) ── */
  function loadGA4() {
    // Встановлюємо granted перед завантаженням скрипта
    window.dataLayer = window.dataLayer || [];
    function gtag(){ dataLayer.push(arguments); }
    window.gtag = gtag;

    gtag('consent', 'default', {
      'analytics_storage':  'granted',
      'ad_storage':         'denied',
      'ad_user_data':       'denied',
      'ad_personalization': 'denied'
    });

    gtag('js', new Date());
    gtag('config', GA_ID);

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);
  }

  /* ── видалення GA cookie при відмові ── */
  function removeGACookies() {
    document.cookie.split(';').forEach(function(c) {
      var name = c.trim().split('=')[0];
      if (name.indexOf('_ga') === 0 || name === '_gid') {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + location.hostname;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + location.hostname;
      }
    });
  }

  function hideBanner() {
    var b = document.getElementById('cc-banner');
    if (b) b.style.display = 'none';
    var btn = document.getElementById('cc-reopen-btn');
    if (btn) btn.style.display = 'flex';
  }

  function handleAccept() {
    saveConsent('all');
    loadGA4();
    hideBanner();
  }

  function handleDecline() {
    saveConsent('necessary');
    removeGACookies();
    hideBanner();
  }

  /* ── стилі ── */
  function injectStyles() {
    var css = [
      '#cc-banner{',
        'position:fixed;bottom:0;left:0;right:0;z-index:99999;',
        'background:#fff;border-top:3px solid #1a56db;',
        'box-shadow:0 -4px 24px rgba(0,0,0,.12);',
        'padding:18px 24px;',
        'display:flex;flex-wrap:wrap;align-items:center;gap:16px;',
        'font-family:system-ui,sans-serif;font-size:14px;color:#111;',
        'box-sizing:border-box;',
      '}',
      '#cc-banner p{margin:0;flex:1 1 260px;line-height:1.6;}',
      '#cc-banner a{color:#1a56db;text-decoration:underline;}',
      '#cc-banner .cc-btns{display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;}',
      '#cc-banner button{',
        'padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;',
        'cursor:pointer;border:2px solid #1a56db;white-space:nowrap;',
        'transition:opacity .15s;',
      '}',
      '#cc-banner button:hover{opacity:.85;}',
      '#cc-btn-accept{background:#1a56db;color:#fff;}',
      '#cc-btn-decline{background:#fff;color:#1a56db;}',
      '#cc-reopen-btn{',
        'position:fixed;bottom:16px;left:16px;z-index:99998;',
        'width:44px;height:44px;border-radius:50%;',
        'background:#1a56db;color:#fff;border:none;cursor:pointer;',
        'font-size:20px;display:none;align-items:center;justify-content:center;',
        'box-shadow:0 2px 10px rgba(0,0,0,.25);',
      '}',
      '@media(max-width:600px){',
        '#cc-banner{padding:14px 16px;}',
        '#cc-banner .cc-btns{width:100%;}',
        '#cc-banner button{flex:1;}',
      '}'
    ].join('');
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── банер ── */
  function createBanner() {
    var banner = document.createElement('div');
    banner.id = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Налаштування cookie');
    banner.innerHTML =
      '<p>Ми використовуємо cookie для аналізу відвідуваності та покращення функціональності сайту.' +
      ' Аналітичні cookie активуються лише з вашої згоди.' +
      ' Детальніше: <a href="privacy-policy.html">Політика конфіденційності</a>.</p>' +
      '<div class="cc-btns">' +
        '<button id="cc-btn-decline">Відхилити необов\'язкові</button>' +
        '<button id="cc-btn-accept">Прийняти всі</button>' +
      '</div>';
    document.body.appendChild(banner);
    document.getElementById('cc-btn-accept').addEventListener('click', handleAccept);
    document.getElementById('cc-btn-decline').addEventListener('click', handleDecline);
  }

  /* ── кнопка повторного відкриття ── */
  function createReopenButton() {
    var btn = document.createElement('button');
    btn.id = 'cc-reopen-btn';
    btn.title = 'Налаштування cookie';
    btn.innerHTML = '&#127850;';
    btn.addEventListener('click', function () {
      btn.style.display = 'none';
      var b = document.getElementById('cc-banner');
      if (b) b.style.display = 'flex';
    });
    document.body.appendChild(btn);
  }

  /* ── ініціалізація ── */
  function init() {
    injectStyles();
    createReopenButton();

    var saved = getConsent();

    if (!saved) {
      // Новий відвідувач — показуємо банер, GA4 НЕ завантажується
      createBanner();
      return;
    }

    if (saved.choice === 'all') {
      // Вже дав згоду раніше — завантажуємо GA4
      loadGA4();
    }
    // 'necessary' — нічого не робимо, GA4 не завантажується
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
