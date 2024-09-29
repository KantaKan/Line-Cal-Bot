const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  dailyCalorieGoal: { type: Number, default: 2000 },
  caloriesConsumed: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: new Date() },
});

module.exports = mongoose.model("User", userSchema);
