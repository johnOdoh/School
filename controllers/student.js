const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')

const fs = require('fs')
const path = require('path')

const Class = require('../models/class')
const Student = require('../models/student')
const Subject = require('../models/subject')

exports.getDashboard = ((req, res, next) => {
    res.render('student/dashboard', { path: 'dashboard' })
})
exports.getProfile = ((req, res, next) => {
    res.render('student/profile', { path: 'profile', editErr: req.flash('editErr'), editSucc: req.flash('editSucc'), passErr: req.flash('passErr'), passSucc: req.flash('passSucc') })
})
exports.getRegisterSubjects = ((req, res, next) => {
    if (req.user.mySubjects && req.user.mySubjects.length !== 0) {
        return res.redirect('/student/mySubjects')
    }
    Subject.find({ classes: { $elemMatch: { name: req.user.class } } }, 'name')
        .then(subjects => {
            res.render('student/register-subjects', { path: 'ms', subjects: subjects })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getMySubjects = ((req, res, next) => {
    if (!req.user.mySubjects || req.user.mySubjects.length === 0) {
        return res.redirect('/student/registerSubjects')
    }
    Subject.find({ _id: { $in: req.user.mySubjects } }, 'name')
        .then(subjects => {
            res.render('student/my-subjects', { path: 'ms', mySubjects: subjects })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getSubjectInfo = ((req, res, next) => {
    Subject.findOne({ name: req.params.subject })
        .then(result => {
            if (!result) {
                return res.redirect('/student/mySubjects')
            }
            const index = result.classes.findIndex(c => c.name === req.user.class)
            result.populate(`classes.${index}.teachers`).execPopulate()
                .then(subject => {
                    const subjectInfo = subject.classes[index]
                    const assessments = subjectInfo.assessments.map(a => {
                        let score = a.scores.find(s => s.student.toString() === req.user._id.toString()) || { score: 0 }
                        let obj = {
                            title: a.title,
                            description: a.description,
                            maxScore: a.maxScore,
                            score: score.score
                        }
                        return obj
                    })
                    res.render('student/subject-info', { path: 'ms', subjectInfo: subjectInfo, assessments: assessments, termIndex: req.session.termIndex })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getTimetable = ((req, res, next) => {
    Class.findOne({ name: req.user.class })
        .then(myClass => {
            if (!myClass) {
                return res.redirect('/404')
            }
            const exists = myClass.divisions.find(d => d.name === req.user.division)
            if (!exists) {
                return res.redirect('/404')
            }
            res.render('student/timetable', { path: 'tt', timetable: exists.timetable })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getResults = ((req, res, next) => {
    const year = new Date().getFullYear()
    res.render('results', { path: 'r', year: year })
})
exports.postCompleteProfile = ((req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.render('student/complete-profile', {
            data: req.body,
            err: error.array()[0].msg
        })
    }
    if (!req.file) {
        return res.render('student/complete-profile', {
            data: req.body,
            err: 'Image must be a jpg, jpeg or png file'
        })
    }
    Student.findById(req.body.id)
        .then(student => {
            if (!student) {
                return res.redirect('/404')
            }
            const image = '/img/student/' + req.file.filename;
            bcrypt.hash(req.body.password, 10)
                .then(hash => {
                    student.image = image
                    student.password = hash
                    return student.save()
                })
                .then(user => {
                    req.session.userId = user._id
                    req.session.role = user.role
                    req.session.isLoggedIn = true
                    res.redirect('/student/dashboard')
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postEditProfile = ((req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        req.flash('editErr', error.array()[0].msg)
        return res.redirect('back')
    }
    req.user.address = req.body.address
    req.user.sponsor_surname = req.body.sponsorSName
    req.user.sponsor_firstname = req.body.sponsorFName
    req.user.sponsor_middlename = req.body.sponsorMName
    req.user.sponsor_address = req.body.sponsorAddress
    req.user.sponsor_phoneNo = req.body.sponsorPhone
    req.user.sponsor_email = req.body.sponsorEmail
    req.user.save()
        .then(() => {
            req.flash('editSucc', 'Profile Edited Successfully')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postChangePassword = ((req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        req.flash('passErr', error.array()[0].msg)
        return res.redirect('back')
    }
    bcrypt.compare(req.body.current, req.user.password)
        .then(match => {
            if (!match) {
                req.flash('passErr', 'Incorrect Password!')
                return res.redirect('back')
            }
            bcrypt.hash(req.body.new, 10)
                .then(hash => {
                    req.user.password = hash
                    return req.user.save()
                })
                .then(() => {
                    req.flash('passSucc', 'Password Change Successful')
                    return res.redirect('back')
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postRegisterSubjects = ((req, res, next) => {
    const subjectIds = req.body.subjectIds
    req.user.mySubjects = subjectIds
    req.user.save()
        .then(() => {
            res.redirect('/student/mySubjects')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postGetResult = ((req, res, next) => {
    const params = req.body
    const pth = path.join(__dirname, '../', 'public', 'results', params.class, params.year, params.term, req.user.regNo)
    fs.access(pth, fs.constants.F_OK, (err) => {
        if (err) {
            req.flash('err', 'No result found!')
            return res.redirect('back')
        }
        res.render('result', { params: params })
    })
})