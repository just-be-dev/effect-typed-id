import { Brand, Context, Crypto, Effect, Layer, PlatformError, Schema } from "effect"

const alphabet = "0123456789abcdefghjkmnpqrstvwxyz" as const
const suffixLength = 26
const uuidByteLength = 16
const prefixRegex = /^([a-z]([a-z_]{0,61}[a-z])?)?$/
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const alphabetValues = new Map<string, number>(
  Array.from(alphabet, (character, index) => [character, index]),
)

export const Prefix = Schema.String.pipe(Schema.brand("TypeIdPrefix"))
export type Prefix = typeof Prefix.Type

export const Suffix = Schema.String.pipe(Schema.brand("TypeIdSuffix"))
export type Suffix = typeof Suffix.Type

export const Uuid = Schema.String.pipe(Schema.brand("Uuid"))
export type Uuid = typeof Uuid.Type

export const TypeId = Schema.String.pipe(Schema.brand("TypeId"))
export type TypeId = typeof TypeId.Type

export type TypeIdOf<Name extends string> = TypeId & Brand.Brand<Name>

export class TypeIdError extends Schema.TaggedErrorClass<TypeIdError>()(
  "TypeIdError",
  {
    input: Schema.String,
    message: Schema.String,
  },
) {}

export interface TypeIdParts {
  readonly prefix: Prefix
  readonly suffix: Suffix
  readonly uuid: Uuid
  readonly typeid: TypeId
}

export interface TypeIdPartsOf<Name extends string> extends Omit<TypeIdParts, "typeid"> {
  readonly typeid: TypeIdOf<Name>
}

/**
 * The shape of a prefix-specific TypeID service.
 *
 * Each `makeTypeId` factory defines its own service whose only member is the
 * crypto-dependent `generate` effect. Resolving the service (via the factory's
 * `layer`) provides a `generate` whose `Crypto.Crypto` requirement has already
 * been discharged.
 */
export interface TypeIdGenerator<Name extends string> {
  readonly generate: Effect.Effect<
    TypeIdOf<Name>,
    TypeIdError | PlatformError.PlatformError
  >
}

export interface TypeIdFactory<Name extends string> {
  readonly brand: Name
  readonly prefix: Prefix
  /**
   * The Effect service key for this factory's generator. Yield it to obtain the
   * resolved `generate` effect once the `layer` has been provided.
   */
  readonly tag: Context.Service<TypeIdGenerator<Name>, TypeIdGenerator<Name>>
  /**
   * A layer that builds the generator service from `Crypto.Crypto`. Provide it
   * once at the edge of your program; the `Crypto.Crypto` dependency flows
   * through the layer graph and is resolved a single time.
   */
  readonly layer: Layer.Layer<TypeIdGenerator<Name>, never, Crypto.Crypto>
  /**
   * Generate a new branded TypeID. Requires this factory's generator service in
   * the requirements channel; provide `layer` (plus a `Crypto.Crypto` layer such
   * as `WebCrypto`) to run it.
   */
  readonly generate: Effect.Effect<
    TypeIdOf<Name>,
    TypeIdError | PlatformError.PlatformError,
    TypeIdGenerator<Name>
  >
  readonly fromUuid: (uuid: string) => Effect.Effect<TypeIdOf<Name>, TypeIdError>
  readonly parse: (input: string) => Effect.Effect<TypeIdPartsOf<Name>, TypeIdError>
  readonly toUuid: (id: TypeIdOf<Name>) => Effect.Effect<Uuid, TypeIdError>
  readonly is: (input: string) => input is TypeIdOf<Name>
  readonly unsafeParse: (input: string) => TypeIdPartsOf<Name>
  readonly unsafeFromUuid: (uuid: string) => TypeIdOf<Name>
}

export type TypeIdFrom<Factory> = Factory extends TypeIdFactory<infer Name>
  ? TypeIdOf<Name>
  : never

const fail = (input: string, message: string) =>
  Effect.fail(new TypeIdError({ input, message }))

const validatePrefix = (prefix: string) => {
  if (!prefixRegex.test(prefix)) {
    return fail(
      prefix,
      "Prefix must be empty or match ^([a-z]([a-z_]{0,61}[a-z])?)?$",
    )
  }

  return Effect.succeed(Prefix.make(prefix))
}

const validateSuffix = (suffix: string) => {
  if (suffix.length !== suffixLength) {
    return fail(suffix, "Suffix must be exactly 26 characters")
  }

  const first = suffix[0]
  if (first === undefined || first > "7") {
    return fail(suffix, "Suffix must not exceed the 128-bit UUID range")
  }

  for (const character of suffix) {
    if (!alphabetValues.has(character)) {
      return fail(suffix, "Suffix must use the TypeID base32 alphabet")
    }
  }

  return Effect.succeed(Suffix.make(suffix))
}

const validateUuid = (uuid: string) => {
  if (!uuidRegex.test(uuid)) {
    return fail(uuid, "UUID must be a canonical 36-character UUID string")
  }

  return Effect.succeed(Uuid.make(uuid.toLowerCase()))
}

const bytesToUuid = (bytes: Uint8Array): Uuid => {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return Uuid.make(
    `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`,
  )
}

const uuidToBytes = (uuid: Uuid): Uint8Array => {
  const hex = uuid.replaceAll("-", "")
  const bytes = new Uint8Array(uuidByteLength)

  for (let index = 0; index < uuidByteLength; index++) {
    const pair = hex.slice(index * 2, index * 2 + 2)
    bytes[index] = Number.parseInt(pair, 16)
  }

  return bytes
}

const encodeBytes = (bytes: Uint8Array): Suffix => {
  let value = 0n
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte)
  }

  let suffix = ""
  for (let index = 0; index < suffixLength; index++) {
    const alphabetIndex = Number(value & 31n)
    suffix = alphabet[alphabetIndex] + suffix
    value >>= 5n
  }

  return Suffix.make(suffix)
}

const decodeSuffixToBytes = (suffix: Suffix): Uint8Array => {
  let value = 0n
  for (const character of suffix) {
    value = (value << 5n) | BigInt(alphabetValues.get(character)!)
  }

  const bytes = new Uint8Array(uuidByteLength)
  for (let index = uuidByteLength - 1; index >= 0; index--) {
    bytes[index] = Number(value & 255n)
    value >>= 8n
  }

  return bytes
}

const format = (prefix: Prefix, suffix: Suffix): TypeId =>
  TypeId.make(prefix.length === 0 ? suffix : `${prefix}_${suffix}`)

export const encodeUuid = Effect.fn("TypeId.encodeUuid")(function* (
  uuid: string,
) {
  const validUuid = yield* validateUuid(uuid)
  return encodeBytes(uuidToBytes(validUuid))
})

export const decodeUuid = Effect.fn("TypeId.decodeUuid")(function* (
  suffix: string,
) {
  const validSuffix = yield* validateSuffix(suffix)
  return bytesToUuid(decodeSuffixToBytes(validSuffix))
})

export const fromUuid = Effect.fn("TypeId.fromUuid")(function* (
  prefix: string,
  uuid: string,
) {
  const validPrefix = yield* validatePrefix(prefix)
  const suffix = yield* encodeUuid(uuid)
  return format(validPrefix, suffix)
})

export const parse = Effect.fn("TypeId.parse")(function* (input: string) {
  if (input.length < suffixLength || input.length > 90) {
    return yield* fail(input, "TypeID must be between 26 and 90 characters")
  }

  const separatorIndex = input.lastIndexOf("_")
  const prefix = separatorIndex === -1 ? "" : input.slice(0, separatorIndex)
  const suffix = separatorIndex === -1 ? input : input.slice(separatorIndex + 1)

  const validPrefix = yield* validatePrefix(prefix)
  const validSuffix = yield* validateSuffix(suffix)
  const uuid = bytesToUuid(decodeSuffixToBytes(validSuffix))
  const typeid = format(validPrefix, validSuffix)

  if (typeid !== input) {
    return yield* fail(input, "TypeID is not in canonical form")
  }

  return { prefix: validPrefix, suffix: validSuffix, uuid, typeid } satisfies TypeIdParts
})

export const make = (prefix: string, uuid: string) => fromUuid(prefix, uuid)

export const generate = Effect.fn("TypeId.generate")(function* (prefix: string) {
  const validPrefix = yield* validatePrefix(prefix)
  const crypto = yield* Crypto.Crypto
  const uuid = yield* crypto.randomUUIDv7.pipe(Effect.flatMap(validateUuid))
  const suffix = encodeBytes(uuidToBytes(uuid))
  return format(validPrefix, suffix)
})

const webCryptoDigest = (
  algorithm: Crypto.DigestAlgorithm,
  data: Uint8Array,
): Effect.Effect<Uint8Array, PlatformError.PlatformError> =>
  Effect.tryPromise({
    try: () =>
      globalThis.crypto.subtle
        .digest(algorithm, data as BufferSource)
        .then((buffer) => new Uint8Array(buffer)),
    catch: (cause) =>
      PlatformError.systemError({
        _tag: "Unknown",
        module: "Crypto",
        method: "digest",
        description: "Could not compute digest",
        cause,
      }),
  })

/**
 * A `Crypto.Crypto` layer backed by the standard Web Crypto API
 * (`globalThis.crypto`).
 *
 * Provide it to satisfy the `Crypto.Crypto` requirement of a factory's `layer`
 * (or the standalone `generate` export) on any runtime that exposes Web Crypto,
 * including Bun, Node.js 20+, Deno, browsers, and Cloudflare Workers:
 *
 * ```ts
 * import { Effect } from "effect"
 * import { generate, WebCrypto } from "@just-be/effect-typed-id"
 *
 * const id = await Effect.runPromise(
 *   generate("user").pipe(Effect.provide(WebCrypto)),
 * )
 * ```
 */
export const WebCrypto: Layer.Layer<Crypto.Crypto> = Layer.succeed(
  Crypto.Crypto,
  Crypto.make({
    randomBytes: (size) =>
      globalThis.crypto.getRandomValues(new Uint8Array(size)),
    digest: webCryptoDigest,
  }),
)

export const makeTypeId = <
  const PrefixName extends string,
  const BrandName extends string = PrefixName,
>(
  prefix: PrefixName,
  options?: { readonly brand?: BrandName },
): TypeIdFactory<BrandName> => {
  const validPrefix = Effect.runSync(validatePrefix(prefix))
  const brand = (options?.brand ?? prefix) as BrandName
  const brandTypeId = (typeid: TypeId): TypeIdOf<BrandName> =>
    typeid as TypeIdOf<BrandName>

  const parseForPrefix = Effect.fn(`TypeId.${brand}.parse`)(function* (
    input: string,
  ) {
    const parts = yield* parse(input)

    if (parts.prefix !== validPrefix) {
      return yield* fail(
        input,
        `TypeID prefix must be ${JSON.stringify(validPrefix)}`,
      )
    }

    return {
      ...parts,
      typeid: brandTypeId(parts.typeid),
    } satisfies TypeIdPartsOf<BrandName>
  })

  const fromUuidForPrefix = Effect.fn(`TypeId.${brand}.fromUuid`)(function* (
    uuid: string,
  ) {
    const id = yield* fromUuid(validPrefix, uuid)
    return brandTypeId(id)
  })

  // A distinct Effect service per brand. The runtime identity is the key
  // string; the type identity is `TypeIdGenerator<BrandName>`, which embeds the
  // brand so different factories resolve to different services.
  const tag = Context.Service<TypeIdGenerator<BrandName>>(
    `@just-be/effect-typed-id/${brand}`,
  )

  // The layer acquires Crypto.Crypto once and closes over it, so the resolved
  // `generate` no longer carries the dependency.
  const layer: Layer.Layer<TypeIdGenerator<BrandName>, never, Crypto.Crypto> =
    Layer.effect(
      tag,
      Effect.gen(function* () {
        const crypto = yield* Crypto.Crypto
        const generate = Effect.fn(`TypeId.${brand}.generate`)(function* () {
          const uuid = yield* crypto.randomUUIDv7.pipe(
            Effect.flatMap(validateUuid),
          )
          const suffix = encodeBytes(uuidToBytes(uuid))
          return brandTypeId(format(validPrefix, suffix))
        })
        return { generate: generate() }
      }),
    )

  return {
    brand,
    prefix: validPrefix,
    tag,
    layer,
    generate: Effect.flatMap(tag, (service) => service.generate),
    fromUuid: fromUuidForPrefix,
    parse: parseForPrefix,
    toUuid: (id) => parseForPrefix(id).pipe(Effect.map((parts) => parts.uuid)),
    is: (input): input is TypeIdOf<BrandName> => {
      try {
        Effect.runSync(parseForPrefix(input))
        return true
      } catch {
        return false
      }
    },
    unsafeParse: (input) => Effect.runSync(parseForPrefix(input)),
    unsafeFromUuid: (uuid) => Effect.runSync(fromUuidForPrefix(uuid)),
  }
}

export const unsafeParse = (input: string): TypeIdParts => Effect.runSync(parse(input))
export const unsafeFromUuid = (prefix: string, uuid: string): TypeId =>
  Effect.runSync(fromUuid(prefix, uuid))
