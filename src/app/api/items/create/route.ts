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
    
    // Payload ini harus sama persis dengan yang Anda definisikan di `input_mappings` -> `target: body` di workflow.yaml 001
    const { sku, name, description, basePrice, uom } = body;

    // 3. Tulis data ke tabel utama Item di Database Next.js
    const newItem = await prisma.item.create({
      data: {
        sku: sku,
        name: name,
        description: description,
        basePrice: basePrice,
        uom: uom,
      },
    });

    // Cari ID request terkait di ApprovalRequest dan ubah statusnya jadi APPROVED
    await prisma.approvalRequest.updateMany({ where: { payload: { path: ['sku'], equals: sku } }, data: { status: 'APPROVED' } });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error("VFlow Callback Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}