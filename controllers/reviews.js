const asyncHandler = require('../middleware/async')
const Review = require('../models/review')
const Bootcamp = require('../models/bootcamp')
const ErrorResponse = require('../utils/errorResponse')

// @desc    Get all reviews
// @router   GET /api/v1/bootcamp/:bootcampId/reviews
// @access   Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({
      bootcamp: req.params.bootcampId,
    })

    console.log(reviews)
    if (!reviews) {
      return next(new ErrorResponse('No bootcamp found', 404))
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    })
  } else {
    res.status(200).json(res.advancedResults)
  }
})

// @desc    Get single Review
// @router   GET /api/v1/reviews/:id
// @access   Public

exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id)

  if (!review) {
    return next(new ErrorResponse('No review found', 400))
  }

  res.status(200).json({ success: true, data: review })
})

// @desc    Add Review
// @router   POST /api/v1/bootcamps/:bootcampId/reviews
// @access   Private

exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId
  req.body.user = req.user.id

  const bootcamp = await Bootcamp.findById(req.params.bootcampId)

  if (!bootcamp) {
    return next(new ErrorResponse('Bootcamp not found', 404))
  }

  const review = await Review.create(req.body)

  res.status(200).json({ success: true, data: review })
})

// @desc    Update Review
// @router   PUT /api/v1/reviews/:id
// @access   Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id)

  if (!review) {
    return next(new ErrorResponse('Review not found', 404))
  }

  // Make sure only owner of reviews can update them and admins ofcourse

  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('You are not authorized to update this review', 401)
    )
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  res.status(200).json({ success: true, data: review })
})

// @desc    Delete Review
// @router   DELETE /api/v1/reviews/:id
// @access   Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id)

  if (!review) {
    return next(new ErrorResponse('Review not found', 404))
  }

  // Make sure only owner of reviews can update them and admins ofcourse
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('You are not authorized to update this review', 401)
    )
  }

  await review.remove()
  res.status(200).json({ success: true, data: {} })
})
