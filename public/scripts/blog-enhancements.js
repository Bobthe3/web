// Blog Enhancement Features — lightweight
// Initializes on 'blog:content-ready' event (fired by blog-renderer.js)

(function () {
  'use strict';

  var progressBar = null;
  var maxScrollPercent = 0;

  function createProgressBar() {
    progressBar = document.createElement('div');
    progressBar.style.cssText = 'position:fixed;top:0;left:0;width:0%;height:3px;background:var(--accent-primary);z-index:1001;transition:width 0.2s ease;';
    document.body.appendChild(progressBar);
  }

  function updateProgress() {
    var content = document.querySelector('.post-content');
    if (!content || !progressBar) return;
    var top = content.offsetTop;
    var h = content.offsetHeight;
    var wh = window.innerHeight;
    var st = window.pageYOffset;
    var start = top - wh / 2;
    var end = top + h - wh / 2;
    var pct = 0;
    if (st > end) pct = 100;
    else if (st > start) pct = Math.min(((st - start) / (end - start)) * 100, 100);
    progressBar.style.width = pct + '%';
    maxScrollPercent = Math.max(maxScrollPercent, pct);
  }

  function addReadingTime() {
    var content = document.querySelector('.post-content');
    var meta = document.querySelector('.post-meta');
    if (!content || !meta) return;
    var words = (content.textContent || '').trim().split(/\s+/).length;
    var mins = Math.ceil(words / 200);
    // Check if reading time already exists
    if (meta.querySelector('.reading-time')) return;
    var span = document.createElement('span');
    span.className = 'reading-time';
    span.innerHTML = '<svg style="width:14px;height:14px;vertical-align:-1px;fill:currentColor;margin-right:4px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120v136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg> ' + mins + ' min read';
    meta.appendChild(span);
  }

  function loadRelatedPosts() {
    var container = document.querySelector('.container');
    if (!container) return;
    var currentTitle = document.title.split(' - ')[0];

    fetch('../generated/posts.json')
      .then(function (r) { return r.json(); })
      .then(function (posts) {
        var current = null;
        for (var i = 0; i < posts.length; i++) {
          if (posts[i].title === currentTitle) { current = posts[i]; break; }
        }
        if (!current || !current.tags) return;

        var scored = [];
        for (var j = 0; j < posts.length; j++) {
          var p = posts[j];
          if (p.title === currentTitle) continue;
          var score = 0;
          if (p.tags) {
            for (var k = 0; k < current.tags.length; k++) {
              if (p.tags.indexOf(current.tags[k]) !== -1) score += 2;
            }
          }
          if (score > 0) scored.push({ post: p, score: score });
        }
        scored.sort(function (a, b) { return b.score - a.score; });
        var top = scored.slice(0, 3);
        if (top.length === 0) return;

        var section = document.createElement('div');
        section.className = 'frosted-glass';
        section.style.marginTop = '30px';
        section.innerHTML = '<h3 style="color:var(--accent-primary);margin:0 0 16px">Related Posts</h3>';
        top.forEach(function (item) {
          var div = document.createElement('a');
          div.href = item.post.slug + '.html';
          div.style.cssText = 'display:block;padding:12px;border-radius:8px;background:rgba(255,255,255,0.05);margin-bottom:10px;text-decoration:none;transition:background 0.2s;';
          div.innerHTML = '<strong style="color:var(--accent-primary)">' + item.post.title + '</strong><p style="margin:6px 0 0;color:var(--accent-secondary);font-size:0.9em">' + item.post.excerpt + '</p>';
          div.addEventListener('mouseover', function () { div.style.background = 'rgba(255,255,255,0.1)'; });
          div.addEventListener('mouseout', function () { div.style.background = 'rgba(255,255,255,0.05)'; });
          section.appendChild(div);
        });

        var backLinks = container.querySelector('.back-links');
        if (backLinks) container.insertBefore(section, backLinks);
        else container.appendChild(section);
      })
      .catch(function () { /* silently fail */ });
  }

  function init() {
    createProgressBar();
    addReadingTime();
    loadRelatedPosts();

    var throttled = false;
    window.addEventListener('scroll', function () {
      if (!throttled) {
        throttled = true;
        requestAnimationFrame(function () {
          updateProgress();
          throttled = false;
        });
      }
    });
  }

  // Listen for blog renderer completion
  document.addEventListener('blog:content-ready', init);
})();
