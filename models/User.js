const mongoose = require("mongoose");

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
    lowerCase: true,
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
    required: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  plan: {
    type: String,
    enum: ["free", "pro", "pending"],
    default: null, // المستخدم اللي ما اختارش لسه أو خطة مجانية
  },
  planRequestedAt: {
    type: Date,
  },
  isPlanApproved: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
