/**
 * Optional: set custom claims for a user.
 * Usage:
 *   npm run set-claims -- <uid> <SystemAdmin|BranchManager|AwarenessEmployee>
 */
import { initAdmin } from "./_admin.js";

const { auth } = initAdmin();
const [,, uid, role] = process.argv;

if (!uid || !role) {
  console.log("Usage: npm run set-claims -- <uid> <role>");
  process.exit(1);
}

async function main() {
  await auth.setCustomUserClaims(uid, { role });
  console.log("Claims set:", uid, role);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
