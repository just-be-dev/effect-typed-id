# effect-id

Effect TypeScript implementation of the [TypeID spec](https://github.com/jetify-com/typeid/tree/main/spec).

TypeIDs are type-safe UUID identifiers encoded as strict lowercase base32 with a lowercase snake_case prefix, for example `user_01h455vb4pex5vsknk084sn02q`.

## Usage

```ts
import { Effect } from "effect"
import { makeTypeId, type TypeIdFrom } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user")
type UserId = TypeIdFrom<typeof UserId>

const program = Effect.gen(function* () {
  const id: UserId = yield* UserId.generate
  const uuid = yield* UserId.toUuid(id)

  return { id, uuid }
})

// Generation defaults to UUIDv7 over globalThis.crypto — no layers required.
const result = await Effect.runPromise(program)
```

Generation is fully Effect-native and pluggable. By default it produces UUIDv7
TypeIDs using `globalThis.crypto`, so `generate` and `UserId.generate` work with
no wiring. Provide a `TypeIdGenerator` layer (e.g. one of `IdGenerators`) at the
boundary of your program to override the strategy or randomness source.

`makeTypeId(prefix)` defaults the TypeScript brand to the PascalCase prefix plus
`Id`, so `makeTypeId("user")` creates a `UserId` brand and
`makeTypeId("team_member")` creates a `TeamMemberId` brand. Pass
`{ brand: "CustomName" }` to override it.

Provide `IdGenerators.uuidV7` for UUIDv7 TypeIDs or `IdGenerators.uuidV4` for
UUIDv4-backed TypeIDs. Like the default, these fall back to `globalThis.crypto`,
so a platform `Crypto` layer is optional (see [Platform Crypto](#platform-crypto)):

```ts
import { Effect, Layer } from "effect"
import { IdGenerators, makeTypeId } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user")

const main = Effect.gen(function* () {
  return yield* UserId.generate
}).pipe(Effect.provide(UserId.layer.pipe(Layer.provide(IdGenerators.uuidV4))))
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

In environments with `globalThis.crypto` (browsers, modern runtimes) you don't
need a `Crypto` layer at all — that's the default.

## API

- `generate(prefix)`: create a TypeID, using a provided `TypeIdGenerator` service or the default UUIDv7 generator.
- `parse(typeid)`: validate and decode a TypeID into `{ prefix, suffix, uuid, typeid }`.
- `fromUuid(prefix, uuid)`: encode a canonical UUID string as a TypeID.
- `encodeUuid(uuid)`: encode a UUID as a 26-character TypeID suffix.
- `decodeUuid(suffix)`: decode a TypeID suffix to a canonical UUID string.
- `makeTypeId(prefix, options?)`: create a prefix-specific service tag whose methods return branded IDs. The default brand is the PascalCase prefix plus `Id`; pass `options.brand` to override it.
- `TypeIdGenerator`: Effect service for pluggable UUID generation.
- `IdGenerators.uuidV7`: UUIDv7 generator layer.
- `IdGenerators.uuidV4`: UUIDv4 generator layer.
- `TypeIdError`: typed Effect error for validation failures.

Service methods:

- `generate`: create a new branded TypeID for the service prefix using the configured generator, or the default UUIDv7 generator when none is provided.
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
