const express = require("express")
const router = express.Router()
const Bot = require("../models/Bot")
const User = require("../models/User")
const { encrypt, decrypt } = require("../utils/encryption")
const sendEmail = require("../utils/sendEmail")

// Middleware للتحقق من تسجيل الدخول
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next()
  }
  return res.status(401).json({ message: "❌ غير مصرح" })
}

// إنشاء بوت جديد
router.post("/create-bot", ensureAuthenticated, async (req, res) => {
  try {
    const { name, description, platform, token } = req.body

    // التحقق من البيانات المطلوبة
    if (!name || !description || !platform || !token) {
      return res.status(400).json({ message: "❌ جميع الحقول مطلوبة" })
    }

    // تشفير التوكين
    const encryptedToken = encrypt(token)

    // إنشاء البوت
    const newBot = new Bot({
      name,
      description,
      platform,
      token: encryptedToken,
      ownerId: req.user.id,
      ownerEmail: req.user.email,
      status: "pending",
    })

    const savedBot = await newBot.save()

    // الحصول على بيانات المستخدم
    const user = await User.findById(req.user.id)
    const ownerEmail = decrypt(req.user.email)

    // إرسال إيميل للأدمن للموافقة
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `🤖 طلب موافقة على بوت جديد: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">طلب موافقة على بوت جديد 🤖</h2>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>تفاصيل البوت:</h3>
            <p><strong>اسم البوت:</strong> ${name}</p>
            <p><strong>الوصف:</strong> ${description}</p>
            <p><strong>المنصة:</strong> ${platform}</p>
            <p><strong>التوكين:</strong> ${token.substring(0, 10)}...</p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>معلومات المالك:</h3>
            <p><strong>الاسم:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>البريد:</strong> ${ownerEmail}</p>
            <p><strong>الخطة:</strong> ${user.plan === "pro" ? "المتقدمة" : "المجانية"}</p>
            <p><strong>رقم الهاتف:</strong> ${user.phone ? decrypt(user.phone) : "غير محدد"}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:${process.env.Port || 3000}/admin/approve-bot/${savedBot._id}" 
               style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 0 10px;">
              ✅ قبول البوت
            </a>
            <a href="http://localhost:${process.env.Port || 3000}/admin/reject-bot/${savedBot._id}" 
               style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 0 10px;">
              ❌ رفض البوت
            </a>
          </div>

          <p style="color: #6B7280; font-size: 14px;">تم إرسال هذا الطلب تلقائياً من منصة TeleBot Creator</p>
        </div>
      `,
    })

    // إرسال إيميل تأكيد للمستخدم
    await sendEmail({
      to: ownerEmail,
      subject: "📩 تم استلام طلب إنشاء البوت - TeleBot Creator",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">تم استلام طلبك بنجاح! 📩</h2>
          <p>شكراً لك على استخدام TeleBot Creator. تم استلام طلب إنشاء البوت الخاص بك.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3>تفاصيل البوت المرسل:</h3>
            <p><strong>اسم البوت:</strong> ${name}</p>
            <p><strong>المنصة:</strong> ${platform}</p>
            <p><strong>الحالة:</strong> قيد المراجعة ⏳</p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3>ماذا يحدث الآن؟</h3>
            <ul style="margin: 10px 0; padding-right: 20px;">
              <li>سيتم مراجعة البوت من قبل فريقنا</li>
              <li>سنتحقق من صحة التوكين والمعلومات</li>
              <li>ستتلقى إشعاراً بالموافقة أو الرفض خلال 24 ساعة</li>
              <li>في حالة الموافقة، ستحصل على معلومات التواصل للبرمجة</li>
            </ul>
          </div>

          <p>يمكنك متابعة حالة البوت من لوحة التحكم الخاصة بك.</p>
          <a href="http://localhost:${process.env.Port || 3000}/bot-creator.html" 
             style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            الذهاب إلى لوحة التحكم
          </a>
          
          <p style="color: #6B7280;">شكرًا لثقتك في TeleBot Creator ❤️</p>
        </div>
      `,
    })

    res.status(201).json({
      message: "✅ تم إنشاء البوت بنجاح وإرساله للمراجعة",
      bot: {
        id: savedBot._id,
        name: savedBot.name,
        status: savedBot.status,
      },
    })
  } catch (error) {
    console.error("❌ Bot Creation Error:", error)
    res.status(500).json({ message: "❌ حدث خطأ في إنشاء البوت" })
  }
})

// جلب البوتات الخاصة بالمستخدم
router.get("/my-bots", ensureAuthenticated, async (req, res) => {
  try {
    const bots = await Bot.find({ ownerId: req.user.id }).select("-token").sort({ createdAt: -1 })

    res.json(bots)
  } catch (error) {
    console.error("❌ Error fetching bots:", error)
    res.status(500).json({ message: "❌ حدث خطأ في جلب البوتات" })
  }
})

// جلب تفاصيل بوت محدد
router.get("/bot/:id", ensureAuthenticated, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, ownerId: req.user.id }).select("-token")

    if (!bot) {
      return res.status(404).json({ message: "❌ البوت غير موجود" })
    }

    res.json(bot)
  } catch (error) {
    console.error("❌ Error fetching bot:", error)
    res.status(500).json({ message: "❌ حدث خطأ في جلب البوت" })
  }
})

// تحديث بوت
router.put("/bot/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body
    const bot = await Bot.findOne({ _id: req.params.id, ownerId: req.user.id })

    if (!bot) {
      return res.status(404).json({ message: "❌ البوت غير موجود" })
    }

    // يمكن تحديث الاسم والوصف فقط
    if (name) bot.name = name
    if (description) bot.description = description

    await bot.save()

    res.json({ message: "✅ تم تحديث البوت بنجاح" })
  } catch (error) {
    console.error("❌ Error updating bot:", error)
    res.status(500).json({ message: "❌ حدث خطأ في تحديث البوت" })
  }
})

// حذف بوت
router.delete("/bot/:id", ensureAuthenticated, async (req, res) => {
  try {
    const bot = await Bot.findOne({ _id: req.params.id, ownerId: req.user.id })

    if (!bot) {
      return res.status(404).json({ message: "❌ البوت غير موجود" })
    }

    await Bot.findByIdAndDelete(req.params.id)

    res.json({ message: "✅ تم حذف البوت بنجاح" })
  } catch (error) {
    console.error("❌ Error deleting bot:", error)
    res.status(500).json({ message: "❌ حدث خطأ في حذف البوت" })
  }
})

module.exports = router
