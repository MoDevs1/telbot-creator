// Settings Page JavaScript - Connected to Real Database

let userInfo = null

// Initialize settings page
document.addEventListener("DOMContentLoaded", () => {
  initSettingsPage()
})

function initSettingsPage() {
  initCursor()
  initParticles()
  initEventListeners()
  loadUserSettings()
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
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.2 + 0.1,
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

// Event listeners
function initEventListeners() {
  // Profile form
  const profileForm = document.getElementById("profile-form")
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileUpdate)
  }

  // Password form
  const passwordForm = document.getElementById("password-form")
  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordUpdate)
  }

  // User dropdown
  document.querySelector(".dropdown-btn")?.addEventListener("click", toggleUserDropdown)

  // Notification toggles
  const toggleSwitches = document.querySelectorAll(".toggle-switch input")
  toggleSwitches.forEach((toggle) => {
    toggle.addEventListener("change", handleToggleChange)
  })
}

// Load User Settings from Database
async function loadUserSettings() {
  try {
    const response = await fetch("/api/me", { credentials: "include" })
    const data = await response.json()

    if (data.loggedIn) {
      userInfo = data.user
      updateUserMenu(userInfo)
      populateUserForms(userInfo)
      updatePlanInfo(userInfo)
    } else {
      window.location.href = "/login.html"
    }
  } catch (error) {
    console.error("Error loading user settings:", error)
    window.location.href = "/login.html"
  }
}

// Update User Menu
function updateUserMenu(user) {
  document.getElementById("header-user-name").textContent = user.name
  document.getElementById("header-user-plan").textContent = getPlanText(user.plan)
}

// Populate User Forms
function populateUserForms(user) {
  const nameParts = user.name.split(" ")

  document.getElementById("firstName").value = nameParts[0] || ""
  document.getElementById("lastName").value = nameParts.slice(1).join(" ") || ""
  document.getElementById("email").value = user.email || ""
  document.getElementById("phone").value = user.phone || ""

  // Set notification preferences
  document.getElementById("botUpdates").checked = user.botUpdates !== false
  document.getElementById("newsletter").checked = user.newsletter === true
}

// Update Plan Information
function updatePlanInfo(user) {
  document.getElementById("current-plan").textContent = getPlanText(user.plan)

  const statusElement = document.getElementById("plan-status")
  if (user.plan === "pending") {
    statusElement.textContent = "قيد المراجعة"
    statusElement.style.color = "#f59e0b"
  } else if (user.plan === "pro") {
    statusElement.textContent = "نشط"
    statusElement.style.color = "#10b981"
  } else {
    statusElement.textContent = "نشط"
    statusElement.style.color = "#6b7280"
  }
}

// Handle Profile Update
async function handleProfileUpdate(e) {
  e.preventDefault()

  const formData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    phone: document.getElementById("phone").value,
  }

  try {
    const response = await fetch("/api/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    })

    const result = await response.json()

    if (response.ok) {
      showSuccess("تم تحديث المعلومات بنجاح!")
      // Reload user data
      await loadUserSettings()
    } else {
      showError(result.message || "حدث خطأ في تحديث المعلومات")
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    showError("حدث خطأ في تحديث المعلومات")
  }
}

// Handle Password Update
async function handlePasswordUpdate(e) {
  e.preventDefault()

  const currentPassword = document.getElementById("currentPassword").value
  const newPassword = document.getElementById("newPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value

  if (newPassword !== confirmPassword) {
    showError("كلمة المرور الجديدة غير متطابقة")
    return
  }

  if (newPassword.length < 6) {
    showError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    return
  }

  try {
    const response = await fetch("/api/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    })

    const result = await response.json()

    if (response.ok) {
      showSuccess("تم تحديث كلمة المرور بنجاح!")
      // Clear form
      document.getElementById("password-form").reset()
    } else {
      showError(result.message || "حدث خطأ في تحديث كلمة المرور")
    }
  } catch (error) {
    console.error("Error updating password:", error)
    showError("حدث خطأ في تحديث كلمة المرور")
  }
}

// Handle Toggle Changes
function handleToggleChange(e) {
  const toggle = e.target
  const setting = toggle.id
  const value = toggle.checked

  // Save notification preference
  saveNotificationSetting(setting, value)
}

// Save Notification Setting
async function saveNotificationSetting(setting, value) {
  try {
    const response = await fetch("/api/update-notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        [setting]: value,
      }),
    })

    if (response.ok) {
      showSuccess(`تم ${value ? "تفعيل" : "إلغاء تفعيل"} الإشعارات`)
    }
  } catch (error) {
    console.error("Error updating notification setting:", error)
  }
}

// Save All Notification Settings
async function saveNotificationSettings() {
  const botUpdates = document.getElementById("botUpdates").checked
  const newsletter = document.getElementById("newsletter").checked

  try {
    const response = await fetch("/api/update-notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        botUpdates,
        newsletter,
      }),
    })

    if (response.ok) {
      showSuccess("تم حفظ إعدادات الإشعارات بنجاح!")
    } else {
      showError("حدث خطأ في حفظ الإعدادات")
    }
  } catch (error) {
    console.error("Error saving notification settings:", error)
    showError("حدث خطأ في حفظ الإعدادات")
  }
}

// Delete Account
function deleteAccount() {
  const confirmation = prompt('اكتب "حذف حسابي" لتأكيد حذف الحساب:')
  if (confirmation === "حذف حسابي") {
    if (confirm("هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟")) {
      performAccountDeletion()
    }
  } else if (confirmation !== null) {
    showError("النص المدخل غير صحيح")
  }
}

// Perform Account Deletion
async function performAccountDeletion() {
  try {
    const response = await fetch("/api/delete-account", {
      method: "DELETE",
      credentials: "include",
    })

    if (response.ok) {
      alert("تم حذف الحساب بنجاح. سيتم توجيهك إلى الصفحة الرئيسية.")
      window.location.href = "/"
    } else {
      showError("حدث خطأ في حذف الحساب")
    }
  } catch (error) {
    console.error("Error deleting account:", error)
    showError("حدث خطأ في حذف الحساب")
  }
}

function toggleUserDropdown() {
  const dropdown = document.querySelector(".dropdown-menu")
  dropdown.classList.toggle("show")
}

function logout() {
  if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
    window.location.href = "/logout"
  }
}

// Utility functions
function getPlanText(plan) {
  const planMap = {
    free: "الخطة المجانية",
    pro: "الخطة المتقدمة",
    pending: "قيد المراجعة",
  }
  return planMap[plan] || "غير محدد"
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
