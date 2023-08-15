const mongoose = require('mongoose')

const Schema = mongoose.Schema

const subjectSchema = new Schema({
    name: String,
    classes: [{
        _id: false,
        name: String,
        teachers: [{
            type: Schema.Types.ObjectId,
            ref: 'teacher'
        }],
        scheme: [{
            _id: false,
            term: String,
            content: [String]
        }],
        recommendedBooks: [{
            _id: false,
            title: String,
            author: String
        }],
        assessments: [{
            _id: false,
            title: String,
            description: String,
            maxScore: Number,
            scores: [{
                _id: false,
                student: {
                    type: Schema.Types.ObjectId,
                    ref: 'student'
                },
                score: Number
            }]
        }]
    }]
})

module.exports = mongoose.model('subject', subjectSchema)