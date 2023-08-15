const mongoose = require('mongoose')

const Schema = mongoose.Schema

const teacherSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNo: String,
    password: String,
    image: String,
    role: {
        type: String,
        default: 'teacher'
    },
    subjects: [{
        _id: false,
        name: String,
        class: String
    }],
    class: String,
    division: String,
    rank: {
        type: String,
        default: 'none'
    },
    address: String,
    gender: String,
    DOB: String
})

module.exports = mongoose.model('teacher', teacherSchema)