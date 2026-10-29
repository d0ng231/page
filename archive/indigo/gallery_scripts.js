document.addEventListener("DOMContentLoaded", function() {
    const gallery = document.querySelector(".gallery");
    const items = Array.from(gallery.children);
    const sortOrderSelect = document.getElementById('sort-order');

    // Shuffle gallery items randomly
    function shuffleGallery() {
        items.sort(() => Math.random() - 0.5);
        renderGallery();
    }

    // Sort gallery items by likes
    function sortByLikes() {
        items.sort((a, b) => {
            return parseInt(b.getAttribute('data-likes')) - parseInt(a.getAttribute('data-likes'));
        });
        renderGallery();
    }

    // Render gallery items
    function renderGallery() {
        gallery.innerHTML = "";
        items.forEach(item => gallery.appendChild(item));
    }

    // Listen for changes in sort order
    sortOrderSelect.addEventListener('change', function() {
        if (this.value === 'random') {
            shuffleGallery();
        } else if (this.value === 'likes') {
            sortByLikes();
        }
    });

    // Initial shuffle display
    shuffleGallery();

    // Like button functionality
    gallery.addEventListener('click', function(e) {
        if (e.target.classList.contains('like-btn')) {
            const galleryItem = e.target.closest('.gallery-item');
            const likeCountSpan = galleryItem.querySelector('.like-count');
            let currentLikes = parseInt(galleryItem.getAttribute('data-likes'));
            currentLikes++;
            galleryItem.setAttribute('data-likes', currentLikes);
            likeCountSpan.textContent = currentLikes;
        }
    });
});
