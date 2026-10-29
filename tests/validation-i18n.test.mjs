import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  makeAccountDeleteSchema,
  makeLoginSchema,
  makePasswordChangeSchema,
  makeRegisterSchema,
  makeResetConfirmSchema,
  makeResetRequestSchema,
} from '@/lib/validation/auth'
import { makeOrderSchema } from '@/lib/validation/order'

/*
 * Maydon umuman yuborilmasa yoki noto'g'ri turda kelsa ham xato matni
 * TARJIMA QILINGAN bo'lishi kerak. Avval zod o'zining inglizcha
 * matnini berardi ("Invalid input: expected string, received
 * undefined") va u API orqali mijozga qaytardi.
 *
 * Soxta tarjimon kalitni qaytaradi — ya'ni har bir xabar "validation."
 * yoki "errors." bilan boshlanishi kerak. Zod'ning o'z matni bunga mos
 * kelmaydi.
 */
const t = (key) => key
const isOurs = (message) => /^(validation|errors)\./.test(message)

const SCHEMAS = {
  login: makeLoginSchema(t),
  register: makeRegisterSchema(t),
  resetRequest: makeResetRequestSchema(t),
  resetConfirm: makeResetConfirmSchema(t),
  passwordChange: makePasswordChangeSchema(t),
  accountDelete: makeAccountDeleteSchema(t),
  order: makeOrderSchema(t),
}

describe("xato matnlari tarjima qilingan (inglizcha zod matni yo'q)", () => {
  for (const [name, schema] of Object.entries(SCHEMAS)) {
    test(`${name}: bo'sh obyekt`, () => {
      const issues = schema.safeParse({}).error?.issues ?? []
      assert.ok(issues.length > 0, 'xato kutilgandi')
      for (const issue of issues) {
        assert.ok(isOurs(issue.message), `${issue.path.join('.')}: "${issue.message}"`)
      }
    })

    test(`${name}: noto'g'ri turlar`, () => {
      // Har bir maydonga raqam yuboramiz — satr/massiv kutilgan joyda
      const shape = schema.shape ?? schema._def?.schema?.shape ?? {}
      const input = Object.fromEntries(Object.keys(shape).map((key) => [key, 12345]))
      const issues = schema.safeParse(input).error?.issues ?? []
      for (const issue of issues) {
        assert.ok(isOurs(issue.message), `${issue.path.join('.')}: "${issue.message}"`)
      }
    })
  }

  test("buyurtma: savatdagi buzuq element ham tarjima qilinadi", () => {
    const issues =
      SCHEMAS.order.safeParse({
        customerName: 'Aziz',
        customerPhone: '+998901234567',
        address: 'Toshkent sh., Chilonzor 5',
        items: ['buzuq', { quantity: 'x' }],
      }).error?.issues ?? []
    assert.ok(issues.length > 0)
    for (const issue of issues) {
      assert.ok(isOurs(issue.message), `${issue.path.join('.')}: "${issue.message}"`)
    }
  })
})
