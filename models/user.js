// console.log("user.js");

const mongoose = require("mongoose");
const { type } = require("os");
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber : {
        type : Number,
        required : true,
        unique : true
    },
    sportsCenters : [{
         type : mongoose.Schema.Types.ObjectId,
        ref : 'sportsCenter'
    }],
    bookings : [{
            type : mongoose.Schema.Types.ObjectId,
            ref : 'bookings'
    }]
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);