
/**
 * THE EVENT HORIZON ENGINE
 * Pure Physics Background with Interactivity
 */
let scene, camera, renderer, particles;
let targetScroll = 0;
let currentScroll = 0;
let scrollVelocity = 0;
const isMobile = window.innerWidth < 768;
const particleCount = isMobile ? 5000 : 20000;

// Interaction State
let mouse = { x: 0, y: 0 };
let targetMouse = { x: 0, y: 0 };

// Defer initialization for LCP
setTimeout(() => {
    init();
}, 100);

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 800;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('stage'), antialias: !isMobile, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        // Cartesian "Open Galaxy" Distribution
        pos[i] = (Math.random() - 0.5) * 4000; // Wide X spread
        pos[i+1] = (Math.random() - 0.5) * 2000; // Tall Y spread
        pos[i+2] = (Math.random() - 0.5) * 2000; // Deep Z depth
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    
    const mat = new THREE.PointsMaterial({
        size: isMobile ? 1.5 : 1.2, // Slightly larger on mobile for visibility with fewer particles
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Event Listeners
    window.addEventListener('wheel', (e) => {
        targetScroll += e.deltaY;
    }, { passive: true }); // optimize scroll performance

    window.addEventListener('mousemove', (e) => {
        // Normalize mouse coordinates (-1 to 1)
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        if(e.touches.length > 0) {
            touchStartY = e.touches[0].clientY;
            // Update target mouse for interaction on touch start
            targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) {
            const deltaY = touchStartY - e.touches[0].clientY;
            targetScroll += deltaY * 2;
            touchStartY = e.touches[0].clientY;
            
            // Continuous update for interaction
            targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });

    window.addEventListener('resize', onResize);
    animate();
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Smooth Scroll & Mouse
    const prevScroll = currentScroll;
    currentScroll += (targetScroll - currentScroll) * 0.05;
    scrollVelocity = currentScroll - prevScroll;

    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    const positions = particles.geometry.attributes.position.array;
    const time = Date.now() * 0.0008;

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];

        // 1. Scroll Warping
        const warpIntensity = scrollVelocity * 0.2;
        positions[i3 + 2] += (warpIntensity - (positions[i3 + 2] * 0.015));

        // 2. Spiral Distortion
        const angle = 0.0008 * warpIntensity;
        let newX = x * Math.cos(angle) - y * Math.sin(angle);
        let newY = x * Math.sin(angle) + y * Math.cos(angle);

        // 3. Mouse Turbulence & Attraction
        // Convert 3D pos to approximate 2D screen space for interaction check
        // This is a simplified check for performance
        const screenX = newX / (800 - z) * 800 * (window.innerWidth/window.innerHeight); // rough projection
        const screenY = newY / (800 - z) * 800; // rough projection
        
        // Distance from cursor impact zone (in projected space)
        // We use a simplified proximity check to save CPU cycles
        // Mouse range -600 to 600 rough world units equivalent
        const mouseWorldX = mouse.x * 600; 
        const mouseWorldY = mouse.y * 300;

        const dx = newX - mouseWorldX;
        const dy = newY - mouseWorldY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 400) {
            const force = (400 - dist) / 400;
            // Turbulence
            newX += (Math.random() - 0.5) * 5 * force;
            newY += (Math.random() - 0.5) * 5 * force;
            
            // Subtle Attraction 
            newX -= dx * 0.02 * force;
            newY -= dy * 0.02 * force;
        }

        positions[i3] = newX;
        positions[i3 + 1] = newY;

        // 4. Brownian Motion
        positions[i3] += Math.sin(time + i) * 0.05;
        positions[i3 + 1] += Math.cos(time + i) * 0.05;

        // Reset Loop
        if (positions[i3 + 2] > 1000) positions[i3 + 2] = -1000;
        if (positions[i3 + 2] < -1000) positions[i3 + 2] = 1000;
    }

    particles.geometry.attributes.position.needsUpdate = true;
    
    // Camera Parallax & Sway
    camera.position.x += (mouse.x * 50 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 50 - camera.position.y) * 0.05;
    
    // Add subtle ambient sway on top
    camera.position.x += Math.sin(time * 0.2) * 5;
    camera.position.y += Math.cos(time * 0.2) * 5;
    
    camera.rotation.z = currentScroll * 0.0003 + mouse.x * 0.02;

    renderer.render(scene, camera);
}
