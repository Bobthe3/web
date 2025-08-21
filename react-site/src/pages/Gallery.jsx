import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tag: '',
    camera: '',
    year: '',
    search: '',
    sort: 'date-desc'
  });
  const [modalData, setModalData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    tags: [],
    cameras: [],
    years: []
  });

  useEffect(() => {
    fetch('/images.json')
      .then(res => res.json())
      .then(data => {
        setImages(data);
        setFilteredImages(data);
        generateFilterOptions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading images:', err);
        setLoading(false);
      });
  }, []);

  const generateFilterOptions = (imageData) => {
    const tags = new Set();
    const cameras = new Set();
    const years = new Set();
    
    imageData.forEach(img => {
      if (img.tags) {
        img.tags.forEach(tag => tags.add(tag));
      }
      if (img.deviceModel) {
        cameras.add(img.deviceModel);
      }
      if (img.dateTaken) {
        const year = getYearFromDate(img.dateTaken);
        if (year) years.add(year);
      }
    });
    
    setFilterOptions({
      tags: [...tags].sort(),
      cameras: [...cameras].sort(),
      years: [...years].sort((a, b) => b - a)
    });
  };

  const getYearFromDate = (dateObj) => {
    if (!dateObj) return null;
    if (typeof dateObj === 'string') {
      return new Date(dateObj).getFullYear();
    }
    if (dateObj.year) return dateObj.year;
    if (dateObj._ctor === 'ExifDateTime') return dateObj.year;
    return null;
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown';
    try {
      if (typeof dateObj === 'string') {
        return new Date(dateObj).toLocaleDateString();
      }
      if (dateObj.year && dateObj.month && dateObj.day) {
        return new Date(dateObj.year, dateObj.month - 1, dateObj.day).toLocaleDateString();
      }
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const applyFilters = () => {
    let filtered = images.filter(img => {
      const matchesTag = !filters.tag || (img.tags && img.tags.includes(filters.tag));
      const matchesCamera = !filters.camera || img.deviceModel === filters.camera;
      const matchesYear = !filters.year || getYearFromDate(img.dateTaken) == filters.year;
      const matchesSearch = !filters.search || 
        img.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (img.tags && img.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))) ||
        (img.deviceModel && img.deviceModel.toLowerCase().includes(filters.search.toLowerCase()));
      
      return matchesTag && matchesCamera && matchesYear && matchesSearch;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'date-asc':
          return new Date(a.dateTaken) - new Date(b.dateTaken);
        case 'date-desc':
          return new Date(b.dateTaken) - new Date(a.dateTaken);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'camera':
          return (a.deviceModel || '').localeCompare(b.deviceModel || '');
        default:
          return 0;
      }
    });

    setFilteredImages(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, images]);

  const clearFilters = () => {
    setFilters({
      tag: '',
      camera: '',
      year: '',
      search: '',
      sort: 'date-desc'
    });
  };

  const openModal = (index) => {
    setModalData({ image: filteredImages[index], index });
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalData(null);
    document.body.style.overflow = '';
  };

  const navigateModal = (direction) => {
    if (!modalData) return;
    const newIndex = direction === 'next' 
      ? (modalData.index + 1) % filteredImages.length
      : (modalData.index - 1 + filteredImages.length) % filteredImages.length;
    setModalData({ image: filteredImages[newIndex], index: newIndex });
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>Loading gallery...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Photo Gallery - Travel & Urban Photography | Devan Velji</title>
        <meta name="description" content="Photo gallery featuring travel photography from Europe, National Parks, and urban landscapes by Devan Velji. Browse photos by location, camera, and date with detailed EXIF information." />
        <meta name="keywords" content="photography, travel photos, Europe, National Parks, urban landscapes, EXIF data, camera settings, Devan Velji" />
        <link rel="canonical" href="https://devanvelji.com/gallery" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://devanvelji.com/gallery" />
        <meta property="og:title" content="Photo Gallery - Devan Velji" />
        <meta property="og:description" content="Travel photography from Europe, National Parks, and urban landscapes with detailed camera settings and EXIF information." />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            "name": "Photo Gallery - Devan Velji",
            "description": "Travel photography collection featuring Europe, National Parks, and urban landscapes",
            "url": "https://devanvelji.com/gallery",
            "author": {
              "@type": "Person",
              "name": "Devan Velji",
              "url": "https://devanvelji.com"
            },
            "keywords": ["photography", "travel", "Europe", "National Parks", "urban landscapes"]
          })}
        </script>
      </Helmet>

      <div className="gallery-page">
        <div className="filter-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search photos by title, tag, or camera..." 
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
          <div className="sort-container">
            <span className="sort-label">Sort by:</span>
            <select 
              className="filter-select" 
              value={filters.sort}
              onChange={(e) => setFilters({...filters, sort: e.target.value})}
            >
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="camera">Camera</option>
            </select>
          </div>
          <select 
            className="filter-select" 
            value={filters.tag}
            onChange={(e) => setFilters({...filters, tag: e.target.value})}
          >
            <option value="">All Tags</option>
            {filterOptions.tags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <select 
            className="filter-select" 
            value={filters.camera}
            onChange={(e) => setFilters({...filters, camera: e.target.value})}
          >
            <option value="">All Cameras</option>
            {filterOptions.cameras.map(camera => (
              <option key={camera} value={camera}>{camera}</option>
            ))}
          </select>
          <select 
            className="filter-select" 
            value={filters.year}
            onChange={(e) => setFilters({...filters, year: e.target.value})}
          >
            <option value="">All Years</option>
            {filterOptions.years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button className="filter-button" onClick={clearFilters}>
            Clear All
          </button>
        </div>

        <div className="gallery-stats">
          Showing {filteredImages.length} of {images.length} photos
        </div>

        {filteredImages.length === 0 ? (
          <div className="no-results">
            No photos match your search criteria. Try adjusting your filters.
          </div>
        ) : (
          <div className="gallery-container loaded">
            {filteredImages.map((img, idx) => (
              <div 
                key={img.title + idx} 
                className="gallery-item" 
                onClick={() => openModal(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openModal(idx);
                }}
                tabIndex={0}
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                <img 
                  src={img.preview} 
                  alt={img.title} 
                  className="gallery-image" 
                  loading="lazy" 
                />
                <div className="image-info">
                  <div className="image-title">{img.title}</div>
                  <div className="image-meta">
                    {img.deviceModel && `📷 ${img.deviceModel}`}
                    {img.dateTaken && ` • ${formatDate(img.dateTaken)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalData && (
          <div className="modal show" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="close" onClick={closeModal}>&times;</span>
              <img 
                src={modalData.image.fullImage} 
                alt={modalData.image.title} 
              />
              <div className="modal-title">{modalData.image.title}</div>
              <div className="modal-meta">
                <div><b>Camera:</b> {modalData.image.deviceModel || 'Unknown'}</div>
                <div><b>f-number:</b> {modalData.image.fNumber || 'Unknown'}</div>
                <div><b>Exposure:</b> {modalData.image.exposureTime || 'Unknown'}</div>
                <div><b>Date:</b> {formatDate(modalData.image.dateTaken)}</div>
                <div><b>Tags:</b> {(modalData.image.tags || []).join(', ')}</div>
              </div>
            </div>
          </div>
        )}

        <div className="back-link">
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </>
  );
};

export default Gallery;