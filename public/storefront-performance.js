(function () {
    'use strict';

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const lowPowerMode = window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches
        || Boolean(connection && connection.saveData)
        || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    window.CLEANFOODS_LOW_POWER = lowPowerMode;
    if (!lowPowerMode) return;

    document.documentElement.classList.add('cf-low-power');

    const optimizeImages = (root) => {
        if (!root || !root.querySelectorAll) return;

        root.querySelectorAll('img:not(#saas-hero-image):not(.saas-logo)').forEach((image) => {
            image.loading = 'lazy';
            image.decoding = 'async';
        });
    };

    const stopDecorativeMotion = () => {
        if (window.ScrollTrigger && typeof window.ScrollTrigger.getAll === 'function') {
            window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill(false));
        }

        if (window.gsap) {
            window.gsap.globalTimeline.clear();
            window.gsap.set('.reveal-up, .reveal-left, .reveal-right', {
                clearProps: 'all',
                autoAlpha: 1,
                x: 0,
                y: 0,
                rotation: 0,
            });
        }

        document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach((element) => {
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            element.style.transform = 'none';
        });

        document.querySelectorAll('video').forEach((video) => {
            video.pause();
            video.removeAttribute('autoplay');
            video.preload = 'none';
        });
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                if (node.matches && node.matches('img:not(#saas-hero-image):not(.saas-logo)')) {
                    node.loading = 'lazy';
                    node.decoding = 'async';
                }
                optimizeImages(node);
            });
        });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('DOMContentLoaded', () => {
        optimizeImages(document);
        stopDecorativeMotion();
        window.setTimeout(stopDecorativeMotion, 0);
        window.setTimeout(stopDecorativeMotion, 250);
        window.setTimeout(stopDecorativeMotion, 1000);
        window.setTimeout(() => observer.disconnect(), 5000);
    });

    window.addEventListener('load', stopDecorativeMotion, { once: true });
})();
