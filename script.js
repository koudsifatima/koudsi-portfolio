const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const cursorGlow = document.querySelector(".cursor-glow");
const revealItems = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll(".tilt-card");
const heroCanvas = document.getElementById("hero-canvas");
const particlesCanvas = document.getElementById("particles-canvas");
const heroStage = document.querySelector(".hero__stage");
const parallaxLayers = document.querySelectorAll(".parallax-layer");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const savedTheme = localStorage.getItem("fatima-theme");
if (savedTheme === "light") {
  body.classList.add("light");
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light");
  localStorage.setItem("fatima-theme", body.classList.contains("light") ? "light" : "dark");
});

if (!reducedMotion && cursorGlow) {
  window.addEventListener("pointermove", (event) => {
    cursorGlow.style.opacity = "1";
    cursorGlow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  });

  window.addEventListener("pointerleave", () => {
    cursorGlow.style.opacity = "0";
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => observer.observe(item));

if (!reducedMotion) {
  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 18;
      const rotateX = (0.5 - (y / rect.height)) * 18;

      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) translateZ(22px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

function initStageMotion() {
  if (!heroStage || reducedMotion) return;

  const updateStage = (event) => {
    const rect = heroStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroStage.style.transform = `rotateX(${10 - y * 14}deg) rotateY(${-8 + x * 18}deg)`;
  };

  heroStage.addEventListener("pointermove", updateStage);
  heroStage.addEventListener("pointerleave", () => {
    heroStage.style.transform = "";
  });
}

function initScrollParallax() {
  if (reducedMotion || !parallaxLayers.length) return;

  const updateParallax = () => {
    const scrollY = window.scrollY;
    parallaxLayers.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0.1);
      const speed = scrollY * depth;
      layer.style.setProperty("--parallax-y", `${speed * -1}px`);
    });
  };

  updateParallax();
  window.addEventListener("scroll", updateParallax, { passive: true });
}

function initParticles() {
  if (!particlesCanvas) return;

  const ctx = particlesCanvas.getContext("2d");
  if (!ctx) return;

  const particles = [];
  const particleCount = window.innerWidth < 768 ? 32 : 58;

  const resize = () => {
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;
  };

  const createParticle = () => ({
    x: Math.random() * particlesCanvas.width,
    y: Math.random() * particlesCanvas.height,
    radius: Math.random() * 2 + 0.6,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    alpha: Math.random() * 0.55 + 0.2
  });

  const init = () => {
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push(createParticle());
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > particlesCanvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > particlesCanvas.height) particle.vy *= -1;

      ctx.beginPath();
      ctx.fillStyle = body.classList.contains("light")
        ? `rgba(31, 140, 255, ${particle.alpha})`
        : `rgba(97, 243, 255, ${particle.alpha})`;
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();

      for (let inner = index + 1; inner < particles.length; inner += 1) {
        const other = particles[inner];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 120) {
          ctx.beginPath();
          ctx.strokeStyle = body.classList.contains("light")
            ? `rgba(102, 86, 255, ${0.12 - distance / 1000})`
            : `rgba(196, 109, 255, ${0.16 - distance / 900})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    });

    if (!reducedMotion) {
      requestAnimationFrame(draw);
    }
  };

  resize();
  init();

  if (reducedMotion) {
    draw();
  } else {
    draw();
    window.addEventListener("resize", () => {
      resize();
      init();
    });
  }
}

function initHeroScene() {
  if (!heroCanvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({
    canvas: heroCanvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.3, 6.5);

  const group = new THREE.Group();
  scene.add(group);

  const ambientLight = new THREE.AmbientLight(0xa8d8ff, 1.4);
  const pointLight = new THREE.PointLight(0x61f3ff, 20, 32);
  pointLight.position.set(3.6, 2.2, 5.6);
  const pointLightTwo = new THREE.PointLight(0x7c6bff, 16, 30);
  pointLightTwo.position.set(-3.2, -1.4, 4.2);
  const pointLightThree = new THREE.PointLight(0xc46dff, 14, 26);
  pointLightThree.position.set(0, 2.6, 2.6);

  scene.add(ambientLight, pointLight, pointLightTwo, pointLightThree);

  const icosahedron = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.15, 0),
    new THREE.MeshPhysicalMaterial({
      color: 0x8e7cff,
      metalness: 0.32,
      roughness: 0.08,
      transmission: 0.28,
      transparent: true,
      opacity: 0.92,
      emissive: 0x17123f,
      clearcoat: 1,
      iridescence: 0.6
    })
  );

  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, 0.12, 16, 120),
    new THREE.MeshStandardMaterial({
      color: 0x61f3ff,
      emissive: 0x0f5f80,
      metalness: 0.7,
      roughness: 0.16
    })
  );
  torus.rotation.x = Math.PI / 2.4;

  const smallSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x2b73c6,
      metalness: 0.4,
      roughness: 0.18
    })
  );
  smallSphere.position.set(1.85, 0.5, 0.2);

  const smallSphereTwo = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x61f3ff,
      emissive: 0x0f5f80,
      metalness: 0.4,
      roughness: 0.18
    })
  );
  smallSphereTwo.position.set(-1.55, -0.8, 0.6);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.45, 0.04, 16, 160),
    new THREE.MeshBasicMaterial({
      color: 0xc46dff,
      transparent: true,
      opacity: 0.55
    })
  );
  ring.rotation.x = Math.PI / 2.1;
  ring.rotation.y = 0.4;

  group.add(torus, icosahedron, smallSphere, smallSphereTwo, ring);

  const resizeScene = () => {
    const { clientWidth, clientHeight } = heroCanvas;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };

  resizeScene();
  window.addEventListener("resize", resizeScene);

  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  });

  const clock = new THREE.Clock();

  const render = () => {
    const elapsed = clock.getElapsedTime();
    icosahedron.rotation.x = elapsed * 0.45;
    icosahedron.rotation.y = elapsed * 0.7;
    torus.rotation.z = elapsed * 0.25;
    ring.rotation.z = -elapsed * 0.18;
    ring.rotation.x = Math.PI / 2.1 + Math.sin(elapsed * 0.5) * 0.08;
    smallSphere.position.y = 0.45 + Math.sin(elapsed * 1.4) * 0.22;
    smallSphereTwo.position.y = -0.8 + Math.cos(elapsed * 1.6) * 0.16;
    pointLightThree.position.x = Math.sin(elapsed * 0.8) * 1.6;
    pointLightThree.position.y = 2 + Math.cos(elapsed * 1.1) * 0.6;
    group.rotation.x += ((pointer.y * 0.22) - group.rotation.x) * 0.04;
    group.rotation.y += ((pointer.x * 0.28) - group.rotation.y) * 0.04;

    renderer.render(scene, camera);

    if (!reducedMotion) {
      requestAnimationFrame(render);
    }
  };

  render();
}

document.querySelector(".contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  if (button) {
    button.textContent = "Message Sent";
    button.disabled = true;
  }
});

initParticles();
initHeroScene();
initStageMotion();
initScrollParallax();
