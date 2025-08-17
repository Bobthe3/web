// Analytics Configuration
// Replace GA_MEASUREMENT_ID with your actual Google Analytics 4 measurement ID

function initializeAnalytics() {
    // Google Analytics 4
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-1PJSV6D8LC';
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-1PJSV6D8LC', {
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true, // GDPR compliance
        allow_google_signals: false // Privacy-friendly
    });
    
    // Make gtag globally available
    window.gtag = gtag;
}

// Track custom events
function trackEvent(action, category, label = '', value = 0) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
    }
}

// Track page views for single-page app navigation
function trackPageView(pagePath, pageTitle) {
    if (typeof gtag !== 'undefined') {
        gtag('config', 'G-1PJSV6D8LC', {
            page_path: pagePath,
            page_title: pageTitle,
            page_location: window.location.origin + pagePath
        });
    }
}

// Track photo interactions
function trackPhotoView(imageName, category = 'Gallery') {
    trackEvent('photo_view', category, imageName);
}

// Track social link clicks
function trackSocialClick(platform) {
    trackEvent('social_click', 'Social', platform);
}

// Track blog interactions
function trackBlogRead(postTitle, readingProgress) {
    trackEvent('blog_read', 'Blog', postTitle, readingProgress);
}

// Track download events
function trackDownload(fileName, fileType) {
    trackEvent('download', 'Files', `${fileName}.${fileType}`);
}

// Performance tracking
function trackPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    const loadTime = Math.round(perfData.loadEventEnd - perfData.loadEventStart);
                    if (loadTime > 0) {
                        trackEvent('page_load_time', 'Performance', 'load_time', loadTime);
                    }
                }
                
                // Track Core Web Vitals
                if ('web-vitals' in window) {
                    // This would require importing the web-vitals library
                    // getCLS(metric => trackEvent('cls', 'Performance', 'cls', Math.round(metric.value * 1000)));
                    // getFID(metric => trackEvent('fid', 'Performance', 'fid', Math.round(metric.value)));
                    // getLCP(metric => trackEvent('lcp', 'Performance', 'lcp', Math.round(metric.value)));
                }
            }, 0);
        });
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics();
    trackPerformance();
    
    // Track social link clicks
    document.querySelectorAll('.social-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const platform = link.getAttribute('aria-label') || 'Unknown';
            trackSocialClick(platform);
        });
    });
    
    // Track navigation clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const destination = link.href.split('/').pop() || 'home';
            trackEvent('navigation', 'Internal', destination);
        });
    });
});

// Export functions for global use
window.trackEvent = trackEvent;
window.trackPageView = trackPageView;
window.trackPhotoView = trackPhotoView;
window.trackSocialClick = trackSocialClick;
window.trackBlogRead = trackBlogRead;
window.trackDownload = trackDownload;