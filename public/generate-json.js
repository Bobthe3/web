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
        
        const post = {
            slug,
            title: frontMatter.title || slug,
            date: frontMatter.date || new Date().toISOString().split('T')[0],
            tags: frontMatter.tags ? frontMatter.tags.split(',').map(t => t.trim()) : [],
            content: html,
            excerpt: markdownContent.substring(0, 200) + '...'
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
    const postsHtml = posts.map(post => `
        <div class="frosted-glass post-preview">
            <h2><a href="generated/${post.slug}.html" style="color: var(--accent-primary); text-decoration: none;">${post.title}</a></h2>
            <div class="post-meta">
                <i class="fas fa-calendar"></i> ${post.date}
                ${post.tags.length > 0 ? `<span style="margin-left: 20px;"><i class="fas fa-tags"></i> ${post.tags.join(', ')}</span>` : ''}
            </div>
            <p>${post.excerpt}</p>
            <a href="generated/${post.slug}.html" style="color: var(--accent-primary);">Read more →</a>
        </div>
    `).join('');
    
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
            font-family: Arial, sans-serif;
            background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
            background-size: 400% 400%;
            animation: gradient 15s ease infinite;
            min-height: 100vh;
        }
        
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
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
        
        .post-preview {
            margin-bottom: 30px;
        }
        
        .post-preview h2 {
            margin-top: 0;
            margin-bottom: 10px;
        }
        
        .post-meta {
            color: var(--accent-secondary);
            margin-bottom: 15px;
            font-size: 0.9em;
        }
        
        .back-link {
            color: var(--accent-primary);
            text-decoration: none;
            font-size: 1.1em;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <h1><a href="../index.html">Devan Velji</a></h1>
    </nav>
    
    <div class="container">
        <div class="frosted-glass">
            <h1 class="page-title" style="text-align: center; margin-bottom: 16px;">Blog</h1>
            <p style="text-align: center; margin-bottom: 24px;">Thoughts on technology, photography, fitness, and life.</p>
        </div>
        
        ${postsHtml}
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="../index.html" class="back-link">← Back to Home</a>
        </div>
    </div>
    
    
</body>
</html>`;
}
