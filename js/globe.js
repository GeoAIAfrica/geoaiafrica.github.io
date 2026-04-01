/**
 * GeoAI Africa — 3D Rotating Earth Globe
 * Built with Three.js — shows a wireframe/dotted Earth with Africa highlighted.
 */

(function () {
    function initGlobe() {
    const container = document.getElementById('globe-container');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // --- Main sphere (wireframe) ---
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x5B9A8B,
        wireframe: true,
        transparent: true,
        opacity: 0.06
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(sphere);

    // --- Glow sphere ---
    const glowGeometry = new THREE.SphereGeometry(1.02, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x5B9A8B,
        transparent: true,
        opacity: 0.04,
        side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    globeGroup.add(glowSphere);

    // --- Outer atmosphere ring ---
    const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(0.357, 0.604, 0.545, 1.0) * intensity * 0.3;
            }
        `,
        blending: THREE.NormalBlending,
        side: THREE.BackSide,
        transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphere);

    // --- Dot grid (latitude/longitude points) ---
    function createDotGrid() {
        const dotCount = 2000;
        const positions = new Float32Array(dotCount * 3);
        const colors = new Float32Array(dotCount * 3);
        const sizes = new Float32Array(dotCount);

        const primaryColor = new THREE.Color(0x5B9A8B);
        const secondaryColor = new THREE.Color(0x7EB8A8);
        const defaultColor = new THREE.Color(0xB0C4BC);

        for (let i = 0; i < dotCount; i++) {
            // Fibonacci sphere distribution
            const phi = Math.acos(1 - 2 * (i + 0.5) / dotCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);

            positions[i * 3] = x * 1.005;
            positions[i * 3 + 1] = y * 1.005;
            positions[i * 3 + 2] = z * 1.005;

            // Convert to lat/lon to highlight Africa
            const lat = 90 - (phi * 180 / Math.PI);
            const lon = (theta * 180 / Math.PI) % 360;
            const normalizedLon = lon > 180 ? lon - 360 : lon;

            // Rough Africa bounding box
            const isAfrica = lat >= -35 && lat <= 38 && normalizedLon >= -18 && normalizedLon <= 52;

            let color;
            if (isAfrica) {
                color = Math.random() > 0.5 ? primaryColor : secondaryColor;
                sizes[i] = 2.5 + Math.random() * 2;
            } else {
                color = defaultColor;
                sizes[i] = 1.0 + Math.random() * 1.0;
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (200.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = 1.0 - smoothstep(0.3, 0.5, d);
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        return new THREE.Points(geometry, material);
    }

    const dotGrid = createDotGrid();
    globeGroup.add(dotGrid);

    // --- Latitude/Longitude grid lines ---
    function createGridLines() {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x5B9A8B,
            transparent: true,
            opacity: 0.08,
        });

        const group = new THREE.Group();

        // Latitude lines
        for (let lat = -60; lat <= 60; lat += 30) {
            const geometry = new THREE.BufferGeometry();
            const points = [];
            const phi = (90 - lat) * Math.PI / 180;
            for (let i = 0; i <= 64; i++) {
                const theta = (i / 64) * Math.PI * 2;
                points.push(
                    Math.sin(phi) * Math.cos(theta) * 1.002,
                    Math.cos(phi) * 1.002,
                    Math.sin(phi) * Math.sin(theta) * 1.002
                );
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            group.add(new THREE.Line(geometry, lineMaterial));
        }

        // Longitude lines
        for (let lon = 0; lon < 360; lon += 30) {
            const geometry = new THREE.BufferGeometry();
            const points = [];
            const theta = lon * Math.PI / 180;
            for (let i = 0; i <= 64; i++) {
                const phi = (i / 64) * Math.PI;
                points.push(
                    Math.sin(phi) * Math.cos(theta) * 1.002,
                    Math.cos(phi) * 1.002,
                    Math.sin(phi) * Math.sin(theta) * 1.002
                );
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
            group.add(new THREE.Line(geometry, lineMaterial));
        }

        return group;
    }

    const gridLines = createGridLines();
    globeGroup.add(gridLines);

    // --- Animated connection arcs (simulating data flow across Africa) ---
    function createArc(startLat, startLon, endLat, endLon, color) {
        const startPhi = (90 - startLat) * Math.PI / 180;
        const startTheta = (startLon + 180) * Math.PI / 180;
        const endPhi = (90 - endLat) * Math.PI / 180;
        const endTheta = (endLon + 180) * Math.PI / 180;

        const startVec = new THREE.Vector3(
            Math.sin(startPhi) * Math.cos(startTheta),
            Math.cos(startPhi),
            Math.sin(startPhi) * Math.sin(startTheta)
        );

        const endVec = new THREE.Vector3(
            Math.sin(endPhi) * Math.cos(endTheta),
            Math.cos(endPhi),
            Math.sin(endPhi) * Math.sin(endTheta)
        );

        const mid = startVec.clone().add(endVec).multiplyScalar(0.5).normalize();
        const dist = startVec.distanceTo(endVec);
        mid.multiplyScalar(1 + dist * 0.4);

        const curve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4,
        });

        return new THREE.Line(geometry, material);
    }

    // African city connections
    const arcs = [
        createArc(6.5, 3.4, 30, 31.2, 0x5B9A8B),    // Lagos to Cairo
        createArc(-1.3, 36.8, 33.9, -6.9, 0x7EB8A8),  // Nairobi to Rabat
        createArc(-33.9, 18.4, 9, 7.5, 0x5B9A8B),      // Cape Town to Abuja
        createArc(5.6, -0.2, -4.3, 15.3, 0xA8D5C3),    // Accra to Kinshasa
        createArc(15.5, 32.5, -6.2, 35.7, 0x7EB8A8),   // Khartoum to Dar es Salaam
        createArc(0.3, 32.6, 14.7, -17.5, 0x5B9A8B),   // Kampala to Dakar
    ];

    arcs.forEach(arc => globeGroup.add(arc));

    // --- Location markers (pulsing dots on African cities) ---
    function createMarker(lat, lon, color) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;

        const group = new THREE.Group();

        const dotGeometry = new THREE.SphereGeometry(0.012, 8, 8);
        const dotMaterial = new THREE.MeshBasicMaterial({ color: color });
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);
        dot.position.set(
            Math.sin(phi) * Math.cos(theta) * 1.01,
            Math.cos(phi) * 1.01,
            Math.sin(phi) * Math.sin(theta) * 1.01
        );

        group.add(dot);
        return group;
    }

    const cities = [
        { lat: 6.5, lon: 3.4, color: 0x5B9A8B },     // Lagos
        { lat: 30, lon: 31.2, color: 0x7EB8A8 },      // Cairo
        { lat: -1.3, lon: 36.8, color: 0x5B9A8B },    // Nairobi
        { lat: -33.9, lon: 18.4, color: 0xA8D5C3 },   // Cape Town
        { lat: 9, lon: 7.5, color: 0x7EB8A8 },        // Abuja
        { lat: 5.6, lon: -0.2, color: 0x5B9A8B },     // Accra
        { lat: 14.7, lon: -17.5, color: 0x7EB8A8 },   // Dakar
        { lat: 33.9, lon: -6.9, color: 0x5B9A8B },    // Rabat
        { lat: 0.3, lon: 32.6, color: 0xA8D5C3 },     // Kampala
    ];

    cities.forEach(c => {
        const marker = createMarker(c.lat, c.lon, c.color);
        globeGroup.add(marker);
    });

    // --- Floating particles around the globe ---
    function createParticles() {
        const count = 300;
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const radius = 1.3 + Math.random() * 1.2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            sizes[i] = 0.5 + Math.random() * 1.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (150.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = (1.0 - smoothstep(0.2, 0.5, d)) * 0.3;
                    gl_FragColor = vec4(0.357, 0.604, 0.545, alpha);
                }
            `,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        return new THREE.Points(geometry, material);
    }

    const particles = createParticles();
    scene.add(particles);

    // --- Initial rotation to show Africa ---
    globeGroup.rotation.y = -0.4;
    globeGroup.rotation.x = 0.15;

    // --- Mouse interaction ---
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // --- Animation loop ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();

        // Auto-rotate
        globeGroup.rotation.y += 0.001;

        // Mouse-follow (subtle)
        targetRotationX = mouseY * 0.1;
        targetRotationY = mouseX * 0.1;
        globeGroup.rotation.x += (targetRotationX + 0.15 - globeGroup.rotation.x) * 0.02;

        // Pulse arcs
        arcs.forEach((arc, i) => {
            arc.material.opacity = 0.2 + Math.sin(elapsed * 2 + i) * 0.2;
        });

        // Rotate particles slowly
        particles.rotation.y += 0.0003;
        particles.rotation.x += 0.0001;

        renderer.render(scene, camera);
    }

    animate();

    // --- Handle resize ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Mini globe for CTA section ---
    const ctaContainer = document.getElementById('cta-globe');
    if (ctaContainer) {
        const miniScene = new THREE.Scene();
        const miniCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        miniCamera.position.z = 2.8;

        const miniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        miniRenderer.setSize(100, 100);
        miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        miniRenderer.setClearColor(0x000000, 0);
        ctaContainer.appendChild(miniRenderer.domElement);

        const miniGroup = new THREE.Group();
        miniScene.add(miniGroup);

        const miniSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x5B9A8B, wireframe: true, transparent: true, opacity: 0.10 })
        );
        miniGroup.add(miniSphere);

        // Mini dot grid
        const miniDotCount = 500;
        const miniPos = new Float32Array(miniDotCount * 3);
        const miniColors = new Float32Array(miniDotCount * 3);
        const miniSizes = new Float32Array(miniDotCount);
        const pColor = new THREE.Color(0x5B9A8B);
        const dColor = new THREE.Color(0xB0C4BC);

        for (let i = 0; i < miniDotCount; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / miniDotCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
            miniPos[i * 3] = Math.sin(phi) * Math.cos(theta) * 0.81;
            miniPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * 0.81;
            miniPos[i * 3 + 2] = Math.cos(phi) * 0.81;

            const lat = 90 - (phi * 180 / Math.PI);
            const lon = (theta * 180 / Math.PI) % 360;
            const nLon = lon > 180 ? lon - 360 : lon;
            const isAf = lat >= -35 && lat <= 38 && nLon >= -18 && nLon <= 52;
            const c = isAf ? pColor : dColor;
            miniColors[i * 3] = c.r;
            miniColors[i * 3 + 1] = c.g;
            miniColors[i * 3 + 2] = c.b;
            miniSizes[i] = isAf ? 2.0 : 1.0;
        }

        const miniDotGeo = new THREE.BufferGeometry();
        miniDotGeo.setAttribute('position', new THREE.BufferAttribute(miniPos, 3));
        miniDotGeo.setAttribute('color', new THREE.BufferAttribute(miniColors, 3));
        miniDotGeo.setAttribute('size', new THREE.BufferAttribute(miniSizes, 1));

        const miniDotMat = new THREE.ShaderMaterial({
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (80.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = 1.0 - smoothstep(0.3, 0.5, d);
                    gl_FragColor = vec4(vColor, alpha * 0.9);
                }
            `,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        const miniDots = new THREE.Points(miniDotGeo, miniDotMat);
        miniGroup.add(miniDots);

        miniGroup.rotation.y = -0.4;
        miniGroup.rotation.x = 0.15;

        function animateMini() {
            requestAnimationFrame(animateMini);
            miniGroup.rotation.y += 0.005;
            miniRenderer.render(miniScene, miniCamera);
        }
        animateMini();
    }

    // Close initGlobe
    }

    // Run initGlobe once DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGlobe);
    } else {
        initGlobe();
    }
})();
