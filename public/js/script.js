// DOM Elements
const cursor = document.getElementById("cursor");
const canvas = document.getElementById("particles-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
// Particles array
let particles = [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initCursor();
  initParticles();
  initAnimations();
  initScrollAnimations();
  checkUserLogin(); // ✅ أضف هذه السطر لتشغيل التحقق
});

// Custom Cursor
function initCursor() {
  if (!cursor) return;

  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  // Add hover effect for interactive elements
  const interactiveElements = document.querySelectorAll(
    "button, a, input, textarea"
  );

  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("cursor-hover");
    });

    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("cursor-hover");
    });
  });
}

// Particles Animation
function initParticles() {
  if (!canvas || !ctx) return;

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Create particles
  function createParticles() {
    particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
  }

  createParticles();

  // Animate particles
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 100, 100, ${particle.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}

// Hero Animations
function initAnimations() {
  const heroTitle = document.querySelector(".hero-title");
  const heroSubtitle = document.querySelector(".hero-subtitle");
  const heroButton = document.querySelector(".hero-button");

  // Stagger hero animations
  setTimeout(() => {
    if (heroTitle) heroTitle.classList.add("animate-in");
  }, 100);

  setTimeout(() => {
    if (heroSubtitle) heroSubtitle.classList.add("animate-in");
  }, 300);

  setTimeout(() => {
    if (heroButton) heroButton.classList.add("animate-in");
  }, 500);
}

// Scroll Animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-in");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with animate-on-scroll class
  const animateElements = document.querySelectorAll(".animate-on-scroll");
  animateElements.forEach((el) => {
    observer.observe(el);
  });
}

// Smooth scroll function
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

// Navigation smooth scroll
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      scrollToSection(targetId);
    });
  });
});

// Button click handlers
document.addEventListener("DOMContentLoaded", () => {
  // Pricing buttons
  const pricingBtns = document.querySelectorAll(".btn-pricing");
  pricingBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const planName =
        this.closest(".pricing-card").querySelector(
          ".pricing-name"
        ).textContent;
      alert(`تم اختيار خطة: ${planName}`);
    });
  });

  // CTA buttons
  const ctaBtns = document.querySelectorAll(".btn-gradient");
  ctaBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      scrollToSection("pricing");
    });
  });
});

// Performance optimization
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

// Optimized scroll handler
const optimizedScrollHandler = debounce(() => {
  // Any scroll-based animations can be added here
}, 10);

window.addEventListener("scroll", optimizedScrollHandler);

// Preload optimization
window.addEventListener("load", () => {
  // Remove any loading states
  document.body.classList.add("loaded");
});

// Error handling
window.addEventListener("error", (e) => {
  console.error("JavaScript error:", e.error);
});

// Mobile menu toggle (if needed in future)
function toggleMobileMenu() {
  // Implementation for mobile menu toggle
  console.log("Mobile menu toggle");
}

// Utility functions
function addClass(element, className) {
  if (element && !element.classList.contains(className)) {
    element.classList.add(className);
  }
}

function removeClass(element, className) {
  if (element && element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

// Initialize everything when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

function init() {
  console.log("TeleBot Creator website initialized successfully!");
}

// User Authentication Functions
async function checkUserLogin() {
  const authButtons = document.getElementById("auth-buttons");
  const authButtonsMobile = document.getElementById("auth-buttons-mobile");
  const userMenu = document.getElementById("user-menu");
  const userMenuMobile = document.getElementById("user-menu-mobile");
  const usernameDisplay = document.getElementById("username-display");
  const usernameDisplayMobile = document.getElementById(
    "username-display-mobile"
  );

  try {
    const response = await fetch("/api/user");
    const data = await response.json();

    if (data.loggedIn) {
      const user = data.user;

      if (authButtons) authButtons.style.display = "none";
      if (authButtonsMobile) authButtonsMobile.style.display = "none";
      if (userMenu) userMenu.style.display = "flex";
      if (userMenuMobile) userMenuMobile.style.display = "block";

      if (usernameDisplay)
        usernameDisplay.textContent = user.name || "المستخدم";
      if (usernameDisplayMobile)
        usernameDisplayMobile.textContent = user.name || "المستخدم";
    } else {
      if (authButtons) authButtons.style.display = "flex";
      if (authButtonsMobile) authButtonsMobile.style.display = "flex";
      if (userMenu) userMenu.style.display = "none";
      if (userMenuMobile) userMenuMobile.style.display = "none";
    }
  } catch (error) {
    console.error("فشل في جلب بيانات المستخدم", error);
  }
}

function logout() {
  if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
    fetch("/logout")
      .then(() => {
        // إعادة تحميل الصفحة لإظهار أزرار التسجيل
        window.location.reload();
      })
      .catch((err) => {
        alert("حدث خطأ أثناء تسجيل الخروج");
        console.error(err);
      });
  }
}
