import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { requireUser, requireRole } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebaseAdmin";
import type { Role } from "@/lib/types";

function jsonToXlsxBuffer(data: any[], sheetName: string) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return buf;
}

export async function GET(
  req: NextRequest,
  ctx: { params: { entity: string } }
) {
  const user = await requireUser(req);
  const entity = ctx.params.entity;

  const managerRoles: Role[] = ["SystemAdmin", "BranchManager"];
  requireRole(user, managerRoles);

  if (entity === "users") {
    requireRole(user, ["SystemAdmin"]);
  }

  const allowed = new Set([
    "donors",
    "donor_status_history",
    "donor_deferrals",
    "bookings",
    "attendance",
    "users",
  ]);

  if (!allowed.has(entity)) {
    return new Response("Unknown export entity", { status: 400 });
  }

  const snap = await adminDb.collection(entity).get();
  const rows: any[] = [];
  snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));

  const buf = jsonToXlsxBuffer(rows, entity);

  // ⭐ السطر المهم
  const body = new Uint8Array(buf);

  return new Response(body, {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${entity}.xlsx"`,
    },
  });
}
