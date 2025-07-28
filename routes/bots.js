const express = require("express");
const router = express.Router();
const Bot = require("../models/Bot");
const sendEmail = require("../utils/sendEmail");
const { decrypt } = require("../utils/encryption"); // 🧠 استدعاء دالة فك التشفير

// 🔐 حماية الراوت بتسجيل الدخول
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ message: "يجب تسجيل الدخول" });
}

// 🧠 إنشاء بوت جديد
router.post("/create-bot", ensureAuthenticated, async (req, res) => {
  try {
    const { name, token, description, platform } = req.body;
    const encryptedEmail = req.user.email;

    if (!name || !token || !description || !platform) {
      return res.status(400).json({ message: "كل الحقول مطلوبة" });
    }

    const decryptedEmail = decrypt(encryptedEmail); // 🔓 فك تشفير الإيميل

    const newBot = new Bot({
      name,
      token,
      description,
      platform,
      ownerEmail: encryptedEmail,
      status: "pending",
    });

    await newBot.save();

    await sendEmail({
      to: decryptedEmail,
      subject: "تم استلام البوت الخاص بك",
      html: `
        <h3>مرحبًا ${req.user.firstName || ""} 👋</h3>
        <p>تم استلام طلب إنشاء البوت <strong>${name}</strong> وهو الآن قيد المراجعة.</p>
        <p>سنقوم بمراجعته خلال 24 ساعة.</p>
        <br>
        <p>شكرًا لاستخدامك TeleBot Creator ❤️</p>
      `,
    });

    res.status(201).json({ message: "تم إنشاء البوت وهو قيد المراجعة" });
  } catch (err) {
    console.error("❌ Error creating bot:", err);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء البوت" });
  }
});

// ✅ هذا الراوت يجب أن يكون خارج البوست
router.get("/my-bots", ensureAuthenticated, async (req, res) => {
  try {
    const encryptedEmail = req.user.email;
    const bots = await Bot.find({ ownerEmail: encryptedEmail });
    res.status(200).json(bots);
  } catch (err) {
    console.error("❌ Error fetching bots:", err);
    res.status(500).json({ message: "فشل في جلب البوتات" });
  }
});

module.exports = router;
