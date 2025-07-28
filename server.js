require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/User");
const nodemailer = require("nodemailer");
const app = express();
const Port = process.env.Port || 3000;
const DataBase = process.env.Mongo_Url;
const secretKey = process.env.ENCRYPTION_KEY;
const botRoutes = require("./routes/bots");
// 🔐 التشفير وفك التشفير
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(encrypted) {
  const parts = encrypted.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// 🧠 إعدادات السيشن والباسبور
app.use(
  session({
    secret: "sessionSecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id || user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      if (!user) return done(null, false);
      done(null, {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    })
    .catch((err) => done(err));
});

// ✅ Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const rawEmail = profile.emails[0].value;

        const users = await User.find();
        const existingUser = users.find((u) => {
          try {
            return decrypt(u.email) === rawEmail;
          } catch {
            return false;
          }
        });

        if (existingUser) return done(null, existingUser);

        const encryptedEmail = encrypt(rawEmail);

        const newUser = new User({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName || "",
          email: encryptedEmail,
          password: "",
          phone: "",
          AcceptedTerms: true,
          newsletter: false,
          googleId: profile.id,
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
// 📦 إعدادات Express
app.use(express.json());
app.use("/api", botRoutes);
//
app.use(express.static(path.join(__dirname, "public")));

// 📄 صفحات HTML
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);
app.get("/index.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);
app.get("/login.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);
app.get("/signup.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "signup.html"))
);

app.get("/plan-user-choose", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "plan-user-choose.html"));
});

// 🔐 Middleware حماية الصفحات (اختياري)
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login.html");
}

app.get("/bot-creator.html", ensureAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "bot-creator.html"))
);

app.get("/admin/approve/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.send("❌ المستخدم غير موجود");

  user.plan = "pro";
  user.isPlanApproved = true;
  await user.save();
  res.send("✅ تم قبول خطة المستخدم");
});

app.get("/admin/reject/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.send("❌ المستخدم غير موجود");

  user.plan = "free";
  user.isPlanApproved = false;
  await user.save();
  res.send("❌ تم رفض الطلب وإرجاعه إلى الخطة المجانية");
});

// 🧾 تسجيل مستخدم
app.post("/api/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      terms,
      newsletter,
      isGoogleSignup,
    } = req.body;

    if (!isGoogleSignup && (!password || password.trim() === "")) {
      return res
        .status(400)
        .json({ message: "❌ كلمة المرور مطلوبة للتسجيل العادي" });
    }

    const users = await User.find();
    const emailExists = users.find((u) => {
      try {
        return decrypt(u.email) === email;
      } catch {
        return false;
      }
    });

    if (emailExists) {
      return res
        .status(400)
        .json({ message: "❌ البريد الإلكتروني مستخدم من قبل" });
    }

    const hashedPassword = isGoogleSignup
      ? ""
      : await bcrypt.hash(password, 10);
    const encryptedEmail = encrypt(email);
    const encryptedPhone = phone ? encrypt(phone) : "";

    const NewUser = new User({
      firstName,
      lastName,
      email: encryptedEmail,
      phone: encryptedPhone,
      password: hashedPassword,
      AcceptedTerms: terms,
      newsletter,
    });

    const savedUser = await NewUser.save();
    req.login(savedUser, (err) => {
      if (err) {
        console.error("❌ Login After Signup Failed:", err);
        return res
          .status(500)
          .json({ message: "فشل في تسجيل الدخول بعد إنشاء الحساب" });
      }

      return res.status(201).json({
        message: "✅ تم إنشاء الحساب وتسجيل الدخول بنجاح",
        redirect: "/plan-user-choose",
      });
    });
  } catch (error) {
    console.error("🔥 Signup Error:", error);
    return res
      .status(500)
      .json({ message: "❌ فشل في إنشاء الحساب", error: error.message });
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail", // أو حسب مزود البريد بتاعك
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS,
  },
});

async function sendPlanRequestEmail(user, plan) {
  const mailOptions = {
    from: `"TeleBot Creator" <${process.env.ADMIN_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `📩 طلب خطة جديدة: ${plan === "pro" ? "المتقدمة" : "المجانية"}`,
    html: `
      <h3>مستخدم اختار خطة <span style="color:${
        plan === "pro" ? "green" : "blue"
      }">${plan === "pro" ? "المتقدمة" : "المجانية"}</span>:</h3>
      <p><strong>الاسم:</strong> ${user.firstName} ${user.lastName}</p>
      <p><strong>البريد:</strong> ${decrypt(user.email)}</p>
      <p><strong>رقم الهاتف:</strong> ${
        user.phone ? decrypt(user.phone) : "غير مسجل"
      }</p>
      ${
        plan === "pro"
          ? `
        <br>
        <a href="http://localhost:${Port}/admin/approve/${user._id}" 
        style="padding:10px;background:green;color:white;text-decoration:none;">قبول</a>
        <a href="http://localhost:${Port}/admin/reject/${user._id}" 
        style="padding:10px;background:red;color:white;text-decoration:none;margin-left:10px;">رفض</a>
        `
          : ""
      }
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return console.error("❌ Mail Error:", error);
    console.log("📬 Email sent:", info.response);
  });
}

app.post("/api/choose-plan", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "❌ غير مصرح" });
  }

  const { plan } = req.body;

  if (!["free", "pro"].includes(plan)) {
    return res.status(400).json({ message: "❌ خطة غير صالحة" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (plan === "free") {
      user.plan = "free";
      user.isPlanApproved = true;
    } else if (plan === "pro") {
      user.plan = "pending";
      user.planRequestedAt = new Date();
      user.isPlanApproved = false;
    }

    await user.save();

    // ✉️ إرسال إيميل في كل الحالات
    await sendPlanRequestEmail(user, plan);

    return res.status(200).json({
      message: `✅ تم اختيار خطة ${plan === "pro" ? "المتقدمة" : "المجانية"}`,
    });
  } catch (err) {
    console.error("❌ Plan Error:", err);
    return res.status(500).json({ message: "فشل في تحديث الخطة" });
  }
});

// 🔓 تسجيل الدخول
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const users = await User.find();
  const user = users.find((u) => {
    if (!u.email || !u.password) return false; // استبعاد حسابات جوجل أو الحسابات بدون كلمة سر
    try {
      const decryptedEmail = decrypt(u.email);
      return decryptedEmail === email;
    } catch {
      return false;
    }
  });

  if (!user) {
    return res
      .status(401)
      .json({ message: "❌ الحساب غير موجود أو كلمة السر غير مدعومة" });
  }

  if (!user.password || user.password.trim() === "") {
    return res.status(401).json({
      message: "❌ هذا الحساب تم تسجيله عبر Google ولا يملك كلمة مرور",
    });
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  console.log("✅ Password Match:", isPasswordMatch);

  if (!isPasswordMatch) {
    return res
      .status(401)
      .json({ message: "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  }

  // ✅ تسجيل الجلسة
  req.login(user, (err) => {
    if (err) return res.status(500).json({ message: "فشل في تسجيل الجلسة" });

    res.status(200).json({
      message: "✅ تسجيل الدخول ناجح",
      user: {
        name: `${user.firstName} ${user.lastName}`,
        plan: user.plan || null,
      },
    });
  });
});

// 🔐 Google Auth
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login.html" }),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user.plan || user.plan === "") {
        return res.redirect("/plan-user-choose");
      }

      if (user.plan === "pending") {
        return res.redirect("/pending.html"); // لو هتعمل صفحة انتظار
      }

      // free أو pro
      return res.redirect("/bot-creator.html");
    } catch (err) {
      console.error("❌ Callback Error:", err);
      return res.redirect("/login.html");
    }
  }
);

// 🧠 بيانات المستخدم الحالي
app.get("/api/user", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { firstName, lastName, email } = req.user;
    let decryptedEmail = "";
    try {
      decryptedEmail = decrypt(email);
    } catch {
      decryptedEmail = "غير معروف";
    }

    return res.json({
      loggedIn: true,
      user: {
        name: `${firstName} ${lastName}`,
        email: decryptedEmail,
      },
    });
  } else {
    return res.json({ loggedIn: false });
  }
});

app.get("/api/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { firstName, lastName, email, plan } = req.user; // أضف plan
    let decryptedEmail = "";
    try {
      decryptedEmail = decrypt(email);
    } catch {
      decryptedEmail = "غير معروف";
    }

    return res.json({
      loggedIn: true,
      user: {
        name: `${firstName} ${lastName}`,
        email: decryptedEmail,
        plan: plan || "free", // ← أضف الخطة هنا
      },
    });
  } else {
    return res.json({ loggedIn: false });
  }
});

// 🚪 تسجيل الخروج
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "فشل في تسجيل الخروج" });
    res.redirect("/");
  });
});

// 📡 الاتصال بقاعدة البيانات
mongoose
  .connect(DataBase)
  .then(() => {
    console.log("✅ DataBase is Connected");
  })
  .catch((error) => {
    console.log("❌ The DataBase is Not Connected", error.message);
  });

module.exports = app; // ⬅️ مهم جدًا لـ Vercel

