let allImages = [];
let albums = {};
let currentAlbum = null;
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    const albumsContainer = document.getElementById('albums-container');
    const gallery = document.getElementById('gallery');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const metadataContainer = document.getElementById('metadata-container');
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    const albumPopup = document.getElementById('album-popup');
    const albumTitle = document.getElementById('album-title');
    const albumDescription = document.getElementById('album-description');
    const albumGallery = document.getElementById('album-gallery');

    function createAlbumElement(albumName, images) {
        const album = document.createElement('div');
        album.classList.add('album');
        album.innerHTML = `
            <h2>${albumName}</h2>
            <div class="album-preview"></div>
            <p>${images.length} photos</p>
        `;
        album.addEventListener('click', () => openAlbumPopup(albumName));

        // Add preview images
        const previewContainer = album.querySelector('.album-preview');
        images.slice(0, 4).forEach(image => {
            const img = document.createElement('img');
            img.src = image.preview;
            img.alt = image.title;
            previewContainer.appendChild(img);
        });

        return album;
    }

    function openAlbumPopup(albumName) {
        currentAlbum = albumName;
        albumTitle.textContent = albumName;
        albumDescription.textContent = albums[albumName].description;
        albumGallery.innerHTML = '';
    
        // Sort images by date taken
        albums[albumName].images.sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken));
    
        albums[albumName].images.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.preview;
            img.alt = image.title;
            img.addEventListener('click', () => openModal(index));
            albumGallery.appendChild(img);
        });
    
        albumPopup.style.display = 'block';
    }

    function loadAlbums() {
        albumsContainer.innerHTML = '';
        
        // Sort albums based on the latest photo date
        const sortedAlbums = Object.entries(albums).sort((a, b) => {
            const latestDateA = Math.max(...a[1].images.map(img => new Date(img.dateTaken).getTime()));
            const latestDateB = Math.max(...b[1].images.map(img => new Date(img.dateTaken).getTime()));
            return latestDateB - latestDateA;
        });
    
        sortedAlbums.forEach(([albumName, albumData]) => {
            // Sort images within the album
            albumData.images.sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken));
            
            const albumElement = createAlbumElement(albumName, albumData.images);
            albumsContainer.appendChild(albumElement);
        });
    }

    function openModal(index) {
        currentIndex = index;
        updateModalContent();
        modal.style.display = "block";
    }

    function updateModalContent() {
      const image = albums[currentAlbum].images[currentIndex];
      modalImg.src = image.fullImage;
      
      // Clean up the date string
      const cleanedDate = image.dateTaken.replace(/:/g, '-').split('T')[0];
      
      metadataContainer.innerHTML = `
          <p><strong>Title:</strong> ${image.title}</p>
          <p><strong>Device:</strong> ${truncateDeviceModel(image.deviceModel)}</p>
          <p><strong>F-Number:</strong> ${image.fNumber}</p>
          <p><strong>Exposure Time:</strong> ${image.exposureTime}</p>
          <p><strong>Date Taken:</strong> ${cleanedDate}</p>
      `;
  }
  function truncateDeviceModel(deviceModel) {
    const parts = deviceModel.split(' ');
    return parts.length > 3 ? parts.slice(0, 3).join(' ') : deviceModel;
}

    function showPreviousImage() {
        if (currentIndex > 0) {
            currentIndex--;
            updateModalContent();
        }
    }

    function showNextImage() {
        if (currentIndex < albums[currentAlbum].images.length - 1) {
            currentIndex++;
            updateModalContent();
        }
    }

    // Event Listeners
    prevButton.addEventListener('click', showPreviousImage);
    nextButton.addEventListener('click', showNextImage);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    albumPopup.addEventListener('click', (e) => {
        if (e.target === albumPopup) {
            albumPopup.style.display = "none";
        }
    });

    document.querySelector('.close').addEventListener('click', () => {
        modal.style.display = "none";
    });

    document.querySelector('.close-popup').addEventListener('click', () => {
        albumPopup.style.display = "none";
    });

    document.addEventListener('keydown', (e) => {
        if (modal.style.display === "block") {
            if (e.key === "ArrowLeft") showPreviousImage();
            if (e.key === "ArrowRight") showNextImage();
            if (e.key === "Escape") modal.style.display = "none";
        }
        if (albumPopup.style.display === "block" && e.key === "Escape") {
            albumPopup.style.display = "none";
        }
    });

    // Fetch and process images
    fetch('images.json')
        .then(response => response.json())
        .then(images => {
            allImages = images;
            // Group images by tags
            images.forEach(image => {
                image.tags.forEach(tag => {
                    if (!albums[tag]) {
                        albums[tag] = {
                            images: [],
                            description: `This is the ${tag} album.`
                        };
                    }
                    albums[tag].images.push(image);
                });
            });
            loadAlbums();
        })
        .catch(error => console.error('Error loading images:', error));
});
