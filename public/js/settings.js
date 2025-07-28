// Settings Page JavaScript

// Initialize settings page
document.addEventListener("DOMContentLoaded", () => {
  initSettingsPage()
})

function initSettingsPage() {
  // Initialize cursor and particles
  const initCursor = () => {
    // Cursor initialization logic here
    console.log("Cursor initialized")
  }

  const initParticles = () => {
    // Particles initialization logic here
    console.log("Particles initialized")
  }

  initCursor()
  initParticles()

  // Initialize navigation
  initSettingsNavigation()

  // Initialize event listeners
  initSettingsEventListeners()

  // Load settings
  loadUserSettings()
}

// Settings navigation
function initSettingsNavigation() {
  const navItems = document.querySelectorAll(".nav-item")
  const sections = document.querySelectorAll(".settings-section")

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetSection = item.dataset.section

      // Remove active class from all nav items and sections
      navItems.forEach((nav) => nav.classList.remove("active"))
      sections.forEach((section) => section.classList.remove("active"))

      // Add active class to clicked nav item and corresponding section
      item.classList.add("active")
      document.getElementById(targetSection).classList.add("active")
    })
  })
}

// Event listeners
function initSettingsEventListeners() {
  // Settings forms
  const settingsForms = document.querySelectorAll(".settings-form")
  settingsForms.forEach((form) => {
    form.addEventListener("submit", handleSettingsSubmit)
  })

  // Toggle switches
  const toggleSwitches = document.querySelectorAll(".toggle-switch input")
  toggleSwitches.forEach((toggle) => {
    toggle.addEventListener("change", handleToggleChange)
  })

  // User dropdown
  document.querySelector(".dropdown-btn")?.addEventListener("click", toggleUserDropdown)

  // Close modals when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-dropdown")) {
      const dropdown = document.querySelector(".dropdown-menu")
      dropdown?.classList.remove("show")
    }
  })
}

// Settings handlers
function handleSettingsSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const settingsData = {}

  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    settingsData[key] = value
  }

  // Save settings
  saveUserSettings(settingsData)

  showSuccess("تم حفظ الإعدادات بنجاح!")
}

function handleToggleChange(e) {
  const toggle = e.target
  const setting = toggle.closest(".security-option, .notification-option")
  const settingName = setting.querySelector(".option-title").textContent

  if (toggle.checked) {
    showSuccess(`تم تفعيل ${settingName}`)
  } else {
    showSuccess(`تم إلغاء تفعيل ${settingName}`)
  }

  // Save toggle state
  saveToggleSetting(settingName, toggle.checked)
}

// Settings management
function loadUserSettings() {
  const savedSettings = localStorage.getItem("userSettings")
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings)
      applySettings(settings)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }
}

function saveUserSettings(settings) {
  const existingSettings = JSON.parse(localStorage.getItem("userSettings") || "{}")
  const updatedSettings = { ...existingSettings, ...settings }
  localStorage.setItem("userSettings", JSON.stringify(updatedSettings))
}

function saveToggleSetting(settingName, value) {
  const settings = JSON.parse(localStorage.getItem("userSettings") || "{}")
  settings[settingName] = value
  localStorage.setItem("userSettings", JSON.stringify(settings))
}

function applySettings(settings) {
  // Apply form values
  Object.keys(settings).forEach((key) => {
    const input = document.querySelector(`[name="${key}"]`)
    if (input) {
      input.value = settings[key]
    }
  })
}

// Specific setting functions
function endSession(sessionId) {
  if (confirm("هل أنت متأكد من إنهاء هذه الجلسة؟")) {
    // Remove session from UI
    const sessionItem = document.querySelector(`[data-session-id="${sessionId}"]`)
    if (sessionItem) {
      sessionItem.remove()
    }
    showSuccess("تم إنهاء الجلسة بنجاح!")
  }
}

function endAllOtherSessions() {
  if (confirm("هل أنت متأكد من إنهاء جميع الجلسات الأخرى؟")) {
    // Remove all non-current sessions
    const otherSessions = document.querySelectorAll(".session-item:not(.current)")
    otherSessions.forEach((session) => session.remove())
    showSuccess("تم إنهاء جميع الجلسات الأخرى!")
  }
}

function generateApiKey() {
  const keyName = prompt("أدخل اسم مفتاح API:")
  if (keyName) {
    const newKey = "tb_live_" + Math.random().toString(36).substring(2, 34)
    addApiKeyToList(keyName, newKey)
    showSuccess("تم إنشاء مفتاح API جديد!")
  }
}

function addApiKeyToList(name, key) {
  const apiKeys = document.querySelector(".api-keys")
  const keyItem = document.createElement("div")
  keyItem.className = "api-key-item"
  keyItem.innerHTML = `
    <div class="key-info">
      <div class="key-name">${name}</div>
      <div class="key-value">${key}</div>
      <div class="key-created">تم الإنشاء: ${new Date().toLocaleDateString("ar-SA")}</div>
    </div>
    <div class="key-actions">
      <button class="btn-icon" title="نسخ" onclick="copyApiKey('${key}')">
        <i class="fas fa-copy"></i>
      </button>
      <button class="btn-icon" title="حذف" onclick="deleteApiKey(this)">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `
  apiKeys.appendChild(keyItem)
}

function copyApiKey(key) {
  navigator.clipboard.writeText(key).then(() => {
    showSuccess("تم نسخ مفتاح API!")
  })
}

function deleteApiKey(button) {
  if (confirm("هل أنت متأكد من حذف مفتاح API؟")) {
    button.closest(".api-key-item").remove()
    showSuccess("تم حذف مفتاح API!")
  }
}

function addWebhook() {
  const url = prompt("أدخل URL الخاص بـ Webhook:")
  if (url) {
    // Add webhook logic here
    showSuccess("تم إضافة Webhook بنجاح!")
  }
}

function requestDataExport() {
  if (confirm("هل تريد طلب تصدير بياناتك؟ ستتلقى رابط التحميل عبر البريد الإلكتروني.")) {
    showSuccess("تم طلب تصدير البيانات! ستتلقى رابط التحميل قريباً.")
  }
}

function deleteAccount() {
  const confirmation = prompt('اكتب "حذف حسابي" لتأكيد حذف الحساب:')
  if (confirmation === "حذف حسابي") {
    if (confirm("هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟")) {
      // Clear all data
      localStorage.clear()
      showSuccess("تم حذف الحساب. سيتم توجيهك للصفحة الرئيسية.")

      setTimeout(() => {
        window.location.href = "index.html"
      }, 2000)
    }
  } else if (confirmation !== null) {
    showError("النص المدخل غير صحيح")
  }
}

function addPaymentMethod() {
  showSuccess("سيتم فتح نافذة إضافة طريقة دفع جديدة قريباً!")
}

function changePlan() {
  showSuccess("سيتم فتح نافذة تغيير الخطة قريباً!")
}

function cancelSubscription() {
  if (confirm("هل أنت متأكد من إلغاء الاشتراك؟")) {
    showSuccess("تم إلغاء الاشتراك. ستبقى الخدمة متاحة حتى نهاية الفترة المدفوعة.")
  }
}

function manageBilling() {
  showSuccess("سيتم فتح صفحة إدارة الفواتير قريباً!")
}

function toggleUserDropdown() {
  const dropdown = document.querySelector(".dropdown-menu")
  dropdown.classList.toggle("show")
}

function logout() {
  if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
    // Clear user data
    localStorage.removeItem("userProfile")
    localStorage.removeItem("userBots")
    localStorage.removeItem("userSettings")

    // Show logout message
    showSuccess("تم تسجيل الخروج بنجاح!")

    // Redirect to login page
    setTimeout(() => {
      window.location.href = "login.html"
    }, 1500)
  }
}

// Utility functions
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
