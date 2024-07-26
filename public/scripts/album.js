// albums.js
let allImages = [];
let albums = {};
let currentAlbum = null;
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    const albumsContainer = document.getElementById('albums-container');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const metadataContainer = document.getElementById('metadata-container');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    function createAlbumElement(albumName, images) {
        const album = document.createElement('div');
        album.classList.add('album');
        album.innerHTML = `
            <h2>${albumName}</h2>
            <div class="album-preview"></div>
            <p>${images.length} photos</p>
        `;
        album.addEventListener('click', () => openAlbum(albumName));

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

    function openAlbum(albumName) {
        currentAlbum = albumName;
        albumsContainer.innerHTML = '';

        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Albums';
        backButton.addEventListener('click', loadAlbums);
        albumsContainer.appendChild(backButton);

        const albumTitle = document.createElement('h2');
        albumTitle.textContent = albumName;
        albumsContainer.appendChild(albumTitle);

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
        albums[albumName].forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.preview;
            img.alt = image.title;
            img.addEventListener('click', () => openModal(index));
            imageContainer.appendChild(img);
        });
        albumsContainer.appendChild(imageContainer);
    }

    function loadAlbums() {
        albumsContainer.innerHTML = '';
        Object.keys(albums).forEach(albumName => {
            const albumElement = createAlbumElement(albumName, albums[albumName]);
            albumsContainer.appendChild(albumElement);
        });
    }

    function openModal(index) {
        currentIndex = index;
        updateModalContent();
        modal.style.display = "block";
    }

    function updateModalContent() {
        const image = albums[currentAlbum][currentIndex];
        modalImg.src = image.fullImage;
        metadataContainer.innerHTML = `
            <p><strong>Title:</strong> ${image.title}</p>
            <p><strong>Device:</strong> ${image.deviceModel}</p>
            <p><strong>F-Number:</strong> ${image.fNumber}</p>
            <p><strong>Exposure Time:</strong> ${image.exposureTime}</p>
        `;
        prevButton.style.display = currentIndex > 0 ? "block" : "none";
        nextButton.style.display = currentIndex < albums[currentAlbum].length - 1 ? "block" : "none";
    }

    function showPreviousImage() {
        if (currentIndex > 0) {
            currentIndex--;
            updateModalContent();
        }
    }

    function showNextImage() {
        if (currentIndex < albums[currentAlbum].length - 1) {
            currentIndex++;
            updateModalContent();
        }
    }

    // Event Listeners
    prevButton.addEventListener('click', showPreviousImage);
    nextButton.addEventListener('click', showNextImage);

    document.addEventListener('keydown', (e) => {
        if (modal.style.display === "block") {
            if (e.key === "ArrowLeft") showPreviousImage();
            if (e.key === "ArrowRight") showNextImage();
            if (e.key === "Escape") modal.style.display = "none";
        }
    });

    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
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
                        albums[tag] = [];
                    }
                    albums[tag].push(image);
                });
            });
            loadAlbums();
        })
        .catch(error => console.error('Error loading images:', error));
});