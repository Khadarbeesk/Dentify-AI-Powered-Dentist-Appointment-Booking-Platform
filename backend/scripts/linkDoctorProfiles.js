
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env")
});

const mongoose = require("mongoose");

const User = require("../models/User");
const Dentist = require("../models/Dentist");

// Existing doctor account and dentist profile mappings
const mappings = [
  {
    email: "arjun@gmail.com",
    dentistName: "Dr. Arjun Mehta"
  },
  {
    email: "priya@gmail.com",
    dentistName: "Dr. Priya Reddy"
  },
  {
    email: "rahul@gmail.com",
    dentistName: "Dr. Rahul Sharma"
  },
  {
    email: "sneha@gmail.com",
    dentistName: "Dr. Sneha Kapoor"
  },
  {
    email: "kiran@gmail.com",
    dentistName: "Dr. Kiran Kumar"
  },
  {
    email: "neha@gmail.com",
    dentistName: "Dr. Neha Sharma"
  },
  {
    email: "rohit@gmail.com",
    dentistName: "Dr. Rohit Verma"
  },
  {
    email: "ayesha@gmail.com",
    dentistName: "Dr. Ayesha Khan"
  },
  {
    email: "vikram@gmail.com",
    dentistName: "Dr. Vikram Singh"
  }
];
async function linkDoctorProfiles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    for (const mapping of mappings) {
      console.log("\nProcessing:", mapping.email);

      // Find existing doctor account
      const user = await User.findOne({
        email: mapping.email.toLowerCase(),
        role: "doctor"
      });

      if (!user) {
        console.log("Doctor user not found:", mapping.email);
        continue;
      }

      // Find existing dentist profile
      const dentist = await Dentist.findOne({
        name: mapping.dentistName
      });

      if (!dentist) {
        console.log("Dentist profile not found:", mapping.dentistName);
        continue;
      }

      // Prevent overwriting an existing different relationship
      if (
        user.dentistId &&
        user.dentistId.toString() !== dentist._id.toString()
      ) {
        console.log("User is already linked to another dentist. Skipping.");
        continue;
      }

      if (
        dentist.userId &&
        dentist.userId.toString() !== user._id.toString()
      ) {
        console.log("Dentist is already linked to another user. Skipping.");
        continue;
      }

      // Connect User to Dentist
      user.dentistId = dentist._id;
      await user.save();

      // Connect Dentist to User
      dentist.userId = user._id;
      await dentist.save();

      console.log("Successfully linked!");
      console.log("User:", user.email);
      console.log("Dentist:", dentist.name);
      console.log("User ID:", user._id.toString());
      console.log("Dentist ID:", dentist._id.toString());
    }

    console.log("\nDoctor profile linking completed.");

  } catch (error) {
    console.error("Linking error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

linkDoctorProfiles();
