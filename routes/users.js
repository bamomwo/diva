const express = require('express')
const { protect, authorize } = require('../middleware/auth')
const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/users')
const advancedResults = require('../middleware/advancedResults')
const User = require('../models/user')

const router = express.Router()

router.use(protect)
router.use(authorize('admin'))

router.route('/').get(advancedResults(User), getUsers).post(createUser)

router.route('/:id').get(getUser).put(updateUser).delete(deleteUser)

module.exports = router
