# Changelog

## 0.5.0

### Breaking Changes

- `makeTypeId(prefix)` now returns an Effect service tag. Use `yield* UserId`
  inside Effect programs and provide `UserId.layer` plus a `TypeIdGenerator`
  layer at the boundary.
- `generate(prefix)` and factory generation no longer fall back to
  `globalThis.crypto`; provide explicit generator and `Crypto` layers.

### Added

- Added the `TypeIdGenerator` service and `IdGenerators.uuidV7` /
  `IdGenerators.uuidV4` layers for pluggable generation strategies.

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
