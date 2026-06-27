# effect-id

Effect TypeScript implementation of the [TypeID spec](https://github.com/jetify-com/typeid/tree/main/spec).

TypeIDs are type-safe UUIDv7 identifiers encoded as strict lowercase base32 with an optional lowercase snake_case prefix, for example `user_01h455vb4pex5vsknk084sn02q`.

## Usage

```ts
import { Effect } from "effect"
import { makeTypeId, type TypeIdFrom } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user", { brand: "UserId" })
type UserId = TypeIdFrom<typeof UserId>

const program = Effect.gen(function* () {
  const id: UserId = yield* UserId.generate
  const uuid = yield* UserId.toUuid(id)

  return { id, uuid }
})

// Factory `generate` defaults to the bundled `WebCrypto` layer, so the program
// runs with no extra wiring:
const result = await Effect.runPromise(program)
```

## Providing Crypto

`generate` needs Effect's `Crypto.Crypto` service to produce a UUIDv7.

`makeTypeId` factories supply this for you: their `generate` defaults to the
bundled `WebCrypto` layer, so the `Crypto.Crypto` requirement is already
discharged and you can `Effect.runPromise` the factory's `generate` directly.

`WebCrypto` is backed by the standard
[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
(`globalThis.crypto`), available on Bun, Node.js 20+, Deno, browsers, and
Cloudflare Workers.

To use a different implementation, pass a `crypto` layer when creating the
factory — for example a platform layer like `NodeCrypto.layer` from
`@effect/platform-node`, or a deterministic layer in tests:

```ts
import { NodeCrypto } from "@effect/platform-node"

const UserId = makeTypeId("user", { crypto: NodeCrypto.layer })
```

The **standalone** `generate(prefix)` export has no creation step, so it still
carries `Crypto.Crypto` in its requirements channel and you must provide a
layer before running it — otherwise the requirement surfaces as a type error
such as `Type Crypto is not assignable to type never`:

```ts
import { Effect } from "effect"
import { generate, WebCrypto } from "@just-be/effect-typed-id"

const id = await Effect.runPromise(
  generate("user").pipe(Effect.provide(WebCrypto)),
)
```

The other APIs (`parse`, `fromUuid`, `toUuid`, `encodeUuid`, `decodeUuid`) do
not require `Crypto`.

## API

- `generate(prefix)`: create a UUIDv7 TypeID.
- `parse(typeid)`: validate and decode a TypeID into `{ prefix, suffix, uuid, typeid }`.
- `fromUuid(prefix, uuid)`: encode a canonical UUID string as a TypeID.
- `encodeUuid(uuid)`: encode a UUID as a 26-character TypeID suffix.
- `decodeUuid(suffix)`: decode a TypeID suffix to a canonical UUID string.
- `makeTypeId(prefix, options?)`: create a prefix-specific factory whose methods return branded IDs. Pass `options.crypto` to override the default `WebCrypto` layer used by the factory's `generate`.
- `WebCrypto`: a `Crypto.Crypto` layer backed by the Web Crypto API; the factory default, and provideable to the standalone `generate`.
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
