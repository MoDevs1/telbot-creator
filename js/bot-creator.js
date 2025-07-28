// Bot Creator Dashboard JavaScript

// Global variables
let bots = [];
let currentFilter = "all";

// Initialize

function initDashboard() {
  // Initialize cursor and particles
  initCursor();
  initParticles();

  // Load saved bots
  fetchBots();
  // Initialize event listeners
  initEventListeners();

  // Update stats
  // updateStats();

  // Render bots
  renderBots();
}
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

// Custom Cursor
function initCursor() {
  const cursor = document.getElementById("cursor");
  if (!cursor) return;

  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });

  const interactiveElements = document.querySelectorAll(
    "button, a, input, textarea, select"
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
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

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

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 100, 100, ${particle.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}

// Event Listeners
function initEventListeners() {
  // Create bot button
  document
    .getElementById("createBotBtn")
    ?.addEventListener("click", showCreateBotModal);

  // Create bot form
  document
    .getElementById("createBotForm")
    ?.addEventListener("submit", handleCreateBot);

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      setFilter(filter);
    });
  });

  // User dropdown
  document
    .querySelector(".dropdown-btn")
    ?.addEventListener("click", toggleUserDropdown);

  // Close modals when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("show");
    }

    if (!e.target.closest(".user-dropdown")) {
      const dropdown = document.querySelector(".dropdown-menu");
      dropdown?.classList.remove("show");
    }
  });
}

// Bot Management
function loadBots() {
  const savedBots = localStorage.getItem("userBots");
  if (savedBots) {
    try {
      bots = JSON.parse(savedBots);
    } catch (error) {
      console.error("Error loading bots:", error);
      bots = [];
    }
  }
}

function saveBots() {
  localStorage.setItem("userBots", JSON.stringify(bots));
}

function createBot(botData) {
  const newBot = {
    id: Date.now().toString(),
    name: botData.name,
    token: botData.token,
    description: botData.description,
    platform: botData.platform,
    status: "pending",
    createdAt: new Date().toISOString(),
    messages: 0,
    users: 0,
    uptime: "0%",
  };

  bots.push(newBot);
  saveBots();
  // updateStats();
  renderBots();

  return newBot;
}

function deleteBot(botId) {
  if (confirm("هل أنت متأكد من حذف هذا البوت؟")) {
    bots = bots.filter((bot) => bot.id !== botId);
    saveBots();
    showSuccess("تم حذف البوت بنجاح!");

    // إعادة تحميل الصفحة بعد ثانية واحدة
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

function toggleBotStatus(botId) {
  const bot = bots.find((b) => b.id === botId);
  if (bot) {
    if (bot.status === "active") {
      bot.status = "disabled";
    } else if (bot.status === "disabled") {
      bot.status = "active";
    }
    saveBots();
    // updateStats();
    renderBots();

    const statusText = bot.status === "active" ? "تم تفعيل" : "تم تعطيل";
    showSuccess(`${statusText} البوت بنجاح!`);
  }
}

// UI Functions
function showCreateBotModal() {
  const modal = document.getElementById("createBotModal");
  modal.classList.add("show");

  // Clear form
  document.getElementById("createBotForm").reset();
}

function closeCreateBotModal() {
  const modal = document.getElementById("createBotModal");
  modal.classList.remove("show");
}

function showBotDetails(botId) {
  const bot = bots.find((b) => b.id === botId);
  if (!bot) return;

  const modal = document.getElementById("botDetailsModal");
  const title = document.getElementById("botDetailsTitle");
  const content = document.getElementById("botDetailsContent");

  title.textContent = `تفاصيل ${bot.name}`;

  content.innerHTML = `
    <div class="bot-details">
      <div class="detail-section">
        <h4>معلومات أساسية</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <label>اسم البوت:</label>
            <span>${bot.name}</span>
          </div>
          <div class="detail-item">
            <label>المنصة:</label>
            <span>${
              bot.platform === "telegram" ? "تليجرام" : bot.platform
            }</span>
          </div>
          <div class="detail-item">
            <label>الحالة:</label>
            <span class="status-badge ${bot.status}">${getStatusText(
    bot.status
  )}</span>
          </div>
          <div class="detail-item">
            <label>تاريخ الإنشاء:</label>
            <span>${formatDate(bot.createdAt)}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h4>الوصف</h4>
        <p>${bot.description}</p>
      </div>
      
      <div class="detail-section">
        <h4>الإحصائيات</h4>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-value">${bot.messages}</span>
            <span class="stat-label">الرسائل</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${bot.users}</span>
            <span class="stat-label">المستخدمين</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${bot.uptime}</span>
            <span class="stat-label">وقت التشغيل</span>
          </div>
        </div>
      </div>
      
      <div class="detail-actions">
        ${
          bot.status === "pending"
            ? ""
            : `
          <button class="btn ${
            bot.status === "active" ? "btn-danger" : "btn-success"
          }" 
                  onclick="toggleBotStatus('${
                    bot.id
                  }'); closeBotDetailsModal()">
            <i class="fas fa-${bot.status === "active" ? "pause" : "play"}"></i>
            ${bot.status === "active" ? "تعطيل البوت" : "تفعيل البوت"}
          </button>
        `
        }
        <button class="btn btn-danger" onclick="deleteBot('${
          bot.id
        }'); closeBotDetailsModal()">
          <i class="fas fa-trash"></i>
          حذف البوت
        </button>
      </div>
    </div>
  `;

  modal.classList.add("show");
}

function closeBotDetailsModal() {
  const modal = document.getElementById("botDetailsModal");
  modal.classList.remove("show");
}

async function fetchBots() {
  try {
    const res = await fetch("/api/my-bots");
    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format");
    }

    bots = data;
    renderBots();
    // updateStats(); لو حابب تفعلها
  } catch (err) {
    console.error("❌ Error fetching bots:", err);
  }
}

function createBotViaAPI(botData) {
  return fetch("/api/create-bot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(botData),
  }).then((res) => res.json());
}

function simulateApiCall(delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // تحقق من صحة التوكين أولاً
      const tokenInput = document.getElementById("botToken");
      const token = tokenInput ? tokenInput.value : "";

      // إذا كان التوكين غير صالح، ارفض العملية
      if (!isValidToken(token)) {
        reject(new Error("Invalid Token Format"));
        return;
      }

      // تحقق من أن التوكين لا يبدأ بـ "test" أو "fake"
      if (
        token.toLowerCase().includes("test") ||
        token.toLowerCase().includes("fake")
      ) {
        reject(new Error("Test tokens are not allowed"));
        return;
      }

      // تحقق من أن اسم البوت ليس فارغاً أو قصيراً جداً
      const nameInput = document.getElementById("botName");
      const name = nameInput ? nameInput.value.trim() : "";

      if (name.length < 3) {
        reject(new Error("Bot name too short"));
        return;
      }

      // إذا كانت جميع البيانات صحيحة، انجح العملية
      resolve();
    }, delay);
  });
}

function handleCreateBot(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const botData = {
    name: formData.get("botName"),
    token: formData.get("botToken"),
    description: formData.get("botDescription"),
    platform: formData.get("botPlatform"),
  };

  // Validate form
  if (
    !botData.name ||
    !botData.token ||
    !botData.description ||
    !botData.platform
  ) {
    showError("يرجى ملء جميع الحقول المطلوبة");
    return;
  }

  // Validate token format (basic validation)
  if (!isValidToken(botData.token)) {
    showError("تنسيق التوكين غير صحيح");
    return;
  }

  const submitBtn = document.getElementById("submitBotBtn");
  setButtonLoading(submitBtn, true);

  // Simulate API call
  simulateApiCall(2000)
    .then(() => {
      return createBotViaAPI(botData); // إرسال البيانات للسيرفر
    })
    .then((response) => {
      if (response.message) {
        closeCreateBotModal();
        showSuccessModal();
        setButtonLoading(submitBtn, false);

        // إعادة تحميل الصفحة بعد ثانيتين
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error("لم يتم إنشاء البوت");
      }
    })
    .catch((error) => {
      console.error("Error creating bot:", error);

      let errorMessage = "حدث خطأ أثناء إنشاء البوت";

      if (error.message === "Invalid Token Format") {
        errorMessage =
          "تنسيق التوكين غير صحيح. تأكد من الحصول على التوكين من @BotFather";
      } else if (error.message === "Test tokens are not allowed") {
        errorMessage =
          "لا يمكن استخدام توكينات تجريبية. استخدم توكين حقيقي من @BotFather";
      } else if (error.message === "Bot name too short") {
        errorMessage = "اسم البوت قصير جداً. يجب أن يكون 3 أحرف على الأقل";
      }

      showError(errorMessage);
      setButtonLoading(submitBtn, false);
    });
}

function setFilter(filter) {
  currentFilter = filter;

  // Update filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.filter === filter) {
      btn.classList.add("active");
    }
  });

  renderBots();
}

function renderBots() {
  const botsGrid = document.getElementById("botsGrid");
  let emptyState = document.getElementById("emptyState");

  // Filter bots
  let filteredBots = bots;
  if (currentFilter !== "all") {
    filteredBots = bots.filter((bot) => bot.status === currentFilter);
  }

  if (filteredBots.length === 0) {
    // إنشاء empty state إذا لم يكن موجوداً
    if (!emptyState) {
      emptyState = document.createElement("div");
      emptyState.id = "emptyState";
      emptyState.className = "empty-state";
      emptyState.innerHTML = `
        <div class="empty-icon">
          <i class="fas fa-robot"></i>
        </div>
        <h3>لا توجد بوتات بعد</h3>
        <p>ابدأ بإنشاء أول بوت لك</p>
        <button class="btn btn-primary" onclick="showCreateBotModal()">
          <i class="fas fa-plus"></i>
          إنشاء بوت جديد
        </button>
      `;
    }

    botsGrid.innerHTML = "";
    botsGrid.appendChild(emptyState);
    return;
  }

  // إخفاء empty state إذا كان موجوداً
  if (emptyState && emptyState.parentNode) {
    emptyState.remove();
  }

  botsGrid.innerHTML = filteredBots
    .map(
      (bot) => `
    <div class="bot-card" onclick="showBotDetails('${bot.id}')">
      <div class="bot-header">
        <div class="bot-info">
          <div class="bot-name">${bot.name}</div>
          <div class="bot-platform">
            <i class="fab fa-telegram"></i>
            ${bot.platform === "telegram" ? "تليجرام" : bot.platform}
          </div>
        </div>
        <div class="bot-status ${bot.status}">
          <i class="fas fa-circle"></i>
          ${getStatusText(bot.status)}
        </div>
      </div>
      
      <div class="bot-description">
        ${bot.description}
      </div>
      
      <div class="bot-stats">
        <div class="bot-stat">
          <div class="bot-stat-number">${bot.messages}</div>
          <div class="bot-stat-label">رسالة</div>
        </div>
        <div class="bot-stat">
          <div class="bot-stat-number">${bot.users}</div>
          <div class="bot-stat-label">مستخدم</div>
        </div>
      </div>
      
      <div class="bot-actions" onclick="event.stopPropagation()">
        ${
          bot.status === "pending"
            ? `
          <button class="btn btn-outline" disabled>
            <i class="fas fa-clock"></i>
            قيد المراجعة
          </button>
        `
            : `
          <button class="btn ${
            bot.status === "active" ? "btn-danger" : "btn-success"
          }" 
                  onclick="toggleBotStatus('${bot.id}')">
            <i class="fas fa-${bot.status === "active" ? "pause" : "play"}"></i>
            ${bot.status === "active" ? "تعطيل" : "تفعيل"}
          </button>
        `
        }
        <button class="btn btn-outline" onclick="showBotDetails('${bot.id}')">
          <i class="fas fa-eye"></i>
          تفاصيل
        </button>
      </div>
    </div>
  `
    )
    .join("");
}

function updateStats() {
  const totalBots = bots.length;
  const activeBots = bots.filter((bot) => bot.status === "active").length;
  const pendingBots = bots.filter((bot) => bot.status === "pending").length;
  const totalMessages = bots.reduce((sum, bot) => sum + bot.messages, 0);

  document.getElementById("totalBots").textContent = totalBots;
  document.getElementById("activeBots").textContent = activeBots;
  document.getElementById("pendingBots").textContent = pendingBots;
  document.getElementById("totalMessages").textContent = totalMessages;
}

function getStatusText(status) {
  const statusMap = {
    pending: "قيد المراجعة",
    active: "نشط",
    disabled: "معطل",
  };
  return statusMap[status] || status;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isValidToken(token) {
  // Basic token validation (should be more comprehensive in real app)
  const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
  return tokenRegex.test(token);
}

function showSuccessModal() {
  const modal = document.getElementById("successModal");
  modal.classList.add("show");
}

function closeSuccessModal() {
  const modal = document.getElementById("successModal");
  modal.classList.remove("show");
}

function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
    z-index: 3000;
    font-weight: 500;
    animation: slideDown 0.3s ease;
  `;
  successDiv.textContent = message;

  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    z-index: 3000;
    font-weight: 500;
    animation: slideDown 0.3s ease;
  `;
  errorDiv.textContent = message;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';
  } else {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-plus"></i> إنشاء البوت';
  }
}

function toggleUserDropdown() {
  const dropdown = document.querySelector(".dropdown-menu");
  dropdown.classList.toggle("show");
}

// Terms and Privacy (placeholder functions)
function showTerms() {
  alert("شروط الخدمة - سيتم إضافة المحتوى لاحقاً");
}

function showPrivacy() {
  alert("سياسة الخصوصية - سيتم إضافة المحتوى لاحقاً");
}

// Add CSS animations
const mystyle = document.createElement("style");
mystyle.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  .detail-section {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #374151;
  }
  
  .detail-section:last-child {
    border-bottom: none;
  }
  
  .detail-section h4 {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .detail-item label {
    color: #9ca3af;
    font-size: 12px;
    font-weight: 500;
  }
  
  .detail-item span {
    color: white;
    font-size: 14px;
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    display: inline-block;
  }
  
  .status-badge.pending {
    background: rgba(245, 158, 11, 0.2);
    color: #fbbf24;
  }
  
  .status-badge.active {
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
  }
  
  .status-badge.disabled {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
  
  .stats-row {
    display: flex;
    gap: 24px;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-value {
    display: block;
    font-size: 20px;
    font-weight: bold;
    color: white;
    margin-bottom: 4px;
  }
  
  .stat-label {
    color: #9ca3af;
    font-size: 12px;
  }
  
  .detail-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }
  
  @media (max-width: 768px) {
    .detail-grid {
      grid-template-columns: 1fr;
    }
    
    .stats-row {
      justify-content: space-around;
    }
    
    .detail-actions {
      flex-direction: column;
    }
  }
`;
document.head.appendChild(mystyle);

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/me");
    const data = await res.json();

    if (data.loggedIn) {
      const user = data.user;
      document.querySelector(".user-name").textContent = user.name;
      document.querySelector(".user-plan").textContent = `الخطة: ${
        user.plan === "pro" ? "المتقدمة" : "المجانية"
      }`;
    } else {
      // لو مش مسجل دخول، رجعه للصفحة الرئيسية مثلاً
      window.location.href = "/login.html";
    }
  } catch (err) {
    console.error("❌ Error fetching user:", err);
  }
});
