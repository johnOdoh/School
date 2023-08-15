const bcrypt = require('bcryptjs')
const puppeteer = require('puppeteer')
const { validationResult } = require('express-validator')

const path = require('path')
const fs = require('fs')

const Admin = require('../models/admin')
const Autoincrement = require('../models/autoincrement')
const Candidate = require('../models/candidate')
const Class = require('../models/class')
const Student = require('../models/student')
const Subject = require('../models/subject')
const Teacher = require('../models/teacher')

exports.getAdminLogin = ((req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/admin/dashboard')
    }
    res.render('adminLogin')
})
exports.postRegister = ((req, res, next) => {
    // (async() => {
    //     const browser = await puppeteer.launch();
    //     const page = await browser.newPage();
    //     await page.goto("http://localhost:8080/slip", {
    //         waitUntil: "networkidle0"
    //     })
    //     const fPath = path.join(__dirname, '../', 'slip.pdf')
    //         // await page.emulateMediaType('screen')
    //         // await page.pdf({
    //         //     path: fPath,
    //         //     format: "A4",
    //         //     printBackground: true
    //         // });
    //     const pdf = await page.pdf({ format: 'A4' })
    //     await browser.close()
    //     res.send(pdf)
    //         // fs.readFile(fPath, (err, data) => {
    //         //     if (err) {
    //         //         return res.send('Please reload')
    //         //     }
    //         //     res.setHeader('Content-Type', 'application/pdf')
    //         //     res.setHeader('Content-Disposition', `attachment: filename="slip.pdf"`)
    //         //     res.send(data)
    //         // })
    // })();
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.render('registration', {
            path: '',
            errors: error.mapped(),
            input: req.body
        })
    }
    let regNo
    Autoincrement.findOne({ collectionName: 'candidates' })
        .then(result => {
            regNo = result.lastId + 1
            result.lastId = regNo
            return result.save()
        })
        .then(() => {
            const candidate = new Candidate({
                surName: req.body.surName,
                firstName: req.body.firstName,
                middleName: req.body.middleName,
                regNo: regNo,
                password: regNo,
                class: req.body.class,
                address: req.body.address,
                state: req.body.state,
                LGA: req.body.lga,
                hometown: req.body.hometown,
                gender: req.body.gender,
                DOB: req.body.dob,
                bloodGroup: req.body.bloodGroup,
                year: new Date().getFullYear(),
                sponsor_phoneNo: req.body.sponsor_phoneNo,
                sponsor_address: req.body.sponsor_address,
                sponsor_surname: req.body.sponsor_sname,
                sponsor_firstname: req.body.sponsor_fname,
                sponsor_middlename: req.body.sponsor_mname,
                sponsor_email: req.body.sponsor_email
            })
            return candidate.save()
        })
        .then(() => {
            res.redirect('/slip/' + regNo)
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postAdminLogin = ((req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/')
    }
    Admin.findOne({ email: req.body.email })
        .then(admin => {
            if (!admin) {
                req.flash('err', 'Invalid email or password!')
                return res.redirect('back')
            }
            bcrypt.compare(req.body.password, admin.password)
                .then(match => {
                    if (!match) {
                        req.flash('err', 'Invalid email or password!')
                        return res.redirect('back')
                    }
                    req.session.userId = admin._id
                    req.session.role = admin.role
                    req.session.isLoggedIn = true
                    res.redirect('/admin/dashboard')
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postTeacherLogin = ((req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/')
    }
    Teacher.findOne({ email: req.body.email })
        .then(teacher => {
            if (!teacher) {
                req.flash('err', 'Invalid email or password!')
                return res.redirect('/login')
            }
            bcrypt.compare(req.body.password, teacher.password)
                .then(match => {
                    if (!match) {
                        req.flash('err', 'Invalid email or password!')
                        return res.redirect('/login')
                    }
                    if (teacher.rank === 'none') {
                        return res.render('teacher/complete-profile', { data: teacher, errors: {}, info: {} })
                    }
                    Class.findOne({ title: 'term' })
                        .then(result => {
                            req.session.term = result.term.name
                            req.session.termIndex = result.term.index
                            req.session.userId = teacher._id
                            req.session.role = teacher.role
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
        .catch(err => {
            console.log(err)
        })
})
exports.postStudentLogin = ((req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/')
    }
    Student.findOne({ regNo: req.body.regNo })
        .then(student => {
            if (!student) {
                req.flash('err', 'Invalid Username or Password!')
                return res.redirect('/login')
            }
            if (student.regNo == student.password) {
                return res.render('student/complete-profile', { data: student, err: undefined })
            }
            bcrypt.compare(req.body.password, student.password)
                .then(match => {
                    if (!match) {
                        req.flash('err', 'Invalid Username or Password!')
                        return res.redirect('/login')
                    }
                    Class.findOne({ title: 'term' })
                        .then(result => {
                            req.session.term = result.term.name
                            req.session.termIndex = result.term.index
                            req.session.userId = student._id
                            req.session.role = student.role
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
        .catch(err => {
            console.log(err)
        })
})
exports.postLogOut = ((req, res, next) => {
    req.session.isLoggedIn = false;
    req.session.userId = null;
    req.session.role = null;
    req.session.term = undefined;
    req.session.termIndex = undefined;
    req.session.save(() => {
        res.redirect('/');
    })
})

// exports.getAdminLogi = ((req, res, next) => {
//     // Subject.find({}, '_id')
//     //     .then(id => {
//     //         const ids = id.map(s => s._id)
//     //         console.log(ids)
//     //     })
//     const arr = [{
//             term: '1st',
//             content: []
//         },
//         {
//             term: '2nd',
//             content: []
//         },
//         {
//             term: '3rd',
//             content: []
//         }
//     ]
//     Subject.updateMany({}, { '$set': { 'classes.$[].scheme': arr } })
//         .then(result => {
//             console.log(result)
//         })
//         .catch((err) => {
//             console.log(err)
//         })
// })