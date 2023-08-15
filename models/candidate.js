const mongoose = require('mongoose')

const Schema = mongoose.Schema

const candidateSchema = new Schema({
    surName: String,
    firstName: String,
    middleName: String,
    regNo: Number,
    password: String,
    class: String,
    address: String,
    state: String,
    LGA: String,
    hometown: String,
    gender: String,
    DOB: String,
    year: Number,
    bloodGroup: String,
    sponsor_phoneNo: String,
    sponsor_address: String,
    sponsor_surname: String,
    sponsor_firstname: String,
    sponsor_middlename: String,
    sponsor_email: String,
    accepted: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('candidate', candidateSchema)