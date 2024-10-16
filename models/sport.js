
const mongoose = require("mongoose");
const sportsCenter = require("./sportsCenter");

const Schema = mongoose.Schema;
const opts = { toJSON: {virtuals: true}};


const sportSchema = new Schema({

    sportsName : String,
    description : String,
    Center : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'sportsCenter'
    },
    courts : [{
        courtBooking : [{
            type : mongoose.Schema.Types.ObjectId,
            ref : 'bookings'
        }]
    }]

})



module.exports = mongoose.model("sport",sportSchema);

