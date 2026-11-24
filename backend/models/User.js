
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["user", "doctor", "admin"],
    default: "user"
  },

  // Connect doctor login account to Dentist collection
  dentistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dentist",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
