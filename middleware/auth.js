const jwt = require('jsonwebtoken')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('./async')
const User = require('../models/user')

exports.protect = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }
  // else if (req.cookies.token) {
  //   token = req.cookies.token
  // }

  // check if token exist
  if (!token) {
    return next(new ErrorResponse('Access Denied... ', 401))
  }

  // decode token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
  } catch (error) {
    return next(new ErrorResponse('Access Denied... ', 401))
  }

  next()
})

// Middle to grant control to  user fole functionalitiees

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(` Access denied for ${req.user.role}s`, 403)
      )
    }
    next()
  }
}
