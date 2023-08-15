const express = require('express')

const router = express.Router()

const studentController = require('../controllers/student')
const midware = require('../util/middlewares')
const validator = require('../util/validator')

router.get('/dashboard', midware.isStudent, studentController.getDashboard)
router.get('/profile', midware.isStudent, studentController.getProfile)
router.get('/timetable', midware.isStudent, studentController.getTimetable)
router.get('/registerSubjects', midware.isStudent, studentController.getRegisterSubjects)
router.get('/mySubjects', midware.isStudent, studentController.getMySubjects)
router.get('/subjectInfo/:subject', midware.isStudent, studentController.getSubjectInfo)
router.get('/timetable', midware.isStudent, studentController.getTimetable)
router.get('/results', midware.isStudent, studentController.getResults)
router.post('/completeProfile', validator.studentCompProfVal, studentController.postCompleteProfile)
router.post('/editProfile', validator.studentEditProfVal, studentController.postEditProfile)
router.post('/changePassword', validator.studentChangePassVal, studentController.postChangePassword)
router.post('/registerSubjects', studentController.postRegisterSubjects)
router.post('/result', studentController.postGetResult)

module.exports = router