/* eslint no-extra-semi: "off" */
/* eslint prefer-const: "off" */
// This basically is https://github.com/David-Lor/action-dockerhub-get-tag-metadata/blob/main/src/index.js
//
import * as core from '@actions/core'
import got from 'got'

const DEFAULT_OS = 'linux'
const DEFAULT_ARCH = 'amd64'
const DEFAULT_PAGE_LIMIT = 10

/**
 * Get an Action input variable
 * @param name key name of the variable
 * @param defaultValue default value, if variable value is empty. If null, throw error in this case
 */
function getInputVariable(name, defaultValue) {
  let value = core.getInput(name) || ''
  value = value.trim()

  if (!value) {
    value = defaultValue
  }
  if (value === null) {
    throw new Error(`Input variable '${name}' not specified!`)
  }

  return value
}

function parseImage(imageInput) {
  if (!imageInput) {
    throw new Error('No image specified')
  }

  let imageChunks = imageInput.split('/')
  let author
  let image
  let tag = 'latest'

  if (imageChunks.length === 1) {
    author = 'library'
    image = imageChunks[0]
  } else if (imageChunks.length === 2) {
    ;[author, image] = imageChunks
  } else {
    throw new Error('Invalid image format')
  }

  imageChunks = image.split(':')
  if (imageChunks.length === 2) {
    ;[image, tag] = imageChunks
  }

  return [author, image, tag]
}

/**
 * Request tags metadata for a certain image
 */
async function request(author, image, tag, page) {
  const url = `https://registry.hub.docker.com/v2/repositories/${author}/${image}/tags?page=${page}&name=${tag}`
  core.debug(`Requesting ${url} ...`)
  const r = await got(url)

  const statusCode = r.statusCode
  const body = r.body
  core.debug(`Response statuscode=${statusCode}`)
  core.debug(`Response body:\n${body}`)
  if (statusCode !== 200) {
    throw new Error(`Bad statuscode (got ${statusCode}, expected 200)`)
  }

  return body
}

/**
 * Parse a Response Body
 * @returns Object with the found target image metadata
 * @returns Null if target image not found in current page, but more pages are available
 * @returns False if target image not found, and no more pages are available
 */
function parseResponse(responseBody, tag, os, architecture) {
  const js = JSON.parse(responseBody)

  for (let tagJs of js.results || []) {
    if (tagJs.name !== tag) {
      continue
    }

    for (let imageJs of tagJs.images) {
      let imageArch = imageJs.architecture
      const imageArchVariant = imageJs.variant
      if (imageArchVariant) {
        imageArch = `${imageArch}/${imageArchVariant}`
      }

      if (imageArch !== architecture || imageJs.os !== os) {
        continue
      }

      // Target image found!
      return {
        digest: imageJs.digest,
        tagMetadata: tagJs,
        finalImageMetadata: imageJs
      }
    }
  }

  if (js.next && typeof js.next === 'string') {
    return null
  }
  return false
}

async function fetchImageMetadata(
  author,
  image,
  tag,
  os,
  architecture,
  pageLimit
) {
  let page = 1
  let result = null

  while (result === null && page <= pageLimit) {
    const responseBody = await request(author, image, tag, page)
    result = parseResponse(responseBody, tag, os, architecture)
    page++
  }

  if (typeof result !== 'object') {
    if (architecture == 'arm64/v8') {
      let page = 1
      let result = null

      while (result === null && page <= pageLimit) {
        const responseBody = await request(author, image, tag, page)
        result = parseResponse(responseBody, tag, os, 'arm64')
        page++
      }

      if (typeof result !== 'object') {
        throw new Error('Image-Tag not found (even as just arm64)!')
      }
    } else {
      throw new Error('Image-Tag not found!')
    }
  }

  return result
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run() {
  try {
    const inputImage = getInputVariable('image', null)
    const imageOS = getInputVariable('os', DEFAULT_OS)
    const imageArch = getInputVariable('architecture', DEFAULT_ARCH)
    let pageLimit = parseInt(getInputVariable('pageLimit', ''))
    if (isNaN(pageLimit)) pageLimit = DEFAULT_PAGE_LIMIT

    const [imageAuthor, imageName, imageTag] = parseImage(inputImage)

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(
      `Target image: author=${imageAuthor} name=${imageName} tag=${imageTag} os=${imageOS} arch=${imageArch} pageLimit=${pageLimit}`
    )

    const tagMetadata = await fetchImageMetadata(
      imageAuthor,
      imageName,
      imageTag,
      imageOS,
      imageArch,
      pageLimit
    )

    core.setOutput('digest', tagMetadata.digest)
    core.setOutput('tagMetadata', tagMetadata.tagMetadata)
    core.setOutput('finalImageMetadata', tagMetadata.finalImageMetadata)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
