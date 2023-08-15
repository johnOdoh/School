const mongoose = require('mongoose')

const Schema = mongoose.Schema

const blogSchema = new Schema({
    title: String,
    category: String,
    content: String,
    authorId: String,
    authorRole: String,
    image: String,
    date: Date,
    comments: [{
        name: String,
        comment: String,
        email: String,
        url: String,
        date: Date
    }]
})

module.exports = mongoose.model('blog', blogSchema)