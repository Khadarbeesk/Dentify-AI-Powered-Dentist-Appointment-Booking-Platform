
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();




const app = express();

// =====================================
// ENVIRONMENT CONFIGURATION
// =====================================

const PORT = process.env.PORT || 5000;

console.log("Environment check:", {
  razorpayKeyIdLoaded: !!process.env.RAZORPAY_KEY_ID,
  razorpaySecretLoaded: !!process.env.RAZORPAY_KEY_SECRET,
  geminiKeyLoaded: !!process.env.GEMINI_API_KEY,
  mongoUriLoaded: !!process.env.MONGO_URI
});

// Stop startup if required configuration is missing
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

if (
  !process.env.RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET
) {
  console.error("Razorpay API keys are missing in .env");
  process.exit(1);
}

// =====================================
// MODELS
// =====================================

const Dentist = require("./models/Dentist");

// =====================================
// MIDDLEWARE
// =====================================

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

// =====================================
// ROUTES
// =====================================

app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/dentists", require("./routes/dentistRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

// =====================================
// HEALTH CHECK
// =====================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dentify Backend API is running"
  });
});

// =====================================
// DATABASE CONNECTION & DENTIST SEEDING
// =====================================

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("DB Connected Successfully");

    const count = await Dentist.countDocuments();

    if (count === 0) {
      console.log("No doctors found. Inserting doctors...");

      await Dentist.insertMany([
        {
          name: "Dr. Rahul Sharma",
          qualification: "BDS, MDS",
          experience: 8,
          clinicName: "Apollo Dental Clinic",
          address: "Jubilee Hills",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800"
        },
        {
          name: "Dr. Priya Reddy",
          qualification: "MDS Orthodontist",
          experience: 10,
          clinicName: "Clove Dental",
          address: "Banjara Hills",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800"
        },
        {
          name: "Dr. Arjun Mehta",
          qualification: "BDS",
          experience: 6,
          clinicName: "Partha Dental",
          address: "Madhapur",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800"
        },
        {
          name: "Dr. Sneha Kapoor",
          qualification: "MDS Prosthodontist",
          experience: 12,
          clinicName: "KIMS Dental Center",
          address: "Secunderabad",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800"
        },
        {
          name: "Dr. Kiran Kumar",
          qualification: "BDS",
          experience: 9,
          clinicName: "Yashoda Dental Care",
          address: "Gachibowli",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=800"
        },
        {
          name: "Dr. Neha Sharma",
          qualification: "MDS Endodontist",
          experience: 11,
          clinicName: "Aster Dental Clinic",
          address: "Whitefield",
          location: "Bangalore",
          image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800"
        },
        {
          name: "Dr. Rohit Verma",
          qualification: "BDS",
          experience: 7,
          clinicName: "MediCover Dental",
          address: "Hitech City",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800"
        },
        {
          name: "Dr. Ayesha Khan",
          qualification: "MDS Oral Surgeon",
          experience: 14,
          clinicName: "Continental Dental Care",
          address: "Financial District",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800"
        },
        {
          name: "Dr. Vikram Singh",
          qualification: "BDS, MDS",
          experience: 13,
          clinicName: "Rainbow Dental Hospital",
          address: "Kondapur",
          location: "Hyderabad",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"
        }
      ]);

      console.log("9 Doctors Inserted Successfully");
    } else {
      console.log(
        `${count} Doctors Already Exist. Skipping Seeding.`
      );
    }

  } catch (err) {
    console.error("Database Connection / Seeding Error:", err);
    process.exit(1);
  }
};

// =====================================
// START SERVER AFTER DATABASE CONNECTS
// =====================================

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
};

startServer();
