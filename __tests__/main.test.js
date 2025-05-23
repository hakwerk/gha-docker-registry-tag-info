/**
 * Unit tests for the action's main functionality, src/main.js
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('main.js', () => {
  beforeEach(() => {
    // Set the action's inputs as return values from core.getInput().
    core.getInput.mockImplementation(() => '500')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('gets the python image', async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'image':
          return 'python:slim-buster'
        default:
          return ''
      }
    })

    await run()

    // Verify that all of the core library functions were called correctly
    expect(core.debug).toHaveBeenNthCalledWith(
      1,
      'Target image: author=library name=python tag=slim-buster os=linux arch=amd64 pageLimit=10'
    )
    expect(core.debug).toHaveBeenNthCalledWith(
      2,
      'Requesting https://registry.hub.docker.com/v2/repositories/library/python/tags?page=1&name=slim-buster ...'
    )
  })

  it('complains if no image is given', async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        default:
          return ''
      }
    })

    await run()

    // Verify that all of the core library functions were called correctly
    expect(core.setFailed).toHaveBeenNthCalledWith(
      1,
      "Input variable 'image' not specified!"
    )
  })

  it('complains if invalid image is given', async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'image':
          return 'no/such/image'
        default:
          return ''
      }
    })

    await run()

    // Verify that all of the core library functions were called correctly
    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Invalid image format')
  })

  it('complains if tag is not fount', async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'image':
          return 'nginx:12.34.56'
        default:
          return ''
      }
    })

    await run()

    // Verify that all of the core library functions were called correctly
    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Image-Tag not found!')
  })

  it('gets the linuxserver/qbittorrent image amd64', async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'image':
          return 'linuxserver/qbittorrent'
        case 'architecture':
          return 'amd64'
        default:
          return ''
      }
    })

    await run()

    // Verify that all of the core library functions were called correctly
    expect(core.debug).toHaveBeenNthCalledWith(
      1,
      'Target image: author=linuxserver name=qbittorrent tag=latest os=linux arch=amd64 pageLimit=10'
    )
    expect(core.debug).toHaveBeenNthCalledWith(
      2,
      'Requesting https://registry.hub.docker.com/v2/repositories/linuxserver/qbittorrent/tags?page=1&name=latest ...'
    )
  })

  it('gets the linuxserver/qbittorrent:20.04.1 image arm/v7', async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'image':
          return 'linuxserver/qbittorrent:20.04.1'
        case 'architecture':
          return 'arm/v7'
        default:
          return ''
      }
    })

    await run()

    // Verify that all of the core library functions were called correctly
    expect(core.debug).toHaveBeenNthCalledWith(
      1,
      'Target image: author=linuxserver name=qbittorrent tag=20.04.1 os=linux arch=arm/v7 pageLimit=10'
    )
    expect(core.debug).toHaveBeenNthCalledWith(
      2,
      'Requesting https://registry.hub.docker.com/v2/repositories/linuxserver/qbittorrent/tags?page=1&name=20.04.1 ...'
    )

    expect(core.setOutput).toHaveBeenNthCalledWith(
      1,
      'digest',
      'sha256:19fe2170b605e8724406a24b8520e6547af6cf145183e9eb9d874e8de9bd71a7'
    )
  })

  it('gets the library/docker:windowsservercore image windows', async () => {
    // Set the action's inputs as return values from core.getInput()
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'image':
          return 'library/docker:windowsservercore'
        case 'os':
          return 'windows'
        default:
          return ''
      }
    })

    await run()

    // Verify that all of the core library functions were called correctly
    expect(core.debug).toHaveBeenNthCalledWith(
      1,
      'Target image: author=library name=docker tag=windowsservercore os=windows arch=amd64 pageLimit=10'
    )
    expect(core.debug).toHaveBeenNthCalledWith(
      2,
      'Requesting https://registry.hub.docker.com/v2/repositories/library/docker/tags?page=1&name=windowsservercore ...'
    )
  })
})
