# Changelog

## Unreleased

### Added

- `WebCrypto` layer that satisfies the `Crypto.Crypto` requirement of `generate` using the standard Web Crypto API, so `generate` can run with `Effect.runPromise` without pulling in a platform package. Documented how to provide `Crypto` in the README. ([#2](https://github.com/just-be-dev/effect-typed-id/issues/2))

## 0.3.0

### Changed

- Removed `typescript` from peer dependencies; it remains a development dependency for local builds.

## 0.2.0

### Breaking Changes

- `generate(prefix)` now requires a prefix argument (previously defaulted to `""`)

## 0.1.0

Initial release.
