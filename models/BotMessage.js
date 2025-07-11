const mongoose = require("mongoose")

const botMessageSchema = new mongoose.Schema({
  botId: { type: mongoose.Schema.Types.ObjectId, ref: "Bot", required: true },
  messageType: { type: String, enum: ["welcome", "command", "auto-reply", "broadcast"], required: true },
  trigger: { type: String }, // command or keyword that triggers this message
  content: {
    text: String,
    media: {
      type: { type: String, enum: ["image", "video", "document", "audio"] },
      url: String,
      caption: String,
    },
    buttons: [
      {
        text: String,
        url: String,
        callback_data: String,
      },
    ],
  },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("BotMessage", botMessageSchema)
