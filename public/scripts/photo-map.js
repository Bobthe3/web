// Interactive Photo Map
// Displays photos on a world map using GPS coordinates from EXIF data

class PhotoMap {
    constructor() {
        this.map = null;
        this.photos = [];
        this.markers = [];
        this.markerGroup = null;
        this.currentFilter = 'all';
        
        // Predefined locations for photos without GPS
        this.locationMappings = {
            'Amsterdam Canal': [52.3676, 4.9041],
            'Barcelona, Spain': [41.3851, 2.1734],
            'Big Ben': [51.4994, -0.1245],
            'Piccadilly Circus': [51.5100, -0.1347],
            'Hyde Park Sunset': [51.5074, -0.1278],
            'Palau Nacional': [41.3683, 2.1537],
            'Death Valley': [36.5054, -117.0794],
            'Lassen National Park': [40.4977, -121.4207],
            'Golden Gate Bridge (Foggy)': [37.8199, -122.4783],
            'Black n White Bridge': [37.8199, -122.4783] // Golden Gate Bridge
        };
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadPhotos();
            this.initMap();
            this.addPhotosToMap();
            this.setupControls();
            this.updateStats();
            this.trackMapUsage();
        } catch (error) {
            console.error('Error initializing photo map:', error);
        }
    }
    
    async loadPhotos() {
        try {
            const response = await fetch('images.json');
            const data = await response.json();
            
            // Process photos and add coordinates
            this.photos = data.map(photo => {
                let coordinates = null;
                
                // Try to extract GPS from EXIF data
                if (photo.gpsLatitude && photo.gpsLongitude) {
                    coordinates = [photo.gpsLatitude, photo.gpsLongitude];
                } else if (this.locationMappings[photo.title]) {
                    coordinates = this.locationMappings[photo.title];
                }
                
                // Determine location category
                let category = 'other';
                if (photo.tags && photo.tags.includes('Europe')) {
                    category = 'europe';
                } else if (photo.tags && photo.tags.includes('National Parks')) {
                    category = 'nationalparks';
                } else if (photo.tags && photo.tags.includes('SF')) {
                    category = 'usa';
                }
                
                return {
                    ...photo,
                    coordinates,
                    category,
                    hasLocation: coordinates !== null
                };
            }).filter(photo => photo.hasLocation);
            
            console.log(`Loaded ${this.photos.length} photos with location data`);
        } catch (error) {
            console.error('Error loading photos:', error);
            this.photos = [];
        }
    }
    
    initMap() {
        // Initialize the map
        this.map = L.map('photo-map').setView([40.0, 0.0], 2);
        
        // Add tile layer with dark theme to match site
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);
        
        // Create marker group
        this.markerGroup = L.featureGroup().addTo(this.map);
        
        // Custom marker icons
        this.createCustomIcons();
    }
    
    createCustomIcons() {
        this.icons = {
            europe: L.divIcon({
                className: 'custom-marker europe-marker',
                html: '<i class="fas fa-camera" style="color: #88c0d0; font-size: 16px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            usa: L.divIcon({
                className: 'custom-marker usa-marker',
                html: '<i class="fas fa-camera" style="color: #bf616a; font-size: 16px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            nationalparks: L.divIcon({
                className: 'custom-marker parks-marker',
                html: '<i class="fas fa-mountain" style="color: #a3be8c; font-size: 16px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            other: L.divIcon({
                className: 'custom-marker other-marker',
                html: '<i class="fas fa-camera" style="color: #d08770; font-size: 16px;"></i>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        };
        
        // Add CSS for custom markers
        const style = document.createElement('style');
        style.textContent = `
            .custom-marker {
                background: rgba(46, 52, 64, 0.9);
                border: 2px solid #88c0d0;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            }
            .custom-marker:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            }
            .leaflet-popup-content-wrapper {
                background: rgba(59, 66, 82, 0.95);
                color: #d8dee9;
                border-radius: 12px;
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
            }
            .leaflet-popup-tip {
                background: rgba(59, 66, 82, 0.95);
            }
        `;
        document.head.appendChild(style);
    }
    
    addPhotosToMap() {
        this.markers = [];
        
        this.photos.forEach(photo => {
            if (!photo.coordinates) return;
            
            const [lat, lng] = photo.coordinates;
            const icon = this.icons[photo.category] || this.icons.other;
            
            const marker = L.marker([lat, lng], { icon })
                .bindPopup(this.createPopupContent(photo), {
                    maxWidth: 250,
                    className: 'photo-popup-container'
                });
            
            marker.photoData = photo;
            marker.on('click', () => this.onMarkerClick(photo));
            
            this.markers.push(marker);
            this.markerGroup.addLayer(marker);
        });
        
        // Fit map to show all markers
        if (this.markers.length > 0) {
            this.map.fitBounds(this.markerGroup.getBounds(), { padding: [20, 20] });
        }
    }
    
    createPopupContent(photo) {
        const year = this.getYearFromDate(photo.dateTaken);
        return `
            <div class="photo-popup">
                <img src="${photo.preview}" alt="${photo.title}" onclick="window.open('gallery.html', '_blank')">
                <h4>${photo.title}</h4>
                <p><i class="fas fa-calendar"></i> ${year || 'Unknown'}</p>
                <p><i class="fas fa-camera"></i> ${photo.deviceModel || 'Unknown camera'}</p>
                <p><i class="fas fa-tags"></i> ${photo.tags ? photo.tags.join(', ') : 'No tags'}</p>
                <a href="gallery.html" class="view-full">View in Gallery</a>
            </div>
        `;
    }
    
    setupControls() {
        const showAllBtn = document.getElementById('showAllBtn');
        const europeBtn = document.getElementById('europeBtn');
        const usaBtn = document.getElementById('usaBtn');
        const nationalParksBtn = document.getElementById('nationalParksBtn');
        
        showAllBtn.addEventListener('click', () => this.filterPhotos('all'));
        europeBtn.addEventListener('click', () => this.filterPhotos('europe'));
        usaBtn.addEventListener('click', () => this.filterPhotos('usa'));
        nationalParksBtn.addEventListener('click', () => this.filterPhotos('nationalparks'));
    }
    
    filterPhotos(category) {
        this.currentFilter = category;
        
        // Update button states
        document.querySelectorAll('.map-control-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        let activeBtn;
        switch(category) {
            case 'all':
                activeBtn = document.getElementById('showAllBtn');
                break;
            case 'europe':
                activeBtn = document.getElementById('europeBtn');
                break;
            case 'usa':
                activeBtn = document.getElementById('usaBtn');
                break;
            case 'nationalparks':
                activeBtn = document.getElementById('nationalParksBtn');
                break;
        }
        if (activeBtn) activeBtn.classList.add('active');
        
        // Filter markers
        this.markerGroup.clearLayers();
        
        const filteredMarkers = this.markers.filter(marker => {
            if (category === 'all') return true;
            return marker.photoData.category === category;
        });
        
        filteredMarkers.forEach(marker => {
            this.markerGroup.addLayer(marker);
        });
        
        // Fit map to filtered markers
        if (filteredMarkers.length > 0) {
            this.map.fitBounds(this.markerGroup.getBounds(), { padding: [20, 20] });
        }
        
        // Update stats
        this.updateStats();
        
        // Track filter usage
        if (typeof trackEvent !== 'undefined') {
            trackEvent('map_filter', 'PhotoMap', category, filteredMarkers.length);
        }
    }
    
    updateStats() {
        const totalPhotos = this.photos.length;
        const countries = new Set();
        const cameras = new Set();
        
        this.photos.forEach(photo => {
            if (photo.tags) {
                if (photo.tags.includes('Europe')) {
                    if (photo.title.includes('Amsterdam')) countries.add('Netherlands');
                    if (photo.title.includes('Barcelona')) countries.add('Spain');
                    if (photo.title.includes('Big Ben') || photo.title.includes('Hyde Park') || photo.title.includes('Piccadilly')) countries.add('United Kingdom');
                }
                if (photo.tags.includes('SF') || photo.tags.includes('National Parks')) {
                    countries.add('United States');
                }
            }
            if (photo.deviceModel) {
                cameras.add(photo.deviceModel);
            }
        });
        
        const statsContainer = document.getElementById('mapStats');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${totalPhotos}</div>
                <div class="stat-label">Photos with Locations</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${countries.size}</div>
                <div class="stat-label">Countries Visited</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${cameras.size}</div>
                <div class="stat-label">Cameras Used</div>
            </div>
        `;
    }
    
    onMarkerClick(photo) {
        // Track photo view from map
        if (typeof trackPhotoView !== 'undefined') {
            trackPhotoView(photo.title, 'PhotoMap');
        }
    }
    
    getYearFromDate(dateObj) {
        if (!dateObj) return null;
        if (typeof dateObj === 'string') {
            return new Date(dateObj).getFullYear();
        }
        if (dateObj.year) return dateObj.year;
        if (dateObj._ctor === 'ExifDateTime') return dateObj.year;
        return null;
    }
    
    trackMapUsage() {
        // Track map initialization
        if (typeof trackEvent !== 'undefined') {
            trackEvent('map_loaded', 'PhotoMap', 'photos_loaded', this.photos.length);
        }
        
        // Track map interactions
        this.map.on('zoomend', () => {
            if (typeof trackEvent !== 'undefined') {
                trackEvent('map_zoom', 'PhotoMap', 'zoom_level', this.map.getZoom());
            }
        });
        
        this.map.on('moveend', () => {
            if (typeof trackEvent !== 'undefined') {
                trackEvent('map_move', 'PhotoMap', 'map_moved');
            }
        });
    }
}

// Initialize photo map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PhotoMap();
});