const { check } = require('express-validator');

exports.registrationVal = [
    check(['class', 'address', 'hometown', 'lga', 'gender', 'bloodGroup', 'dob', 'sponsor_address']).trim().escape().not().isEmpty(),
    check(['firstName', 'surName', 'middleName', 'sponsor_sname', 'sponsor_fname', 'sponsor_mname']).trim().escape().not().isEmpty().isAlpha(),
    check('sponsor_phoneNo').isNumeric().isLength({ min: 11 })
]
exports.teacherCompProfVal = [
    check(['address', 'gender', 'dob']).trim().escape().not().isEmpty(),
    check('phone').isNumeric().isLength({ min: 11 }),
    check('password').isLength({ min: 8 }),
    check('confirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords don\'t match!');
        }
        return true;
    })
]
exports.studentCompProfVal = [
    check('password').isLength({ min: 5 }).withMessage('Password must be atleast 5 characters!'),
    check('confirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords don\'t match!');
        }
        return true;
    })
]
exports.teacherEditProfVal = [
    check('address').trim().escape().not().isEmpty().withMessage('Invalid address!'),
    check('phoneNo').isNumeric().isLength({ min: 11 }).withMessage('Invalid Phone number!')
]
exports.teacherChangePassVal = [
    check('new').isLength({ min: 8 }).withMessage('Password must be atleast 8 characters!'),
    check('confirm').custom((value, { req }) => {
        if (value !== req.body.new) {
            throw new Error('Passwords don\'t match!')
        }
        return true
    })
]
exports.studentEditProfVal = [
    check(['address', 'sponsorSName', 'sponsorFName', 'sponsorMName', 'sponsorAddress']).trim().escape().not().isEmpty().withMessage('Fill all Fields!'),
    check('sponsorPhone').isNumeric().isLength({ min: 11 }).withMessage('Incomplete Phone number!')
]
exports.studentChangePassVal = [
    check('new').isLength({ min: 5 }).withMessage('Password must be atleast 5 characters!'),
    check('confirm').custom((value, { req }) => {
        if (value !== req.body.new) {
            throw new Error('Passwords don\'t match!')
        }
        return true
    })
]
exports.postVal = [
    check(['title', 'category', 'content', 'authorId', 'authorRole']).trim().escape().not().isEmpty()
]
exports.commentVal = [
    check(['name', 'comment']).trim().escape().not().isEmpty(),
    check('email').isEmail().normalizeEmail()
]

exports.contactUsVal = [
    check('email').isEmail().normalizeEmail(),
    check(['name', 'subject', 'message']).trim().escape().not().isEmpty()
]
exports.signUpVal = [
    check(['firstname', 'lastname']).trim().escape().not().isEmpty().withMessage('Please fill all fields!').isAlpha().withMessage('Must contain only alphabets!'),
    check('email').isEmail().withMessage('Please enter a valid Email address!').normalizeEmail(),
    check('password').isLength({ min: 5 }).withMessage('Password must be aleast 5 characters long!'),
    check('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords don\'t match!');
        }
        return true;
    })
]

exports.logInVal = [
    check('email').isEmail().withMessage('Please enter a valid Email address!').normalizeEmail(),
    check('password').isLength({ min: 5 }).withMessage('Invalid Password length!')
]