import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { ApprovalStatus, ApprovalType, EntityType, PartnerStatus } from "@/generated/prisma/client";

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
    let approvalPayload = payload;

    if (type === "NEW_VENDOR") {
      const vendorName = payload.vendor_name ?? payload.name;
      if (vendorName) {
        const vendorData = {
          name: vendorName,
          contactPerson: payload.vendor_contactPerson ?? payload.contactPerson ?? "-",
          phone: payload.vendor_phone ?? payload.phone ?? payload.vendor_contact ?? "-",
          email: payload.vendor_email ?? payload.email ?? "-",
          address: payload.vendor_address ?? payload.address ?? "-",
          category: payload.vendor_category ?? payload.category ?? "Umum",
          products: payload.vendor_products ?? payload.products ?? "-",
          rating: Number(payload.vendor_rating ?? payload.rating ?? 0),
          status: PartnerStatus.PENDING,
          joinedDate: "-",
          type: EntityType.VENDOR,
        };

        const existing = await prisma.partner.findFirst({
          where: { name: vendorName, type: EntityType.VENDOR },
        });

        const partner = existing
          ? await prisma.partner.update({
              where: { id: existing.id },
              data: vendorData,
            })
          : await prisma.partner.create({
              data: vendorData,
            });

        approvalPayload = {
          ...payload,
          partnerId: partner.id,
        };
      }
    }

    // 1. Simpan ke database (Tabel Transisi ApprovalRequest)
    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: type as ApprovalType,
        requestedBy,
        payload: approvalPayload,
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
        vflowEndpoint = "/webhook/kelompok2/inventory/item/create";
        vflowPayload = {
          requestId: approvalRequest.id,
          type: "NEW_ITEM",
          item_name: payload.item_name ?? payload.name,
          item_sku: payload.item_sku ?? payload.sku,
          item_price: payload.item_price ?? payload.price,
          item_uom: payload.item_uom ?? payload.uom
        };
        break;
      case "NEW_VENDOR":
        vflowEndpoint = "/webhook/kelompok2/inventory/vendor/register";
        vflowPayload = {
          requestId: approvalRequest.id,
          type: "NEW_VENDOR",
          partnerId: approvalPayload.partnerId,
          vendor_name: approvalPayload.vendor_name ?? approvalPayload.name,
          vendor_contactPerson: approvalPayload.vendor_contactPerson ?? approvalPayload.contactPerson,
          vendor_contact: approvalPayload.vendor_contact ?? approvalPayload.contact,
          vendor_phone: approvalPayload.vendor_phone ?? approvalPayload.phone,
          vendor_email: approvalPayload.vendor_email ?? approvalPayload.email,
          vendor_address: approvalPayload.vendor_address ?? approvalPayload.address,
          vendor_category: approvalPayload.vendor_category ?? approvalPayload.category,
          vendor_products: approvalPayload.vendor_products ?? approvalPayload.products,
          vendor_rating: approvalPayload.vendor_rating ?? approvalPayload.rating,
          vendor_status: approvalPayload.vendor_status ?? approvalPayload.status ?? "NEW"
        };
        break;
      case "STOCK_IN":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-in";
        vflowPayload = {
          requestId: approvalRequest.id,
          transactionId: approvalRequest.id,
          expected_qty: payload.expected_qty ?? payload.expectedQty,
          received_qty: payload.received_qty ?? payload.receivedQty
        };
        break;
      case "STOCK_OUT":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-out";
        vflowPayload = {
          requestId: approvalRequest.id,
          transactionId: approvalRequest.id,
          current_stock: payload.current_stock ?? payload.currentStock,
          requested_qty: payload.requested_qty ?? payload.requestedQty
        };
        break;
      case "STOCK_OPNAME":
        vflowEndpoint = "/webhook/kelompok2/inventory/stock-opname";
        vflowPayload = {
          requestId: approvalRequest.id,
          system_stock: payload.system_stock ?? payload.systemStock,
          physical_stock: payload.physical_stock ?? payload.physicalStock
        };
        break;
    }

    if (vflowEndpoint) {
      const vflowUrl = `${process.env.VFLOW_BASE_URL}${vflowEndpoint}`;
      const res = await fetch(vflowUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vflowPayload),
      });
      const responseText = await res.text();
      console.log("[Next.js] VFlow webhook response", {
        endpoint: vflowEndpoint,
        status: res.status,
        ok: res.ok,
        body: responseText,
      });

      try {
        const resData = responseText ? JSON.parse(responseText) : null;
        if (resData && resData.status === "rejected") {
          await prisma.approvalRequest.update({
            where: { id: approvalRequest.id },
            data: { status: ApprovalStatus.REJECTED, notes: resData.reason || "Ditolak otomatis oleh sistem (Blacklist Vendor)" },
          });
          approvalRequest.status = "REJECTED";

          const vName = approvalPayload.vendor_name ?? approvalPayload.name;
          if (vName) {
            const existing = await prisma.partner.findFirst({ where: { name: vName, type: EntityType.VENDOR } });
            if (existing) {
              await prisma.partner.update({ where: { id: existing.id }, data: { status: PartnerStatus.SUSPENDED } });
            }
          }
        }
      } catch (e) {
        // Abaikan error parsing JSON jika response kosong
        console.warn("[Next.js] VFlow webhook returned non-JSON/empty response", {
          endpoint: vflowEndpoint,
          status: res.status,
        });
      }
    }

    return NextResponse.json(
      { success: true, message: approvalRequest.status === "REJECTED" ? "Vendor ditolak otomatis karena status Blacklist." : "Request berhasil dikirim untuk direview.", data: approvalRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating approval request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
