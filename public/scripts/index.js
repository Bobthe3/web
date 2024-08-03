document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");
    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
        if (lastScrollY < window.scrollY) {
            navbar.classList.add("navbar-hidden");
        } else {
            navbar.classList.remove("navbar-hidden");
        }
        lastScrollY = window.scrollY;
    });

    // Function to fetch and display photos
    function displayPhotos() {
        fetch("photos.json") // Assuming your photo metadata is stored in photos.json
            .then(response => response.json())
            .then(data => {
                const albumsContainer = document.getElementById("albums-container");
                albumsContainer.innerHTML = ""; // Clear previous content

                data.albums.forEach(album => {
                    const albumElement = document.createElement("div");
                    albumElement.classList.add("album");
                    albumElement.innerHTML = `
                        <div class="album-preview">
                            ${album.photos.map(photo => `<img src="${photo.thumbnail}" alt="${photo.title}">`).join("")}
                        </div>
                        <h2>${album.title}</h2>
                        <p>${album.description}</p>
                    `;
                    albumsContainer.appendChild(albumElement);

                    albumElement.addEventListener("click", () => openAlbum(album));
                });
            })
            .catch(error => console.error("Error loading photos:", error));
    }

    // Function to open an album
    function openAlbum(album) {
        const albumPopup = document.getElementById("album-popup");
        document.getElementById("album-title").textContent = album.title;
        document.getElementById("album-description").textContent = album.description;
        
        const albumGallery = document.getElementById("album-gallery");
        albumGallery.innerHTML = album.photos.map(photo => `
            <img src="${photo.url}" alt="${photo.title}" data-title="${photo.title}" data-date="${photo.date}">
        `).join("");
        
        albumPopup.style.display = "block";
    }

    // Function to close the album popup
    document.querySelector(".close-popup").addEventListener("click", () => {
        document.getElementById("album-popup").style.display = "none";
    });

    // Function to open the modal
    document.getElementById("album-gallery").addEventListener("click", event => {
        if (event.target.tagName === "IMG") {
            const modal = document.getElementById("modal");
            const modalImg = document.getElementById("modal-img");
            const modalTitle = document.getElementById("modal-title");
            const metadataContainer = document.getElementById("metadata-container");
            
            modalImg.src = event.target.src;
            modalTitle.textContent = event.target.dataset.title;
            metadataContainer.textContent = `Date: ${event.target.dataset.date}`;
            
            modal.style.display = "block";
        }
    });

    // Function to close the modal
    document.querySelector(".close").addEventListener("click", () => {
        document.getElementById("modal").style.display = "none";
    });

    // Navigation buttons for modal
    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");
    const images = document.querySelectorAll("#album-gallery img");
    let currentIndex;

    images.forEach((img, index) => {
        img.addEventListener("click", () => {
            currentIndex = index;
        });
    });

    function showImage(index) {
        const modalImg = document.getElementById("modal-img");
        const modalTitle = document.getElementById("modal-title");
        const metadataContainer = document.getElementById("metadata-container");
        
        const img = images[index];
        modalImg.src = img.src;
        modalTitle.textContent = img.dataset.title;
        metadataContainer.textContent = `Date: ${img.dataset.date}`;
    }

    prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            showImage(currentIndex);
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentIndex < images.length - 1) {
            currentIndex++;
            showImage(currentIndex);
        }
    });

    // Close modal when clicking outside the image
    document.getElementById("modal").addEventListener("click", event => {
        if (event.target === event.currentTarget) {
            document.getElementById("modal").style.display = "none";
        }
    });

    displayPhotos();
});
