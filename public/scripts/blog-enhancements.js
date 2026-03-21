// Blog Enhancement Features
// Reading progress, reading time, related posts, and analytics

class BlogEnhancements {
    constructor() {
        this.readingStartTime = Date.now();
        this.totalReadingTime = 0;
        this.maxScrollPercent = 0;
        this.progressBar = null;
        this.toc = null;
        this.relatedPosts = [];
        
        this.init();
    }
    
    init() {
        this.createProgressBar();
        this.addReadingTime();
        this.createTableOfContents();
        this.loadRelatedPosts();
        this.setupScrollTracking();
        this.setupAnalytics();
        this.trackInteractions();
        this.setupAdvancedScrollTracking();
    }
    
    // Create reading progress bar
    createProgressBar() {
        this.progressBar = document.createElement('div');
        this.progressBar.id = 'reading-progress';
        this.progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 4px;
            background: var(--accent-primary);
            z-index: 1001;
            transition: width 0.3s ease;
        `;
        document.body.appendChild(this.progressBar);
    }
    
    // Calculate and display reading time
    addReadingTime() {
        const content = document.querySelector('.post-content');
        if (!content) return;
        
        const text = content.textContent || content.innerText;
        const wordCount = text.trim().split(/\s+/).length;
        const avgWordsPerMinute = 200; // Average reading speed
        const readingTime = Math.ceil(wordCount / avgWordsPerMinute);
        
        // Add reading time to post meta
        const postMeta = document.querySelector('.post-meta');
        if (postMeta) {
            const readingTimeElement = document.createElement('span');
            readingTimeElement.style.marginLeft = '20px';
            readingTimeElement.innerHTML = `<i class="fas fa-clock"></i> ${readingTime} min read`;
            postMeta.appendChild(readingTimeElement);
        }
        
        // Track reading time analytics
        if (typeof trackEvent !== 'undefined') {
            trackEvent('reading_time_calculated', 'Blog', 'minutes', readingTime);
        }
    }
    
    // Generate table of contents
    createTableOfContents() {
        const content = document.querySelector('.post-content');
        if (!content) return;
        
        const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length < 3) return; // Only show TOC for longer posts
        
        const tocContainer = document.createElement('div');
        tocContainer.className = 'table-of-contents';
        tocContainer.style.cssText = `
            background: var(--frosted-bg);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid var(--accent-primary);
        `;
        
        const tocTitle = document.createElement('h4');
        tocTitle.textContent = 'Table of Contents';
        tocTitle.style.marginTop = '0';
        tocContainer.appendChild(tocTitle);
        
        const tocList = document.createElement('ul');
        tocList.style.cssText = `
            list-style: none;
            padding-left: 0;
            margin: 0;
        `;
        
        headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;
            
            const listItem = document.createElement('li');
            listItem.style.cssText = `
                margin: 8px 0;
                padding-left: ${(parseInt(heading.tagName.charAt(1)) - 1) * 20}px;
            `;
            
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = heading.textContent;
            link.style.cssText = `
                color: var(--text-color);
                text-decoration: none;
                transition: color 0.3s ease;
            `;
            link.addEventListener('mouseover', () => {
                link.style.color = 'var(--accent-primary)';
            });
            link.addEventListener('mouseout', () => {
                link.style.color = 'var(--text-color)';
            });
            
            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });
        
        tocContainer.appendChild(tocList);
        
        // Insert TOC after the first paragraph
        const firstParagraph = content.querySelector('p');
        if (firstParagraph) {
            firstParagraph.after(tocContainer);
        }
    }
    
    // Load and display related posts
    async loadRelatedPosts() {
        try {
            const response = await fetch('../generated/posts.json');
            const posts = await response.json();
            const currentTitle = document.title.split(' - ')[0];
            
            // Simple related posts algorithm based on tags and titles
            const currentPost = posts.find(post => post.title === currentTitle);
            if (!currentPost) return;
            
            const related = posts
                .filter(post => post.title !== currentTitle)
                .map(post => {
                    let score = 0;
                    // Score based on shared tags
                    if (currentPost.tags && post.tags) {
                        const sharedTags = currentPost.tags.filter(tag => 
                            post.tags.includes(tag)
                        ).length;
                        score += sharedTags * 2;
                    }
                    return { ...post, score };
                })
                .filter(post => post.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
            
            if (related.length > 0) {
                this.displayRelatedPosts(related);
            }
        } catch (error) {
            console.warn('Could not load related posts:', error);
        }
    }
    
    // Display related posts section
    displayRelatedPosts(posts) {
        const container = document.querySelector('.container');
        if (!container) return;
        
        const relatedSection = document.createElement('div');
        relatedSection.className = 'frosted-glass';
        relatedSection.style.marginTop = '40px';
        
        const title = document.createElement('h3');
        title.textContent = 'Related Posts';
        title.style.marginBottom = '20px';
        relatedSection.appendChild(title);
        
        posts.forEach(post => {
            const postLink = document.createElement('div');
            postLink.style.cssText = `
                margin-bottom: 15px;
                padding: 15px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.05);
                transition: background 0.3s ease;
                cursor: pointer;
            `;
            
            postLink.addEventListener('mouseover', () => {
                postLink.style.background = 'rgba(255, 255, 255, 0.1)';
            });
            postLink.addEventListener('mouseout', () => {
                postLink.style.background = 'rgba(255, 255, 255, 0.05)';
            });
            
            postLink.innerHTML = `
                <h4 style="margin: 0 0 8px 0; color: var(--accent-primary);">
                    <a href="${post.slug}.html" style="color: inherit; text-decoration: none;">
                        ${post.title}
                    </a>
                </h4>
                <p style="margin: 0; color: var(--accent-secondary); font-size: 0.9em;">
                    ${post.excerpt}
                </p>
            `;
            
            postLink.addEventListener('click', () => {
                window.location.href = `${post.slug}.html`;
            });
            
            relatedSection.appendChild(postLink);
        });
        
        // Insert before the back link
        const backLink = container.querySelector('div[style*="text-align: center"]');
        if (backLink) {
            container.insertBefore(relatedSection, backLink);
        } else {
            container.appendChild(relatedSection);
        }
    }
    
    // Setup scroll tracking for reading progress
    setupScrollTracking() {
        let lastScrollTime = Date.now();
        
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollTime > 100) { // Throttle scroll events
                this.updateReadingProgress();
                lastScrollTime = now;
            }
        });
        
        // Track when user leaves the page
        window.addEventListener('beforeunload', () => {
            this.trackReadingSession();
        });
        
        // Track reading session every 30 seconds
        setInterval(() => {
            this.trackReadingSession();
        }, 30000);
    }
    
    // Update reading progress bar
    updateReadingProgress() {
        const content = document.querySelector('.post-content');
        if (!content) return;
        
        const contentTop = content.offsetTop;
        const contentHeight = content.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        
        const contentStart = contentTop - windowHeight / 2;
        const contentEnd = contentTop + contentHeight - windowHeight / 2;
        const contentLength = contentEnd - contentStart;
        
        if (scrollTop < contentStart) {
            this.progressBar.style.width = '0%';
        } else if (scrollTop > contentEnd) {
            this.progressBar.style.width = '100%';
        } else {
            const progress = (scrollTop - contentStart) / contentLength;
            const percentage = Math.min(Math.max(progress * 100, 0), 100);
            this.progressBar.style.width = `${percentage}%`;
            this.maxScrollPercent = Math.max(this.maxScrollPercent, percentage);
        }
    }
    
    // Setup blog-specific analytics
    setupAnalytics() {
        // Track when user reaches different reading milestones
        let milestones = { 25: false, 50: false, 75: false, 100: false };
        
        const checkMilestones = () => {
            const progress = parseFloat(this.progressBar.style.width);
            Object.keys(milestones).forEach(milestone => {
                if (progress >= milestone && !milestones[milestone]) {
                    milestones[milestone] = true;
                    if (typeof trackBlogRead !== 'undefined') {
                        const title = document.title.split(' - ')[0];
                        trackBlogRead(title, milestone);
                    }
                }
            });
        };
        
        window.addEventListener('scroll', checkMilestones);
    }
    
    // Track reading session analytics
    trackReadingSession() {
        if (typeof trackEvent !== 'undefined') {
            const sessionTime = Math.floor((Date.now() - this.readingStartTime) / 1000);
            const title = document.title.split(' - ')[0];
            
            trackEvent('reading_session', 'Blog', title, sessionTime);
            trackEvent('max_scroll_reached', 'Blog', title, Math.floor(this.maxScrollPercent));
            
            // Track detailed reading analytics
            this.trackDetailedAnalytics(sessionTime);
        }
    }
    
    // Enhanced analytics tracking
    trackDetailedAnalytics(sessionTime) {
        const title = document.title.split(' - ')[0];
        const content = document.querySelector('.post-content');
        
        if (content) {
            const wordCount = (content.textContent || content.innerText).trim().split(/\s+/).length;
            const readingSpeed = sessionTime > 0 ? Math.round((wordCount / sessionTime) * 60) : 0; // words per minute
            
            // Track reading patterns
            trackEvent('reading_speed', 'Blog', title, readingSpeed);
            trackEvent('reading_completion', 'Blog', title, this.maxScrollPercent);
            
            // Track engagement quality
            if (this.maxScrollPercent >= 90) {
                trackEvent('blog_completed', 'Blog', title);
            } else if (this.maxScrollPercent >= 50) {
                trackEvent('blog_partially_read', 'Blog', title);
            } else {
                trackEvent('blog_bounced', 'Blog', title);
            }
            
            // Track time-based engagement
            if (sessionTime >= 300) { // 5 minutes
                trackEvent('deep_engagement', 'Blog', title, sessionTime);
            }
            
            // Track device and viewport analytics
            this.trackDeviceAnalytics();
        }
    }
    
    // Track device-specific analytics
    trackDeviceAnalytics() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        let deviceType = 'desktop';
        if (viewport.width <= 768) {
            deviceType = 'mobile';
        } else if (viewport.width <= 1024) {
            deviceType = 'tablet';
        }
        
        trackEvent('device_reading', 'Blog', deviceType);
        trackEvent('viewport_size', 'Blog', `${viewport.width}x${viewport.height}`);
        
        // Track reading on different screen orientations (mobile)
        if (deviceType === 'mobile') {
            const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
            trackEvent('mobile_orientation', 'Blog', orientation);
        }
    }
    
    // Track interaction with blog elements
    trackInteractions() {
        const title = document.title.split(' - ')[0];
        
        // Track TOC clicks
        document.querySelectorAll('.table-of-contents a').forEach(link => {
            link.addEventListener('click', (e) => {
                const heading = e.target.textContent;
                trackEvent('toc_click', 'Blog', `${title}: ${heading}`);
            });
        });
        
        // Track related post clicks
        document.querySelectorAll('.frosted-glass .post-preview').forEach(preview => {
            preview.addEventListener('click', (e) => {
                const relatedTitle = e.currentTarget.querySelector('h4 a')?.textContent || 'Unknown';
                trackEvent('related_post_click', 'Blog', `${title} -> ${relatedTitle}`);
            });
        });
        
        // Track copy text selections
        document.addEventListener('selectionchange', () => {
            const selection = window.getSelection();
            if (selection.toString().length > 20) { // Significant text selection
                trackEvent('text_selected', 'Blog', title);
            }
        });
        
        // Track print attempts
        window.addEventListener('beforeprint', () => {
            trackEvent('blog_print', 'Blog', title);
        });
        
        // Track share attempts (if Web Share API is available)
        if (navigator.share) {
            this.addShareButton();
        }
    }
    
    // Add native share button for supported browsers
    addShareButton() {
        const title = document.title.split(' - ')[0];
        const postMeta = document.querySelector('.post-meta');
        
        if (postMeta) {
            const shareButton = document.createElement('button');
            shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Share';
            shareButton.style.cssText = `
                background: var(--accent-primary);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                margin-left: 20px;
                transition: background 0.3s ease;
            `;
            
            shareButton.addEventListener('click', async () => {
                try {
                    await navigator.share({
                        title: title,
                        text: document.querySelector('meta[name="description"]')?.content || '',
                        url: window.location.href
                    });
                    trackEvent('blog_shared', 'Blog', title);
                } catch (err) {
                    console.log('Share cancelled or failed');
                }
            });
            
            shareButton.addEventListener('mouseover', () => {
                shareButton.style.background = 'var(--accent-hover)';
            });
            
            shareButton.addEventListener('mouseout', () => {
                shareButton.style.background = 'var(--accent-primary)';
            });
            
            postMeta.appendChild(shareButton);
        }
    }
    
    // Enhanced scroll tracking with heat mapping
    setupAdvancedScrollTracking() {
        const content = document.querySelector('.post-content');
        if (!content) return;
        
        const sections = content.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        const sectionViews = new Map();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const sectionId = element.tagName + '_' + Array.from(sections).indexOf(element);
                    
                    if (!sectionViews.has(sectionId)) {
                        sectionViews.set(sectionId, Date.now());
                        
                        // Track section view
                        const title = document.title.split(' - ')[0];
                        trackEvent('section_viewed', 'Blog', `${title}: ${element.tagName}`);
                    }
                }
            });
        }, {
            threshold: 0.5 // Section is considered viewed when 50% visible
        });
        
        sections.forEach(section => observer.observe(section));
    }
}

// Initialize blog enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on blog post pages (not index)
    if (document.querySelector('.post-content')) {
        new BlogEnhancements();
    }
});