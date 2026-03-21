const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exiftool } = require('exiftool-vendored');
const { MathpixMarkdownModel } = require('mathpix-markdown-it');
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
                const match = line.match(/^(\w+):\s*"?([^"]*)"?$/);
                if (match) {
                    frontMatter[match[1]] = match[2];
                }
            });
        }
        
        const html = MathpixMarkdownModel.markdownToHTML(markdownContent, {
            htmlTags: true,
            linkify: true,
            typographer: true
        });
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

        const post = {
            slug,
            title: frontMatter.title || slug,
            date: frontMatter.date || new Date().toISOString().split('T')[0],
            tags: frontMatter.tags ? frontMatter.tags.split(',').map(t => t.trim()) : [],
            content: html,
            excerpt: cleanExcerpt.substring(0, 200) + (cleanExcerpt.length > 200 ? '...' : ''),
            readingTime: readingTime
        };
        
        posts.push(post);
        
        // Generate individual post HTML
        const postHtml = generatePostHtml(post);
        fs.writeFileSync(path.join(outputDir, `${slug}.html`), postHtml);
    }
    
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Generate blog index
    const indexHtml = generateBlogIndexHtml(posts);
    fs.writeFileSync(path.join(blogDir, 'index.html'), indexHtml);
    
    fs.writeFileSync(path.join(outputDir, 'posts.json'), JSON.stringify(posts, null, 2));
    
    console.log(`Generated ${posts.length} blog posts`);
}

function generatePostHtml(post) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${post.excerpt}">
    <meta name="keywords" content="${post.tags ? post.tags.join(', ') : ''}">
    <meta name="author" content="Devan Velji">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://devanvelji.com/blog/generated/${post.slug}.html">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://devanvelji.com/blog/generated/${post.slug}.html">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.excerpt}">
    <meta property="og:image" content="https://devanvelji.com/images/blog-og-image.jpg">
    <meta property="og:site_name" content="Devan Velji">
    <meta property="article:author" content="Devan Velji">
    <meta property="article:published_time" content="${post.date}T00:00:00Z">
    ${post.tags ? post.tags.map(tag => `<meta property="article:tag" content="${tag}">`).join('\n    ') : ''}
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://devanvelji.com/blog/generated/${post.slug}.html">
    <meta property="twitter:title" content="${post.title}">
    <meta property="twitter:description" content="${post.excerpt}">
    <meta property="twitter:image" content="https://devanvelji.com/images/blog-og-image.jpg">
    
    <title>${post.title} - Devan Velji</title>
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="stylesheet" href="../styles/theme.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    
    <!-- Analytics -->
    <script src="../scripts/analytics.js"></script>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
        }
        
        .navbar {
            background-color: var(--navbar-bg);
            padding: 10px 0px;
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
        
        .navbar h1 {
            margin: 0;
            font-size: 1.5em;
        }
        
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
            padding: 32px 24px 24px 24px;
            margin: 0 auto 30px auto;
        }
        
        .post-meta {
            color: var(--accent-secondary);
            margin-bottom: 20px;
            font-size: 0.9em;
        }
        
        .post-content {
            line-height: 1.6;
        }
        
        .post-content h1, .post-content h2, .post-content h3 {
            color: var(--accent-primary);
        }
        
        .back-link {
            color: var(--accent-primary);
            text-decoration: none;
            font-size: 1.1em;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
        
        .post-content pre {
            background: rgba(0,0,0,0.1);
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
        }
        
        .post-content code {
            background: rgba(0,0,0,0.1);
            padding: 2px 4px;
            border-radius: 4px;
        }
    </style>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
            }
        };
    </script>
    
    <!-- Structured Data for Blog Post -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "${post.title}",
        "description": "${post.excerpt}",
        "image": "https://devanvelji.com/images/blog-og-image.jpg",
        "author": {
            "@type": "Person",
            "name": "Devan Velji",
            "url": "https://devanvelji.com"
        },
        "publisher": {
            "@type": "Person",
            "name": "Devan Velji",
            "url": "https://devanvelji.com"
        },
        "datePublished": "${post.date}T00:00:00Z",
        "dateModified": "${post.date}T00:00:00Z",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://devanvelji.com/blog/generated/${post.slug}.html"
        },
        "keywords": "${post.tags ? post.tags.join(', ') : ''}",
        "wordCount": "${post.content.split(' ').length}",
        "url": "https://devanvelji.com/blog/generated/${post.slug}.html"
    }
    </script>
    
    <!-- Blog Enhancements -->
    <script src="../scripts/blog-enhancements.js"></script>
</head>
<body>
    <nav class="navbar">
        <h1><a href="../index.html">Devan Velji</a></h1>
    </nav>
    
    <div class="container">
        <div class="frosted-glass">
            <div class="post-meta">
                <i class="fas fa-calendar"></i> ${post.date}
                ${post.tags.length > 0 ? `<span style="margin-left: 20px;"><i class="fas fa-tags"></i> ${post.tags.join(', ')}</span>` : ''}
            </div>
            <div class="post-content">
                ${post.content}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="../blog/index.html" class="back-link">← Back to Blog</a>
            <span style="margin: 0 20px;">|</span>
            <a href="../index.html" class="back-link">Home</a>
        </div>
    </div>
    
    
</body>
</html>`;
}

function generateBlogIndexHtml(posts) {
    // Collect all unique tags
    const allTags = [...new Set(posts.flatMap(post => post.tags))].sort();

    const postsHtml = posts.map(post => `
        <div class="frosted-glass post-preview" data-tags="${post.tags.join(',')}" data-title="${post.title.toLowerCase()}" data-excerpt="${post.excerpt.toLowerCase()}">
            <h2><a href="generated/${post.slug}.html" style="color: var(--accent-primary); text-decoration: none; font-size: 1.75rem; font-weight: 600;">${post.title}</a></h2>
            <div class="post-meta">
                <i class="fas fa-calendar"></i> ${post.date}
                ${post.readingTime ? `<span style="margin-left: 20px;"><i class="fas fa-clock"></i> ${post.readingTime} min read</span>` : ''}
                ${post.tags.length > 0 ? `<span style="margin-left: 20px;"><i class="fas fa-tags"></i> ${post.tags.join(', ')}</span>` : ''}
            </div>
            <p style="color: var(--text-color); line-height: 1.6; margin-bottom: 16px;">${post.excerpt}</p>
            <a href="generated/${post.slug}.html" style="color: var(--accent-primary); font-weight: 500;">Read more →</a>
        </div>
    `).join('');

    const tagButtons = allTags.map(tag =>
        `<button class="tag-filter" data-tag="${tag}">${tag}</button>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Blog posts by Devan Velji covering technology, photography, fitness, and more.">
    <title>Blog - Devan Velji</title>
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="stylesheet" href="../styles/theme.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
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
            padding: 10px 0px;
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

        .navbar h1 {
            margin: 0;
            font-size: 1.5em;
        }

        .navbar a {
            color: var(--text-color);
            text-decoration: none;
        }

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
            padding: 32px 28px 28px 28px;
            margin: 0 auto 30px auto;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .post-preview {
            margin-bottom: 30px;
        }

        .post-preview:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 40px 0 var(--shadow-color);
        }

        .post-preview h2 {
            margin-top: 0;
            margin-bottom: 12px;
            line-height: 1.3;
        }

        .post-meta {
            color: var(--accent-secondary);
            margin-bottom: 16px;
            font-size: 0.9em;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }

        .post-meta span {
            display: inline-block;
        }

        .search-filter-container {
            margin-bottom: 24px;
        }

        .search-box {
            width: 100%;
            padding: 14px 16px;
            font-size: 1rem;
            border: 2px solid var(--accent-primary);
            border-radius: 12px;
            background: var(--frosted-bg);
            color: var(--text-color);
            margin-bottom: 16px;
            box-sizing: border-box;
            transition: border-color 0.3s ease;
        }

        .search-box:focus {
            outline: none;
            border-color: var(--accent-hover);
        }

        .search-box::placeholder {
            color: var(--accent-secondary);
        }

        .tag-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 16px;
        }

        .tag-filter {
            padding: 8px 16px;
            border: 2px solid var(--accent-primary);
            border-radius: 20px;
            background: transparent;
            color: var(--accent-primary);
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .tag-filter:hover {
            background: var(--accent-primary);
            color: white;
        }

        .tag-filter.active {
            background: var(--accent-primary);
            color: white;
        }

        .clear-filters {
            padding: 8px 16px;
            border: 2px solid var(--accent-secondary);
            border-radius: 20px;
            background: transparent;
            color: var(--accent-secondary);
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .clear-filters:hover {
            background: var(--accent-secondary);
            color: white;
        }

        .no-results {
            text-align: center;
            padding: 40px 20px;
            color: var(--accent-secondary);
            font-size: 1.1rem;
            display: none;
        }

        .post-preview.hidden {
            display: none;
        }

        .back-link {
            color: var(--accent-primary);
            text-decoration: none;
            font-size: 1.1em;
            font-weight: 500;
        }

        .back-link:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .post-meta {
                flex-direction: column;
                gap: 8px;
            }

            .post-meta span {
                margin-left: 0 !important;
            }

            .tag-filters {
                gap: 8px;
            }

            .tag-filter, .clear-filters {
                font-size: 0.85rem;
                padding: 6px 12px;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <h1><a href="../index.html">Devan Velji</a></h1>
    </nav>

    <div class="container">
        <div class="frosted-glass">
            <h1 class="page-title" style="text-align: center; margin-bottom: 16px; font-size: 2.5rem;">Blog</h1>
            <p style="text-align: center; margin-bottom: 0; color: var(--accent-secondary); font-size: 1.1rem;">Thoughts on technology, photography, fitness, and life.</p>
        </div>

        <div class="frosted-glass search-filter-container">
            <input type="text" id="searchBox" class="search-box" placeholder="🔍 Search posts by title, content, or tags...">
            <div class="tag-filters">
                <button class="clear-filters" id="clearFilters">Clear Filters</button>
                ${tagButtons}
            </div>
        </div>

        <div id="postsContainer">
            ${postsHtml}
        </div>

        <div class="frosted-glass no-results" id="noResults">
            <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
            <p>No posts found matching your search.</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="../index.html" class="back-link">← Back to Home</a>
        </div>
    </div>

    <script>
        // Blog filtering and search functionality
        const searchBox = document.getElementById('searchBox');
        const tagFilters = document.querySelectorAll('.tag-filter');
        const clearFiltersBtn = document.getElementById('clearFilters');
        const posts = document.querySelectorAll('.post-preview');
        const noResults = document.getElementById('noResults');

        let activeTag = null;
        let searchTerm = '';

        function filterPosts() {
            let visibleCount = 0;

            posts.forEach(post => {
                const postTags = post.dataset.tags.split(',');
                const postTitle = post.dataset.title;
                const postExcerpt = post.dataset.excerpt;

                const matchesTag = !activeTag || postTags.includes(activeTag);
                const matchesSearch = !searchTerm ||
                    postTitle.includes(searchTerm) ||
                    postExcerpt.includes(searchTerm) ||
                    postTags.some(tag => tag.toLowerCase().includes(searchTerm));

                if (matchesTag && matchesSearch) {
                    post.classList.remove('hidden');
                    visibleCount++;
                } else {
                    post.classList.add('hidden');
                }
            });

            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        searchBox.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase().trim();
            filterPosts();
        });

        tagFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                const tag = e.target.dataset.tag;

                if (activeTag === tag) {
                    activeTag = null;
                    e.target.classList.remove('active');
                } else {
                    tagFilters.forEach(f => f.classList.remove('active'));
                    activeTag = tag;
                    e.target.classList.add('active');
                }

                filterPosts();
            });
        });

        clearFiltersBtn.addEventListener('click', () => {
            activeTag = null;
            searchTerm = '';
            searchBox.value = '';
            tagFilters.forEach(f => f.classList.remove('active'));
            filterPosts();
        });
    </script>

</body>
</html>`;
}
