import _ from 'lodash/fp'
import md5 from 'blueimp-md5'
import url from 'url'
import cheerio from 'cheerio'
import compose from 'koa-compose'

import { useFilesystemCache } from './middleware/cache'
import { promisifiedRequest } from './middleware/request'
import { throttle } from './middleware/throttle'
import { amap } from './utils'
import { getDocumentTree } from './index'

export async function syncScrapedToExistingDocument (scraped, existingDocumentId, syncActions) {
  console.log(`loading existing document tree for ${existingDocumentId}`)

  const existingTree = existingDocumentId ? await getDocumentTree(existingDocumentId) : {}

  console.log('marking differences between scraped and existing')
  const deltas = markDifferences(existingTree, scraped)

  console.log('performing updates')
  await performUpdates(deltas, {}, syncActions)
}

async function performUpdates (document, { parent = {}, parentAction } = {}, syncActions) {
  try {
    const defaultFn = async x => null
    const currentAction = document._action || parentAction
    const syncFn = syncActions[currentAction] || defaultFn
    const result = await syncFn(document, parent)

    const existingChildren = _.get('children')(document) || []
    const newChildren = _.get('_params.children')(document) || []
    if (_.isEmpty(existingChildren) && _.isEmpty(newChildren)) { return }

    await amap(existingChildren, async child => await performUpdates(child, { parent: result, parentAction: currentAction }, syncActions))

  } catch (err) {
    console.error(err)
  }
}

function markDifferences (existing, scraped) {
  let cloned = _.cloneDeep(existing)

  const scrapedParams = getHashAttrs(scraped)

  if (cloned.md5 === hashObject(scrapedParams)) {
    cloned._action = 'keep'
  } else {
    cloned._action = _.isEmpty(existing) ? 'create' : 'update'
    cloned._params = scrapedParams
  }

  const newChildren = _.map(scrapedChild => {
    const match = _.find({ syncKey: scrapedChild.title })(cloned.children)
    if (match) {
      return markDifferences(match, scrapedChild)
    } else {
      return { _params: scrapedChild, _action: 'create' }
    }
  })(scraped.children)

  const childrenToDelete = _.differenceBy(child => child.syncKey)(cloned.children)(newChildren)
  const deletions = _.map(x => ({ ...x, _action: 'delete' }))(childrenToDelete)

  cloned.children = newChildren.concat(deletions)

  return _.cloneDeep(cloned)
}

export function calculateDocumentHash (document) {
  return hashObject(getHashAttrs(document))
}

function getHashAttrs (document) {
  return _.flow(
    _.pick(['title', 'subtitle', 'summary', 'contents', 'metadata', 'tags']),
    _.pickBy(x => !_.isEmpty(x))
  )(document)
}

function hashObject (obj) {
  return md5(serializeObject(obj))
}

function serializeObject (obj) {
  const ordered = {}
  Object.keys(obj).sort().forEach(key => ordered[key] = obj[key])
  return JSON.stringify(obj)
}

export const request = compose([
  useFilesystemCache({ directory: '.cache' }),
  throttle(200),
  promisifiedRequest
])

const removeHash = url => url.replace(/#.*$/, '')

export const parseLink = (a, { $, baseUrl }) => ({
  title: $(a).text().trim(),
  url: url.resolve(baseUrl, removeHash($(a).attr('href')))
})

export const loadHtml = async page => {
  const { response } = await request({ url: page.url })
  const $ = cheerio.load(response)
  return { $, response }
}

export const safeText = el => el.text().trim()
