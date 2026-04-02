/**
 * GeoAI-Africa — Main Site JavaScript
 * Handles navigation, animations, scroll effects, and interactivity.
 */
(function () {
    'use strict';

    // --- Preloader — hide once page is ready ---
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hidden');
                setTimeout(() => preloader.remove(), 600);
            }
        }, 400);

        // Init everything that depends on section DOM
        initNavScroll();
        initMobileNav();
        initActiveNav();
        initRevealAnimations();
        initCounters();
        initParticles();
        initSectionHeaders();
        initSmoothScroll();
    });

    // --- Navbar scroll effect ---
    function initNavScroll() {
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // --- Mobile nav toggle ---
    function initMobileNav() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    // --- Active nav link on scroll ---
    function initActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            const scrollPos = window.pageYOffset + 100;
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');
                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { passive: true });
    }

    // --- Scroll reveal animations ---
    function initRevealAnimations() {
        const revealElements = document.querySelectorAll(
            '.pillar-card, .objective-card, .engage-card, .team-card, .event-item, .resource-card, .contact-card, .mission-statement'
        );
        revealElements.forEach(el => el.classList.add('reveal'));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => observer.observe(el));

        document.querySelectorAll('.pillars-grid, .team-grid, .engage-grid, .resources-grid').forEach(grid => {
            Array.from(grid.children).forEach((child, i) => {
                child.style.transitionDelay = `${i * 0.08}s`;
            });
        });
    }

    // --- Animated counters ---
    function initCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target, parseInt(entry.target.dataset.count, 10));
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(c => obs.observe(c));
    }

    function animateCounter(el, target) {
        let current = 0;
        const inc = target / 40;
        const timer = setInterval(() => {
            current += inc;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = Math.round(current);
        }, 37);
    }

    // --- Hero particles ---
    function initParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        const count = window.innerWidth <= 768 ? 12 : 25;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.style.cssText = `
                position:absolute;
                width:${1 + Math.random() * 3}px;
                height:${1 + Math.random() * 3}px;
                background:rgba(201,107,32,${0.12 + Math.random() * 0.20});
                border-radius:50%;
                left:${Math.random() * 100}%;
                top:${Math.random() * 100}%;
                animation:particleFloat ${5 + Math.random() * 10}s ease-in-out infinite;
                animation-delay:${Math.random() * -10}s;
            `;
            container.appendChild(p);
        }

        if (!document.getElementById('particle-kf')) {
            const s = document.createElement('style');
            s.id = 'particle-kf';
            s.textContent = `
                @keyframes particleFloat {
                    0%,100% { transform:translate(0,0) scale(1); opacity:.3; }
                    25% { transform:translate(20px,-30px) scale(1.2); opacity:.6; }
                    50% { transform:translate(-15px,-60px) scale(.8); opacity:.4; }
                    75% { transform:translate(25px,-20px) scale(1.1); opacity:.5; }
                }`;
            document.head.appendChild(s);
        }
    }

    // --- Smooth scroll for anchor links ---
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
                }
            });
        });
    }

    // --- Section headers animation ---
    function initSectionHeaders() {
        const headers = document.querySelectorAll('.section-header');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });

        headers.forEach(h => {
            h.style.opacity = '0';
            h.style.transform = 'translateY(20px)';
            h.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            obs.observe(h);
        });
    }
})();
