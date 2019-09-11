const { Client } = require('@elastic/elasticsearch')
const express = require('express')

const router = express.Router()
const client = new Client({ node: 'http://localhost:9200' })

router.get('/_search', (req, res, next) => {
  try {
    const query = req.query
    let field, data
    const index = (query.index && typeof query.index === 'string' && query.index.length) ? query.index: 'contentstack'
    const locale = (query.locale && typeof query.locale === 'string' && query.locale.length !== 5) ? query.locale: 'en-us'
    if (query.field && typeof query.field === 'string' && query.field.length) {
      field = query.field
    } else {
      return res.json({
        message: `${query.field} field is invalid!`
      })
    }

    if (query.data && typeof query.data === 'string' && query.data.length) {
      data = decodeURIComponent(query.data)
    } else {
      return res.json({
        message: `${query.field} data value is invalid!`
      })
    }
    const search = {
      index,
      body: {
        query: {
          match: {
            [field]: data,
            locale
          }
        }
      }
    }
    console.error(JSON.stringify(search, null, 2))
    
    return client.search(search)
      .then(res.json)
      .catch(next)
  } catch (error) {
    return next(error)
  }
})

module.exports = router