// In index.js
let currentPage = 1;
const imagesPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    let imagesArray = [];
    let currentIndex = 0;

    function preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function preloadImages(startIndex, count) {
        const endIndex = Math.min(startIndex + count, imagesArray.length);
        for (let i = startIndex; i < endIndex; i++) {
            preloadImage(imagesArray[i].fullImage);
        }
    }

    fetch('images.json')
    .then(response => response.json())
    .then(images => {
        imagesArray = images;
        const gallery = document.getElementById('gallery');
        images.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.preview;
            img.alt = `Photo ${index + 1}`;
            gallery.appendChild(img);

            img.addEventListener('click', function() {
                openModal(index);
            });
        });

        // Preload the first few images
        preloadImages(0, 5);
    })
    .catch(error => console.error('Error loading images:', error));

function openModal(index) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const metadataContainer = document.getElementById('metadata-container');
    currentIndex = index;

    modal.style.display = "block";
    modalImg.src = imagesArray[index].fullImage;
    
    // Update metadata
    metadataContainer.innerHTML = `
        <p><strong>Title:</strong> ${imagesArray[index].title}</p>
        <p><strong>Device:</strong> ${imagesArray[index].deviceModel}</p>
        <p><strong>F-Number:</strong> ${imagesArray[index].fNumber}</p>
        <p><strong>Exposure Time:</strong> ${imagesArray[index].exposureTime}</p>
    `;

    // Preload next few images
    preloadImages(index + 1, 3);
    }
    let touchStartX = 0;
    let touchEndX = 0;

    document.getElementById('modal').addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.getElementById('modal').addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        if (touchEndX < touchStartX) {
            showImage(currentIndex + 1); // Swipe left, next image
        }
        if (touchEndX > touchStartX) {
            showImage(currentIndex - 1); // Swipe right, previous image
        }
    }

    // ... rest of the code remains the same ...
});

// In index.js
function createImageElement(image, index) {
    const img = document.createElement('img');
    img.dataset.src = image.preview; // Store the src in a data attribute
    img.alt = `Photo ${index + 1}`;
    img.classList.add('lazy');
    return img;
  }
  
  // Implement Intersection Observer for lazy loading
  const lazyLoadImages = () => {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
  
    document.querySelectorAll('img.lazy').forEach(img => observer.observe(img));
  };

// Call this function after populating the gallery
lazyLoadImages();




function loadMoreImages() {
  const start = (currentPage - 1) * imagesPerPage;
  const end = start + imagesPerPage;
  const imagesToLoad = imagesArray.slice(start, end);

  imagesToLoad.forEach((image, index) => {
    const img = createImageElement(image, start + index);
    gallery.appendChild(img);
  });

  currentPage++;
  lazyLoadImages(); // Rerun lazy loading for new images
}

// Implement infinite scroll
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    loadMoreImages();
  }
});