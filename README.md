# effect-id

Effect TypeScript implementation of the [TypeID spec](https://github.com/jetify-com/typeid/tree/main/spec).

TypeIDs are type-safe UUIDv7 identifiers encoded as strict lowercase base32 with an optional lowercase snake_case prefix, for example `user_01h455vb4pex5vsknk084sn02q`.

## Usage

```ts
import { Effect } from "effect"
import { makeTypeId, type TypeIdFrom, WebCrypto } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user", { brand: "UserId" })
type UserId = TypeIdFrom<typeof UserId>

const program = Effect.gen(function* () {
  const id: UserId = yield* UserId.generate
  const uuid = yield* UserId.toUuid(id)

  return { id, uuid }
})

// `generate` needs a `Crypto.Crypto` service. Provide the bundled `WebCrypto`
// layer (or any other `Crypto.Crypto` layer) to remove it from the
// requirements channel so the program can run:
const result = await Effect.runPromise(program.pipe(Effect.provide(WebCrypto)))
```

## Providing Crypto

`generate` (and a factory's `generate`) depends on Effect's `Crypto.Crypto`
service, so its `Effect` carries `Crypto.Crypto` in the requirements channel.
You must provide a layer before running it, otherwise the requirement surfaces
as a type error such as `Type Crypto is not assignable to type never`.

This package ships a `WebCrypto` layer backed by the standard
[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
(`globalThis.crypto`), which is available on Bun, Node.js 20+, Deno, browsers,
and Cloudflare Workers:

```ts
import { Effect } from "effect"
import { generate, WebCrypto } from "@just-be/effect-typed-id"

const id = await Effect.runPromise(
  generate("user").pipe(Effect.provide(WebCrypto)),
)
```

You can also provide a platform layer such as `NodeCrypto.layer` from
`@effect/platform-node`, or your own `Crypto.Crypto` layer (handy for
deterministic tests). The other APIs (`parse`, `fromUuid`, `toUuid`,
`encodeUuid`, `decodeUuid`) do not require `Crypto`.

## API

- `generate(prefix)`: create a UUIDv7 TypeID.
- `parse(typeid)`: validate and decode a TypeID into `{ prefix, suffix, uuid, typeid }`.
- `fromUuid(prefix, uuid)`: encode a canonical UUID string as a TypeID.
- `encodeUuid(uuid)`: encode a UUID as a 26-character TypeID suffix.
- `decodeUuid(suffix)`: decode a TypeID suffix to a canonical UUID string.
- `makeTypeId(prefix, options?)`: create a prefix-specific factory whose methods return branded IDs.
- `WebCrypto`: a `Crypto.Crypto` layer backed by the Web Crypto API, for providing to `generate`.
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
