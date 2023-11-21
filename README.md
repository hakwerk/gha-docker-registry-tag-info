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

## Initial Setup

After you've cloned the repository to your local machine or codespace, you'll
need to perform some initial setup steps before you can develop your action.

> [!NOTE]
>
> You'll need to have a reasonably modern version of
> [Node.js](https://nodejs.org) handy. If you are using a version manager like
> [`nodenv`](https://github.com/nodenv/nodenv) or
> [`nvm`](https://github.com/nvm-sh/nvm), you can run `nodenv install` in the
> root of your repository to install the version specified in
> [`package.json`](./package.json). Otherwise, 20.x or later should work!

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the JavaScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   $ npm test

   PASS  ./index.test.js
    action
      ✓ gets the python image (360 ms)
      ✓ complains if no image is given
      ✓ complains if invalid image is given
      ✓ complains if tag is not fount (104 ms)
      ✓ gets the linuxserver/qbittorrent image amd64 (109 ms)
      ✓ gets the linuxserver/qbittorrent image arm/v7 (122 ms)
      ✓ gets the library/docker:windowsservercore image windows (109 ms)

   ...
   ```

## Update the Action Code

The [`src/`](./src/) directory contains the source code that will be run when the action is invoked.

1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

1. Update the contents of `src/` as needed
1. Update tests in `__tests__/` when applicable
1. Format, test, and build the action

   ```bash
   npm run all
   ```

   > [!WARNING]
   >
   > This step is important! It will run [`ncc`](https://github.com/vercel/ncc)
   > to build the final JavaScript action code with all dependencies included.
   > If you do not run this step, the action will not work correctly when it is
   > used in a workflow. This step also includes the `--license` option for
   > `ncc`, which will create a license file for all of the production node
   > modules used in the project.

1. Commit your changes

   ```bash
   git add .
   git commit -m "Updated to include feature xyz"
   ```

1. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

1. Create a pull request and get feedback on your action
1. Merge the pull request into the `main` branch

The action is now published! :rocket:

For information about versioning your action, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

## Validate the Action

You can now validate the action by referencing it in a workflow file. For
example, [`ci.yml`](./.github/workflows/ci.yml) demonstrates how to reference an
action in the same repository.

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v3

  - name: Test Local Action
    id: test-action
    uses: ./
    with:
      milliseconds: 1000

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.time }}"
```

For example workflow runs, check out the
[Actions tab](https://github.com/actions/javascript-action/actions)! :rocket:

## Reference

This basically is [David-Lor/action-dockerhub-get-tag-metadata](https://github.com/David-Lor/action-dockerhub-get-tag-metadata)
with some modernizations.
