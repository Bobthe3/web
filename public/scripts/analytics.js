// Firebase Analytics + GA4 with explicit inbound and outbound link tracking.
//
// Loads the Firebase JS SDK from the Firebase Hosting reserved URLs
// (/__/firebase/...), which auto-injects the project's web app config.
// Falls back to a plain gtag init if those reserved URLs are unreachable
// (e.g. previewing the static files outside Firebase Hosting).
//
// Once initialized, exactly one of two paths is active so events are not
// double-counted in GA4:
//   - Firebase path: window.firebaseAnalytics.logEvent(...)
//   - gtag fallback: window.gtag('event', ...)

const GA_ID = 'G-1PJSV6D8LC';
const FB_SDK_VERSION = '11.0.0';

const loaderState = {
    mode: null, // 'firebase' | 'gtag'
    ready: null, // Promise that resolves once init is settled
    queue: []
};

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.async = false; // preserve ordering for the SDK chain
        el.onload = () => resolve();
        el.onerror = () => reject(new Error(`failed to load ${src}`));
        document.head.appendChild(el);
    });
}

function initGtagFallback() {
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(tag);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, {
        page_title: document.title,
        page_location: window.location.href,
        page_referrer: document.referrer,
        anonymize_ip: true,
        allow_google_signals: false
    });
    loaderState.mode = 'gtag';
}

async function initFirebaseAnalytics() {
    // Reserved Firebase Hosting URLs auto-inject the project config.
    await loadScript(`/__/firebase/${FB_SDK_VERSION}/firebase-app-compat.js`);
    await loadScript(`/__/firebase/${FB_SDK_VERSION}/firebase-analytics-compat.js`);
    await loadScript('/__/firebase/init.js');

    if (!window.firebase || typeof window.firebase.analytics !== 'function') {
        throw new Error('firebase.analytics is unavailable');
    }
    const analytics = window.firebase.analytics();
    // Set defaults so every event carries page context.
    analytics.setAnalyticsCollectionEnabled(true);
    window.firebaseAnalytics = analytics;
    loaderState.mode = 'firebase';
}

function flushQueue() {
    while (loaderState.queue.length) {
        const [name, params] = loaderState.queue.shift();
        dispatchEvent(name, params);
    }
}

function dispatchEvent(name, params) {
    if (loaderState.mode === 'firebase' && window.firebaseAnalytics) {
        try {
            window.firebaseAnalytics.logEvent(name, params);
            return;
        } catch (e) { /* fall through to gtag */ }
    }
    if (loaderState.mode === 'gtag' && typeof window.gtag === 'function') {
        window.gtag('event', name, params);
    }
}

// Public: log an event. Buffers until init resolves.
function logEvent(name, params = {}) {
    if (loaderState.mode) {
        dispatchEvent(name, params);
    } else {
        loaderState.queue.push([name, params]);
    }
}

// Inbound: capture referrer and UTM params on first page of the session.
function trackInbound() {
    try {
        if (sessionStorage.getItem('inbound_logged') === '1') return;
        sessionStorage.setItem('inbound_logged', '1');
    } catch (e) { /* sessionStorage may be unavailable; still log */ }

    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || '';
    let referrerHost = '';
    try { referrerHost = referrer ? new URL(referrer).hostname : ''; } catch (e) {}

    if (referrerHost && referrerHost === window.location.hostname) {
        // Treat as internal navigation, not an inbound surface.
        return;
    }

    logEvent('inbound_visit', {
        landing_path: window.location.pathname,
        landing_url: window.location.href,
        referrer_url: referrer,
        referrer_host: referrerHost || '(direct)',
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        utm_term: params.get('utm_term') || '',
        utm_content: params.get('utm_content') || '',
        gclid: params.get('gclid') || ''
    });
}

// Outbound: delegated click handler for any external/mailto/tel link.
function trackOutbound() {
    document.addEventListener('click', (event) => {
        const link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;

        let url;
        try { url = new URL(link.href, window.location.href); } catch (e) { return; }

        const protocol = url.protocol.replace(':', '');
        const isMailto = protocol === 'mailto';
        const isTel = protocol === 'tel';
        const isExternalHttp = (protocol === 'http' || protocol === 'https')
            && url.hostname && url.hostname !== window.location.hostname;

        if (!isExternalHttp && !isMailto && !isTel) return;

        const text = (link.textContent || link.getAttribute('aria-label') || '').trim().slice(0, 100);
        logEvent('outbound_click', {
            link_url: url.href,
            link_domain: url.hostname || protocol,
            link_protocol: protocol,
            link_text: text,
            link_classes: link.className || '',
            link_id: link.id || '',
            source_path: window.location.pathname,
            // Use beacon so the request survives navigation.
            transport_type: 'beacon'
        });
    }, true);
}

// Internal navigation between pages on the site.
function trackInternalNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const destination = (link.getAttribute('href') || '').split('/').pop() || 'home';
            logEvent('internal_navigation', {
                destination,
                source_path: window.location.pathname
            });
        });
    });
}

// Helpers retained for backwards compatibility with existing call sites.
function trackEvent(action, category, label = '', value = 0) {
    logEvent(action, {
        event_category: category,
        event_label: label,
        value
    });
}

function trackPageView(pagePath, pageTitle) {
    logEvent('page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.origin + pagePath
    });
}

function trackPhotoView(imageName, category = 'Gallery') {
    trackEvent('photo_view', category, imageName);
}

function trackSocialClick(platform) {
    trackEvent('social_click', 'Social', platform);
}

function trackBlogRead(postTitle, readingProgress) {
    trackEvent('blog_read', 'Blog', postTitle, readingProgress);
}

function trackDownload(fileName, fileType) {
    trackEvent('download', 'Files', `${fileName}.${fileType}`);
}

function trackPerformance() {
    if (!('performance' in window)) return;
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (!perfData) return;
            const loadTime = Math.round(perfData.loadEventEnd - perfData.loadEventStart);
            if (loadTime > 0) {
                trackEvent('page_load_time', 'Performance', 'load_time', loadTime);
            }
        }, 0);
    });
}

function bootstrap() {
    loaderState.ready = initFirebaseAnalytics()
        .catch(() => { initGtagFallback(); })
        .finally(() => { flushQueue(); });

    trackInbound();
    trackOutbound();
    trackInternalNav();
    trackPerformance();

    // Existing social-link handler (for elements outside .nav-link).
    document.querySelectorAll('.social-links a').forEach(link => {
        link.addEventListener('click', () => {
            const platform = link.getAttribute('aria-label') || 'Unknown';
            trackSocialClick(platform);
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

// Expose for inline call sites.
window.trackEvent = trackEvent;
window.trackPageView = trackPageView;
window.trackPhotoView = trackPhotoView;
window.trackSocialClick = trackSocialClick;
window.trackBlogRead = trackBlogRead;
window.trackDownload = trackDownload;
window.logEvent = logEvent;
