const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
    trim: true,
  },
  AcceptedTerms: {
    type: Boolean,
    required: true,
  },
  newsletter: {
    type: Boolean,
    default: false,
  },
  botUpdates: {
    type: Boolean,
    default: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  plan: {
    type: String,
    enum: ["free", "pro", "pending"],
    default: "free",
  },
  planRequestedAt: {
    type: Date,
  },
  isPlanApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
})

const User = mongoose.model("User", UserSchema)
module.exports = User
