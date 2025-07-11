const express = require("express")
const router = express.Router()
const BotAnalytics = require("../models/BotAnalytics")
const Bot = require("../models/Bot")
const { decrypt } = require("../utils/encryption")

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next()
  res.status(401).json({ message: "يجب تسجيل الدخول" })
}

// Get bot analytics
router.get("/bot/:botId", ensureAuthenticated, async (req, res) => {
  try {
    const { botId } = req.params
    const { period = "7d" } = req.query // 7d, 30d, 90d, 1y

    // Verify bot ownership
    const bot = await Bot.findOne({ _id: botId, ownerEmail: req.user.email })
    if (!bot) {
      return res.status(404).json({ message: "البوت غير موجود" })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }

    const analytics = await BotAnalytics.find({
      botId: botId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 })

    // Calculate totals and trends
    const totals = analytics.reduce(
      (acc, day) => {
        acc.totalUsers += day.metrics.totalUsers
        acc.totalMessages += day.metrics.totalMessages
        acc.sentMessages += day.metrics.sentMessages
        acc.receivedMessages += day.metrics.receivedMessages
        acc.commandsUsed += day.metrics.commandsUsed
        acc.errors += day.metrics.errors
        return acc
      },
      {
        totalUsers: 0,
        totalMessages: 0,
        sentMessages: 0,
        receivedMessages: 0,
        commandsUsed: 0,
        errors: 0,
      },
    )

    // Get top commands
    const commandStats = {}
    analytics.forEach((day) => {
      day.topCommands.forEach((cmd) => {
        commandStats[cmd.command] = (commandStats[cmd.command] || 0) + cmd.count
      })
    })

    const topCommands = Object.entries(commandStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([command, count]) => ({ command, count }))

    res.json({
      period,
      dateRange: { startDate, endDate },
      totals,
      dailyData: analytics,
      topCommands,
      chartData: {
        labels: analytics.map((day) => day.date.toISOString().split("T")[0]),
        datasets: [
          {
            label: "المستخدمين النشطين",
            data: analytics.map((day) => day.metrics.activeUsers),
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
          {
            label: "الرسائل",
            data: analytics.map((day) => day.metrics.totalMessages),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
          },
        ],
      },
    })
  } catch (err) {
    console.error("❌ Error fetching analytics:", err)
    res.status(500).json({ message: "فشل في جلب الإحصائيات" })
  }
})

// Get dashboard overview
router.get("/overview", ensureAuthenticated, async (req, res) => {
  try {
    const userBots = await Bot.find({ ownerEmail: req.user.email })
    const botIds = userBots.map((bot) => bot._id)

    // Get last 30 days analytics
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const analytics = await BotAnalytics.find({
      botId: { $in: botIds },
      date: { $gte: thirtyDaysAgo },
    })

    // Calculate overview stats
    const overview = {
      totalBots: userBots.length,
      activeBots: userBots.filter((bot) => bot.status === "active").length,
      totalUsers: 0,
      totalMessages: 0,
      growthRate: 0,
      topPerformingBot: null,
    }

    // Calculate totals
    const botStats = {}
    analytics.forEach((day) => {
      overview.totalUsers += day.metrics.newUsers
      overview.totalMessages += day.metrics.totalMessages

      if (!botStats[day.botId]) {
        botStats[day.botId] = { messages: 0, users: 0 }
      }
      botStats[day.botId].messages += day.metrics.totalMessages
      botStats[day.botId].users += day.metrics.newUsers
    })

    // Find top performing bot
    let maxMessages = 0
    let topBotId = null
    Object.entries(botStats).forEach(([botId, stats]) => {
      if (stats.messages > maxMessages) {
        maxMessages = stats.messages
        topBotId = botId
      }
    })

    if (topBotId) {
      const topBot = userBots.find((bot) => bot._id.toString() === topBotId)
      overview.topPerformingBot = {
        name: topBot.name,
        messages: maxMessages,
        users: botStats[topBotId].users,
      }
    }

    res.json(overview)
  } catch (err) {
    console.error("❌ Error fetching overview:", err)
    res.status(500).json({ message: "فشل في جلب نظرة عامة" })
  }
})

module.exports = router
