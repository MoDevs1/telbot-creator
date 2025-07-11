const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: String, required: true }, // encrypted email
  members: [
    {
      email: { type: String, required: true }, // encrypted email
      role: { type: String, enum: ["admin", "editor", "viewer"], default: "viewer" },
      permissions: [
        {
          resource: String, // 'bots', 'analytics', 'settings'
          actions: [String], // 'read', 'write', 'delete'
        },
      ],
      joinedAt: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true },
    },
  ],
  bots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bot" }],
  settings: {
    allowMemberInvites: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 10 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Team", teamSchema)
