# Changelog

## 0.7.0

### Breaking Changes

- Require Effect `^4.1.0`. Effect 4.1 replaced the `effect/Crypto` module with
  `effect/crypto`, so this release no longer works with Effect 4.0.x.
- Generation now reads randomness from the `SecureRandom` service
  (`effect/crypto/SecureRandom`) instead of the removed `Crypto` service. To
  pick the randomness source explicitly, provide a `SecureRandom` layer (e.g.
  `NodeCrypto.layerSecureRandom` or `SecureRandom.layerWebCrypto`) instead of
  `NodeCrypto.layer`. The default (UUIDv7 over `globalThis.crypto`) is
  unchanged.

### Changed

- UUIDv7 generation now uses Effect's `SecureRandom.uuidV7`, which takes its
  timestamp from the `Clock` service and keeps IDs monotonically ordered within
  a generator.

## 0.6.0

### Breaking Changes

- Require stable Effect 4 (`^4.0.0`) instead of the Effect 4 beta. Consumers
  must upgrade Effect to the stable release alongside this package.

### Changed

- Migrate the error schema to `Schema.TaggedError` and update the TypeScript
  and Effect development tooling for stable Effect 4. TypeID behavior and
  public exports remain unchanged.

## 0.5.0

### Breaking Changes

- Generation is now customized through the `TypeIdGenerator` service instead of
  a bare `Crypto` service. Providing only `Crypto` (e.g. `NodeCrypto.layer`) no
  longer changes `generate` / `UserId.generate`; provide a `TypeIdGenerator`
  layer such as `IdGenerators.uuidV7` or `UserId.layer`. The default (UUIDv7 over
  `globalThis.crypto`) is unchanged, so no-wiring generation keeps working.
- Removed the `WebCryptoLive` export. `globalThis.crypto` is now the default
  randomness source, so providing it was a no-op; drop it or, to select the
  randomness source explicitly, provide a platform `Crypto` layer (e.g.
  `NodeCrypto.layer`).

### Added

- `makeTypeId(prefix)` now also returns an Effect service tag with a `.layer`;
  `yield* UserId` provides a factory bound to a specific `TypeIdGenerator`. The
  eager methods (`generate`, `fromUuid`, `parse`, …) are unchanged.
- Added the `TypeIdGenerator` service and `IdGenerators.uuidV7` /
  `IdGenerators.uuidV4` layers for pluggable generation strategies. Like the
  default generator, they fall back to `globalThis.crypto`, so a platform
  `Crypto` layer is optional.

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
