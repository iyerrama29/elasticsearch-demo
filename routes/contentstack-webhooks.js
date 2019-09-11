const { Client } = require('@elastic/elasticsearch')
const express = require('express')
const router = express.Router()

const elasticHost = 'http://localhost:9200/'
const client = new Client({ node: elasticHost })
const allowedContentTypes = ['blog', 'author', 'home', 'elastic']
const indexName = 'contentstack'

router.post('/', async (req, res, next) => {
  if (typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next()
  }
  const type = req.body.module
  const data = req.body.data
  const event = req.body.event

  if (event === 'publish') {
    // eslint-disable-next-line no-prototype-builtins
    if (type === 'entry' && allowedContentTypes.indexOf(data.content_type.uid) !== -1 && data.entry.hasOwnProperty('url')) {
      const elasticData = {
        title: data.entry.title || 'Undefined',
        uid: data.entry.uid,
        id: `${data.entry.uid}_${data.locale}`,
        locale: data.locale,
        data: data.entry.data,
        url: data.entry.url,
        content_type_uid: data.content_type.uid,
      }

      return client.update({
        index: indexName,
        id: elasticData.id,
        body: {
          scripted_upsert: true,
          doc: elasticData,
          upsert: elasticData
        }
      }).then(({body}) => {
        console.log(JSON.stringify(body))
        res.send('Indexed to elastic search successfully!')
        return
      }).catch(res.send)
    }
  } else if (event === 'unpublish') {
    console.error(JSON.stringify(data))
    // eslint-disable-next-line no-prototype-builtins
    if (type === 'entry' && allowedContentTypes.indexOf(data.content_type.uid) !== -1 && data.entry.hasOwnProperty('url')) {
      return client.delete({
        index: indexName,
        id: `${data.entry.uid}_${data.locale}`,
      }).then(({body}) => {
        console.log(JSON.stringify(body))
        res.send('Document removed from elasticsearch successfully!')
        return
      }).catch((error) => {
        console.log(JSON.stringify(error.meta.body))
        res.send('OK')
      })
    }
  } else if (event === 'delete') {
    if (type === 'entry') {
      return client.deleteByQuery({
        index: indexName,
        body: {
          query: {
            match: {
              uid: data.entry.uid
            }
          }
        }
      }).then(({body}) => {
        console.log(JSON.stringify(body))
        res.send('Document deleted from elasticsearch successfully!')
        return
      }).catch(res.send)
    } else if (type === 'content_type') {
      return client.deleteByQuery({
        index: indexName,
        body: {
          query: {
            match: {
              content_type_uid: data.content_type.uid
            }
          }
        }
      }).then(({body}) => {
        console.log(JSON.stringify(body))
        res.send(`Document of content type ${data.content_type.uid} removed from elasticsearch successfully!`)
        return
      }).catch(res.send)
    }
  }

  res.send(`Data ${req.body.entry || req.body} not indexed in elastic search`)
})

module.exports = router