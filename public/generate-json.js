const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exiftool } = require('exiftool-vendored');
const { JSDOM } = require('jsdom');

const imageDirectory = './images';
const previewDirectory = './previews';
const jsonFile = 'images.json';

// Ensure the preview directory exists
if (!fs.existsSync(previewDirectory)) {
    fs.mkdirSync(previewDirectory);
}

// Function to read existing JSON file
async function readExistingJson() {
    try {
        const data = await fs.promises.readFile(jsonFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('No existing JSON file found or error reading it. Starting fresh.');
        return [];
    }
}

fs.readdir(imageDirectory, async (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const imageFiles = files.filter(file => {
        return file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpeg');
    });

    try {
        const existingData = await readExistingJson();
        const existingImageMap = new Map(existingData.map(item => [item.fullImage, item]));

        const imageData = await Promise.all(imageFiles.map(async (file) => {
            const fullPath = path.join(imageDirectory, file);
            const previewPath = path.join(previewDirectory, `preview_${file}`);
            
            // Generate preview
            await sharp(fullPath)
                .resize(500) // Resize to 500px width, maintaining aspect ratio
                .toFile(previewPath);

            // Extract metadata using exiftool
            let exif = {};
            try {
                exif = await exiftool.read(fullPath);
                console.log(`Parsed EXIF for ${file}:`, exif);
            } catch (error) {
                console.error(`Error parsing EXIF for ${file}:`, error);
            }
            async function generateAlbumDescriptions() {
                const albumDescriptions = {};
                const imageData = await readExistingJson();
                
                imageData.forEach(image => {
                    image.tags.forEach(tag => {
                        if (!albumDescriptions[tag]) {
                            albumDescriptions[tag] = `This is the ${tag} album. Add your description here.`;
                        }
                    });
                });
            
                await fs.promises.writeFile('album-descriptions.json', JSON.stringify(albumDescriptions, null, 2));
                console.log('Album descriptions file has been saved as album-descriptions.json');
            }
            
            // Call this function after processing images
            generateAlbumDescriptions();

            // Log individual EXIF properties to debug
            const deviceModel = exif.Model || 'Unknown';
            const fNumber = exif.FNumber ? `f/${exif.FNumber}` : 'Unknown';
            const exposureTime = exif.ExposureTime ? `${exif.ExposureTime}s` : 'Unknown';
            const dateTaken = exif.DateTimeOriginal || exif.CreateDate || new Date().toISOString();

            // Check if this image already exists in the JSON
            const existingImage = existingImageMap.get(fullPath);
            
            return {
                fullImage: fullPath,
                preview: previewPath,
                title: path.basename(file, path.extname(file)),
                deviceModel: deviceModel,
                fNumber: fNumber,
                exposureTime: exposureTime,
                dateTaken: dateTaken,
                tags: existingImage ? existingImage.tags : ['Unsorted']
            };
        }));

        // Write to JSON file using promises for better async control
        await fs.promises.writeFile(jsonFile, JSON.stringify(imageData, null, 2));

        console.log('JSON file has been saved with image filenames, preview paths, and metadata at images.json in this same directory.');
        
        // Generate blog posts
        await generateBlogPosts();
        
    } catch (error) {
        console.error('Error processing images:', error);
    }
});

async function generateBlogPosts() {
    const blogDir = './blog';
    const postsDir = path.join(blogDir, 'posts');
    const outputDir = path.join(blogDir, 'generated');
    
    // Ensure directories exist
    if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    
    if (!fs.existsSync(postsDir)) {
        console.log('No blog posts directory found. Skipping blog generation.');
        return;
    }
    
    
    const posts = [];
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
    
    for (const file of files) {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        let frontMatter = {};
        let markdownContent = content;
        
        if (frontMatterMatch) {
            const frontMatterText = frontMatterMatch[1];
            markdownContent = frontMatterMatch[2];
            
            frontMatterText.split('\n').forEach(line => {
                const match = line.match(/^(\w+):\s*(.+)$/);
                if (match) {
                    let value = match[2].trim();
                    // Strip surrounding quotes
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    frontMatter[match[1]] = value;
                }
            });
        }
        
        const slug = path.basename(file, '.md');

        // Create clean excerpt by stripping markdown and LaTeX
        const cleanExcerpt = markdownContent
            .replace(/\$\$[\s\S]*?\$\$/g, '') // Remove display math
            .replace(/\$[^$]+\$/g, '') // Remove inline math
            .replace(/^#{1,6}\s+/gm, '') // Remove headers
            .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.+?)\*/g, '$1') // Remove italic
            .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
            .replace(/`(.+?)`/g, '$1') // Remove inline code
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        // Calculate reading time
        const wordCount = cleanExcerpt.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

        // Parse tags - handle both JSON array and comma-separated formats
        let tags = [];
        if (frontMatter.tags) {
            const tagsRaw = frontMatter.tags.trim();
            if (tagsRaw.startsWith('[')) {
                try { tags = JSON.parse(tagsRaw); } catch (e) {
                    tags = tagsRaw.replace(/[\[\]"]/g, '').split(',').map(t => t.trim()).filter(Boolean);
                }
            } else {
                tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
            }
        }

        const post = {
            slug,
            title: frontMatter.title || slug,
            date: frontMatter.date || new Date().toISOString().split('T')[0],
            tags,
            excerpt: cleanExcerpt.substring(0, 200) + (cleanExcerpt.length > 200 ? '...' : ''),
            readingTime: readingTime
        };
        
        posts.push(post);
        
        // Generate individual post HTML
        const postHtml = generatePostHtml(post);
        fs.writeFileSync(path.join(outputDir, `${slug}.html`), postHtml);
    }
    
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Load books data
    const booksFile = path.join(blogDir, 'books.json');
    let books = [];
    if (fs.existsSync(booksFile)) {
        try { books = JSON.parse(fs.readFileSync(booksFile, 'utf8')); } catch (e) { books = []; }
    }

    // Generate blog index
    const indexHtml = generateBlogIndexHtml(posts, books);
    fs.writeFileSync(path.join(blogDir, 'index.html'), indexHtml);
    
    fs.writeFileSync(path.join(outputDir, 'posts.json'), JSON.stringify(posts, null, 2));
    
    console.log(`Generated ${posts.length} blog posts`);
}

function generatePostHtml(post) {
    const tagsStr = post.tags.join(', ');
    const escapedExcerpt = post.excerpt.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const escapedTitle = post.title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapedExcerpt}">
    <meta name="keywords" content="${tagsStr}">
    <meta name="author" content="Devan Velji">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://devanvelji.com/blog/generated/${post.slug}.html">

    <meta property="og:type" content="article">
    <meta property="og:url" content="https://devanvelji.com/blog/generated/${post.slug}.html">
    <meta property="og:title" content="${escapedTitle}">
    <meta property="og:description" content="${escapedExcerpt}">
    <meta property="og:image" content="https://devanvelji.com/images/blog-og-image.jpg">
    <meta property="og:site_name" content="Devan Velji">
    <meta property="article:author" content="Devan Velji">
    <meta property="article:published_time" content="${post.date}T00:00:00Z">
    ${post.tags.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n    ')}

    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://devanvelji.com/blog/generated/${post.slug}.html">
    <meta property="twitter:title" content="${escapedTitle}">
    <meta property="twitter:description" content="${escapedExcerpt}">

    <title>${post.title} - Devan Velji</title>
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="stylesheet" href="../styles/theme.css">

    <script src="../scripts/analytics.js"></script>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
            line-height: 1.6;
        }
        .navbar {
            background-color: var(--navbar-bg);
            padding: 10px 0;
            color: var(--text-color);
            text-align: center;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .navbar h1 { margin: 0; font-size: 1.5em; }
        .navbar a { color: var(--text-color); text-decoration: none; }
        .navbar a:hover { color: var(--accent-hover); }
        .container {
            margin: 100px auto 50px auto;
            max-width: 800px;
            padding: 0 20px;
        }
        .frosted-glass {
            background: var(--frosted-bg);
            border-radius: 18px;
            box-shadow: 0 4px 32px 0 var(--shadow-color);
            backdrop-filter: blur(12px) saturate(1.5);
            -webkit-backdrop-filter: blur(12px) saturate(1.5);
            padding: 32px 28px;
            margin: 0 auto 30px auto;
        }
        .post-header { margin-bottom: 24px; }
        .post-title {
            color: var(--accent-primary);
            font-size: 2em;
            margin: 0 0 12px 0;
            line-height: 1.2;
        }
        .post-meta {
            color: var(--accent-secondary);
            font-size: 0.9em;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 16px;
        }
        .post-meta svg { width: 14px; height: 14px; vertical-align: -1px; fill: currentColor; margin-right: 4px; }
        .post-content { line-height: 1.75; font-size: 1.05em; }

        /* Headings */
        .post-content h1, .post-content h2, .post-content h3, .post-content h4 {
            color: var(--accent-primary);
            margin-top: 1.8em;
            margin-bottom: 0.5em;
            line-height: 1.3;
        }
        .post-content h1 { font-size: 1.7em; }
        .post-content h2 { font-size: 1.4em; }
        .post-content h3 { font-size: 1.2em; }
        .post-content h4 { font-size: 1.05em; }

        /* Code */
        .post-content pre {
            background: rgba(0,0,0,0.2);
            padding: 16px;
            border-radius: 10px;
            overflow-x: auto;
            font-size: 0.9em;
            line-height: 1.5;
        }
        .post-content code {
            background: rgba(0,0,0,0.15);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .post-content pre code { background: none; padding: 0; }

        /* Blockquotes */
        .post-content blockquote {
            border-left: 4px solid var(--accent-primary);
            margin: 1.5em 0;
            padding: 0.5em 1em;
            background: rgba(0,0,0,0.1);
            border-radius: 0 8px 8px 0;
        }
        .post-content blockquote p { margin: 0.5em 0; }

        /* Images */
        .post-content img {
            max-width: 100%;
            border-radius: 10px;
            margin: 1.5em auto;
            display: block;
        }

        /* Links */
        .post-content a {
            color: var(--accent-primary);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s;
        }
        .post-content a:hover { border-bottom-color: var(--accent-primary); }

        /* Tables */
        .post-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
        }
        .post-content th, .post-content td {
            border: 1px solid rgba(76, 86, 106, 0.4);
            padding: 8px 12px;
            text-align: left;
        }
        .post-content th { background: rgba(0,0,0,0.15); color: var(--accent-primary); }

        /* Lists */
        .post-content ul, .post-content ol { padding-left: 1.5em; }
        .post-content li { margin-bottom: 0.4em; }

        /* Horizontal rule */
        .post-content hr {
            border: none;
            border-top: 1px solid rgba(76, 86, 106, 0.4);
            margin: 2em 0;
        }

        /* TOC */
        .toc-nav {
            background: var(--frosted-bg);
            border-radius: 12px;
            padding: 16px 20px;
            margin: 0 0 24px 0;
            border-left: 4px solid var(--accent-primary);
        }
        .toc-nav h4 { margin: 0 0 10px; color: var(--accent-primary); font-size: 0.95em; font-weight: 600; }
        .toc-nav ul { list-style: none; padding: 0; margin: 0; }
        .toc-nav li { margin: 6px 0; }
        .toc-nav a { color: var(--text-color); text-decoration: none; font-size: 0.9em; transition: color 0.2s; }
        .toc-nav a:hover { color: var(--accent-primary); }

        /* Math */
        .math-display { text-align: center; margin: 1.5em 0; overflow-x: auto; }
        .math-inline { display: inline; }

        /* Loading */
        .loading { text-align: center; color: var(--accent-secondary); padding: 40px 0; }

        /* Private form */
        .private-form { text-align: center; padding: 20px 0; }
        .private-form h2 { color: var(--accent-primary); }

        /* Back links */
        .back-links { text-align: center; margin-top: 30px; }
        .back-link {
            color: var(--accent-primary);
            text-decoration: none;
            font-size: 1em;
            font-weight: 500;
            transition: color 0.2s;
        }
        .back-link:hover { color: var(--accent-hover); }

        /* Responsive */
        @media (max-width: 768px) {
            .post-title { font-size: 1.5em; }
            .post-content { font-size: 1em; }
            .frosted-glass { padding: 24px 18px; }
            .post-meta { gap: 10px; }
        }
    </style>

    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "${escapedTitle}",
        "description": "${escapedExcerpt}",
        "author": { "@type": "Person", "name": "Devan Velji", "url": "https://devanvelji.com" },
        "publisher": { "@type": "Person", "name": "Devan Velji" },
        "datePublished": "${post.date}T00:00:00Z",
        "dateModified": "${post.date}T00:00:00Z",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://devanvelji.com/blog/generated/${post.slug}.html" },
        "keywords": "${tagsStr}",
        "url": "https://devanvelji.com/blog/generated/${post.slug}.html"
    }
    </script>

    <script defer src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script defer src="../scripts/blog-renderer.js"></script>
    <script defer src="../scripts/blog-enhancements.js"></script>
</head>
<body>
    <nav class="navbar">
        <h1><a href="../index.html">Devan Velji</a></h1>
    </nav>

    <div class="container">
        <div class="frosted-glass">
            <div class="post-header">
                <h1 class="post-title">${post.title}</h1>
                <div class="post-meta">
                    <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H64C28.7 64 0 92.7 0 128v16 48V448c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V192 144 128c0-35.3-28.7-64-64-64h-40V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H152V24zM48 192h352V448c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192z"/></svg> ${post.date}</span>
                    ${post.readingTime ? `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120v136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg> ${post.readingTime} min read</span>` : ''}
                    ${post.tags.length > 0 ? `<span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 80v150.6c0 12.7 5.1 24.9 14.1 33.9L174.1 424.5c25 25 65.5 25 90.5 0l150.6-150.6c25-25 25-65.5 0-90.5L255.3 23.4C246.3 14.4 234.1 9.3 221.4 9.3H80C35.8 9.3 0 45.1 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg> ${tagsStr}</span>` : ''}
                </div>
            </div>
            <div class="post-content" data-slug="${post.slug}">
                <p class="loading">Loading post...</p>
            </div>
            <noscript><p>${post.excerpt}</p></noscript>
        </div>

        <div class="back-links">
            <a href="../blog/index.html" class="back-link">&larr; Back to Blog</a>
            <span style="margin: 0 16px; color: var(--accent-secondary);">|</span>
            <a href="../index.html" class="back-link">Home</a>
        </div>
    </div>
</body>
</html>`;
}

function generateBlogIndexHtml(posts, books) {
    books = books || [];
    const allTags = [...new Set(posts.flatMap(post => post.tags))].sort();

    // SVG icons (inline, no CDN)
    const svgCalendar = '<svg style="width:14px;height:14px;vertical-align:-1px;fill:currentColor;margin-right:4px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H64C28.7 64 0 92.7 0 128v16 48V448c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V192 144 128c0-35.3-28.7-64-64-64h-40V24c0-13.3-10.7-24-24-24s-24 10.7-24 24v40H152V24zM48 192h352V448c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192z"/></svg>';
    const svgClock = '<svg style="width:14px;height:14px;vertical-align:-1px;fill:currentColor;margin-right:4px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120v136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg>';
    const svgTags = '<svg style="width:14px;height:14px;vertical-align:-1px;fill:currentColor;margin-right:4px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 80v150.6c0 12.7 5.1 24.9 14.1 33.9L174.1 424.5c25 25 65.5 25 90.5 0l150.6-150.6c25-25 25-65.5 0-90.5L255.3 23.4C246.3 14.4 234.1 9.3 221.4 9.3H80C35.8 9.3 0 45.1 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>';

    const postsHtml = posts.map(post => `
        <div class="frosted-glass post-preview" data-tags="${post.tags.join(',')}" data-title="${post.title.toLowerCase()}" data-excerpt="${post.excerpt.toLowerCase()}">
            <h2 class="post-preview-title"><a href="generated/${post.slug}.html">${post.title}</a></h2>
            <div class="post-meta">
                <span>${svgCalendar} ${post.date}</span>
                ${post.readingTime ? `<span>${svgClock} ${post.readingTime} min read</span>` : ''}
                ${post.tags.length > 0 ? `<span>${svgTags} ${post.tags.join(', ')}</span>` : ''}
            </div>
            <p class="post-excerpt">${post.excerpt}</p>
            <a href="generated/${post.slug}.html" class="read-more">Read more &rarr;</a>
        </div>
    `).join('');

    const tagButtons = allTags.map(tag =>
        `<button class="tag-filter" data-tag="${tag}">${tag}</button>`
    ).join('');

    // Books section HTML
    const booksHtml = books.length > 0 ? `
        <div class="frosted-glass books-section">
            <h2 class="books-title">
                <svg style="width:20px;height:20px;vertical-align:-3px;fill:currentColor;margin-right:8px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M96 0C43 0 0 43 0 96v320c0 53 43 96 96 96h320c17.7 0 32-14.3 32-32s-14.3-32-32-32v-64c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32H96zm0 384h256v64H96c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-304a16 16 0 0 1 16-16h192a16 16 0 0 1 0 32H144a16 16 0 0 1-16-16zm16 48h192a16 16 0 0 1 0 32H144a16 16 0 0 1 0-32z"/></svg>
                Books
            </h2>
            <ul class="books-list">
                ${books.map(b => `<li><strong>${b.title}</strong> <span class="book-author">by ${b.author}</span>${b.note ? `<span class="book-note"> &mdash; ${b.note}</span>` : ''}</li>`).join('\n                ')}
            </ul>
        </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Blog posts by Devan Velji covering technology, photography, fitness, and more.">
    <title>Blog - Devan Velji</title>
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="stylesheet" href="../styles/theme.css">
    <script src="../scripts/analytics.js"></script>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
        }
        .navbar {
            background-color: var(--navbar-bg);
            padding: 10px 0;
            color: var(--text-color);
            text-align: center;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .navbar h1 { margin: 0; font-size: 1.5em; }
        .navbar a { color: var(--text-color); text-decoration: none; }
        .navbar a:hover { color: var(--accent-hover); }
        .container {
            margin: 100px auto 50px auto;
            max-width: 800px;
            padding: 0 20px;
        }
        .frosted-glass {
            background: var(--frosted-bg);
            border-radius: 18px;
            box-shadow: 0 4px 32px 0 var(--shadow-color);
            backdrop-filter: blur(12px) saturate(1.5);
            -webkit-backdrop-filter: blur(12px) saturate(1.5);
            padding: 32px 28px;
            margin: 0 auto 24px auto;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        /* Page header */
        .page-title { text-align: center; margin: 0 0 12px; font-size: 2.2rem; color: var(--accent-primary); }
        .page-subtitle { text-align: center; margin: 0; color: var(--accent-secondary); font-size: 1.05rem; }

        /* Books section */
        .books-section { border-left: 4px solid var(--accent-primary); }
        .books-title { margin: 0 0 16px; font-size: 1.2em; color: var(--accent-primary); }
        .books-list { list-style: none; padding: 0; margin: 0; }
        .books-list li { padding: 8px 0; border-bottom: 1px solid rgba(76, 86, 106, 0.2); line-height: 1.5; }
        .books-list li:last-child { border-bottom: none; }
        .book-author { color: var(--accent-secondary); }
        .book-note { color: var(--accent-secondary); font-size: 0.9em; font-style: italic; }

        /* Post previews */
        .post-preview { margin-bottom: 0; }
        .post-preview:hover { transform: translateY(-2px); box-shadow: 0 6px 40px 0 var(--shadow-color); }
        .post-preview-title { margin: 0 0 12px; line-height: 1.3; }
        .post-preview-title a { color: var(--accent-primary); text-decoration: none; font-size: 1.5rem; font-weight: 600; }
        .post-preview-title a:hover { color: var(--accent-hover); }
        .post-meta {
            color: var(--accent-secondary);
            margin-bottom: 14px;
            font-size: 0.9em;
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
        }
        .post-excerpt { color: var(--text-color); line-height: 1.6; margin: 0 0 14px; }
        .read-more { color: var(--accent-primary); font-weight: 500; text-decoration: none; }
        .read-more:hover { color: var(--accent-hover); }

        /* Search & filters */
        .search-filter-container { margin-bottom: 0; }
        .search-box {
            width: 100%;
            padding: 12px 16px;
            font-size: 1rem;
            border: 2px solid var(--accent-primary);
            border-radius: 12px;
            background: var(--frosted-bg);
            color: var(--text-color);
            margin-bottom: 14px;
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        .search-box:focus { outline: none; border-color: var(--accent-hover); }
        .search-box::placeholder { color: var(--accent-secondary); }
        .tag-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .tag-filter {
            padding: 6px 14px;
            border: 2px solid var(--accent-primary);
            border-radius: 20px;
            background: transparent;
            color: var(--accent-primary);
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        .tag-filter:hover, .tag-filter.active { background: var(--accent-primary); color: #fff; }
        .clear-filters {
            padding: 6px 14px;
            border: 2px solid var(--accent-secondary);
            border-radius: 20px;
            background: transparent;
            color: var(--accent-secondary);
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        .clear-filters:hover { background: var(--accent-secondary); color: #fff; }
        .no-results { text-align: center; padding: 40px 20px; color: var(--accent-secondary); font-size: 1.1rem; display: none; }
        .post-preview.hidden { display: none; }

        /* Feed links */
        .feed-links { text-align: center; margin: 8px 0 0; }
        .feed-links a { color: var(--accent-secondary); text-decoration: none; font-size: 0.85em; margin: 0 8px; }
        .feed-links a:hover { color: var(--accent-primary); }

        /* Back link */
        .back-link { color: var(--accent-primary); text-decoration: none; font-size: 1em; font-weight: 500; }
        .back-link:hover { color: var(--accent-hover); }

        @media (max-width: 768px) {
            .page-title { font-size: 1.8rem; }
            .post-meta { flex-direction: column; gap: 6px; }
            .tag-filters { gap: 6px; }
            .tag-filter, .clear-filters { font-size: 0.85rem; padding: 5px 10px; }
            .frosted-glass { padding: 24px 18px; }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <h1><a href="../index.html">Devan Velji</a></h1>
    </nav>

    <div class="container">
        <div class="frosted-glass">
            <h1 class="page-title">Blog</h1>
            <p class="page-subtitle">Thoughts on technology, photography, fitness, and life.</p>
            <div class="feed-links">
                <a href="../rss.xml">RSS</a> &middot; <a href="../atom.xml">Atom</a>
            </div>
        </div>

        ${booksHtml}

        <div class="frosted-glass search-filter-container">
            <input type="text" id="searchBox" class="search-box" placeholder="Search posts by title, content, or tags...">
            <div class="tag-filters">
                <button class="clear-filters" id="clearFilters">Clear Filters</button>
                ${tagButtons}
            </div>
        </div>

        <div id="postsContainer">
            ${postsHtml}
        </div>

        <div class="frosted-glass no-results" id="noResults">
            <p>No posts found matching your search.</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="../index.html" class="back-link">&larr; Back to Home</a>
        </div>
    </div>

    <script>
        var searchBox = document.getElementById('searchBox');
        var tagFilters = document.querySelectorAll('.tag-filter');
        var clearFiltersBtn = document.getElementById('clearFilters');
        var posts = document.querySelectorAll('.post-preview');
        var noResults = document.getElementById('noResults');
        var activeTag = null;
        var searchTerm = '';

        function filterPosts() {
            var visibleCount = 0;
            posts.forEach(function(post) {
                var postTags = post.dataset.tags.split(',');
                var postTitle = post.dataset.title;
                var postExcerpt = post.dataset.excerpt;
                var matchesTag = !activeTag || postTags.indexOf(activeTag) !== -1;
                var matchesSearch = !searchTerm ||
                    postTitle.indexOf(searchTerm) !== -1 ||
                    postExcerpt.indexOf(searchTerm) !== -1 ||
                    postTags.some(function(tag) { return tag.toLowerCase().indexOf(searchTerm) !== -1; });
                if (matchesTag && matchesSearch) {
                    post.classList.remove('hidden');
                    visibleCount++;
                } else {
                    post.classList.add('hidden');
                }
            });
            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        searchBox.addEventListener('input', function(e) {
            searchTerm = e.target.value.toLowerCase().trim();
            filterPosts();
        });

        tagFilters.forEach(function(filter) {
            filter.addEventListener('click', function(e) {
                var tag = e.target.dataset.tag;
                if (activeTag === tag) {
                    activeTag = null;
                    e.target.classList.remove('active');
                } else {
                    tagFilters.forEach(function(f) { f.classList.remove('active'); });
                    activeTag = tag;
                    e.target.classList.add('active');
                }
                filterPosts();
            });
        });

        clearFiltersBtn.addEventListener('click', function() {
            activeTag = null;
            searchTerm = '';
            searchBox.value = '';
            tagFilters.forEach(function(f) { f.classList.remove('active'); });
            filterPosts();
        });
    </script>
</body>
</html>`;
}
