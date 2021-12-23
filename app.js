const path = require('path')
const express = require('express')
const dotenv = require('dotenv')
const colors = require('colors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error')
const fileupload = require('express-fileupload')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')

// .............................. Load env vars ..............................
dotenv.config({ path: './config/config.env' })

//................................ Require Routes files ................................
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const users = require('./routes/users')
const auth = require('./routes/auth')
const reviews = require('./routes/reviews')

// Connect to database
connectDB()

const app = express()
// ..................................... Middleware ...............................
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(fileupload())
app.use(express.json())

//.........Security middleware ..........
app.use(mongoSanitize())
app.use(helmet())
app.use(xss())
app.use(hpp())
app.use(cors())

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
})

app.use(limiter)

// ................................... Express Routes ...............................
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/users', users)
app.use('/api/v1/auth', auth)
app.use('/api/v1/reviews', reviews)

// ................................... Custom Error handling middleware ...............
app.use(errorHandler)

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
})

// Handle unhandled promise rejections

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red)

  // Close the server with exit code 1
  server.close(() => {
    process.exit(1)
  })
})
