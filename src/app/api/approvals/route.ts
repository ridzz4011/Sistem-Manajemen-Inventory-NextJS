import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApprovalStatus, ApprovalType } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as ApprovalStatus) || ApprovalStatus.PENDING;

    const approvals = await prisma.approvalRequest.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: approvals }, { status: 200 });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, requestedBy, payload, notes } = body;

    // 1. Simpan ke database (Tabel Transisi ApprovalRequest)
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: type as ApprovalType,
        requestedBy,
        payload,
        notes,
        status: ApprovalStatus.PENDING,
      },
    });

    // 2. Trigger VFlow API
    // Kita petakan tipe request dengan endpoint webhook/trigger VFlow yang sesuai
    let vflowEndpoint = "";
    let vflowPayload = {};

    switch (type) {
      case "NEW_ITEM":
        vflowEndpoint = `${process.env.VFLOW_BASE_URL}/webhook/kelompok2/inventory/item/create`;
        vflowPayload = { 
          item_name: payload.name, 
          item_sku: payload.sku, 
          item_price: payload.price,
          item_uom: payload.uom 
        };
        break;
      case "NEW_VENDOR":
        vflowEndpoint = `${process.env.VFLOW_BASE_URL}/webhook/kelompok2/inventory/vendor/register`;
        vflowPayload = { 
          vendor_name: payload.name, 
          vendor_contact: payload.contact,
          vendor_status: "NEW" // Sesuai schema vrule vendor
        };
        break;
      case "STOCK_IN":
        vflowEndpoint = `${process.env.VFLOW_BASE_URL}/webhook/kelompok2/inventory/stock-in`;
        vflowPayload = { 
          transactionId: approvalRequest.id,
          expected_qty: payload.expectedQty,
          received_qty: payload.receivedQty 
        };
        break;
      case "STOCK_OUT":
        vflowEndpoint = `${process.env.VFLOW_BASE_URL}/webhook/kelompok2/inventory/stock-out`;
        vflowPayload = {
          transactionId: approvalRequest.id,
          current_stock: payload.currentStock,
          requested_qty: payload.requestedQty
        };
        break;
      case "STOCK_OPNAME":
        vflowEndpoint = `${process.env.VFLOW_BASE_URL}/webhook/kelompok2/inventory/stock-opname`;
        vflowPayload = {
          system_stock: payload.systemStock,
          physical_stock: payload.physicalStock
        };
        break;
    }

    if (vflowEndpoint) {
      const vflowUrl = `${process.env.VFLOW_BASE_URL}${vflowEndpoint}`;
      await fetch(vflowUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vflowPayload),
      });
    }

    return NextResponse.json(
      { success: true, message: "Request berhasil dikirim untuk direview.", data: approvalRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating approval request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}