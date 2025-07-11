require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cors = require("cors");
const User = require("./models/User");
const Bot = require("./models/Bot");
const nodemailer = require("nodemailer");
const { encrypt, decrypt } = require("./utils/encryption");
const sendEmail = require("./utils/sendEmail");

// Import security middleware
const {
  createAccountLimiter,
  loginLimiter,
  apiLimiter,
  strictApiLimiter,
  securityHeaders,
  corsOptions,
  ensureAuthenticated,
  ensureAdmin,
  protectSensitiveFiles,
  logSuspiciousActivity,
} = require("./middleware/security");

const app = express();
const Port = process.env.Port || 3000;
const DataBase = process.env.Mongo_Url;

// 🛡️ Security Middleware - يجب أن يكون في البداية
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(logSuspiciousActivity);
app.use(protectSensitiveFiles);

// 🧠 إعدادات السيشن والباسبور
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sessionSecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    },
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
        plan: user.plan,
        phone: user.phone,
        createdAt: user.createdAt,
        botUpdates: user.botUpdates,
        newsletter: user.newsletter,
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
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🛡️ Apply rate limiting to API routes
app.use("/api/", apiLimiter);
app.use("/api/signup", createAccountLimiter);
app.use("/api/login", loginLimiter);
app.use("/api/create-bot", strictApiLimiter);
app.use("/api/update-profile", strictApiLimiter);
app.use("/api/update-password", strictApiLimiter);
app.use("/api/delete-account", strictApiLimiter);

// Static files
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use(express.static(path.join(__dirname, "public")));

// 📄 Public pages (no authentication required)
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

// 🔐 Protected pages (authentication required)
app.get("/bot-creator.html", ensureAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "bot-creator.html"))
);

app.get("/profile.html", ensureAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "profile.html"))
);

app.get("/settings.html", ensureAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "settings.html"))
);

app.get("/analytics.html", ensureAuthenticated, (req, res) =>
  res.sendFile(path.join(__dirname, "public", "analytics.html"))
);

app.get("/pending.html", ensureAuthenticated, (req, res) => {
  // التحقق من أن المستخدم في حالة انتظار فعلاً
  if (req.user.plan !== "pending") {
    return res.redirect("/bot-creator.html");
  }
  res.sendFile(path.join(__dirname, "public", "pending.html"));
});

app.get("/plan-user-choose", ensureAuthenticated, (req, res) => {
  // إذا كان المستخدم لديه خطة بالفعل، أعد توجيهه
  if (req.user.plan && req.user.plan !== "") {
    if (req.user.plan === "pending") {
      return res.redirect("/pending.html");
    }
    return res.redirect("/bot-creator.html");
  }
  res.sendFile(path.join(__dirname, "public", "plan-user-choose.html"));
});

// 📧 Contact Form API
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }

    // إرسال الإيميل
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `رسالة جديدة من الموقع: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            رسالة جديدة من موقع TeleBot Creator
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">تفاصيل المرسل:</h3>
            <p><strong>الاسم:</strong> ${name}</p>
            <p><strong>البريد الإلكتروني:</strong> ${email}</p>
            <p><strong>رقم الهاتف:</strong> ${phone || "غير مسجل"}</p>
            <p><strong>الموضوع:</strong> ${subject}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h3 style="color: #333; margin-bottom: 15px;">الرسالة:</h3>
            <p style="line-height: 1.6; color: #555;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 10px;">
            <p style="margin: 0; color: #1976d2;">
              <strong>تاريخ الإرسال:</strong> ${new Date().toLocaleString(
                "ar-EG"
              )}
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${email}" 
               style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
              الرد على الرسالة
            </a>
          </div>
        </div>
      `,
    });

    res.json({ message: "تم إرسال الرسالة ��نجاح" });
  } catch (error) {
    console.error("❌ Contact Form Error:", error);
    res.status(500).json({ message: "حدث خطأ في إرسال الرسالة" });
  }
});

// 🤖 Admin routes for bot approval (admin only)
app.get("/admin/approve-bot/:botId", ensureAdmin, async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.botId);
    if (!bot) return res.send("❌ البوت غير موجود");

    bot.status = "active";
    bot.approvedAt = new Date();
    await bot.save();

    // الحصول على بيانات المستخدم
    const users = await User.find();
    const user = users.find((u) => u.email === bot.ownerEmail);
    const ownerEmail = decrypt(bot.ownerEmail);

    // إرسال إيميل للمستخدم بالموافقة
    await sendEmail({
      to: ownerEmail,
      subject: "✅ تم قبول البوت الخاص بك - TeleBot Creator",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">مبروك! تم قبول البوت الخاص بك 🎉</h2>
          <p>تم قبول البوت <strong>${bot.name}</strong> وهو الآن نشط.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3>تفاصيل البوت:</h3>
            <p><strong>الاسم:</strong> ${bot.name}</p>
            <p><strong>المنصة:</strong> ${bot.platform}</p>
            <p><strong>الحالة:</strong> نشط ✅</p>
            <p><strong>تاريخ التفعيل:</strong> ${new Date().toLocaleDateString(
              "ar-EG"
            )}</p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3>🔧 الخطوة التالية: برمجة البوت</h3>
            <p>الآن يحتاج البوت إلى برمجة مخصصة حسب احتياجاتك. للمتابعة:</p>
            
            <div style="margin: 15px 0;">
              <h4>📞 طرق التواصل:</h4>
              <p><strong>واتساب:</strong> <a href="https://wa.me/+201234567890" style="color: #25d366;">+20 123 456 7890</a></p>
              <p><strong>تليجرام:</strong> <a href="https://t.me/YourUsername" style="color: #0088cc;">@YourUsername</a></p>
              <p><strong>إيميل:</strong> <a href="mailto:${
                process.env.ADMIN_EMAIL
              }" style="color: #4f46e5;">${process.env.ADMIN_EMAIL}</a></p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://wa.me/+201234567890?text=مرحبا، تم قبول البوت ${encodeURIComponent(
                bot.name
              )} وأريد بدء البرمجة" 
                 style="display:%20تم%20قبول%20البوت%20${encodeURIComponent(
                   bot.name
                 )}%20وأريد%20بدء%20البرمجة" 
                 style="display: inline-block; padding: 12px 24px; background: #25d366; color: white; text-decoration: none; border-radius: 6px; margin: 5px;">
                💬 تواصل عبر واتساب
              </a>
            </div>
          </div>

          <p>يمكنك الآن الدخول إلى لوحة التحكم لمتابعة حالة البوت.</p>
          <a href="http://localhost:${Port}/bot-creator.html" 
             style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            الذهاب إلى لوحة التحكم
          </a>
          <p style="color: #6B7280;">شكرًا لاستخدامك TeleBot Creator ❤️</p>
        </div>
      `,
    });

    res.send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
        <h2 style="color: #10b981;">✅ تم قبول البوت بنجاح</h2>
        <p>تم قبول البوت "${bot.name}" وإرسال معلومات التواصل للمستخدم.</p>
        <p style="color: #6B7280;">يمكنك إغلاق هذه النافذة الآن.</p>
      </div>
    `);
  } catch (error) {
    console.error("❌ Error approving bot:", error);
    res.send("❌ حدث خطأ أثناء قبول البوت");
  }
});

app.get("/admin/reject-bot/:botId", ensureAdmin, async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.botId);
    if (!bot) return res.send("❌ البوت غير موجود");

    const ownerEmail = decrypt(bot.ownerEmail);

    // إرسال إيميل للمستخدم بالرفض
    await sendEmail({
      to: ownerEmail,
      subject: "❌ تم رفض البوت الخاص بك - TeleBot Creator",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">تم رفض البوت الخاص بك</h2>
          <p>نأسف لإبلاغك أنه تم رفض البوت <strong>${bot.name}</strong>.</p>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3>أسباب محتملة للرفض:</h3>
            <ul>
              <li>التوكين غير صحيح أو منتهي الصلاحية</li>
              <li>البوت مخالف لسياسات الاستخدام</li>
              <li>معلومات البوت غير مكتملة أو غير واضحة</li>
            </ul>
          </div>

          <p>يمكنك إنشاء بوت جديد بمعلومات صحيحة ومحدثة.</p>
          <a href="http://localhost:${Port}/bot-creator.html" 
             style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            إنشاء بوت جديد
          </a>
        </div>
      `,
    });

    // حذف البوت المرفوض
    await Bot.findByIdAndDelete(req.params.botId);

    res.send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center;">
        <h2 style="color: #ef4444;">❌ تم رفض البوت</h2>
        <p>تم رفض البوت "${bot.name}" وحذفه من النظام.</p>
        <p style="color: #6B7280;">يمكنك إغلاق هذه النافذة الآن.</p>
      </div>
    `);
  } catch (error) {
    console.error("❌ Error rejecting bot:", error);
    res.send("❌ حدث خطأ أثناء رفض البوت");
  }
});

// 🧾 Plan approval routes (admin only)
app.get("/admin/approve/:userId", ensureAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.send("❌ المستخدم غير موجود");

  user.plan = "pro";
  user.isPlanApproved = true;
  await user.save();
  res.send("✅ تم قبول خطة المستخدم");
});

app.get("/admin/reject/:userId", ensureAdmin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.send("❌ المستخدم غير موجود");

  user.plan = "free";
  user.isPlanApproved = false;
  await user.save();
  res.send("❌ تم رفض الطلب وإرجاعه إلى الخطة المجانية");
});

// 🔄 API Routes (protected)
app.post("/api/update-profile", ensureAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "❌ المستخدم غير موجود" });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    if (phone) {
      user.phone = encrypt(phone);
    }

    await user.save();
    res.json({ message: "✅ تم تحديث الملف الشخصي بنجاح" });
  } catch (error) {
    console.error("❌ Profile Update Error:", error);
    res.status(500).json({ message: "❌ حدث خطأ في تحديث الملف الشخصي" });
  }
});

app.post("/api/update-password", ensureAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "❌ المستخدم غير موجود" });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({
          message: "❌ هذا الحساب لا يملك كلمة مرور (تم التسجيل عبر Google)",
        });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res
        .status(400)
        .json({ message: "❌ كلمة المرور الحالية غير صحيحة" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;

    await user.save();
    res.json({ message: "✅ تم تحديث كلمة المرور بنجاح" });
  } catch (error) {
    console.error("❌ Password Update Error:", error);
    res.status(500).json({ message: "❌ حدث خطأ في تحديث كلمة المرور" });
  }
});

app.post("/api/update-notifications", ensureAuthenticated, async (req, res) => {
  try {
    const { botUpdates, newsletter } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "❌ المستخدم غير موجود" });
    }

    if (typeof botUpdates !== "undefined") {
      user.botUpdates = botUpdates;
    }
    if (typeof newsletter !== "undefined") {
      user.newsletter = newsletter;
    }

    await user.save();
    res.json({ message: "✅ تم تحديث إعدادات الإشعارات بنجاح" });
  } catch (error) {
    console.error("❌ Notifications Update Error:", error);
    res.status(500).json({ message: "❌ حدث خطأ في تحديث إعدادات الإشعارات" });
  }
});

app.delete("/api/delete-account", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // حذف جميع البوتات الخاصة بالمستخدم
    await Bot.deleteMany({ ownerId: userId });

    // حذف المستخدم
    await User.findByIdAndDelete(userId);

    // إنهاء الجلسة
    req.logout((err) => {
      if (err) {
        console.error("❌ Logout Error:", err);
      }
    });

    res.json({ message: "✅ تم حذف الحساب بنجاح" });
  } catch (error) {
    console.error("❌ Account Deletion Error:", error);
    res.status(500).json({ message: "❌ حدث خطأ في حذف الحساب" });
  }
});

// Bot API routes
const botRoutes = require("./routes/bots");
app.use("/api", botRoutes);

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
  service: "gmail",
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

app.post("/api/choose-plan", ensureAuthenticated, async (req, res) => {
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
    if (!u.email || !u.password) return false;
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

  if (!isPasswordMatch) {
    return res
      .status(401)
      .json({ message: "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  }

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
        return res.redirect("/pending.html");
      }

      return res.redirect("/bot-creator.html");
    } catch (err) {
      console.error("❌ Callback Error:", err);
      return res.redirect("/login.html");
    }
  }
);

// 🧠 بيانات المستخدم الحالي
app.get("/api/user", ensureAuthenticated, (req, res) => {
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
});

app.get("/api/me", ensureAuthenticated, (req, res) => {
  const {
    firstName,
    lastName,
    email,
    plan,
    phone,
    createdAt,
    botUpdates,
    newsletter,
  } = req.user;
  let decryptedEmail = "";
  let decryptedPhone = "";

  try {
    decryptedEmail = decrypt(email);
  } catch {
    decryptedEmail = "غير معروف";
  }

  try {
    decryptedPhone = phone ? decrypt(phone) : "";
  } catch {
    decryptedPhone = "";
  }

  return res.json({
    loggedIn: true,
    user: {
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      email: decryptedEmail,
      phone: decryptedPhone,
      plan: plan || "free",
      createdAt: createdAt,
      botUpdates: botUpdates,
      newsletter: newsletter,
    },
  });
});

// 🚪 تسجيل الخروج
app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "فشل في تسجيل الخروج" });
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "فشل في تسجيل الخروج" });
    res.redirect("/");
  });
});

// 🚫 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "الصفحة غير موجودة" });
});

// 🚨 Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "خطأ في الخادم" });
});

// 📡 الاتصال بقاعدة البيانات
mongoose
  .connect(DataBase)
  .then(() => {
    console.log("✅ DataBase is Connected");
    app.listen(Port, () => console.log(`🚀 Server: http://localhost:${Port}`));
  })
  .catch((error) => {
    console.log("❌ The DataBase is Not Connected", error.message);
  });
