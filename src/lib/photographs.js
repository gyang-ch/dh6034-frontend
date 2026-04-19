function trimSlashes(value) {
  return String(value ?? '').replace(/^\/+|\/+$/g, '')
}

function trimQuestionMark(value) {
  return String(value ?? '').replace(/^\?+/, '')
}

function encodePathPreservingSlashes(filepath) {
  return String(filepath ?? '')
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function buildAzureAssetUrl(folder, filename) {
  const base = String(import.meta.env.VITE_AZURE_BLOB_BASE ?? '').replace(/\/+$/g, '')
  const sasToken = trimQuestionMark(import.meta.env.VITE_AZURE_SAS_TOKEN)
  const path = `${base}/${trimSlashes(folder)}/${encodePathPreservingSlashes(filename)}`

  return sasToken ? `${path}?${sasToken}` : path
}

function buildPhotographUrl(folder, filename) {
  return buildAzureAssetUrl(folder, filename)
}

export function assignmentOneMediaUrl(filepath) {
  return buildAzureAssetUrl('assignment1', filepath)
}

export function photographThumbnailUrl(filename) {
  return buildPhotographUrl('thumbnail', filename)
}

export function photographFullUrl(filename) {
  return buildPhotographUrl('full', filename)
}

export function photographUrl(filename) {
  return photographThumbnailUrl(filename)
}
