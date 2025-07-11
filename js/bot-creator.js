// Bot Creator Dashboard JavaScript - Connected to Real Database

// Global variables
let bots = []
let currentFilter = "all"
let userInfo = null

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initDashboard()
})

function initDashboard() {
  initCursor()
  initParticles()
  initEventListeners()
  loadUserInfo()
  fetchBots()
}

// Custom Cursor
function initCursor() {
  const cursor = document.getElementById("cursor")
  if (!cursor) return

  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px"
    cursor.style.top = e.clientY + "px"
  })

  const interactiveElements = document.querySelectorAll("button, a, input, textarea, select")
  interactiveElements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("cursor-hover")
    })
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("cursor-hover")
    })
  })
}

// Particles Animation
function initParticles() {
  const canvas = document.getElementById("particles-canvas")
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  let particles = []

  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener("resize", resizeCanvas)

  function createParticles() {
    particles = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.1,
      })
    }
  }

  createParticles()

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(100, 100, 100, ${particle.opacity})`
      ctx.fill()
    })

    requestAnimationFrame(animateParticles)
  }

  animateParticles()
}

// Event Listeners
function initEventListeners() {
  document.getElementById("createBotBtn")?.addEventListener("click", showCreateBotModal)
  document.getElementById("createBotForm")?.addEventListener("submit", handleCreateBot)

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter
      setFilter(filter)
    })
  })

  document.querySelector(".dropdown-btn")?.addEventListener("click", toggleUserDropdown)

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.remove("show")
    }

    if (!e.target.closest(".user-dropdown")) {
      const dropdown = document.querySelector(".dropdown-menu")
      dropdown?.classList.remove("show")
    }
  })
}

// Load User Info
async function loadUserInfo() {
  try {
    const response = await fetch("/api/me", { credentials: "include" })
    const data = await response.json()

    if (data.loggedIn) {
      userInfo = data.user
      document.querySelector(".user-name").textContent = userInfo.name
      document.querySelector(".user-plan").textContent = `الخطة: ${userInfo.plan === "pro" ? "المتقدمة" : "المجانية"}`
    } else {
      window.location.href = "/login.html"
    }
  } catch (err) {
    console.error("❌ Error loading user info:", err)
    window.location.href = "/login.html"
  }
}

// Fetch Bots from Database
async function fetchBots() {
  try {
    const response = await fetch("/api/my-bots", { credentials: "include" })

    if (!response.ok) {
      throw new Error("Failed to fetch bots")
    }

    bots = await response.json()
    updateStats()
    renderBots()
  } catch (err) {
    console.error("❌ Error fetching bots:", err)
    showError("فشل في تحميل البوتات")
  }
}

// Create Bot
async function handleCreateBot(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const botData = {
    name: formData.get("botName"),
    token: formData.get("botToken"),
    description: formData.get("botDescription"),
    platform: formData.get("botPlatform"),
  }

  // Validate form
  if (!botData.name || !botData.token || !botData.description || !botData.platform) {
    showError("يرجى ملء جميع الحقول المطلوبة")
    return
  }

  // Validate token format
  if (!isValidToken(botData.token)) {
    showError("تنسيق التوكين غير صحيح")
    return
  }

  const submitBtn = document.getElementById("submitBotBtn")
  setButtonLoading(submitBtn, true)

  try {
    const response = await fetch("/api/create-bot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(botData),
    })

    const result = await response.json()

    if (response.ok) {
      closeCreateBotModal()
      showSuccessModal()

      // Refresh bots list
      setTimeout(() => {
        fetchBots()
        closeSuccessModal()
      }, 2000)
    } else {
      throw new Error(result.message || "فشل في إنشاء البوت")
    }
  } catch (error) {
    console.error("Error creating bot:", error)
    showError(error.message || "حدث خطأ أثناء إنشاء البوت")
  } finally {
    setButtonLoading(submitBtn, false)
  }
}

// Delete Bot
async function deleteBot(botId) {
  if (!confirm("هل أنت متأكد من حذف هذا البوت؟")) {
    return
  }

  try {
    const response = await fetch(`/api/delete-bot/${botId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (response.ok) {
      showSuccess("تم حذف البوت بنجاح!")
      fetchBots() // Refresh the list
    } else {
      const result = await response.json()
      showError(result.message || "فشل في حذف البوت")
    }
  } catch (error) {
    console.error("Error deleting bot:", error)
    showError("حدث خطأ أثناء حذف البوت")
  }
}

// Update Stats
function updateStats() {
  const totalBots = bots.length
  const activeBots = bots.filter((bot) => bot.status === "active").length
  const pendingBots = bots.filter((bot) => bot.status === "pending").length

  document.getElementById("totalBots").textContent = totalBots
  document.getElementById("activeBots").textContent = activeBots
  document.getElementById("pendingBots").textContent = pendingBots
}

// Render Bots
function renderBots() {
  const botsGrid = document.getElementById("botsGrid")
  let emptyState = document.getElementById("emptyState")

  // Filter bots
  let filteredBots = bots
  if (currentFilter !== "all") {
    filteredBots = bots.filter((bot) => bot.status === currentFilter)
  }

  if (filteredBots.length === 0) {
    if (!emptyState) {
      emptyState = document.createElement("div")
      emptyState.id = "emptyState"
      emptyState.className = "empty-state"
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
      `
    }

    botsGrid.innerHTML = ""
    botsGrid.appendChild(emptyState)
    return
  }

  if (emptyState && emptyState.parentNode) {
    emptyState.remove()
  }

  botsGrid.innerHTML = filteredBots
    .map(
      (bot) => `
    <div class="bot-card" onclick="showBotDetails('${bot._id}')">
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
          <div class="bot-stat-number">0</div>
          <div class="bot-stat-label">رسالة</div>
        </div>
        <div class="bot-stat">
          <div class="bot-stat-number">0</div>
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
          <button class="btn btn-success">
            <i class="fas fa-eye"></i>
            تفاصيل
          </button>
        `
        }
        <button class="btn btn-danger" onclick="deleteBot('${bot._id}')">
          <i class="fas fa-trash"></i>
          حذف
        </button>
      </div>
    </div>
  `,
    )
    .join("")
}

// Show Bot Details
function showBotDetails(botId) {
  const bot = bots.find((b) => b._id === botId)
  if (!bot) return

  const modal = document.getElementById("botDetailsModal")
  const title = document.getElementById("botDetailsTitle")
  const content = document.getElementById("botDetailsContent")

  title.textContent = `تفاصيل ${bot.name}`

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
            <span>${bot.platform === "telegram" ? "تليجرام" : bot.platform}</span>
          </div>
          <div class="detail-item">
            <label>الحالة:</label>
            <span class="status-badge ${bot.status}">${getStatusText(bot.status)}</span>
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
      
      <div class="detail-actions">
        <button class="btn btn-danger" onclick="deleteBot('${bot._id}'); closeBotDetailsModal()">
          <i class="fas fa-trash"></i>
          حذف البوت
        </button>
      </div>
    </div>
  `

  modal.classList.add("show")
}

// UI Functions
function showCreateBotModal() {
  const modal = document.getElementById("createBotModal")
  modal.classList.add("show")
  document.getElementById("createBotForm").reset()
}

function closeCreateBotModal() {
  const modal = document.getElementById("createBotModal")
  modal.classList.remove("show")
}

function closeBotDetailsModal() {
  const modal = document.getElementById("botDetailsModal")
  modal.classList.remove("show")
}

function showSuccessModal() {
  const modal = document.getElementById("successModal")
  modal.classList.add("show")
}

function closeSuccessModal() {
  const modal = document.getElementById("successModal")
  modal.classList.remove("show")
}

function setFilter(filter) {
  currentFilter = filter

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active")
    if (btn.dataset.filter === filter) {
      btn.classList.add("active")
    }
  })

  renderBots()
}

function toggleUserDropdown() {
  const dropdown = document.querySelector(".dropdown-menu")
  dropdown.classList.toggle("show")
}

// Utility Functions
function getStatusText(status) {
  const statusMap = {
    pending: "قيد المراجعة",
    active: "نشط",
    disabled: "معطل",
  }
  return statusMap[status] || status
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function isValidToken(token) {
  const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/
  return tokenRegex.test(token)
}

function showSuccess(message) {
  const successDiv = document.createElement("div")
  successDiv.className = "success-message"
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
  `
  successDiv.textContent = message

  document.body.appendChild(successDiv)

  setTimeout(() => {
    successDiv.remove()
  }, 3000)
}

function showError(message) {
  const errorDiv = document.createElement("div")
  errorDiv.className = "error-message"
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
  `
  errorDiv.textContent = message

  document.body.appendChild(errorDiv)

  setTimeout(() => {
    errorDiv.remove()
  }, 3000)
}

function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...'
  } else {
    button.disabled = false
    button.innerHTML = '<i class="fas fa-plus"></i> إنشاء البوت'
  }
}

// Add CSS animations
const style = document.createElement("style")
style.textContent = `
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
`
document.head.appendChild(style)
