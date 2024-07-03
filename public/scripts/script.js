// Function to update current year in footer
function updateYear() {
    const yearSpan = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = currentYear;
}

// Update year on page load
updateYear();

// Modal functionality
const modal = document.querySelector('.modal');
const gallery = document.querySelector('.gallery');
const images = document.querySelectorAll('.gallery img');
const modalImg = document.querySelector('.modal img');
const modalTitle = document.querySelector('.modal .title');
const modalDate = document.querySelector('.modal .date');
const closeBtn = document.querySelector('.close');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

let currentImageIndex = 0;

// Function to open modal with clicked image
function openModal(index) {
    modalImg.src = images[index].src;
    modalTitle.textContent = images[index].getAttribute('data-title');
    modalDate.textContent = images[index].getAttribute('data-date');
    modal.style.display = 'flex';
    currentImageIndex = index;
}

// Event listeners for opening modal
images.forEach((image, index) => {
    image.addEventListener('click', () => openModal(index));
});

// Event listener for closing modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal when clicking outside the image
modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Event listeners for navigation arrows
prevBtn.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    openModal(currentImageIndex);
});

nextBtn.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    openModal(currentImageIndex);
});

// Swipe functionality for mobile devices
let touchstartX = 0;
let touchendX = 0;

gallery.addEventListener('touchstart', function(event) {
    touchstartX = event.changedTouches[0].screenX;
}, false);

gallery.addEventListener('touchend', function(event) {
    touchendX = event.changedTouches[0].screenX;
    handleGesture();
}, false);

function handleGesture() {
    if (touchendX < touchstartX) {
        // Swiped left
        currentImageIndex = (currentImageIndex + 1) % images.length;
        openModal(currentImageIndex);
    }

    if (touchendX > touchstartX) {
        // Swiped right
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        openModal(currentImageIndex);
    }
}
let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        // Scroll down
        navbar.style.top = '-100px';
    } else {
        // Scroll up
        navbar.style.top = '0';
    }
    lastScrollTop = scrollTop;
});

document.addEventListener('DOMContentLoaded', () => {
    fetch('/images')
        .then(response => response.json())
        .then(images => {
            const gallery = document.querySelector('.gallery');

            images.forEach((image, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = image.src;
                imgElement.setAttribute('data-title', image.title);
                imgElement.setAttribute('data-date', image.date);
                imgElement.setAttribute('data-index', index);
                gallery.appendChild(imgElement);
            });

            // Now that images are loaded, add event listeners
            setupModal(images);
        });

    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop) {
            // Scroll down
            navbar.style.top = '-100px';
        } else {
            // Scroll up
            navbar.style.top = '0';
        }
        lastScrollTop = scrollTop;
    });

    // Smooth animation for navbar
    navbar.style.transition = 'top 0.3s';
});

function setupModal(images) {
    const modal = document.querySelector('.modal');
    const modalImg = document.querySelector('.modal img');
    const modalTitle = document.querySelector('.modal .title');
    const modalDate = document.querySelector('.modal .date');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    let currentImageIndex = 0;

    function openModal(index) {
        modalImg.src = images[index].src;
        modalTitle.textContent = images[index].title;
        modalDate.textContent = images[index].date;
        modal.style.display = 'flex';
        currentImageIndex = index;
    }

    document.querySelectorAll('.gallery img').forEach((img, index) => {
        img.addEventListener('click', () => openModal(index));
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    prevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        openModal(currentImageIndex);
    });

    nextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        openModal(currentImageIndex);
    });

    // Swipe functionality for mobile devices
    let touchstartX = 0;
    let touchendX = 0;

    modal.addEventListener('touchstart', function(event) {
        touchstartX = event.changedTouches[0].screenX;
    }, false);

    modal.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].screenX;
        handleGesture();
    }, false);

    function handleGesture() {
        if (touchendX < touchstartX) {
            // Swiped left
            currentImageIndex = (currentImageIndex + 1) % images.length;
            openModal(currentImageIndex);
        }

        if (touchendX > touchstartX) {
            // Swiped right
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            openModal(currentImageIndex);
        }
    }
}


// Smooth animation for navbar
navbar.style.transition = 'top 0.3s';
