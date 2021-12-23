const mongoose = require('mongoose')

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter a title'],
    trim: true,
  },

  description: {
    type: String,
    required: [true, 'Please enter a description'],
  },

  weeks: {
    type: String,
    required: [true, 'Please enter the number of weeks'],
  },

  tuition: {
    type: Number,
    require: [true, 'Please enter a tuition cost'],
  },

  minimumSkill: {
    type: String,
    required: [true, 'Please add a mininum cost'],
    enum: ['beginner', 'intermediate', 'advanced'],
  },

  scholarshipAvailable: {
    type: Boolean,
    default: false,
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },

  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bootcamp',
    require: true,
  },
})

CourseSchema.statics.getAverageCost = async function (bootcampId) {
  const avgArray = await this.aggregate([
    {
      $match: { bootcamp: bootcampId },
    },

    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
      },
    },
  ])

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(avgArray[0].averageCost),
    })
  } catch (error) {
    console.log(error)
  }
}

// Call getAverage after saving acourse
CourseSchema.post('save', function () {
  this.constructor.getAverageCost(this.bootcamp)
})

// Call getAverage after saving acourse
CourseSchema.post('remove', function () {
  this.constructor.getAverageCost(this.bootcamp)
})

const Course = mongoose.model('Course', CourseSchema)

module.exports = Course
