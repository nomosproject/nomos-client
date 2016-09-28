const request = require('superagent')
const _ = require('lodash')

function promisifiedRequest (ctx) {
  console.log('fetching', ctx.url)
  return new Promise((resolve, reject) => {
    request.get(encodeURI(ctx.url)).end((err, res) => {
      if (err) { return reject(err) }

      ctx = _.assign(ctx, { response: res.text })

      resolve(ctx)
    })
  })
}

module.exports = { promisifiedRequest }
