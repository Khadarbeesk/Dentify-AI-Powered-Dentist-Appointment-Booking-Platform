
const router = require("express").Router();

const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// =====================================
// RAZORPAY CONFIGURATION
// =====================================

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay API keys are missing from .env");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const APPOINTMENT_FEE = 50000; // ₹500 in paise

const CANCELLED_STATUSES = [
  "Cancelled By User",
  "Cancelled By Doctor"
];

// =====================================
// HELPER: VALIDATE DATE WITHOUT UTC SHIFT
// =====================================

const parseAppointmentDate = (date) => {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return null;
  }

  const [year, month, day] = date.split("-").map(Number);

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate;
};

// =====================================
// CREATE APPOINTMENT AFTER PAYMENT
// =====================================

router.post("/", auth, async (req, res) => {
  try {
    const {
      patientName,
      age,
      gender,
      date,
      time,
      dentistName,
      clinicName,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Validate appointment details
    if (
      !patientName?.trim() ||
      !age ||
      !gender ||
      !date ||
      !time ||
      !dentistName?.trim() ||
      !clinicName?.trim()
    ) {
      return res.status(400).json({
        msg: "Please provide all appointment details"
      });
    }

    if (
      !Number.isInteger(Number(age)) ||
      Number(age) < 1 ||
      Number(age) > 120
    ) {
      return res.status(400).json({
        msg: "Please provide a valid age"
      });
    }

    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({
        msg: "Invalid gender"
      });
    }

    // Validate payment details
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        msg: "Payment details are missing"
      });
    }

    // Validate appointment date
    const selectedDate = parseAppointmentDate(date);

    if (!selectedDate) {
      return res.status(400).json({
        msg: "Invalid appointment date"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        msg: "Cannot book an appointment in the past"
      });
    }

    // Validate allowed time slots
    const allowedTimeSlots = [
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "02:00 PM",
      "03:00 PM",
      "04:00 PM"
    ];

    if (!allowedTimeSlots.includes(time)) {
      return res.status(400).json({
        msg: "Invalid appointment time slot"
      });
    }

    // =====================================
    // VERIFY RAZORPAY SIGNATURE
    // =====================================

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest();

    let receivedSignature;

    try {
      receivedSignature = Buffer.from(
        razorpay_signature,
        "hex"
      );
    } catch {
      return res.status(400).json({
        msg: "Invalid payment signature"
      });
    }

    if (
      receivedSignature.length !== generatedSignature.length ||
      !crypto.timingSafeEqual(
        generatedSignature,
        receivedSignature
      )
    ) {
      return res.status(400).json({
        msg: "Invalid payment signature"
      });
    }

    // =====================================
    // FETCH ORDER AND PAYMENT FROM RAZORPAY
    // =====================================

    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id)
    ]);

    // Check order ownership
    if (
      order.notes?.userId !== String(req.user.id)
    ) {
      return res.status(403).json({
        msg: "This payment order does not belong to you"
      });
    }

    // Check order
    if (
      order.amount !== APPOINTMENT_FEE ||
      order.currency !== "INR" ||
      order.status !== "paid"
    ) {
      return res.status(400).json({
        msg: "Invalid or unpaid Razorpay order"
      });
    }

    // Check payment
    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== APPOINTMENT_FEE ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        msg: "Payment has not been captured successfully"
      });
    }

    // =====================================
    // PREVENT PAYMENT REUSE
    // =====================================

    const existingPayment = await Appointment.findOne({
      $or: [
        { paymentId: razorpay_payment_id },
        { razorpayOrderId: razorpay_order_id }
      ]
    });

    if (existingPayment) {
      return res.status(409).json({
        msg: "This payment has already been used"
      });
    }

    // =====================================
    // CHECK APPOINTMENT SLOT
    // =====================================

    const exists = await Appointment.findOne({
      dentistName,
      date: selectedDate,
      time,
      status: {
        $nin: CANCELLED_STATUSES
      }
    });

    if (exists) {
      return res.status(409).json({
        msg: "Slot already booked. Please select another slot."
      });
    }

    // =====================================
    // SAVE APPOINTMENT
    // =====================================

    const newAppointment = new Appointment({
      patientName: patientName.trim(),
      age: Number(age),
      gender,
      date: selectedDate,
      time,
      dentistName: dentistName.trim(),
      clinicName: clinicName.trim(),
      userId: req.user.id,

      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentAmount: payment.amount,
      paymentStatus: "Paid",

      status: "Confirmed"
    });

    await newAppointment.save();

    return res.status(201).json({
      success: true,
      msg: "Payment successful. Appointment confirmed!",
      appointment: newAppointment
    });

  } catch (err) {
    console.error("Appointment creation error:", err);

    return res.status(500).json({
      msg: "Unable to create appointment"
    });
  }
});

// =====================================
// USER BOOKINGS
// =====================================

router.get("/my", auth, async (req, res) => {
  try {
    const data = await Appointment.find({
      userId: new mongoose.Types.ObjectId(req.user.id)
    }).sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server error"
    });
  }
});

// =====================================
// DOCTOR BOOKINGS
// =====================================

router.get("/doctor", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        msg: "Access denied"
      });
    }

    const data = await Appointment.find({
      dentistName: req.user.name
    }).sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error fetching doctor appointments"
    });
  }
});

// =====================================
// AVAILABLE SLOTS
// =====================================

router.get("/slots", async (req, res) => {
  try {
    const { dentistName, date } = req.query;

    if (!dentistName || !date) {
      return res.status(400).json({
        msg: "Dentist name and date are required"
      });
    }

    const selectedDate = parseAppointmentDate(date);

    if (!selectedDate) {
      return res.status(400).json({
        msg: "Invalid date"
      });
    }

    const appointments = await Appointment.find({
      dentistName,
      date: selectedDate,
      status: {
        $nin: CANCELLED_STATUSES
      }
    });

    res.json(appointments);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server error"
    });
  }
});

// =====================================
// ALL APPOINTMENTS - ADMIN
// =====================================

router.get("/", auth, admin, async (req, res) => {
  try {
    const data = await Appointment.find()
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Error fetching all appointments"
    });
  }
});

// =====================================
// CANCEL APPOINTMENT
// =====================================

router.put("/cancel/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        msg: "Invalid appointment ID"
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!appointment) {
      return res.status(404).json({
        msg: "Appointment not found"
      });
    }

    if (
      CANCELLED_STATUSES.includes(appointment.status)
    ) {
      return res.status(400).json({
        msg: "Appointment is already cancelled"
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);

    if (today >= appointmentDate) {
      return res.status(400).json({
        msg: "Cannot cancel on appointment date"
      });
    }

    appointment.status = "Cancelled By User";

    await appointment.save();

    res.json({
      success: true,
      msg: "Appointment cancelled successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server error"
    });
  }
});

// =====================================
// DOCTOR UPDATE APPOINTMENT STATUS
// =====================================

router.put("/doctor/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        msg: "Access denied"
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        msg: "Invalid appointment ID"
      });
    }

    const allowedStatuses = [
      "Confirmed",
      "Completed",
      "Cancelled By Doctor"
    ];

    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({
        msg: "Invalid appointment status"
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      dentistName: req.user.name
    });

    if (!appointment) {
      return res.status(404).json({
        msg: "Appointment not found"
      });
    }

    if (
      CANCELLED_STATUSES.includes(appointment.status)
    ) {
      return res.status(400).json({
        msg: "Cancelled appointments cannot be modified"
      });
    }

    appointment.status = req.body.status;

    await appointment.save();

    res.json({
      success: true,
      msg: "Status updated successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server error"
    });
  }
});

module.exports = router;
