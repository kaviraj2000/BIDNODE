const mongoose = require("mongoose");

const panna = mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    marketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'marketing'  // Reference to the User model
    },
    status: {
        type: Boolean,
        required: true,
    },
    digit: {
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Signup'  // Reference to the User model
    },
    point: {
        type: Number,
        required: true,
    },
    sangam_type:{
        type:String
    },
    win_manage:{
        type:String
      },
    name:{String},
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Panna", panna);
