# Changelog

## 0.5.0

### Breaking Changes

- `makeTypeId(prefix)` now returns an Effect service tag with a `.layer` in
  addition to the eager factory methods. `yield* UserId` provides a factory
  bound to a specific `TypeIdGenerator`.

### Added

- Added the `TypeIdGenerator` service and `IdGenerators.uuidV7` /
  `IdGenerators.uuidV4` layers for pluggable generation strategies. Generation
  still defaults to UUIDv7 over `globalThis.crypto`, so `generate` and
  `UserId.generate` work with no wiring; provide a `TypeIdGenerator` layer to
  override the strategy or randomness source.

## 0.4.0

### Added

- Added a default Web Crypto implementation for `generate`.
- Added `WebCryptoLive`, an explicit `Crypto` provider backed by `globalThis.crypto`.

### Changed

- `makeTypeId(prefix)` now defaults the brand to the PascalCase prefix plus `Id`.

## 0.3.0

### Changed

- Removed `typescript` from peer dependencies; it remains a development dependency for local builds.

## 0.2.0

### Breaking Changes

- `generate(prefix)` now requires a prefix argument (previously defaulted to `""`)

## 0.1.0

Initial release.
