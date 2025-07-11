const mongoose = require("mongoose")

const botAnalyticsSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: "Bot", required: true },
  date: { type: Date, required: true },
  metrics: {
    totalUsers: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    sentMessages: { type: Number, default: 0 },
    receivedMessages: { type: Number, default: 0 },
    commandsUsed: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
  },
  topCommands: [
    {
      command: String,
      count: Number,
    },
  ],
  userActivity: [
    {
      hour: Number, // 0-23
      count: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
})

// Create compound index for efficient queries
botAnalyticsSchema.index({ botId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model("BotAnalytics", botAnalyticsSchema)
