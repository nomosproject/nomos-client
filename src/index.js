import fs from 'fs'

import { getJson, postJson, putJson, deleteJson, uploadFile } from './utils'

export async function getDocument (documentId) {
  const { document } = await getJson(`documents/${documentId}`)
  return document
}

// possible document params: id, title, subtitle, tags, locale, body, upload, parentId
export async function createDocument (document, { action = 'publish' } = {}) {
  const body = { document, action }
  return await postJson('documents', body)
}

export async function updateDocument (documentId, document, { action = 'publish' } = {}) {
  const body = { document, action }
  return await putJson(`documents/${documentId}`, body)
}

export async function deleteDocument (documentId) {
  return await deleteJson(`documents/${documentId}`)
}

export async function uploadDocumentImage (documentId, filepath) {
  return await uploadFile(`documents/${documentId}/upload`, fs.createReadStream(filepath))
}

export async function getDocumentTree (documentId) {
  return await getJson(`documents/${documentId}/tree`)
}

export async function createLocale ({ name, slug }) {
  const body = { name, slug }
  return await postJson('locales', body)
}

export async function updateLocale () {} // TODO

export async function deleteLocale () {} // TODO

