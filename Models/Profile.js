const mongoose = require("mongoose")


const profileschema = mongoose.Schema({


   
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Signup'  // Reference to the User model
    },
    create_date: {
        type: Date,
        default: Date.now,
    },
})
module.exports = mongoose.model("profile", profileschema);
