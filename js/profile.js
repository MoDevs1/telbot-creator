// Profile Page JavaScript - Connected to Real Database

let userInfo = null;
let userBots = [];
let selectedAvatarFile = null;

// Initialize profile page
document.addEventListener("DOMContentLoaded", () => {
  initProfilePage();
});

function initProfilePage() {
  initCursor();
  initParticles();
  initEventListeners();
  loadUserProfile();
  loadUserBots();
}

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
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.2 + 0.1,
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

// Event listeners
function initEventListeners() {
  // Edit profile form
  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", handleEditProfile);
  }

  // User dropdown
  const dropdownBtn = document.querySelector(".dropdown-btn");
  if (dropdownBtn) {
    dropdownBtn.addEventListener("click", toggleUserDropdown);
  }

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Edit profile buttons
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const editInfoBtn = document.getElementById("edit-info-btn");
  if (editProfileBtn) editProfileBtn.addEventListener("click", editProfile);
  if (editInfoBtn) editInfoBtn.addEventListener("click", editProfile);

  // Modal close buttons
  const closeEditProfile = document.getElementById("close-edit-profile");
  const cancelEdit = document.getElementById("cancel-edit");
  if (closeEditProfile)
    closeEditProfile.addEventListener("click", closeEditProfile);
  if (cancelEdit) cancelEdit.addEventListener("click", closeEditProfile);

  // Avatar upload
  const changeAvatarBtn = document.getElementById("change-avatar-btn");
  const avatarInput = document.getElementById("avatar-input");
  const selectAvatarBtn = document.getElementById("select-avatar-btn");
  const uploadAvatarBtn = document.getElementById("upload-avatar-btn");
  const closeAvatarModal = document.getElementById("close-avatar-modal");

  if (changeAvatarBtn)
    changeAvatarBtn.addEventListener("click", openAvatarModal);
  if (selectAvatarBtn)
    selectAvatarBtn.addEventListener("click", () => avatarInput.click());
  if (uploadAvatarBtn) uploadAvatarBtn.addEventListener("click", uploadAvatar);
  if (closeAvatarModal)
    closeAvatarModal.addEventListener("click", closeAvatarUploadModal);
  if (avatarInput)
    avatarInput.addEventListener("change", handleAvatarSelection);

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

// Load User Profile from Database
async function loadUserProfile() {
  try {
    const response = await fetch("/api/me", { credentials: "include" });
    const data = await response.json();

    if (data.loggedIn) {
      userInfo = data.user;
      updateProfileDisplay(userInfo);
      updateUserMenu(userInfo);
    } else {
      window.location.href = "/login.html";
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    window.location.href = "/login.html";
  }
}

// Load User Bots from Database
async function loadUserBots() {
  try {
    const response = await fetch("/api/my-bots", { credentials: "include" });
    if (response.ok) {
      userBots = await response.json();
      updateBotsDisplay();
      updateStats();
    } else {
      document.getElementById("bots-list").innerHTML = `
        <div class="empty-state">
          <i class="fas fa-robot"></i>
          <p>لا توجد بوتات بعد</p>
          <a href="bot-creator.html" class="btn btn-primary">إنشاء بوت جديد</a>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading bots:", error);
    document.getElementById("bots-list").innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>حدث خطأ في تحميل البوتات</p>
      </div>
    `;
  }
}

// Update Profile Display
function updateProfileDisplay(user) {
  // Header
  document.getElementById("header-user-name").textContent = user.name;
  document.getElementById("header-user-plan").textContent = getPlanText(
    user.plan
  );

  // Profile section
  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-email").textContent = user.email;

  // Avatar
  const avatarImg = document.getElementById("profile-avatar-img");
  const defaultAvatar = document.getElementById("default-avatar");

  if (user.avatar) {
    avatarImg.src = user.avatar;
    avatarImg.style.display = "block";
    defaultAvatar.style.display = "none";
  } else {
    avatarImg.style.display = "none";
    defaultAvatar.style.display = "block";
  }

  // Plan badge
  const planBadge = document.getElementById("plan-badge");
  const planText = document.getElementById("plan-text");
  planText.textContent = getPlanText(user.plan);

  if (user.plan === "pro") {
    planBadge.classList.add("premium");
  } else {
    planBadge.classList.remove("premium");
  }

  // Personal information
  document.getElementById("full-name").textContent = user.name;
  document.getElementById("email-display").textContent = user.email;
  document.getElementById("phone-display").textContent =
    user.phone || "غير محدد";
  document.getElementById("join-date").textContent = formatDate(user.createdAt);
  document.getElementById("account-type").textContent = getPlanText(user.plan);

  // Update form fields
  const nameParts = user.name.split(" ");
  document.getElementById("firstName").value = nameParts[0] || "";
  document.getElementById("lastName").value =
    nameParts.slice(1).join(" ") || "";
  document.getElementById("phone").value = user.phone || "";
}

// Update User Menu
function updateUserMenu(user) {
  const userName = document.querySelector(".user-name");
  const userPlan = document.querySelector(".user-plan");

  if (userName) userName.textContent = user.name;
  if (userPlan) userPlan.textContent = getPlanText(user.plan);
}

// Update Bots Display
function updateBotsDisplay() {
  const botsList = document.getElementById("bots-list");

  if (userBots.length === 0) {
    botsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-robot"></i>
        <p>لا توجد بوتات بعد</p>
        <a href="bot-creator.html" class="btn btn-primary">إنشاء بوت جديد</a>
      </div>
    `;
    return;
  }

  botsList.innerHTML = userBots
    .map(
      (bot) => `
    <div class="bot-item">
      <div class="bot-info">
        <div class="bot-name">${bot.name}</div>
        <div class="bot-platform">${bot.platform}</div>
        <div class="bot-description">${bot.description}</div>
      </div>
      <div class="bot-status">
        <span class="status-badge ${bot.status}">
          ${getStatusText(bot.status)}
        </span>
      </div>
      <div class="bot-actions">
        <button class="btn-icon" title="إعدادات" data-bot-id="${bot._id}">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners to bot action buttons
  document.querySelectorAll(".btn-icon[data-bot-id]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const botId = e.currentTarget.getAttribute("data-bot-id");
      editBot(botId);
    });
  });
}

// Update Stats
function updateStats() {
  const totalBots = userBots.length;
  const activeBots = userBots.filter((bot) => bot.status === "active").length;
  const pendingBots = userBots.filter((bot) => bot.status === "pending").length;
  const memberSince = calculateDaysSinceJoin(userInfo?.createdAt);

  document.getElementById("total-bots").textContent = totalBots;
  document.getElementById("active-bots").textContent = activeBots;
  document.getElementById("pending-bots").textContent = pendingBots;
  document.getElementById("member-since").textContent = memberSince;
}

// Avatar functions
function openAvatarModal() {
  const modal = document.getElementById("avatarUploadModal");
  modal.classList.add("show");

  // Reset modal state
  selectedAvatarFile = null;
  const previewImg = document.getElementById("avatar-preview-img");
  const overlay = document.querySelector(".avatar-overlay");
  const uploadBtn = document.getElementById("upload-avatar-btn");

  previewImg.style.display = "none";
  overlay.style.display = "flex";
  uploadBtn.disabled = true;
}

function closeAvatarUploadModal() {
  const modal = document.getElementById("avatarUploadModal");
  modal.classList.remove("show");
}

function handleAvatarSelection(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file
  if (!file.type.startsWith("image/")) {
    showError("يرجى اختيار ملف صورة صحيح");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    showError("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
    return;
  }

  selectedAvatarFile = file;

  // Preview image
  const reader = new FileReader();
  reader.onload = (e) => {
    const previewImg = document.getElementById("avatar-preview-img");
    const overlay = document.querySelector(".avatar-overlay");
    const uploadBtn = document.getElementById("upload-avatar-btn");

    previewImg.src = e.target.result;
    previewImg.style.display = "block";
    overlay.style.display = "none";
    uploadBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

async function uploadAvatar() {
  if (!selectedAvatarFile) return;

  const uploadBtn = document.getElementById("upload-avatar-btn");
  const originalText = uploadBtn.innerHTML;

  try {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';

    const formData = new FormData();
    formData.append("avatar", selectedAvatarFile);

    const response = await fetch("/api/upload-avatar", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      showSuccess("تم تحديث الصورة الشخصية بنجاح!");
      closeAvatarUploadModal();

      // Update avatar display
      const avatarImg = document.getElementById("profile-avatar-img");
      const defaultAvatar = document.getElementById("default-avatar");

      avatarImg.src = result.avatarUrl;
      avatarImg.style.display = "block";
      defaultAvatar.style.display = "none";

      // Update user info
      userInfo.avatar = result.avatarUrl;
    } else {
      showError(result.message || "حدث خطأ في رفع الصورة");
    }
  } catch (error) {
    console.error("Error uploading avatar:", error);
    showError("حدث خطأ في رفع الصورة");
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = originalText;
  }
}

// Profile functions
function editProfile() {
  const modal = document.getElementById("editProfileModal");
  modal.classList.add("show");
}

function closeEditProfile() {
  const modal = document.getElementById("editProfileModal");
  modal.classList.remove("show");
}

async function handleEditProfile(e) {
  e.preventDefault();

  const formData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    phone: document.getElementById("phone").value,
  };

  try {
    const response = await fetch("/api/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      showSuccess("تم تحديث الملف الشخصي بنجاح!");
      closeEditProfile();
      // Reload profile data
      await loadUserProfile();
    } else {
      showError(result.message || "حدث خطأ في تحديث الملف الشخصي");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showError("حدث خطأ في تحديث الملف الشخصي");
  }
}

function toggleUserDropdown() {
  const dropdown = document.querySelector(".dropdown-menu");
  dropdown.classList.toggle("show");
}

function logout(e) {
  e.preventDefault();
  if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
    window.location.href = "/logout";
  }
}

function editBot(botId) {
  // Redirect to bot editor or show edit modal
  showSuccess("سيتم إضافة محرر البوتات قريباً!");
}

// Utility functions
function getPlanText(plan) {
  const planMap = {
    free: "الخطة المجانية",
    pro: "الخطة المتقدمة",
    pending: "قيد المراجعة",
  };
  return planMap[plan] || "غير محدد";
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
  if (!dateString) return "غير محدد";
  const date = new Date(dateString);
  return date.toLocaleDateString("ar-EG");
}

function calculateDaysSinceJoin(dateString) {
  if (!dateString) return "0";
  const joinDate = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today - joinDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays.toString();
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

// Add CSS animations
const style = document.createElement("style");
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
  
  .empty-state, .error-state {
    text-align: center;
    padding: 40px;
    color: #6B7280;
  }
  
  .empty-state i, .error-state i {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .bot-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 10px;
    background: white;
  }

  .bot-info {
    flex: 1;
  }

  .bot-name {
    font-weight: 600;
    margin-bottom: 5px;
  }

  .bot-platform {
    color: #6B7280;
    font-size: 14px;
    margin-bottom: 5px;
  }

  .bot-description {
    color: #374151;
    font-size: 14px;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-badge.pending {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.active {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.disabled {
    background: #fee2e2;
    color: #991b1b;
  }

  .loading-message {
    text-align: center;
    padding: 20px;
    color: #6B7280;
  }
`;
document.head.appendChild(style);
