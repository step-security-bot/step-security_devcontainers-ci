FROM golang:1.25-alpine@sha256:c05ba4b73604069d376c4f41346b05374335b5ca0c46fb6dfede5a59f5196931 as builder

# Install certs, git, and mercurial
# RUN apk add --no-cache ca-certificates git build-base

WORKDIR /workspace

# Copy go.mod etc and download dependencies (leverage docker layer caching)
COPY go.mod go.mod
# COPY go.sum go.sum
ENV GO111MODULE=on
RUN go mod download

# Copy source code over
COPY ./ .

# Build
RUN go build -o foo ./

# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static:nonroot@sha256:963fa6c544fe5ce420f1f54fb88b6fb01479f054c8056d0f74cc2c6000df5240 
WORKDIR /
COPY --from=builder /workspace/foo .
USER nonroot:nonroot

ENTRYPOINT [ "/foo" ]