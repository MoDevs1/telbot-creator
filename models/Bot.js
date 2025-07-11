const mongoose = require("mongoose");

const BotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  platform: {
    type: String,
    required: true,
    enum: ["telegram", "whatsapp", "discord"],
  },
  token: {
    type: String,
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "active", "disabled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
  },
  programmingRequirements: {
    type: String,
  },
  estimatedCost: {
    type: Number,
  },
  estimatedTime: {
    type: String,
  },
  programmingStatus: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started",
  },
  developerNotes: {
    type: String,
  },
});

const Bot = mongoose.model("Bot", BotSchema);
module.exports = Bot;
