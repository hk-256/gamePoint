
const mongoose = require("mongoose");
const { schema } = require("./user");
// const { schema } = require("./sport")


const Schema = mongoose.Schema;
const opts = { toJSON: {virtuals: true}};

const centerSchema = new Schema({

    name : String,
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    location : String,
    description : String,
    sports : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'sport'
    }]

})



module.exports = mongoose.model("sportsCenter",centerSchema);

