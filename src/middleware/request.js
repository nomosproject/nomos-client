const request = require('superagent')
const _ = require('lodash')
import logger from '../../../server/logger'

function promisifiedRequest (ctx) {
  logger.verbose('fetching', ctx.url)
  return new Promise((resolve, reject) => {
    request.get(ctx.url).end((err, res) => {
      if (err) { return reject(err) }

      ctx = _.assign(ctx, { response: res.text })

      resolve(ctx)
    })
  })
}

module.exports = { promisifiedRequest }
