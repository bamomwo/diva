const NodeGeocoder = require('node-geocoder')

options = {
  provider: process.env.GEOCODER_PROVIDER,
  httpAdaptor: 'https',
  apiKey: process.env.API_KEY,
  formatter: null,
}

const geocoder = NodeGeocoder(options)

module.exports = geocoder
