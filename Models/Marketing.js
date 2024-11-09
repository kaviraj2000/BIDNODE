const mongoose = require('mongoose');

const marketingSchema = new mongoose.Schema({
  market_status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  market_type: {
    type: String,
    default: "dehli"
  },
  bit_number: {
    type: Number,
  },
  win_manage:{
    type:String
  },
  open_time: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Regex to match time format HH:MM (24-hour format)
        return /^([01]\d|2[0-3]):?([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format!`
    },
  },
  close_time: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Regex to match time format HH:MM (24-hour format)
        return /^([01]\d|2[0-3]):?([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format!`
    },
  },
  name: {
    type: String,
    required: true,
  },
  market_type: {
    type: String,
  },
  result: {
    type: String,
  },
  game_rate: {
    type: Number,
  },
  create_date: {
    type: Date,
    default: Date.now,
}
});

const Marketing = mongoose.model('marketing', marketingSchema);

module.exports = Marketing;
