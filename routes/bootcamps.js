const express = require('express')
const {
  getBootcamp,
  createBootcamp,
  getBootcamps,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsByRadius,
  bootcampPhotoUpload,
} = require('../controllers/bootcamps')
const Bootcamp = require('../models/bootcamp')
const advancedResults = require('../middleware/advancedResults')

const courseRouter = require('./courses')
const reviewRouter = require('./reviews')

const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

//Re-route to courses
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)

router.route('/radius/:zipcode/:distance').get(getBootcampsByRadius)

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), createBootcamp)

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp)

router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload)

module.exports = router
