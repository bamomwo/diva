const advancedResults = (model, populate) => async (req, res, next) => {
  //advance query
  let query

  let reqQuery = { ...req.query }

  // Fields to exclude from reqquery
  const excludeFields = ['select', 'sort', 'page', 'limit']

  excludeFields.forEach((param) => {
    delete reqQuery[param]
  })

  console.log(reqQuery)
  let queryStr = JSON.stringify(reqQuery)

  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)

  query = model.find(JSON.parse(queryStr))

  // Select
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ')
    console.log(fields)
    query = query.select(fields)
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ')
    console.log(sortBy)
    query = query.sort(sortBy)
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 25
  const startIndex = (page - 1) * limit

  const endIndex = page * limit
  const total = await model.countDocuments()
  query = query.skip(startIndex).limit(limit)

  if (populate) {
    query = query.populate(populate)
  }

  const results = await query

  // Pagination result
  const pagination = {}

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  }

  next()
}

module.exports = advancedResults
