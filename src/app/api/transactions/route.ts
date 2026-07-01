import { NextResponse } from "next/server";
import { createPendingInventoryTransaction } from "@/server/inventory-transactions";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const data = await prisma.transaction.findMany({
    include: {
      details: true,
      workflowTasks: true,
      auditLogs: true,
    },
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const type = body.type === "STOCK_OUT" ? "STOCK_OUT" : "STOCK_IN";

    const result = await createPendingInventoryTransaction({
      type,
      referenceNo: body.referenceNo,
      partnerId: body.partnerId,
      locationId: body.locationId,
      notes: body.notes,
      requestedBy: body.requestedBy,
      items: Array.isArray(body.items) ? body.items : [],
    });

    const vflowEndpoint =
      type === "STOCK_IN" ? "/webhook/kelompok2/inventory/stock-in" : "/webhook/kelompok2/inventory/stock-out";

    if (process.env.VFLOW_BASE_URL) {
      const firstDetail = result.transaction.details[0];
      const currentStock = firstDetail
        ? await prisma.inventoryBalance.findUnique({
            where: { itemId_locationId: { itemId: firstDetail.itemId, locationId: firstDetail.locationId } },
          })
        : null;

      const vflowPayload =
        type === "STOCK_IN"
          ? {
              requestId: result.approval.id,
              transactionId: result.transaction.id,
              expected_qty: firstDetail?.quantity ?? 0,
              received_qty: firstDetail?.quantity ?? 0,
            }
          : {
              requestId: result.approval.id,
              transactionId: result.transaction.id,
              current_stock: currentStock?.quantity ?? 0,
              requested_qty: firstDetail?.quantity ?? 0,
            };

      try {
        const response = await fetch(`${process.env.VFLOW_BASE_URL}${vflowEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vflowPayload),
        });
        const responseText = await response.text();
        console.log("[Next.js] VFlow transaction webhook response", {
          endpoint: vflowEndpoint,
          status: response.status,
          ok: response.ok,
          body: responseText,
        });
      } catch (vflowError) {
        console.error("[Next.js] Failed to call VFlow transaction webhook:", vflowError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Transaction submitted for approval.",
        data: {
          transactionId: result.transaction.id,
          referenceNo: result.transaction.referenceNo,
          approvalId: result.approval.id,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating inventory transaction:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
