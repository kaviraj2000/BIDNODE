const mongoose = require("mongoose");

const gameRateSchema = mongoose.Schema({
    single_digit_rate: Number,
    double_digit_rate: Number,
    single_panna_rate: Number,
    double_panna_rate: Number,
    triple_panna_rate: Number,
    full_sangam_rate: Number,
    half_sangam_rate: Number,
    digit_on_rate: Number,
    dp_motor_rate: Number,

    // Optional: rate name fields for label display (not required for calculations)
    single_digit_rate_name: {
        type: String,
        default: "single_digit_rate"
    },
    double_digit_rate_name: {
        type: String,
        default: "double_digit_rate"
    },
    single_panna_rate_name: {
        type: String,
        default: "single_panna_rate"
    },
    double_panna_rate_name: {
        type: String,
        default: "double_panna_rate"
    },
    triple_panna_rate_name: {
        type: String,
        default: "triple_panna_rate"
    },
    full_sangam_rate_name: {
        type: String,
        default: "full_sangam_rate"
    },
    half_sangam_rate_name: {
        type: String,
        default: "half_sangam_rate"
    },
    digit_on_rate_name: {
        type: String,
        default: "digit_on_rate"
    },
    dp_motor_rate_name: {
        type: String,
        default: "dp_motor_rate"
    },

    create_date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Rate", gameRateSchema);
