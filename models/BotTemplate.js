const mongoose = require("mongoose")

const botTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // customer-service, entertainment, business, etc.
  icon: { type: String, default: "fas fa-robot" },
  commands: [
    {
      command: String,
      description: String,
      response: String,
      type: { type: String, enum: ["text", "image", "document"], default: "text" },
    },
  ],
  welcomeMessage: { type: String, default: "مرحباً! كيف يمكنني مساعدتك؟" },
  settings: {
    autoReply: { type: Boolean, default: true },
    saveUserData: { type: Boolean, default: false },
    enableAnalytics: { type: Boolean, default: true },
  },
  isPublic: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdBy: { type: String, default: "system" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("BotTemplate", botTemplateSchema)
