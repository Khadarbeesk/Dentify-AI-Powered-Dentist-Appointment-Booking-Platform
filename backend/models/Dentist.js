
const mongoose = require("mongoose");

const dentistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    sparse: true
  },

  name: String,
  qualification: String,
  experience: Number,
  clinicName: String,
  address: String,
  location: String,
  image: String,

  workingDays: {
    type: [String],
    default: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ]
  },

  startTime: {
    type: String,
    default: "09:00"
  },

  endTime: {
    type: String,
    default: "18:00"
  },

  slotDuration: {
    type: Number,
    default: 30
  }

}, { timestamps: true });

module.exports = mongoose.model("Dentist", dentistSchema);
