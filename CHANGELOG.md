# Changelog

## Unreleased

### Added

- `WebCrypto` layer backed by the standard Web Crypto API, satisfying the `Crypto.Crypto` requirement without pulling in a platform package. ([#2](https://github.com/just-be-dev/effect-typed-id/issues/2))
- Each `makeTypeId` factory now defines its own Effect service for generation, exposed as `factory.tag` (the service key) and `factory.layer` (`Layer<TypeIdGenerator<Name>, never, Crypto.Crypto>`). Provide the layer once at the edge — e.g. via `ManagedRuntime` — and `Crypto.Crypto` is resolved a single time.
- `TypeIdGenerator<Name>` interface describing the factory's generator service shape.

### Changed

- **Breaking:** a factory's `generate` now requires its generator service in the requirements channel instead of `Crypto.Crypto` directly. Provide `factory.layer` (with a `Crypto.Crypto` layer such as `WebCrypto` fed in) to run it. This replaces the previous error where running the documented example surfaced `Type Crypto is not assignable to type never`. ([#2](https://github.com/just-be-dev/effect-typed-id/issues/2))
- The standalone `generate(prefix)` export is unchanged and still requires a `Crypto.Crypto` layer to be provided.

## 0.3.0

### Changed

- Removed `typescript` from peer dependencies; it remains a development dependency for local builds.

## 0.2.0

### Breaking Changes

- `generate(prefix)` now requires a prefix argument (previously defaulted to `""`)

## 0.1.0

Initial release.
