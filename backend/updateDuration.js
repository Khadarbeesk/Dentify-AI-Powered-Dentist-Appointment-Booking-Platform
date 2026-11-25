require("dotenv").config();
const mongoose = require("mongoose");
const Dentist = require("./models/Dentist");

async function updateDuration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await Dentist.updateMany(
      {},
      { $set: { slotDuration: 60 } }
    );

    console.log("Database update result:", result);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

updateDuration();
