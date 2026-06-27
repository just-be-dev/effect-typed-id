# effect-id

Effect TypeScript implementation of the [TypeID spec](https://github.com/jetify-com/typeid/tree/main/spec).

TypeIDs are type-safe UUIDv7 identifiers encoded as strict lowercase base32 with an optional lowercase snake_case prefix, for example `user_01h455vb4pex5vsknk084sn02q`.

## Usage

```ts
import { Effect, Layer } from "effect"
import { makeTypeId, type TypeIdFrom, WebCrypto } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user", { brand: "UserId" })
type UserId = TypeIdFrom<typeof UserId>

const program = Effect.gen(function* () {
  const id: UserId = yield* UserId.generate
  const uuid = yield* UserId.toUuid(id)

  return { id, uuid }
})

// `UserId.generate` requires the factory's generator service. Provide
// `UserId.layer` (which depends on `Crypto.Crypto`) with a Crypto layer fed in,
// and every requirement is discharged:
const result = await Effect.runPromise(
  program.pipe(Effect.provide(UserId.layer.pipe(Layer.provide(WebCrypto)))),
)
```

## Providing Crypto

`generate` needs Effect's `Crypto.Crypto` service to produce a UUIDv7. Following
the Effect dependency-injection model, each `makeTypeId` factory defines its own
**service** for this, exposed as two members:

- `UserId.tag` — the service key. `UserId.generate` yields it, so it carries
  `TypeIdGenerator<"UserId">` in its requirements channel.
- `UserId.layer` — a `Layer` that builds the service from `Crypto.Crypto`
  (`Layer<TypeIdGenerator<"UserId">, never, Crypto.Crypto>`).

Provide the layer once at the edge of your program. Feeding a `Crypto.Crypto`
layer into it produces a self-contained layer, so a single `Effect.provide`
discharges everything:

```ts
import { Effect, Layer } from "effect"
import { makeTypeId, WebCrypto } from "@just-be/effect-typed-id"

const UserId = makeTypeId("user", { brand: "UserId" })

const live = UserId.layer.pipe(Layer.provide(WebCrypto))

await Effect.runPromise(UserId.generate.pipe(Effect.provide(live)))
```

`WebCrypto` is backed by the standard
[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
(`globalThis.crypto`), available on Bun, Node.js 20+, Deno, browsers, and
Cloudflare Workers. You can feed in any `Crypto.Crypto` layer instead — a
platform layer like `NodeCrypto.layer` from `@effect/platform-node`, or a
deterministic layer in tests:

```ts
import { NodeCrypto } from "@effect/platform-node"

const live = UserId.layer.pipe(Layer.provide(NodeCrypto.layer))
```

### Build the layer once

Because the crypto service is resolved when the layer is built, use a
`ManagedRuntime` (or your application's runtime) to build it a single time and
reuse it across many generations:

```ts
import { ManagedRuntime, Layer } from "effect"

const runtime = ManagedRuntime.make(UserId.layer.pipe(Layer.provide(WebCrypto)))

const a = await runtime.runPromise(UserId.generate)
const b = await runtime.runPromise(UserId.generate)
// ... await runtime.dispose() on shutdown
```

### Standalone `generate`

The **standalone** `generate(prefix)` export has no factory/service, so it
carries `Crypto.Crypto` directly in its requirements channel and you provide a
crypto layer before running it — otherwise the requirement surfaces as a type
error such as `Type Crypto is not assignable to type never`:

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
- `makeTypeId(prefix, options?)`: create a prefix-specific factory whose methods return branded IDs, including its own generator service (`tag` + `layer`).
- `WebCrypto`: a `Crypto.Crypto` layer backed by the Web Crypto API; feed it into a factory `layer` or provide it to the standalone `generate`.
- `TypeIdError`: typed Effect error for validation failures.

Factory members:

- `generate`: effect that creates a new branded UUIDv7 TypeID; requires the factory's generator service (provide `layer`).
- `layer`: `Layer<TypeIdGenerator<Name>, never, Crypto.Crypto>` that builds the generator service.
- `tag`: the Effect service key for the generator.
- `fromUuid(uuid)`: encode a UUID as the branded TypeID.
- `parse(input)`: validate a string and return branded TypeID parts.
- `toUuid(id)`: decode a branded TypeID to its UUID.
- `is(input)`: runtime type guard for the branded TypeID (synchronous).
- `unsafeParse(input)` / `unsafeFromUuid(uuid)`: synchronous variants that throw on invalid input.

## Development

```bash
bun install
bun test
bun run typecheck
```
