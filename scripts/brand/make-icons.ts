/**
 * `npm run brand:icons`: writes every file the Lantern is drawn into. The
 * work lives in src/lib/brand/generate.ts, where it is type-checked and
 * linted; src/lib/brand/mark.test.ts fails when a committed file drifts.
 */
import { writeBrandFiles } from '@/lib/brand/generate'

writeBrandFiles().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
