const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')

const fs = require('fs')
const path = require('path')

const Teacher = require('../models/teacher')
const Subject = require('../models/subject')
const Class = require('../models/class')
const Student = require('../models/student')

const isAuth = (req, subj, clas) => {
    const exists = req.user.subjects.some(s => s.name === subj && s.class === clas)
    return exists
}

//general controllers
exports.getDashboard = ((req, res, next) => {
    res.render('teacher/dashboard', { path: 'dashboard' })
})
exports.getProfile = ((req, res, next) => {
    res.render('teacher/profile', { path: 'profile', editErr: undefined, editSucc: undefined, passErr: undefined, passSucc: undefined })
})
exports.getSubjectInfo = ((req, res, next) => {
    let studs
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            const index = subject.classes.findIndex(c => c.name === req.params.class)
            if (index === -1) {
                return res.redirect('/404')
            }
            const subjectInfo = subject.classes[index]
            const exists = subjectInfo.teachers.includes(req.user._id)
            if (!exists) {
                return res.redirect('/404')
            }
            Student.find({ class: req.params.class, mySubjects: subject._id })
                .then(result => {
                    studs = result
                    return Class.findOne({ name: req.params.class })
                })
                .then(theClass => {
                    const divs = theClass.divisions.map(d => d.name)
                    const termIndex = req.session.termIndex
                    const info = {
                        subject: req.params.subject,
                        class: req.params.class,
                        index: index
                    }
                    res.render('teacher/subject-info', { path: 'si', subject: subjectInfo, info: info, termIndex: termIndex, divs: divs, students: studs, message: req.flash('message') })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getScoresUpload = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject }).populate(`classes.${req.params.index}.assessments.${req.params.assIndex}.scores.student`, 'firstName surName middleName division regNo ')
        .then(subject => {
            if (!subject) {
                return res.redirect('/404')
            }
            const scores = subject.classes[req.params.index].assessments[req.params.assIndex].scores
            const index = {
                class: req.params.index,
                assessment: req.params.assIndex
            }
            Class.findOne({ name: req.params.class })
                .then(theClass => {
                    const divs = theClass.divisions.map(d => d.name)
                    res.render('teacher/scores-upload', { path: 'ms', subject: req.params.subject, theClass: req.params.class, scores: scores, index: index, divs: divs })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postCompleteProfile = ((req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.render('teacher/complete-profile', {
            data: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email
            },
            errors: error.mapped(),
            info: req.body
        })
    }
    if (!req.file) {
        return res.render('teacher/complete-profile', {
            data: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                _id: req.body.id
            },
            errors: { image: true },
            info: req.body
        })
    }
    Teacher.findById(req.body.id)
        .then(teacher => {
            if (!teacher) {
                return res.redirect('404')
            }
            const image = '/img/teacher/' + req.file.filename
            bcrypt.hash(req.body.password, 10)
                .then(hash => {
                    teacher.gender = req.body.gender
                    teacher.phoneNo = req.body.phone
                    teacher.DOB = req.body.dob
                    teacher.image = image
                    teacher.address = req.body.address
                    teacher.password = hash
                    teacher.rank = 'teacher'
                    return teacher.save()
                })
                .then(result => {
                    req.session.userId = result._id
                    req.session.role = result.role
                    req.session.isLoggedIn = true
                    res.redirect('/teacher/dashboard')
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
        return res.render('teacher/profile', { path: 'profile', editErr: error.array()[0].msg, editSucc: undefined, passErr: undefined, passSucc: undefined })
    }
    if (req.file) {
        const image = '/img/teacher/' + req.file.filename
        const pth = 'public' + req.user.image;
        fs.unlink(pth, (err) => {
            if (err) {
                console.log(pth + ' NOT DELETED');
            }
        })
        req.user.image = image
    }
    req.user.address = req.body.address
    req.user.phoneNo = req.body.phoneNo
    req.user.save()
        .then(() => {
            res.render('teacher/profile', { path: 'profile', editErr: undefined, editSucc: 'Profile Edited Successfully', passErr: undefined, passSucc: undefined })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postChangePassword = ((req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.render('teacher/profile', { path: 'profile', editErr: undefined, editSucc: undefined, passErr: error.array()[0].msg, passSucc: undefined })
    }
    bcrypt.compare(req.body.current, req.user.password)
        .then(match => {
            if (!match) {
                return res.render('teacher/profile', { path: 'profile', editErr: undefined, editSucc: undefined, passErr: 'Incorrect Password!', passSucc: undefined })
            }
            bcrypt.hash(req.body.new, 10)
                .then(hash => {
                    req.user.password = hash
                    return req.user.save()
                })
                .then(() => {
                    res.render('teacher/profile', { path: 'profile', editErr: undefined, editSucc: undefined, passErr: undefined, passSucc: 'Password Change Successful' })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postEditScheme = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            const subjectClass = subject.classes[req.body.index],
                index = req.body.index,
                termIndex = req.session.termIndex
            subjectClass.scheme[termIndex].content = req.body.scheme
            subject.classes[index] = subjectClass
            return subject.save()
        })
        .then(() => {
            req.flash('message', 'Scheme Edited')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postCreateAssessment = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    let scores = []
    Student.find({ class: req.params.class }, '_id')
        .then(result => {
            scores = result.map(s => {
                const obj = {
                    student: s._id,
                    score: 0
                }
                return obj
            })
            return Subject.findOne({ name: req.params.subject })
        })
        .then(subject => {
            const index = req.body.index,
                subjectClass = subject.classes[index],
                assessment = {
                    title: req.body.title,
                    description: req.body.description,
                    maxScore: req.body.maxScore,
                    scores: scores
                }
            subjectClass.assessments.push(assessment)
            subject.classes[index] = subjectClass
            return subject.save()
        })
        .then(() => {
            req.flash('message', 'Assessment Created')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postEditAssessment = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            subject.classes[req.body.index].assessments[req.body.assIndex].title = req.body.title
            subject.classes[req.body.index].assessments[req.body.assIndex].description = req.body.description
            subject.classes[req.body.index].assessments[req.body.assIndex].maxScore = req.body.maxScore
            return subject.save()
        })
        .then(() => {
            req.flash('message', 'Assessment Edited')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postRemoveAssessment = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            subject.classes[req.body.index].assessments.splice(req.body.assIndex, 1)
            return subject.save()
        })
        .then(() => {
            req.flash('message', 'Assessment Removed')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postRecommendBook = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            const subjectClass = subject.classes[req.body.index],
                index = req.body.index,
                book = {
                    title: req.body.title,
                    author: req.body.author
                }
            subjectClass.recommendedBooks.push(book)
            subject.classes[index] = subjectClass
            return subject.save()
        })
        .then(() => {
            req.flash('message', 'Book Recommended')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postEditBook = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            subject.classes[req.body.index].recommendedBooks[req.body.bookIndex].title = req.body.title
            subject.classes[req.body.index].recommendedBooks[req.body.bookIndex].author = req.body.author
            return subject.save()
        })
        .then(() => {
            req.flash('message', 'Book Edited')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postRemoveBook = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            subject.classes[req.body.index].recommendedBooks.splice(req.body.bookIndex, 1)
            return subject.save()
        })
        .then(() => {
            req.flash('message', 'Book Removed')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postUploadScores = ((req, res, next) => {
    if (!isAuth(req, req.params.subject, req.params.class)) {
        return res.redirect('/404')
    }
    Subject.findOne({ name: req.params.subject })
        .then(subject => {
            if (!subject) {
                return res.redirect('/404')
            }
            const scores = []
            for (let i = 0; i < req.body.studentIds.length; i++) {
                const score = {
                    student: req.body.studentIds[i],
                    score: req.body.scores[i]
                }
                scores.push(score)
            }
            subject.classes[req.body.index].assessments[req.body.assIndex].scores = scores
            subject.save()
                .then(() => {
                    res.redirect('back')
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})

//sectional-head controllers
exports.getMyTeachers = ((req, res, next) => {
    Subject.find({ classes: { $elemMatch: { name: req.user.class } } }).populate('classes.teachers')
        .then(subjects => {
            const allSubjects = subjects.map(s => s.name)
            let myTeachers = []
            subjects.forEach(subject => {
                const index = subject.classes.findIndex(c => c.name === req.user.class)
                subject.classes[index].teachers.forEach(teacher => {
                    if (!myTeachers.some(t => t._id === teacher._id)) {
                        myTeachers.push(teacher)
                    }
                })
            })
            res.render('teacher/my-teachers', { path: 'mt', myTeachers: myTeachers, subjects: allSubjects, errMessage: req.flash('err'), successMessage: req.flash('success') })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getTeacherProfile = ((req, res, next) => {
    let allSubjects = []
    Subject.find({}, 'name')
        .then(subjects => {
            allSubjects = subjects.map(s => s.name)
            return Teacher.findById(req.params.id)
        })
        .then(teacher => {
            if (!teacher) {
                return res.redirect('back')
            }
            res.render('teacher/teacher-profile', { path: 'mt', teacher: teacher, subjects: allSubjects, errMessage: req.flash('err'), successMessage: req.flash('success') })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postAssignStudentDivision = ((req, res, next) => {
    const studentIds = req.body.studentIds
    if (!studentIds) {
        return res.redirect('back')
    }
    Student.updateMany({ _id: { $in: studentIds } }, { division: req.body.division })
        .then(result => {
            // console.log(result)
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postAssignSubject = ((req, res, next) => {
    let teacherId
    Teacher.findOne({ email: req.body.email })
        .then(teacher => {
            if (!teacher) {
                req.flash('err', 'No teacher with that Email found!')
                return res.redirect('back')
            }
            const exists = teacher.subjects.find(s => s.name === req.body.subject && s.class === req.user.class)
            if (exists) {
                req.flash('err', 'Subject already assigned to teacher!')
                return res.redirect('back')
            }
            teacherId = teacher._id
            const newSubject = {
                name: req.body.subject,
                class: req.user.class
            }
            teacher.subjects.push(newSubject)
            Subject.findOne({ name: req.body.subject })
                .then(subject => {
                    if (!subject) {
                        req.flash('err', 'Subject not found!')
                        return res.redirect('back')
                    }
                    const index = subject.classes.findIndex(c => c.name === req.user.class)
                    if (index === -1) {
                        req.flash('err', 'Subject not available to your class!')
                        return res.redirect('back')
                    }
                    subject.classes[index].teachers.push(teacherId)
                    subject.save()
                        .then(() => {
                            return teacher.save()
                        })
                        .then(() => {
                            req.flash('success', 'Subject Assigned Successfully!')
                            res.redirect('back')
                        })
                        .catch(err => {
                            console.log(err)
                        })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postUnassignSubject = ((req, res, next) => {
    let teacherId
    let teacher
    Teacher.findOne({ email: req.body.email })
        .then(result => {
            teacher = result
            teacherId = teacher._id
            const index = teacher.subjects.findIndex(s => s.name === req.body.subject && s.class === req.user.class)
            if (index !== -1) {
                teacher.subjects.splice(index, 1)
            }
            return Subject.findOne({ name: req.body.subject })
        })
        .then(subject => {
            if (subject) {
                const classIndex = subject.classes.findIndex(c => c.name === req.user.class)
                const idIndex = subject.classes[classIndex].teachers.indexOf(teacherId)
                if (idIndex !== -1) {
                    subject.classes[classIndex].teachers.splice(idIndex, 1)
                    return subject.save()
                }
            }
        })
        .then(() => {
            return teacher.save()
        })
        .then(() => {
            req.flash('success', 'Subject Removed!')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})

//form-teacher controllers
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
            res.render('teacher/timetable', { path: 'tt', timetable: exists.timetable })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getResults = (async(req, res, next) => {
    try {
        const myClass = await Class.findOne({ name: req.user.class, divisions: { $elemMatch: { teacher: req.user._id } } })
        if (!myClass) {
            return res.redirect('/404')
        }
        const students = await Student.find({ class: req.user.class, division: req.user.division })
        res.render('teacher/results', { path: 'r', myStudents: students, term: req.session.term, msg: req.flash('msg') })
    } catch (err) {
        console.log(err)
    }
})
exports.getPromotion = ((req, res, next) => {
    Class.findOne({ name: req.user.class, divisions: { $elemMatch: { teacher: req.user._id } } }, 'surName firstName middleName regNo')
        .then(myClass => {
            if (!myClass) {
                return res.redirect('/404')
            }
            Student.find({ class: req.user.class, division: req.user.division })
                .then(students => {
                    res.render('teacher/promotion', { path: 'p', myStudents: students })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postTimetable = ((req, res, next) => {
    Class.findOne({ name: req.user.class })
        .then(myClass => {
            if (!myClass) {
                return res.redirect('/404')
            }
            const index = myClass.divisions.findIndex(d => d.name === req.user.division)
            if (index === -1) {
                return res.redirect('/404')
            }
            const timetable = []
            for (let i = 0; i < req.body.subject.length; i++) {
                const table = {
                    startTime: req.body.start[i],
                    endTime: req.body.end[i],
                    subject: req.body.subject[i]
                }
                timetable.push(table)
            }
            myClass.divisions[index].timetable[req.body.day] = timetable
            myClass.save()
                .then(() => {
                    res.redirect('back')
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postUploadResult = ((req, res, next) => {
    console.log(req.files)
    req.flash('msg', req.files.length + ' result(s) uploaded')
    res.redirect('back')
})
exports.postPromotion = (async(req, res, next) => {
    try {
        const curClass = req.user.class
        let nextClass
        if (curClass === 'JS1') {
            nextClass = 'JS1'
        } else if (curClass === 'JS2') {
            nextClass = 'JS3'
        } else if (curClass === 'JS3') {
            nextClass = 'SS1'
        } else if (curClass === 'SS1') {
            nextClass = 'SS2'
        } else if (curClass === 'SS2') {
            nextClass = 'SS3'
        } else {
            return res.redirect('/404')
        }
        const result = await Student.updateMany({ _id: { $in: req.body.studentIds } }, { class: nextClass, division: undefined })
        console.log(result)
        res.redirect('back')
    } catch (err) {
        console.log(err)
    }
})

//both
exports.getMyStudents = ((req, res, next) => {
    if (!req.user.division) {
        Class.findOne({ name: req.user.class, sessionHead: req.user._id })
            .then(myClass => {
                if (!myClass) {
                    return res.redirect('/404')
                }
                Student.find({ class: req.user.class })
                    .then(students => {
                        res.render('teacher/my-students', { path: 'ms', classInfo: myClass, myStudents: students })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
            .catch(err => {
                console.log(err)
            })
    } else {
        Class.findOne({ name: req.user.class, divisions: { $elemMatch: { teacher: req.user._id } } })
            .then(myClass => {
                if (!myClass) {
                    return res.redirect('/404')
                }
                Student.find({ class: req.user.class, division: req.user.division })
                    .then(students => {
                        res.render('teacher/my_students', { path: 'ms', classInfo: myClass, myStudents: students })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
            .catch(err => {
                console.log(err)
            })
    }
})
exports.getStudentProfile = ((req, res, next) => {
    Student.findById(req.params.id)
        .then(student => {
            if (!student) {
                return res.redirect('back')
            }
            res.render('teacher/student-profile', { path: 'ms', student: student })
        })
        .catch(err => {
            console.log(err)
        })
})