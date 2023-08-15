const express = require('express')

const router = express.Router()

const teacherController = require('../controllers/teacher')
const midware = require('../util/middlewares')
const validator = require('../util/validator')

//general routes
router.get('/dashboard', midware.isTeacher, teacherController.getDashboard)
router.get('/profile', midware.isTeacher, teacherController.getProfile)
router.get('/subjectInfo/:subject/:class', midware.isTeacher, teacherController.getSubjectInfo)
router.get('/scoresUpload/:subject/:class/:index/:assIndex', midware.isTeacher, teacherController.getScoresUpload)
router.post('/completeProfile', validator.teacherCompProfVal, teacherController.postCompleteProfile)
router.post('/editProfile', validator.teacherEditProfVal, midware.isTeacher, teacherController.postEditProfile)
router.post('/changePassword', validator.teacherChangePassVal, midware.isTeacher, teacherController.postChangePassword)
router.post('/editScheme/:subject/:class', midware.isTeacher, teacherController.postEditScheme)
router.post('/createAssessment/:subject/:class', midware.isTeacher, teacherController.postCreateAssessment)
router.post('/editAssessment/:subject/:class', midware.isTeacher, teacherController.postEditAssessment)
router.post('/removeAssessment/:subject/:class', midware.isTeacher, teacherController.postRemoveAssessment)
router.post('/recommendBook/:subject/:class', midware.isTeacher, teacherController.postRecommendBook)
router.post('/editBook/:subject/:class', midware.isTeacher, teacherController.postEditBook)
router.post('/removeBook/:subject/:class', midware.isTeacher, teacherController.postRemoveBook)
router.post('/uploadScores/:subject/:class', midware.isTeacher, teacherController.postUploadScores)

//sectional-head routes
router.get('/myTeachers', midware.isTeacher, teacherController.getMyTeachers)
router.get('/teacherProfile/:id', midware.isTeacher, teacherController.getTeacherProfile)
router.post('/assignDiv', midware.isTeacher, teacherController.postAssignStudentDivision)
router.post('/assignSubject', midware.isTeacher, teacherController.postAssignSubject)
router.post('/unassignSubject', midware.isTeacher, teacherController.postUnassignSubject)

//form-teacher routes
router.get('/timetable', midware.isTeacher, teacherController.getTimetable)
router.get('/results', midware.isTeacher, teacherController.getResults)
router.get('/promotion', midware.isTeacher, teacherController.getPromotion)
router.post('/timetable', midware.isTeacher, teacherController.postTimetable)
router.post('/uploadResult', midware.isTeacher, teacherController.postUploadResult)
router.post('/promote', midware.isTeacher, teacherController.postPromotion)

//both
router.get('/myStudents', midware.isTeacher, teacherController.getMyStudents)
router.get('/studentProfile/:id', midware.isTeacher, teacherController.getStudentProfile)

module.exports = router