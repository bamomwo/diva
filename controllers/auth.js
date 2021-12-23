const crypto = require('crypto')
const asyncHandler = require('../middleware/async')
const User = require('../models/user')
const ErrorResponse = require('../utils/errorResponse')
const sendEmail = require('../utils/sendEmail')

// @desc    Register User
// @router   POST /api/v1/auth/register
// @access   Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body

  // Register User
  const user = await User.create({ name, email, password, role })

  sendReponseToken(user, 200, res)
})

// @desc    Login User
// @router   POST /api/v1/auth/login
// @access   Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')

  // User Validation here
  if (!user) {
    return next(new ErrorResponse('Invalid Credentials', 401))
  }

  const isMatch = await user.comparePassword(password)
  console.log(isMatch)

  if (!isMatch) {
    return next(new ErrorResponse('Invalid Credentials', 401))
  }

  sendReponseToken(user, 200, res)
})

// @desc    Logout user
// @router   GET /api/v1/auth/logout
// @access   Public
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  })

  res.status(200).json({ success: true, data: {} })
})

// @desc     Fetch User Profile
// @router   GET /api/v1/auth/me
// @access   Public
exports.userProfile = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, data: req.user })
})

// @desc     Update User Details
// @router   PUT /api/v1/auth/updatedetails
// @access   Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUPdate = { name: req.body.name, email: req.body.email }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUPdate, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    return next(new ErrorResponse('Invalid Credentials', 401))
  }

  res.status(200).json({ success: true, data: user })
})

// @desc     Update User Password
// @router   PUT /api/v1/auth/updatedetails
// @access   Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  // Check password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Incorrect Credentials', 401))
  }

  user.password = req.body.password
  await user.save()

  sendReponseToken(user, 200, res)
})

// @desc     Password Reset
// @router   GET /api/v1/auth/forgotpassword
// @access   Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse('No User found with that email', 404))
  }

  const resetToken = user.getForgotPasswordResetToken()
  console.log(resetToken)

  await user.save({ validateBeforeSave: false })

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/forgotpassword/${resetToken}`

  const message = `You are receiving this email because you or someone else opted a reset of password. Make a PUT request to this url \n \n ${resetUrl}`

  try {
    sendEmail({
      email: user.email,
      subject: 'Password reset',
      message,
    })

    res.status(200).json({
      success: true,
      data: 'Email Sent',
    })
  } catch (error) {
    console.log(error)

    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })

    return next(new ErrorResponse('Email Could not be sent', 500))
  }
})

// @desc     Reset Password
// @router   PUT /api/v1/auth/resetpassword/:resetToken
// @access   Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')

  // console.log(resetPasswordToken)

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return next(new ErrorResponse('Invalid Token', 404))
  }

  // Set new password
  user.password = req.body.password

  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  user.save()
  sendReponseToken(user, 200, res)
})

const sendReponseToken = (user, statusCode, res) => {
  //Generate a token for user
  const token = user.getSignedToken()

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') {
    options.secure = true
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token })
}
