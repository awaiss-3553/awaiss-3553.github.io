const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const safeSetText = (element, value) => {
    if (element) {
        element.textContent = value;
    }
};

const initThemeToggle = () => {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.querySelector('.theme-icon');

    if (!themeToggle) {
        return;
    }

    let currentTheme = 'light';
    try {
        currentTheme = localStorage.getItem('theme') || 'light';
    } catch (error) {
        currentTheme = 'light';
    }

    if (currentTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        safeSetText(themeIcon, '☀️');
    }

    themeToggle.addEventListener('click', () => {
        const theme = root.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';

        root.setAttribute('data-theme', newTheme);
        safeSetText(themeIcon, newTheme === 'dark' ? '☀️' : '🌙');

        try {
            localStorage.setItem('theme', newTheme);
        } catch (error) {
            // Ignore storage issues in restricted environments.
        }
    });
};

const initNavigation = () => {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (!hamburger || !navLinks) {
        return;
    }

    const setMenuState = (isOpen) => {
        navLinks.classList.toggle('active', isOpen);
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
    };

    hamburger.addEventListener('click', () => {
        setMenuState(!navLinks.classList.contains('active'));
    });

    hamburger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setMenuState(!navLinks.classList.contains('active'));
        }
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuState(false));
    });

    document.addEventListener('click', (event) => {
        if (hamburger.contains(event.target) || navLinks.contains(event.target)) {
            return;
        }
        setMenuState(false);
    });
};

const initScrollTop = () => {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (!scrollTopBtn) {
        return;
    }

    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('show', window.pageYOffset > 300);
    }, { passive: true });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    });
};

const animateCounters = () => {
    if (prefersReducedMotion) {
        document.querySelectorAll('.progress-percent').forEach((counter) => {
            const target = parseInt(counter.getAttribute('data-target') || '0', 10);
            counter.textContent = `${target}%`;
        });
        return;
    }

    document.querySelectorAll('.progress-percent').forEach((counter) => {
        const target = parseInt(counter.getAttribute('data-target') || '0', 10);
        let current = 0;
        const increment = target / 30;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = `${Math.floor(current)}%`;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = `${target}%`;
            }
        };

        updateCounter();
    });
};

const initSkillsObserver = () => {
    const skillsSection = document.getElementById('skills');
    if (!skillsSection) {
        return;
    }

    if (!('IntersectionObserver' in window)) {
        animateCounters();
        return;
    }

    let hasAnimated = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
                animateCounters();
                hasAnimated = true;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(skillsSection);
};

const initRevealAnimations = () => {
    const targets = document.querySelectorAll('.skill-card, .experience-card, .timeline-item, .language-item, .about-container, .contact-info, .contact-form-container');
    if (!targets.length) {
        return;
    }

    if (prefersReducedMotion) {
        targets.forEach((element) => {
            element.classList.add('is-visible');
        });
        return;
    }

    targets.forEach((element) => element.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
        targets.forEach((element) => element.classList.add('is-visible'));
        return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });

    targets.forEach((element) => revealObserver.observe(element));
};

const initContactForm = () => {
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    if (!contactForm || !formMessage) {
        return;
    }

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');

        if (!nameInput || !emailInput || !messageInput) {
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();

        let isValid = true;

        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const messageError = document.getElementById('messageError');

        if (name.length < 3) {
            safeSetText(nameError, 'Name must be at least 3 characters');
            isValid = false;
        } else {
            safeSetText(nameError, '');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            safeSetText(emailError, 'Please enter a valid email');
            isValid = false;
        } else {
            safeSetText(emailError, '');
        }

        if (message.length < 10) {
            safeSetText(messageError, 'Message must be at least 10 characters');
            isValid = false;
        } else {
            safeSetText(messageError, '');
        }

        if (!isValid) {
            return;
        }

        const submitBtn = contactForm.querySelector('.submit-btn');
        if (!submitBtn) {
            return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://formspree.io/f/mlgpzgol', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, message })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            formMessage.className = 'form-message success';
            formMessage.textContent = '✅ Message sent successfully! I\'ll get back to you soon.';
            contactForm.reset();

            setTimeout(() => {
                formMessage.textContent = '';
            }, 5000);
        } catch (error) {
            formMessage.className = 'form-message error';
            formMessage.textContent = '❌ Failed to send message. Please try again or email me directly.';
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
};

const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function onClick(event) {
            const href = this.getAttribute('href');
            if (!href || href === '#') {
                return;
            }

            const targetElement = document.querySelector(href);
            if (!targetElement) {
                return;
            }

            event.preventDefault();
            targetElement.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        });
    });
};

const initPointerGlow = () => {
    if (prefersReducedMotion) {
        return;
    }

    let rafId = null;
    let latestX = window.innerWidth / 2;
    let latestY = window.innerHeight / 2;

    const updatePosition = () => {
        root.style.setProperty('--mouse-x', `${latestX}px`);
        root.style.setProperty('--mouse-y', `${latestY}px`);
        rafId = null;
    };

    const onPointerMove = (event) => {
        latestX = event.clientX;
        latestY = event.clientY;

        if (rafId === null) {
            rafId = requestAnimationFrame(updatePosition);
        }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    updatePosition();
};

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initNavigation();
    initScrollTop();
    initSkillsObserver();
    initRevealAnimations();
    initContactForm();
    initSmoothScroll();
    initPointerGlow();
});

console.log('%cHey! 👋 Welcome to my portfolio!', 'font-size: 20px; color: #2563eb; font-weight: bold;');
console.log('%cFeel free to check out my code on GitHub or connect with me on LinkedIn!', 'font-size: 14px; color: #6b7280;');
