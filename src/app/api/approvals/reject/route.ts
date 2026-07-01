import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApprovalStatus, EntityType, PartnerStatus } from "@/generated/prisma/client";
import { rejectInventoryTransaction } from "@/server/inventory-transactions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, notes } = body;

    // 1. Ubah status request di tabel transisi menjadi REJECTED
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId }, // <--- requestId berasal dari parameter body yang dikirim UI
    });

    if (!request || request.status !== ApprovalStatus.PENDING) {
      return NextResponse.json({ success: false, message: "Request tidak valid." }, { status: 400 });
    }

    const updatedRequest = await prisma.approvalRequest.update({
      where: { id: requestId },
      data: { status: ApprovalStatus.REJECTED },
    });

    // 2. Teruskan penolakan ke VFlow Webhook sesuai tipe request
    let vflowEndpoint = "";
    const payload: any = request.payload || {};
    let vflowPayload: any = { requestId: request.id, is_manual_approval: true, decision: "REJECTED", reason: notes };

    switch (request.type) {
      case "NEW_ITEM":
        vflowEndpoint = "/webhook/kelompok2/inventory/item/create";
        vflowPayload = {
          ...vflowPayload,
          item_name: payload.item_name ?? payload.name,
          item_sku: payload.item_sku ?? payload.sku,
          item_price: payload.item_price ?? payload.price,
          item_uom: payload.item_uom ?? payload.uom
        };
        break;
      case "NEW_VENDOR":
        vflowEndpoint = "/webhook/kelompok2/inventory/vendor/register";
        vflowPayload = {
          ...vflowPayload,
          vendor_name: payload.vendor_name ?? payload.name,
          vendor_contact: payload.vendor_contact ?? payload.contact,
          vendor_status: "NEW"
        };
        const vNameReject = payload.vendor_name ?? payload.name;
        if (vNameReject) {
          const existing = await prisma.partner.findFirst({ where: { name: vNameReject, type: EntityType.VENDOR } });
          if (existing) {
            await prisma.partner.update({ where: { id: existing.id }, data: { status: PartnerStatus.SUSPENDED } });
          }
        }
        break;
      case "STOCK_IN":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-in";
        await rejectInventoryTransaction(payload.transactionId ?? request.id);
        vflowPayload = {
          ...vflowPayload,
          transactionId: payload.transactionId ?? request.id,
          expected_qty: payload.expected_qty ?? payload.expectedQty,
          received_qty: payload.received_qty ?? payload.receivedQty
        };
        break;
      case "STOCK_OUT":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-out";
        await rejectInventoryTransaction(payload.transactionId ?? request.id);
        vflowPayload = {
          ...vflowPayload,
          transactionId: payload.transactionId ?? request.id,
          current_stock: payload.current_stock ?? payload.currentStock,
          requested_qty: payload.requested_qty ?? payload.requestedQty
        };
        break;
      case "STOCK_OPNAME":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-opname";
        vflowPayload = {
          ...vflowPayload,
          system_stock: payload.system_stock ?? payload.systemStock,
          physical_stock: payload.physical_stock ?? payload.physicalStock
        };
        break;
    }

    if (vflowEndpoint && process.env.VFLOW_BASE_URL) {
      const vflowUrl = `${process.env.VFLOW_BASE_URL}${vflowEndpoint}`;
      try {
        await fetch(vflowUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vflowPayload),
        });
        console.log(`[Next.js] Berhasil memicu VFlow webhook untuk manual reject: ${vflowEndpoint}`);
      } catch (vflowError) {
        console.error(`[Next.js] Gagal menghubungi VFlow Webhook API:`, vflowError);
      }
    }

    return NextResponse.json(
      { success: true, message: "Request berhasil ditolak.", data: updatedRequest },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error rejecting request:", error);
    return NextResponse.json({ success: false, message: "Gagal menolak request." }, { status: 500 });
  }
}
