const mongoose = require('mongoose')

const Schema = mongoose.Schema

const classSchema = new Schema({
    name: String,
    divisions: [{
        _id: false,
        name: String,
        teacher: {
            type: Schema.Types.ObjectId,
            ref: 'teacher'
        },
        timetable: {
            monday: [{
                _id: false,
                subject: String,
                startTime: String,
                endTime: String
            }],
            tuesday: [{
                _id: false,
                subject: String,
                startTime: String,
                endTime: String
            }],
            wednesday: [{
                _id: false,
                subject: String,
                startTime: String,
                endTime: String
            }],
            thursday: [{
                _id: false,
                subject: String,
                startTime: String,
                endTime: String
            }],
            friday: [{
                _id: false,
                subject: String,
                startTime: String,
                endTime: String
            }]
        }
    }],
    sessionHead: {
        type: Schema.Types.ObjectId,
        ref: 'teacher'
    },
    title: String,
    term: {
        name: String,
        index: Number
    }
})

module.exports = mongoose.model('classes', classSchema)