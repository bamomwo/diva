const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: 100,
    required: [true, 'Please enter a title for review'],
  },

  text: {
    type: String,
    required: ['true', 'Please enter some text'],
  },

  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: ['true', 'Please give a rating between 1 and 10'],
  },

  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
})

ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true })

ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const avgArray = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },

    {
      $group: {
        _id: '$bootcamp',
        averageRating: { $avg: '$rating' },
      },
    },
  ])

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageRating: Math.ceil(avgArray[0].averageRating),
    })
  } catch (error) {
    console.log(error)
  }
}

// Call getAverage after saving acourse
ReviewSchema.post('save', function () {
  this.constructor.getAverageRating(this.bootcamp)
})

// Call getAverage after saving acourse
ReviewSchema.post('remove', function () {
  this.constructor.getAverageRating(this.bootcamp)
})

const Review = mongoose.model('Review', ReviewSchema)

module.exports = Review
