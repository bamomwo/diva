const path = require('path')
const asyncHandler = require('../middleware/async')
const errorHandler = require('../middleware/error')
const Bootcamp = require('../models/bootcamp')
const User = require('../models/user')
const ErrorResponse = require('../utils/errorResponse')
const geocoder = require('../utils/geocoder')

// @desc    Get all bootcamps
// @router   GET /api/v1/bootcamps
// @access   Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

//@desc    Get a single  bootcamp
//@router   GET /api/v1/bootcamps/:id
//@access   Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Resource not found with id ${req.params.id}`, 400)
    )
  }
  return res.status(200).json({ succes: true, data: bootcamp })
})

//@desc    Create  bootcamp
//@router   POST /api/v1/bootcamps
//@access   Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id

  // Publisher can only be associated to one bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })
  if (publishedBootcamp && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`Sorry you can only publish one bootcamp`, 400)
    )
  }

  const bootcamp = await Bootcamp.create(req.body)

  res.status(201).json({ success: true, data: bootcamp })
})

//@desc    Update a  bootcamp
//@router   PUT /api/v1/bootcamps/:id
//@access   Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id)

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Resource with id ${req.params.id} not found`, 404)
    )
  }
  // Make sure only owner of bootcamp or admin can update it
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorize to update this route`, 404)
    )
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, data: bootcamp })
})

//@desc    Delete bootcamp
//@router   DELETE /api/v1/bootcamps/:id
//@access   Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)

  if (!bootcamp) {
    return res.status(404).json({ succes: false })
  }

  // Make sure only owner of bootcamp or admin can delete it
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorize to update this route`, 404)
    )
  }

  bootcamp.remove()

  res.status(200).json({ success: true, data: {} })
})

//@desc    Fetch bootcamps by radius
//@router   GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access   Private
exports.getBootcampsByRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params

  const loc = await geocoder.geocode(zipcode)
  const lat = loc[0].latitude
  const lng = loc[0].longitude

  const radius = distance / 3963

  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  })

  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps })
})

//@desc    Upload Bootcamp Image
//@router   PUT /api/v1/bootcamps/:id/photo
//@access   Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id)

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with ${req.params.id}`, 400)
    )
  }

  // Make sure only owner of bootcamp or admin can delete it
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User not authorize to update this route`, 404)
    )
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload an image', 404))
  }

  const file = req.files.file

  // Check if file is an image

  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('File must be an image'), 400)
  }

  // Check file size

  if (file.size > process.env.MAX_FILE_LIMIT) {
    return next(
      new ErrorResponse('File is too large. It must be 1Mb in size'),
      400
    )
  }

  // Create a custom file name
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

  // Moving file to upload directory
  file.mv(`${process.env.PHOTO_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      return new ErrorResponse('An error Occured uploading photo', 500)
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })

    res.status(200).json({
      success: true,
      data: file.name,
    })
  })
})
