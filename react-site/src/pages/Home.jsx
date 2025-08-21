import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>Devan Velji - Young Professional | Photography & Fitness</title>
        <meta name="description" content="Devan Velji - Young Professional, photographer, fitness enthusiast, and blogger. Explore my photography gallery, fitness journey, and thoughts on technology and life." />
        <meta name="keywords" content="Devan Velji, photography, fitness, triathlon, blog, travel, technology, professional" />
        <meta name="author" content="Devan Velji" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://devanvelji.com/" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devanvelji.com/" />
        <meta property="og:title" content="Devan Velji - Young Professional" />
        <meta property="og:description" content="Young Professional, photographer, fitness enthusiast, and blogger. Explore my photography gallery, fitness journey, and thoughts on technology and life." />
        <meta property="og:image" content="https://devanvelji.com/images/og-image.jpg" />
        <meta property="og:site_name" content="Devan Velji" />
        <meta property="og:locale" content="en_US" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://devanvelji.com/" />
        <meta property="twitter:title" content="Devan Velji - Young Professional" />
        <meta property="twitter:description" content="Young Professional, photographer, fitness enthusiast, and blogger. Explore my photography gallery, fitness journey, and thoughts on technology and life." />
        <meta property="twitter:image" content="https://devanvelji.com/images/og-image.jpg" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Devan Velji",
            "url": "https://devanvelji.com",
            "image": "https://devanvelji.com/images/profile.jpg",
            "jobTitle": "Young Professional",
            "description": "Young Professional, photographer, fitness enthusiast, and blogger",
            "sameAs": [
              "https://www.instagram.com/devanvelji/",
              "https://www.linkedin.com/in/devanvelji/",
              "https://www.strava.com/athletes/51124943",
              "https://open.spotify.com/user/31u2yupp67v34q2yhdr7ieeaylry",
              "https://pin.it/4UOpbSSCO"
            ],
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://devanvelji.com"
            },
            "worksFor": {
              "@type": "Organization",
              "name": "Professional Services"
            },
            "knowsAbout": ["Photography", "Fitness", "Technology", "Travel", "Triathlon"],
            "email": "devanvelji@gmail.com"
          })}
        </script>
      </Helmet>
      
      <div className="container">
        <div className="card frosted-glass">
          <nav className="main-nav">
            <Link to="/gallery" className="nav-link">Gallery</Link>
            <Link to="/map" className="nav-link">Map</Link>
            <Link to="/fitness" className="nav-link">Fitness</Link>
            <Link to="/blog" className="nav-link">Blog</Link>
            <Link to="/resume" className="nav-link">Resume</Link>
          </nav>
          <div className="social-links">
            <a href="https://www.instagram.com/devanvelji/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.linkedin.com/in/devanvelji/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="mailto:devanvelji@gmail.com" aria-label="Email">
              <i className="fas fa-envelope"></i>
            </a>
            <a href="https://open.spotify.com/user/31u2yupp67v34q2yhdr7ieeaylry?si=3c57f080a4f04cb1" target="_blank" rel="noopener noreferrer" aria-label="Spotify">
              <i className="fab fa-spotify"></i>
            </a>
            <a href="https://www.strava.com/athletes/51124943" target="_blank" rel="noopener noreferrer" aria-label="Strava">
              <i className="fab fa-strava"></i>
            </a>
            <a href="https://pin.it/4UOpbSSCO" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
              <i className="fab fa-pinterest"></i>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;