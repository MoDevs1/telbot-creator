// Profile Page JavaScript

// Initialize profile page
document.addEventListener("DOMContentLoaded", () => {
  initProfilePage();
});

function initProfilePage() {
  // Initialize cursor and particles
  const initCursor = () => {
    // Placeholder for cursor initialization logic
    console.log("Cursor initialized");
  };
  const initParticles = () => {
    // Placeholder for particles initialization logic
    console.log("Particles initialized");
  };
  initCursor();
  initParticles();

  // Initialize tabs
  initTabs();

  // Initialize event listeners
  initProfileEventListeners();

  // Load user data
  loadUserProfile();
}

// Tab functionality
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.dataset.tab;

      // Remove active class from all tabs and panes
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      // Add active class to clicked tab and corresponding pane
      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
    });
  });
}

// Event listeners
function initProfileEventListeners() {
  // Edit profile form
  const editProfileForm = document.getElementById("editProfileForm");
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", handleEditProfile);
  }

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

// Profile functions
function editProfile() {
  const modal = document.getElementById("editProfileModal");
  modal.classList.add("show");
}

function closeEditProfile() {
  const modal = document.getElementById("editProfileModal");
  modal.classList.remove("show");
}

function handleEditProfile(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const profileData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    birthdate: formData.get("birthdate"),
    country: formData.get("country"),
  };

  // Simulate API call
  showSuccess("تم تحديث الملف الشخصي بنجاح!");
  closeEditProfile();

  // Update profile display
  updateProfileDisplay(profileData);
}

function updateProfileDisplay(data) {
  // Update profile name
  const profileName = document.querySelector(".profile-name");
  if (profileName) {
    profileName.textContent = `${data.firstName} ${data.lastName}`;
  }

  // Update email
  const profileEmail = document.querySelector(".profile-email");
  if (profileEmail) {
    profileEmail.textContent = data.email;
  }

  // Update user menu
  const userName = document.querySelector(".user-name");
  if (userName) {
    userName.textContent = data.firstName;
  }
}

function changeAvatar() {
  // Create file input
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const profileImage = document.getElementById("profileImage");
        if (profileImage) {
          profileImage.src = e.target.result;
        }
        showSuccess("تم تحديث الصورة الشخصية بنجاح!");
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function changeCover() {
  // Create file input
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const profileCover = document.querySelector(".profile-cover");
        if (profileCover) {
          profileCover.style.backgroundImage = `url(${e.target.result})`;
          profileCover.style.backgroundSize = "cover";
          profileCover.style.backgroundPosition = "center";
        }
        showSuccess("تم تحديث صورة الغلاف بنجاح!");
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

async function shareProfile() {
  if (navigator.share) {
   await navigator.share({
      title: "ملفي الشخصي - TeleBot Creator",
      text: "تحقق من ملفي الشخصي على TeleBot Creator",
      url: window.location.href,
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      showSuccess("تم نسخ رابط الملف الشخصي!");
    });
  }
}

function editPersonalInfo() {
  editProfile();
}

function loadUserProfile() {
  // Load user profile data from localStorage or API
  const savedProfile = localStorage.getItem("userProfile");
  if (savedProfile) {
    try {
      const profile = JSON.parse(savedProfile);
      updateProfileDisplay(profile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }
}

function toggleUserDropdown() {
  const dropdown = document.querySelector(".dropdown-menu");
  dropdown.classList.toggle("show");
}

function logout() {
  if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
    // Clear user data
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userBots");

    // Show logout message
    showSuccess("تم تسجيل الخروج بنجاح!");

    // Redirect to login page
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
}

// Utility functions
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
`;
document.head.appendChild(style);
