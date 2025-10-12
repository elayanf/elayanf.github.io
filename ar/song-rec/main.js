class Recommender {
    constructor() {
        this.artists = [];
        this.fuse = null;
        this.searchTimeout = null;

        this.init();
    }

    async init() {
        await this.loadArtists();
        this.setupFuse();
        this.setupEventListeners();
    }

    async loadArtists() {
        try {
            const response = await fetch('/resources/artists.json');
            const data = await response.json();
            this.artists = data.artists.map(a => {
                const fullName = [a.firstName, a.lastName].filter(Boolean).join(' ').trim();
                return { ...a, fullName };
            });
        } catch (error) {
            console.error('Error loading artists:', error);
        }
    }

    setupFuse() {
        const options = {
            keys: [
                'name_ar',
                'firstName',
                'lastName',
                'fullName',
                'alt',
            ],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 2,
        };

        this.fuse = new Fuse(this.artists, options);
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            searchInput.addEventListener('focus', () => {
                if (searchInput.value) {
                    searchResults.classList.add('active');
                }
            });

            searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    searchResults.classList.remove('active');
                }, 200);
            });
        }

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        window.addEventListener('scroll', () => {
            const nav = document.querySelector('.nav');
            if (window.scrollY > 100) {
                nav.style.background = 'rgba(26, 26, 26, 0.98)';
            } else {
                nav.style.background = 'rgba(26, 26, 26, 0.95)';
            }
        });
    }

    performSearch(query) {
        const searchResults = document.getElementById('searchResults');
        
        if (!query.trim()) {
            searchResults.classList.remove('active');
            return;
        }

        const results = this.fuse.search(query);
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="artist-result-item">No artists found</div>';
        } else {
            searchResults.innerHTML = results.slice(0, 5).map(result => {
                const artist = result.item;
                let image = "";
                if (artist.image){
                    image = artist.image;
                } else {
                    image = '/resources/default-icon.jpg';
                }
                if (artist.name_ar) {
                    return `
                    <div class="artist-result-item" onclick="app.navigateToArtist('${artist.firstName}', '${artist.lastName}')">
                        <img src="${image}" alt="${artist.name}" class="artist-image">
                        <div>
                            <div style="font-weight: 600;">${artist.name_ar}</div>
                        </div>
                    </div>
                `;
                } else {
                    return `
                    <div class="artist-result-item" onclick="app.navigateToArtist('${artist.firstName}', '${artist.lastName}')">
                        <img src="${image}" alt="${artist.name}" class="artist-image">
                        <div>
                            <div style="font-weight: 600;">${artist.firstName} ${artist.lastName}</div>
                        </div>
                    </div>
                `;
                }
            }).join('');
        }

        searchResults.classList.add('active');
    }

    navigateToArtist(artistfirstName, artistlastName) {
        localStorage.setItem('artistFirstName', artistfirstName);
        localStorage.setItem('artistLastName', artistlastName);
        window.location.href = `/ar/song-rec/artist.html?firstName=${artistfirstName}&lastName=${artistlastName}`;
    }
}



document.addEventListener('DOMContentLoaded', () => {
    window.app = new Recommender();
});

// Utility functions for smooth animations and interactions
const utils = {
    // Debounce function for search input
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Animate element entrance
    animateIn(element, delay = 0) {
        anime({
            targets: element,
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 600,
            delay: delay,
            easing: 'easeOutExpo'
        });
    },

    // Create ripple effect
    createRipple(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        anime({
            targets: ripple,
            scale: [0, 1],
            opacity: [1, 0],
            duration: 600,
            easing: 'easeOutExpo',
            complete: () => ripple.remove()
        });
    }
};