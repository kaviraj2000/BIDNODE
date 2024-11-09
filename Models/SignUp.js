const mongoose = require("mongoose");

const signupSchema = mongoose.Schema({
  mpin: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  Profile_name: String,
  username: {
    type: String,
    required: true,
  },
  phone_digit: {
    type: Number,
  },
  role: {
    type: String,
    enum: ["user", "admin", "subadmin"],
    default: "user",
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    default: 0
  },
  user_status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  Upi_id: String,
  whatapps: Number,
  profile_email: String,
  marchant_id: String,
  min_widthrawal_rate: Number,
  min_desposite_rate: Number,
  min_bid_amount: Number,
  welcome_bouns: Number,
  Withrawal: String,
  App_link: String,
  message: String,
  Video_link: String,
  
});

module.exports = mongoose.model("Signup", signupSchema);
