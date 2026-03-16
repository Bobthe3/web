// Blog Renderer — lightweight client-side markdown rendering
// Dependencies: marked.js (loaded via <script defer>)
// Optional: KaTeX (lazy-loaded only when LaTeX is detected)

(function () {
  'use strict';

  const KATEX_CSS = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
  const KATEX_JS = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';

  // --- Frontmatter ---
  function stripFrontmatter(md) {
    const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    return m ? m[2] : md;
  }

  // --- Manual TOC stripping ---
  // Remove sections like "## Table of Contents" / "## TOC" followed by a markdown list
  function stripManualToc(md) {
    return md.replace(
      /^#{1,3}\s+(Table of Contents|TOC|Contents)\s*\n+((?:\s*[-*]\s+.*\n?)+)/gim,
      ''
    );
  }

  // --- LaTeX protection ---
  // Replace LaTeX blocks with placeholders so marked.js doesn't mangle them
  function protectLatex(md) {
    const placeholders = [];
    let idx = 0;

    // Display math $$...$$ (multiline)
    md = md.replace(/\$\$([\s\S]*?)\$\$/g, function (match) {
      var id = '%%LATEX_DISPLAY_' + idx++ + '%%';
      placeholders.push({ id: id, content: match, display: true });
      return id;
    });

    // Inline math $...$ (single line, not starting/ending with space, not currency like $5)
    md = md.replace(/(?<!\$)\$(?!\$)(?!\s)((?:[^$\n\\]|\\.)+?)(?<!\s)\$(?!\$)/g, function (match) {
      var id = '%%LATEX_INLINE_' + idx++ + '%%';
      placeholders.push({ id: id, content: match, display: false });
      return id;
    });

    return { md: md, placeholders: placeholders };
  }

  function restoreLatex(html, placeholders) {
    placeholders.forEach(function (p) {
      // Extract the actual LaTeX content (strip outer $ or $$)
      var latex;
      if (p.display) {
        latex = p.content.replace(/^\$\$([\s\S]*?)\$\$$/, '$1').trim();
      } else {
        latex = p.content.replace(/^\$(.*?)\$$/, '$1').trim();
      }
      var tag = p.display ? 'div' : 'span';
      var cls = p.display ? 'math-display' : 'math-inline';
      var escaped = latex.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var replacement = '<' + tag + ' class="' + cls + '" data-latex="' + encodeURIComponent(latex) + '">' + escaped + '</' + tag + '>';
      html = html.replace(p.id, replacement);
      // Also replace if marked wrapped it in a <p>
      html = html.replace('<p>' + p.id + '</p>', replacement);
    });
    return html;
  }

  // --- KaTeX lazy loader ---
  function loadKatex() {
    return new Promise(function (resolve, reject) {
      if (window.katex) { resolve(); return; }

      // Load CSS
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = KATEX_CSS;
      document.head.appendChild(link);

      // Load JS
      var script = document.createElement('script');
      script.src = KATEX_JS;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function renderAllLatex(container) {
    var mathElements = container.querySelectorAll('.math-display, .math-inline');
    if (mathElements.length === 0) return Promise.resolve();

    return loadKatex().then(function () {
      mathElements.forEach(function (el) {
        var latex = decodeURIComponent(el.getAttribute('data-latex'));
        var isDisplay = el.classList.contains('math-display');
        try {
          window.katex.render(latex, el, {
            displayMode: isDisplay,
            throwOnError: false,
            output: 'html'
          });
        } catch (e) {
          el.textContent = latex;
          el.style.color = 'var(--accent-hover, #d08770)';
        }
      });
    });
  }

  // --- TOC generation ---
  function generateToc(container) {
    var headings = container.querySelectorAll('h1, h2, h3, h4');
    if (headings.length < 3) return;

    var nav = document.createElement('nav');
    nav.className = 'toc-nav';
    nav.innerHTML = '<h4>Table of Contents</h4>';
    var ul = document.createElement('ul');

    headings.forEach(function (h, i) {
      // Create slug id
      var text = h.textContent.trim();
      var slug = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      // Ensure unique
      if (document.getElementById(slug)) slug = slug + '-' + i;
      h.id = slug;

      var li = document.createElement('li');
      var level = parseInt(h.tagName.charAt(1));
      li.style.paddingLeft = ((level - 1) * 16) + 'px';

      var a = document.createElement('a');
      a.href = '#' + slug;
      a.textContent = text;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + slug);
      });

      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);

    // Insert before post content
    var firstChild = container.firstChild;
    if (firstChild) {
      container.insertBefore(nav, firstChild);
    } else {
      container.appendChild(nav);
    }
  }

  // --- Fix external links ---
  function fixLinks(container) {
    var links = container.querySelectorAll('a[href]');
    links.forEach(function (a) {
      try {
        var url = new URL(a.href, window.location.origin);
        if (url.hostname !== window.location.hostname) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
      } catch (e) { /* invalid URL, skip */ }
    });
  }

  // --- Configure marked ---
  function configuremarked() {
    if (!window.marked) return;
    window.marked.setOptions({
      gfm: true,
      breaks: false,
      headerIds: false,
      mangle: false
    });
  }

  // --- Private post form ---
  function showPrivateForm(container, slug) {
    container.innerHTML = '<div class="private-form">' +
      '<h2>This post is private</h2>' +
      '<p style="color:var(--accent-secondary);margin-bottom:20px;">Enter the password to view this post.</p>' +
      '<form id="private-access-form">' +
      '<input type="text" name="name" placeholder="Your name" required ' +
      'style="display:block;width:100%;padding:10px 14px;margin-bottom:12px;border:2px solid var(--accent-primary);border-radius:8px;background:var(--frosted-bg);color:var(--text-color);box-sizing:border-box;font-size:1em;">' +
      '<input type="password" name="password" placeholder="Password" required ' +
      'style="display:block;width:100%;padding:10px 14px;margin-bottom:16px;border:2px solid var(--accent-primary);border-radius:8px;background:var(--frosted-bg);color:var(--text-color);box-sizing:border-box;font-size:1em;">' +
      '<button type="submit" style="background:var(--accent-primary);color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:1em;transition:background 0.2s;">Submit</button>' +
      '<p id="private-error" style="color:var(--accent-hover);margin-top:12px;display:none;"></p>' +
      '</form></div>';

    document.getElementById('private-access-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var password = e.target.password.value;
      var errEl = document.getElementById('private-error');
      errEl.style.display = 'none';

      fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug, password: password })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.markdown) {
            renderMarkdown(container, data.markdown);
          } else {
            errEl.textContent = 'Incorrect password. Please try again.';
            errEl.style.display = 'block';
          }
        })
        .catch(function () {
          errEl.textContent = 'Something went wrong. Please try again.';
          errEl.style.display = 'block';
        });
    });
  }

  // --- Core render function ---
  function renderMarkdown(container, md) {
    md = stripFrontmatter(md);
    md = stripManualToc(md);

    var protected_ = protectLatex(md);
    md = protected_.md;

    configuremarked();
    var html = window.marked.parse(md);
    html = restoreLatex(html, protected_.placeholders);

    container.innerHTML = html;

    fixLinks(container);
    generateToc(container);

    // Render LaTeX if any
    var hasLatex = protected_.placeholders.length > 0;
    var latexPromise = hasLatex ? renderAllLatex(container) : Promise.resolve();

    latexPromise.then(function () {
      document.dispatchEvent(new CustomEvent('blog:content-ready'));
    });
  }

  // --- Main entry ---
  function init() {
    var container = document.querySelector('.post-content');
    if (!container) return;

    var slug = container.getAttribute('data-slug');
    if (!slug) return;

    var isPrivate = container.getAttribute('data-private') === 'true';
    if (isPrivate) {
      showPrivateForm(container, slug);
      return;
    }

    // Fetch markdown from static file first
    fetch('../posts/' + slug + '.md')
      .then(function (r) {
        if (!r.ok) throw new Error('not found');
        return r.text();
      })
      .then(function (md) {
        renderMarkdown(container, md);
      })
      .catch(function () {
        // Fallback: try Firestore REST API
        var projectId = container.getAttribute('data-project') || '';
        if (!projectId) {
          container.innerHTML = '<p style="color:var(--accent-hover);">Post not found.</p>';
          return;
        }
        fetch('https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/posts/' + slug)
          .then(function (r) { return r.json(); })
          .then(function (doc) {
            if (doc.fields && doc.fields.markdown) {
              var md = doc.fields.markdown.stringValue;
              var priv = doc.fields.isPrivate && doc.fields.isPrivate.booleanValue;
              if (priv) {
                showPrivateForm(container, slug);
              } else {
                renderMarkdown(container, md);
              }
            } else {
              container.innerHTML = '<p style="color:var(--accent-hover);">Post not found.</p>';
            }
          })
          .catch(function () {
            container.innerHTML = '<p style="color:var(--accent-hover);">Post not found.</p>';
          });
      });
  }

  // Wait for marked.js to be available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
