// Global variables
let currentSlideIndex = 0;
let slides = [];
let galleryImages = [];
let currentModalIndex = 0;

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');

            // Remove active class from all buttons and pages
            navButtons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));

            // Add active class to clicked button and corresponding page
            this.classList.add('active');
            document.getElementById(targetPage).classList.add('active');
        });
    });

    // Load content
    loadAboutUsContent();
    loadGalleryImages();
});

// Load About Us content from markdown file
async function loadAboutUsContent() {
    try {
        // Try to read the markdown file
        const response = await fetch('/about_us.md', { encoding: 'utf8' });
        const markdown = await response.text();
        document.getElementById('aboutContent').innerHTML = parseMarkdownToHTML(markdown);
    } catch (error) {
        // Fallback content if file doesn't exist
        console.log(error);
        document.getElementById('aboutContent').innerHTML = `
            <div style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 10px; margin: 2rem 0;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                <h3>About Us Content Not Found</h3>
                <p>Please create an <strong>about_us.md</strong> file in your project directory.</p>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                    The file should contain your organization's information in Markdown format.
                </p>
            </div>
        `;
    }
}

// Simple markdown to HTML parser
function parseMarkdownToHTML(markdown) {
    return markdown
        // Headers
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        // Bold and Italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Lists
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        // Wrap lists
        .replace(/(<li>.*<\/li>)/gs, function (match) {
            return '<ul>' + match + '</ul>';
        })
        // Paragraphs (simple approach)
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|u|b])(.+)$/gim, '<p>$1</p>')
        // Clean up extra paragraph tags
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-6]>)/g, '$1')
        .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<ul>)/g, '$1')
        .replace(/(<\/ul>)<\/p>/g, '$1')
        .replace(/<p>(<blockquote>)/g, '$1')
        .replace(/(<\/blockquote>)<\/p>/g, '$1');
}

// Load gallery images
async function loadGalleryImages() {
    try {
        // Try to load gallery descriptions
        let descriptions = {};
        try {
            const descriptionsResponse = await fetch('/gallery-descriptions.json', { encoding: 'utf8' });
            descriptions = JSON.parse(descriptionsResponse);
        } catch (e) {
            console.log('Gallery descriptions file not found, using defaults');
        }

        // Get list of images from images directory
        const imageFiles = await getImageFiles();

        if (imageFiles.length === 0) {
            showEmptyGallery();
            return;
        }

        // Hide empty gallery message
        document.getElementById('emptyGallery').style.display = 'none';

        // Create slideshow
        createSlideshow(imageFiles, descriptions);

        // Create gallery grid
        createGalleryGrid(imageFiles, descriptions);

        // Start slideshow auto-advance
        startSlideshowTimer();

    } catch (error) {
        console.error('Error loading gallery:', error);
        showEmptyGallery();
    }
}

// Get image files from images directory
async function getImageFiles() {
    try {
        const response = await fetch('images/index.json');
        if (response.ok) {
            const data = await response.json();
            return data.images;
        }
    } catch (error) {
        console.log('Could not load image index:', error);
    }

    return [];
}

// Show empty gallery message
function showEmptyGallery() {
    document.getElementById('slideshowContainer').style.display = 'none';
    document.getElementById('slideIndicators').style.display = 'none';
    document.getElementById('galleryGrid').style.display = 'none';
    document.getElementById('emptyGallery').style.display = 'block';
}

// Create slideshow
function createSlideshow(imageFiles, descriptions) {
    const container = document.getElementById('slideshowContainer');
    const slideshowImages = descriptions.slideshow_images || [];

    // Use first 5 images for slideshow
    const slideImages = imageFiles.slice(0, 5);
    slides = slideImages;

    let slidesHTML = '';
    let indicatorsHTML = '';

    slideImages.forEach((filename, index) => {
        const desc = slideshowImages.find(item => item.filename === filename) || {
            title: `Image ${index + 1}`,
            description: `Community impact photo ${index + 1}`
        };

        slidesHTML += `
            <div class="slide ${index === 0 ? 'active' : ''}">
                <img src="images/${filename}" alt="${desc.title}">
                <div class="slide-caption">
                    <strong>${desc.title}</strong><br>
                    ${desc.description}
                </div>
            </div>
        `;

        indicatorsHTML += `
            <span class="indicator ${index === 0 ? 'active' : ''}" onclick="currentSlide(${index + 1})"></span>
        `;
    });

    container.innerHTML = `
        ${slidesHTML}
        <button class="nav-arrow prev" onclick="changeSlide(-1)">❮</button>
        <button class="nav-arrow next" onclick="changeSlide(1)">❯</button>
    `;

    document.getElementById('slideIndicators').innerHTML = indicatorsHTML;
}

// Create gallery grid
function createGalleryGrid(imageFiles, descriptions) {
    const container = document.getElementById('galleryGrid');
    const galleryItems = descriptions.gallery_items || [];

    galleryImages = imageFiles; // Store for modal navigation

    let gridHTML = '';

    imageFiles.forEach((filename, index) => {
        const desc = galleryItems.find(item => item.filename === filename) || {
            title: `Community Photo ${index + 1}`,
            description: `A moment from our community work and impact.`
        };

        gridHTML += `
            <div class="gallery-item" onclick="openModal(${index})">
                <img src="images/${filename}" alt="${desc.title}">
                <div class="gallery-item-content">
                    <h3>${desc.title}</h3>
                    <p>${desc.description}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = gridHTML;
}

// Slideshow functions
function showSlide(index) {
    const slideElements = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');

    if (slideElements.length === 0) return;

    slideElements.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    slideElements[index].classList.add('active');
    indicators[index].classList.add('active');
}

function changeSlide(direction) {
    if (slides.length === 0) return;

    currentSlideIndex += direction;
    if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
    }
    showSlide(currentSlideIndex);
}

function currentSlide(index) {
    currentSlideIndex = index - 1;
    showSlide(currentSlideIndex);
}

// Auto-advance slideshow
function startSlideshowTimer() {
    if (slides.length > 0) {
        setInterval(() => {
            changeSlide(1);
        }, 5000);
    }
}

// Modal functions
function openModal(imageIndex) {
    currentModalIndex = imageIndex;
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');

    modalImage.src = `images/${galleryImages[imageIndex]}`;
    modalCaption.textContent = `Image ${imageIndex + 1} of ${galleryImages.length}`;

    modal.classList.add('active');

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');

    // Restore body scrolling
    document.body.style.overflow = 'auto';
}

function modalChangeImage(direction) {
    currentModalIndex += direction;
    if (currentModalIndex >= galleryImages.length) {
        currentModalIndex = 0;
    } else if (currentModalIndex < 0) {
        currentModalIndex = galleryImages.length - 1;
    }

    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');

    modalImage.src = `images/${galleryImages[currentModalIndex]}`;
    modalCaption.textContent = `Image ${currentModalIndex + 1} of ${galleryImages.length}`;
}

// Close modal on outside click
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
});

// Keyboard navigation for modal
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('imageModal');
    if (modal.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowLeft') {
            modalChangeImage(-1);
        } else if (e.key === 'ArrowRight') {
            modalChangeImage(1);
        }
    }
});

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = {};

        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Simulate form submission
        alert('Thank you for your message! We will get back to you within 24 hours. Your information has been received and will be handled confidentially.');

        // Reset form
        this.reset();
    });
});