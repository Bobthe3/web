document.addEventListener('DOMContentLoaded', function() {
    let imagesArray = [];
    let currentIndex = 0;

    fetch('images.json')
        .then(response => response.json())
        .then(images => {
            imagesArray = images;
            const gallery = document.getElementById('gallery');
            images.forEach((image, index) => {
                const img = document.createElement('img');
                img.src = image;
                img.alt = `Photo ${index + 1}`;
                gallery.appendChild(img);

                img.addEventListener('click', function() {
                    openModal(index);
                });
            });
        })
        .catch(error => console.error('Error loading images:', error));

    function openModal(index) {
        const modal = document.getElementById('modal');
        const modalImg = document.getElementById('modal-img');
        const captionText = document.getElementById('caption');
        currentIndex = index;

        modal.style.display = "block";
        modalImg.src = imagesArray[index];
        captionText.innerHTML = stripFilename(imagesArray[index]);

        const closeBtn = document.getElementsByClassName('close')[0];
        closeBtn.onclick = function() { 
            modal.style.display = "none";
        }

        const prevBtn = document.getElementsByClassName('prev')[0];
        const nextBtn = document.getElementsByClassName('next')[0];
        prevBtn.onclick = function() {
            showImage(currentIndex - 1);
        }
        nextBtn.onclick = function() {
            showImage(currentIndex + 1);
        }

        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });

        document.addEventListener('keydown', function(event) {
            if (modal.style.display === "block") {
                if (event.key === 'ArrowLeft') {
                    showImage(currentIndex - 1);
                } else if (event.key === 'ArrowRight') {
                    showImage(currentIndex + 1);
                } else if (event.key === 'Escape') {
                    modal.style.display = "none";
                }
            }
        });
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
        modalImg.src = imagesArray[currentIndex];
        captionText.innerHTML = stripFilename(imagesArray[currentIndex]);
    }

    function stripFilename(filepath) {
        const filename = filepath.split('/').pop();
        return filename.replace(/\.[^/.]+$/, "");
    }
});