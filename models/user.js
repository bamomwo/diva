const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const asyncHandler = require('../middleware/async')
const ErrorResponse = require('../utils/errorResponse')

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter a name'],
  },

  email: {
    type: String,
    required: [true, 'Please enter an email address'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },

  password: {
    type: String,
    required: [true, 'Please enter a password'],
    select: false,
    match: [
      /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
      'Please provide a strong password',
    ],
  },

  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user',
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
})

// Hash a password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const user = this
  const salt = await bcrypt.genSalt(10)
  user.password = await bcrypt.hash(user.password, salt)

  next()
})

// Method to check password
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

// Method to create signed jwt token
UserSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
}

// Method to generate forgot password reset token and store it

UserSchema.methods.getForgotPasswordResetToken = function () {
  // Generate a token with crypto
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash the token and set to resetPasswordField
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Set Expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  console.log(resetToken)
  return resetToken
}

const User = mongoose.model('User', UserSchema)

module.exports = User
