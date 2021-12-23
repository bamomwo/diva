const asyncHandler = require('../middleware/async')
const Course = require('../models/course')
const Bootcamp = require('../models/bootcamp')
const ErrorResponse = require('../utils/errorResponse')

// @desc    Get Courses
// @router   GET /api/v1/courses
// @router   GET /api/v1/bootcamps/:bootcampId/courses
// @access   Public
exports.getCourses = asyncHandler(async (req, res, next) => {
  let query

  if (req.params.bootcampId) {
    query = Course.find({ bootcamp: req.params.bootcampId })
  } else {
    query = Course.find().populate({
      path: 'bootcamp',
      select: 'name description',
    })
  }

  const courses = await query

  res.status(200).json({ success: true, count: courses.length, data: courses })
})

// @desc    Get Single Course
// @router   GET /api/v1/courses
// @access   Public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description',
  })

  if (!course) {
    next(new ErrorResponse('Course not found', 404))
  }

  res.status(200).json({ success: true, data: course })
})

// @desc     Add Course
// @router   POST /api/v1/bootcamp/:bootcampId/courses
// @access   Private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId
  req.body.user = req.user.id

  const bootcamp = await Bootcamp.findById(req.params.bootcampId)

  if (!bootcamp) {
    return next(new ErrorResponse('Bootcamp not found', 404))
  }

  // Make sure bootcamp owner or admin can add a course
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Sorry, you do not own this bootcamp', 400))
  }

  const course = await Course.create(req.body)

  res.status(200).json({ success: true, data: course })
})

// @desc     Delete Course
// @router   POST /api/v1/course/:id
// @access   Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)

  if (!course) {
    next(new ErrorResponse('Course not found', 404))
  }

  // Make sure bootcamp owner or admin can add a course
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Sorry, you do not own this Course', 400))
  }

  await course.remove()

  res.status(200).json({ success: true, data: {} })
})

// @desc     Update Course
// @router   PUT /api/v1/course/:id
// @access   Private

exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id)

  if (!course) {
    next(new ErrorResponse('Course not found', 404))
  }

  // Make sure bootcamp owner or admin can add a course
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Sorry, you do not own this Course', 400))
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, data: course })
})
