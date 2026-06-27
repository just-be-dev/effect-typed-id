# effect-id

Effect TypeScript implementation of the [TypeID spec](https://github.com/jetify-com/typeid/tree/main/spec).

TypeIDs are type-safe UUIDv7 identifiers encoded as strict lowercase base32 with an optional lowercase snake_case prefix, for example `user_01h455vb4pex5vsknk084sn02q`.

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

const result = await Effect.runPromise(program)
```

`generate` uses `globalThis.crypto` by default. If you provide Effect's `Crypto`
service, `generate` uses the provided service instead for deterministic tests or
custom runtimes.

`makeTypeId(prefix)` defaults the TypeScript brand to the PascalCase prefix plus
`Id`, so `makeTypeId("user")` creates a `UserId` brand and
`makeTypeId("team_member")` creates a `TeamMemberId` brand. Pass
`{ brand: "CustomName" }` to override it.

## Platform Crypto

Install the Effect platform package for your runtime and provide its `Crypto`
layer when you want generation to use that platform service. For example, in
Node:

```ts
import { NodeCrypto } from "@effect/platform-node-shared"
import { Effect } from "effect"
import { makeTypeId } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user")

const program = Effect.gen(function* () {
  const id = yield* UserId.generate
  return id
})

const main = program.pipe(Effect.provide(NodeCrypto.layer))

const id = await Effect.runPromise(main)
```

## API

- `generate(prefix)`: create a UUIDv7 TypeID using a provided `Crypto` service or `globalThis.crypto`.
- `parse(typeid)`: validate and decode a TypeID into `{ prefix, suffix, uuid, typeid }`.
- `fromUuid(prefix, uuid)`: encode a canonical UUID string as a TypeID.
- `encodeUuid(uuid)`: encode a UUID as a 26-character TypeID suffix.
- `decodeUuid(suffix)`: decode a TypeID suffix to a canonical UUID string.
- `makeTypeId(prefix, options?)`: create a prefix-specific factory whose methods return branded IDs. The default brand is the PascalCase prefix plus `Id`; pass `options.brand` to override it.
- `WebCryptoLive`: explicitly provide Effect's `Crypto` service from `globalThis.crypto`.
- `TypeIdError`: typed Effect error for validation failures.

Factory methods:

- `generate`: create a new branded UUIDv7 TypeID for the factory prefix.
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
