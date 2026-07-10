/**
 * Push-token repo smoke against a real Postgres (PUSH-M1).
 * Run: DATABASE_URL=postgresql://postgres:omnisx@localhost:5433/omnisx \
 *      npx tsx scripts/smoke-push-tokens.ts
 */
import {
  deletePushTokens,
  listPushTokensForUsers,
  registerPushToken,
  unregisterPushToken,
} from '../src/lib/db/repositories/push-tokens-repo'

let passed = 0
let failed = 0

function check(name: string, cond: boolean) {
  if (cond) {
    passed += 1
    console.log(`  ok   ${name}`)
  } else {
    failed += 1
    console.log(`  FAIL ${name}`)
  }
}

async function main() {
  const userA = 'auth0|smoke-push-a'
  const userB = 'auth0|smoke-push-b'
  const token1 = 'ExponentPushToken[smoke-1]'
  const token2 = 'ExponentPushToken[smoke-2]'

  await deletePushTokens([token1, token2])

  await registerPushToken(userA, token1, 'ios')
  await registerPushToken(userA, token2, 'android')
  let rows = await listPushTokensForUsers([userA])
  check('register: two tokens for A', rows.length === 2)

  // Idempotent re-register keeps one row
  await registerPushToken(userA, token1, 'ios')
  rows = await listPushTokensForUsers([userA])
  check('upsert: re-register does not duplicate', rows.length === 2)

  // Device changes account: token re-homes to B
  await registerPushToken(userB, token1, 'ios')
  const aRows = await listPushTokensForUsers([userA])
  const bRows = await listPushTokensForUsers([userB])
  check('re-home: A lost the token', aRows.length === 1)
  check('re-home: B owns the token', bRows.length === 1 && bRows[0].expo_push_token === token1)

  // Tenant guard: A cannot unregister B's token
  const crossDelete = await unregisterPushToken(userA, token1)
  check('tenant guard: cross-user unregister returns false', crossDelete === false)
  check('tenant guard: token survives', (await listPushTokensForUsers([userB])).length === 1)

  // Owner unregister works
  check('owner unregister true', (await unregisterPushToken(userB, token1)) === true)

  // Dead-token pruning
  await deletePushTokens([token2])
  check('prune removes remaining', (await listPushTokensForUsers([userA, userB])).length === 0)

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
