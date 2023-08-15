const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')

const Admin = require('../models/admin')
const Blog = require('../models/blog')
const Candidate = require('../models/candidate')
const Class = require('../models/class')
const Student = require('../models/student')
const Subject = require('../models/subject')
const Teacher = require('../models/teacher')

const convert = (str) => {
    return str.replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, "\"").replace(/&#x2F;/g, "\/").replace(/nbsp;/g, " ")
}

exports.getDashboard = ((req, res, next) => {
    res.render('admin/dashboard', { path: 'dashboard' })
})
exports.getProfile = ((req, res, next) => {
    res.render('admin/profile', { path: 'profile' })
})
exports.getCandidates = ((req, res, next) => {
    Candidate.find()
        .then(candidates => {
            res.render('admin/candidates', { path: 'candidates', candidates: candidates, successMessage: req.flash('success') })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getCreateAdmin = ((req, res, next) => {
    res.render('admin/create-admin', { path: 'ca', errMessage: req.flash('err'), successMessage: req.flash('success') })
})
exports.getCreateTeacher = ((req, res, next) => {
    res.render('admin/create-teacher', { path: 'ct', errMessage: req.flash('err'), successMessage: req.flash('success') })
})
exports.getCreateSubject = ((req, res, next) => {
    res.render('admin/create-subject', { path: 'cs', errMessage: req.flash('err'), successMessage: req.flash('success') })
})
exports.getAssignRole = ((req, res, next) => {
    res.render('admin/assign-role', { path: 'as', errMessage: req.flash('err'), successMessage: req.flash('success') })
})
exports.getChangeTerm = ((req, res, next) => {
    res.render('admin/change-term', { path: 'cterm', errMessage: req.flash('err'), successMessage: req.flash('success') })
})
exports.getSearchStudent = ((req, res, next) => {
    res.render('admin/student-search', { path: 'ss' })
})
exports.getSearchTeacher = ((req, res, next) => {
    res.render('admin/teacher-search', { path: 'ts' })
})
exports.getPostUpload = ((req, res, next) => {
    res.render('admin/post-upload', { path: 'pu', edit: false, error: false, data: {} })
})
exports.getPostEdit = (async(req, res, next) => {
    try {
        const post = await Blog.findById(req.params.id)
        if (!post) return res.redirect('/404')
        res.render('admin/post-upload', { path: 'pu', error: false, edit: true, data: post })
    } catch (err) {
        console.log(err)
    }
})
exports.getAllPosts = (async(req, res, next) => {
    try {
        const posts = await Blog.find().sort('_id')
        res.render('admin/all-posts', { path: 'ap', posts: posts, message: req.flash('msg') })
    } catch (err) {
        console.log(err)
    }
})
exports.deletePost = (async(req, res, next) => {
    try {
        const result = await Blog.deleteOne({ _id: req.params.id })
        if (result.ok === 1) req.flash('msg', 'Post deleted')
        else req.flash('msg', 'Post not deleted, try again')
        res.redirect('back')
    } catch (err) {
        console.log(err)
    }
})

// exports.getPost = (async(req, res, next) => {
//     try {
//         const post = await Blog.findById(req.params.id)
//         if (!post) return res.redirect('/admin/allPosts')
//         let author
//         if (post.authorRole === 'teacher') {
//             author = await Teacher.findOne({ email: post.authorId }, 'firstName lastName image subjects')
//         } else if (post.authorRole === 'student') {
//             author = await Student.findOne({ regNo: post.authorId }, 'surName firstName middleName class division image')
//         }
//         res.render('admin/all-post', { path: 'ap', post: post, author: author })
//     } catch (err) {
//         console.log(err)
//     }
// })
exports.postAcceptCandidates = ((req, res, next) => {
    const candidateIds = req.body.candidateIds
    if (!candidateIds) {
        return res.redirect('back')
    }
    Candidate.find({ _id: { $in: candidateIds } })
        .then(candidates => {
            return Student.insertMany(candidates)
        })
        .then((result) => {
            req.flash('success', result.length + ' Candidate(s) accepted!')
            return Candidate.updateMany({ _id: { $in: candidateIds } }, { accepted: true })
        })
        .then(() => {
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postUnacceptCandidates = ((req, res, next) => {
    const candidateIds = req.body.candidateIds
    Student.deleteMany({ _id: { $in: candidateIds } })
        .then((result) => {
            req.flash('success', result.deletedCount + ' Candidate(s) unaccepted!')
            return Candidate.updateMany({ _id: { $in: candidateIds } }, { accepted: false })
        })
        .then(() => {
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postCreateAdmin = ((req, res, next) => {
    if (req.session.role !== 'admin') {
        return res.redirect('/')
    }
    // const errors = validationResult(req)
    // if (!errors.isEmpty()) {
    //     return res.status(422).render('auth/signup', {
    //         errMessage: req.flash('err'),
    //         successMessage: req.flash('success'),
    //         errors: errors.mapped(),
    //         input: {
    //             fName: firstName,
    //             lName: lastName,
    //             email: email
    //         }
    //     });
    // }
    Admin.findOne({ email: req.body.email })
        .then(result => {
            if (result) {
                req.flash('err', 'Email already exists!')
                return res.redirect('back')
            }
            const image = '/img/admin/' + req.file.filename;
            bcrypt.hash(req.body.password, 10)
                .then(passwordHash => {
                    const admin = new Admin({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        phoneNo: req.body.phone,
                        password: passwordHash,
                        image: image
                    })
                    return admin.save()
                })
                .then(result => {
                    req.flash('success', 'Admin Created!')
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
exports.postCreateTeacher = ((req, res, next) => {
    if (req.session.role !== 'admin') {
        return res.redirect('/')
    }
    Teacher.findOne({ email: req.body.email })
        .then(result => {
            if (result) {
                req.flash('err', 'Email already exists!')
                return res.redirect('back')
            }
            bcrypt.hash(req.body.email, 10)
                .then(hash => {
                    const teacher = new Teacher({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        password: hash
                    })
                    return teacher.save()
                })
                .then((reslt) => {
                    console.log(reslt)
                    req.flash('success', 'Teacher created Successfully!')
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
exports.postCreateSubject = ((req, res, next) => {
    if (req.session.role !== 'admin') {
        return res.redirect('/')
    }
    Subject.findOne({ email: req.body.name })
        .then(result => {
            if (result) {
                req.flash('err', 'Subject already exists!')
                return res.redirect('back')
            }
            let limit = 3,
                classes = req.body.class
            if (req.body.class === 'both') {
                limit = 6
                classes = 'JS'
            }
            const subClasses = []
            for (let i = 1; i <= limit; i++) {
                let name = classes.concat(i)
                if (i > 3) {
                    name = 'SS'.concat(i - 3)
                }
                const obj = {
                    name: name,
                    teachers: [],
                    scheme: [],
                    recommendedBooks: [],
                    assessments: []
                }
                subClasses.push(obj)
            }
            const subject = new Subject({
                name: req.body.name,
                classes: subClasses
            })
            return subject.save()
        })
        .then(() => {
            req.flash('success', 'Subject created Successfully!')
            res.redirect('back')
        })
        .catch(err => {
            console.log(err)
        })
})
exports.postAssignRole = ((req, res, next) => {
    if (req.session.role !== 'admin') {
        return res.redirect('/')
    }
    let id
    Teacher.findOne({ email: req.body.email })
        .then(teacher => {
            if (!teacher) {
                req.flash('err', 'No teacher with that email found!')
                return res.redirect('back')
            }
            if (teacher.rank === req.body.role) {
                req.flash('err', 'Teacher already has this role')
                return res.redirect('back')
            }
            teacher.class = req.body.class
            teacher.division = req.body.division
            id = teacher._id
            teacher.rank = req.body.role
            teacher.save()
                .then(() => {
                    return Class.findOne({ name: req.body.class })
                })
                .then(theClass => {
                    if (req.body.role === 'session-head') {
                        theClass.sessionHead = id
                    } else if (req.body.role === 'form-teacher') {
                        const index = theClass.divisions.findIndex(d => d.name === req.body.division)
                        theClass.divisions[index].teacher = id
                    }
                    return theClass.save()
                })
                .then(() => {
                    req.flash('success', 'Role assigned Successfully!')
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
exports.postChangeTerm = ((req, res, next) => {
    if (req.session.role !== 'admin') {
        return res.redirect('/')
    }
    Class.findOne({ title: 'term' })
        .then(doc => {
            if (doc.term === req.body.term) {
                req.flash('err', 'Selected term already in progress!')
                return res.redirect('back')
            }
            let termIndex
            if (req.body.term == '1st') {
                termIndex = 0
            } else if (req.body.term == '2nd')[
                termIndex = 1
            ]
            else [
                termIndex = 3
            ]
            doc.term.name = req.body.term
            doc.term.index = termIndex
            doc.save()
                .then(() => {
                    return Subject.updateMany({}, { $set: { 'classes.$[].assessments': [] } })
                })
                .then(() => {
                    req.flash('success', 'Term Changed!')
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
exports.postSearchStudent = (async(req, res, next) => {
    const { focus, keyword } = req.body
    let filter
    if (focus === 'all') {
        filter = { $or: [{ surName: new RegExp(keyword, 'i') }, { firstName: new RegExp(keyword, 'i') }, { lastName: new RegExp(keyword, 'i') }, { class: new RegExp(keyword, 'i') }, { regNo: keyword }] }
    } else if (focus === 'regNo') {
        filter = {
            regNo: keyword
        }
    } else {
        filter = {
            [focus]: new RegExp(keyword, 'i')
        }
    }
    // , { $where: "new RegExp(keyword, 'i').test(this.regNo)" }
    try {
        const students = await Student.find(filter, 'surName firstName lastName middleName regNo class division').sort('regNo')
        res.status(200).json(students)
    } catch (err) {
        console.log(err)
    }
})
exports.postSearchTeacher = (async(req, res, next) => {
    const { focus, keyword } = req.body
    let filter = {}
    if (focus === 'all') {
        filter = { $or: [{ firstName: new RegExp(keyword, 'i') }, { lastName: new RegExp(keyword, 'i') }, { rank: new RegExp(keyword, 'i') }, { subject: { $elemMatch: { name: new RegExp(keyword, 'i') } } }] }
    } else if (focus === 'subject') {
        filter = { subject: { $elemMatch: { name: new RegExp(keyword, 'i') } } }
    } else {
        filter = {
            [focus]: new RegExp(keyword, 'i')
        }
    }
    try {
        const teachers = await Teacher.find(filter).sort('id')
        res.status(200).json(teachers)
    } catch (err) {
        console.log(err)
    }
})
exports.postPostUpload = (async(req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.render('admin/post-upload', {
            path: 'pu',
            error: true,
            edit: false,
            data: req.body
        })
    }
    const body = {...req.body }
    if (!req.file) body.image = '/images/blog/default.jpg'
    else body.image = '/images/blog/' + req.file.filename
    body.content = convert(body.content)
    body.date = Date.now()
    body.comments = []
    try {
        const blog = new Blog(body)
        await blog.save()
        req.flash('msg', 'Post Created')
        res.redirect('/admin/allPosts')
    } catch (err) {
        console.log(err)
    }
})
exports.postPostEdit = (async(req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.render('/admin/postEdit/' + req.body.postId, {
            path: 'pu',
            error: true,
            edit: true,
            data: req.body
        })
    }
    try {
        const body = {...req.body }
        const blog = await Blog.findById(body.postId)
        if (!blog) return res.redirect('/404')
        if (req.file) blog.image = '/images/blog/' + req.file.filename
        blog.content = convert(body.content)
        blog.title = body.title
        blog.category = body.category
        blog.authorId = body.authorId
        blog.authorRole = body.authorRole
        const result = await blog.save()
        req.flash('msg', 'Post Edited')
        res.redirect('/admin/allPosts')
    } catch (err) {
        console.log(err)
    }
})