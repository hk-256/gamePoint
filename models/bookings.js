
const mongoose = require("mongoose");
const user = require("./user");

const Schema = mongoose.Schema;
const opts = { toJSON: {virtuals: true}};


const bookingSchema = new Schema({

    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    sport : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'sport'
    },
    courtNumber : Number,
    date : Date,
    slot : {
        type : Number,
        min : 6,
        max : 23
    }
})



module.exports = mongoose.model("bookings",bookingSchema);

