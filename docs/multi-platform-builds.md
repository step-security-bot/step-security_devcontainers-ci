# Multiplatform Dev Container Builds

Building dev containers to support multiple platforms (aka CPU architectures) is possible with the step-security/devcontainers-ci GitHub Action, but requires other actions to be run beforehand and has several caveats.

## General Notes/Caveats

- Emulation-based multiplatform builds (using QEMU) will significantly increase build times over native, single architecture builds. For faster builds, consider using the [native matrix strategy](#native-multi-platform-builds-matrix-strategy) instead.
- If you are using runCmd, the command will only be run on the architecture of the system the build is running on. This means that, if you are using runCmd to test the image, there may be bugs on the alternate platforms that will not be caught by your test suite. Manual post-build testing is advised.
- GitHub Actions now offers hosted ARM runners (e.g. `ubuntu-24.04-arm`).

## GitHub Actions Example

```
name: 'build'
on:
  pull_request:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout (GitHub)
        uses: actions/checkout@v6
      - name: Set up QEMU for multi-architecture builds
        uses: step-security/setup-qemu-action@v4
      - name: Setup Docker buildx for multi-architecture builds
        uses: step-security/setup-buildx-action@v4
        with:
          use: true
      - name: Login to GitHub Container Registry
        uses: step-security/docker-login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and release devcontainer Multi-Platform
        uses: step-security/devcontainers-ci@v0
        with:
          imageName: ghcr.io/UserNameHere/ImageNameHere
          platform: linux/amd64,linux/arm64
```

## Native Multi-Platform Builds (Matrix Strategy)

Instead of using QEMU emulation on a single runner, you can use native runners in a matrix strategy. Each runner builds for its own architecture and pushes a platform-specific image. A separate merge action then combines the per-platform images into a single multi-arch manifest.

### How it works

1. **Build jobs** run in parallel on native runners. Each job sets `useNativeRunner: true` and a single `platform` value (e.g., `linux/amd64`). The tag suffix is auto-derived from the platform (e.g., `linux/amd64` becomes `linux-amd64`). Build jobs must set `push: always` so that platform-specific images are pushed regardless of event filters (the merge job needs them in the registry).
2. **Merge job** runs after all build jobs complete. It uses the dedicated `step-security/devcontainers-ci/merge` action to combine the per-platform images into a multi-arch manifest. The platform-specific tags (e.g., `myimage:latest-linux-amd64`) remain in the registry after the merge.

### Benefits

- **Faster builds** -- no emulation overhead since each runner compiles natively.
- **More reliable** -- native compilation avoids QEMU compatibility issues.
- **Flexible runners** -- works with GitHub's hosted ARM runners (`ubuntu-24.04-arm`) or self-hosted ARM agents.

### GitHub Actions Example

In the workflow below, the `build` job is fanned out by the matrix into one run per entry: one runner builds and pushes `linux/amd64`, the other builds and pushes `linux/arm64`. Once both platform-specific images are in the registry, the `manifest` job merges them into one multi-arch tag.

```yaml
jobs:
  build:
    strategy:
      matrix:
        include:
          - runner: ubuntu-latest
            platform: linux/amd64
          - runner: ubuntu-24.04-arm
            platform: linux/arm64
    runs-on: ${{ matrix.runner }}
    steps:
      - uses: actions/checkout@v6
      - uses: step-security/docker-login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: step-security/setup-buildx-action@v4
      - uses: step-security/devcontainers-ci@v0
        with:
          imageName: ghcr.io/example/myimage
          platform: ${{ matrix.platform }}
          useNativeRunner: true
          push: always

  manifest:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: step-security/docker-login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: step-security/setup-buildx-action@v4
      - uses: step-security/devcontainers-ci/merge@v0
        with:
          imageName: ghcr.io/example/myimage
          platforms: linux/amd64,linux/arm64
```

> **Note:** The manifest job does not need `actions/checkout` since no source code is accessed.
