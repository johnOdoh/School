const express = require('express')

const router = express.Router()

const publicController = require('../controllers/public')
const validator = require('../util/validator')

router.get('/', publicController.getHome)
router.get('/404', publicController.get404)
router.get('/classInfo/:class', publicController.getClassInfo)
router.get('/subjectInfo/:subject/:class', publicController.getSubjectInfo)
router.get('/register', publicController.getRegisteration)
router.get('/slip/:id', publicController.getSlip)
router.get('/getPdf/:id', publicController.getPdf)
router.get('/login', publicController.getLogin)
router.get('/blog', publicController.getBlog)
router.get('/post/:id', publicController.getPost)
router.get('/commentDel/:id/:index', publicController.deleteComment)
router.post('/comment', validator.commentVal, publicController.postComment)

// router.get('/candidates', adminController.getCandidates)

// router.get('/createTeacher', adminController.getCreateTeacher)

// router.get('/createSubject', adminController.getCreateSubject)

// router.get('/createAdmin', adminController.getCreateAdmin)

module.exports = router