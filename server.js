require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const path = require("path")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const session = require("express-session")
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("./models/User")
const nodemailer = require("nodemailer")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

const app = express()
const Port = process.env.PORT || 3000
const DataBase = process.env.MONGO_URL
const secretKey = process.env.ENCRYPTION_KEY
const botRoutes = require("./routes/bots")

// Security middleware for Vercel
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
)

// CORS configuration for Vercel
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true)

      const allowedOrigins = ["http://localhost:3000", "https://localhost:3000"]

      // Add Vercel URLs
      if (process.env.VERCEL_URL) {
        allowedOrigins.push(`https://${process.env.VERCEL_URL}`)
      }

      if (process.env.BASE_URL) {
        allowedOrigins.push(process.env.BASE_URL)
      }

      // Allow any vercel.app subdomain
      if (origin.includes(".vercel.app")) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Trust proxy for Vercel
app.set("trust proxy", 1)

// 🔐 التشفير وفك التشفير
function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(secretKey), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

function decrypt(encrypted) {
  const parts = encrypted.split(":")
  const iv = Buffer.from(parts[0], "hex")
  const encryptedText = Buffer.from(parts[1], "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(secretKey), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

// Session configuration for Vercel
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sessionSecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
    },
  }),
)

app.use(passport.initialize())
app.use(passport.session())

// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user.id || user._id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    if (!user) return done(null, false)
    done(null, {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      plan: user.plan,
    })
  } catch (err) {
    done(err)
  }
})

// Google Strategy with dynamic callback URL
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const rawEmail = profile.emails[0].value
        const users = await User.find()
        const existingUser = users.find((u) => {
          try {
            return decrypt(u.email) === rawEmail
          } catch {
            return false
          }
        })

        if (existingUser) return done(null, existingUser)

        const encryptedEmail = encrypt(rawEmail)
        const newUser = new User({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName || "",
          email: encryptedEmail,
          password: "",
          phone: "",
          AcceptedTerms: true,
          newsletter: false,
          googleId: profile.id,
        })

        await newUser.save()
        return done(null, newUser)
      } catch (err) {
        return done(err, null)
      }
    },
  ),
)

// Express configuration
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Static files configuration for Vercel
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: process.env.NODE_ENV === "production" ? "1y" : "0",
  }),
)

// API Routes
app.use("/api", botRoutes)

// HTML Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"))
})

app.get("/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"))
})

app.get("/plan-user-choose", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "plan-user-choose.html"))
})

app.get("/pending.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pending.html"))
})

app.get("/redirect-after-login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "redirect-after-login.html"))
})

// Protected routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect("/login.html")
}

app.get("/bot-creator.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bot-creator.html"))
})

app.get("/profile.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"))
})

app.get("/settings.html", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "settings.html"))
})

// Admin routes
app.get("/admin/approve/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.send("❌ المستخدم غير موجود")

    user.plan = "pro"
    user.isPlanApproved = true
    await user.save()
    res.send("✅ تم قبول خطة المستخدم")
  } catch (err) {
    console.error("Admin approve error:", err)
    res.status(500).send("❌ خطأ في الخادم")
  }
})

app.get("/admin/reject/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.send("❌ المستخدم غير موجود")

    user.plan = "free"
    user.isPlanApproved = false
    await user.save()
    res.send("❌ تم رفض الطلب وإرجاعه إلى الخطة المجانية")
  } catch (err) {
    console.error("Admin reject error:", err)
    res.status(500).send("❌ خطأ في الخادم")
  }
})

// Signup API
app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, terms, newsletter, isGoogleSignup } = req.body

    if (!isGoogleSignup && (!password || password.trim() === "")) {
      return res.status(400).json({ message: "❌ كلمة المرور مطلوبة للتسجيل العادي" })
    }

    const users = await User.find()
    const emailExists = users.find((u) => {
      try {
        return decrypt(u.email) === email
      } catch {
        return false
      }
    })

    if (emailExists) {
      return res.status(400).json({ message: "❌ البريد الإلكتروني مستخدم من قبل" })
    }

    const hashedPassword = isGoogleSignup ? "" : await bcrypt.hash(password, 10)
    const encryptedEmail = encrypt(email)
    const encryptedPhone = phone ? encrypt(phone) : ""

    const NewUser = new User({
      firstName,
      lastName,
      email: encryptedEmail,
      phone: encryptedPhone,
      password: hashedPassword,
      AcceptedTerms: terms,
      newsletter,
    })

    const savedUser = await NewUser.save()

    req.login(savedUser, (err) => {
      if (err) {
        console.error("❌ Login After Signup Failed:", err)
        return res.status(500).json({ message: "فشل في تسجيل الدخول بعد إنشاء الحساب" })
      }

      return res.status(201).json({
        message: "✅ تم إنشاء الحساب وتسجيل الدخول بنجاح",
        redirect: "/plan-user-choose",
      })
    })
  } catch (error) {
    console.error("🔥 Signup Error:", error)
    return res.status(500).json({ message: "❌ فشل في إنشاء الحساب", error: error.message })
  }
})

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
})

async function sendPlanRequestEmail(user, plan) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BASE_URL || `http://localhost:${Port}`

  const mailOptions = {
    from: `"TeleBot Creator" <${process.env.ADMIN_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `📩 طلب خطة جديدة: ${plan === "pro" ? "المتقدمة" : "المجانية"}`,
    html: `
      <h3>مستخدم اختار خطة <span style="color:${plan === "pro" ? "green" : "blue"}">${plan === "pro" ? "المتقدمة" : "المجانية"}</span>:</h3>
      <p><strong>الاسم:</strong> ${user.firstName} ${user.lastName}</p>
      <p><strong>البريد:</strong> ${decrypt(user.email)}</p>
      <p><strong>رقم الهاتف:</strong> ${user.phone ? decrypt(user.phone) : "غير مسجل"}</p>
      ${
        plan === "pro"
          ? `
        <br>
        <a href="${baseUrl}/admin/approve/${user._id}" 
        style="padding:10px;background:green;color:white;text-decoration:none;">قبول</a>
        <a href="${baseUrl}/admin/reject/${user._id}" 
        style="padding:10px;background:red;color:white;text-decoration:none;margin-left:10px;">رفض</a>
        `
          : ""
      }
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log("📬 Email sent successfully")
  } catch (error) {
    console.error("❌ Mail Error:", error)
  }
}

// Plan selection API
app.post("/api/choose-plan", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "❌ غير مصرح" })
  }

  const { plan } = req.body

  if (!["free", "pro"].includes(plan)) {
    return res.status(400).json({ message: "❌ خطة غير صالحة" })
  }

  try {
    const user = await User.findById(req.user.id)

    if (plan === "free") {
      user.plan = "free"
      user.isPlanApproved = true
    } else if (plan === "pro") {
      user.plan = "pending"
      user.planRequestedAt = new Date()
      user.isPlanApproved = false
    }

    await user.save()
    await sendPlanRequestEmail(user, plan)

    return res.status(200).json({
      message: `✅ تم اختيار خطة ${plan === "pro" ? "المتقدمة" : "المجانية"}`,
    })
  } catch (err) {
    console.error("❌ Plan Error:", err)
    return res.status(500).json({ message: "فشل في تحديث الخطة" })
  }
})

// Login API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body

  try {
    const users = await User.find()
    const user = users.find((u) => {
      if (!u.email || !u.password) return false
      try {
        const decryptedEmail = decrypt(u.email)
        return decryptedEmail === email
      } catch {
        return false
      }
    })

    if (!user) {
      return res.status(401).json({ message: "❌ الحساب غير موجود أو كلمة السر غير مدعومة" })
    }

    if (!user.password || user.password.trim() === "") {
      return res.status(401).json({
        message: "❌ هذا الحساب تم تسجيله عبر Google ولا يملك كلمة مرور",
      })
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password)

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة" })
    }

    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: "فشل في تسجيل الجلسة" })

      res.status(200).json({
        message: "✅ تسجيل الدخول ناجح",
        user: {
          name: `${user.firstName} ${user.lastName}`,
          plan: user.plan || null,
        },
      })
    })
  } catch (error) {
    console.error("❌ Login Error:", error)
    res.status(500).json({ message: "خطأ في الخادم" })
  }
})

// Google Auth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }))

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id)

      if (!user.plan || user.plan === "") {
        return res.redirect("/plan-user-choose")
      }

      if (user.plan === "pending") {
        return res.redirect("/pending.html")
      }

      return res.redirect("/bot-creator.html")
    } catch (err) {
      console.error("❌ Callback Error:", err)
      return res.redirect("/login.html")
    }
  },
)

// User info APIs
app.get("/api/user", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { firstName, lastName, email } = req.user
    let decryptedEmail = ""
    try {
      decryptedEmail = decrypt(email)
    } catch {
      decryptedEmail = "غير معروف"
    }

    return res.json({
      loggedIn: true,
      user: {
        name: `${firstName} ${lastName}`,
        email: decryptedEmail,
      },
    })
  } else {
    return res.json({ loggedIn: false })
  }
})

app.get("/api/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { firstName, lastName, email, plan } = req.user
    let decryptedEmail = ""
    try {
      decryptedEmail = decrypt(email)
    } catch {
      decryptedEmail = "غير معروف"
    }

    return res.json({
      loggedIn: true,
      user: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: decryptedEmail,
        plan: plan || "free",
      },
    })
  } else {
    return res.json({ loggedIn: false })
  }
})

// Logout APIs
app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "فشل في تسجيل الخروج" })
    res.json({ message: "تم تسجيل الخروج بنجاح" })
  })
})

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "فشل في تسجيل الخروج" })
    res.redirect("/")
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack)
  res.status(500).json({ message: "حدث خطأ في الخادم" })
})

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "index.html"))
})

// Database connection with better error handling
let isConnected = false

const connectDB = async () => {
  if (isConnected) return

  try {
    await mongoose.connect(DataBase, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    isConnected = true
    console.log("✅ Database Connected Successfully")
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message)
    throw error
  }
}

// Initialize database connection
connectDB().catch(console.error)

// Export for Vercel
module.exports = app
