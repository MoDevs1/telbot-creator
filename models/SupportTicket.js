const mongoose = require("mongoose")

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, required: true },
  userEmail: { type: String, required: true }, // encrypted
  subject: { type: String, required: true },
  category: {
    type: String,
    enum: ["technical", "billing", "feature-request", "bug-report", "general"],
    required: true,
  },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  status: { type: String, enum: ["open", "in-progress", "waiting-response", "resolved", "closed"], default: "open" },
  messages: [
    {
      sender: { type: String, enum: ["user", "support"], required: true },
      message: { type: String, required: true },
      attachments: [
        {
          filename: String,
          url: String,
          size: Number,
        },
      ],
      timestamp: { type: Date, default: Date.now },
    },
  ],
  assignedTo: { type: String }, // support agent email
  tags: [String],
  relatedBot: { type: mongoose.Schema.Types.ObjectId, ref: "Bot" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  closedAt: Date,
})

// Generate unique ticket ID
supportTicketSchema.pre("save", function (next) {
  if (!this.ticketId) {
    this.ticketId =
      "TBC-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substr(2, 5).toUpperCase()
  }
  next()
})

module.exports = mongoose.model("SupportTicket", supportTicketSchema)
