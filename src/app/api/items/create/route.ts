import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";

export async function POST(req: Request) {
  try {
    // 1. Verifikasi Token dari VFlow (Agar tidak sembarang orang bisa akses)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2. Tangkap Payload dari activity Http VFlow
    const body = await req.json();

    const requestId = body.requestId;
    const sku = body.sku ?? body.item_sku;
    const name = body.name ?? body.item_name;
    const description = body.description ?? body.item_description ?? "Barang disetujui melalui Workflow VFlow";
    const basePrice = body.basePrice ?? body.item_price ?? body.price ?? 0;
    const uom = body.uom ?? body.item_uom ?? "PCS";

    // 3. Tulis data ke tabel utama Item di Database Next.js
    const newItem = await prisma.item.upsert({
      where: { sku: sku },
      update: { name, description, basePrice: Number(basePrice), uom },
      create: {
        sku: sku,
        name: name,
        description: description,
        basePrice: Number(basePrice),
        uom: uom,
      },
    });

    // Cari ID request terkait di ApprovalRequest dan ubah statusnya jadi APPROVED
    if (requestId) {
      await prisma.approvalRequest.updateMany({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });
    } else {
      await prisma.approvalRequest.updateMany({
        where: {
          OR: [
            { payload: { path: ['sku'], equals: sku } },
            { payload: { path: ['item_sku'], equals: sku } },
          ],
        },
        data: { status: 'APPROVED' },
      });
    }

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error("VFlow Callback Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}