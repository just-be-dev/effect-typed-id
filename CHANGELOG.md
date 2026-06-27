# Changelog

## Unreleased

### Added

- `WebCrypto` layer backed by the standard Web Crypto API, satisfying the `Crypto.Crypto` requirement of `generate` without pulling in a platform package. ([#2](https://github.com/just-be-dev/effect-typed-id/issues/2))
- `makeTypeId` accepts a `crypto` option to override the crypto layer used by the factory's `generate`.

### Changed

- `makeTypeId` factories now default `generate` to the `WebCrypto` layer, so factory `generate` no longer carries `Crypto.Crypto` in its requirements channel and runs with `Effect.runPromise` out of the box. The standalone `generate(prefix)` export still requires a `Crypto.Crypto` layer to be provided. ([#2](https://github.com/just-be-dev/effect-typed-id/issues/2))

## 0.3.0

### Changed

- Removed `typescript` from peer dependencies; it remains a development dependency for local builds.

## 0.2.0

### Breaking Changes

- `generate(prefix)` now requires a prefix argument (previously defaulted to `""`)

## 0.1.0

Initial release.
