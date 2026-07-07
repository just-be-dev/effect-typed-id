# Changelog

## 0.5.0

### Breaking Changes

- Generation is now customized through the `TypeIdGenerator` service instead of
  a bare `Crypto` service. Providing only `Crypto` (e.g. `NodeCrypto.layer`) no
  longer changes `generate` / `UserId.generate`; provide a `TypeIdGenerator`
  layer such as `IdGenerators.uuidV7` (layered over your `Crypto`) or
  `UserId.layer`. The default (UUIDv7 over `globalThis.crypto`) is unchanged, so
  no-wiring generation keeps working.

### Added

- `makeTypeId(prefix)` now also returns an Effect service tag with a `.layer`;
  `yield* UserId` provides a factory bound to a specific `TypeIdGenerator`. The
  eager methods (`generate`, `fromUuid`, `parse`, …) are unchanged.
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
