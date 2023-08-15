const mongoose = require('mongoose')

const Schema = mongoose.Schema

const adminSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    phoneNo: String,
    password: String,
    image: String,
    role: {
        type: String,
        default: 'admin'
    }
})

module.exports = mongoose.model('admin', adminSchema)