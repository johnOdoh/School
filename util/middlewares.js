exports.isAdmin = ((req, res, next) => {
    if (!req.session.isLoggedIn || req.session.role !== 'admin') {
        return res.redirect('/')
    }
    // res.locals.role = req.session.role
    next()
})
exports.isStudent = ((req, res, next) => {
    if (!req.session.isLoggedIn || req.session.role !== 'student') {
        return res.redirect('/')
    }
    next()
})
exports.isTeacher = ((req, res, next) => {
    if (!req.session.isLoggedIn || req.session.role !== 'teacher') {
        return res.redirect('/')
    }
    let subjects = []
    req.user.subjects.forEach(subject => {
        const index = subjects.findIndex(s => s.name === subject.name)
        if (index === -1) {
            const nextSubject = {
                name: subject.name,
                classes: [subject.class]
            }
            subjects.push(nextSubject)
            return
        }
        subjects[index].classes.push(subject.class)
    })
    res.locals.mySubjects = subjects
        // res.locals.role = req.session.role
    next()
})