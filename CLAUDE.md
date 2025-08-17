# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website for Devan Velji hosted on Firebase. It's a static site with a photography gallery, blog, fitness section, and resume display. The site uses a modern Nord color scheme with frosted glass styling.

## Build and Development Commands

All commands should be run from the `public/` directory:

```bash
cd public/
npm run build    # Generates images.json, blog posts, RSS feeds, and sitemap
npm install      # Install dependencies
```

The build process:
1. Processes images in `images/` directory and generates previews in `previews/`
2. Converts markdown blog posts from `blog/posts/` to HTML in `blog/generated/`
3. Generates RSS, Atom feeds, and sitemap.xml

## Firebase Deployment

```bash
firebase deploy    # Deploy to Firebase hosting (run from project root)
firebase serve     # Local preview
```

## Project Structure

```
public/
├── index.html              # Main landing page
├── gallery.html            # Photo gallery with modal viewing
├── fitness.html            # Fitness/wellness content
├── resume.html             # Resume display page
├── blog/
│   ├── index.html          # Blog listing (generated)
│   ├── posts/              # Markdown source files
│   └── generated/          # Generated HTML posts
├── images/                 # Full-size photos
├── previews/               # Auto-generated thumbnails
├── scripts/
│   ├── generate-feeds-and-sitemap.js  # RSS/Atom/sitemap generator
│   ├── theme.js            # Dark/light theme toggle
│   └── unified-modal.js    # Photo modal functionality
├── styles/
│   ├── theme.css           # Nord-based theme variables
│   └── styles.css          # Main styles
├── generate-json.js        # Image processing and blog generation
└── package.json            # Dependencies and build scripts
```

## Key Features

### Image Processing System
- Automatically processes JPG/PNG files in `images/` directory
- Generates thumbnails using Sharp library
- Extracts EXIF metadata for camera info display
- Creates `images.json` with metadata for gallery display
- Preserves existing tag assignments when regenerating

### Blog System
- Markdown files in `blog/posts/` with frontmatter support
- Auto-generates HTML with MathJax support for equations
- Creates RSS and Atom feeds
- Supports tags and excerpts

### Theme System
- Nord color palette defined in CSS custom properties
- Consistent frosted glass effect using backdrop-filter
- Theme toggle functionality in `theme.js`

## Important Files

- `generate-json.js`: Core image processing and blog generation
- `firebase.json`: Hosting configuration with security headers and caching
- `scripts/generate-feeds-and-sitemap.js`: SEO and feed generation
- `styles/theme.css`: Nord color scheme and design tokens

## Enhanced Features

### SEO & Analytics
- **Comprehensive SEO**: Open Graph tags, Twitter Cards, structured data (JSON-LD) for all pages
- **Google Analytics**: Privacy-compliant GA4 integration with custom event tracking
- **Performance Monitoring**: Core Web Vitals tracking and page load analytics

### Photo Gallery Enhancements
- **Advanced Filtering**: Filter by camera model, year, tags, and search across multiple fields
- **Enhanced Metadata Display**: Rich EXIF information with camera settings
- **Mobile Optimization**: Touch-friendly interface with optimized grid layouts
- **Analytics Integration**: Photo view tracking and filter usage analytics

### Blog System Improvements
- **Reading Progress**: Visual progress bar and milestone tracking
- **Reading Time**: Automatic calculation and display of estimated reading time
- **Table of Contents**: Auto-generated TOC for longer posts with smooth scrolling
- **Related Posts**: Algorithm-based suggestions using tag similarity
- **Enhanced SEO**: Article-specific structured data and social sharing optimization

### Mobile-First Design
- **Responsive Typography**: Fluid font scaling across all device sizes
- **Touch Optimization**: 44px minimum touch targets for accessibility
- **Grid Layouts**: Optimized gallery and navigation layouts for mobile
- **Performance**: Optimized images and lazy loading for mobile devices

## Analytics & Tracking

The site includes comprehensive analytics tracking:
- Page views and user engagement
- Photo gallery interactions
- Blog reading behavior and progress
- Social media clicks
- Performance metrics

To configure analytics, replace `GA_MEASUREMENT_ID` in `scripts/analytics.js` with your Google Analytics 4 measurement ID.

## Dependencies

Key libraries:
- `sharp`: Image processing and thumbnail generation
- `exiftool-vendored`: EXIF metadata extraction
- `mathpix-markdown-it`: Markdown with math support
- `jsdom`: HTML manipulation for blog generation

## Content Management

Blog posts use frontmatter format:
```markdown
---
title: "Post Title"
date: "2024-01-01"
tags: "tag1, tag2"
---

Post content here...
```

Images are automatically processed when placed in `images/` directory. Tags can be manually assigned in `images.json`.

## Recent Enhancements

The site now includes:
1. **Enhanced Photo Gallery**: Advanced filtering by camera, year, tags, with improved mobile experience
2. **Blog Improvements**: Reading progress tracking, related posts, table of contents generation
3. **SEO Optimization**: Comprehensive meta tags, structured data, and social media integration
4. **Analytics Integration**: User behavior tracking and performance monitoring
5. **Mobile-First Design**: Responsive layouts optimized for all device sizes