const express = require('express')

const router = express.Router()

const authController = require('../controllers/auth')
const validator = require('../util/validator')

// router.post('/createAdmin', authController.postCreateAdmin)

// router.post('/studentLogin', authController.postStudentLogin)

// router.post('/teacherLogin', authController.postTeacherLogin)

router.get('/adminLogin', authController.getAdminLogin)
router.post('/adminLogin', authController.postAdminLogin)
router.post('/register', validator.registrationVal, authController.postRegister)
router.post('/teacherLogin', authController.postTeacherLogin)
router.post('/studentLogin', authController.postStudentLogin)
router.post('/logout', authController.postLogOut)

module.exports = router