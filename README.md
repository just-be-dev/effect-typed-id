# effect-id

Effect TypeScript implementation of the [TypeID spec](https://github.com/jetify-com/typeid/tree/main/spec).

TypeIDs are type-safe UUIDv7 identifiers encoded as strict lowercase base32 with an optional lowercase snake_case prefix, for example `user_01h455vb4pex5vsknk084sn02q`.

## Usage

```ts
import { Effect } from "effect"
import { makeTypeId, type TypeIdFrom } from "effect-id"

const UserId = makeTypeId("user", { brand: "UserId" })
type UserId = TypeIdFrom<typeof UserId>

const program = Effect.gen(function* () {
  const id: UserId = yield* UserId.generate
  const uuid = yield* UserId.toUuid(id)

  return { id, uuid }
})
```

## API

- `generate(prefix?)`: create a UUIDv7 TypeID.
- `parse(typeid)`: validate and decode a TypeID into `{ prefix, suffix, uuid, typeid }`.
- `fromUuid(prefix, uuid)`: encode a canonical UUID string as a TypeID.
- `encodeUuid(uuid)`: encode a UUID as a 26-character TypeID suffix.
- `decodeUuid(suffix)`: decode a TypeID suffix to a canonical UUID string.
- `makeTypeId(prefix, options?)`: create a prefix-specific factory whose methods return branded IDs.
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
