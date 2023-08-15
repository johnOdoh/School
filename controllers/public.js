const puppeteer = require('puppeteer')
const crypto = require('crypto')
const { validationResult } = require('express-validator')

const Blog = require('../models/blog')
const Candidate = require('../models/candidate')
const Class = require('../models/class')
const Student = require('../models/student')
const Subject = require('../models/subject')
const Teacher = require('../models/teacher')

const algorithm = 'aes-256-ctr';
const password = 'A secret';

const encrypt = (text) => {
    var cipher = crypto.createCipher(algorithm, password)
    var crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex');
    return crypted;
}
const decrypt = (text) => {
    var decipher = crypto.createDecipher(algorithm, password)
    var dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}

const time_ago = (time) => {
    const current_time = new Date().getTime(),
        time_diff = current_time - time.getTime(),
        seconds = time_diff,
        minute = Math.ceil(seconds / (60 * 1000)),
        hour = Math.ceil(seconds / (60 * 60 * 1000)),
        day = Math.ceil(seconds / (60 * 60 * 24 * 1000)),
        week = Math.ceil(seconds / (60 * 60 * 24 * 7 * 1000)),
        month = Math.ceil(seconds / ((60 * 60 * 24) * (365 / 12) * 1000)),
        year = Math.ceil(seconds / (60 * 60 * 24 * 365 * 1000))
        // console.log(seconds, minute, hour)
    if (seconds < 60) {
        return `Just now`;
    } else if (minute < 60) {
        if (minute == 1) {
            return `1 minute ago`;
        } else {
            return `${minute} minutes ago`;
        }
    } else if (hour < 24) {
        if (hour == 1) {
            return `1 hour ago`;
        } else {
            return `${hour} hours ago`;
        }
    } else if (day < 7) {
        if (day == 1) {
            return `1 day ago`;
        } else {
            return `${day} days ago`;
        }
    } else if (week <= 4) {
        if (week == 1) {
            return `1 week ago`;
        } else {
            return `${week} weeks ago`;
        }
    } else if (month < 12) {
        if (month == 1) {
            return `1 month ago`;
        } else {
            return `${month} months ago`;
        }
    } else {
        if (year == 1) {
            return `1 year ago`;
        } else {
            return `${year} years ago`;
        }
    }
}

exports.getHome = ((req, res, next) => {
    res.render('index', { path: '' })
})
exports.get404 = ((req, res, next) => {
    res.send('Page not Found!')
})
exports.getClassInfo = ((req, res, next) => {
    let subs
    Subject.find({ classes: { $elemMatch: { name: req.params.class } } }, 'name')
        .then(subjects => {
            subs = subjects
            return Class.findOne({ name: req.params.class }).populate('sessionHead divisions.teacher')
        })
        .then(theClass => {
            res.render('class-info', { path: '', subjects: subs, theClass: theClass })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getSubjectInfo = ((req, res, next) => {
    Subject.findOne({ name: req.params.subject })
        .then(result => {
            if (!result) {
                return res.redirect('/404')
            }
            const index = result.classes.findIndex(c => c.name === req.params.class)
            if (index === -1) {
                return res.redirect('/404')
            }
            let subjectInfo
            result.populate(`classes.${index}.teachers`).execPopulate()
                .then(subject => {
                    subjectInfo = subject.classes[index]
                    return Class.findOne({ title: 'term' })
                })
                .then(doc => {
                    res.render('subject-info', { path: '', subjectInfo: subjectInfo, termInfo: doc.term, subj: req.params.subject })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
})
exports.getRegisteration = ((req, res, next) => {
    res.render('registration', { path: '', errors: {}, input: {} })
})
exports.getSlip = (async(req, res, next) => {
    try {
        const candidate = await Candidate.findOne({ regNo: req.params.id })
        res.render('slip', { data: candidate })
    } catch (err) {
        console.log(err)
    }
})
exports.getPdf = (async(req, res, next) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("http://localhost:8080/slip/" + req.params.id, {
                waitUntil: "networkidle0"
            })
            // const fPath = path.join(__dirname, '../', 'slip.pdf')
            // await page.emulateMediaType('screen')
            // await page.pdf({
            //     path: fPath,
            //     format: "A4",
            //     printBackground: true
            // });
        const pdf = await page.pdf({ format: 'A4' })
        await browser.close()
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment: filename="slip.pdf"`)
        res.setHeader('Content-Length', pdf.length)
        res.send(pdf)
            // fs.readFile(fPath, (err, data) => {
            //     if (err) {
            //         return res.send('Please reload')
            //     }
            //     res.send(data)
            // })
    } catch (err) {
        console.log(err)
    }
})
exports.getLogin = ((req, res, next) => {
    if (req.session.isLoggedIn) {
        return res.redirect('/')
    }
    res.render('login', { path: '', errMessage: req.flash('err'), successMessage: req.flash('success') })
})
exports.getBlog = (async(req, res, next) => {
    const cat = req.query.category
    const aut = req.query.aut
    const search = req.query.q
    const page = +req.query.page || 1;
    const postLimit = 4;
    let numOfPosts,
        filter = {},
        query = ''
    if (cat) {
        filter = { category: cat }
        query = 'category=' + cat
    } else if (aut) {
        filter = { authorId: aut }
        query = 'aut=' + aut
    } else if (search) {
        filter = { $or: [{ title: new RegExp(search, 'i') }, { content: new RegExp(search, 'i') }, { category: new RegExp(search, 'i') }] }
        query = 'q=' + search
    }
    try {
        const count = await Blog.countDocuments(filter)
        numOfPosts = count;
        const posts = await Blog.find(filter).sort('-_id').skip((page - 1) * postLimit).limit(postLimit)
        const numOfPages = Math.ceil(numOfPosts / postLimit)
        res.render('blog', {
            posts: posts,
            numOfPages: numOfPages,
            currentPage: page,
            num: numOfPosts,
            query: query
        })
    } catch (err) {
        console.log(err)
    }
})
exports.getPost = (async(req, res, next) => {
    try {
        const post = await Blog.findById(req.params.id)
        if (!post) return res.redirect('/404')
        let author
        if (post.authorRole === 'teacher') {
            author = await Teacher.findOne({ email: post.authorId }, 'firstName lastName image subjects email')
        } else if (post.authorRole === 'student') {
            author = await Student.findOne({ regNo: post.authorId }, 'surName firstName middleName class division image regNo')
        }
        const related = await Blog.find({ category: post.category }, 'title date image').sort('-_id').limit(3)
        let cred = { name: '', email: '', url: '' }
        if (req.cookies['data']) {
            const data = req.cookies['data'].split('::');
            cred = {
                name: decrypt(data[0]),
                email: decrypt(data[1]),
                url: decrypt(data[2])
            }
        }
        const mod = []
        post.comments.forEach(c => {
                const obj = {...c, time: time_ago(c.date) }
                obj._doc.time = time_ago(c.date)
                mod.push(obj)
            })
            // console.log(mod)
        res.render('blog-single', { path: 'ap', post: post, author: author, related: related, cred: cred, comments: mod })
    } catch (err) {
        console.log(err)
    }
})
exports.postComment = (async(req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.redirect('back')
    }
    try {
        const blog = await Blog.findById(req.body.id)
        if (!blog) return res.redirect('/404')
        const comment = {...req.body }
        comment.date = Date.now()
        blog.comments.push(comment)
        await blog.save()
        if (req.body.rem) {
            const value = encrypt(comment.name) + '::' + encrypt(comment.email) + '::' + encrypt(comment.url);
            res.cookie('data', value, { maxAge: 1000 * 60 * 60 * 24 * 30 * 12, httpOnly: true });
        }
        res.redirect('back')
    } catch (err) {
        console.log(err)
    }
})
exports.deleteComment = (async(req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id)
        if (!blog) return res.redirect('/404')
        blog.comments.splice(req.params.index, 1)
        await blog.save()
        res.redirect('back')
    } catch (err) {
        console.log(err)
    }
})