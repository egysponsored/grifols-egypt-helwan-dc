/**
 * Seed Deferral Reasons into Firestore.
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON env var.
 */
import { initAdmin } from "./_admin.js";

const { db } = initAdmin();

const reasons = [
  { code: "D01", title: "Low hemoglobin / hematocrit", isActive: true },
  { code: "D02", title: "High blood pressure", isActive: true },
  { code: "D03", title: "High temperature / fever", isActive: true },
  { code: "D04", title: "Low weight", isActive: true },
  { code: "D05", title: "Recent medication", isActive: true },
  { code: "D06", title: "Not eligible today", isActive: true },
];

async function main() {
  console.log("Seeding deferral_reasons...");
  for (const r of reasons) {
    await db.collection("deferral_reasons").doc(r.code).set(r, { merge: true });
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
