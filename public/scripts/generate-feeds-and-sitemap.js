/*
  Generates rss.xml, atom.xml, and sitemap.xml based on blog/generated/posts.json and public files.
  SITE_URL can be overridden via env var. Defaults to https://devanvelji.com
*/
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || 'https://devanvelji.com';
const publicDir = path.resolve(__dirname, '..');
const blogDir = path.join(publicDir, 'blog');
const generatedDir = path.join(blogDir, 'generated');

function readPosts() {
  const postsPath = path.join(generatedDir, 'posts.json');
  try {
    const raw = fs.readFileSync(postsPath, 'utf-8');
    const posts = JSON.parse(raw);
    if (!Array.isArray(posts)) return [];
    // Normalize minimal fields
    return posts.map(p => ({
      title: p.title || p.slug || 'Untitled',
      slug: p.slug || (p.title ? p.title.toLowerCase().replace(/\s+/g, '-') : 'post'),
      date: p.date || new Date().toISOString(),
      excerpt: p.excerpt || '',
    }));
  } catch {
    return [];
  }
}

function formatRfc822(dateStr) {
  const d = new Date(dateStr);
  return d.toUTCString();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function writeRss(posts) {
  const rssItems = posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/generated/${encodeURIComponent(p.slug)}.html</link>
      <guid>${SITE_URL}/blog/generated/${encodeURIComponent(p.slug)}.html</guid>
      <pubDate>${formatRfc822(p.date)}</pubDate>
      <description>${escapeXml(p.excerpt || '')}</description>
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Devan Velji - Blog</title>
    <description>Posts by Devan Velji</description>
    <link>${SITE_URL}/blog/</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${formatRfc822(new Date().toISOString())}</lastBuildDate>
${rssItems}
  </channel>
</rss>`;
  fs.writeFileSync(path.join(publicDir, 'rss.xml'), rss, 'utf-8');
}

function writeAtom(posts) {
  const updated = new Date().toISOString();
  const entries = posts.map(p => `
  <entry>
    <title>${escapeXml(p.title)}</title>
    <link href="${SITE_URL}/blog/generated/${encodeURIComponent(p.slug)}.html" />
    <id>${SITE_URL}/blog/generated/${encodeURIComponent(p.slug)}.html</id>
    <updated>${new Date(p.date).toISOString()}</updated>
    <summary>${escapeXml(p.excerpt || '')}</summary>
  </entry>`).join('\n');

  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Devan Velji - Blog</title>
  <link href="${SITE_URL}/atom.xml" rel="self" />
  <link href="${SITE_URL}/blog/" />
  <updated>${updated}</updated>
  <id>${SITE_URL}/</id>
  <author>
    <name>Devan Velji</name>
    <email>devanvelji@gmail.com</email>
  </author>
${entries}
</feed>`;
  fs.writeFileSync(path.join(publicDir, 'atom.xml'), atom, 'utf-8');
}

function collectHtmlFiles(rootDir, baseUrl) {
  const collected = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      const abs = path.join(dir, ent.name);
      const rel = path.relative(rootDir, abs);
      if (ent.isDirectory()) {
        walk(abs);
      } else if (ent.isFile() && ent.name.endsWith('.html')) {
        // Exclude 404 if you don’t want it in sitemap
        if (rel === '404.html') continue;
        collected.push(rel);
      }
    }
  }
  walk(rootDir);
  return collected.map(rel => ({
    loc: `${baseUrl}/${rel.replace(/\\/g, '/')}`,
    path: rel,
  }));
}

function writeSitemap() {
  const pages = collectHtmlFiles(publicDir, SITE_URL);
  const urlset = pages.map(({ loc, path: relPath }) => {
    let priority = '0.6';
    let changefreq = 'monthly';
    if (relPath === 'index.html') { priority = '1.0'; changefreq = 'weekly'; }
    if (relPath.startsWith('blog/')) { changefreq = 'weekly'; }
    const abs = path.join(publicDir, relPath);
    let lastmod;
    try { lastmod = new Date(fs.statSync(abs).mtime).toISOString().slice(0, 10); } catch { lastmod = new Date().toISOString().slice(0, 10); }
    return `  <url>
    <loc>${loc.replace('/index.html', '/')}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
}

function main() {
  const posts = readPosts();
  writeRss(posts);
  writeAtom(posts);
  writeSitemap();
  console.log('Generated rss.xml, atom.xml, sitemap.xml');
}

main();



