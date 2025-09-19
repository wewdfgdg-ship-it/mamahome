// Main JavaScript - Enhanced Version

// ===============================
// 1. Carousel Functionality
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    initializeCarousel();
    initializeTagSelection();
    initializeSmoothScroll();
    initializeScrollAnimations();
    initializeNumberCounters();
    initializePartnersSlider();
    initializeCTAEffects();
    // initializeMobileMenu(); // Commented out as mobile menu elements are hidden
});

function initializeCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const carouselSection = document.querySelector('.carousel-section');
    const carouselSlides = document.querySelector('.carousel-slides');
    
    console.log('Carousel slides found:', slides.length);
    if (!slides.length) return;
    
    let currentSlide = 0;
    let autoPlayInterval;
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Create indicators
    createCarouselIndicators(slides.length);
    const indicators = document.querySelectorAll('.carousel-indicator');
    
    // Create navigation buttons
    // createCarouselButtons(); // Commented out - buttons already exist in HTML
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        slides[index].classList.add('active');
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }
        currentSlide = index;
    }    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 7000);
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }
    
    // Initialize
    showSlide(0);
    startAutoPlay();
    
    // Event listeners
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');    
    
    console.log('Prev button found:', prevButton);
    console.log('Next button found:', nextButton);
    console.log('Indicators found:', indicators.length);
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            console.log('Previous button clicked');
            prevSlide();
            resetAutoPlay();
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log('Next button clicked');
            nextSlide();
            resetAutoPlay();
        });
    }
    
    // Indicator clicks
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSlide(index);
            resetAutoPlay();
        });
    });
    
    // Pause on hover
    if (carouselSection) {
        carouselSection.addEventListener('mouseenter', stopAutoPlay);
        carouselSection.addEventListener('mouseleave', startAutoPlay);
    }
    
    // Touch swipe support for mobile
    if (carouselSlides) {
        carouselSlides.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoPlay();
        }, { passive: true });
        
        carouselSlides.addEventListener('touchmove', (e) => {
            // Optional: Add visual feedback during swipe
        }, { passive: true });
        
        carouselSlides.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleCarouselSwipe();
            startAutoPlay();
        }, { passive: true });
    }
    
    function handleCarouselSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next slide
                nextSlide();
            } else {
                // Swipe right - previous slide
                prevSlide();
            }
        }
    }
}

function createCarouselIndicators(count) {
    const carouselSection = document.querySelector('.carousel-section');
    if (!carouselSection) return;
    
    const indicatorsDiv = document.createElement('div');
    indicatorsDiv.className = 'carousel-indicators';
    
    for (let i = 0; i < count; i++) {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicator.setAttribute('aria-label', `Slide ${i + 1}`);
        indicatorsDiv.appendChild(indicator);
    }
    
    carouselSection.appendChild(indicatorsDiv);
}

function createCarouselButtons() {
    const carouselContainer = document.querySelector('.carousel-container');
    if (!carouselContainer) return;
    
    const prevButton = document.createElement('button');
    prevButton.className = 'carousel-prev';
    prevButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    const nextButton = document.createElement('button');
    nextButton.className = 'carousel-next';
    nextButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    carouselContainer.appendChild(prevButton);
    carouselContainer.appendChild(nextButton);
}
// ===============================
// 2. Tag Selection
// ===============================
function initializeTagSelection() {
    const tags = document.querySelectorAll('.tag');
    
    tags.forEach(tag => {
        tag.addEventListener('click', function() {
            // Remove active class from all tags
            tags.forEach(t => t.classList.remove('tag-active'));
            // Add active class to clicked tag
            this.classList.add('tag-active');
            
            // Trigger filter animation (optional)
            filterServices(this.textContent.trim());
        });
    });
}

function filterServices(category) {
    const serviceCards = document.querySelectorAll('.service-card');
    
    // For now, just animate all cards
    serviceCards.forEach((card, index) => {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'fadeInUp 0.5s ease-out';
        }, index * 50);
    });
}
// ===============================
// 3. Smooth Scroll
// ===============================
function initializeSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===============================
// 4. Scroll Animations
// ===============================
function initializeScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    // Service Cards Animation
    const serviceCards = document.querySelectorAll('.service-card');
    const serviceObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, index * 100);
                serviceObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    serviceCards.forEach(card => {
        serviceObserver.observe(card);
    });
    
    // Portfolio Cards Animation
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    const portfolioObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, index * 100);
                portfolioObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    portfolioCards.forEach(card => {
        portfolioObserver.observe(card);
    });
}

// ===============================
// 5. Number Counter Animation
// ===============================
function initializeNumberCounters() {
    try {
        // 간단한 선택자 사용
        const numbers = document.getElementsByClassName('number');
        
        if (numbers.length === 0) {
            console.log('No number elements found');
            return;
        }
        
        console.log('Found elements:', numbers.length);
        
        // 각 숫자 요소에 대해 처리
        Array.from(numbers).forEach(element => {
            // IntersectionObserver 생성
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.dataset.counted) {
                        const finalNumber = parseInt(entry.target.textContent);
                        if (!isNaN(finalNumber)) {
                            // 애니메이션 시작
                            let currentNumber = 0;
                            const increment = finalNumber / 100;
                            
                            const counter = setInterval(() => {
                                currentNumber += increment;
                                if (currentNumber >= finalNumber) {
                                    currentNumber = finalNumber;
                                    clearInterval(counter);
                                    entry.target.dataset.counted = 'true';
                                }
                                entry.target.textContent = Math.floor(currentNumber);
                            }, 20);
                        }
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(element);
        });
        
    } catch (error) {
        console.error('Error in number counter:', error);
    }
}
// ===============================
// 6. Partners Slider
// ===============================
function initializePartnersSlider() {
    const partnersTrack = document.querySelector('.partners-track');
    if (!partnersTrack) return;
    
    // Clone slides for infinite scroll
    const slides = partnersTrack.querySelectorAll('.partners-slide');
    slides.forEach(slide => {
        const clone = slide.cloneNode(true);
        partnersTrack.appendChild(clone);
    });
}

// ===============================
// 7. CTA Effects
// ===============================
function initializeCTAEffects() {
  const ctaSection = document.querySelector('.cta-section');
  const letters = document.querySelectorAll('.cta-section .letter');
  if (!ctaSection || !letters.length) return;

  // 1) 초기 상태(보이지 않음)
  letters.forEach(l => {
    l.style.opacity = '0';
    l.style.transform = 'translateY(30px)';
    l.style.animation = 'none';
  });

  // 2) 지연시간 세팅 (0.05s 간격)
  letters.forEach((l, i) => {
    l.dataset.delay = (i * 0.05).toFixed(2) + 's';
  });

  // 3) 인터섹션 옵저버로 뷰포트 진입 시 재생
  const play = () => {
    letters.forEach(l => {
      l.style.animation = `fadeInUp 0.6s ease forwards`;
      l.style.animationDelay = l.dataset.delay || '0s';
    });
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        play();
        io.disconnect();
      }
    });
  }, { threshold: 0.25 });

  io.observe(ctaSection);
}


// ===============================
// 8. Mobile Menu - Enhanced (COMMENTED OUT)
// ===============================
/*
function initializeMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    let mobileOverlay = document.querySelector('.mobile-overlay');
    
    if (!navToggle || !navMenu) return;
    
    // Create mobile overlay if it doesn't exist
    if (!mobileOverlay) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-overlay';
        document.body.appendChild(mobileOverlay);
    }
    
    // Toggle menu function
    function toggleMenu(open) {
        if (open === undefined) {
            open = !navMenu.classList.contains('active');
        }
        
        if (open) {
            navMenu.classList.add('active');
            navToggle.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        } else {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    // Toggle button click
    navToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });
    
    // Close on overlay click
    mobileOverlay.addEventListener('click', () => {
        toggleMenu(false);
    });
    
    // Close on nav link click
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            toggleMenu(false);
        });
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            toggleMenu(false);
        }
    });
    
    // Prevent menu close when clicking inside menu
    navMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Touch swipe to close
    let touchStartX = 0;
    let touchEndX = 0;
    
    navMenu.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    navMenu.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) { // Swipe left
            toggleMenu(false);
        }
    }
}
*/

// ===============================
// 9. Header Scroll Effect
// ===============================
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (header) {  // null 체크 추가
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// ===============================
// 10. Utility Functions
// ===============================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Resize handler
window.addEventListener('resize', debounce(() => {
    // Handle any resize-related updates
    console.log('Window resized');
}, 250));

// Page load complete
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    console.log('Page fully loaded - All animations ready');
});

// ===============================
// 11. Mobile Optimizations
// ===============================

// Detect touch device
function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

// Add touch class to body
if (isTouchDevice()) {
    document.body.classList.add('touch-device');
}

// Viewport height fix for mobile browsers
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setViewportHeight();
window.addEventListener('resize', setViewportHeight);

// Prevent double-tap zoom on buttons
document.addEventListener('touchend', function(e) {
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        e.preventDefault();
        target.click();
    }
}, { passive: false });

// Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px'
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

// Initialize lazy loading if needed
document.addEventListener('DOMContentLoaded', initializeLazyLoading);

// Smooth momentum scrolling for iOS
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.body.style.webkitOverflowScrolling = 'touch';
}

// Performance monitoring
const performanceData = {
    startTime: performance.now(),
    interactions: []
};

// Log interactions for performance analysis
document.addEventListener('click', function(e) {
    performanceData.interactions.push({
        type: 'click',
        target: e.target.tagName,
        time: performance.now() - performanceData.startTime
    });
});

// Log page performance metrics
window.addEventListener('load', function() {
    if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log('Page load time:', loadTime + 'ms');
    }
});