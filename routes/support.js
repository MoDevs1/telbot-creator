const express = require("express")
const router = express.Router()
const SupportTicket = require("../models/SupportTicket")
const sendEmail = require("../utils/sendEmail")
const { decrypt } = require("../utils/encryption")

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next()
  res.status(401).json({ message: "يجب تسجيل الدخول" })
}

// Create new support ticket
router.post("/tickets", ensureAuthenticated, async (req, res) => {
  try {
    const { subject, category, message, priority = "medium" } = req.body

    if (!subject || !category || !message) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" })
    }

    const ticket = new SupportTicket({
      userEmail: req.user.email,
      subject,
      category,
      priority,
      messages: [
        {
          sender: "user",
          message,
        },
      ],
    })

    await ticket.save()

    // Send confirmation email
    try {
      const userEmail = decrypt(req.user.email)
      await sendEmail({
        to: userEmail,
        subject: `تم إنشاء تذكرة الدعم - ${ticket.ticketId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">تم إنشاء تذكرة الدعم بنجاح</h2>
            <p>مرحباً ${req.user.firstName || ""},</p>
            <p>تم إنشاء تذكرة الدعم الخاصة بك بنجاح.</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>تفاصيل التذكرة:</h3>
              <p><strong>رقم التذكرة:</strong> ${ticket.ticketId}</p>
              <p><strong>الموضوع:</strong> ${subject}</p>
              <p><strong>الفئة:</strong> ${category}</p>
              <p><strong>الأولوية:</strong> ${priority}</p>
            </div>
            
            <p>سيتم الرد عليك خلال 24 ساعة.</p>
            <p style="color: #6B7280;">شكراً لتواصلك معنا!</p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError)
    }

    res.status(201).json({
      message: "تم إنشاء تذكرة الدعم بنجاح",
      ticket: {
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    })
  } catch (err) {
    console.error("❌ Error creating support ticket:", err)
    res.status(500).json({ message: "فشل في إنشاء تذكرة الدعم" })
  }
})

// Get user's support tickets
router.get("/tickets", ensureAuthenticated, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const query = { userEmail: req.user.email }

    if (status && status !== "all") {
      query.status = status
    }

    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("ticketId subject category priority status createdAt updatedAt")

    const total = await SupportTicket.countDocuments(query)

    res.json({
      tickets,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error("❌ Error fetching tickets:", err)
    res.status(500).json({ message: "فشل في جلب التذاكر" })
  }
})

// Get specific ticket
router.get("/tickets/:ticketId", ensureAuthenticated, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      ticketId: req.params.ticketId,
      userEmail: req.user.email,
    })

    if (!ticket) {
      return res.status(404).json({ message: "التذكرة غير موجودة" })
    }

    res.json(ticket)
  } catch (err) {
    console.error("❌ Error fetching ticket:", err)
    res.status(500).json({ message: "فشل في جلب التذكرة" })
  }
})

// Add message to ticket
router.post("/tickets/:ticketId/messages", ensureAuthenticated, async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ message: "الرسالة مطلوبة" })
    }

    const ticket = await SupportTicket.findOne({
      ticketId: req.params.ticketId,
      userEmail: req.user.email,
    })

    if (!ticket) {
      return res.status(404).json({ message: "التذكرة غير موجودة" })
    }

    ticket.messages.push({
      sender: "user",
      message,
    })

    ticket.status = "waiting-response"
    ticket.updatedAt = new Date()

    await ticket.save()

    res.json({
      message: "تم إضافة الرسالة بنجاح",
      ticket: {
        ticketId: ticket.ticketId,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
      },
    })
  } catch (err) {
    console.error("❌ Error adding message:", err)
    res.status(500).json({ message: "فشل في إضافة الرسالة" })
  }
})

module.exports = router
