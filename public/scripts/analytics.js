// Analytics — GA4 + lightweight beacon-based link tracking
(function () {
  'use strict';

  // --- GA4 ---
  function initGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-1PJSV6D8LC';
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-1PJSV6D8LC', {
      page_title: document.title,
      page_location: window.location.href,
      anonymize_ip: true,
      allow_google_signals: false
    });
    window.gtag = gtag;
  }

  // --- Beacon-based link tracking ---
  function initTracking() {
    // Session ID
    var sid = sessionStorage.getItem('sid');
    if (!sid) {
      sid = Math.random().toString(36).substr(2) + Date.now().toString(36);
      sessionStorage.setItem('sid', sid);
    }

    // Get source from URL params
    var params = new URLSearchParams(location.search);
    var source = params.get('ref') || params.get('utm_source') || '';

    // Track inbound page view
    beacon({
      type: 'inbound',
      page: location.pathname,
      source: source,
      referrer: document.referrer,
      sessionId: sid
    });

    // Track ALL link clicks via event delegation
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a || !a.href) return;

      try {
        var url = new URL(a.href, location.origin);
        var isExternal = url.hostname !== location.hostname;
        beacon({
          type: isExternal ? 'outbound' : 'internal',
          url: a.href,
          page: location.pathname,
          sessionId: sid
        });
      } catch (err) { /* invalid URL */ }
    });
  }

  function beacon(data) {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', JSON.stringify(data));
      }
    } catch (e) { /* silently fail */ }
  }

  // --- Legacy exports for existing code ---
  window.trackEvent = function (action, category, label, value) {
    if (typeof gtag !== 'undefined') {
      gtag('event', action, { event_category: category, event_label: label || '', value: value || 0 });
    }
  };
  window.trackPageView = function (path, title) {
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-1PJSV6D8LC', { page_path: path, page_title: title });
    }
  };
  window.trackPhotoView = function (name) { window.trackEvent('photo_view', 'Gallery', name); };
  window.trackSocialClick = function (platform) { window.trackEvent('social_click', 'Social', platform); };
  window.trackBlogRead = function (title, progress) { window.trackEvent('blog_read', 'Blog', title, progress); };
  window.trackDownload = function (name, type) { window.trackEvent('download', 'Files', name + '.' + type); };

  // --- Init ---
  document.addEventListener('DOMContentLoaded', function () {
    initGA();
    initTracking();

    // Social link clicks
    document.querySelectorAll('.social-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        window.trackSocialClick(link.getAttribute('aria-label') || 'Unknown');
      });
    });
  });
})();
