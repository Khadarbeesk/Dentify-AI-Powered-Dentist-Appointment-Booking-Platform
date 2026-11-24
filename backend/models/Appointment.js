
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: true
    },

    age: {
      type: Number,
      required: true
    },

    gender: {
      type: String,
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    time: {
      type: String,
      required: true
    },

    dentistName: {
      type: String,
      required: true
    },

    clinicName: {
      type: String,
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // PAYMENT DETAILS
    paymentId: {
      type: String,
      default: null
    },

    razorpayOrderId: {
      type: String,
      default: null
    },

    paymentAmount: {
      type: Number,
      default: 50000 // ₹500 in paise
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending"
    },

    // APPOINTMENT STATUS
    status: {
      type: String,
      enum: [
        "Confirmed",
        "Completed",
        "Cancelled By User",
        "Cancelled By Doctor"
      ],
      default: "Confirmed"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);
