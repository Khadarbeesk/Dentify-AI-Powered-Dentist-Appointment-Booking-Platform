
console.log("MY DENTIST ROUTES FILE IS LOADED");

const router = require("express").Router();

const Dentist = require("../models/Dentist");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// ADMIN AUTHORIZATION
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required."
    });
  }

  next();
};

// GET ALL DENTISTS
router.get("/", async (req, res) => {
  try {
    const data = await Dentist.find();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch dentists."
    });
  }
});

// GET LOGGED-IN DOCTOR PROFILE
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access this profile."
      });
    }

    const dentist = await Dentist.findOne({
      userId: req.user.id
    });


    res.json(dentist);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch doctor profile."
    });
  }
});

// EXISTING ADD DENTIST ROUTE
router.post("/", async (req, res) => {
  try {
    const dentist = new Dentist(req.body);
    await dentist.save();

    res.status(201).json(dentist);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to add dentist."
    });
  }
});

// ADMIN: ADD DOCTOR AND LOGIN ACCOUNT
router.post("/admin/add", authMiddleware, adminOnly, async (req, res) => {
  try {
    const {
      name,
      qualification,
      experience,
      clinicName,
      address,
      location,
      image,
      email,
      password,
      workingDays,
      startTime,
      endTime,
      slotDuration
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists."
      });
    }

    const dentist = await Dentist.create({
      name,
      qualification,
      experience,
      clinicName,
      address,
      location,
      image,
      workingDays,
      startTime,
      endTime,
      slotDuration
    });

    try {
      const user = await User.create({
        name,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: "doctor",
        dentistId: dentist._id
      });

      dentist.userId = user._id;
      await dentist.save();

      res.status(201).json({
        message: "Doctor created successfully.",
        dentist
      });
    } catch (error) {
      await Dentist.findByIdAndDelete(dentist._id);
      throw error;
    }
  } catch (error) {
    console.error("Add doctor error:", error);
    res.status(500).json({
      message: "Unable to create doctor."
    });
  }
});

// ADMIN: EDIT DOCTOR DETAILS
router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "qualification",
      "experience",
      "clinicName",
      "address",
      "location",
      "image",
      "workingDays",
      "startTime",
      "endTime",
      "slotDuration"
    ];

    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const dentist = await Dentist.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!dentist) {
      return res.status(404).json({
        message: "Doctor not found."
      });
    }

    // Keep the linked login account name synchronized.
    if (updates.name && dentist.userId) {
      await User.findByIdAndUpdate(dentist.userId, {
        name: updates.name
      });
    }

    res.json({
      message: "Doctor updated successfully.",
      dentist
    });
  } catch (error) {
    console.error("Update doctor error:", error);
    res.status(500).json({
      message: "Unable to update doctor."
    });
  }
});

module.exports = router;
