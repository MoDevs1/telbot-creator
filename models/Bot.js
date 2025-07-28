const mongoose = require("mongoose");

const botSchema = new mongoose.Schema({
  name: { type: String, required: true },
  token: { type: String, required: true },
  description: { type: String },
  platform: { type: String, default: "telegram" },
  status: { type: String, default: "pending" },
  ownerEmail: { type: String, required: true }, // بيربط البوت بصاحب الإيميل
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bot", botSchema);
