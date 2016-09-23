import fetch from 'isomorphic-fetch'
import FormData from 'form-data'

const NOMOS_API_KEY = '661d2b57-5a73-4ed8-8b40-17d7a2e4c51e'
const NOMOS_API_URL = 'http://localhost:8000/api'

function getHeaders (opts = {}) {
  const headers = {
    'Authorization': `Bearer ${NOMOS_API_KEY}`
  }

  if (!opts.isUpload) {
    headers['Accept'] = 'application/json'
    headers['Content-Type'] = 'application/json;charset=UTF-8'
  }

  return headers
}

async function performFetch (endpoint, params) {
  try {
    const res = await fetch(`${NOMOS_API_URL}/${endpoint}`, params)
    if (res.status < 200 || res.status >= 300) {
      console.error('Error, status:', res.status)
      throw new Error(res.json ? (await res.json()).error : res)
    } else if (res.status === 204) {
      return null
    } else {
      return res.json ? await res.json() : null
    }
  } catch (err) {
    console.error(err)
  }
}

export async function getJson (endpoint) {
  const params = {
    method: 'GET',
    headers: getHeaders()
  }

  return await performFetch(endpoint, params)
}

export async function postJson (endpoint, json) {
  const params = {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(json)
  }

  return await performFetch(endpoint, params)
}

export async function putJson (endpoint, json) {
  const params = {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(json)
  }

  return await performFetch(endpoint, params)
}

export async function deleteJson (endpoint) {
  const params = {
    method: 'DELETE',
    headers: getHeaders()
  }

  return await performFetch(endpoint, params)
}

export async function uploadFile (endpoint, filestream) {
  const formData = new FormData()
  formData.append('file', filestream)

  const params = {
    method: 'POST',
    headers: getHeaders({ isUpload: true }),
    body: formData
  }

  return await performFetch(endpoint, params)
}

export async function amap (collection, fn) {
  // an asynchronous mapping primitive
  let transformed = []
  for (let item of collection) {
    transformed = transformed.concat(await fn(item))
  }
  return transformed
}
