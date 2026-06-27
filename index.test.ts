import { describe, expect, test } from "bun:test"
import { Crypto, Effect, Layer } from "effect"
import {
  decodeUuid,
  encodeUuid,
  fromUuid,
  generate,
  makeTypeId,
  parse,
  type TypeIdFrom,
} from "./index"

const TestCrypto = Layer.succeed(
  Crypto.Crypto,
  Crypto.make({
    randomBytes: (size) => new Uint8Array(size).fill(1),
    digest: (_algorithm, data) => Effect.succeed(data),
  }),
)

const validCases = [
  {
    name: "nil",
    typeid: "00000000000000000000000000",
    prefix: "",
    uuid: "00000000-0000-0000-0000-000000000000",
  },
  {
    name: "one",
    typeid: "00000000000000000000000001",
    prefix: "",
    uuid: "00000000-0000-0000-0000-000000000001",
  },
  {
    name: "ten",
    typeid: "0000000000000000000000000a",
    prefix: "",
    uuid: "00000000-0000-0000-0000-00000000000a",
  },
  {
    name: "sixteen",
    typeid: "0000000000000000000000000g",
    prefix: "",
    uuid: "00000000-0000-0000-0000-000000000010",
  },
  {
    name: "thirty-two",
    typeid: "00000000000000000000000010",
    prefix: "",
    uuid: "00000000-0000-0000-0000-000000000020",
  },
  {
    name: "max-valid",
    typeid: "7zzzzzzzzzzzzzzzzzzzzzzzzz",
    prefix: "",
    uuid: "ffffffff-ffff-ffff-ffff-ffffffffffff",
  },
  {
    name: "valid-alphabet",
    typeid: "prefix_0123456789abcdefghjkmnpqrs",
    prefix: "prefix",
    uuid: "0110c853-1d09-52d8-d73e-1194e95b5f19",
  },
  {
    name: "valid-uuidv7",
    typeid: "prefix_01h455vb4pex5vsknk084sn02q",
    prefix: "prefix",
    uuid: "01890a5d-ac96-774b-bcce-b302099a8057",
  },
  {
    name: "prefix-underscore",
    typeid: "pre_fix_00000000000000000000000000",
    prefix: "pre_fix",
    uuid: "00000000-0000-0000-0000-000000000000",
  },
]

const invalidTypeIds = [
  "PREFIX_00000000000000000000000000",
  "12345_00000000000000000000000000",
  "pre.fix_00000000000000000000000000",
  "préfix_00000000000000000000000000",
  "  prefix_00000000000000000000000000",
  "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijkl_00000000000000000000000000",
  "_00000000000000000000000000",
  "_",
  "prefix_1234567890123456789012345",
  "prefix_123456789012345678901234567",
  "prefix_1234567890123456789012345 ",
  "prefix_0123456789ABCDEFGHJKMNPQRS",
  "prefix_123456789-123456789-123456",
  "prefix_ooooooiiiiiiuuuuuuulllllll",
  "prefix_i23456789ol23456789oi23456",
  "prefix_123456789-0123456789-0123456",
  "prefix_8zzzzzzzzzzzzzzzzzzzzzzzzz",
  "_prefix_00000000000000000000000000",
  "prefix__00000000000000000000000000",
  "",
  "prefix_",
]

describe("TypeID spec", () => {
  for (const example of validCases) {
    test(`parses ${example.name}`, () => {
      const parts = Effect.runSync(parse(example.typeid))
      expect(String(parts.typeid)).toBe(example.typeid)
      expect(String(parts.prefix)).toBe(example.prefix)
      expect(String(parts.uuid)).toBe(example.uuid)
    })

    test(`encodes ${example.name}`, () => {
      expect(String(Effect.runSync(fromUuid(example.prefix, example.uuid)))).toBe(
        example.typeid,
      )
    })

    test(`converts uuid suffix ${example.name}`, () => {
      const suffix = example.typeid.slice(example.typeid.length - 26)
      expect(String(Effect.runSync(encodeUuid(example.uuid)))).toBe(suffix)
      expect(String(Effect.runSync(decodeUuid(suffix)))).toBe(example.uuid)
    })
  }

  for (const typeid of invalidTypeIds) {
    test(`rejects ${JSON.stringify(typeid)}`, () => {
      expect(() => Effect.runSync(parse(typeid))).toThrow()
    })
  }

  test("generates UUIDv7 TypeIDs", () => {
    const typeid = Effect.runSync(generate("user").pipe(Effect.provide(TestCrypto)))
    const parts = Effect.runSync(parse(typeid))

    expect(String(parts.prefix)).toBe("user")
    const uuid = String(parts.uuid)
    expect(uuid[14]).toBe("7")
    expect(["8", "9", "a", "b"]).toContain(uuid[19]!)
    expect(uuid.slice(14)).toBe("7101-8101-010101010101")
  })

  test("generates TypeIDs with default Web Crypto", async () => {
    const UserId = makeTypeId("user", { brand: "UserId" })
    type UserId = TypeIdFrom<typeof UserId>

    const program = Effect.gen(function* () {
      const id: UserId = yield* UserId.generate
      const uuid = yield* UserId.toUuid(id)

      return { id, uuid }
    })

    const result = await Effect.runPromise(program)

    expect(UserId.is(result.id)).toBe(true)
    expect(String(result.uuid)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  test("creates prefix-specific branded factories", () => {
    const UserId = makeTypeId("user", { brand: "UserId" })
    type UserId = TypeIdFrom<typeof UserId>

    const fromUuidId: UserId = Effect.runSync(
      UserId.fromUuid("01890a5d-ac96-774b-bcce-b302099a8057"),
    )
    expect(String(fromUuidId)).toBe("user_01h455vb4pex5vsknk084sn02q")

    const generatedId: UserId = Effect.runSync(
      UserId.generate.pipe(Effect.provide(TestCrypto)),
    )
    const generatedParts = Effect.runSync(UserId.parse(generatedId))
    expect(String(generatedParts.prefix)).toBe("user")

    expect(String(Effect.runSync(UserId.toUuid(fromUuidId)))).toBe(
      "01890a5d-ac96-774b-bcce-b302099a8057",
    )
    expect(UserId.is("user_01h455vb4pex5vsknk084sn02q")).toBe(true)
    expect(UserId.is("account_01h455vb4pex5vsknk084sn02q")).toBe(false)
  })

  test("defaults factory brand names from prefixes", () => {
    const UserId = makeTypeId("user")
    type UserId = TypeIdFrom<typeof UserId>

    const TeamMemberId = makeTypeId("team_member")
    type TeamMemberId = TypeIdFrom<typeof TeamMemberId>

    const userId: UserId = Effect.runSync(
      UserId.fromUuid("01890a5d-ac96-774b-bcce-b302099a8057"),
    )
    const teamMemberId: TeamMemberId = Effect.runSync(
      TeamMemberId.fromUuid("01890a5d-ac96-774b-bcce-b302099a8057"),
    )

    expect(UserId.brand).toBe("UserId")
    expect(TeamMemberId.brand).toBe("TeamMemberId")
    expect(String(userId)).toBe("user_01h455vb4pex5vsknk084sn02q")
    expect(String(teamMemberId)).toBe(
      "team_member_01h455vb4pex5vsknk084sn02q",
    )
  })
})
