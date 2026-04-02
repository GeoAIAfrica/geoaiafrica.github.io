/**
 * GeoAI-Africa — Section Loader
 * Fetches each section's HTML from /sections/<name>/<name>.html and injects it.
 * Dispatches 'sections-loaded' event when all sections are ready.
 */
(function () {
    'use strict';

    const sections = [
        { id: 'section-hero',      path: 'sections/hero/hero.html' },
        { id: 'section-mission',   path: 'sections/mission/mission.html' },
        { id: 'section-impact',    path: 'sections/impact/impact.html' },
        { id: 'section-team',      path: 'sections/team/team.html' },
        { id: 'section-events',    path: 'sections/events/events.html' },
        { id: 'section-resources', path: 'sections/resources/resources.html' },
        { id: 'section-contact',   path: 'sections/contact/contact.html' },
    ];

    async function loadSections() {
        const results = await Promise.all(
            sections.map(s =>
                fetch(s.path)
                    .then(r => {
                        if (!r.ok) throw new Error(`Failed to load ${s.path}`);
                        return r.text();
                    })
                    .then(html => ({ id: s.id, html }))
                    .catch(err => {
                        console.error(err);
                        return { id: s.id, html: '' };
                    })
            )
        );

        results.forEach(({ id, html }) => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = html;
        });

        // Signal that all sections are loaded
        document.dispatchEvent(new Event('sections-loaded'));
    }

    // Start loading as soon as the DOM shell is parsed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSections);
    } else {
        loadSections();
    }
})();
