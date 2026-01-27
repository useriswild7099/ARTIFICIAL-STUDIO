
const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');

let stars = [];
const numStars = 150;
let width, height;

// Mouse tracking
let mouse = { x: null, y: null };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initStars();
}

class Star {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.baseOpacity = Math.random() * 0.5 + 0.3; // Random opacity between 0.3 and 0.8
        this.opacity = this.baseOpacity;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Mouse interaction
        if (mouse.x != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let maxDist = 150;

            if (distance < maxDist) {
                // Increase size and opacity slightly when near mouse
                this.opacity = Math.min(1, this.baseOpacity + (1 - distance / maxDist) * 0.5);
                
                // Subtle repulsion
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const maxForce = 2; // Max repulsion force
                const force = (maxDist - distance) / maxDist; // 0 to 1
                const directionX = forceDirectionX * force * maxForce;
                const directionY = forceDirectionY * force * maxForce;

                this.x -= directionX * 0.05; // Smooth movement away
                this.y -= directionY * 0.05;
            } else {
                this.opacity = this.baseOpacity;
            }
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initStars() {
    stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push(new Star());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Connect stars near mouse
    if(mouse.x != null) {
        stars.forEach(star => {
            let dx = mouse.x - star.x;
            let dy = mouse.y - star.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            if(distance < 150) {
                 ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance/150)})`;
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.moveTo(star.x, star.y);
                 ctx.lineTo(mouse.x, mouse.y);
                 ctx.stroke();
            }
        });
    }

    stars.forEach(star => {
        star.update();
        star.draw();
    });
    requestAnimationFrame(animate);
}

resizeCanvas();
animate();
