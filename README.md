# effect-id

Effect TypeScript implementation of the [TypeID spec](https://github.com/jetify-com/typeid/tree/main/spec).

TypeIDs are type-safe UUID identifiers encoded as strict lowercase base32 with a lowercase snake_case prefix, for example `user_01h455vb4pex5vsknk084sn02q`.

## Usage

```ts
import { Effect, Layer } from "effect"
import {
  IdGenerators,
  makeTypeId,
  type TypeIdFrom,
} from "@just-be/effect-typed-id"
import { NodeCrypto } from "@effect/platform-node-shared"

const UserId = makeTypeId("user")
type UserId = TypeIdFrom<typeof UserId>

const program = Effect.gen(function* () {
  const id: UserId = yield* UserId.generate
  const uuid = yield* UserId.toUuid(id)

  return { id, uuid }
})

const result = await Effect.runPromise(
  program.pipe(
    Effect.provide(
      UserId.layer.pipe(
        Layer.provide(IdGenerators.uuidV7),
        Layer.provide(NodeCrypto.layer),
      ),
    ),
  ),
)
```

Generation is fully Effect-native. Provide a `TypeIdGenerator` layer and that
generator's dependencies at the boundary of your program; the library does not
fall back to `globalThis.crypto` implicitly.

`makeTypeId(prefix)` defaults the TypeScript brand to the PascalCase prefix plus
`Id`, so `makeTypeId("user")` creates a `UserId` brand and
`makeTypeId("team_member")` creates a `TeamMemberId` brand. Pass
`{ brand: "CustomName" }` to override it.

Provide `IdGenerators.uuidV7` for UUIDv7 TypeIDs or `IdGenerators.uuidV4` for
UUIDv4-backed TypeIDs:

```ts
import { Effect, Layer } from "effect"
import { NodeCrypto } from "@effect/platform-node-shared"
import { IdGenerators, makeTypeId } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user")

const main = Effect.gen(function* () {
  return yield* UserId.generate
}).pipe(
  Effect.provide(
    UserId.layer.pipe(
      Layer.provide(IdGenerators.uuidV4),
      Layer.provide(NodeCrypto.layer),
    ),
  ),
)
```

## Platform Crypto

Install the Effect platform package for your runtime and provide its `Crypto`
layer when you want generation to use that platform service. For example, in
Node:

```ts
import { NodeCrypto } from "@effect/platform-node-shared"
import { Effect, Layer } from "effect"
import { IdGenerators, makeTypeId } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user")

const program = Effect.gen(function* () {
  return yield* UserId.generate
})

const main = program.pipe(
  Effect.provide(
    UserId.layer.pipe(
      Layer.provide(IdGenerators.uuidV7),
      Layer.provide(NodeCrypto.layer),
    ),
  ),
)

const id = await Effect.runPromise(main)
```

For browser and runtime environments with `globalThis.crypto`, you can provide
the explicit `WebCryptoLive` layer:

```ts
import { Effect, Layer } from "effect"
import {
  IdGenerators,
  makeTypeId,
  WebCryptoLive,
} from "@just-be/effect-typed-id"

const UserId = makeTypeId("user")

const id = await Effect.runPromise(
  Effect.gen(function* () {
    return yield* UserId.generate
  }).pipe(
    Effect.provide(
      UserId.layer.pipe(
        Layer.provide(IdGenerators.uuidV7),
        Layer.provide(WebCryptoLive),
      ),
    ),
  ),
)
```

## API

- `generate(prefix)`: create a TypeID using a provided `TypeIdGenerator` service.
- `parse(typeid)`: validate and decode a TypeID into `{ prefix, suffix, uuid, typeid }`.
- `fromUuid(prefix, uuid)`: encode a canonical UUID string as a TypeID.
- `encodeUuid(uuid)`: encode a UUID as a 26-character TypeID suffix.
- `decodeUuid(suffix)`: decode a TypeID suffix to a canonical UUID string.
- `makeTypeId(prefix, options?)`: create a prefix-specific service tag whose methods return branded IDs. The default brand is the PascalCase prefix plus `Id`; pass `options.brand` to override it.
- `TypeIdGenerator`: Effect service for pluggable UUID generation.
- `IdGenerators.uuidV7`: UUIDv7 generator layer.
- `IdGenerators.uuidV4`: UUIDv4 generator layer.
- `WebCryptoLive`: explicitly provide Effect's `Crypto` service from `globalThis.crypto`.
- `TypeIdError`: typed Effect error for validation failures.

Service methods:

- `generate`: create a new branded TypeID for the service prefix using the configured generator.
- `fromUuid(uuid)`: encode a UUID as the branded TypeID.
- `parse(input)`: validate a string and return branded TypeID parts.
- `toUuid(id)`: decode a branded TypeID to its UUID.
- `is(input)`: runtime type guard for the branded TypeID.

## Development

```bash
bun install
bun test
bun run typecheck
```
