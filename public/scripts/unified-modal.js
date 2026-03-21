let images = [];
let currentIndex = 0;
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg') || document.getElementById('modal-img');
const modalTitle = document.getElementById('modalTitle') || document.getElementById('modal-title');
const modalMeta = document.getElementById('modalMeta') || document.getElementById('metadata-container');
const closeModalBtn = document.getElementById('closeModal') || document.querySelector('.close');
let touchStartX = 0;

function showModal(idx) {
    currentIndex = idx;
    const img = images[idx];
    modalImg.src = img.fullImage;
    modalImg.alt = img.title;
    
    if (modalTitle) {
        modalTitle.textContent = img.title;
    }
    
    if (modalMeta) {
        modalMeta.innerHTML = `
            <div><b>Camera:</b> ${img.deviceModel || 'Unknown'}</div>
            <div><b>f-number:</b> ${img.fNumber || 'Unknown'}</div>
            <div><b>Exposure:</b> ${img.exposureTime || 'Unknown'}</div>
            <div><b>Date:</b> ${formatDate(img.dateTaken)}</div>
            <div><b>Tags:</b> ${(img.tags || []).join(', ')}</div>
        `;
    }
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

if (closeModalBtn) {
    closeModalBtn.onclick = closeModal;
}

window.onclick = function(event) {
    if (event.target === modal) closeModal();
};

document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('show') && modal.style.display !== 'flex') return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') showModal((currentIndex - 1 + images.length) % images.length);
    if (e.key === 'ArrowRight') showModal((currentIndex + 1) % images.length);
});

if (modal) {
    modal.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].clientY;
    });
    modal.addEventListener('touchend', function(e) {
        let touchEndX = e.changedTouches[0].clientY;
        if (touchEndX - touchStartX > 80) closeModal();
    });
}

function formatDate(dateObj) {
    if (!dateObj) return 'Unknown';
    if (typeof dateObj === 'string') return dateObj;
    if (dateObj.rawValue) return dateObj.rawValue.split(' ')[0];
    return 'Unknown';
}
