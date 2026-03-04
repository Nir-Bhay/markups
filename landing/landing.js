/**
 * Markups Landing Page — Interactive Scripts
 * Theme toggle, scroll animations, FAQ accordion, preloader, marquee, count-up, nav states
 */

(function () {
    'use strict';

    // ---- PRELOADER ----
    const preloader = document.getElementById('preloader');
    const maxPreloaderTime = 1500;

    function dismissPreloader() {
        if (!preloader) return;
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.remove();
        }, 500);
    }

    window.addEventListener('load', () => {
        setTimeout(dismissPreloader, maxPreloaderTime);
    });

    // Failsafe: remove preloader after 3s no matter what
    setTimeout(dismissPreloader, 3000);

    // ---- THEME TOGGLE ----
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;
    const THEME_KEY = 'markups_landing_theme';

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (_) { /* no-op */ }
    }

    // Init theme from localStorage or system preference
    function initTheme() {
        let saved;
        try {
            saved = localStorage.getItem(THEME_KEY);
        } catch (_) { /* no-op */ }

        if (saved === 'dark' || saved === 'light') {
            setTheme(saved);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }

    initTheme();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            setTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // ---- MOBILE MENU ----
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
            });
        });
    }

    // ---- NAV SCROLL STATE ----
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function onNavScroll() {
        const scrollY = window.scrollY;
        if (navbar) {
            if (scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();

    // ---- ACTIVE NAV LINK ----
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = [];

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const section = document.querySelector(href);
            if (section) {
                sections.push({ el: section, link: link });
            }
        }
    });

    function updateActiveLink() {
        const scrollY = window.scrollY + 120;
        let active = null;

        for (let i = sections.length - 1; i >= 0; i--) {
            if (sections[i].el.offsetTop <= scrollY) {
                active = sections[i];
                break;
            }
        }

        navLinks.forEach(l => l.classList.remove('active'));
        if (active) {
            active.link.classList.add('active');
        }
    }

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();

    // ---- SCROLL ANIMATION (IntersectionObserver) ----
    const animElements = document.querySelectorAll('.animate-in');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.delay || '0', 10);

                    setTimeout(() => {
                        el.classList.add('visible');
                    }, delay);

                    observer.unobserve(el);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        animElements.forEach(el => observer.observe(el));
    } else {
        // Fallback: show all
        animElements.forEach(el => el.classList.add('visible'));
    }

    // ---- COUNT-UP ANIMATION ----
    function animateCountUp(el) {
        const target = parseFloat(el.dataset.count);
        if (isNaN(target)) return;

        const isDecimal = target % 1 !== 0;
        const duration = 1500;
        const startTime = performance.now();

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = eased * target;

            if (isDecimal) {
                el.textContent = current.toFixed(1);
            } else {
                el.textContent = Math.round(current);
            }

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }

    const countElements = document.querySelectorAll('[data-count]');

    if ('IntersectionObserver' in window) {
        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCountUp(entry.target);
                    countObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        countElements.forEach(el => countObserver.observe(el));
    } else {
        countElements.forEach(el => animateCountUp(el));
    }

    // ---- FAQ ACCORDION ----
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const button = item.querySelector('.faq-question');
        if (!button) return;

        button.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all
            faqItems.forEach(other => {
                other.classList.remove('open');
            });

            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });

    // ---- SMOOTH SCROLL FOR ANCHOR LINKS ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const top = target.offsetTop - 80;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

})();
