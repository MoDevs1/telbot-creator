const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const helmet = require("helmet");
const cors = require("cors");

// Rate Limiting - حماية من الهجمات
const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات كحد أقصى
  message: {
    error: "تم تجاوز الحد المسموح من المحاولات. حاول مرة أخرى بعد 15 دقيقة.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // تخطي المستخدمين المصرح لهم
    return req.isAuthenticated && req.isAuthenticated();
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 10, // 10 محاولات تسجيل دخول
  message: {
    error:
      "تم تجاوز الحد المسموح من محاولات تسجيل الدخول. حاول مرة أخرى بعد 15 دقيقة.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب API
  message: {
    error: "تم تجاوز الحد المسموح من طلبات API. حاول مرة أخرى بعد 15 دقيقة.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictApiLimiter = rateLimit({
  windowMs: 60 * 1000, // دقيقة واحدة
  max: 10, // 10 طلبات في الدقيقة للعمليات الحساسة
  message: {
    error: "تم تجاوز الحد المسموح. حاول مرة أخرى بعد دقيقة.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF Protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

// Security Headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"], // ✅ أضف هذا السطر
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});


// CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // في الإنتاج، حدد النطاقات المسموحة فقط
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      // أضف نطاقك في الإنتاج
    ];

    if (process.env.NODE_ENV === "development") {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("غير مسموح بواسطة CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};

// Middleware للتحقق من المصادقة
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // إذا كان طلب API، أرجع JSON
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      error: "غير مصرح",
      message: "يجب تسجيل الدخول للوصول إلى هذا المورد",
    });
  }

  // وإلا أعد توجيه إلى صفحة تسجيل الدخول
  res.redirect("/login.html");
}

// Middleware للتحقق من الصلاحيات الإدارية
function ensureAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  // تحقق من كون المستخدم أدمن (يمكنك تخصيص هذا حسب نظامك)
  if (req.user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: "غير مسموح - صلاحيات إدارية مطلوبة" });
  }

  next();
}

// Middleware لحماية الملفات الحساسة
function protectSensitiveFiles(req, res, next) {
  const sensitivePatterns = [
    /\.env/,
    /package\.json/,
    /server\.js/,
    /models\//,
    /routes\//,
    /middleware\//,
    /utils\//,
    /node_modules\//,
  ];

  const isSensitive = sensitivePatterns.some((pattern) =>
    pattern.test(req.path)
  );

  if (isSensitive) {
    return res.status(403).json({ error: "الوصول مرفوض" });
  }

  next();
}

// Middleware لتسجيل الطلبات المشبوهة
function logSuspiciousActivity(req, res, next) {
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Code execution
  ];

  const isSuspicious = suspiciousPatterns.some(
    (pattern) =>
      pattern.test(req.url) ||
      pattern.test(JSON.stringify(req.body)) ||
      pattern.test(JSON.stringify(req.query))
  );

  if (isSuspicious) {
    console.warn(`🚨 Suspicious activity detected:`, {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.url,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    return res.status(400).json({ error: "طلب غير صالح" });
  }

  next();
}

module.exports = {
  createAccountLimiter,
  loginLimiter,
  apiLimiter,
  strictApiLimiter,
  csrfProtection,
  securityHeaders,
  corsOptions,
  ensureAuthenticated,
  ensureAdmin,
  protectSensitiveFiles,
  logSuspiciousActivity,
};
