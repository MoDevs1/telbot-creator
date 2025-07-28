// Auth JavaScript Functions

// Initialize auth page
document.addEventListener("DOMContentLoaded", () => {
  initAuthPage();
});

function initAuthPage() {
  // Initialize cursor for auth pages
  initCursor();

  // Initialize particles for auth pages
  initParticles();

  // Initialize form validation
  initFormValidation();

  // Initialize password strength checker
  initPasswordStrength();
}

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

// Form Validation
function initFormValidation() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const forgotForm = document.getElementById("forgotForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = loginForm.email.value;
      const password = loginForm.password.value;

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
          alert(result.message);
          window.location.href = "/redirect-after-login.html";
        } else {
          alert(result.message);
        }
      } catch (err) {
        alert("❌ حدث خطأ أثناء الاتصال بالسيرفر");
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);

    // Real-time validation
    const inputs = signupForm.querySelectorAll(".form-input");
    inputs.forEach((input) => {
      input.addEventListener("blur", validateField);
      input.addEventListener("input", () => clearError(input.id + "Error"));
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener("submit", handleForgotPassword);
  }
}

// Login Handler
async function handleLogin(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const email = formData.get("email");
  const password = formData.get("password");
  const remember = formData.get("remember");

  // Clear previous errors
  clearAllErrors();

  // Validate inputs
  let isValid = true;

  const terms = document.getElementById("terms");
  if (!terms.checked) {
    showError("termsError", "يجب الموافقة على الشروط والأحكام");
    return;
  }

  if (!email) {
    showError("emailError", "البريد الإلكتروني مطلوب");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError("emailError", "البريد الإلكتروني غير صحيح");
    isValid = false;
  }

  if (!password) {
    showError("passwordError", "كلمة المرور مطلوبة");
    isValid = false;
  }

  if (!isValid) return;

  // Show loading
  const loginBtn = document.getElementById("loginBtn");
  setButtonLoading(loginBtn, true);

  try {
    // Simulate API call
    await simulateApiCall(2000);

    // Store user data if remember me is checked
    if (remember) {
      localStorage.setItem("rememberedEmail", email);
    }

    // Simulate successful login
    showSuccess("تم تسجيل الدخول بنجاح!");

    // Redirect after success
    setTimeout(() => {
      window.location.href = "dashboard.html"; // You can create this page
    }, 1500);
  } catch (error) {
    showError("passwordError", "البريد الإلكتروني أو كلمة المرور غير صحيحة");
  } finally {
    setButtonLoading(loginBtn, false);
  }
}

// Signup Handler
async function handleSignup(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Clear previous errors
  clearAllErrors();

  // Validate all fields
  if (!validateSignupForm(formData)) {
    return;
  }

  // Collect actual values
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const password = formData.get("password");
  const terms = formData.get("terms") === "on";
  const newsletter = formData.get("newsletter") === "on";

  // Show loading
  const signupBtn = document.getElementById("signupBtn");
  setButtonLoading(signupBtn, true);

  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        password,
        terms,
        newsletter,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess(data.message || "تم إنشاء الحساب بنجاح!");
      form.reset(); // لو عايز تنظف الفورم
      window.location.href = data.redirect || "/plan-user-choose";
    } else {
      alert(data.message || "فشل في التسجيل");
    }
  } catch (error) {
    alert("حدث خطأ أثناء الإرسال");
  } finally {
    setButtonLoading(signupBtn, false);
  }
}

// Validate Signup Form
function validateSignupForm(formData) {
  let isValid = true;

  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const terms = formData.get("terms");

  // Validate first name
  if (!firstName || firstName.length < 2) {
    showError("firstNameError", "الاسم الأول يجب أن يكون حرفين على الأقل");
    isValid = false;
  }

  // Validate last name
  if (!lastName || lastName.length < 2) {
    showError("lastNameError", "الاسم الأخير يجب أن يكون حرفين على الأقل");
    isValid = false;
  }

  // Validate email
  if (!email) {
    showError("signupEmailError", "البريد الإلكتروني مطلوب");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError("signupEmailError", "البريد الإلكتروني غير صحيح");
    isValid = false;
  }

  // Validate phone (optional but if provided should be valid)
  if (phone && !isValidPhone(phone)) {
    showError("phoneError", "رقم الهاتف غير صحيح");
    isValid = false;
  }

  // Validate password
  const passwordStrength = checkPasswordStrength(password);
  if (!password) {
    showError("signupPasswordError", "كلمة المرور مطلوبة");
    isValid = false;
  } else if (passwordStrength.score < 2) {
    showError("signupPasswordError", "كلمة المرور ضعيفة جداً");
    isValid = false;
  }

  // Validate confirm password
  if (!confirmPassword) {
    showError("confirmPasswordError", "تأكيد كلمة المرور مطلوب");
    isValid = false;
  } else if (password !== confirmPassword) {
    showError("confirmPasswordError", "كلمات المرور غير متطابقة");
    isValid = false;
  }

  // Validate terms
  if (!terms) {
    showError("termsError", "يجب الموافقة على الشروط والأحكام");
    isValid = false;
  }

  return isValid;
}

// Field Validation
function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  const fieldName = field.name;

  clearError(field.id + "Error");

  switch (fieldName) {
    case "firstName":
    case "lastName":
      if (value.length < 2) {
        showError(field.id + "Error", "يجب أن يكون حرفين على الأقل");
      }
      break;
    case "email":
      if (!isValidEmail(value)) {
        showError(field.id + "Error", "البريد الإلكتروني غير صحيح");
      }
      break;
    case "phone":
      if (value && !isValidPhone(value)) {
        showError(field.id + "Error", "رقم الهاتف غير صحيح");
      }
      break;
  }
}

// Password Strength Checker
function initPasswordStrength() {
  const passwordInput = document.getElementById("signupPassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      const strength = checkPasswordStrength(this.value);
      updatePasswordStrengthUI(strength);
    });
  }
}

function checkPasswordStrength(password) {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) score++;
  else feedback.push("8 أحرف على الأقل");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("حرف صغير");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("حرف كبير");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("رقم");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("رمز خاص");

  return { score, feedback };
}

function updatePasswordStrengthUI(strength) {
  const strengthDiv = document.getElementById("passwordStrength");
  if (!strengthDiv) return;

  let strengthText = "";
  let strengthClass = "";

  if (strength.score === 0) {
    strengthDiv.innerHTML = "";
    return;
  }

  if (strength.score <= 2) {
    strengthText = "ضعيفة";
    strengthClass = "strength-weak";
  } else if (strength.score <= 3) {
    strengthText = "متوسطة";
    strengthClass = "strength-medium";
  } else {
    strengthText = "قوية";
    strengthClass = "strength-strong";
  }

  strengthDiv.innerHTML = `
        <div class="strength-bar ${strengthClass}">
            <div class="strength-fill"></div>
        </div>
        <span>كلمة المرور: ${strengthText}</span>
    `;
}

// Password Toggle
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(inputId + "Icon");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

// Forgot Password
function showForgotPassword() {
  const modal = document.getElementById("forgotModal");
  modal.classList.add("show");
}

function closeForgotPassword() {
  const modal = document.getElementById("forgotModal");
  modal.classList.remove("show");
}

async function handleForgotPassword(e) {
  e.preventDefault();

  const email = document.getElementById("forgotEmail").value;

  if (!email || !isValidEmail(email)) {
    alert("يرجى إدخال بريد إلكتروني صحيح");
    return;
  }

  try {
    await simulateApiCall(2000);
    alert("تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني");
    closeForgotPassword();
  } catch (error) {
    alert("حدث خطأ. حاول مرة أخرى");
  }
}

// Terms and Privacy Modals
function showTerms() {
  const modal = document.getElementById("termsModal");
  modal.classList.add("show");
}

function closeTerms() {
  const modal = document.getElementById("termsModal");
  modal.classList.remove("show");
}

function showPrivacy() {
  const modal = document.getElementById("privacyModal");
  modal.classList.add("show");
}

function closePrivacy() {
  const modal = document.getElementById("privacyModal");
  modal.classList.remove("show");
}

// Social Login Functions
async function loginWithGoogle() {
  showSuccess("جاري تسجيل الدخول باستخدام Google...");
  window.location.href = "/auth/google";
}

async function signupWithGoogle() {
  showSuccess("جاري إنشاء الحساب باستخدام Google...");
  window.location.href = "/auth/google";
}

// Utility Functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^(\+966|0)?[5][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  const inputElement = document.getElementById(elementId.replace("Error", ""));

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }

  if (inputElement) {
    inputElement.classList.add("error");
  }
}

function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  const inputElement = document.getElementById(elementId.replace("Error", ""));

  if (errorElement) {
    errorElement.classList.remove("show");
  }

  if (inputElement) {
    inputElement.classList.remove("error");
  }
}

function clearAllErrors() {
  const errorElements = document.querySelectorAll(".form-error");
  const inputElements = document.querySelectorAll(".form-input");

  errorElements.forEach((el) => el.classList.remove("show"));
  inputElements.forEach((el) => el.classList.remove("error"));
}

function showSuccess(message) {
  // Create a temporary success message
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

function setButtonLoading(button, loading) {
  const btnText = button.querySelector(".btn-text");
  const btnLoader = button.querySelector(".btn-loader");

  if (loading) {
    button.classList.add("loading");
    button.disabled = true;
    if (btnText) btnText.style.opacity = "0";
    if (btnLoader) btnLoader.style.display = "block";
  } else {
    button.classList.remove("loading");
    button.disabled = false;
    if (btnText) btnText.style.opacity = "1";
    if (btnLoader) btnLoader.style.display = "none";
  }
}

function simulateApiCall(delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        resolve();
      } else {
        reject(new Error("API Error"));
      }
    }, delay);
  });
}

// Close modals when clicking outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("show");
  }
});

// Add CSS animation for success message
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
