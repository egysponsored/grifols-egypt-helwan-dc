import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const qr = await QRCode.toDataURL(text, { margin: 1, scale: 8 });
  return NextResponse.json({ qr });
}
