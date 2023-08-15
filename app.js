//importing external dependencies
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const multer = require('multer')
const csrf = require('csurf')
const flash = require('connect-flash')
const session = require('express-session')
const mongoDBStore = require('connect-mongodb-session')(session)
const cookieParser = require('cookie-parser')

//importing express built-in modules
const path = require('path')
const fs = require('fs')

//routes import
const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const teacherRoutes = require('./routes/teacher')
const studentRoutes = require('./routes/student')
const publicRoutes = require('./routes/public')

//models import
const Admin = require('./models/admin')
const Student = require('./models/student')
const Teacher = require('./models/teacher')

//initializing express
const app = express()
const sessionStore = new mongoDBStore({
    uri: 'mongodb+srv://johnny:12345678%2B%2B--@johnny-u8qnc.mongodb.net',
    databaseName: 'school',
    collection: 'sessions'
})

//initializing middlewares
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
    // app.use()
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
        secret: 'a very strong secret',
        name: 'sessionId',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    }))
    // app.use(csrf())
app.use(flash())
app.use(cookieParser())
    //setting the view engine
app.set('view engine', 'ejs')

app.use((req, res, next) => {
    if (req.session.role && req.session.userId) {
        if (req.session.role === 'admin') {
            Admin.findById(req.session.userId)
                .then(user => {
                    req.user = user;
                    next();
                })
                .catch((err) => {
                    console.log(err);
                })
        } else if (req.session.role === 'teacher') {
            Teacher.findById(req.session.userId)
                .then(user => {
                    req.user = user;
                    next();
                })
                .catch((err) => {
                    console.log(err);
                })
        } else if (req.session.role === 'student') {
            Student.findById(req.session.userId)
                .then(user => {
                    req.user = user;
                    next();
                })
                .catch((err) => {
                    console.log(err);
                })
        }
    } else {
        next()
    }
})
app.use((req, res, next) => {
    // res.locals.csrfToken = req.csrfToken();
    res.locals.isLoggedIn = req.session.isLoggedIn
    res.locals.user = req.user
    next();
})

//result upload
app.use('/teacher/uploadResult', multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                let year = new Date().getFullYear()
                if (req.body.term === '1st') {
                    year += 1
                }
                const dir = `./public/result/${req.user.class}/${year}/${req.session.term}`
                fs.access(dir, fs.constants.F_OK, (err) => {
                    if (err) {
                        fs.mkdir(dir, { recursive: true }, () => {
                            cb(null, dir)
                        })
                    } else {
                        cb(null, dir)
                    }
                })
            },
            filename: (req, file, cb) => {
                const name = path.basename(file.originalname, path.extname(file.originalname))
                cb(null, name + '.jpg');
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
                cb(null, true);
            } else {
                cb(null, false);
            }
        }
    }).array('result'))
    //blog image upload
app.use(['/admin/postUpload', '/admin/postEdit'], multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, './public/images/blog');
            },
            filename: (req, file, cb) => {
                cb(null, Date.now() + path.extname(file.originalname));
            },
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
                cb(null, true);
            } else {
                cb(null, false);
            }
        }
    }).single('blogImage'))
    //profile picture upload
app.use(['/admin/createAdmin', '/student/completeProfile', '/teacher/completeProfile', '/teacher/editProfile'], multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './public/img/' + req.body.role);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + req.body.firstName + '-' + req.body.lastName + path.extname(file.originalname));
        },
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
}).single('image'))

app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)
app.use('/teacher', teacherRoutes)
app.use('/student', studentRoutes)
app.use(publicRoutes)

app.use('/', (req, res, next) => {
    res.send("Hello From Express")
})

// app.listen(process.env.PORT || 3000)

mongoose.connect('mongodb+srv://johnny:12345678%2B%2B--@johnny-u8qnc.mongodb.net/school', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        //port to listen on
        console.log('connected');
        app.listen(process.env.PORT || 8080);
    })
    .catch((err) => {
        console.log(err);
    })