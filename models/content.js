var mongoose = require("mongoose");
var contents = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    link:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    type:{ // paid or unpaid, yes or no
        type: String,
        default:null
    },
    upvotes:{ // post approval
        type: Number,
        default: 0
    },
    downvotes:{ // post approval
        type: Number,
        default: 0
    },
    language:{
        type: String,
        required: true
    },
    category:{
        type: String,
        default: null
    },
    courseDate:{
        type: String,
        default: null
    }
});

module.exports = mongoose.model('contents',contents);