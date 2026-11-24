const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Dentist = require("../models/Dentist");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({
      email: normalizedEmail
    });

    if (exists) {
      return res.status(409).json({
        message: "User already exists."
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    let role = "user";

    if (normalizedEmail === "admin@gmail.com") {
      role = "admin";
    } else if (
      ["arjun@gmail.com", "priya@gmail.com"].includes(normalizedEmail)
    ) {
      role = "doctor";
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashed,
      role
    });

    return res.status(201).json({
      message: "Registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Registration failed."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const valid = await bcrypt.compare(
      password || "",
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        message: "Wrong password."
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Fetch the linked dentist profile
    let dentist = null;

    if (user.role === "doctor" && user.dentistId) {
      dentist = await Dentist.findById(user.dentistId)
        .select("-__v")
        .lean();
    }

    return res.json({
      message: "Login successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dentistId: user.dentistId || null
      },

      dentist
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed."
    });
  }
});
// GET LOGGED-IN USER PROFILE
const authMiddleware = require("../middleware/auth");

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);

  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      message: "Unable to fetch profile"
    });
  }
});
module.exports = router;