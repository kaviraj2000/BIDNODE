const mongoose = require("mongoose");

const gamerateschema = mongoose.Schema({

    single_digit_rate: Number,
    single_digit_rate_name: {
        type: String,
        default: "single_digit_rate" // replace with the default value you want
    },
    full_sangam_name: {
        type: String,
        default: "full_sangam_rate" // replace with the default value you want
    },
    Doble_panna_rate_name: {
        type: String,
        default: "Doble_panna_rate" // replace with the default value you want
    },
    Triple_panna_rate_name: {
        type: String,
        default: "Triple_panna_rate" // replace with the default value you want
    },
    doble_digit_rate_name: {
        type: String,
        default: "doble_digit_rate" // replace with the default value you want
    },
    dp_motors_rate: {
        type: String,
        default: "dp_motors" // replace with the default value you want
    },
    Half_sangam_name: {
        type: String,
        default: "Half_sangam_rate" // replace with the default value you want
    },
    Digit_ons: {
        type:String ,
        default: "Digit_on" // replace with the default value you want
    },



    doble_digit_rate: Number,
    Single_panna_rate: Number,
    Doble_panna_rate: Number,
    Triple_panna_rate: Number,
    full_sangam: Number,
    Half_sangam: Number,
    Digit_on: Number,
    dp_motors: Number,
    create_date: {
        type: Date,
        default: Date.now,
    },
})



module.exports = mongoose.model("Rate", gamerateschema)

