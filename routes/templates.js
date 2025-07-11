const express = require("express")
const router = express.Router()
const BotTemplate = require("../models/BotTemplate")
const Bot = require("../models/Bot")
const BotMessage = require("../models/BotMessage")

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next()
  res.status(401).json({ message: "يجب تسجيل الدخول" })
}

// Get all public templates
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query
    const query = { isPublic: true }

    if (category && category !== "all") {
      query.category = category
    }

    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
    }

    const templates = await BotTemplate.find(query).sort({ usageCount: -1, createdAt: -1 }).limit(50)

    res.json(templates)
  } catch (err) {
    console.error("❌ Error fetching templates:", err)
    res.status(500).json({ message: "فشل في جلب القوالب" })
  }
})

// Get template categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await BotTemplate.distinct("category", { isPublic: true })
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await BotTemplate.countDocuments({ category, isPublic: true })
        return { name: category, count }
      }),
    )

    res.json(categoriesWithCounts)
  } catch (err) {
    console.error("❌ Error fetching categories:", err)
    res.status(500).json({ message: "فشل في جلب الفئات" })
  }
})

// Get template by ID
router.get("/:templateId", async (req, res) => {
  try {
    const template = await BotTemplate.findById(req.params.templateId)
    if (!template || !template.isPublic) {
      return res.status(404).json({ message: "القالب غير موجود" })
    }

    res.json(template)
  } catch (err) {
    console.error("❌ Error fetching template:", err)
    res.status(500).json({ message: "فشل في جلب القالب" })
  }
})

// Create bot from template
router.post("/:templateId/create", ensureAuthenticated, async (req, res) => {
  try {
    const { name, token, description } = req.body
    const template = await BotTemplate.findById(req.params.templateId)

    if (!template || !template.isPublic) {
      return res.status(404).json({ message: "القالب غير موجود" })
    }

    // Create new bot
    const newBot = new Bot({
      name: name || template.name,
      token,
      description: description || template.description,
      platform: "telegram",
      ownerEmail: req.user.email,
      status: "pending",
      templateId: template._id,
    })

    await newBot.save()

    // Create bot messages from template
    const botMessages = template.commands.map((command) => ({
      botId: newBot._id,
      messageType: "command",
      trigger: command.command,
      content: {
        text: command.response,
        media: command.type !== "text" ? { type: command.type } : undefined,
      },
    }))

    // Add welcome message
    if (template.welcomeMessage) {
      botMessages.push({
        botId: newBot._id,
        messageType: "welcome",
        content: { text: template.welcomeMessage },
      })
    }

    await BotMessage.insertMany(botMessages)

    // Increment usage count
    await BotTemplate.findByIdAndUpdate(template._id, { $inc: { usageCount: 1 } })

    res.status(201).json({
      message: "تم إنشاء البوت من القالب بنجاح",
      bot: newBot,
    })
  } catch (err) {
    console.error("❌ Error creating bot from template:", err)
    res.status(500).json({ message: "فشل في إنشاء البوت من القالب" })
  }
})

module.exports = router
