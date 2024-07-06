# GitHub Action: Docker registry tag info

[![GitHub Super-Linter](https://github.com/hakwerk/gha-docker-registry-tag-info/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/hakwerk/gha-docker-registry-tag-info/actions/workflows/ci.yml/badge.svg)
[![cov](https://raw.githubusercontent.com/hakwerk/gha-docker-registry-tag-info/main/badges/coverage.svg)](https://github.com/hakwerk/gha-docker-registry-tag-info/actions)

GitHub Action to get tag information (primarily the digest) from a docker registry for a given image.

The API endpoint used for fetching the metadata is (with the example of the official Python image):
`https://registry.hub.docker.com/v2/repositories/library/python/tags?page=1`

## Action I/O

### Inputs

- `image`: full image name to find, with format `author/image:tag`, or `image:tag` for official images (required)
- `os`: image OS to find (default: `linux`)
- `architecture`: image architecture to find (default: `amd64`)
- `pageLimit`: how many pages of results to parse, until giving up (default: `10`)

### Outputs

**If the image is not found, the Action will fail!**

- `digest`: found image digest (example: `sha256:ec698176504f2f2d0e50e7e627d7db17be0c8c1a36fe34bb5b7c90c79355f7bb`)
- Full JSON outputs from the API: these are categorized in two outputs:
  - `tagMetadata` is the whole object for a certain tag (e.g. `python:slim-buster`). This includes an array of images,
  being each image a variant for a certain os and architecture
  - `finalImageMetadata` is the whole object for a concrete image of the found tag, matching the input os and
  architecture. This object is filtered out from the array of images found on the "tagMetadata" object

### Example

An example of how the Action is used would be the following:

```yaml
steps:
- name: Fetch image metadata
  id: metadata
  uses: hakwerk/gha-docker-registry-tag-info@v1
  with:
    image: debian:slim-buster
    os: linux
    architecture: arm/v7
    pageLimit: 5

- name: Print image metadata
  run: |
    echo "Digest: ${{ steps.metadata.outputs.digest }}"
    echo "Tag Metadata JSON: ${{ steps.metadata.outputs.tagMetadata }}"
    echo "Target Image Metadata JSON: ${{ steps.metadata.outputs.finalImageMetadata }}"
```

## Reference

This basically is [David-Lor/action-dockerhub-get-tag-metadata](https://github.com/David-Lor/action-dockerhub-get-tag-metadata)
with some modernizations.
