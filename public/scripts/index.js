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
        const captionText = document.getElementById('caption');
        currentIndex = index;

        modal.style.display = "block";
        modalImg.src = imagesArray[index].fullImage;
        captionText.innerHTML = stripFilename(imagesArray[index].fullImage);

        // Preload next few images
        preloadImages(index + 1, 3);

        // ... rest of the openModal function ...
    }

    function showImage(index) {
        if (index >= imagesArray.length) {
            currentIndex = 0;
        } else if (index < 0) {
            currentIndex = imagesArray.length - 1;
        } else {
            currentIndex = index;
        }
        const modalImg = document.getElementById('modal-img');
        const captionText = document.getElementById('caption');
        modalImg.src = imagesArray[currentIndex].fullImage;
        captionText.innerHTML = stripFilename(imagesArray[currentIndex].fullImage);

        // Preload next few images
        preloadImages(currentIndex + 1, 3);
    }

    // ... rest of the code remains the same ...
});