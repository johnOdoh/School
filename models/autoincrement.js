const mongoose = require('mongoose')

const Schema = mongoose.Schema

const autoincrementSchema = new Schema({
    collectionName: String,
    lastId: Number
})

module.exports = mongoose.model('autoincrement', autoincrementSchema)