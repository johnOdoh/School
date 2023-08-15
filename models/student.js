const mongoose = require('mongoose')

const Schema = mongoose.Schema

const studentSchema = new Schema({
    surName: String,
    firstName: String,
    middleName: String,
    regNo: Number,
    class: String,
    division: String,
    address: String,
    state: String,
    LGA: String,
    hometown: String,
    gender: String,
    DOB: String,
    bloodGroup: String,
    year: Number,
    image: String,
    password: String,
    role: {
        type: String,
        default: 'student'
    },
    mySubjects: [{
        type: Schema.Types.ObjectId,
        ref: 'subject'
    }],
    sponsor_phoneNo: String,
    sponsor_address: String,
    sponsor_surname: String,
    sponsor_firstname: String,
    sponsor_middlename: String,
    sponsor_email: String
})

module.exports = mongoose.model('student', studentSchema)